// Constants
const MAIN_RE = /^(?<prefix>\d{4}-\d{2}-\d{2})_(?<mid>[a-fA-F0-9-]{36})-main\.(?<ext>[^.]+)$/;
const OVERLAY_RE = /^(?<prefix>\d{4}-\d{2}-\d{2})_(?<mid>[a-fA-F0-9-]{36})-overlay\.(?<ext>[^.]+)$/;
const IMAGE_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'heic', 'heif', 'webp']);
const VIDEO_EXTENSIONS = new Set(['mp4', 'mov', 'm4v', 'avi', 'mkv', 'webm']);

// State
let jsonFile = null;
let mediaFiles = [];
let statusLog = [];
let isScanning = false;

// DOM Elements
const folderZone = document.getElementById('folderZone');
const folderInput = document.getElementById('folderInput');
const folderList = document.getElementById('folderList');
const processBtn = document.getElementById('processBtn');
const clearBtn = document.getElementById('clearBtn');
const statusBox = document.getElementById('statusBox');
const progressSection = document.getElementById('progressSection');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');

let ffmpegInstance = null;
let currentProcessingName = '';

async function getFFmpeg() {
  if (ffmpegInstance) return ffmpegInstance;

  const blobs = await getFFmpegBlobs();
  const { FFmpeg } = window.FFmpegWASM;
  const ffmpeg = new FFmpeg();

  ffmpeg.on('progress', ({ progress }) => {
    const p = Math.round(progress * 100);
    if (p > 0 && p <= 100) {
      addLog(`⏳ Verarbeite Video ${currentProcessingName} (${p}%)`, 'info', 'current_video');
    }
  });

  await ffmpeg.load({
    coreURL: blobs.coreBlobURL,
    wasmURL: blobs.wasmBlobURL,
    classWorkerURL: blobs.workerBlobURL,
  });

  ffmpegInstance = ffmpeg;
  return ffmpeg;
}

/**
 * Initialize event listeners
 */
function initEventListeners() {
  // Folder Zone
  folderZone.addEventListener('dragover', handleDragOver);
  folderZone.addEventListener('dragleave', handleDragLeave);
  folderZone.addEventListener('drop', handleFolderDrop);
  folderZone.addEventListener('click', () => {
    if (!isScanning) folderInput.click();
  });
  folderZone.addEventListener('keydown', (e) => {
    if ((e.key === 'Enter' || e.key === ' ') && !isScanning) {
      folderInput.click();
    }
  });

  // File Input (Directory Picker)
  folderInput.addEventListener('change', async (e) => {
    if (e.target.files.length && !isScanning) {
      isScanning = true;
      folderList.classList.remove('file-list--empty');
      folderList.innerHTML = `<div class="file-item"><span class="file-item__name">⏳ Lese ${e.target.files.length} Dateien ein...</span></div>`;
      
      progressSection.classList.add('progress-section--visible');
      progressFill.style.width = '100%';
      progressFill.style.transition = 'none';
      progressText.textContent = `Lese ${e.target.files.length} Dateien...`;
      
      await new Promise(r => setTimeout(r, 50));
      await scanFiles(Array.from(e.target.files));
      
      isScanning = false;
      progressSection.classList.remove('progress-section--visible');
      progressFill.style.transition = '';
    }
  });

  // Buttons
  clearBtn.addEventListener('click', handleClear);
  processBtn.addEventListener('click', handleProcess);
}

/**
 * Handle drag over event
 */
function handleDragOver(e) {
  e.preventDefault();
  e.currentTarget.classList.add('dragover');
}

/**
 * Handle drag leave event
 */
function handleDragLeave(e) {
  if (e.currentTarget === e.target) {
    e.currentTarget.classList.remove('dragover');
  }
}

/**
 * Handle folder/file drop
 */
async function handleFolderDrop(e) {
  e.preventDefault();
  e.currentTarget.classList.remove('dragover');
  
  if (isScanning) return;
  const items = e.dataTransfer.items;
  if (!items) return;
  
  isScanning = true;
  let scannedCount = 0;
  
  folderList.classList.remove('file-list--empty');
  folderList.innerHTML = `<div class="file-item"><span class="file-item__name">⏳ Scanne Ordner... (0 Dateien gefunden)</span></div>`;
  
  // Use existing progress bar for scanning
  progressSection.classList.add('progress-section--visible');
  progressFill.style.width = '100%';
  progressFill.style.transition = 'none';
  progressText.textContent = `Scanne Verzeichnis...`;
  
  const filesToScan = [];

  // Recursive function to read directory entries
  async function readEntry(entry) {
    if (entry.isFile) {
      const file = await new Promise(resolve => entry.file(resolve));
      filesToScan.push(file);
      scannedCount++;
      if (scannedCount % 500 === 0) {
        folderList.innerHTML = `<div class="file-item"><span class="file-item__name">⏳ Lese Dateien... (${scannedCount} gefunden)</span></div>`;
        progressText.textContent = `${scannedCount} Dateien gefunden...`;
      }
    } else if (entry.isDirectory) {
      const dirReader = entry.createReader();
      let allEntries = [];
      let entries = [];
      do {
        entries = await new Promise(resolve => dirReader.readEntries(resolve));
        allEntries = allEntries.concat(entries);
      } while (entries.length > 0);
      
      for (let child of allEntries) {
        await readEntry(child);
      }
    }
  }
  
  try {
    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.webkitGetAsEntry) {
            const entry = item.webkitGetAsEntry();
            if (entry) await readEntry(entry);
        } else if (item.kind === 'file') {
            filesToScan.push(item.getAsFile());
            scannedCount++;
        }
    }
    
    progressText.textContent = `Analysiere ${filesToScan.length} Dateien...`;
    folderList.innerHTML = `<div class="file-item"><span class="file-item__name">⏳ Analysiere ${filesToScan.length} Dateien...</span></div>`;
    await new Promise(r => setTimeout(r, 50)); // Yield to paint
    
    await scanFiles(filesToScan);
    statusLog = [];
  } catch (err) {
    addLog('❌ Fehler beim Lesen des Ordners: ' + err.message, 'error');
  } finally {
    isScanning = false;
    progressSection.classList.remove('progress-section--visible');
    progressFill.style.transition = '';
  }
}

/**
 * Scan gathered files and sort them into JSON or Media
 */
async function scanFiles(filesArray) {
  const mediaMap = new Map();
  
  for (let f of mediaFiles) {
      mediaMap.set(f.name + '_' + f.size, f);
  }
  
  for (let file of filesArray) {
    const name = file.name.toLowerCase();
    
    if (name === 'memories_history.json') {
      jsonFile = file;
    } else {
      const ext = name.split('.').pop();
      if (IMAGE_EXTENSIONS.has(ext) || VIDEO_EXTENSIONS.has(ext)) {
        const key = file.name + '_' + file.size;
        if (!mediaMap.has(key)) {
            mediaMap.set(key, file);
        }
      }
    }
  }
  
  mediaFiles = Array.from(mediaMap.values());
  updateUI();
}

/**
 * Update UI based on current state
 */
function updateUI() {
  folderList.innerHTML = '';
  
  if (!jsonFile && mediaFiles.length === 0) {
    folderList.classList.add('file-list--empty');
  } else {
    folderList.classList.remove('file-list--empty');
    
    // Status für JSON
    if (jsonFile) {
        folderList.innerHTML += `<div class="file-item"><span class="file-item__name">✅ memories_history.json gefunden</span><span class="file-item__size">${formatBytes(jsonFile.size)}</span></div>`;
    } else {
        folderList.innerHTML += `<div class="file-item"><span class="file-item__name" style="color: var(--c-error)">❌ memories_history.json fehlt</span></div>`;
    }
    
    // Status für Medien
    if (mediaFiles.length > 0) {
        const totalSize = mediaFiles.reduce((sum, file) => sum + file.size, 0);
        folderList.innerHTML += `<div class="file-item"><span class="file-item__name">✅ ${mediaFiles.length} Mediadateien gefunden</span><span class="file-item__size">${formatBytes(totalSize)}</span></div>`;
    } else {
        folderList.innerHTML += `<div class="file-item"><span class="file-item__name" style="color: var(--c-error)">❌ Keine Mediadateien gefunden</span></div>`;
    }
  }

  // Button nur aktivieren, wenn alles da ist
  processBtn.disabled = !jsonFile || mediaFiles.length === 0;
}

/**
 * Clear all data
 */
function handleClear() {
  jsonFile = null;
  mediaFiles = [];
  statusLog = [];
  ffmpegLoadError = null; // Reset FFmpeg error state text
  folderList.classList.add('file-list--empty');
  statusBox.classList.remove('status-box--visible');
  progressSection.classList.remove('progress-section--visible');
  folderInput.value = '';
  updateUI();
}

/**
 * Process memories
 */
async function handleProcess() {
  statusLog = [];
  progressSection.classList.add('progress-section--visible');
  processBtn.disabled = true;
  addLog('🚀 Starte Verarbeitung...');

  try {
    const history = await parseJsonHistory();
    const zip = new JSZip();
    const mediaMap = new Map();

    for (const file of mediaFiles) {
      const info = extractMediaInfo(file.name);
      if (!info) continue;

      if (!mediaMap.has(info.mid)) {
        mediaMap.set(info.mid, {});
      }
      mediaMap.get(info.mid)[info.type] = { file, info };
    }
    addLog(`📁 Index abgeschlossen. Befreie Index-Speicher...`);
    mediaFiles = [];

    const allGroups = Array.from(mediaMap.entries());
    
    const imageGroups = allGroups.filter(([_, files]) => {
      const ext = files.main.info.ext.toLowerCase();
      return IMAGE_EXTENSIONS.has(ext);
    });
    
    const videoGroups = allGroups.filter(([_, files]) => {
      const ext = files.main.info.ext.toLowerCase();
      return VIDEO_EXTENSIONS.has(ext);
    });

    addLog(`📁 Gefunden: ${imageGroups.length} Bilder, ${videoGroups.length} Videos.`, 'ok');
    
    let globalProcessed = 0;
    const totalToProcess = allGroups.length;

    if (imageGroups.length > 0) {
      addLog(`📸 Verarbeite Bilder...`);
      await asyncPool(imageGroups, async ([mid, files]) => {
        await processAndZip(mid, files, zip, history);
        globalProcessed++;
        updateProgress(globalProcessed, totalToProcess);
      }, 4);
    }

    if (videoGroups.length > 0) {
      addLog(`🎥 Verarbeite Videos...`);
      await getFFmpeg(); 
      
      await asyncPool(videoGroups, async ([mid, files]) => {
        await processAndZip(mid, files, zip, history);
        globalProcessed++;
        updateProgress(globalProcessed, totalToProcess);
      }, 1);
    }

    statusLog = statusLog.filter(item => item.id !== 'current_video');
    updateStatus();

    addLog('📦 Erstelle ZIP-Archiv...', 'ok');
    const zipBlob = await zip.generateAsync({ 
      type: 'blob',
      compression: 'STORE',
      streamFiles: true 
    }, (metadata) => {
        updateProgress(metadata.percent, 100);
    });
    
    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `snapchat-export-${new Date().toISOString().split('T')[0]}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    setTimeout(() => URL.revokeObjectURL(url), 10000);

    addLog(`✅ Fertig! Alle Dateien verarbeitet.`, 'ok');

  } catch (e) {
    addLog(`❌ Kritischer Fehler: ${e.message}`, 'error');
    console.error(e);
  } finally {
    if (ffmpegInstance) {
      try {
        await ffmpegInstance.terminate();
      } catch (err) {}
      console.error(err)
      ffmpegInstance = null;
    }
    processBtn.disabled = false;
  }
}

/**
 * Parse JSON history file
 */
async function parseJsonHistory() {
  try {
    const text = await jsonFile.text();
    const data = JSON.parse(text);
    const items = data['Saved Media'] || [];
    const result = {};

    for (const item of items) {
      let mid = parseMidFromUrl(item['Download Link'] || '');
      if (!mid) mid = parseMidFromUrl(item['Media Download Url'] || '');
      if (!mid) continue;

      const location = item['Location'];
      const [lat, lon] = parseLocation(location);

      result[mid] = {
        dateRaw: item['Date'],
        latitude: lat,
        longitude: lon,
      };
    }

    addLog(`✅ ${Object.keys(result).length} Einträge aus JSON geparst`, 'ok');
    return result;
  } catch (e) {
    addLog(`❌ JSON-Parse Fehler: ${e.message}`, 'error');
    throw e;
  }
}

/**
 * Parse MID from URL
 */
function parseMidFromUrl(url) {
  if (!url) return null;
  try {
    const urlObj = new URL(url);
    const mid = urlObj.searchParams.get('mid');
    return mid ? mid.toLowerCase() : null;
  } catch {
    return null;
  }
}

/**
 * Parse location from string
 */
function parseLocation(location) {
  if (!location) return [null, null];
  const match = location.match(/Latitude, Longitude:\s*([-+]?\d+(?:\.\d+)?),\s*([-+]?\d+(?:\.\d+)?)/);
  if (!match) return [null, null];
  const lat = parseFloat(match[1]);
  const lon = parseFloat(match[2]);
  if (lat === 0 && lon === 0) return [null, null];
  return [lat, lon];
}

/**
 * Parse Snapchat date format
 */
function parseSnapchatDate(dateStr) {
  if (!dateStr) return null;
  try {
    return new Date(dateStr.replace(' UTC', ' GMT'));
  } catch {
    return null;
  }
}

/**
 * Extract media info from filename
 */
function extractMediaInfo(filename) {
  const match = filename.match(/^(\d{4}-\d{2}-\d{2})_([a-fA-F0-9-]{36})-(main|overlay)\.([^.]+)$/i);
  if (!match) return null;
  return {
    prefix: match[1],
    mid: match[2].toLowerCase(),
    type: match[3],
    ext: match[4].toLowerCase(),
  };
}

let ffmpegBlobs = null;

async function getFFmpegBlobs() {
  if (ffmpegBlobs) return ffmpegBlobs;
  
  addLog('⏳ Lade Videoverarbeitungs-Engine (Dateien puffern)... Bitte warten.');

  try {
    const { toBlobURL } = window.FFmpegUtil;

    // Alles komplett lokal!
    const coreBlobURL = await toBlobURL('vendor/ffmpeg-core.js', 'text/javascript');
    const wasmBlobURL = await toBlobURL('vendor/ffmpeg-core.wasm', 'application/wasm');
    const workerBlobURL = await toBlobURL('vendor/814.ffmpeg.js', 'text/javascript');
    
    ffmpegBlobs = { coreBlobURL, wasmBlobURL, workerBlobURL };
    addLog('✅ Videoverarbeitungs-Dateien gepuffert.', 'ok');
    return ffmpegBlobs;
  } catch (e) {
    addLog('❌ FFmpeg-Pufferfehler: ' + e.message, 'error');
    console.error("FFmpeg Buffer Error:", e);
    throw e;
  }
}

async function getMissingMetadata(file, meta) {
  if (!meta) return { needDate: false, needLoc: false, date: null };
  const date = parseSnapchatDate(meta.dateRaw);
  let hasDate = false;
  let hasLoc = false;

  try {
    const existing = await exifr.parse(file, { tiff: true, ifd0: true, exif: true, gps: true, quicktime: true });
    if (existing) {
      hasDate = !!(existing.DateTimeOriginal || existing.CreateDate || existing.MediaCreateDate || existing.TrackCreateDate);
      hasLoc = existing.latitude !== undefined && existing.longitude !== undefined;
    }
  } catch (e) {}

  return {
    needDate: !hasDate && !!date,
    needLoc: !hasLoc && (meta.latitude !== null && meta.longitude !== null),
    date
  };
}

/**
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

/**
 * Get base64 Data URL for piexif
 */
async function getBase64DataUrl(fileBlob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    // piexif can only load data URLs or binary strings.
    reader.readAsDataURL(fileBlob);
  });
}

/**
 * Fallback to blob for ArrayBuffer response
 */
async function dataUrlToArrayBuffer(dataUrl) {
  const res = await fetch(dataUrl);
  return await res.arrayBuffer();
}

/**
 * Process media files (Overlay & EXIF data)
 */
async function processMediaGroup(files, meta) {
  const mainFile = files.main.file;
  const overlayFile = files.overlay ? files.overlay.file : null;
  const ext = mainFile.name.split('.').pop().toLowerCase();
  const isVideo = VIDEO_EXTENSIONS.has(ext);

  const { needDate, needLoc, date } = await getMissingMetadata(mainFile, meta);
  const needsOverlay = !!overlayFile;

  let currentFile = mainFile;

  // Für Videos mit Overlay ODER fehlenden Metadaten verwenden wir FFmpeg
  if (isVideo && (needsOverlay || needDate || needLoc)) {
    try {
      currentFile = await processVideoWithFFmpeg(mainFile, overlayFile, needDate, needLoc, date, meta);
    } catch (err) {
      addLog(`⚠️ ${mainFile.name}: ${err.message}. Original wird beibehalten.`, 'error');
      console.error(`Fehler bei ${mainFile.name}:`, err);
    }
    return await currentFile.arrayBuffer();
  }

  // Für Fotos mit Overlay verwenden wir Canvas
  if (!isVideo && needsOverlay && IMAGE_EXTENSIONS.has(ext)) {
    currentFile = await mergeImageOverlay(mainFile, overlayFile);
  }

  // Für Fotos Metadaten injizieren
  if (!isVideo && IMAGE_EXTENSIONS.has(ext)) {
    return await applyPiexif(currentFile, meta, needDate, needLoc, date);
  }

  return await currentFile.arrayBuffer();
}

/**
 * Handle video manipulation with FFmpeg 
 */
async function processVideoWithFFmpeg(mainFile, overlayFile, needDate, needLoc, date, meta) {
  const ffmpeg = await getFFmpeg();
  const { fetchFile } = window.FFmpegUtil;

  const mainName = 'input_main.mp4';
  const overlayName = 'input_overlay.png';
  const outName = 'output_final.mp4';

  currentProcessingName = mainFile.name;

  try {
    await ffmpeg.writeFile(mainName, await fetchFile(mainFile));
    if (overlayFile) {
      await ffmpeg.writeFile(overlayName, await fetchFile(overlayFile));
    }

    let cmd = ['-y', '-i', mainName];
    if (overlayFile) {
      cmd.push('-i', overlayName, '-filter_complex', '[0:v][1:v]overlay=0:0:format=auto', 
               '-map', '0:v:0', '-map', '0:a?', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '23', '-preset', 'ultrafast', '-c:a', 'copy');
    } else {
      cmd.push('-c', 'copy');
    }

    if (needDate && date) cmd.push('-metadata', `creation_time=${date.toISOString()}`);
    if (needLoc) {
      const lat = meta.latitude >= 0 ? `+${meta.latitude.toFixed(4)}` : `${meta.latitude.toFixed(4)}`;
      const lon = meta.longitude >= 0 ? `+${meta.longitude.toFixed(4)}` : `${meta.longitude.toFixed(4)}`;
      cmd.push('-metadata', `location=${lat}${lon}/`);
    }
    cmd.push(outName);

    const exitCode = await ffmpeg.exec(cmd);
    if (exitCode !== 0) throw new Error(`FFmpeg Fehler Code ${exitCode}`);

    const data = await ffmpeg.readFile(outName);
    return new File([data.buffer], mainFile.name, { type: mainFile.type });

  } finally {
    const filesToDelete = [mainName, overlayName, outName];
    for (const f of filesToDelete) {
      try {
        await ffmpeg.deleteFile(f);
      } catch (e) {
        console.error(`Fehler beim Löschen von ${f} aus virtuellem FS:`, e);
      }
    }
  }
}

/**
 * Add EXIF data to image using piexif
 */
async function applyPiexif(fileBlob, meta, needDate, needLoc, date) {
  if (!needDate && !needLoc) return await fileBlob.arrayBuffer();
  
  try {
    const dataUrl = await getBase64DataUrl(fileBlob);
    let exifStr;
    try {
      exifStr = piexif.load(dataUrl);
    } catch(e) {
      exifStr = { '0th': {}, 'Exif': {}, 'GPS': {}, '1st': {}, 'Interop': {} };
    }
    
    // Set DateTime
    if (needDate && date) {
      const dateStr =
        date.toISOString().split('T')[0].replace(/-/g, ':') +
        ' ' +
        ('0' + date.getHours()).slice(-2) +
        ':' +
        ('0' + date.getMinutes()).slice(-2) +
        ':' +
        ('0' + date.getSeconds()).slice(-2);
      exifStr['0th'][piexif.ImageIFD.DateTime] = dateStr;
      
      if (!exifStr['Exif']) exifStr['Exif'] = {};
      exifStr['Exif'][piexif.ExifIFD.DateTimeOriginal] = dateStr;
    }

    // Set GPS data
    if (needLoc && meta.latitude !== null && meta.longitude !== null) {
      if (!exifStr['GPS']) exifStr['GPS'] = {};
      exifStr['GPS'][piexif.GPSIFD.GPSLatitude] = degToDms(Math.abs(meta.latitude));
      exifStr['GPS'][piexif.GPSIFD.GPSLongitude] = degToDms(Math.abs(meta.longitude));
      exifStr['GPS'][piexif.GPSIFD.GPSLatitudeRef] = meta.latitude >= 0 ? 'N' : 'S';
      exifStr['GPS'][piexif.GPSIFD.GPSLongitudeRef] = meta.longitude >= 0 ? 'E' : 'W';
    }

    const exifBytes = piexif.dump(exifStr);
    const newDataUrl = piexif.insert(exifBytes, dataUrl);
    
    return await dataUrlToArrayBuffer(newDataUrl);
  } catch (e) {
    console.warn('EXIF-Fehler, mache weiter ohne EXIF:', e);
    return await fileBlob.arrayBuffer();
  }
}

/**
 * Convert degrees to DMS format for EXIF
 */
function degToDms(deg) {
  const d = Math.floor(Math.abs(deg));
  const mf = (Math.abs(deg) - d) * 60;
  const m = Math.floor(mf);
  const s = (mf - m) * 60;
  return [[d, 1], [m, 1], [Math.round(s * 10000), 10000]];
}

/**
 * Add log message
 * @param {string} msg - Die Nachricht
 * @param {string} type - 'info', 'ok' oder 'error'
 * @param {string|null} id - Wenn übergeben, überschreibt dies einen bereits existierenden Log-Eintrag mit derselben ID
 */
function addLog(msg, type = 'info', id = null) {
  if (id) {
    const existingIndex = statusLog.findIndex(item => item.id === id);
    if (existingIndex !== -1) {
      statusLog[existingIndex] = { msg, type, id };
      updateStatus();
      return;
    }
  }
  
  statusLog.push({ msg, type, id });
  updateStatus();
}

async function processAndZip(mid, files, zip, history) {
  const meta = history[mid];
  const mainFile = files.main;
  
  try {
    const processedFile = await processMediaGroup(files, meta);
    const filename = `${mainFile.info.prefix}_${mid}.${mainFile.info.ext}`;
    zip.file(filename, processedFile, { compression: "STORE" }); // Quick Win: Kein Re-Compress
  } catch (e) {
    addLog(`❌ Fehler bei ${mainFile.file.name}: ${e.message}`, 'error');
  } finally {
    processedFile = null;
  }
}

async function asyncPool(iterable, iteratorFn, concurrencyLimit) {
  const result = [];
  const executing = new Set();

  for (const item of iterable) {
    const p = Promise.resolve().then(() => iteratorFn(item));
    result.push(p);
    executing.add(p);

    const clean = () => executing.delete(p);
    p.then(clean).catch(clean);

    if (executing.size >= concurrencyLimit) {
      await Promise.race(executing);
    }
  }
  return Promise.all(result);
}

/**
 * Update status display
 */
function updateStatus() {
  const html = statusLog
    .map((entry) => {
      let className = '';
      if (entry.type === 'ok') className = 'status-item--ok';
      else if (entry.type === 'error') className = 'status-item--error';
      return `<div class="status-item ${className}">${escapeHtml(entry.msg)}</div>`;
    })
    .join('');
  statusBox.innerHTML = html;
  statusBox.classList.add('status-box--visible');
  statusBox.scrollTop = statusBox.scrollHeight;
}

/**
 * Update progress bar
 */
function updateProgress(current, total) {
  const percent = Math.round((current / total) * 100);
  progressFill.style.width = percent + '%';
  progressFill.setAttribute('aria-valuenow', percent);
  progressText.textContent = `${percent}%`;
}

/**
 * Format bytes to human readable
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return (Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]);
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

// Initialize on DOMContentLoaded
document.addEventListener('DOMContentLoaded', initEventListeners);
