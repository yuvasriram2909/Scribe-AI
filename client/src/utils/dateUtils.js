/**
 * ============================================================================
 * Scribe-AI — Date & Time Normalization Utilities (dateUtils.js)
 * ============================================================================
 * Enforces clean, legible 12-hour "normal time" format (with AM/PM) across the UI.
 * Eliminates 24-hour military/railway time and cluttered seconds.
 */

/**
 * Formats any date input into a clean 12-hour standard date and time string.
 * Example output: "Sep 14, 2026, 1:10 PM"
 *
 * @param {string | number | Date} dateInput
 * @returns {string}
 */
export function formatNormalDateTime(dateInput) {
  if (!dateInput) return '';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '';

  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

/**
 * Formats time only in 12-hour normal format with AM/PM.
 * Example output: "1:10 PM"
 *
 * @param {string | number | Date} dateInput
 * @returns {string}
 */
export function formatNormalTime(dateInput) {
  if (!dateInput) return '';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '';

  return d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

/**
 * Formats date only in clean standard format.
 * Example output: "Sep 14, 2026"
 *
 * @param {string | number | Date} dateInput
 * @returns {string}
 */
export function formatNormalDate(dateInput) {
  if (!dateInput) return '';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '';

  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}
