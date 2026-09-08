import { getFfmpegInstance, setFfmpegInstance, getCurrentProcessingName, setCurrentProcessingName, getFfmpegBlobs, setFfmpegBlobs, getCurrentLanguage } from '../state.js';
import { addLog } from '../ui/UIController.js';
import { t } from '../i18n.js';

export async function getFFmpeg() {
  const ffmpegInstance = getFfmpegInstance(); if (ffmpegInstance) return ffmpegInstance;

  const blobs = await getFFmpegBlobs();
  const { FFmpeg } = window.FFmpegWASM;
  const ffmpeg = new FFmpeg();

  ffmpeg.on('progress', ({ progress }) => {
    const p = Math.round(progress * 100);
    if (p > 0 && p <= 100) {
      addLog(t('processingVideo', { name: getCurrentProcessingName(), percent: p }), 'info', 'current_video');
    }
  });

  await ffmpeg.load({
    coreURL: blobs.coreBlobURL,
    wasmURL: blobs.wasmBlobURL,
    classWorkerURL: blobs.workerBlobURL,
  });

  setFfmpegInstance(ffmpeg);
  return ffmpeg;
}

/**
 * Calculate dynamic timeout for FFmpeg video processing
 */
function getVideoTimeout(fileSize, hasOverlay) {
  const baseSec = 60;
  const sizeMB = fileSize / (1024 * 1024);
  if (hasOverlay) {
    // Re-encode with libx264: ~20 sec per MB in WASM
    return Math.max(baseSec, sizeMB * 20) * 1000;
  } else {
    // Stream copy (metadata only): ~2 sec per MB
    return Math.max(baseSec, sizeMB * 2) * 1000;
  }
}

/**
 * Handle video manipulation with FFmpeg 
 */
export async function processVideoWithFFmpeg(mainFile, overlayFile, needDate, needLoc, date, meta) {
  const ffmpeg = await getFFmpeg();
  const { fetchFile } = window.FFmpegUtil;

  const mainName = 'input_main.mp4';
  const overlayName = 'input_overlay.png';
  const outName = 'output_final.mp4';

  setCurrentProcessingName(mainFile.name);

  try {
    await ffmpeg.writeFile(mainName, await fetchFile(mainFile));

    let cmd = ['-y', '-i', mainName];
    const hasOverlay = !!overlayFile;

    if (hasOverlay) {
      await ffmpeg.writeFile(overlayName, await fetchFile(overlayFile));
      cmd.push('-i', overlayName);
      
      cmd.push('-filter_complex', '[1:v][0:v]scale2ref=w=iw:h=ih[ovrl][vid];[ovrl]setsar=1[ovrl_fixed];[vid][ovrl_fixed]overlay=0:0:format=auto');
      
      cmd.push('-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '23', '-preset', 'ultrafast');
    } else {
      cmd.push('-c:v', 'copy');
    }

    cmd.push('-c:a', 'copy');

    if (needDate && date) {
      const isoDate = date.toISOString();
      cmd.push('-metadata', `creation_time=${isoDate}`);
      cmd.push('-metadata:s:v:0', `creation_time=${isoDate}`);
      cmd.push('-movflags', '+faststart+use_metadata_tags');
    }
    if (needLoc) {
      const lat = meta.latitude >= 0 ? `+${meta.latitude.toFixed(4)}` : `${meta.latitude.toFixed(4)}`;
      const lon = meta.longitude >= 0 ? `+${meta.longitude.toFixed(4)}` : `${meta.longitude.toFixed(4)}`;
      cmd.push('-metadata', `location=${lat}${lon}/`);
    }

    cmd.push(outName);

    // Execute with dynamic timeout to prevent hanging on corrupt videos
    const timeoutMs = getVideoTimeout(mainFile.size, hasOverlay);
    let timeoutId;
    const timeoutPromise = new Promise((_, reject) => {
      timeoutId = setTimeout(() => reject(new Error(t('ffmpegTimeout', { name: mainFile.name }))), timeoutMs);
    });

    const exitCode = await Promise.race([ffmpeg.exec(cmd), timeoutPromise]);
    clearTimeout(timeoutId);
    if (exitCode !== 0) throw new Error(t('ffmpegError', { code: exitCode }));

    const data = await ffmpeg.readFile(outName);
    return new File([data.buffer], mainFile.name, { type: 'video/mp4' });

  } catch (err) {
    // On timeout or error, terminate FFmpeg for clean restart with next video
    const ffmpegInstance = getFfmpegInstance(); if (getFfmpegInstance()) {
      try { getFfmpegInstance().terminate(); } catch(e) {}
      setFfmpegInstance(null);
    }
    throw err;
  } finally {
    // Only cleanup if ffmpeg instance is still alive
    const ffmpegInstance = getFfmpegInstance(); if (getFfmpegInstance()) {
      await ffmpeg.deleteFile(mainName).catch(() => {});
      if (overlayFile) await ffmpeg.deleteFile(overlayName).catch(() => {});
      await ffmpeg.deleteFile(outName).catch(() => {});
    }
  }
}

export 
async function getFFmpegBlobs() {
  const ffmpegBlobs = getFfmpegBlobs(); if (ffmpegBlobs) return ffmpegBlobs;
  
  addLog(t('ffmpegLoading'));

  try {
    const { toBlobURL } = window.FFmpegUtil;

    const coreBlobURL = await toBlobURL('vendor/ffmpeg-core.js', 'text/javascript');
    const wasmBlobURL = await toBlobURL('vendor/ffmpeg-core.wasm', 'application/wasm');
    const workerBlobURL = await toBlobURL('vendor/814.ffmpeg.js', 'text/javascript');
    
    setFfmpegBlobs({ coreBlobURL, wasmBlobURL, workerBlobURL });
    addLog(`✅ ${t('ffmpegReady')}`, 'ok');
    return { coreBlobURL, wasmBlobURL, workerBlobURL };
  } catch (e) {
    addLog(`❌ ${t('ffmpegBufferError', { msg: e.message })}`, 'error');
    console.error("FFmpeg Buffer Error:", e);
    throw e;
  }
}
