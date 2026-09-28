import React, { useState, useMemo } from 'react';
import { 
  Clock, Calendar, Globe, AlertCircle, CheckCircle, ChevronLeft, ChevronRight, X, Sparkles, RefreshCw 
} from 'lucide-react';
import { 
  getUserTimezone, 
  POPULAR_TIMEZONES, 
  validateFutureSchedule, 
  formatInTimezone,
  getCurrentDateTimeParts 
} from '../utils/scheduleTimezone';

export function ScheduleModal({ 
  isOpen, 
  onClose, 
  onConfirmSchedule, 
  initialDateStr = '', 
  initialTimeStr = '', 
  initialTimezone = '',
  title = 'Schedule Email Dispatch',
  subtitle = 'Choose any future date, time, and timezone. The user-selected schedule is the source of truth.'
}) {
  if (!isOpen) return null;

  // Initialize with detected user timezone or initialTimezone
  const detectedTz = useMemo(() => getUserTimezone(), []);
  const [selectedTz, setSelectedTz] = useState(() => initialTimezone || detectedTz);

  // Initialize dynamic date & time based on current local moment in selectedTz
  const currentInfo = useMemo(() => getCurrentDateTimeParts(selectedTz), [selectedTz]);

  const [selectedDate, setSelectedDate] = useState(() => initialDateStr || currentInfo.defaultDateStr);
  
  // 12-hour breakdown for time picker
  const [selectedHour12, setSelectedHour12] = useState(() => {
    if (initialTimeStr) {
      const h = parseInt(initialTimeStr.split(':')[0], 10);
      const h12 = h % 12 || 12;
      return String(h12);
    }
    const defH = parseInt(currentInfo.defaultTimeStr.split(':')[0], 10);
    const defH12 = defH % 12 || 12;
    return String(defH12);
  });

  const [selectedMinute, setSelectedMinute] = useState(() => {
    if (initialTimeStr) {
      return initialTimeStr.split(':')[1] || '00';
    }
    return currentInfo.defaultTimeStr.split(':')[1] || '00';
  });

  const [selectedAmPm, setSelectedAmPm] = useState(() => {
    if (initialTimeStr) {
      const h = parseInt(initialTimeStr.split(':')[0], 10);
      return h >= 12 ? 'PM' : 'AM';
    }
    const defH = parseInt(currentInfo.defaultTimeStr.split(':')[0], 10);
    return defH >= 12 ? 'PM' : 'AM';
  });

  // Calendar View month & year (starts dynamically at current month/year, never static)
  const [viewYear, setViewYear] = useState(() => {
    if (selectedDate) return parseInt(selectedDate.split('-')[0], 10);
    return currentInfo.currentYear;
  });

  const [viewMonth, setViewMonth] = useState(() => {
    if (selectedDate) return parseInt(selectedDate.split('-')[1], 10);
    return currentInfo.currentMonth;
  });

  // Calculate 24-hour time string (HH:mm)
  const time24 = useMemo(() => {
    let h = parseInt(selectedHour12, 10);
    if (selectedAmPm === 'PM' && h < 12) h += 12;
    if (selectedAmPm === 'AM' && h === 12) h = 0;
    const pad = n => String(n).padStart(2, '0');
    return `${pad(h)}:${pad(selectedMinute)}`;
  }, [selectedHour12, selectedMinute, selectedAmPm]);

  // Real-time schedule validation
  const validation = useMemo(() => {
    return validateFutureSchedule(selectedDate, time24, selectedTz);
  }, [selectedDate, time24, selectedTz]);

  // Calendar calculations
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysInCurrentMonth = useMemo(() => {
    return new Date(viewYear, viewMonth, 0).getDate();
  }, [viewYear, viewMonth]);

  const firstDayOfWeek = useMemo(() => {
    // 0 = Sunday, 1 = Monday, ...
    return new Date(viewYear, viewMonth - 1, 1).getDay();
  }, [viewYear, viewMonth]);

  const handlePrevMonth = () => {
    if (viewMonth === 1) {
      setViewMonth(12);
      setViewYear(y => y - 1);
    } else {
      setViewMonth(m => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 12) {
      setViewMonth(1);
      setViewYear(y => y + 1);
    } else {
      setViewMonth(m => m + 1);
    }
  };

  const handleSelectDay = (dayNum) => {
    const pad = n => String(n).padStart(2, '0');
    const newDateStr = `${viewYear}-${pad(viewMonth)}-${pad(dayNum)}`;
    setSelectedDate(newDateStr);
  };

  const isDaySelected = (dayNum) => {
    const pad = n => String(n).padStart(2, '0');
    return selectedDate === `${viewYear}-${pad(viewMonth)}-${pad(dayNum)}`;
  };

  const isDayInPast = (dayNum) => {
    if (viewYear < currentInfo.currentYear) return true;
    if (viewYear === currentInfo.currentYear && viewMonth < currentInfo.currentMonth) return true;
    if (viewYear === currentInfo.currentYear && viewMonth === currentInfo.currentMonth) {
      return dayNum < currentInfo.currentDay;
    }
    return false;
  };

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const handleConfirm = async () => {
    if (!validation.isValid || submitting) return;
    setSubmitting(true);
    setSubmitError('');

    try {
      // Build reliable canonical schedule object from user selection
      const canonicalData = {
        localDate: selectedDate,
        localTime: time24,
        dateStr: selectedDate,
        timeStr: time24,
        timezone: selectedTz,
        scheduledAtUtc: validation.utcIso,
        scheduledForLocal: validation.formattedLocal
      };

      if (typeof onConfirmSchedule === 'function') {
        await onConfirmSchedule(canonicalData);
      }
      if (typeof onClose === 'function') {
        onClose();
      }
    } catch (err) {
      console.error('Modal schedule confirmation error:', err);
      const rawMsg = err?.message || '';
      const userFriendlyMsg = (rawMsg.includes('is not defined') || rawMsg.includes('ReferenceError') || rawMsg.includes('TypeError'))
        ? 'Unable to schedule email. Please try again.'
        : (rawMsg || 'Unable to schedule email. Please try again.');
      setSubmitError(userFriendlyMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="glass-panel max-w-xl w-full p-6 sm:p-7 rounded-3xl border border-[#2E2D2B] bg-[#161514] text-[#F5F3EF] space-y-5 shadow-2xl overflow-y-auto max-h-[92vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#2E2D2B] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#D4A373]/10 text-[#D4A373] border border-[#D4A373]/20 flex items-center justify-center shadow-inner">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-[#F5F3EF] flex items-center gap-2">
                <span>{title}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#22211F] text-[#D4A373] border border-[#2E2D2B]">Dynamic</span>
              </h3>
              <p className="text-xs text-[#99958F] mt-0.5">{subtitle}</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="text-[#99958F] hover:text-[#F5F3EF] p-1.5 rounded-xl hover:bg-[#22211F] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Timezone Selector & Detected Badge */}
        <div className="p-3.5 rounded-2xl bg-[#1A1918] border border-[#2E2D2B] space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-[#ECE8E1] flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-[#D4A373]" /> Target Timezone
            </span>
            {selectedTz === detectedTz ? (
              <span className="text-[11px] text-emerald-400 font-medium bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-500/30">
                ⚡ Auto-detected: {detectedTz}
              </span>
            ) : (
              <span className="text-[11px] text-[#D4A373] font-medium bg-[#D4A373]/10 px-2 py-0.5 rounded-md border border-[#D4A373]/30">
                Custom Timezone
              </span>
            )}
          </div>

          <select
            value={selectedTz}
            onChange={(e) => setSelectedTz(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-[#22211F] text-xs font-semibold text-[#ECE8E1] border border-[#2E2D2B] focus:border-[#D4A373] cursor-pointer"
          >
            {POPULAR_TIMEZONES.map(tz => (
              <option key={tz.id} value={tz.id}>
                {tz.label} ({tz.region})
              </option>
            ))}
            {!POPULAR_TIMEZONES.some(t => t.id === selectedTz) && (
              <option value={selectedTz}>{selectedTz} (Local System)</option>
            )}
          </select>
        </div>

        {/* Two-Column Date & Time Picker */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Dynamic Calendar Column */}
          <div className="p-4 rounded-2xl bg-[#1A1918] border border-[#2E2D2B] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#ECE8E1] flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#D4A373]" /> Choose Date
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="p-1 rounded-lg bg-[#22211F] hover:bg-[#2A2926] text-[#ECE8E1] border border-[#2E2D2B] cursor-pointer"
                  title="Previous month"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <span className="text-xs font-bold text-[#D4A373] px-1.5 min-w-[100px] text-center">
                  {monthNames[viewMonth - 1]} {viewYear}
                </span>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="p-1 rounded-lg bg-[#22211F] hover:bg-[#2A2926] text-[#ECE8E1] border border-[#2E2D2B] cursor-pointer"
                  title="Next month"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Days of Week Header */}
            <div className="grid grid-cols-7 text-center text-[10px] font-bold text-[#99958F] pb-1 border-b border-[#2E2D2B]">
              <span>Su</span><span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span>
            </div>

            {/* Calendar Days Grid */}
            <div className="grid grid-cols-7 gap-1 text-center text-xs">
              {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                <div key={`empty-${i}`} className="h-7 w-7" />
              ))}
              {Array.from({ length: daysInCurrentMonth }).map((_, i) => {
                const dayNum = i + 1;
                const isSelected = isDaySelected(dayNum);
                const isPast = isDayInPast(dayNum);

                return (
                  <button
                    key={`day-${dayNum}`}
                    type="button"
                    disabled={isPast}
                    onClick={() => handleSelectDay(dayNum)}
                    className={`h-7 w-7 mx-auto rounded-lg text-xs font-semibold flex items-center justify-center transition-all ${
                      isSelected
                        ? 'bg-[#D4A373] text-[#121211] font-bold shadow-md shadow-[#D4A373]/30 scale-105'
                        : isPast
                        ? 'text-[#4A4844] cursor-not-allowed opacity-40'
                        : 'text-[#ECE8E1] hover:bg-[#22211F] hover:text-[#D4A373] cursor-pointer'
                    }`}
                  >
                    {dayNum}
                  </button>
                );
              })}
            </div>
            
            <div className="text-[11px] text-[#99958F] text-center pt-1 border-t border-[#2E2D2B]/50">
              Selected: <strong className="text-[#ECE8E1]">{selectedDate}</strong>
            </div>
          </div>

          {/* Dynamic Time Picker Column */}
          <div className="p-4 rounded-2xl bg-[#1A1918] border border-[#2E2D2B] space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <span className="text-xs font-bold text-[#ECE8E1] flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#D4A373]" /> Choose Time
              </span>

              {/* Hour & Minute Selectors */}
              <div className="grid grid-cols-3 gap-2 items-center">
                {/* Hour */}
                <div>
                  <label className="text-[10px] text-[#99958F] font-semibold block mb-1">Hour (1-12)</label>
                  <select
                    value={selectedHour12}
                    onChange={(e) => setSelectedHour12(e.target.value)}
                    className="w-full px-2 py-2 rounded-xl bg-[#22211F] text-xs font-bold text-[#ECE8E1] border border-[#2E2D2B] text-center cursor-pointer"
                  >
                    {Array.from({ length: 12 }).map((_, i) => {
                      const h = i + 1;
                      return <option key={h} value={String(h)}>{String(h).padStart(2, '0')}</option>;
                    })}
                  </select>
                </div>

                {/* Minute (00 - 59: every minute) */}
                <div>
                  <label className="text-[10px] text-[#99958F] font-semibold block mb-1">Minute (00-59)</label>
                  <select
                    value={selectedMinute}
                    onChange={(e) => {
                      setSelectedMinute(e.target.value);
                      if (submitError) setSubmitError('');
                    }}
                    className="w-full px-2 py-2 rounded-xl bg-[#22211F] text-xs font-bold text-[#ECE8E1] border border-[#2E2D2B] text-center cursor-pointer"
                  >
                    {Array.from({ length: 60 }).map((_, i) => {
                      const m = String(i).padStart(2, '0');
                      return <option key={m} value={m}>{m}</option>;
                    })}
                  </select>
                </div>

                {/* AM / PM Toggle */}
                <div>
                  <label className="text-[10px] text-[#99958F] font-semibold block mb-1">AM / PM</label>
                  <div className="grid grid-cols-2 rounded-xl bg-[#22211F] p-0.5 border border-[#2E2D2B]">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedAmPm('AM');
                        if (submitError) setSubmitError('');
                      }}
                      className={`py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        selectedAmPm === 'AM' ? 'bg-[#D4A373] text-[#121211]' : 'text-[#99958F]'
                      }`}
                    >
                      AM
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedAmPm('PM');
                        if (submitError) setSubmitError('');
                      }}
                      className={`py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        selectedAmPm === 'PM' ? 'bg-[#D4A373] text-[#121211]' : 'text-[#99958F]'
                      }`}
                    >
                      PM
                    </button>
                  </div>
                </div>
              </div>

              {/* Quick minute preset buttons */}
              <div className="flex items-center gap-1.5 pt-1 flex-wrap">
                <span className="text-[10px] text-[#99958F]">Quick:</span>
                {['00', '15', '30', '45'].map(minPreset => (
                  <button
                    key={minPreset}
                    type="button"
                    onClick={() => {
                      setSelectedMinute(minPreset);
                      if (submitError) setSubmitError('');
                    }}
                    className={`px-2 py-1 rounded-md text-[11px] font-semibold border transition-colors cursor-pointer ${
                      selectedMinute === minPreset
                        ? 'bg-[#D4A373]/20 border-[#D4A373] text-[#D4A373]'
                        : 'bg-[#22211F] border-[#2E2D2B] text-[#99958F] hover:text-[#ECE8E1]'
                    }`}
                  >
                    :{minPreset}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    const cur = getCurrentDateTimeParts(selectedTz);
                    let targetH = cur.currentHour;
                    let targetM = cur.currentMinute + 10;
                    if (targetM >= 60) {
                      targetM -= 60;
                      targetH = (targetH + 1) % 24;
                    }
                    const h12 = targetH % 12 || 12;
                    setSelectedHour12(String(h12));
                    setSelectedMinute(String(targetM).padStart(2, '0'));
                    setSelectedAmPm(targetH >= 12 ? 'PM' : 'AM');
                    if (submitError) setSubmitError('');
                  }}
                  className="px-2 py-1 rounded-md text-[11px] font-semibold border bg-[#22211F] border-[#2E2D2B] text-[#D4A373] hover:border-[#D4A373]/50 cursor-pointer"
                  title="Schedule 10 minutes from now"
                >
                  +10m
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const cur = getCurrentDateTimeParts(selectedTz);
                    let targetH = cur.currentHour;
                    let targetM = cur.currentMinute + 30;
                    if (targetM >= 60) {
                      targetM -= 60;
                      targetH = (targetH + 1) % 24;
                    }
                    const h12 = targetH % 12 || 12;
                    setSelectedHour12(String(h12));
                    setSelectedMinute(String(targetM).padStart(2, '0'));
                    setSelectedAmPm(targetH >= 12 ? 'PM' : 'AM');
                    if (submitError) setSubmitError('');
                  }}
                  className="px-2 py-1 rounded-md text-[11px] font-semibold border bg-[#22211F] border-[#2E2D2B] text-[#D4A373] hover:border-[#D4A373]/50 cursor-pointer"
                  title="Schedule 30 minutes from now"
                >
                  +30m
                </button>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-[#22211F] border border-[#2E2D2B] text-center text-xs">
              <span className="text-[#99958F]">Selected Time: </span>
              <strong className="text-[#D4A373] font-mono text-sm">{selectedHour12}:{selectedMinute} {selectedAmPm}</strong>
              <span className="text-[#99958F] text-[11px]"> ({time24} 24h)</span>
            </div>
          </div>
        </div>

        {/* Dynamic Schedule Preview Card */}
        <div className="p-4 rounded-2xl bg-[#1A1918] border border-[#2E2D2B] space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-[#D4A373] uppercase tracking-wider text-[10px] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Selected Schedule Preview
            </span>
            {validation.isValid && (
              <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" /> Valid Future Moment
              </span>
            )}
          </div>

          <div className="space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-[#99958F]">Scheduled For:</span>
              <span className="font-bold text-[#F5F3EF]">{validation.formattedLocal || 'Invalid Time'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#99958F]">Timezone:</span>
              <span className="text-[#D4A373] font-mono font-semibold">{selectedTz}</span>
            </div>
            {validation.isValid && (
              <div className="flex items-center justify-between pt-1 border-t border-[#2E2D2B]/50 text-[11px]">
                <span className="text-[#99958F]">Canonical UTC Instant:</span>
                <span className="text-[#99958F] font-mono">{validation.utcIso}</span>
              </div>
            )}
          </div>
        </div>

        {/* In-Modal Submission Error Alert */}
        {submitError && (
          <div className="p-3.5 rounded-2xl bg-rose-950/80 border border-rose-500/60 text-rose-200 text-xs flex items-center justify-between gap-2.5 animate-fadeIn shadow-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span className="font-semibold">{submitError}</span>
            </div>
            <button
              type="button"
              onClick={() => setSubmitError('')}
              className="text-rose-400 hover:text-white p-1 rounded-lg cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Validation Error Alert if Past Date/Time */}
        {!validation.isValid && !submitError && (
          <div className="p-3.5 rounded-2xl bg-rose-950/70 border border-rose-500/50 text-rose-200 text-xs flex items-center gap-2.5 animate-fadeIn">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span className="font-semibold">{validation.error || 'Please select a future time.'}</span>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#2E2D2B]">
          <button
            type="button"
            disabled={submitting}
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-[#22211F] hover:bg-[#2A2926] text-[#ECE8E1] text-xs font-bold border border-[#2E2D2B] transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!validation.isValid || submitting}
            onClick={handleConfirm}
            data-cursor="primary"
            className="px-7 py-2.5 rounded-xl gold-btn text-[#121211] text-xs font-bold transition-all shadow-lg shadow-[#D4A373]/20 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {submitting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-[#121211]" />
                <span>Scheduling Email...</span>
              </>
            ) : (
              <>
                <Clock className="w-4 h-4" />
                <span>Confirm & Schedule Email</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
