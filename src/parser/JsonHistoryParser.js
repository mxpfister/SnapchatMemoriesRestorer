import { getJsonFile } from '../state.js';
import { addLog } from '../ui/UIController.js';
import { t } from '../i18n.js';
import { parseSnapchatDate } from '../utils/date.js';

/**
 * Parse JSON history file
 */
export async function parseJsonHistory() {
  try {
    const text = await getJsonFile().text();
    const data = JSON.parse(text);
    const items = data['Saved Media'] || [];
    
    const byMid = {};
    const byTime = {};

    for (const item of items) {
      const location = item['Location'];
      const [lat, lon] = parseLocation(location);
      
      const meta = {
        dateRaw: item['Date'],
        latitude: lat,
        longitude: lon,
      };

      let mid = parseMidFromUrl(item['Download Link'] || '');
      if (!mid) mid = parseMidFromUrl(item['Media Download Url'] || '');
      
      if (mid) {
        byMid[mid] = meta;
      }
      
      const dateObj = parseSnapchatDate(item['Date']);
      if (dateObj) {
        byTime[dateObj.getTime()] = meta;
      }
    }

    addLog(t('jsonParsed', { count: items.length }), 'ok');
    return { byMid, byTime };
  } catch (e) {
    addLog(t('jsonParseError', { msg: e.message }), 'error');
    throw e;
  }
}

/**
 * Parse MID from URL
 */
export function parseMidFromUrl(url) {
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
export function parseLocation(location) {
  if (!location) return [null, null];
  const match = location.match(/Latitude, Longitude:\s*([-+]?\d+(?:\.\d+)?),\s*([-+]?\d+(?:\.\d+)?)/);
  if (!match) return [null, null];
  const lat = parseFloat(match[1]);
  const lon = parseFloat(match[2]);
  if (lat === 0 && lon === 0) return [null, null];
  return [lat, lon];
}

/**
 * Extract media info from filename
 */
export function extractMediaInfo(filename) {
  const match = filename.match(/^(\d{4}-\d{2}-\d{2})_([a-fA-F0-9-]{36})-(main|overlay)\.([^.]+)$/i);
  if (!match) return null;
  return {
    prefix: match[1],
    mid: match[2].toLowerCase(),
    type: match[3].toLowerCase(),
    ext: match[4].toLowerCase(),
  };
}
