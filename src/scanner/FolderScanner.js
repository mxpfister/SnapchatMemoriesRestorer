import { getIsScanning, setIsScanning, getJsonFile, setJsonFile, getMediaFiles, setMediaFiles, getUploadSources, setUploadSources, setStatusLog } from '../state.js';
import { updateUI, addLog } from '../ui/UIController.js';
import { t } from '../i18n.js';
import { IMAGE_EXTENSIONS, VIDEO_EXTENSIONS } from '../constants.js';

export /**
 * Handle drag over event
 */
function handleDragOver(e) {
  e.preventDefault();
  e.currentTarget.classList.add('dragover');
}

export /**
 * Handle drag leave event
 */
function handleDragLeave(e) {
  if (e.currentTarget === e.target) {
    e.currentTarget.classList.remove('dragover');
  }
}

export /**
 * Handle folder/file drop
 */
async function handleFolderDrop(e) {
  e.preventDefault();
  e.currentTarget.classList.remove('dragover');
  
  if (getIsScanning()) return;
  const items = e.dataTransfer.items;
  if (!items) return;
  
  setIsScanning(true);
  let scannedCount = 0;
  
  const folderList = document.getElementById('folderList');
  const progressSection = document.getElementById('progressSection');
  const progressFill = document.getElementById('progressFill');
  const progressText = document.getElementById('progressText');
  
  folderList.classList.remove('file-list--empty');
  folderList.innerHTML = `<div class="file-item"><span class="file-item__name">${t('scanFolderZero')}</span></div>`;
  
  // Use existing progress bar for scanning
  progressSection.classList.add('progress-section--visible');
  progressFill.style.width = '100%';
  progressFill.style.transition = 'none';
  progressText.textContent = t('scanningDir');
  
  const filesToScan = [];

  // Recursive function to read directory entries
  async function readEntry(entry) {
    if (entry.isFile) {
      const file = await new Promise(resolve => entry.file(resolve));
      filesToScan.push(file);
      scannedCount++;
      if (scannedCount % 500 === 0) {
        folderList.innerHTML = `<div class="file-item"><span class="file-item__name">${t('readingFilesFound', { count: scannedCount })}</span></div>`;
        progressText.textContent = t('filesFoundText', { count: scannedCount });
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
    setStatusLog([]);
  } catch (err) {
    console.error(err);
    addLog(t('errorReadingFolder', { msg: err.message }), 'error');
  } finally {
    setIsScanning(false);
    progressSection.classList.remove('progress-section--visible');
    progressFill.style.transition = '';
  }
}

export /**
 * Scan gathered files and sort them into JSON or Media
 */
async function scanFiles(filesArray) {
  const mediaMap = new Map();
  const jsonFiles = [];
  const foundMemoriesDir = filesArray.some(f => f.webkitRelativePath?.includes('memories/'));
  
  for (let f of getMediaFiles()) {
      mediaMap.set(f.name + '_' + f.size, f);
  }
  
  for (let file of filesArray) {
    const name = file.name.toLowerCase();
    
    if (name === 'memories_history.json') {
      jsonFiles.push(file);
      if (!getJsonFile()) {
        setJsonFile(file);
        getUploadSources().push({ name: 'json' });
      }
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
  
  // Track if memories folder was found (for multi-ZIP support)
  if (foundMemoriesDir && !getUploadSources().some(s => s.name === 'memories')) {
    getUploadSources().push({ name: 'memories' });
  }
  
  setMediaFiles(Array.from(mediaMap.values()));
  updateUI();
}
