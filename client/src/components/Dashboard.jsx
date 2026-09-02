import React, { useState, useEffect } from 'react';
import { 
  Mail, Send, AlertTriangle, Calendar, FileText, Briefcase, Sparkles, 
  ArrowRight, CheckCircle, Trash2, Search, Filter, RefreshCw, X, AlertCircle, Clock, ShieldAlert, Heart, Users, Check, ExternalLink, Settings, Bell, LogOut
} from 'lucide-react';
import { apiFetch } from '../utils/api';
import { registerServiceWorker, subscribeUserToPush } from '../utils/push';

const CATEGORIES_LIST = [
  { id: 'All', label: 'All Situations' },
  { id: 'Emergency', label: '🚨 Emergency' },
  { id: 'Important', label: '⚠️ Important / Necessary' },
  { id: 'Official', label: '💼 Official / Professional' },
  { id: 'Leave', label: '📅 Leave / Holiday' },
  { id: 'Resume', label: '📄 Resume / Job Application' },
  { id: 'Follow-up', label: '🔄 Follow-up' },
  { id: 'Casual', label: '💬 Casual' },
  { id: 'Occasion', label: '🎉 Celebration / Occasion' }
];

const STATUS_FILTERS = [
  'All',
  'Sent',
  'Failed',
  'Sending',
  'Draft'
];

/**
 * Calculates dynamic greeting based on the user's local device time
 * - 5:00 AM – 11:59 AM: Good morning!
 * - 12:00 PM – 4:59 PM: Good afternoon!
 * - 5:00 PM – 8:59 PM: Good evening!
 * - 9:00 PM – 4:59 AM: Good night!
 */
export function getTimeBasedGreeting(date = new Date()) {
  const hour = date.getHours();
  if (hour >= 5 && hour < 12) {
    return 'Good morning! What do you want to send today?';
  }
  if (hour >= 12 && hour < 17) {
    return 'Good afternoon! What do you want to send today?';
  }
  if (hour >= 17 && hour < 21) {
    return 'Good evening! What do you want to send today?';
  }
  return 'Good night! What do you want to send today?';
}

export function Dashboard({ onStartCompose, onViewHistory, onNavigateToSettings }) {
  const [greeting, setGreeting] = useState(() => getTimeBasedGreeting());

  useEffect(() => {
    // Update greeting every 60s to ensure smooth time-boundary transitions
    const interval = setInterval(() => {
      setGreeting(getTimeBasedGreeting());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const [stats, setStats] = useState({
    totalEmails: 0,
    sentToday: 0,
    emergency: 0,
    leave: 0,
    resume: 0,
    official: 0,
    drafts: 0,
    pending: 0
  });

  const [connectionStatus, setConnectionStatus] = useState({
    isConnected: false,
    status: 'DISCONNECTED',
    connectedEmail: null
  });

  const [showPushBanner, setShowPushBanner] = useState(false);
  const [recentEmails, setRecentEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [retryingId, setRetryingId] = useState(null);

  // Filters & Search
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Email Detail Modal
  const [detailModalEmail, setDetailModalEmail] = useState(null);

  // Quick compose state
  const [quickInstruction, setQuickInstruction] = useState('');
  const [quickRecipient, setQuickRecipient] = useState('');

  useEffect(() => {
    fetchDashboardData();
    checkConnectionStatus();
    checkPushNotificationSupport();
  }, [selectedCategory, selectedStatus, searchQuery]);

  const checkPushNotificationSupport = async () => {
    registerServiceWorker();
    if ('Notification' in window && Notification.permission === 'default') {
      const dismissed = sessionStorage.getItem('dismissPushBanner');
      if (!dismissed) {
        setShowPushBanner(true);
      }
    }
  };

  const handleEnablePush = async () => {
    const result = await subscribeUserToPush();
    if (result.success) {
      setShowPushBanner(false);
      alert('🔔 Notifications enabled! You will receive push alerts on login.');
    } else if (result.reason === 'denied') {
      setShowPushBanner(false);
    }
  };

  const handleDisconnectGmail = async () => {
    if (!window.confirm('Are you sure you want to disconnect your Gmail account?')) return;
    try {
      const res = await apiFetch('/api/auth/google/disconnect', { method: 'POST' });
      if (res.ok) {
        setConnectionStatus({ isConnected: false, status: 'DISCONNECTED', connectedEmail: null });
        alert('Gmail account disconnected successfully.');
      }
    } catch (err) {
      console.error('Failed to disconnect Gmail:', err);
    }
  };

  const checkConnectionStatus = async () => {
    try {
      const res = await apiFetch('/api/auth/status');
      if (res.ok) {
        const data = await res.json();
        setConnectionStatus(data);
      }
    } catch (err) {
      console.error('Failed to check connection status:', err);
    }
  };

  const handleConnectGmail = async () => {
    try {
      const res = await apiFetch('/api/auth/google/url');
      const data = await res.json();
      if (data && data.url) {
        window.location.href = data.url;
      } else if (onNavigateToSettings) {
        onNavigateToSettings();
      }
    } catch (err) {
      if (onNavigateToSettings) onNavigateToSettings();
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      let url = '/api/emails?';
      if (selectedCategory !== 'All') url += `category=${encodeURIComponent(selectedCategory)}&`;
      if (selectedStatus !== 'All') url += `status=${encodeURIComponent(selectedStatus)}&`;
      if (searchQuery.trim() !== '') url += `q=${encodeURIComponent(searchQuery)}`;

      const [statsRes, emailsRes] = await Promise.all([
        apiFetch('/api/emails/stats'),
        apiFetch(url)
      ]);

      if (statsRes.ok) setStats(await statsRes.json());
      if (emailsRes.ok) {
        const data = await emailsRes.json();
        setRecentEmails(data);
      }
    } catch (err) {
      console.error('Failed to load dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickSubmit = (e) => {
    e.preventDefault();
    if (!quickInstruction.trim()) return;
    onStartCompose({
      instruction: quickInstruction,
      recipient: quickRecipient
    });
  };

  const handleDeleteEmail = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to move this email to trash?')) {
      return;
    }

    setDeletingId(id);
    try {
      const res = await apiFetch(`/api/emails/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setRecentEmails(prev => prev.filter(email => email.id !== id));
        if (detailModalEmail?.id === id) setDetailModalEmail(null);
        fetchDashboardData();
      }
    } catch (err) {
      console.error('Error deleting email:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const handleRetryEmail = async (e, email) => {
    e.stopPropagation();
    setRetryingId(email.id);
    try {
      const res = await apiFetch(`/api/emails/${email.id}/retry`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setRecentEmails(prev => prev.map(item => item.id === email.id ? data.email : item));
        if (detailModalEmail?.id === email.id) setDetailModalEmail(data.email);
        alert(`✅ Email retried and sent successfully to ${email.recipient}!`);
        fetchDashboardData();
      } else {
        alert(`❌ Retry failed: ${data.error || 'Check Gmail OAuth connection.'}`);
      }
    } catch (err) {
      console.error('Retry error:', err);
      alert(`❌ Retry error: ${err.message}`);
    } finally {
      setRetryingId(null);
    }
  };

  const renderStatusBadge = (status, errorMessage) => {
    if (status === 'Sent') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#137333] bg-[#E6F4EA] border border-[#A8DADC] px-2.5 py-0.5 rounded-full">
          <CheckCircle className="w-3 h-3 text-[#667A45]" />
          ✓ Sent
        </span>
      );
    }
    if (status === 'Failed') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-700 bg-red-50 border border-red-200 px-2.5 py-0.5 rounded-full" title={errorMessage || 'Sending failed'}>
          <AlertCircle className="w-3 h-3 text-red-600 shrink-0" />
          Failed
        </span>
      );
    }
    if (status === 'Sending') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#3F4D2A] bg-[#FAF8F1] border border-[#D8D1BC] px-2.5 py-0.5 rounded-full animate-pulse">
          <RefreshCw className="w-3 h-3 text-[#667A45] animate-spin" />
          Sending...
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#6F725F] bg-[#F2EBDD] border border-[#D8D1BC] px-2.5 py-0.5 rounded-full">
        <Clock className="w-3 h-3 text-[#6F725F]" />
        {status || 'Draft'}
      </span>
    );
  };

  const getCategoryBadgeClass = (category) => {
    if (!category) return 'badge-official';
    if (category.includes('Emergency')) return 'badge-emergency';
    if (category.includes('Leave')) return 'badge-[#667A45]';
    if (category.includes('Resume')) return 'badge-resume';
    if (category.includes('Official')) return 'badge-official';
    if (category.includes('Casual')) return 'badge-casual';
    if (category.includes('Occasion')) return 'badge-celebration';
    if (category.includes('Follow-up')) return 'badge-followup';
    return 'badge-official';
  };

  return (
    <div className="space-y-8 animate-fadeIn">

      {/* Push Notification Opt-in Banner */}
      {showPushBanner && (
        <div className="glass-panel p-4 sm:p-5 rounded-2xl border border-[#D8D1BC] bg-[#FAF8F1] flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs animate-fadeIn">
          <div className="flex items-center gap-3 text-center sm:text-left">
            <div className="w-10 h-10 rounded-2xl bg-[#667A45] text-[#FAF8F1] flex items-center justify-center font-bold shrink-0 shadow-xs">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-extrabold text-[#28321D]">Allow Scribe AI to send login and security notifications?</h4>
              <p className="text-[11px] text-[#6F725F]">
                Receive instant Web Push alerts on your phone or browser whenever a new sign-in occurs.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleEnablePush}
              className="px-4 py-2 rounded-xl gradient-btn text-[#FAF8F1] text-xs font-bold shadow-xs hover:scale-[1.02] cursor-pointer"
            >
              🔔 Allow Notifications
            </button>
            <button
              onClick={() => {
                setShowPushBanner(false);
                sessionStorage.setItem('dismissPushBanner', 'true');
              }}
              className="px-3 py-2 rounded-xl text-[#6F725F] hover:text-[#28321D] text-xs font-semibold cursor-pointer"
            >
              Not now
            </button>
          </div>
        </div>
      )}

      {/* Gmail Connection Status Card */}
      {!connectionStatus.isConnected || connectionStatus.status === 'DISCONNECTED' ? (
        <div className="glass-panel p-6 rounded-3xl border border-[#D8D1BC] flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#FAF8F1] shadow-xs">
          <div className="space-y-1 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
              <h3 className="text-base font-extrabold text-[#28321D]">Connect Your Gmail</h3>
              <span className="text-[11px] font-bold text-amber-800 bg-amber-100 border border-amber-300 px-2.5 py-0.5 rounded-full">
                ● Gmail Not Connected
              </span>
            </div>
            <p className="text-xs text-[#6F725F] max-w-xl">
              Connect your Gmail account to send emails directly from AI Smart Sender.
            </p>
          </div>

          <button
            onClick={handleConnectGmail}
            className="px-6 py-3 rounded-2xl gradient-btn text-[#FAF8F1] font-extrabold text-xs inline-flex items-center gap-2 shadow-md hover:scale-[1.02] cursor-pointer shrink-0"
          >
            <ExternalLink className="w-4 h-4" />
            ⚡ Connect Gmail
          </button>
        </div>
      ) : connectionStatus.status === 'NEEDS_ATTENTION' ? (
        <div className="glass-panel p-6 rounded-3xl border border-amber-300 bg-amber-50 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
          <div className="space-y-1 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
              <h3 className="text-base font-extrabold text-[#28321D]">Gmail Connection Needs Attention</h3>
              <span className="text-[11px] font-bold text-amber-800 bg-amber-100 border border-amber-300 px-2.5 py-0.5 rounded-full">
                ⚠️ Re-authorization Required
              </span>
            </div>
            <p className="text-xs text-[#6F725F]">
              Your Gmail connection needs to be renewed. Click reconnect to refresh permissions.
            </p>
          </div>

          <button
            onClick={handleConnectGmail}
            className="px-6 py-3 rounded-2xl gradient-btn text-[#FAF8F1] font-extrabold text-xs inline-flex items-center gap-2 shadow-md hover:scale-[1.02] cursor-pointer shrink-0"
          >
            <RefreshCw className="w-4 h-4" />
            Reconnect Gmail
          </button>
        </div>
      ) : (
        <div className="glass-panel p-6 rounded-3xl border border-[#A8DADC] bg-[#E6F4EA] flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#667A45] text-[#FAF8F1] flex items-center justify-center font-extrabold shadow-sm shrink-0">
              <CheckCircle className="w-5 h-5 text-[#FAF8F1]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-extrabold text-[#28321D]">✓ Gmail Connected</h3>
                <span className="text-[10px] font-bold text-[#137333] bg-white border border-[#A8DADC] px-2 py-0.5 rounded-full">
                  OAuth Active
                </span>
              </div>
              <p className="text-xs font-mono text-[#137333] font-bold mt-0.5">
                Connected account: {connectionStatus.connectedEmail}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleDisconnectGmail}
              className="px-3.5 py-2.5 rounded-xl bg-white hover:bg-red-50 text-red-700 border border-red-200 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5 text-red-600" />
              Disconnect Gmail
            </button>
            <button
              onClick={onNavigateToSettings}
              className="px-3.5 py-2.5 rounded-xl bg-white hover:bg-[#FAF8F1] text-[#3F4D2A] border border-[#A8DADC] font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5 text-[#667A45]" />
              Manage Settings
            </button>
          </div>
        </div>
      )}
      
      {/* Welcome & Quick Compose Section */}
      <div className="relative overflow-hidden rounded-3xl glass-panel p-8 border border-[#D8D1BC]">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#E8DFC8] border border-[#D8D1BC] text-[#3F4D2A] text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-[#667A45]" />
            AI Smart Sender Real-Time Engine
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#28321D] tracking-tight">
              {greeting}
            </h1>
            <p className="text-[#6F725F] text-xs sm:text-sm mt-1 font-medium">
              Manage your emails intelligently. Enter a short instruction — AI classifies, generates, previews, and dispatches via Gmail.
            </p>
          </div>

          {/* Quick Compose Form */}
          <form onSubmit={handleQuickSubmit} className="space-y-3 pt-2">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder='e.g., "Inform manager I need emergency leave this afternoon for doctor appointment."'
                  value={quickInstruction}
                  onChange={(e) => setQuickInstruction(e.target.value)}
                  className="w-full pl-4 pr-4 py-3.5 rounded-xl glass-input text-xs text-[#28321D] placeholder-[#6F725F] focus:ring-2 focus:ring-[#667A45]"
                />
              </div>
              <div className="w-full sm:w-64 relative">
                <input
                  type="email"
                  placeholder="Recipient (e.g. manager@example.com)"
                  value={quickRecipient}
                  onChange={(e) => setQuickRecipient(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-xl glass-input text-xs text-[#28321D] placeholder-[#6F725F] focus:ring-2 focus:ring-[#667A45]"
                />
              </div>
              <button
                type="submit"
                className="px-6 py-3.5 rounded-xl gradient-btn text-[#FAF8F1] font-bold text-xs flex items-center justify-center gap-2 shadow-md hover:scale-[1.02] active:scale-[0.98] transition-transform cursor-pointer shrink-0"
              >
                <Sparkles className="w-4 h-4 text-[#E8DFC8]" />
                Generate Email
              </button>
            </div>
            
            {/* Quick Suggestions */}
            <div className="flex flex-wrap items-center gap-2 text-xs text-[#6F725F] pt-1">
              <span className="text-[#3F4D2A] font-bold">Try:</span>
              <button
                type="button"
                onClick={() => setQuickInstruction('I am on leave for 3 days due to illness.')}
                className="px-2.5 py-1 rounded-lg bg-[#FAF8F1] hover:bg-[#E8DFC8] text-[#3F4D2A] transition-colors border border-[#D8D1BC] cursor-pointer"
              >
                🏖️ Sick leave 3 days
              </button>
              <button
                type="button"
                onClick={() => setQuickInstruction('I need emergency leave this afternoon because of a doctor appointment.')}
                className="px-2.5 py-1 rounded-lg bg-[#FAF8F1] hover:bg-[#E8DFC8] text-[#3F4D2A] transition-colors border border-[#D8D1BC] cursor-pointer"
              >
                🚨 Emergency leave today
              </button>
              <button
                type="button"
                onClick={() => setQuickInstruction('Send my resume for software developer position.')}
                className="px-2.5 py-1 rounded-lg bg-[#FAF8F1] hover:bg-[#E8DFC8] text-[#3F4D2A] transition-colors border border-[#D8D1BC] cursor-pointer"
              >
                📄 Send Resume
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Elegant Summary Cards Grid (Beige Cards with Olive Icons) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        
        <div className="glass-card p-5 rounded-2xl border border-[#D8D1BC] flex items-center justify-between shadow-xs">
          <div>
            <span className="text-xs font-bold text-[#6F725F] block">Emails Sent</span>
            <p className="text-2xl font-extrabold text-[#28321D] mt-1">{stats.sentToday || stats.totalEmails}</p>
            <span className="text-[10px] text-[#667A45] font-semibold">Active dispatch</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#667A45]/15 border border-[#879B62]/40 flex items-center justify-center text-[#667A45]">
            <Send className="w-5 h-5" />
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-[#D8D1BC] flex items-center justify-between shadow-xs">
          <div>
            <span className="text-xs font-bold text-[#6F725F] block">Drafts</span>
            <p className="text-2xl font-extrabold text-[#28321D] mt-1">{stats.drafts || 0}</p>
            <span className="text-[10px] text-[#6F725F] font-semibold">Saved drafts</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#E8DFC8] border border-[#D8D1BC] flex items-center justify-center text-[#3F4D2A]">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-[#D8D1BC] flex items-center justify-between shadow-xs">
          <div>
            <span className="text-xs font-bold text-[#6F725F] block">Scheduled</span>
            <p className="text-2xl font-extrabold text-[#28321D] mt-1">0</p>
            <span className="text-[10px] text-[#6F725F] font-semibold">Queue ready</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#E8DFC8] border border-[#D8D1BC] flex items-center justify-center text-[#667A45]">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-[#D8D1BC] flex items-center justify-between shadow-xs">
          <div>
            <span className="text-xs font-bold text-[#6F725F] block">Emergency</span>
            <p className="text-2xl font-extrabold text-red-700 mt-1">{stats.emergency}</p>
            <span className="text-[10px] text-red-600 font-semibold">High priority</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-[#D8D1BC] flex items-center justify-between shadow-xs">
          <div>
            <span className="text-xs font-bold text-[#6F725F] block">Pending Review</span>
            <p className="text-2xl font-extrabold text-[#3F4D2A] mt-1">{stats.pending || 0}</p>
            <span className="text-[10px] text-[#667A45] font-semibold">Awaiting confirm</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#667A45]/15 border border-[#879B62]/40 flex items-center justify-center text-[#667A45]">
            <CheckCircle className="w-5 h-5" />
          </div>
        </div>

      </div>

      {/* Real-Time Email Activity Section */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-[#D8D1BC] space-y-6">
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#D8D1BC] pb-4">
          <div>
            <h3 className="text-xl font-extrabold text-[#28321D] flex items-center gap-2">
              <Mail className="w-5 h-5 text-[#667A45]" />
              Recent Emails Activity
            </h3>
            <p className="text-xs text-[#6F725F] mt-0.5">Live status tracking & email log across all situations</p>
          </div>

          {/* Search & Status Filters */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative w-full sm:w-60">
              <Search className="w-3.5 h-3.5 text-[#6F725F] absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search recipient, subject..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-2 rounded-xl glass-input text-xs text-[#28321D]"
              />
            </div>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 rounded-xl glass-input text-xs text-[#28321D] font-bold"
            >
              {STATUS_FILTERS.map(st => (
                <option key={st} value={st}>Status: {st}</option>
              ))}
            </select>

            <button
              onClick={onViewHistory}
              className="text-xs font-bold text-[#667A45] hover:text-[#3F4D2A] flex items-center gap-1 transition-colors ml-auto cursor-pointer"
            >
              All History <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Category Filters Toolbar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
          {CATEGORIES_LIST.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-[#667A45] text-[#FAF8F1] shadow-xs'
                  : 'bg-[#FAF8F1] text-[#3F4D2A] border border-[#D8D1BC] hover:bg-[#E8DFC8]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Recent Email Cards Grid */}
        {loading ? (
          <div className="text-center py-12 text-[#6F725F]">
            <RefreshCw className="w-7 h-7 mx-auto mb-2 animate-spin text-[#667A45]" />
            <p className="text-xs font-semibold">Syncing email status from server...</p>
          </div>
        ) : recentEmails.length === 0 ? (
          <div className="text-center py-12 text-[#6F725F]">
            <Mail className="w-10 h-10 mx-auto mb-2 opacity-50 text-[#879B62]" />
            <p className="text-sm font-bold text-[#28321D]">No email activity matching your filter.</p>
            <p className="text-xs text-[#6F725F] mt-1">Compose a new email or change category/status filter.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentEmails.map((email) => (
              <div
                key={email.id}
                onClick={() => setDetailModalEmail(email)}
                className="glass-card p-5 rounded-2xl space-y-3 cursor-pointer hover:scale-[1.01] transition-all flex flex-col justify-between border border-[#D8D1BC]"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between flex-wrap gap-1">
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${getCategoryBadgeClass(email.situation || email.category)}`}>
                      {email.situation || email.category || '💼 Official'}
                    </span>
                    {renderStatusBadge(email.status, email.errorMessage)}
                  </div>

                  <h4 className="text-sm font-bold text-[#28321D] line-clamp-1">
                    {email.subject}
                  </h4>

                  <p className="text-xs text-[#6F725F]">
                    To: <span className="font-semibold text-[#3F4D2A]">{email.recipient}</span>
                  </p>
                </div>

                <div className="pt-3 border-t border-[#D8D1BC] flex items-center justify-between text-[11px] text-[#6F725F]">
                  <span className="font-semibold text-[#3F4D2A]">Priority: {email.priority || 'High'}</span>
                  <span>{new Date(email.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Email Detail Modal */}
      {detailModalEmail && (
        <div className="fixed inset-0 z-50 bg-[#28321D]/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel max-w-2xl w-full p-6 sm:p-8 rounded-3xl border border-[#D8D1BC] space-y-6 max-h-[90vh] overflow-y-auto animate-fadeIn shadow-2xl">
            <div className="flex items-start justify-between border-b border-[#D8D1BC] pb-4">
              <div>
                <span className={`text-xs font-bold px-3 py-1 rounded-full ${getCategoryBadgeClass(detailModalEmail.situation || detailModalEmail.category)}`}>
                  {detailModalEmail.situation || detailModalEmail.category}
                </span>
                <h3 className="text-lg font-bold text-[#28321D] mt-2">
                  {detailModalEmail.subject}
                </h3>
              </div>
              <button
                onClick={() => setDetailModalEmail(null)}
                className="p-1 rounded-lg text-[#6F725F] hover:text-[#28321D] hover:bg-[#E8DFC8] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-[#3F4D2A]">
              <p><strong>To:</strong> {detailModalEmail.recipient}</p>
              {detailModalEmail.cc && <p><strong>CC:</strong> {detailModalEmail.cc}</p>}
              {detailModalEmail.bcc && <p><strong>BCC:</strong> {detailModalEmail.bcc}</p>}
              <p><strong>Priority:</strong> {detailModalEmail.priority || 'Normal'}</p>
              <p><strong>Tone:</strong> {detailModalEmail.tone || 'Professional'}</p>
              <p><strong>Sent Date:</strong> {new Date(detailModalEmail.createdAt).toLocaleString()}</p>
            </div>

            <div className="p-4 rounded-2xl bg-[#FAF8F1] border border-[#D8D1BC] text-xs text-[#28321D] whitespace-pre-wrap font-sans leading-relaxed">
              {detailModalEmail.body}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              {detailModalEmail.status === 'Failed' && (
                <button
                  onClick={(e) => handleRetryEmail(e, detailModalEmail)}
                  className="px-4 py-2 rounded-xl gradient-btn text-[#FAF8F1] font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4" />
                  Retry Email
                </button>
              )}

              <button
                onClick={(e) => handleDeleteEmail(e, detailModalEmail.id)}
                className="px-4 py-2 rounded-xl bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                Move to Trash
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
