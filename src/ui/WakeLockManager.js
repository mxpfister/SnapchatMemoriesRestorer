import { getWakeLockSentinel, setWakeLockSentinel } from '../state.js';

export /**
 * Request wake lock to prevent screen from locking during processing
 */
async function requestWakeLock() {
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

export /**
 * Release wake lock after processing is complete
 */
async function releaseWakeLock() {
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
