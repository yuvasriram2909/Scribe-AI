import React, { useState, useEffect } from 'react';
import { 
  Bell, CheckCheck, Calendar, FileText, AlertTriangle, Briefcase, 
  RefreshCw, Check, Trash2, RotateCcw, X, Flame, AlertCircle, ShieldAlert, Filter, Lock
} from 'lucide-react';
import { apiFetch } from '../utils/api';

const NOTIF_TYPES = [
  { id: 'All', label: 'All Notifications' },
  { id: 'Security Alert', label: '🔒 Security Alerts' },
  { id: 'Emergency', label: '🚨 Emergency' },
  { id: 'Leave', label: '🏖️ Leave' },
  { id: 'Resume', label: '📄 Resume' },
  { id: 'Official', label: '💼 Official' },
  { id: 'Casual', label: '💬 Casual' }
];

export function NotificationCenter() {
  const [notifications, setNotifications] = useState([]);
  const [viewMode, setViewMode] = useState('active'); // 'active' or 'trash'
  const [selectedType, setSelectedType] = useState('All');
  
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeCount, setActiveCount] = useState(0);
  const [trashedCount, setTrashedCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState(null);

  useEffect(() => {
    fetchNotifications();
  }, [viewMode]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const isTrashed = viewMode === 'trash';
      const res = await apiFetch(`/api/notifications?trashed=${isTrashed}`);
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
        setActiveCount(data.activeCount || 0);
        setTrashedCount(data.trashedCount || 0);
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      const res = await apiFetch(`/api/notifications/${id}/read`, { method: 'PATCH' });
      if (res.ok) {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const res = await apiFetch('/api/notifications/read-all', { method: 'PATCH' });
      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setUnreadCount(0);
      }
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  // Move single notification to trash
  const handleTrashSingle = async (id) => {
    try {
      const res = await apiFetch(`/api/notifications/${id}/trash`, { method: 'PUT' });
      if (res.ok) {
        setNotifications(prev => prev.filter(n => n.id !== id));
        setActiveCount(prev => Math.max(0, prev - 1));
        setTrashedCount(prev => prev + 1);
      }
    } catch (err) {
      console.error('Error moving notification to trash:', err);
    }
  };

  // Move ALL notifications to trash
  const handleTrashAllConfirm = () => {
    setConfirmModal({
      title: 'Delete all notifications?',
      message: 'All active notifications will be moved to the Trash bin. You can restore them anytime from Trash.',
      actionText: 'Move to Trash',
      actionClass: 'bg-amber-600 hover:bg-amber-500 text-white',
      onConfirm: async () => {
        try {
          const res = await apiFetch('/api/notifications/trash-all', { method: 'PUT' });
          if (res.ok) {
            setNotifications([]);
            setActiveCount(0);
            fetchNotifications();
          }
        } catch (err) {
          console.error('Error moving all to trash:', err);
        } finally {
          setConfirmModal(null);
        }
      }
    });
  };

  // Restore notification from trash
  const handleRestore = async (id) => {
    try {
      const res = await apiFetch(`/api/notifications/${id}/restore`, { method: 'PUT' });
      if (res.ok) {
        setNotifications(prev => prev.filter(n => n.id !== id));
        setTrashedCount(prev => Math.max(0, prev - 1));
        setActiveCount(prev => prev + 1);
      }
    } catch (err) {
      console.error('Error restoring notification:', err);
    }
  };

  // Permanently delete single notification
  const handlePermanentDeleteConfirm = (id) => {
    setConfirmModal({
      title: 'Permanently delete notification?',
      message: 'This notification will be permanently removed from your Trash bin. This action cannot be undone.',
      actionText: 'Permanently Delete',
      actionClass: 'bg-red-600 hover:bg-red-500 text-white',
      onConfirm: async () => {
        try {
          const res = await apiFetch(`/api/notifications/${id}`, { method: 'DELETE' });
          if (res.ok) {
            setNotifications(prev => prev.filter(n => n.id !== id));
            setTrashedCount(prev => Math.max(0, prev - 1));
          }
        } catch (err) {
          console.error('Error deleting notification:', err);
        } finally {
          setConfirmModal(null);
        }
      }
    });
  };

  // Empty entire trash
  const handleEmptyTrashConfirm = () => {
    setConfirmModal({
      title: 'Empty Trash Bin?',
      message: `Permanently delete all ${trashedCount} trashed notifications? This action cannot be undone.`,
      actionText: 'Empty Trash Now',
      actionClass: 'bg-red-600 hover:bg-red-500 text-white font-bold',
      onConfirm: async () => {
        try {
          const res = await apiFetch('/api/notifications/empty-trash', { method: 'DELETE' });
          if (res.ok) {
            setNotifications([]);
            setTrashedCount(0);
          }
        } catch (err) {
          console.error('Error emptying trash:', err);
        } finally {
          setConfirmModal(null);
        }
      }
    });
  };

  const getNotifIcon = (type) => {
    switch (type) {
      case 'Security Alert': return <ShieldAlert className="w-5 h-5 text-red-400" />;
      case 'Emergency': return <AlertTriangle className="w-5 h-5 text-red-400" />;
      case 'Leave': return <Calendar className="w-5 h-5 text-emerald-400" />;
      case 'Resume': return <FileText className="w-5 h-5 text-blue-400" />;
      case 'Official': return <Briefcase className="w-5 h-5 text-purple-400" />;
      default: return <Bell className="w-5 h-5 text-amber-400" />;
    }
  };

  const filteredNotifications = selectedType === 'All'
    ? notifications
    : notifications.filter(n => n.notificationType?.toLowerCase().includes(selectedType.toLowerCase()));

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
      
      {/* Top Header & Toolbar */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Bell className="w-6 h-6 text-amber-400" />
            Notification & Security Center
          </h2>
          <p className="text-xs text-slate-400">Automated category alerts, platform sign-in notifications, and trash management</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {viewMode === 'active' && unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-700"
            >
              <CheckCheck className="w-4 h-4 text-emerald-400" />
              Mark All Read
            </button>
          )}

          {viewMode === 'active' && activeCount > 0 && (
            <button
              onClick={handleTrashAllConfirm}
              className="px-3.5 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              title="Move All Notifications to Trash"
            >
              <Trash2 className="w-4 h-4" />
              Move All to Trash
            </button>
          )}

          {viewMode === 'trash' && trashedCount > 0 && (
            <button
              onClick={handleEmptyTrashConfirm}
              className="px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-red-600/30 transition-all"
            >
              <Flame className="w-4 h-4 text-red-200" />
              Empty Trash
            </button>
          )}
        </div>
      </div>

      {/* Navigation View Switcher (Active vs Trash) */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 border-b border-slate-800/80 pb-2">
          <button
            onClick={() => setViewMode('active')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              viewMode === 'active'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'bg-slate-800/60 text-slate-400 hover:text-white'
            }`}
          >
            <Bell className="w-4 h-4" />
            Active Notifications
            <span className="px-2 py-0.5 rounded-full bg-slate-900/60 text-[10px]">
              {activeCount}
            </span>
          </button>

          <button
            onClick={() => setViewMode('trash')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              viewMode === 'trash'
                ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30'
                : 'bg-slate-800/60 text-slate-400 hover:text-white'
            }`}
          >
            <Trash2 className="w-4 h-4" />
            Trash Bin
            {trashedCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-amber-950 text-amber-200 border border-amber-500/40 text-[10px] font-bold">
                {trashedCount}
              </span>
            )}
          </button>
        </div>

        {/* Type Filter Toolbar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-xs font-semibold text-slate-400 mr-1 flex items-center gap-1 shrink-0">
            <Filter className="w-3.5 h-3.5" /> Filter:
          </span>
          {NOTIF_TYPES.map(t => (
            <button
              key={t.id}
              onClick={() => setSelectedType(t.id)}
              className={`px-3 py-1 rounded-xl text-xs font-semibold shrink-0 transition-all ${
                selectedType === t.id
                  ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/40'
                  : 'bg-slate-800/50 text-slate-400 hover:text-slate-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Notifications List */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
        {loading ? (
          <div className="text-center py-16 text-slate-500">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 opacity-50" />
            <p className="text-xs">Loading {viewMode === 'trash' ? 'trashed items' : 'notifications'}...</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            {viewMode === 'trash' ? (
              <>
                <Trash2 className="w-12 h-12 mx-auto mb-3 opacity-30 text-amber-400" />
                <p className="text-sm font-semibold text-slate-400">Trash Bin is Empty</p>
                <p className="text-xs text-slate-600 mt-1">Deleted notifications will appear here for recovery.</p>
              </>
            ) : (
              <>
                <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm font-semibold text-slate-400">No notifications found</p>
                <p className="text-xs text-slate-600 mt-1">Security login alerts and category notifications will appear here.</p>
              </>
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {filteredNotifications.map((notif) => (
              <div
                key={notif.id}
                className={`p-5 transition-all flex items-start gap-4 ${
                  viewMode === 'trash'
                    ? 'bg-slate-950/60 text-slate-400 border-l-4 border-amber-500/60'
                    : notif.notificationType === 'Security Alert'
                      ? 'bg-red-950/10 text-slate-200 border-l-4 border-red-500'
                      : notif.read ? 'bg-slate-950/40 text-slate-400' : 'bg-indigo-950/20 text-white font-medium border-l-4 border-indigo-500'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center shrink-0 mt-0.5">
                  {getNotifIcon(notif.notificationType)}
                </div>

                <div className="flex-1 space-y-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold uppercase tracking-wider ${
                        notif.notificationType === 'Security Alert' ? 'text-red-400' : 'text-indigo-300'
                      }`}>
                        {notif.notificationType} Alert
                      </span>
                      {viewMode === 'trash' && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          In Trash
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-500">
                      {new Date(notif.createdAt).toLocaleString()}
                    </span>
                  </div>

                  <p className="text-sm text-slate-200 leading-relaxed font-sans">{notif.message}</p>

                  {notif.email && (
                    <div className="mt-2 p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs text-slate-400 space-y-1">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <span>Subject: <strong className="text-slate-200">{notif.email.subject}</strong></span>
                        <span>Recipient: <strong className="text-indigo-300 font-mono">{notif.email.recipient}</strong></span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Item Controls */}
                <div className="flex items-center gap-1.5 shrink-0 self-center">
                  {viewMode === 'active' ? (
                    <>
                      {!notif.read && (
                        <button
                          onClick={() => handleMarkAsRead(notif.id)}
                          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-emerald-400 transition-colors"
                          title="Mark as Read"
                        >
                          <Check className="w-4 h-4 text-emerald-400" />
                        </button>
                      )}
                      <button
                        onClick={() => handleTrashSingle(notif.id)}
                        className="p-2 rounded-lg bg-slate-800/80 hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-colors"
                        title="Move to Trash"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => handleRestore(notif.id)}
                        className="p-2 rounded-lg bg-slate-800 hover:bg-emerald-500/20 text-emerald-400 transition-colors flex items-center gap-1 text-xs font-semibold px-3"
                        title="Restore Notification"
                      >
                        <RotateCcw className="w-3.5 h-3.5" /> Restore
                      </button>
                      <button
                        onClick={() => handlePermanentDeleteConfirm(notif.id)}
                        className="p-2 rounded-lg bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
                        title="Permanently Delete"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Confirmation Dialog Modal */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="glass-panel max-w-md w-full p-6 sm:p-8 rounded-2xl border border-slate-700 space-y-6 shadow-2xl">
            <div className="flex items-center gap-3 text-amber-400">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0">
                <AlertCircle className="w-6 h-6 text-amber-400" />
              </div>
              <h3 className="text-lg font-bold text-white">{confirmModal.title}</h3>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {confirmModal.message}
            </p>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                onClick={() => setConfirmModal(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmModal.onConfirm}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold shadow-lg transition-all ${confirmModal.actionClass}`}
              >
                {confirmModal.actionText}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
