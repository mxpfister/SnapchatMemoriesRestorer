
/**
 * Parse Snapchat date format.
 * Returns null if the string is empty or produces an invalid Date.
 * Note: new Date() never throws – it returns an Invalid Date object,
 * so we must validate with isNaN() instead of try/catch.
 */
export function parseSnapchatDate(dateStr) {
  if (!dateStr) return null;
  // Convert "YYYY-MM-DD HH:MM:SS UTC" to ISO 8601 "YYYY-MM-DDTHH:MM:SSZ"
  let isoStr = dateStr.replace(' ', 'T').replace(' UTC', 'Z');
  const d = new Date(isoStr);
  
  if (!isNaN(d.getTime())) {
    return d;
  }
  
  // Fallback for Safari if the string format is unexpected (replace dashes with slashes)
  const fallbackDate = new Date(dateStr.replace(/-/g, '/').replace(' UTC', ' GMT'));
  return isNaN(fallbackDate.getTime()) ? null : fallbackDate;
}

/**
 * Convert degrees to DMS format for EXIF
 */
export function degToDms(deg) {
  const d = Math.floor(Math.abs(deg));
  const mf = (Math.abs(deg) - d) * 60;
  const m = Math.floor(mf);
  const s = (mf - m) * 60;
  return [[d, 1], [m, 1], [Math.round(s * 10000), 10000]];
}
