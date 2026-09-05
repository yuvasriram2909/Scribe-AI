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

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 6000);
    return () => clearInterval(interval);
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

  const handleMarkAllRead = async () => {
    try {
      const res = await apiFetch('/api/notifications/read-all', { method: 'POST' });
      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setUnreadCount(0);
      }
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const handleMoveToTrash = async (id) => {
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

  const handleRestore = async (id) => {
    try {
      const res = await apiFetch(`/api/notifications/${id}/restore`, { method: 'POST' });
      if (res.ok) {
        setNotifications(prev => prev.filter(n => n.id !== id));
        setTrashedCount(prev => Math.max(0, prev - 1));
        setActiveCount(prev => prev + 1);
      }
    } catch (err) {
      console.error('Failed to restore notification:', err);
    }
  };

  const filteredNotifs = notifications.filter(n => {
    if (selectedType === 'All') return true;
    return (n.notificationType || '').toLowerCase().includes(selectedType.toLowerCase());
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Header */}
      <div className="glass-panel p-6 rounded-3xl border border-[#2E2D2B] bg-[#1A1918] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
        <div>
          <h2 className="text-xl font-extrabold text-[#F5F3EF] flex items-center gap-2">
            <Bell className="w-5 h-5 text-[#D4A373]" />
            Notifications Center
          </h2>
          <p className="text-xs text-[#99958F] mt-1">
            Real-time status updates, security alerts, and dispatch receipts
          </p>
        </div>

        <div className="flex items-center gap-3">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="px-4 py-2 rounded-xl bg-[#22211F] hover:bg-[#2A2926] text-[#D4A373] border border-[#2E2D2B] text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
            >
              <CheckCheck className="w-4 h-4 text-[#D4A373]" />
              Mark All Read ({unreadCount})
            </button>
          )}

          <div className="flex rounded-xl bg-[#22211F] p-1 border border-[#2E2D2B]">
            <button
              onClick={() => setViewMode('active')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'active' ? 'gold-btn text-[#121211] shadow-sm' : 'text-[#99958F] hover:text-[#F5F3EF]'
              }`}
            >
              Active ({activeCount})
            </button>
            <button
              onClick={() => setViewMode('trash')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'trash' ? 'gold-btn text-[#121211] shadow-sm' : 'text-[#99958F] hover:text-[#F5F3EF]'
              }`}
            >
              Trash ({trashedCount})
            </button>
          </div>
        </div>
      </div>

      {/* Notifications List */}
      {loading ? (
        <div className="glass-panel p-12 text-center text-xs text-[#99958F] rounded-3xl space-y-3 border border-[#2E2D2B] bg-[#1A1918]">
          <RefreshCw className="w-6 h-6 animate-spin text-[#D4A373] mx-auto" />
          <p className="font-semibold">Loading notifications...</p>
        </div>
      ) : filteredNotifs.length === 0 ? (
        <div className="glass-panel p-12 text-center text-xs text-[#99958F] rounded-3xl space-y-3 border border-[#2E2D2B] bg-[#1A1918] shadow-xl">
          <Bell className="w-8 h-8 text-[#D4A373] mx-auto opacity-50" />
          <p className="font-bold text-[#F5F3EF]">No notifications found</p>
          <p className="text-[#99958F]">Your inbox is clean with zero unread alerts.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNotifs.map(n => (
            <div
              key={n.id}
              className={`glass-card p-5 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                !n.read ? 'border-[#D4A373]/40 bg-[#1F1E1B] shadow-lg shadow-black/20' : 'border-[#2E2D2B] bg-[#161514]'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#22211F] border border-[#2E2D2B] flex items-center justify-center text-[#D4A373] shrink-0 mt-0.5">
                  <Bell className="w-4.5 h-4.5" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-[#F5F3EF]">
                    {n.message}
                  </p>
                  <span className="text-[10px] text-[#99958F] block font-medium">
                    {new Date(n.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                {viewMode === 'active' ? (
                  <button
                    onClick={() => handleMoveToTrash(n.id)}
                    className="p-1.5 rounded-lg text-[#99958F] hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                    title="Move to trash"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={() => handleRestore(n.id)}
                    className="px-3 py-1 rounded-lg bg-[#22211F] hover:bg-[#2A2926] text-[#D4A373] border border-[#2E2D2B] text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-[#D4A373]" />
                    Restore
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
