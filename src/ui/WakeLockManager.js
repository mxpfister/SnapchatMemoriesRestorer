import { getWakeLockSentinel, setWakeLockSentinel } from '../state.js';

/**
 * Request wake lock to prevent screen from locking during processing
 */
export async function requestWakeLock() {
  if (!('wakeLock' in navigator)) {
    console.warn('Screen Wake Lock API not supported in this browser');
    return;
  }
  try {
    setWakeLockSentinel(await navigator.wakeLock.request('screen'));
    console.log('Screen wake lock acquired');
  } catch (err) {
    console.warn('Failed to acquire wake lock:', err);
  }
}

/**
 * Release wake lock after processing is complete
 */
export async function releaseWakeLock() {
  const wakeLockSentinel = getWakeLockSentinel(); if (wakeLockSentinel !== null) {
    try {
      await wakeLockSentinel.release();
      console.log('Screen wake lock released');
    } catch (err) {
      console.warn('Failed to release wake lock:', err);
    }
    setWakeLockSentinel(null);
  }
}
