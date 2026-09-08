
let jsonFile = null;
let mediaFiles = [];
let statusLog = [];
let isScanning = false;
let isAborted = false;
let uploadSources = [];
let wakeLockSentinel = null;
let processingStartTime = null;
let currentLanguage = 'en';
let ffmpegInstance = null;
let currentProcessingName = '';
let ffmpegBlobs = null;
let ffmpegLoadError = null;

export const getJsonFile = () => jsonFile;
export const setJsonFile = (val) => jsonFile = val;

export const getMediaFiles = () => mediaFiles;
export const setMediaFiles = (val) => mediaFiles = val;

export const getStatusLog = () => statusLog;
export const setStatusLog = (val) => statusLog = val;

export const getIsScanning = () => isScanning;
export const setIsScanning = (val) => isScanning = val;

export const getIsAborted = () => isAborted;
export const setIsAborted = (val) => isAborted = val;

export const getUploadSources = () => uploadSources;
export const setUploadSources = (val) => uploadSources = val;

export const getWakeLockSentinel = () => wakeLockSentinel;
export const setWakeLockSentinel = (val) => wakeLockSentinel = val;

export const getProcessingStartTime = () => processingStartTime;
export const setProcessingStartTime = (val) => processingStartTime = val;

export const getCurrentLanguage = () => currentLanguage;
export const setCurrentLanguage = (val) => currentLanguage = val;

export const getFfmpegInstance = () => ffmpegInstance;
export const setFfmpegInstance = (val) => ffmpegInstance = val;

export const getCurrentProcessingName = () => currentProcessingName;
export const setCurrentProcessingName = (val) => currentProcessingName = val;

export const getFfmpegBlobs = () => ffmpegBlobs;
export const setFfmpegBlobs = (val) => ffmpegBlobs = val;

export const getFfmpegLoadError = () => ffmpegLoadError;
export const setFfmpegLoadError = (val) => ffmpegLoadError = val;
