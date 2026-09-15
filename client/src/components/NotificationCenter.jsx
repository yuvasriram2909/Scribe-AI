import React, { useState, useEffect } from 'react';
import { 
  Bell, CheckCheck, FileText, AlertTriangle, Briefcase, 
  RefreshCw, Check, Trash2, RotateCcw, X, Flame, AlertCircle, ShieldAlert, Filter, Lock,
  Mail, ExternalLink, Sparkles, Send, ArrowRight
} from 'lucide-react';
import { apiFetch } from '../utils/api';
import { formatNormalDateTime } from '../utils/dateUtils';

const NOTIF_TYPES = [
  { id: 'All', label: 'All Notifications' },
  { id: 'Security', label: '🔒 Security & Alerts' },
  { id: 'Emergency', label: '🚨 Urgent & Emergency' },
  { id: 'Official', label: '💼 Official & Work' },
  { id: 'Job', label: '📄 Applications & Career' },
  { id: 'Receipts', label: '📤 Sent Receipts' }
];

export function NotificationCenter({ onUnreadCountChange, onViewHistory, theme = 'dark' }) {
  const [notifications, setNotifications] = useState([]);
  const [viewMode, setViewMode] = useState('active'); // 'active' or 'trash'
  const [selectedType, setSelectedType] = useState('All');
  
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeCount, setActiveCount] = useState(0);
  const [trashedCount, setTrashedCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Hover & Cursor Spotlight Tracking
  const [hoveredId, setHoveredId] = useState(null);
  const isAnyHovered = Boolean(hoveredId);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 8000);
    return () => clearInterval(interval);
  }, [viewMode]);

  const fetchNotifications = async () => {
    try {
      const isTrashed = viewMode === 'trash';
      const res = await apiFetch(`/api/notifications?trashed=${isTrashed}`);
      if (res.ok) {
        const data = await res.json();
        const notifs = data.notifications || [];
        setNotifications(notifs);
        const unread = typeof data.unreadCount === 'number' 
          ? data.unreadCount 
          : notifs.filter(n => !n.read && !n.isTrashed).length;
        setUnreadCount(unread);
        setActiveCount(typeof data.activeCount === 'number' ? data.activeCount : notifs.filter(n => !n.isTrashed).length);
        setTrashedCount(typeof data.trashedCount === 'number' ? data.trashedCount : notifs.filter(n => !!n.isTrashed).length);
        if (typeof onUnreadCountChange === 'function') {
          onUnreadCountChange(unread);
        }
        window.dispatchEvent(new CustomEvent('notifications-unread-count', { detail: { unreadCount: unread } }));
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAllRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
    if (typeof onUnreadCountChange === 'function') {
      onUnreadCountChange(0);
    }
    window.dispatchEvent(new CustomEvent('notifications-unread-count', { detail: { unreadCount: 0 } }));

    try {
      const res = await apiFetch('/api/notifications/read-all', { method: 'POST' });
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        const count = typeof data?.unreadCount === 'number' ? data.unreadCount : 0;
        setUnreadCount(count);
        if (typeof onUnreadCountChange === 'function') {
          onUnreadCountChange(count);
        }
        window.dispatchEvent(new CustomEvent('notifications-unread-count', { detail: { unreadCount: count } }));
      }
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const handleMarkSingleRead = async (id, e) => {
    if (e) e.stopPropagation();
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    setUnreadCount(prev => {
      const next = Math.max(0, prev - 1);
      if (typeof onUnreadCountChange === 'function') onUnreadCountChange(next);
      window.dispatchEvent(new CustomEvent('notifications-unread-count', { detail: { unreadCount: next } }));
      return next;
    });

    try {
      await apiFetch(`/api/notifications/${id}/read`, { method: 'POST' });
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const handleMoveToTrash = async (id, e) => {
    if (e) e.stopPropagation();
    const target = notifications.find(n => n.id === id);
    if (target && !target.read) {
      setUnreadCount(prev => {
        const next = Math.max(0, prev - 1);
        if (typeof onUnreadCountChange === 'function') onUnreadCountChange(next);
        window.dispatchEvent(new CustomEvent('notifications-unread-count', { detail: { unreadCount: next } }));
        return next;
      });
    }
    try {
      const res = await apiFetch(`/api/notifications/${id}/trash`, { method: 'POST' });
      if (res.ok) {
        setNotifications(prev => prev.filter(n => n.id !== id));
        setActiveCount(prev => Math.max(0, prev - 1));
        setTrashedCount(prev => prev + 1);
      }
    } catch (err) {
      console.error('Failed to move notification to trash:', err);
    }
  };

  const handleRestore = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      const res = await apiFetch(`/api/notifications/${id}/restore`, { method: 'POST' });
      if (res.ok) {
        setNotifications(prev => prev.filter(n => n.id !== id));
        setTrashedCount(prev => Math.max(0, prev - 1));
        setActiveCount(prev => prev + 1);
        fetchNotifications();
      }
    } catch (err) {
      console.error('Failed to restore notification:', err);
    }
  };

  // Helper to extract email query / subject from notification message
  const handleOpenEmail = (n, e) => {
    if (e) e.stopPropagation();
    if (!n.read) {
      handleMarkSingleRead(n.id);
    }
    if (typeof onViewHistory === 'function') {
      let query = '';
      const subjectMatch = (n.message || '').match(/"([^"]+)"/);
      if (subjectMatch && subjectMatch[1]) {
        query = subjectMatch[1];
      } else {
        const senderMatch = (n.message || '').match(/from ([^:]+):/);
        if (senderMatch && senderMatch[1]) {
          query = senderMatch[1];
        }
      }
      onViewHistory({ q: query, folder: 'all' });
    }
  };

  // Notification Icon & Accent Badge Determinator
  const getNotificationBadge = (n) => {
    const raw = `${n.notificationType || ''} ${n.message || ''}`.toLowerCase();
    if (raw.includes('security') || raw.includes('sign-in') || raw.includes('signin') || raw.includes('alert')) {
      return {
        icon: ShieldAlert,
        color: 'text-amber-400 bg-amber-400/15 border-amber-400/30',
        glow: 'rgba(251, 191, 36, 0.4)',
        typeLabel: 'Security Alert'
      };
    }
    if (raw.includes('emergency') || raw.includes('urgent')) {
      return {
        icon: Flame,
        color: 'text-rose-400 bg-rose-400/15 border-rose-400/30',
        glow: 'rgba(244, 63, 94, 0.4)',
        typeLabel: 'Emergency'
      };
    }
    if (raw.includes('sent to') || raw.includes('successfully sent')) {
      return {
        icon: Send,
        color: 'text-emerald-400 bg-emerald-400/15 border-emerald-400/30',
        glow: 'rgba(52, 211, 153, 0.4)',
        typeLabel: 'Sent Receipt'
      };
    }
    if (raw.includes('application') || raw.includes('job') || raw.includes('career') || raw.includes('resume')) {
      return {
        icon: Briefcase,
        color: 'text-cyan-400 bg-cyan-400/15 border-cyan-400/30',
        glow: 'rgba(34, 211, 238, 0.4)',
        typeLabel: 'Application'
      };
    }
    return {
      icon: Mail,
      color: 'text-[#D4A373] bg-[#D4A373]/15 border-[#D4A373]/30',
      glow: 'rgba(212, 163, 115, 0.4)',
      typeLabel: n.notificationType || 'Mail'
    };
  };

  // Category Filtering
  const filteredNotifs = notifications.filter(n => {
    if (selectedType === 'All') return true;
    const raw = `${n.notificationType || ''} ${n.message || ''}`.toLowerCase();
    if (selectedType === 'Security') return raw.includes('security') || raw.includes('sign-in') || raw.includes('alert');
    if (selectedType === 'Emergency') return raw.includes('emergency') || raw.includes('urgent');
    if (selectedType === 'Official') return raw.includes('official') || raw.includes('work') || raw.includes('progress');
    if (selectedType === 'Job') return raw.includes('application') || raw.includes('job') || raw.includes('career') || raw.includes('resume');
    if (selectedType === 'Receipts') return raw.includes('sent to') || raw.includes('successfully sent');
    return raw.includes(selectedType.toLowerCase());
  });

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* 1. Top Floating Glass Header Panel */}
      <div className="floating-glass-panel p-6 sm:p-7 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 transition-all">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#D4A373]/20 border border-[#D4A373]/40 flex items-center justify-center text-[#D4A373] shadow-inner">
              <Bell className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-[#F5F3EF] tracking-tight flex items-center gap-2">
                Notifications Center
                {unreadCount > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#D4A373] text-[#121211] shadow-[0_0_12px_rgba(212,163,115,0.5)]">
                    {unreadCount} NEW
                  </span>
                )}
              </h2>
              <p className="text-xs text-[#99958F] mt-0.5 font-medium">
                Live status updates, security verification alerts, and incoming message receipts
              </p>
            </div>
          </div>
        </div>

        {/* Floating Glass Controls (Mark All Read + View Switcher) */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          {unreadCount > 0 ? (
            <button
              onClick={handleMarkAllRead}
              className="floating-glass-pill px-4 py-2 rounded-xl text-xs font-bold text-[#D4A373] flex items-center gap-2 transition-all cursor-pointer active:scale-95"
              title="Mark all notifications as read"
            >
              <CheckCheck className="w-4 h-4 text-[#D4A373]" />
              <span>Mark All Read</span>
              <span className="px-1.5 py-0.2 rounded-md bg-[#D4A373]/20 text-[10px]">
                {unreadCount}
              </span>
            </button>
          ) : (
            <div className="floating-glass-pill px-3.5 py-2 rounded-xl text-xs font-semibold text-emerald-400/90 flex items-center gap-2">
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span>All Caught Up</span>
            </div>
          )}

          {/* Active / Trash Floating Glass Capsule Toggle */}
          <div className="flex rounded-xl bg-black/40 p-1 border border-white/10 backdrop-blur-xl shadow-inner">
            <button
              onClick={() => setViewMode('active')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'active' 
                  ? 'gold-btn text-[#121211] shadow-md scale-[1.02]' 
                  : 'text-[#99958F] hover:text-[#F5F3EF]'
              }`}
            >
              Active ({activeCount})
            </button>
            <button
              onClick={() => setViewMode('trash')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'trash' 
                  ? 'gold-btn text-[#121211] shadow-md scale-[1.02]' 
                  : 'text-[#99958F] hover:text-[#F5F3EF]'
              }`}
            >
              Trash ({trashedCount})
            </button>
          </div>
        </div>
      </div>

      {/* 2. Floating Glass Category Filter Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {NOTIF_TYPES.map(tab => {
          const isSelected = selectedType === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setSelectedType(tab.id)}
              className={`floating-glass-pill px-3.5 py-1.5 rounded-xl text-xs font-semibold shrink-0 cursor-pointer transition-all ${
                isSelected
                  ? 'bg-gradient-to-r from-[#D4A373] to-[#C59362] text-[#121211] font-extrabold border-amber-300/50 shadow-[0_0_15px_rgba(212,163,115,0.4)] scale-105'
                  : 'text-[#ECE8E1]/80 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 3. Floating Glass Notifications Spotlight Feed */}
      {loading ? (
        <div className="floating-glass-panel p-16 text-center text-xs text-[#99958F] rounded-3xl space-y-3">
          <RefreshCw className="w-7 h-7 animate-spin text-[#D4A373] mx-auto" />
          <p className="font-bold text-sm text-[#F5F3EF]">Synchronizing notifications...</p>
          <p className="text-[11px] text-[#99958F]">Connecting with Gmail and fetching real-time dispatch receipts</p>
        </div>
      ) : filteredNotifs.length === 0 ? (
        <div className="floating-glass-panel p-16 text-center text-xs text-[#99958F] rounded-3xl space-y-3 shadow-xl">
          <div className="w-14 h-14 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center mx-auto text-[#D4A373]">
            <Bell className="w-7 h-7 opacity-70" />
          </div>
          <p className="font-extrabold text-base text-[#F5F3EF]">No notifications in this view</p>
          <p className="text-xs text-[#99958F] max-w-sm mx-auto">
            {viewMode === 'trash'
              ? 'Your notification trash is empty.'
              : selectedType !== 'All'
                ? `No notifications found matching "${selectedType}".`
                : 'Your inbox is completely up-to-date with zero unread alerts.'}
          </p>
        </div>
      ) : (
        <div 
          className="space-y-3 relative"
          onMouseLeave={() => setHoveredId(null)}
        >
          {/* Ambient Spotlight Background Dimming Scrim:
              When any notification card is hovered, the surrounding background subtly dims 
              and softens to make the hovered card pop in full 3D floating glass brilliance. */}
          <div 
            className={`pointer-events-none absolute -inset-6 rounded-3xl transition-all duration-500 -z-10 ${
              isAnyHovered 
                ? 'bg-black/45 backdrop-brightness-[0.7] backdrop-blur-[1px] opacity-100' 
                : 'opacity-0'
            }`} 
          />

          {filteredNotifs.map(n => {
            const isHovered = hoveredId === n.id;
            const isDimmed = isAnyHovered && !isHovered;
            const badge = getNotificationBadge(n);
            const BadgeIcon = badge.icon;

            return (
              <div
                key={n.id}
                onMouseEnter={() => setHoveredId(n.id)}
                onClick={(e) => handleOpenEmail(n, e)}
                className={`floating-glass-card p-5 sm:p-6 rounded-2xl cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 select-none ${
                  isHovered ? 'is-hovered' : ''
                } ${isDimmed ? 'is-dimmed' : ''} ${
                  !n.read 
                    ? 'border-[#D4A373]/50 shadow-[0_12px_32px_-6px_rgba(0,0,0,0.6),0_0_15px_rgba(212,163,115,0.15)]' 
                    : 'border-white/[0.07]'
                }`}
              >
                {/* Left Area: Icon & Enlarged Message */}
                <div className="flex items-start gap-3.5 min-w-0 flex-1">
                  {/* Floating Glass Icon Badge */}
                  <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-2xl border flex items-center justify-center shrink-0 mt-0.5 transition-all duration-300 shadow-md ${
                    badge.color
                  } ${isHovered ? 'scale-115 rotate-3 shadow-[0_0_20px_rgba(212,163,115,0.4)]' : ''}`}>
                    <BadgeIcon className={`w-5 h-5 transition-transform duration-300 ${isHovered ? 'scale-110' : ''}`} />
                  </div>

                  {/* Message & Details */}
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Notification Message: Enlarges, expands, and brightens on cursor hover */}
                      <p 
                        className={`transition-all duration-300 ease-out ${
                          isHovered
                            ? 'text-sm sm:text-[16px] font-extrabold text-white tracking-normal leading-snug drop-shadow-md'
                            : !n.read
                              ? 'text-xs sm:text-[13.5px] font-bold text-[#F5F3EF]'
                              : 'text-xs sm:text-[13px] font-medium text-[#ECE8E1]/85'
                        }`}
                      >
                        {n.message}
                      </p>

                      {/* NEW Badge */}
                      {!n.read && (
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold transition-all duration-300 ${
                          isHovered 
                            ? 'bg-[#D4A373] text-[#121211] shadow-[0_0_14px_rgba(212,163,115,0.7)] scale-105' 
                            : 'bg-[#D4A373] text-[#121211]'
                        }`}>
                          NEW
                        </span>
                      )}

                      {/* Type Badge Tag */}
                      <span className="text-[10px] px-2 py-0.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-[#99958F] font-semibold">
                        {badge.typeLabel}
                      </span>
                    </div>

                    {/* Timestamp & Hover Context Hint */}
                    <div className="flex items-center gap-3 text-[11px] transition-colors duration-300">
                      <span className={`font-medium ${isHovered ? 'text-[#D4A373] font-semibold' : 'text-[#99958F]'}`}>
                        {formatNormalDateTime(n.createdAt)}
                      </span>

                      {isHovered && typeof onViewHistory === 'function' && (
                        <span className="hidden sm:inline-flex items-center gap-1 text-[#D4A373]/90 text-[11px] font-bold animate-fadeIn">
                          <Sparkles className="w-3 h-3 text-[#D4A373] animate-pulse" />
                          <span>Click to open in Email History</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Area: Floating Glass Action Buttons */}
                <div className="flex items-center gap-2 self-end sm:self-center shrink-0 pt-2 sm:pt-0">
                  {/* View Email Button (prominent on hover) */}
                  {typeof onViewHistory === 'function' && (
                    <button
                      onClick={(e) => handleOpenEmail(n, e)}
                      className={`floating-glass-pill px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                        isHovered 
                          ? 'bg-[#D4A373] text-[#121211] border-amber-300 shadow-[0_0_15px_rgba(212,163,115,0.4)] scale-105' 
                          : 'text-[#ECE8E1] hover:text-white'
                      }`}
                      title="Open and view this email"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span className={isHovered ? 'inline' : 'hidden sm:inline'}>Open Mail</span>
                    </button>
                  )}

                  {/* Mark as Read Button */}
                  {!n.read && viewMode === 'active' && (
                    <button
                      onClick={(e) => handleMarkSingleRead(n.id, e)}
                      className="floating-glass-pill px-3 py-1.5 rounded-xl text-[#D4A373] hover:text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                      title="Mark as read"
                    >
                      <Check className="w-3.5 h-3.5 text-[#D4A373]" />
                      <span>Mark Read</span>
                    </button>
                  )}

                  {/* Move to Trash Button */}
                  {viewMode === 'active' ? (
                    <button
                      onClick={(e) => handleMoveToTrash(n.id, e)}
                      className="floating-glass-pill p-2 rounded-xl text-[#99958F] hover:text-rose-400 hover:border-rose-500/40 transition-colors cursor-pointer"
                      title="Move to trash"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={(e) => handleRestore(n.id, e)}
                      className="floating-glass-pill px-3 py-1.5 rounded-xl text-[#D4A373] text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                      title="Restore notification"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-[#D4A373]" />
                      <span>Restore</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

