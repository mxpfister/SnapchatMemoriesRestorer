import { extractMediaInfo } from './JsonHistoryParser.js';

export     function detectTimezoneOffset(sampleFiles, history) {
      // Build day → [epoch_ms] lookup from JSON dates
      const dayToJsonTimes = {};
      for (const [epochMs, meta] of Object.entries(history.byTime)) {
        const match = (meta.dateRaw || '').match(/^(\d{4}-\d{2}-\d{2})/);
        if (match) {
          const day = match[1];
          if (!dayToJsonTimes[day]) dayToJsonTimes[day] = [];
          dayToJsonTimes[day].push(Number(epochMs));
        }
      }
    
      // Sample up to 30 main files
      const sample = sampleFiles
        .filter(f => f.name.includes('-main.'))
        .slice(0, 30);
    
      const diffs = [];
    
      for (const file of sample) {
        const info = extractMediaInfo(file.name);
        if (!info) continue;
    
        // Only compare to JSON entries from the SAME day (filename prefix)
        const jsonTimes = dayToJsonTimes[info.prefix];
        if (!jsonTimes || jsonTimes.length === 0) continue;
    
        const fileTime = file.lastModified;
        let closestDiff = Infinity;
        for (const jt of jsonTimes) {
          const d = jt - fileTime;
          if (Math.abs(d) < Math.abs(closestDiff)) closestDiff = d;
        }
    
        // Sanity: offset must be within ±15 hours (covers all real timezones)
        if (Math.abs(closestDiff) < 15 * 3600 * 1000) {
          diffs.push(closestDiff);
        }
      }
    
      if (diffs.length === 0) return 0;
    
      // Round to nearest 15 minutes and pick the most common value (mode)
      const ROUND_MS = 15 * 60 * 1000;
      const freq = {};
      for (const d of diffs) {
        const rounded = Math.round(d / ROUND_MS) * ROUND_MS;
        freq[rounded] = (freq[rounded] || 0) + 1;
      }
    
      let bestOffset = 0;
      let bestCount = 0;
      for (const [offset, count] of Object.entries(freq)) {
        if (count > bestCount) {
          bestCount = count;
          bestOffset = Number(offset);
        }
      }
    
      console.log(`Timezone auto-detection: offset=${bestOffset / 3600000}h (${bestCount}/${diffs.length} agree)`);
      return bestOffset;
    }

export function resolveMetadata(mid, files, history, tzOffsetMs) {
  // 1. Direct MID match (when download links aren't empty)
  if (history.byMid[mid]) {
    return history.byMid[mid];
  }

  // 2. Timestamp match with auto-detected timezone compensation
  const mainFile = files.main.file;
  if (mainFile && mainFile.lastModified) {
    const adjustedTime = mainFile.lastModified + tzOffsetMs;

    let closestMeta = null;
    let minDiff = Infinity;

    for (const [timeStr, meta] of Object.entries(history.byTime)) {
      const diff = Math.abs(Number(timeStr) - adjustedTime);
      if (diff < 5000 && diff < minDiff) {
        minDiff = diff;
        closestMeta = meta;
      }
    }
    if (closestMeta) return closestMeta;
  }

  // 3. Ultimate fallback: date from filename prefix
  const prefix = files.main.info.prefix;
  if (prefix) {
    return {
      dateRaw: `${prefix} 12:00:00 UTC`,
      latitude: null,
      longitude: null,
    };
  }

  return null;
}
