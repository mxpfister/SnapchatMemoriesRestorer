// Constants
const MAIN_RE = /^(?<prefix>\d{4}-\d{2}-\d{2})_(?<mid>[a-fA-F0-9-]{36})-main\.(?<ext>[^.]+)$/;
const OVERLAY_RE = /^(?<prefix>\d{4}-\d{2}-\d{2})_(?<mid>[a-fA-F0-9-]{36})-overlay\.(?<ext>[^.]+)$/;
const IMAGE_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'heic', 'heif', 'webp']);
const VIDEO_EXTENSIONS = new Set(['mp4', 'mov', 'm4v', 'avi', 'mkv', 'webm']);

const i18n = {
  en: {
    // UI Labels
    readingFiles: 'Reading {count} files...',
    scanningDir: 'Scanning directory...',
    foundFiles: 'Found {count} files...',
    analyzingFiles: 'Analyzing {count} files...',
    
    // Page Headings and Descriptions
    pageTitle: 'Memories Restorer',
    pageDescription: 'Export your Snapchat photos & videos with perfect metadata.',
    localPrivate: 'Local & Private',
    
    // Why use this tool
    whyUseTitle: 'Why do you need this tool?',
    whyUseText: 'The official Snapchat export provides unfinished files: filters are separated from the image, and the recording date is missing. Without adjustment, your phone\'s file management is a mess. This tool automatically fixes everything:',
    whyUsePoint1: 'Embed filters: Texts and stickers are permanently inserted into photos/videos.',
    whyUsePoint2: 'Correct date: Original date & GPS are added. Your phone gallery sorts everything perfectly!',
    whyUsePoint3: '100% Private: Processing runs entirely locally in your browser. Nothing is uploaded!',
    
    // How to get Snapchat export
    howToGetTitle: 'How do I get my Snapchat export?',
    howToGetText: 'In the <strong>Snapchat app</strong> go to your profile &rarr; <strong>Settings</strong> &rarr; <strong>My Data</strong>. Be sure to select <strong>"Export your Memories"</strong> and <strong>"Export JSON files"</strong> at the bottom! Swipe through the <em>entire time period</em> on the calendar and submit the request.',
    
    // Step 1
    step1Title: '1. Select Snapchat folder',
    step1Description: 'Select your complete, unzipped Snapchat export folder (e.g. <code>mydata~...</code>). The app automatically finds the <code>memories_history.json</code> and media files!',
    selectFolder: 'Select export folder',
    dragFolder: 'Click here or drag the entire folder in',
    
    // Step 2
    step2Title: '2. Processing',
    step2Description: 'Files are matched and metadata (date & GPS) are written to photos. You get a complete ZIP archive.',
    reset: 'Reset',
    startProcessing: 'Start processing',
    
    // Status messages
    indexComplete: 'Index complete. Freeing index memory...',
    found: 'Found: {images} images, {videos} videos.',
    processing: 'Processing...',
    processingImages: 'Processing images...',
    processingVideos: 'Processing videos...',
    processingImagesPart: 'Processing images (Part {part}/{total})...',
    processingVideosPart: 'Processing videos (Part {part}/{total})...',
    
    // Download/Export
    filePickerSet: 'Save location selected. Starting processing...',
    fileSaved: 'Processing complete. Your saved ZIP file is ready.',
    downloadingPart: 'Downloading ZIP part {part}...',
    packingFiles: 'Now packing all finished files into a single ZIP archive. This may take a moment...',
    allComplete: 'Done! All files processed and downloaded.',
    streamingFiles: 'Saving finished files live & step-by-step to your file...',
    chunking: 'For memory protection, files are being split into {parts} smaller ZIP packages (max. ~1.5GB).',
    
    // Warnings & Info
    uploadHint: 'Note: Files are bundled at the end of processing.',
    offlineHint: 'Note: Since the tool runs locally/offline, the download happens at the end of processing.',
    browserHint: 'Note: Your browser downloads the entire ZIP file at once when everything is ready.',
    mobileWarning: 'Mobile devices will crash',
    mobileWarningText: 'Video processing with FFmpeg and caching many files will very likely cause a browser crash on smartphones. Please use this tool on a computer or laptop.',
    browserWarning: 'Browser compatibility',
    browserWarningText: 'Chrome and Edge are most stable here. Firefox and Safari support direct saving of large ZIP files only partially, so exports there require significantly more temporary RAM.',
    
    // Footer
    privacy100: '🔒 100% Private & Local',
    privacyDesc: 'Your files never leave your device. All processing happens in your browser. No data is uploaded to any server.',
    privacyNote: 'When loading the page, IP addresses are technically processed by the hosting provider.',
    disclaimer: 'Disclaimer',
    disclaimerText: 'This project is not affiliated with Snapchat Inc., Snap Inc., or their products. It is an independent community tool for processing export files.',
    
    // Errors
    criticalError: 'Critical error: {msg}',
    abortedByUser: 'Process aborted by user.',
    errorProcessing: 'Error processing {file}: {msg}',
    jsonParseError: 'JSON Parse error: {msg}',
    ffmpegBufferError: 'FFmpeg buffer error: {msg}',
    ffmpegError: 'FFmpeg error code {code}',
    corruptVideo: 'Video file is corrupted/unreadable',
    processingVideo: 'Processing video {name} ({percent}%)',
    
    // Success messages
    jsonParsed: '{count} entries parsed from JSON',
    ffmpegReady: 'Video processing files buffered.',
    jsonFound: 'memories_history.json found',
    jsonMissing: 'memories_history.json missing',
    mediaFound: 'media files found',
  },
  de: {
    // UI Labels
    readingFiles: 'Lese {count} Dateien ein...',
    scanningDir: 'Scanne Verzeichnis...',
    foundFiles: 'Gefunden {count} Dateien...',
    analyzingFiles: 'Analysiere {count} Dateien...',
    
    // Page Headings and Descriptions
    pageTitle: 'Memories Restorer',
    pageDescription: 'Exportiere deine Snapchat Fotos & Videos originalgetreu.',
    localPrivate: 'Lokal & Privat',
    
    // Why use this tool
    whyUseTitle: 'Warum brauche ich dieses Tool?',
    whyUseText: 'Der offizielle Snapchat-Export liefert unfertige Dateien: Filter sind vom Bild getrennt, und das Aufnahmedatum fehlt. Ohne Anpassung herrscht auf deinem Handy das reinste Datei-Chaos. Dieses Tool repariert alles vollautomatisch:',
    whyUsePoint1: 'Filter einbacken: Texte und Sticker werden fest in Fotos/Videos eingefügt.',
    whyUsePoint2: 'Korrektes Datum: Original-Datum & GPS werden ergänzt. Deine Handy-Galerie sortiert alles perfekt ein!',
    whyUsePoint3: '100% Privat: Die Verarbeitung läuft rein lokal in deinem Browser. Nichts wird hochgeladen!',
    
    // How to get Snapchat export
    howToGetTitle: 'Wie erhalte ich meinen Snapchat-Export?',
    howToGetText: 'Gehe in der <strong>Snapchat App</strong> auf dein Profil &rarr; <strong>Einstellungen</strong> &rarr; <strong>Meine Daten</strong>. Wähle unten unbedingt <strong>"Deine Memorys exportieren"</strong> und <strong>"JSON-Dateien exportieren"</strong> aus! Streiche beim Kalender über den <em>gesamten Zeitraum</em> und sende die Anfrage ab.',
    
    // Step 1
    step1Title: '1. Snapchat Ordner auswählen',
    step1Description: 'Wähle deinen kompletten, entpackten Snapchat-Export-Ordner aus (z.B. <code>mydata~...</code>). Die App findet die <code>memories_history.json</code> und die Mediadateien ganz automatisch!',
    selectFolder: 'Export-Ordner auswählen',
    dragFolder: 'Klicke hier oder ziehe den gesamten Ordner hinein',
    
    // Step 2
    step2Title: '2. Verarbeitung',
    step2Description: 'Dateien werden abgeglichen und Metadaten (Datum & GPS) werden auf die Fotos geschrieben. Du erhältst ein vollständiges ZIP-Archiv.',
    reset: 'Zurücksetzen',
    startProcessing: 'Verarbeitung starten',
    
    // Status messages
    indexComplete: 'Index abgeschlossen. Befreie Index-Speicher...',
    found: 'Gefunden: {images} Bilder, {videos} Videos.',
    processing: 'Verarbeitung läuft...',
    processingImages: 'Verarbeite Bilder...',
    processingVideos: 'Verarbeite Videos...',
    processingImagesPart: 'Verarbeite Bilder (Paket {part}/{total})...',
    processingVideosPart: 'Verarbeite Videos (Paket {part}/{total})...',
    
    // Download/Export
    filePickerSet: 'Speicherort festgelegt. Starte Verarbeitung...',
    fileSaved: 'Verarbeitung fertig. Deine gespeicherte ZIP-Datei ist nun bereit.',
    downloadingPart: 'Lade ZIP-Teil {part} herunter...',
    packingFiles: 'Packe nun alle fertigen Dateien in ein einzelnes ZIP-Archiv. Das kann kurz dauern...',
    allComplete: 'Fertig! Alle Dateien verarbeitet und heruntergeladen.',
    streamingFiles: 'Speichere fertige Dateien live & Schritt-für-Schritt in deine Datei...',
    chunking: 'Zum Speicherschutz werden die Dateien in {parts} kleinere ZIP-Pakete (max. ~1.5GB) aufgeteilt.',
    
    // Warnings & Info
    uploadHint: 'Hinweis: Dateien werden erst am Ende der Verarbeitung gebündelt heruntergeladen.',
    offlineHint: 'Hinweis: Da das Tool lokal/offline läuft, erfolgt der Download erst am Ende der Verarbeitung.',
    browserHint: 'Hinweis: Dein Browser lädt die gesamte ZIP-Datei auf einmal herunter, sobald alles fertig ist.',
    mobileWarning: 'Mobilgeräte werden streiken',
    mobileWarningText: 'Die Videoverarbeitung mit FFmpeg und das Zwischenspeichern vieler Dateien wird auf Smartphones sehr wahrscheinlich zu einem Browser-Absturz führen. Bitte nutze dieses Tool am Computer oder Laptop.',
    browserWarning: 'Browser-Kompatibilität',
    browserWarningText: 'Chrome und Edge sind hier am stabilsten. Firefox und Safari unterstützen das direkte Speichern großer ZIP-Dateien nur eingeschränkt, daher braucht der Export dort deutlich mehr temporären Arbeitsspeicher.',
    
    // Footer
    privacy100: '🔒 100% Privat & Lokal',
    privacyDesc: 'Deine Dateien verlassen niemals dein Gerät. Die gesamte Verarbeitung findet in deinem Browser statt. Es werden keine Daten auf einen Server geladen.',
    privacyNote: 'Beim Aufruf der Seite werden technisch bedingt IP-Adressen vom Hosting-Provider verarbeitet.',
    disclaimer: 'Disclaimer',
    disclaimerText: 'Dieses Projekt steht in keiner Verbindung mit Snapchat Inc., Snap Inc. oder deren Produkten. Es ist ein unabhängiges Community-Tool zur Verarbeitung von Export-Dateien.',
    
    // Errors
    criticalError: 'Kritischer Fehler: {msg}',
    abortedByUser: 'Der Prozess wurde durch den Benutzer abgebrochen.',
    errorProcessing: 'Fehler bei {file}: {msg}',
    jsonParseError: 'JSON-Parse Fehler: {msg}',
    ffmpegBufferError: 'FFmpeg-Pufferfehler: {msg}',
    ffmpegError: 'FFmpeg Fehler Code {code}',
    corruptVideo: 'Video-Datei ist korrupt/unlesbar',
    processingVideo: 'Verarbeite Video {name} ({percent}%)',
    
    // Success messages
    jsonParsed: '{count} Einträge aus JSON geparst',
    ffmpegReady: 'Videoverarbeitungs-Dateien gepuffert.',
    jsonFound: 'memories_history.json gefunden',
    jsonMissing: 'memories_history.json fehlt',
    mediaFound: 'Mediadateien gefunden',
  },
};

let currentLanguage = 'en';

function t(key, params = {}) {
  const text = i18n[currentLanguage][key] || i18n.en[key] || key;
  let result = text;
  for (const [param, value] of Object.entries(params)) {
    result = result.replace(`{${param}}`, value);
  }
  return result;
}

// State
let jsonFile = null;
let mediaFiles = [];
let statusLog = [];
let isScanning = false;
let isAborted = false;

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
const compatWarning = document.getElementById('compatWarning');
const compatWarningList = document.getElementById('compatWarningList');

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
      addLog(t('processingVideo', { name: currentProcessingName, percent: p }), 'info', 'current_video');
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
  // Language Switcher
  const langEnBtn = document.getElementById('langEnBtn');
  const langDeBtn = document.getElementById('langDeBtn');
  
  if (langEnBtn) langEnBtn.addEventListener('click', () => setLanguage('en'));
  if (langDeBtn) langDeBtn.addEventListener('click', () => setLanguage('de'));

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
      folderList.innerHTML = `<div class="file-item"><span class="file-item__name">⏳ ${t('readingFiles', { count: e.target.files.length })}</span></div>`;
      
      progressSection.classList.add('progress-section--visible');
      progressFill.style.width = '100%';
      progressFill.style.transition = 'none';
      progressText.textContent = t('readingFiles', { count: e.target.files.length });
      
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

  updateCompatibilityWarning();
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
    
    progressText.textContent = t('analyzingFiles', { count: filesToScan.length });
    folderList.innerHTML = `<div class="file-item"><span class="file-item__name">⏳ ${t('analyzingFiles', { count: filesToScan.length })}</span></div>`;
    await new Promise(r => setTimeout(r, 50));
    
    await scanFiles(filesToScan);
    statusLog = [];
  } catch (err) {
    addLog(`${currentLanguage === 'de' ? '❌ Fehler beim Lesen des Ordners: ' : '❌ Error reading folder: '} + ${err.message}`, 'error');
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
    
    if (jsonFile) {
        folderList.innerHTML += `<div class="file-item"><span class="file-item__name">${currentLanguage === 'de' ? '✅ memories_history.json gefunden' : '✅ memories_history.json found'}</span><span class="file-item__size">${formatBytes(jsonFile.size)}</span></div>`;
    } else {
        folderList.innerHTML += `<div class="file-item"><span class="file-item__name" style="color: var(--c-error)">${currentLanguage === 'de' ? '❌ memories_history.json fehlt' : '❌ memories_history.json missing'}</span></div>`;
    }
    
    if (mediaFiles.length > 0) {
        const totalSize = mediaFiles.reduce((sum, file) => sum + file.size, 0);
        folderList.innerHTML += `<div class="file-item"><span class="file-item__name">✅ ${mediaFiles.length} ${currentLanguage === 'de' ? 'Mediadateien gefunden' : 'media files found'}</span><span class="file-item__size">${formatBytes(totalSize)}</span></div>`;
    } else {
        folderList.innerHTML += `<div class="file-item"><span class="file-item__name" style="color: var(--c-error)">❌ Keine Mediadateien gefunden</span></div>`;
    }
  }

  processBtn.disabled = !jsonFile || mediaFiles.length === 0;
}

/**
 * Clear all data
 */
function handleClear() {
  isAborted = true; // Signal active runs to stop
  if (ffmpegInstance) {
    try {
      ffmpegInstance.terminate(); // Force kill running FFmpeg
    } catch (e) {}
    ffmpegInstance = null;
  }

  jsonFile = null;
  mediaFiles = [];
  statusLog = [];
  ffmpegLoadError = null; // Reset FFmpeg error state text
  folderList.classList.add('file-list--empty');
  statusBox.classList.remove('status-box--visible');
  progressSection.classList.remove('progress-section--visible');
  processBtn.disabled = false;
  folderInput.value = '';
  updateProgress(0, 1);
  updateUI();
}

function updateCompatibilityWarning() {
  if (!compatWarning || !compatWarningList) return;

  const ua = navigator.userAgent || '';
  const uaData = navigator.userAgentData;
  const isMobile = (uaData && uaData.mobile) || /Android|iPhone|iPad|iPod|Mobile/i.test(ua) || (navigator.maxTouchPoints > 1 && matchMedia('(pointer: coarse)').matches);
  const isFirefox = /Firefox/i.test(ua);
  const isSafari = /Safari/i.test(ua) && !/Chrome|Chromium|Edg|OPR/i.test(ua);
  const supportsSavePicker = 'showSaveFilePicker' in window && window.isSecureContext;

  const messages = [];

  if (isMobile) {
    messages.push({
      title: t('mobileWarning'),
      text: t('mobileWarningText'),
    });
  }

  if (!supportsSavePicker || isFirefox || isSafari) {
    messages.push({
      title: t('browserWarning'),
      text: t('browserWarningText'),
    });
  }

  if (messages.length === 0) {
    compatWarning.hidden = true;
    compatWarningList.innerHTML = '';
    return;
  }

  compatWarning.hidden = false;
  compatWarningList.innerHTML = messages.map((message) => `
    <p style="margin: 0; color: var(--c-text);">
      <strong>${message.title}:</strong> ${message.text}
    </p>
  `).join('');
}

function setLanguage(lang) {
  currentLanguage = lang;
  localStorage.setItem('lang', lang);
  
  // Update button states
  const langEnBtn = document.getElementById('langEnBtn');
  const langDeBtn = document.getElementById('langDeBtn');
  if (langEnBtn) {
    langEnBtn.classList.toggle('active', lang === 'en');
    langEnBtn.setAttribute('aria-pressed', lang === 'en' ? 'true' : 'false');
  }
  if (langDeBtn) {
    langDeBtn.classList.toggle('active', lang === 'de');
    langDeBtn.setAttribute('aria-pressed', lang === 'de' ? 'true' : 'false');
  }
  
  updateCompatibilityWarning();
  updatePageLanguage();
}

function updatePageLanguage() {
  // Update page heading and description
  const headerBadge = document.querySelector('.header-badge span');
  if (headerBadge) headerBadge.textContent = t('localPrivate');
  
  const h1 = document.querySelector('h1');
  if (h1) h1.textContent = t('pageTitle');
  
  const headerDesc = document.querySelector('.header p');
  if (headerDesc) headerDesc.textContent = t('pageDescription');
  
  // Update compatibility warning heading
  const compatWarningH3 = document.querySelector('#compatWarning h3');
  if (compatWarningH3) compatWarningH3.textContent = currentLanguage === 'de' ? '⚠️ Wichtige Systemanforderungen' : '⚠️ Important System Requirements';
  
  // Update skip link
  const skipLink = document.querySelector('.skip-link');
  if (skipLink) skipLink.textContent = currentLanguage === 'de' ? 'Zum Hauptinhalt springen' : 'Skip to main content';
  
  // Update section headings and descriptions - Why use this tool
  // Find the section with 💡 in the h2
  const allSections = document.querySelectorAll('section');
  for (const section of allSections) {
    const h2 = section.querySelector('h2');
    if (h2 && h2.textContent.includes('💡')) {
      h2.textContent = '💡 ' + t('whyUseTitle');
      const p = section.querySelector('p');
      if (p) p.textContent = t('whyUseText');
      
      // Update bullet points
      const ul = section.querySelector('ul');
      if (ul) {
        const lis = ul.querySelectorAll('li');
        if (lis[0]) lis[0].innerHTML = '<strong>✨ ' + t('whyUsePoint1').split(':')[0] + ':</strong> ' + t('whyUsePoint1').split(':')[1];
        if (lis[1]) lis[1].innerHTML = '<strong>🗓️ ' + t('whyUsePoint2').split(':')[0] + ':</strong> ' + t('whyUsePoint2').split(':')[1];
        if (lis[2]) lis[2].innerHTML = '<strong>🔐 ' + t('whyUsePoint3').split(':')[0] + ':</strong> ' + t('whyUsePoint3').split(':')[1];
      }
      break;
    }
  }
  
  // Update "How to get Snapchat export" section - find by h2 text content
  const sections = document.querySelectorAll('section');
  for (const section of sections) {
    const h2 = section.querySelector('h2');
    if (h2 && (h2.textContent.includes('How do I') || h2.textContent.includes('Wie erhalte'))) {
      h2.textContent = t('howToGetTitle');
      const p = section.querySelector('p');
      if (p) p.innerHTML = t('howToGetText');
      break;
    }
  }
  
  for (const section of sections) {
    const h2 = section.querySelector('h2');
    if (h2 && (h2.textContent.includes('Snapchat Ordner') || h2.textContent.includes('Select Snapchat') || h2.textContent.includes('1.'))) {
      h2.textContent = t('step1Title');
      const p = section.querySelector('p');
      if (p) p.innerHTML = t('step1Description');
      
      const uploadZone = section.querySelector('.upload-zone');
      if (uploadZone) {
        const strong = uploadZone.querySelector('strong');
        const span = uploadZone.querySelector('span');
        if (strong) strong.textContent = t('selectFolder');
        if (span) span.textContent = t('dragFolder');
        uploadZone.setAttribute('aria-label', currentLanguage === 'de' ? 'Ordner hochladen' : 'Upload folder');
      }
    }
  }
  
  // Update Step 2 (Processing)
  for (const section of sections) {
    const h2 = section.querySelector('h2');
    if (h2 && (h2.textContent.includes('Verarbeitung') || h2.textContent.includes('Processing') || h2.textContent.includes('2.'))) {
      h2.textContent = t('step2Title');
      const p = section.querySelector('p');
      if (p) p.innerHTML = t('step2Description');
      
      const progressSection = section.querySelector('.progress-section');
      if (progressSection) {
        progressSection.setAttribute('aria-label', currentLanguage === 'de' ? 'Fortschritt' : 'Progress');
      }
      
      const actions = section.querySelector('.actions');
      if (actions) {
        const btns = actions.querySelectorAll('.btn');
        for (const btn of btns) {
          if (btn.classList.contains('btn-secondary')) btn.textContent = t('reset');
          if (btn.classList.contains('btn-primary')) btn.textContent = t('startProcessing');
        }
      }
    }
  }
  
  // Update footer
  const footer = document.querySelector('footer');
  if (footer) {
    const footerParagraphs = footer.querySelectorAll('p');
    if (footerParagraphs[0]) footerParagraphs[0].innerHTML = `<strong>${t('privacy100')}:</strong> ${t('privacyDesc')}`;
    if (footerParagraphs[1]) footerParagraphs[1].textContent = t('privacyNote');
    if (footerParagraphs[2]) footerParagraphs[2].innerHTML = `<strong>⚖️ ${t('disclaimer')}:</strong> ${t('disclaimerText')}`;
  }
}

function initLanguage() {
  const saved = localStorage.getItem('lang');
  if (saved && (saved === 'en' || saved === 'de')) {
    currentLanguage = saved;
  } else {
    currentLanguage = 'en'; // Default to English
  }
  
  const langEnBtn = document.getElementById('langEnBtn');
  const langDeBtn = document.getElementById('langDeBtn');
  if (langEnBtn) langEnBtn.classList.toggle('active', currentLanguage === 'en');
  if (langDeBtn) langDeBtn.classList.toggle('active', currentLanguage === 'de');
  
  updatePageLanguage();
}

/**
 * Process memories
 */
async function handleProcess() {
  isAborted = false;
  statusLog = [];
  progressSection.classList.add('progress-section--visible');
  processBtn.disabled = true;
  
  let writableStream = null;
  let fileHandle = null;

  if ('showSaveFilePicker' in window) {
    try {
      fileHandle = await window.showSaveFilePicker({
        suggestedName: `snapchat-export-${new Date().toISOString().split('T')[0]}.zip`,
        types: [{
          description: 'ZIP Archiv',
          accept: { 'application/zip': ['.zip'] },
        }],
      });
      writableStream = await fileHandle.createWritable();
      addLog(t('filePickerSet'), 'ok');
    } catch (e) {
      if (e.name === 'AbortError') {
        progressSection.classList.remove('progress-section--visible');
        processBtn.disabled = false;
        return;
      }
      addLog(t('uploadHint'), 'warn');
    }
  } else {
    if (!window.isSecureContext) {
      addLog(t('offlineHint'), 'warn');
    } else {
      addLog(t('browserHint'), 'warn');
    }
  }

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
    addLog(`📁 ${t('indexComplete')}`);
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

    addLog(t('found', { images: imageGroups.length, videos: videoGroups.length }), 'ok');
    
    let globalProcessed = 0;
    const totalToProcess = allGroups.length;

    if (writableStream) {
      if (imageGroups.length > 0) {
        addLog(t('processingImages'));
        await asyncPool(imageGroups, async ([mid, files]) => {
          await processAndZip(mid, files, zip, history);
          globalProcessed++;
          updateProgress(globalProcessed, totalToProcess);
        }, 4);
      }

      if (videoGroups.length > 0) {
        addLog(t('processingVideos'));
        
        let videoCounter = 0;
        const RESET_THRESHOLD = 10;

        for (const group of videoGroups) {
            if (isAborted) break;

            if (videoCounter > 0 && videoCounter % RESET_THRESHOLD === 0) {
                if (ffmpegInstance) {
                    console.log('Resetting FFmpeg to prevent memory issues...');
                    await ffmpegInstance.terminate();
                    ffmpegInstance = null;
                }
            }

            const [mid, files] = group;
            await processAndZip(mid, files, zip, history);
            
            globalProcessed++;
            updateProgress(globalProcessed, totalToProcess);
            videoCounter++;
        }
    }

      statusLog = statusLog.filter(item => item.id !== 'current_video');
      updateStatus();

      addLog(t('streamingFiles'), 'ok');
      
      const zipStream = zip.generateInternalStream({ 
        type: 'uint8array',
        compression: 'STORE',
        streamFiles: true 
      });

      await new Promise((resolve, reject) => {
        zipStream.on('data', async (data, metadata) => {
          zipStream.pause();
          try {
            await writableStream.write(data);
            updateProgress(metadata.percent, 100);
            zipStream.resume();
          } catch(e) {
            reject(e);
          }
        })
        .on('error', (err) => reject(err))
        .on('end', async () => {
          try {
            await writableStream.close();
            resolve();
          } catch(e) {
            reject(e);
          }
        });
      });

      addLog(t('fileSaved'), 'ok');
    } else {
      const TARGET_CHUNK_BYTES = 1500 * 1000 * 1000; // ~1,5 GB
      const memoryChunks = [];
      let currentChunk = [];
      let currentChunkSize = 0;

      for (const group of allGroups) {
        const [mid, ObjectFiles] = group;
        let size = ObjectFiles.main.file.size;
        if (ObjectFiles.overlay) {
          size += ObjectFiles.overlay.file.size;
        }

        if (currentChunkSize + size > TARGET_CHUNK_BYTES && currentChunk.length > 0) {
          memoryChunks.push(currentChunk);
          currentChunk = [];
          currentChunkSize = 0;
        }
        
        currentChunk.push(group);
        currentChunkSize += size;
      }
      
      if (currentChunk.length > 0) {
        memoryChunks.push(currentChunk);
      }

      const totalParts = memoryChunks.length;
      let partNumber = 1;
      
      if (totalParts > 1) {
        addLog(t('chunking', { parts: totalParts }), 'info');
      }

      for (const chunk of memoryChunks) {
        const chunkZip = new JSZip();
        
        const cImages = chunk.filter(([_, f]) => IMAGE_EXTENSIONS.has(f.main.info.ext.toLowerCase()));
        const cVideos = chunk.filter(([_, f]) => VIDEO_EXTENSIONS.has(f.main.info.ext.toLowerCase()));
        
        if (cImages.length > 0) {
          addLog(t('processingImagesPart', { part: partNumber, total: totalParts }));
          await asyncPool(cImages, async ([mid, files]) => {
            await processAndZip(mid, files, chunkZip, history);
            globalProcessed++;
            updateProgress(globalProcessed, totalToProcess);
          }, 2);
        }
        
        if (cVideos.length > 0) {
            addLog(t('processingVideosPart', { part: partNumber, total: totalParts }));
            
            let chunkVideoCounter = 0;
            const CHUNK_RESET_LIMIT = 5;

            for (const group of cVideos) {
                if (isAborted) break;

                if (chunkVideoCounter > 0 && chunkVideoCounter % CHUNK_RESET_LIMIT === 0) {
                    if (ffmpegInstance) {
                        console.log('Resetting FFmpeg for memory protection between video chunks...');
                        await ffmpegInstance.terminate();
                        ffmpegInstance = null;
                    }
                }

                const [mid, files] = group;
                await processAndZip(mid, files, chunkZip, history);
                
                globalProcessed++;
                updateProgress(globalProcessed, totalToProcess);
                chunkVideoCounter++;
            }
        }
        
        statusLog = statusLog.filter(item => item.id !== 'current_video');
        updateStatus();
        
        addLog(t('downloadingPart', { part: partNumber }), 'info');
        const zipBlob = await chunkZip.generateAsync({ 
          type: 'blob',
          compression: 'STORE',
        });
        
        const url = URL.createObjectURL(zipBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = totalParts > 1 ? `snapchat-export-part${partNumber}.zip` : `snapchat-export-${new Date().toISOString().split('T')[0]}.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        setTimeout(() => URL.revokeObjectURL(url), 10000);
        partNumber++;
      }
      addLog(t('allComplete'), 'ok');
    }

  } catch (e) {
    if (e.message && e.message.includes('Vorgang abgebrochen')) {
      addLog(t('abortedByUser'), 'warn');
    } else {
      addLog(t('criticalError', { msg: e.message }), 'error');
      console.error(e);
    }
  } finally {
    if (ffmpegInstance) {
      try {
        await ffmpegInstance.terminate();
      } catch (err) {}
      ffmpegInstance = null;
    }
    
    if (!isAborted) {
      try { await clearCache(); } catch(e) {}
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

    addLog(t('jsonParsed', { count: Object.keys(result).length }), 'ok');
    return result;
  } catch (e) {
    addLog(t('jsonParseError', { msg: e.message }), 'error');
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
  const mid = files.main.info.mid;
  try {
    const cached = await getFromCache(mid);
    if (cached) {
      return cached;
    }
  } catch (e) {
    console.error(`Cache-Fehler für ${mid}:`, e);
  }

  const mainFile = files.main.file;
  const overlayFile = files.overlay ? files.overlay.file : null;
  const ext = mainFile.name.split('.').pop().toLowerCase();
  const isVideo = VIDEO_EXTENSIONS.has(ext);

  const { needDate, needLoc, date } = await getMissingMetadata(mainFile, meta);
  const needsOverlay = !!overlayFile;

  let currentFile = mainFile;

  if (isVideo && (needsOverlay || needDate || needLoc)) {
    try {
      currentFile = await processVideoWithFFmpeg(mainFile, overlayFile, needDate, needLoc, date, meta);
    } catch (err) {
      addLog(`⚠️ ${mainFile.name}: ${err.message}. ${currentLanguage === 'de' ? 'Original wird beibehalten.' : 'Original will be preserved.'}`, 'error');
      console.error(`${currentLanguage === 'de' ? 'Fehler bei' : 'Error at'} ${mainFile.name}:`, err);
    }
    const finalBuffer = await currentFile.arrayBuffer();
    try { await saveToCache(mid, finalBuffer); } catch(e) {}
    return finalBuffer;
  }

  if (!isVideo && needsOverlay && IMAGE_EXTENSIONS.has(ext)) {
    currentFile = await mergeImageOverlay(mainFile, overlayFile);
  }

  if (!isVideo && IMAGE_EXTENSIONS.has(ext)) {
    const finalBuffer = await applyPiexif(currentFile, meta, needDate, needLoc, date);
    try { await saveToCache(mid, finalBuffer); } catch(e) {}
    return finalBuffer;
  }

  const finalBuffer = await currentFile.arrayBuffer();
  try { await saveToCache(mid, finalBuffer); } catch(e) {}
  return finalBuffer;
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
  const errorLogBuffer = [];
  const logHandler = ({ message }) => errorLogBuffer.push(message);
  ffmpeg.on('log', logHandler);

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
    if (exitCode !== 0) {
      const logText = errorLogBuffer.join('\n');
      if (logText.includes('Invalid data found') || logText.includes('moov atom not found')) {
        throw new Error(t('corruptVideo'));
      }
      throw new Error(t('ffmpegError', { code: exitCode }));
    }

    const data = await ffmpeg.readFile(outName);
    return new File([data.buffer], mainFile.name, { type: mainFile.type });

  } finally {
    ffmpeg.off('log', logHandler);
    const files = await ffmpeg.listDir('/'); 
    try {
        for (const file of files) {
            if (!file.isDir) await ffmpeg.deleteFile(file.name);
        }
    } catch (e) {
    console.error(`${currentLanguage === 'de' ? 'Fehler beim Löschen von' : 'Error deleting'} ${f} ${currentLanguage === 'de' ? 'aus virtuellem FS' : 'from virtual FS'}:`, e);
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
  
  let processedFile = null;
  try {
    processedFile = await processMediaGroup(files, meta);
    const filename = `${mainFile.info.prefix}_${mid}.${mainFile.info.ext}`;
    zip.file(filename, processedFile, { compression: "STORE" });
  } catch (e) {
    addLog(t('errorProcessing', { file: mainFile.file.name, msg: e.message }), 'error');
  } finally {
    processedFile = null;
    if (files.main.file) files.main.file = null;
    if (files.overlay && files.overlay.file) files.overlay.file = null; 
  }
}

async function asyncPool(iterable, iteratorFn, concurrencyLimit) {
  const result = [];
  const executing = new Set();

  for (const item of iterable) {
    if (isAborted) throw new Error(t('abortedByUser'));

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
  progressFill.setAttribute('aria-valuemin', '0');
  progressFill.setAttribute('aria-valuemax', '100');
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

const dbName = 'MemoriesRestorerDB';
const storeName = 'processedFiles';

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, 1);
    request.onupgradeneeded = (e) => {
      e.target.result.createObjectStore(storeName);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function saveToCache(mid, buffer) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    store.put(buffer, mid);
    tx.oncomplete = resolve;
    tx.onerror = reject;
  });
}

async function getFromCache(mid) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const req = store.get(mid);
    req.onsuccess = () => resolve(req.result);
    req.onerror = reject;
  });
}

async function clearCache() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    tx.objectStore(storeName).clear();
    tx.oncomplete = resolve;
    tx.onerror = reject;
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initLanguage();
  initEventListeners();
});
