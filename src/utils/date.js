
export /**
 * Parse Snapchat date format.
 * Returns null if the string is empty or produces an invalid Date.
 * Note: new Date() never throws – it returns an Invalid Date object,
 * so we must validate with isNaN() instead of try/catch.
 */
function parseSnapchatDate(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr.replace(' UTC', ' GMT'));
  return isNaN(d.getTime()) ? null : d;
}

export /**
 * Convert degrees to DMS format for EXIF
 */
function degToDms(deg) {
  const d = Math.floor(Math.abs(deg));
  const mf = (Math.abs(deg) - d) * 60;
  const m = Math.floor(mf);
  const s = (mf - m) * 60;
  return [[d, 1], [m, 1], [Math.round(s * 10000), 10000]];
}
