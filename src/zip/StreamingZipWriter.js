
export const crc32Table = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c;
  }
  return table;
})();

export function crc32(data) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < data.length; i++) {
    crc = crc32Table[(crc ^ data[i]) & 0xFF] ^ (crc >>> 8);
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

export class StreamingZipWriter {
  constructor(writable) {
    this.writable = writable;
    this.entries = [];
    this.offset = 0n; // BigInt to support > 4 GB
  }

  // Helper: write a 64-bit unsigned integer (little-endian) into a DataView
  static setUint64(view, offset, value) {
    const lo = Number(value & 0xFFFFFFFFn);
    const hi = Number((value >> 32n) & 0xFFFFFFFFn);
    view.setUint32(offset, lo, true);
    view.setUint32(offset + 4, hi, true);
  }

  async addFile(name, data, lastModified) {
    const encoder = new TextEncoder();
    const nameBytes = encoder.encode(name);
    const fileData = data instanceof ArrayBuffer ? new Uint8Array(data) : new Uint8Array(data);
    const fileCrc = crc32(fileData);
    const size = BigInt(fileData.byteLength);

    const d = lastModified || new Date();
    const dosTime = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1);
    const dosDate = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();

    // ZIP64 extra field for local header: tag(2) + size(2) + uncompressed(8) + compressed(8) = 20 bytes
    const localExtra = new ArrayBuffer(20);
    const lev = new DataView(localExtra);
    lev.setUint16(0, 0x0001, true); // ZIP64 extended information tag
    lev.setUint16(2, 16, true);     // size of extra field data (2 x 8 bytes)
    StreamingZipWriter.setUint64(lev, 4, size);  // uncompressed size
    StreamingZipWriter.setUint64(lev, 12, size); // compressed size

    // Local file header: 30 bytes + filename + ZIP64 extra field
    // Version needed: 45 (4.5) for ZIP64
    // Sizes set to 0xFFFFFFFF as sentinel → actual values are in ZIP64 extra field
    const header = new ArrayBuffer(30 + nameBytes.length + localExtra.byteLength);
    const hv = new DataView(header);
    hv.setUint32(0, 0x04034b50, true);              // local file header signature
    hv.setUint16(4, 45, true);                       // version needed: 4.5 (ZIP64)
    hv.setUint16(6, 0x0800, true);                   // general purpose bit flag: UTF-8 filename
    hv.setUint16(8, 0, true);                        // compression: STORE
    hv.setUint16(10, dosTime, true);
    hv.setUint16(12, dosDate, true);
    hv.setUint32(14, fileCrc, true);
    hv.setUint32(18, 0xFFFFFFFF, true);              // compressed size → ZIP64 sentinel
    hv.setUint32(22, 0xFFFFFFFF, true);              // uncompressed size → ZIP64 sentinel
    hv.setUint16(26, nameBytes.length, true);
    hv.setUint16(28, localExtra.byteLength, true);   // extra field length
    new Uint8Array(header).set(nameBytes, 30);
    new Uint8Array(header).set(new Uint8Array(localExtra), 30 + nameBytes.length);

    const entryOffset = this.offset;

    await this.writable.write(new Uint8Array(header));
    this.offset += BigInt(header.byteLength);

    // Write file data in 4MB chunks
    const WRITE_CHUNK = 4 * 1024 * 1024;
    for (let i = 0; i < fileData.byteLength; i += WRITE_CHUNK) {
      const chunk = fileData.subarray(i, Math.min(i + WRITE_CHUNK, fileData.byteLength));
      await this.writable.write(chunk);
    }
    this.offset += size;

    this.entries.push({ name: nameBytes, size, crc: fileCrc, offset: entryOffset, dosTime, dosDate });
  }

  async finalize() {
    const centralDirOffset = this.offset;

    for (const entry of this.entries) {
      // ZIP64 extra field for central directory:
      // tag(2) + size(2) + uncompressed(8) + compressed(8) + localHeaderOffset(8) = 28 bytes
      const cdExtra = new ArrayBuffer(28);
      const cev = new DataView(cdExtra);
      cev.setUint16(0, 0x0001, true); // ZIP64 extended information tag
      cev.setUint16(2, 24, true);     // size of extra field data (3 x 8 bytes)
      StreamingZipWriter.setUint64(cev, 4, entry.size);   // uncompressed size
      StreamingZipWriter.setUint64(cev, 12, entry.size);  // compressed size
      StreamingZipWriter.setUint64(cev, 20, entry.offset); // local header offset

      // Central directory entry: 46 bytes + filename + ZIP64 extra field
      // Sizes and offset set to 0xFFFFFFFF → actual values in ZIP64 extra field
      const cd = new ArrayBuffer(46 + entry.name.length + cdExtra.byteLength);
      const cv = new DataView(cd);
      cv.setUint32(0, 0x02014b50, true);               // central directory signature
      cv.setUint16(4, 45, true);                        // version made by: 4.5 (ZIP64)
      cv.setUint16(6, 45, true);                        // version needed: 4.5 (ZIP64)
      cv.setUint16(8, 0x0800, true);                    // general purpose bit flag: UTF-8
      cv.setUint16(10, 0, true);                        // compression: STORE
      cv.setUint16(12, entry.dosTime, true);
      cv.setUint16(14, entry.dosDate, true);
      cv.setUint32(16, entry.crc, true);
      cv.setUint32(20, 0xFFFFFFFF, true);               // compressed size → ZIP64 sentinel
      cv.setUint32(24, 0xFFFFFFFF, true);               // uncompressed size → ZIP64 sentinel
      cv.setUint16(28, entry.name.length, true);
      cv.setUint16(30, cdExtra.byteLength, true);       // extra field length
      cv.setUint16(32, 0, true);                        // file comment length
      cv.setUint16(34, 0, true);                        // disk number start
      cv.setUint16(36, 0, true);                        // internal attributes
      cv.setUint32(38, 0, true);                        // external attributes
      cv.setUint32(42, 0xFFFFFFFF, true);               // local header offset → ZIP64 sentinel
      new Uint8Array(cd).set(entry.name, 46);
      new Uint8Array(cd).set(new Uint8Array(cdExtra), 46 + entry.name.length);

      await this.writable.write(new Uint8Array(cd));
      this.offset += BigInt(cd.byteLength);
    }

    const centralDirSize = this.offset - centralDirOffset;
    const zip64EocdOffset = this.offset;
    const entryCount = BigInt(this.entries.length);

    // ── ZIP64 End of Central Directory Record (56 bytes) ──────────────────────
    const zip64Eocd = new ArrayBuffer(56);
    const z64v = new DataView(zip64Eocd);
    z64v.setUint32(0, 0x06064b50, true);              // ZIP64 EOCD signature
    StreamingZipWriter.setUint64(z64v, 4, 44n);       // size of this record minus 12 bytes
    z64v.setUint16(12, 45, true);                     // version made by: 4.5
    z64v.setUint16(14, 45, true);                     // version needed: 4.5
    z64v.setUint32(16, 0, true);                      // number of this disk
    z64v.setUint32(20, 0, true);                      // disk with start of central directory
    StreamingZipWriter.setUint64(z64v, 24, entryCount);    // entries on this disk
    StreamingZipWriter.setUint64(z64v, 32, entryCount);    // total entries
    StreamingZipWriter.setUint64(z64v, 40, centralDirSize); // size of central directory
    StreamingZipWriter.setUint64(z64v, 48, centralDirOffset); // offset of central directory

    await this.writable.write(new Uint8Array(zip64Eocd));
    this.offset += BigInt(zip64Eocd.byteLength);

    // ── ZIP64 End of Central Directory Locator (20 bytes) ─────────────────────
    const zip64Locator = new ArrayBuffer(20);
    const z64lv = new DataView(zip64Locator);
    z64lv.setUint32(0, 0x07064b50, true);             // ZIP64 EOCD locator signature
    z64lv.setUint32(4, 0, true);                      // disk with ZIP64 EOCD
    StreamingZipWriter.setUint64(z64lv, 8, zip64EocdOffset); // offset of ZIP64 EOCD
    z64lv.setUint32(16, 1, true);                     // total disks

    await this.writable.write(new Uint8Array(zip64Locator));
    this.offset += BigInt(zip64Locator.byteLength);

    // ── Standard End of Central Directory Record (22 bytes, with ZIP64 sentinels) ──
    const eocd = new ArrayBuffer(22);
    const ev = new DataView(eocd);
    ev.setUint32(0, 0x06054b50, true);                // EOCD signature
    ev.setUint16(4, 0, true);                         // disk number
    ev.setUint16(6, 0, true);                         // disk with central directory
    ev.setUint16(8, this.entries.length > 0xFFFF ? 0xFFFF : this.entries.length, true);
    ev.setUint16(10, this.entries.length > 0xFFFF ? 0xFFFF : this.entries.length, true);
    ev.setUint32(12, 0xFFFFFFFF, true);               // central dir size → ZIP64 sentinel
    ev.setUint32(16, 0xFFFFFFFF, true);               // central dir offset → ZIP64 sentinel
    ev.setUint16(20, 0, true);                        // comment length

    await this.writable.write(new Uint8Array(eocd));
    await this.writable.close();
  }
}
