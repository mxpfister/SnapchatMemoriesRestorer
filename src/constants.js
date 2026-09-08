export const MAIN_RE = /^(?<prefix>\d{4}-\d{2}-\d{2})_(?<mid>[a-fA-F0-9-]{36})-main\.(?<ext>[^.]+)$/;
export const OVERLAY_RE = /^(?<prefix>\d{4}-\d{2}-\d{2})_(?<mid>[a-fA-F0-9-]{36})-overlay\.(?<ext>[^.]+)$/;
export const IMAGE_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'heic', 'heif', 'webp']);
export const VIDEO_EXTENSIONS = new Set(['mp4', 'mov', 'm4v', 'avi', 'mkv', 'webm']);
