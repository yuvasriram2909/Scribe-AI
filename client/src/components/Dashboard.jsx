import React, { useState, useEffect } from 'react';
import { 
  Mail, Send, AlertTriangle, Calendar, FileText, Briefcase, Sparkles, 
  ArrowRight, CheckCircle, Trash2, Search, Filter, RefreshCw, X, AlertCircle, Clock, ShieldAlert, Heart, Users, Check, ExternalLink, Settings, Bell, LogOut, ChevronRight, Wand2
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
    return { title: 'Good morning!', icon: '☀️' };
  }
  if (hour >= 12 && hour < 17) {
    return { title: 'Good afternoon!', icon: '🌤️' };
  }
  if (hour >= 17 && hour < 21) {
    return { title: 'Good evening!', icon: '🌆' };
  }
  return { title: 'Good night!', icon: '🌙' };
}

export function Dashboard({ onStartCompose, onViewHistory, onNavigateToSettings, onViewNotifications }) {
  const [greetingObj, setGreetingObj] = useState(() => getTimeBasedGreeting());

  useEffect(() => {
    // Update greeting every 60s across time boundaries
    const interval = setInterval(() => {
      setGreetingObj(getTimeBasedGreeting());
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
    scheduled: 0,
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

    // Real-time live polling every 5 seconds
    const interval = setInterval(() => {
      fetchDashboardData();
      checkConnectionStatus();
    }, 5000);

    return () => clearInterval(interval);
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
      const res = await apiFetch('/api/auth/google/start');
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

      if (statsRes.ok) {
        const sData = await statsRes.json();
        if (sData) {
          setStats({
            totalEmails: typeof sData.sent === 'number' ? sData.sent : (sData.total ?? 0),
            sentToday: sData.sentToday ?? 0,
            drafts: sData.drafts ?? 0,
            emergency: sData.emergency ?? 0,
            scheduled: sData.scheduled ?? 0,
            pending: sData.pending ?? 0,
            leave: sData.leave ?? 0,
            resume: sData.resume ?? 0,
            official: sData.official ?? 0
          });
        }
      }

      if (emailsRes.ok) {
        const emails = await emailsRes.json();
        setRecentEmails(Array.isArray(emails) ? emails : []);
      }
    } catch (err) {
      console.error('Dashboard data fetch error:', err);
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

  const handleQuickChip = (instruction) => {
    onStartCompose({ instruction });
  };

  const handleDeleteEmail = async (id, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm('Move this email to trash?')) return;
    try {
      setDeletingId(id);
      const res = await apiFetch(`/api/emails/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setRecentEmails(prev => prev.filter(email => email.id !== id));
      }
    } catch (err) {
      console.error('Delete error:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const handleRetryEmail = async (email, e) => {
    if (e) e.stopPropagation();
    try {
      setRetryingId(email.id);
      const res = await apiFetch(`/api/emails/${email.id}/retry`, { method: 'POST' });
      if (res.ok) {
        fetchDashboardData();
      }
    } catch (err) {
      console.error('Retry error:', err);
    } finally {
      setRetryingId(null);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">

      {/* Push Notification Opt-in Banner */}
      {showPushBanner && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-900/60 to-indigo-900/50 border border-purple-500/30 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xl animate-fadeIn">
          <div className="flex items-center gap-3 text-center sm:text-left">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-500 text-white flex items-center justify-center font-bold shrink-0 shadow-lg shadow-purple-600/30">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-extrabold text-white">Allow Scribe AI to send login and security notifications?</h4>
              <p className="text-[11px] text-slate-300">
                Receive instant Web Push alerts on your device whenever a new sign-in occurs.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleEnablePush}
              className="px-4 py-2 rounded-xl gradient-btn text-white text-xs font-bold shadow-md cursor-pointer"
            >
              🔔 Allow Notifications
            </button>
            <button
              onClick={() => {
                setShowPushBanner(false);
                sessionStorage.setItem('dismissPushBanner', 'true');
              }}
              className="px-3 py-2 rounded-xl text-slate-400 hover:text-white text-xs font-semibold cursor-pointer"
            >
              Not now
            </button>
          </div>
        </div>
      )}

      {/* 1. Gmail Connection Status Glowing Banner */}
      {connectionStatus.isConnected ? (
        <div className="relative overflow-hidden rounded-2xl p-[1px] bg-gradient-to-r from-cyan-500/40 via-purple-500/40 to-pink-500/40 shadow-xl">
          <div className="bg-[#0D1322]/90 backdrop-blur-xl p-4 sm:p-5 rounded-[15px] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              {/* Official Gmail Color Icon Circle */}
              <div className="w-11 h-11 rounded-2xl bg-white flex items-center justify-center shadow-md shrink-0">
                <svg className="w-6 h-6" viewBox="0 0 24 24">
                  <path fill="#EA4335" d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2z" opacity=".15"/>
                  <path fill="#4285F4" d="M20 4H4c-1.1 0-2 .9-2 2v.8l10 6.25 10-6.25V6c0-1.1-.9-2-2-2z"/>
                  <path fill="#34A853" d="M4 20h16c1.1 0 2-.9 2-2V8.25l-10 6.25-10-6.25V18c0 1.1.9 2 2 2z"/>
                  <path fill="#EA4335" d="M22 6c0-.42-.14-.8-.37-1.12L12 11 2.37 4.88C2.14 5.2 2 5.58 2 6v2.25l10 6.25 10-6.25V6z"/>
                </svg>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-extrabold text-white">Gmail Connected</h3>
                  <span className="text-[10px] font-bold text-emerald-300 bg-emerald-950/80 border border-emerald-500/40 px-2.5 py-0.5 rounded-full shadow-xs">
                    OAuth Active
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Connected account: <span className="font-mono text-slate-200 font-semibold">{connectionStatus.connectedEmail || localStorage.getItem('userEmail') || 'Account Active'}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <button
                onClick={handleDisconnectGmail}
                className="px-3.5 py-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 hover:text-rose-200 border border-rose-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Disconnect Gmail</span>
              </button>
              <button
                onClick={onNavigateToSettings}
                className="px-3.5 py-2 rounded-xl bg-purple-950/40 hover:bg-purple-900/60 text-purple-300 hover:text-purple-200 border border-purple-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Manage Settings</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative overflow-hidden rounded-2xl p-[1px] bg-gradient-to-r from-amber-500/40 via-purple-500/40 to-cyan-500/40 shadow-xl">
          <div className="bg-[#0D1322]/90 backdrop-blur-xl p-4 sm:p-5 rounded-[15px] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse"></span>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-extrabold text-white">Connect Your Gmail</h3>
                  <span className="text-[10px] font-bold text-amber-300 bg-amber-950/80 border border-amber-500/40 px-2 py-0.5 rounded-full">
                    ● Gmail Not Connected
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Connect your Google account to authorize AI-drafted email dispatches.
                </p>
              </div>
            </div>
            <button
              onClick={handleConnectGmail}
              className="px-5 py-2.5 rounded-xl gradient-btn text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-purple-600/30 hover:scale-105 transition-all cursor-pointer shrink-0"
            >
              <ExternalLink className="w-4 h-4" />
              <span>⚡ Connect Gmail</span>
            </button>
          </div>
        </div>
      )}

      {/* 2. Hero AI Smart Sender Real-Time Engine Banner */}
      <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-[#1A0B2E] via-[#0E152E] to-[#0A1020] border border-purple-500/30 shadow-2xl">
        
        {/* Background Cosmic Star Particle Lights */}
        <div className="absolute top-0 right-1/4 w-72 h-72 bg-purple-600/20 rounded-full blur-3xl pointer-events-none -z-0"></div>
        <div className="absolute bottom-0 right-10 w-80 h-80 bg-blue-600/20 rounded-full blur-3xl pointer-events-none -z-0"></div>

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="max-w-2xl space-y-4">
            
            {/* Tag Badges */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#161329] border border-purple-500/30 text-[11px] font-bold tracking-wider">
              <span className="flex items-center gap-1 text-pink-300">
                <Sparkles className="w-3.5 h-3.5 text-pink-400" />
                AI SMART SENDER
              </span>
              <span className="text-slate-600">|</span>
              <span className="text-purple-300 bg-purple-900/60 px-2 py-0.5 rounded-full text-[10px]">
                REAL-TIME ENGINE
              </span>
            </div>

            {/* Dynamic Local Time Greeting Heading */}
            <div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight flex items-center gap-2">
                <span>{greetingObj.title}</span>
                <span>{greetingObj.icon}</span>
              </h1>
              <h2 className="text-2xl sm:text-3xl font-extrabold mt-1 gradient-text-cyan tracking-tight">
                What do you want to send today?
              </h2>
              <p className="text-slate-400 text-xs sm:text-sm mt-2 leading-relaxed">
                Manage your emails intelligently. Enter a short instruction — AI classifies, generates, previews, and dispatches via Gmail.
              </p>
            </div>

            {/* Quick Compose Input Row */}
            <form onSubmit={handleQuickSubmit} className="space-y-3 pt-2">
              <div className="flex flex-col sm:flex-row gap-2.5">
                <div className="flex-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-purple-400">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    placeholder='e.g., "Inform manager I need emergency leave this week"'
                    value={quickInstruction}
                    onChange={(e) => setQuickInstruction(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-2xl glass-input text-xs text-white placeholder-slate-500"
                  />
                </div>
                <div className="w-full sm:w-64 relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Users className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    placeholder="Recipient (e.g. manager@example.com)"
                    value={quickRecipient}
                    onChange={(e) => setQuickRecipient(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-2xl glass-input text-xs text-white placeholder-slate-500"
                  />
                </div>
                <button
                  type="submit"
                  className="px-6 py-3 rounded-2xl gradient-btn text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-purple-600/40 hover:scale-105 transition-all cursor-pointer shrink-0"
                >
                  <Wand2 className="w-4 h-4 text-pink-200" />
                  <span>Generate Email</span>
                </button>
              </div>
            </form>

            {/* Try Chips */}
            <div className="flex items-center gap-2 flex-wrap pt-1 text-xs">
              <span className="text-slate-400 font-semibold text-[11px]">Try:</span>
              <button
                type="button"
                onClick={() => handleQuickChip('Sick leave for 3 days due to high fever and illness')}
                className="px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-300 hover:text-white text-[11px] font-medium flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <span>🩺</span> Sick leave 3 days
              </button>
              <button
                type="button"
                onClick={() => handleQuickChip('Emergency leave today afternoon for doctor appointment')}
                className="px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-300 hover:text-white text-[11px] font-medium flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <span>🚨</span> Emergency leave today
              </button>
              <button
                type="button"
                onClick={() => handleQuickChip('Resume and cover letter job application for Software Engineer position')}
                className="px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-300 hover:text-white text-[11px] font-medium flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <span>📄</span> Send Resume
              </button>
            </div>
          </div>

          {/* Right Glowing 3D Neon Email Envelope & Paper Plane Illustration */}
          <div className="hidden lg:flex items-center justify-center relative w-64 h-64 shrink-0 animate-float">
            {/* Glow Aura */}
            <div className="absolute inset-0 bg-gradient-to-tr from-purple-600/30 to-blue-500/30 rounded-full blur-2xl"></div>
            
            {/* 3D Glass Envelope Card */}
            <div className="relative z-10 w-48 h-36 rounded-3xl bg-gradient-to-br from-indigo-500/40 via-purple-600/50 to-pink-500/40 p-[1px] shadow-2xl backdrop-blur-md">
              <div className="w-full h-full bg-[#0E132B]/80 rounded-[23px] flex flex-col items-center justify-center p-4 relative overflow-hidden">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-500 to-cyan-400 flex items-center justify-center text-white shadow-lg shadow-cyan-500/30 mb-1">
                  <Mail className="w-7 h-7 text-white" />
                </div>
                <span className="text-[10px] font-bold text-cyan-300 tracking-wider">AI DISPATCH READY</span>
                
                {/* Neon Flying Paper Plane */}
                <div className="absolute -top-3 -right-3 w-10 h-10 rounded-full bg-gradient-to-tr from-pink-500 to-purple-500 flex items-center justify-center shadow-lg shadow-pink-500/50 transform rotate-12">
                  <Send className="w-5 h-5 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Five Metric Cards with Glowing Neon Waves */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        
        {/* Card 1: Emails Sent */}
        <div className="glass-card p-4 sm:p-5 rounded-2xl relative overflow-hidden group hover:border-cyan-500/40">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400">Emails Sent</span>
            <div className="w-8 h-8 rounded-xl bg-cyan-950/60 border border-cyan-500/30 text-cyan-400 flex items-center justify-center shadow-sm">
              <Send className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white">{stats.totalEmails}</div>
          <p className="text-[11px] text-slate-400 font-medium mt-0.5">Active dispatch</p>
          
          {/* Cyan Neon Wave */}
          <div className="mt-3 -mx-5 -mb-5 h-8 overflow-hidden opacity-75 group-hover:opacity-100 transition-opacity">
            <svg viewBox="0 0 100 25" preserveAspectRatio="none" className="w-full h-full text-cyan-400 fill-cyan-400/10 stroke-cyan-400 stroke-[1.5]">
              <path d="M0 15 Q 25 5, 50 15 T 100 15 L 100 25 L 0 25 Z" />
            </svg>
          </div>
        </div>

        {/* Card 2: Drafts */}
        <div className="glass-card p-4 sm:p-5 rounded-2xl relative overflow-hidden group hover:border-purple-500/40">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400">Drafts</span>
            <div className="w-8 h-8 rounded-xl bg-purple-950/60 border border-purple-500/30 text-purple-400 flex items-center justify-center shadow-sm">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white">{stats.drafts}</div>
          <p className="text-[11px] text-slate-400 font-medium mt-0.5">Saved drafts</p>
          
          {/* Purple Neon Wave */}
          <div className="mt-3 -mx-5 -mb-5 h-8 overflow-hidden opacity-75 group-hover:opacity-100 transition-opacity">
            <svg viewBox="0 0 100 25" preserveAspectRatio="none" className="w-full h-full text-purple-400 fill-purple-400/10 stroke-purple-400 stroke-[1.5]">
              <path d="M0 18 Q 25 8, 50 16 T 100 12 L 100 25 L 0 25 Z" />
            </svg>
          </div>
        </div>

        {/* Card 3: Scheduled */}
        <div className="glass-card p-4 sm:p-5 rounded-2xl relative overflow-hidden group hover:border-amber-500/40">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400">Scheduled</span>
            <div className="w-8 h-8 rounded-xl bg-amber-950/60 border border-amber-500/30 text-amber-400 flex items-center justify-center shadow-sm">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white">{stats.scheduled}</div>
          <p className="text-[11px] text-slate-400 font-medium mt-0.5">Queue ready</p>
          
          {/* Amber Neon Wave */}
          <div className="mt-3 -mx-5 -mb-5 h-8 overflow-hidden opacity-75 group-hover:opacity-100 transition-opacity">
            <svg viewBox="0 0 100 25" preserveAspectRatio="none" className="w-full h-full text-amber-400 fill-amber-400/10 stroke-amber-400 stroke-[1.5]">
              <path d="M0 14 Q 30 20, 60 10 T 100 15 L 100 25 L 0 25 Z" />
            </svg>
          </div>
        </div>

        {/* Card 4: Emergency */}
        <div className="glass-card p-4 sm:p-5 rounded-2xl relative overflow-hidden group hover:border-rose-500/40">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400">Emergency</span>
            <div className="w-8 h-8 rounded-xl bg-rose-950/60 border border-rose-500/30 text-rose-400 flex items-center justify-center shadow-sm">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white">{stats.emergency}</div>
          <p className="text-[11px] text-rose-400 font-semibold mt-0.5">High priority</p>
          
          {/* Rose Neon Wave */}
          <div className="mt-3 -mx-5 -mb-5 h-8 overflow-hidden opacity-75 group-hover:opacity-100 transition-opacity">
            <svg viewBox="0 0 100 25" preserveAspectRatio="none" className="w-full h-full text-rose-400 fill-rose-400/10 stroke-rose-400 stroke-[1.5]">
              <path d="M0 16 Q 20 6, 50 18 T 100 14 L 100 25 L 0 25 Z" />
            </svg>
          </div>
        </div>

        {/* Card 5: Pending Review */}
        <div className="glass-card p-4 sm:p-5 rounded-2xl relative overflow-hidden group hover:border-emerald-500/40 col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400">Pending Review</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shadow-sm">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white">{stats.pending}</div>
          <p className="text-[11px] text-slate-400 font-medium mt-0.5">Awaiting confirm</p>
          
          {/* Emerald Neon Wave */}
          <div className="mt-3 -mx-5 -mb-5 h-8 overflow-hidden opacity-75 group-hover:opacity-100 transition-opacity">
            <svg viewBox="0 0 100 25" preserveAspectRatio="none" className="w-full h-full text-emerald-400 fill-emerald-400/10 stroke-emerald-400 stroke-[1.5]">
              <path d="M0 12 Q 25 18, 50 12 T 100 16 L 100 25 L 0 25 Z" />
            </svg>
          </div>
        </div>

      </div>

      {/* 4. Recent Activity & AI Suggestions Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recent Activity (2 Cols) */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <Clock className="w-4.5 h-4.5 text-purple-400" />
              Recent Activity
            </h3>
            <button
              onClick={onViewHistory}
              className="text-xs text-purple-400 hover:text-purple-300 font-semibold flex items-center gap-1 cursor-pointer"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {recentEmails.length === 0 ? (
            <div className="text-center py-10 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center mx-auto text-slate-400">
                <Mail className="w-6 h-6" />
              </div>
              <p className="text-xs text-slate-400">No emails sent yet. Generate your first email with AI!</p>
              <button
                onClick={() => onStartCompose()}
                className="px-4 py-2 rounded-xl gradient-btn text-white text-xs font-bold shadow-md cursor-pointer"
              >
                Compose Email
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {recentEmails.slice(0, 4).map((email) => (
                <div
                  key={email.id}
                  onClick={() => setDetailModalEmail(email)}
                  className="p-3.5 rounded-2xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700/60 flex items-center justify-between gap-3 cursor-pointer transition-all hover:scale-[1.01]"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-purple-950/70 border border-purple-500/30 text-purple-300 flex items-center justify-center shrink-0">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-white truncate">{email.subject || 'No Subject'}</h4>
                      <p className="text-[11px] text-slate-400 truncate">To: {email.recipient}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 font-bold">
                      {email.status || 'Sent'}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {new Date(email.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* AI Suggestions (1 Col) */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <Sparkles className="w-4.5 h-4.5 text-cyan-400" />
              AI Suggestions
            </h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-900/60 border border-purple-500/40 text-purple-300">
              New
            </span>
          </div>

          <div className="space-y-3">
            <div
              onClick={() => onStartCompose({ instruction: 'Follow up on pending project status and response timeline' })}
              className="p-3.5 rounded-2xl bg-gradient-to-r from-purple-950/40 to-slate-800/40 border border-purple-500/20 hover:border-purple-500/40 cursor-pointer transition-all group"
            >
              <div className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white group-hover:text-purple-300 transition-colors">
                    Follow up on pending responses
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Draft a polite follow-up email to colleagues for quick updates.
                  </p>
                </div>
              </div>
            </div>

            <div
              onClick={() => onStartCompose({ instruction: 'Schedule a team sync meeting to review weekly milestones' })}
              className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-950/40 to-slate-800/40 border border-blue-500/20 hover:border-blue-500/40 cursor-pointer transition-all group"
            >
              <div className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white group-hover:text-blue-300 transition-colors">
                    Schedule weekly milestone review
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Send an organized meeting invite with an agenda outline.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Email Detail Modal */}
      {detailModalEmail && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-2xl rounded-3xl p-6 sm:p-8 border border-slate-700 shadow-2xl space-y-5 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">Email Inspection</span>
                <h3 className="text-lg font-extrabold text-white mt-0.5">{detailModalEmail.subject}</h3>
              </div>
              <button onClick={() => setDetailModalEmail(null)} className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-800/50 p-3.5 rounded-2xl border border-slate-700/60">
              <div><span className="text-slate-500">To:</span> <span className="font-mono text-slate-200">{detailModalEmail.recipient}</span></div>
              <div><span className="text-slate-500">Status:</span> <span className="text-emerald-400 font-bold">{detailModalEmail.status}</span></div>
              <div><span className="text-slate-500">Category:</span> <span className="text-purple-300">{detailModalEmail.category}</span></div>
              <div><span className="text-slate-500">Date:</span> <span className="text-slate-300">{new Date(detailModalEmail.createdAt).toLocaleString()}</span></div>
            </div>

            <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 max-h-60 overflow-y-auto">
              <pre className="text-xs text-slate-200 whitespace-pre-wrap font-sans leading-relaxed">
                {detailModalEmail.body}
              </pre>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setDetailModalEmail(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
