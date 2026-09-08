import { addLog } from '../ui/UIController.js';
import { t } from '../i18n.js';
import { degToDms } from '../utils/date.js';

export /**
 * Merge two images using Canvas (instant, no FFmpeg required)
 */
async function mergeImageOverlay(mainFile, overlayFile) {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    const mainImg = new Image();
    const overlayImg = new Image();
    
    mainImg.onload = () => {
      canvas.width = mainImg.width;
      canvas.height = mainImg.height;
      ctx.drawImage(mainImg, 0, 0);
      URL.revokeObjectURL(mainImg.src);
      
      overlayImg.onload = () => {
        ctx.drawImage(overlayImg, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(overlayImg.src);
        canvas.toBlob((blob) => {
            canvas.width = 0;
            canvas.height = 0;
            resolve(new File([blob], mainFile.name, { type: 'image/jpeg' }));
        }, 'image/jpeg', 0.95);
      };
      
      overlayImg.onerror = () => resolve(mainFile); // fallback to orig on error
      overlayImg.src = URL.createObjectURL(overlayFile);
    };
    
    mainImg.onerror = () => resolve(mainFile);
    mainImg.src = URL.createObjectURL(mainFile);
  });
}

export /**
 * Get base64 Data URL for piexif
 */
async function getBase64DataUrl(fileBlob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(fileBlob);
  });
}

export /**
 * Fallback to blob for ArrayBuffer response
 */
async function dataUrlToArrayBuffer(dataUrl) {
  const res = await fetch(dataUrl);
  return await res.arrayBuffer();
}

export /**
 * Build EXIF metadata dict with date and GPS information.
 */
function buildExifDict(meta, needDate, needLoc, date) {
  const exifDict = { '0th': {}, 'Exif': {}, 'GPS': {}, '1st': {}, 'Interop': {} };

  if (needDate && date) {
    const pad = n => ('0' + n).slice(-2);
    const dateStr =
      date.getUTCFullYear() + ':' +
      pad(date.getUTCMonth() + 1) + ':' +
      pad(date.getUTCDate()) + ' ' +
      pad(date.getUTCHours()) + ':' +
      pad(date.getUTCMinutes()) + ':' +
      pad(date.getUTCSeconds());
    exifDict['0th'][window.piexif.ImageIFD.DateTime] = dateStr;
    exifDict['Exif'][window.piexif.ExifIFD.DateTimeOriginal] = dateStr;
    exifDict['Exif'][window.piexif.ExifIFD.DateTimeDigitized] = dateStr;
  }

  if (needLoc && meta && meta.latitude !== null && meta.longitude !== null) {
    exifDict['GPS'][window.piexif.GPSIFD.GPSLatitude] = degToDms(Math.abs(meta.latitude));
    exifDict['GPS'][window.piexif.GPSIFD.GPSLongitude] = degToDms(Math.abs(meta.longitude));
    exifDict['GPS'][window.piexif.GPSIFD.GPSLatitudeRef] = meta.latitude >= 0 ? 'N' : 'S';
    exifDict['GPS'][window.piexif.GPSIFD.GPSLongitudeRef] = meta.longitude >= 0 ? 'E' : 'W';
  }

  return exifDict;
}

export /**
 * Binary-level EXIF injection into JPEG.
 * Fallback for canvas-generated JPEGs where piexif.insert() may silently
 * produce invalid EXIF due to JFIF/APP0 marker conflicts.
 * Strips existing APP0 (JFIF) and APP1 (EXIF) segments, then injects
 * a clean APP1/EXIF segment directly after the SOI marker.
 * @param {ArrayBuffer} jpegBuffer - Raw JPEG data
 * @param {string} exifDumpStr - Binary string from piexif.dump()
 * @returns {ArrayBuffer|null} - New JPEG with EXIF, or null on failure
 */
function insertExifBinary(jpegBuffer, exifDumpStr) {
  const jpeg = new Uint8Array(jpegBuffer);

  // Verify SOI marker (FF D8)
  if (jpeg.length < 4 || jpeg[0] !== 0xFF || jpeg[1] !== 0xD8) {
    return null;
  }

  // Convert piexif.dump() binary string to byte array
  const exifPayload = new Uint8Array(exifDumpStr.length);
  for (let i = 0; i < exifDumpStr.length; i++) {
    exifPayload[i] = exifDumpStr.charCodeAt(i) & 0xFF;
  }

  // Walk JPEG markers after SOI and skip APP0 (JFIF) + APP1 (existing EXIF)
  let restOffset = 2;
  while (restOffset < jpeg.length - 3) {
    if (jpeg[restOffset] !== 0xFF) break;
    const marker = jpeg[restOffset + 1];
    // Stop at SOS or any non-APPn marker
    if (marker === 0xDA || (marker & 0xF0) !== 0xE0) break;
    const segLen = (jpeg[restOffset + 2] << 8) | jpeg[restOffset + 3];
    // Strip APP0 (JFIF) and APP1 (EXIF) to avoid conflicts
    if (marker === 0xE0 || marker === 0xE1) {
      restOffset += 2 + segLen;
    } else {
      break; // Keep other APPn segments (e.g. APP2/ICC profiles)
    }
  }

  // Build APP1 segment: FF E1 + length(2 bytes big-endian) + EXIF payload
  const app1ContentLen = exifPayload.length + 2; // +2 for the length field itself
  if (app1ContentLen > 0xFFFF) return null; // Too large for single APP1 segment

  const app1Header = new Uint8Array(4);
  app1Header[0] = 0xFF;
  app1Header[1] = 0xE1;
  app1Header[2] = (app1ContentLen >> 8) & 0xFF;
  app1Header[3] = app1ContentLen & 0xFF;

  // Assemble: SOI + new APP1 + remaining original JPEG data
  const rest = jpeg.subarray(restOffset);
  const result = new Uint8Array(2 + app1Header.length + exifPayload.length + rest.length);
  result[0] = 0xFF;
  result[1] = 0xD8;
  result.set(app1Header, 2);
  result.set(exifPayload, 6);
  result.set(rest, 6 + exifPayload.length);

  return result.buffer;
}

export /**
 * Verify that EXIF date was correctly embedded in a JPEG buffer.
 * Uses exifr to independently parse and check for DateTimeOriginal.
 */
async function verifyExifDate(buffer) {
  try {
    const parsed = await window.exifr.parse(buffer, { tiff: true, exif: true });
    return !!(parsed && (parsed.DateTimeOriginal || parsed.CreateDate));
  } catch {
    return false;
  }
}

export async function applyPiexif(fileBlob, meta, needDate, needLoc, date) {
  if (!needDate && !needLoc) return await fileBlob.arrayBuffer();

  // piexif only supports JPEG – skip for PNG, HEIC, WebP etc.
  const blobType = fileBlob.type || '';
  const fileName = fileBlob.name || '';
  const ext = fileName.split('.').pop().toLowerCase();
  const isJpeg = blobType.includes('jpeg') || blobType.includes('jpg') ||
                 ext === 'jpg' || ext === 'jpeg';
  if (!isJpeg) {
    return await fileBlob.arrayBuffer();
  }

  const exifDict = buildExifDict(meta, needDate, needLoc, date);
  let exifBytes;
  try {
    exifBytes = window.piexif.dump(exifDict);
  } catch (e) {
    console.warn('piexif.dump() failed:', e);
    return await fileBlob.arrayBuffer();
  }

  // ── Attempt 1: Standard piexif path ──
  try {
    const dataUrl = await getBase64DataUrl(fileBlob);

    // Merge new metadata into any existing EXIF
    let finalExifBytes;
    try {
      const existing = window.piexif.load(dataUrl);
      const merged = {
        '0th':     { ...(existing['0th']     || {}), ...(exifDict['0th']  || {}) },
        'Exif':    { ...(existing['Exif']    || {}), ...(exifDict['Exif'] || {}) },
        'GPS':     { ...(existing['GPS']     || {}), ...(exifDict['GPS']  || {}) },
        '1st':     existing['1st']     || {},
        'Interop': existing['Interop'] || {},
      };
      finalExifBytes = window.piexif.dump(merged);
    } catch {
      finalExifBytes = exifBytes;
    }

    const newDataUrl = window.piexif.insert(finalExifBytes, dataUrl);
    const resultBuffer = await dataUrlToArrayBuffer(newDataUrl);

    // Verify the EXIF date is actually readable
    if (needDate && date) {
      const verified = await verifyExifDate(resultBuffer);
      if (verified) return resultBuffer;
      console.warn('EXIF verification failed after piexif.insert – trying binary fallback');
    } else {
      return resultBuffer;
    }
  } catch (e) {
    console.warn('piexif.insert() failed:', e, '– trying binary fallback');
  }

  // ── Attempt 2: Binary-level EXIF injection ──
  // Strips JFIF/APP0 and existing APP1, then injects a clean EXIF APP1 segment
  try {
    const rawBuffer = await fileBlob.arrayBuffer();
    const result = insertExifBinary(rawBuffer, exifBytes);
    if (result) {
      if (needDate && date) {
        const verified = await verifyExifDate(result);
        if (verified) return result;
        console.warn('EXIF verification also failed after binary fallback');
      } else {
        return result;
      }
    }
  } catch (e) {
    console.warn('Binary EXIF fallback failed:', e);
  }

  // ── Final fallback: return image without EXIF metadata ──
  addLog('⚠️ EXIF metadata could not be embedded in an image – date may be incorrect in gallery apps', 'warn');
  return await fileBlob.arrayBuffer();
}
