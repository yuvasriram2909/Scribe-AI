/**
 * ============================================================================
 * Scribe-AI — Date & Time Normalization Utilities (dateUtils.js)
 * ============================================================================
 * Enforces clean, legible 12-hour "normal time" format (with AM/PM) across the UI.
 * Eliminates 24-hour military/railway time and cluttered seconds.
 * Corrects PostgreSQL UTC timezone parsing so local device times match Gmail perfectly.
 */

/**
 * Parses any date input safely into a valid JavaScript Date object.
 * Corrects timezone-less ISO strings (e.g. "2026-09-14T13:10:48") from PostgreSQL
 * by treating them as UTC ('Z'), preventing false local-time offsets.
 *
 * @param {string | number | Date} dateInput
 * @returns {Date | null}
 */
export function parseToValidDate(dateInput) {
  if (!dateInput) return null;
  if (dateInput instanceof Date) {
    return isNaN(dateInput.getTime()) ? null : dateInput;
  }
  if (typeof dateInput === 'number') {
    const d = new Date(dateInput);
    return isNaN(d.getTime()) ? null : d;
  }
  if (typeof dateInput === 'string') {
    let s = dateInput.trim();
    if (!s) return null;

    // Check if numeric timestamp string (e.g. "1726319448000")
    if (/^\d{10,13}$/.test(s)) {
      const d = new Date(Number(s));
      return isNaN(d.getTime()) ? null : d;
    }

    // If string is an ISO datetime without timezone indicator (no 'Z', no '+', no '-HH:MM' after time)
    // E.g. "2026-09-14T13:10:48", "2026-09-14 13:10:48", "2026-09-14T13:10:48.123"
    if (/^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(:\d{2}(\.\d+)?)?$/.test(s)) {
      s = s.replace(' ', 'T') + 'Z';
    }

    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
  }

  const d = new Date(dateInput);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Formats any date input into a clean 12-hour standard date and time string.
 * Automatically converts UTC to client's local device time.
 * Example output: "Sep 14, 2026, 6:40 PM"
 *
 * @param {string | number | Date} dateInput
 * @returns {string}
 */
export function formatNormalDateTime(dateInput) {
  const d = parseToValidDate(dateInput);
  if (!d) return '';

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
 * Example output: "6:40 PM"
 *
 * @param {string | number | Date} dateInput
 * @returns {string}
 */
export function formatNormalTime(dateInput) {
  const d = parseToValidDate(dateInput);
  if (!d) return '';

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
  const d = parseToValidDate(dateInput);
  if (!d) return '';

  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}
