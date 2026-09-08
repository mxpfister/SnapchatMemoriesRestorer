import { getProcessingStartTime, getCurrentLanguage } from '../state.js';

export /**
 * Update progress bar
 */
function updateProgress(current, total) {
  const percent = Math.round((current / total) * 100);
  document.getElementById('progressFill').style.width = percent + '%';
  document.getElementById('progressFill').setAttribute('aria-valuemin', '0');
  document.getElementById('progressFill').setAttribute('aria-valuemax', '100');
  document.getElementById('progressFill').setAttribute('aria-valuenow', percent);
  
  // Show estimated time remaining
  let progressStr = `${percent}%`;
  if (getProcessingStartTime() && current > 0 && current < total) {
    const elapsed = Date.now() - getProcessingStartTime();
    const avgTimePerItem = elapsed / current;
    const remaining = avgTimePerItem * (total - current);
    const remainingMins = Math.ceil(remaining / 60000);
    if (remainingMins > 0) {
      progressStr += getCurrentLanguage() === 'de'
        ? ` \u2014 ~${remainingMins} Min. verbleibend`
        : ` \u2014 ~${remainingMins} min remaining`;
    }
  }
  document.getElementById('progressText').textContent = progressStr;
  
  // Update tab title with progress
  document.title = `(${percent}%) ${getCurrentLanguage() === 'de' ? 'Verarbeitung...' : 'Processing...'} \u2014 Memories Restorer`;
}
