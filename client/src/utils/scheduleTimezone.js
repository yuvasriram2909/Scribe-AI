/**
 * Scribe AI - Timezone & Dynamic Schedule Utility
 * Handles IANA timezones, daylight saving time (DST) calculations,
 * local-to-UTC conversion, and schedule validation.
 */

export const POPULAR_TIMEZONES = [
  { id: 'Asia/Kolkata', label: 'Asia/Kolkata (IST, UTC+5:30)', region: 'India' },
  { id: 'America/New_York', label: 'America/New_York (Eastern, UTC-5/4)', region: 'US & Canada' },
  { id: 'America/Chicago', label: 'America/Chicago (Central, UTC-6/5)', region: 'US & Canada' },
  { id: 'America/Denver', label: 'America/Denver (Mountain, UTC-7/6)', region: 'US & Canada' },
  { id: 'America/Los_Angeles', label: 'America/Los_Angeles (Pacific, UTC-8/7)', region: 'US & Canada' },
  { id: 'Europe/London', label: 'Europe/London (GMT/BST, UTC+0/1)', region: 'Europe' },
  { id: 'Europe/Paris', label: 'Europe/Paris (CET/CEST, UTC+1/2)', region: 'Europe' },
  { id: 'Europe/Berlin', label: 'Europe/Berlin (CET/CEST, UTC+1/2)', region: 'Europe' },
  { id: 'Asia/Dubai', label: 'Asia/Dubai (GST, UTC+4)', region: 'Middle East' },
  { id: 'Asia/Singapore', label: 'Asia/Singapore (SGT, UTC+8)', region: 'Asia' },
  { id: 'Asia/Tokyo', label: 'Asia/Tokyo (JST, UTC+9)', region: 'Asia' },
  { id: 'Australia/Sydney', label: 'Australia/Sydney (AEST/AEDT, UTC+10/11)', region: 'Australia' },
  { id: 'Pacific/Auckland', label: 'Pacific/Auckland (NZST/NZDT, UTC+12/13)', region: 'Pacific' },
  { id: 'UTC', label: 'UTC (Coordinated Universal Time)', region: 'Global' }
];

/**
 * Safely detects the user's browser/system timezone.
 * Returns IANA timezone string e.g. "Asia/Kolkata" or "America/New_York".
 */
export function getUserTimezone() {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz && typeof tz === 'string' && tz.trim()) {
      return tz.trim();
    }
  } catch (_) {}
  return 'UTC';
}

/**
 * Converts a local date string (YYYY-MM-DD), time string (HH:mm), and IANA timezone
 * to a canonical UTC Date instance.
 * Fully accounts for Daylight Saving Time (DST) transitions.
 */
export function localToUtc(dateStr, timeStr, timeZone = getUserTimezone()) {
  if (!dateStr || !timeStr) return null;
  const [yearStr, monthStr, dayStr] = dateStr.split('-');
  const [hourStr, minuteStr] = timeStr.split(':');

  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const day = parseInt(dayStr, 10);
  const hour = parseInt(hourStr, 10);
  const minute = parseInt(minuteStr, 10);

  if (isNaN(year) || isNaN(month) || isNaN(day) || isNaN(hour) || isNaN(minute)) {
    return null;
  }

  // Initial approximation treating local numbers as UTC
  const approxUtc = new Date(Date.UTC(year, month - 1, day, hour, minute));

  // Determine actual time in target timezone for this approx timestamp
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });

  const parts = dtf.formatToParts(approxUtc);
  const partMap = {};
  for (const p of parts) {
    partMap[p.type] = p.value;
  }

  const tzYear = parseInt(partMap.year, 10);
  const tzMonth = parseInt(partMap.month, 10);
  const tzDay = parseInt(partMap.day, 10);
  let tzHour = parseInt(partMap.hour, 10);
  if (tzHour === 24) tzHour = 0;
  const tzMin = parseInt(partMap.minute, 10);

  const tzAsUtc = Date.UTC(tzYear, tzMonth - 1, tzDay, tzHour, tzMin);
  const diff = approxUtc.getTime() - tzAsUtc;

  return new Date(approxUtc.getTime() + diff);
}

/**
 * Formats a given Date object or ISO string in a specific target timezone
 */
export function formatInTimezone(dateInput, timeZone = getUserTimezone(), formatOptions = {}) {
  try {
    const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (!d || isNaN(d.getTime())) return '';

    const defaultOpts = {
      timeZone,
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    };

    return new Intl.DateTimeFormat('en-US', { ...defaultOpts, ...formatOptions }).format(d);
  } catch (_) {
    return String(dateInput);
  }
}

/**
 * Validates that the selected date and time are strictly in the future
 * Returns { isValid: boolean, error?: string, diffMinutes?: number, utcDate?: Date }
 */
export function validateFutureSchedule(dateStr, timeStr, timeZone = getUserTimezone()) {
  if (!dateStr) {
    return { isValid: false, error: 'Please choose a date.' };
  }
  if (!timeStr) {
    return { isValid: false, error: 'Please choose a time.' };
  }

  const utcDate = localToUtc(dateStr, timeStr, timeZone);
  if (!utcDate || isNaN(utcDate.getTime())) {
    return { isValid: false, error: 'Invalid date or time selected.' };
  }

  const nowMs = Date.now();
  const diffMs = utcDate.getTime() - nowMs;
  const diffMinutes = Math.floor(diffMs / 60000);

  // Require at least 1 minute in the future
  if (diffMs <= 30000) { // less than 30 seconds ahead
    return { 
      isValid: false, 
      error: 'Please select a future time. (The selected time has already passed or is too soon).',
      diffMinutes
    };
  }

  return {
    isValid: true,
    diffMinutes,
    utcDate,
    utcIso: utcDate.toISOString(),
    formattedLocal: formatInTimezone(utcDate, timeZone)
  };
}

/**
 * Gets the current year, month, day, hour, minute in the specified timezone
 * Used to initialize dynamic calendar at the user's actual current local time.
 */
export function getCurrentDateTimeParts(timeZone = getUserTimezone()) {
  const now = new Date();
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });

  const parts = dtf.formatToParts(now);
  const partMap = {};
  for (const p of parts) {
    partMap[p.type] = p.value;
  }

  const year = parseInt(partMap.year, 10);
  const month = parseInt(partMap.month, 10);
  const day = parseInt(partMap.day, 10);
  let hour = parseInt(partMap.hour, 10);
  if (hour === 24) hour = 0;
  const minute = parseInt(partMap.minute, 10);

  // Suggested default time: rounded up to next 30 or 60 minute slot, minimum 1 hour ahead
  let defHour = hour + 1;
  let defDay = day;
  let defMonth = month;
  let defYear = year;
  let defMin = minute >= 30 ? 0 : 30;
  if (minute >= 30) defHour += 1;

  if (defHour >= 24) {
    defHour -= 24;
    defDay += 1;
    // rough days in month wrap
    const daysInM = new Date(year, month, 0).getDate();
    if (defDay > daysInM) {
      defDay = 1;
      defMonth += 1;
      if (defMonth > 12) {
        defMonth = 1;
        defYear += 1;
      }
    }
  }

  const pad = n => String(n).padStart(2, '0');
  const dateStr = `${defYear}-${pad(defMonth)}-${pad(defDay)}`;
  const timeStr = `${pad(defHour)}:${pad(defMin)}`;

  return {
    currentYear: year,
    currentMonth: month,
    currentDay: day,
    currentHour: hour,
    currentMinute: minute,
    defaultDateStr: dateStr,
    defaultTimeStr: timeStr
  };
}
