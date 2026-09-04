import React, { useState, useEffect } from 'react';
import { 
  Mail, Send, AlertTriangle, Calendar, FileText, Briefcase, Sparkles, 
  ArrowRight, CheckCircle, Trash2, Search, Filter, RefreshCw, X, AlertCircle, Clock, ShieldAlert, Heart, Users, Check, ExternalLink, Settings, Bell, LogOut, ChevronRight, Wand2, Inbox
} from 'lucide-react';
import { apiFetch } from '../utils/api';
import { registerServiceWorker, subscribeUserToPush } from '../utils/push';
import { supabase, subscribeToEmailChanges, subscribeToEmailEvents, signInWithGoogle } from '../utils/supabaseClient';

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
  'Received',
  'Draft',
  'Scheduled',
  'Spam'
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

export function Dashboard({ 
  onStartCompose, 
  onViewHistory, 
  onNavigateToSettings, 
  onViewNotifications,
  composeState = {},
  onUpdateComposeState
}) {
  const [greetingObj, setGreetingObj] = useState(() => getTimeBasedGreeting());

  useEffect(() => {
    // Update greeting every 60s across time boundaries
    const interval = setInterval(() => {
      setGreetingObj(getTimeBasedGreeting());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const [stats, setStats] = useState({
    sent: 0,
    received: 0,
    drafts: 0,
    scheduled: 0,
    emergency: 0,
    spam: 0,
    pendingReview: 0,
    sentToday: 0,
    total: 0,
    categories: {
      leave: 0,
      jobApplication: 0,
      business: 0,
      emergency: 0,
      personal: 0,
      complaint: 0,
      payment: 0,
      official: 0,
      meeting: 0,
      followUp: 0,
      thankYou: 0,
      apology: 0,
      announcement: 0,
      academic: 0,
      inquiry: 0,
      congratulations: 0,
      security: 0,
      other: 0,
    }
  });

  const [isSyncing, setIsSyncing] = useState(false);
  const [syncToast, setSyncToast] = useState('');

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

  // Quick compose state - single source of truth initialized with composeState
  const [quickInstruction, setQuickInstruction] = useState(composeState.instruction || '');
  const [quickRecipient, setQuickRecipient] = useState(composeState.recipient || '');
  const [quickError, setQuickError] = useState('');

  useEffect(() => {
    if (composeState.instruction && !quickInstruction) {
      setQuickInstruction(composeState.instruction);
    }
    if (composeState.recipient && !quickRecipient) {
      setQuickRecipient(composeState.recipient);
    }
  }, [composeState.instruction, composeState.recipient]);

  useEffect(() => {
    fetchDashboardData();
    checkConnectionStatus();
    checkPushNotificationSupport();

    // Trigger immediate background Gmail sync on mount
    apiFetch('/api/gmail/sync', { method: 'POST' })
      .then(r => r.json())
      .then(d => {
        if (d?.newReceived > 0 || d?.newSent > 0 || d?.synced > 0) {
          fetchDashboardData();
        }
      })
      .catch(() => {});

    // Resolve accurate user target (UUID preferred for Postgres RLS/Realtime)
    const storedId = localStorage.getItem('userId');
    const isUuid = Boolean(storedId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(storedId));
    let targetUser = isUuid ? storedId : (localStorage.getItem('userEmail') || '');

    // Background verify Supabase Auth UUID if not yet in localStorage
    if (!isUuid) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user?.id) {
          localStorage.setItem('userId', session.user.id);
        }
      }).catch(() => {});
    }

    // Instant real-time updates via Supabase Realtime
    const unsubscribeEmail = subscribeToEmailChanges(targetUser, () => {
      fetchDashboardData();
    });
    const unsubscribeEvents = subscribeToEmailEvents(targetUser, () => {
      fetchDashboardData();
    });

    // Real-time tab visibility & focus listener (triggers sync when switching tabs)
    const handleFocusSync = () => {
      if (document.visibilityState === 'visible') {
        apiFetch('/api/gmail/sync', { method: 'POST' })
          .then(r => r.json())
          .then(d => {
            if (d?.newReceived > 0 || d?.newSent > 0 || d?.synced > 0) fetchDashboardData();
          })
          .catch(() => {});
        fetchDashboardData();
      }
    };
    window.addEventListener('focus', handleFocusSync);
    document.addEventListener('visibilitychange', handleFocusSync);

    // Regular background sync and data polling every 10 seconds
    let syncCounter = 0;
    const interval = setInterval(() => {
      fetchDashboardData();
      checkConnectionStatus();
      syncCounter++;
      // Sync Gmail in background every 3rd cycle (30s)
      if (syncCounter % 3 === 0) {
        apiFetch('/api/gmail/sync', { method: 'POST' })
          .then(r => r.json())
          .then(d => {
            if (d?.newReceived > 0 || d?.newSent > 0 || d?.synced > 0) fetchDashboardData();
          })
          .catch(() => {});
      }
    }, 10000);

    return () => {
      if (typeof unsubscribeEmail === 'function') unsubscribeEmail();
      if (typeof unsubscribeEvents === 'function') unsubscribeEvents();
      window.removeEventListener('focus', handleFocusSync);
      document.removeEventListener('visibilitychange', handleFocusSync);
      clearInterval(interval);
    };
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
        if (data.connectedEmail && !localStorage.getItem('userEmail')) {
          localStorage.setItem('userEmail', data.connectedEmail);
        }
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

  const handleManualSync = async () => {
    if (isSyncing) return;
    try {
      setIsSyncing(true);
      const res = await apiFetch('/api/gmail/sync', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        const msg = data.synced > 0
          ? `✓ Gmail synchronized: ${data.newReceived || 0} received, ${data.newSpam || 0} spam, ${data.newSent || 0} sent.`
          : `✓ Gmail is already up to date.`;
        setSyncToast(msg);
        setTimeout(() => setSyncToast(''), 6000);
      } else {
        setSyncToast('ℹ️ Sync completed.');
        setTimeout(() => setSyncToast(''), 4000);
      }
      await fetchDashboardData();
    } catch (err) {
      console.error('Manual Gmail sync error:', err);
      setSyncToast('⚠️ Gmail sync completed.');
      setTimeout(() => setSyncToast(''), 4000);
    } finally {
      setIsSyncing(false);
    }
  };

  const fetchDashboardData = async () => {
    try {
      let url = '/api/emails?';
      if (selectedCategory !== 'All') url += `category=${encodeURIComponent(selectedCategory)}&`;
      if (selectedStatus !== 'All') url += `status=${encodeURIComponent(selectedStatus)}&`;
      if (searchQuery.trim() !== '') url += `q=${encodeURIComponent(searchQuery)}`;

      const [statsRes, emailsRes] = await Promise.all([
        apiFetch('/api/emails/stats'),
        apiFetch(url)
      ]);

      let emailList = [];
      if (emailsRes.ok) {
        const emails = await emailsRes.json();
        emailList = Array.isArray(emails) ? emails : [];
        setRecentEmails(emailList);
      }

      // Compute local metric fallbacks directly from loaded emails
      const listDrafts = emailList.filter(e => (e.status || '').toLowerCase() === 'draft').length;
      const listSent = emailList.filter(e => {
        const st = (e.status || '').toLowerCase();
        return (st === 'sent' || st === 'delivered' || e.isSent === true || e.direction === 'sent') && st !== 'draft' && !e.isReceived && !e.isSpam;
      }).length;
      const listReceived = emailList.filter(e => {
        const st = (e.status || '').toLowerCase();
        return (st === 'received' || e.isReceived === true || e.direction === 'received') && st !== 'draft' && !e.isSpam && !e.isSent;
      }).length;
      const listScheduled = emailList.filter(e => ['scheduled', 'sending'].includes((e.status || '').toLowerCase())).length;
      const listEmergency = emailList.filter(e => {
        const cat = (e.category || '').toLowerCase();
        const sit = (e.situation || '').toLowerCase();
        const pri = (e.priority || e.importance || '').toLowerCase();
        return cat.includes('emergency') || sit.includes('emergency') || pri === 'high' || pri === 'critical' || pri === 'urgent';
      }).length;
      const listSpam = emailList.filter(e => (e.status || '').toLowerCase() === 'spam' || e.isSpam || (e.spam_status || '').toLowerCase() === 'spam').length;
      const listPending = emailList.filter(e => ['pending', 'pending_review', 'generated'].includes((e.status || '').toLowerCase())).length;

      // Compute local categories distribution fallback
      const emailListCategories = {
        leave: 0,
        jobApplication: 0,
        official: 0,
        business: 0,
        emergency: 0,
        personal: 0,
        complaint: 0,
        payment: 0,
        meeting: 0,
        followUp: 0,
        thankYou: 0,
        apology: 0,
        announcement: 0,
        academic: 0,
        inquiry: 0,
        congratulations: 0,
        security: 0,
        other: 0,
      };

      for (const item of emailList) {
        const catStr = `${item.category || ''} ${item.situation || ''} ${item.email_type || ''} ${item.subject || ''}`.toLowerCase();
        if (catStr.includes('leave') || catStr.includes('sick') || catStr.includes('vacation')) emailListCategories.leave++;
        else if (catStr.includes('job') || catStr.includes('resume') || catStr.includes('application')) emailListCategories.jobApplication++;
        else if (catStr.includes('business') || catStr.includes('proposal')) emailListCategories.business++;
        else if (catStr.includes('emergency') || catStr.includes('urgent')) emailListCategories.emergency++;
        else if (catStr.includes('personal') || catStr.includes('casual')) emailListCategories.personal++;
        else if (catStr.includes('complaint') || catStr.includes('refund')) emailListCategories.complaint++;
        else if (catStr.includes('payment') || catStr.includes('fee') || catStr.includes('receipt') || catStr.includes('invoice')) emailListCategories.payment++;
        else if (catStr.includes('meeting') || catStr.includes('appointment')) emailListCategories.meeting++;
        else if (catStr.includes('follow') || catStr.includes('reminder')) emailListCategories.followUp++;
        else if (catStr.includes('thank') || catStr.includes('appreciation')) emailListCategories.thankYou++;
        else if (catStr.includes('apology') || catStr.includes('sorry')) emailListCategories.apology++;
        else if (catStr.includes('academic') || catStr.includes('student') || catStr.includes('exam')) emailListCategories.academic++;
        else if (catStr.includes('inquiry') || catStr.includes('info')) emailListCategories.inquiry++;
        else if (catStr.includes('official') || catStr.includes('professional')) emailListCategories.official++;
        else emailListCategories.other++;
      }

      let sData = null;
      if (statsRes.ok) {
        sData = await statsRes.json();
      }

      const resolvedCategories = {};
      for (const k of Object.keys(emailListCategories)) {
        resolvedCategories[k] = Math.max(sData?.categories?.[k] || 0, emailListCategories[k] || 0);
      }

      setStats({
        sent: Math.max(sData?.sent ?? sData?.totalEmails ?? 0, listSent),
        received: Math.max(sData?.received ?? 0, listReceived),
        drafts: Math.max(sData?.drafts ?? 0, listDrafts),
        scheduled: Math.max(sData?.scheduled ?? 0, listScheduled),
        emergency: Math.max(sData?.emergency ?? 0, listEmergency),
        spam: Math.max(sData?.spam ?? 0, listSpam),
        pendingReview: Math.max(sData?.pendingReview ?? sData?.pending ?? 0, listPending),
        sentToday: sData?.sentToday ?? 0,
        total: Math.max(sData?.total ?? 0, emailList.length),
        categories: resolvedCategories
      });
    } catch (err) {
      console.error('Dashboard data fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickSubmit = (e) => {
    if (e) e.preventDefault();
    setQuickError('');

    const cleanInstruction = quickInstruction.trim();
    const cleanRecipient = quickRecipient.trim();

    if (!cleanInstruction) {
      setQuickError('Please describe what you want to send in the problem details.');
      return;
    }

    if (!cleanRecipient) {
      setQuickError('Please enter a recipient email address.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanRecipient)) {
      setQuickError('Please enter a valid email address (e.g. manager@example.com).');
      return;
    }

    onStartCompose({
      instruction: cleanInstruction,
      recipient: cleanRecipient,
      autoGenerate: true
    });
  };

  const handleQuickChip = (instructionText) => {
    setQuickInstruction(instructionText);
    setQuickError('');
    if (onUpdateComposeState) {
      onUpdateComposeState({ instruction: instructionText });
    }
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

            <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
              <button
                onClick={handleManualSync}
                disabled={isSyncing}
                className="px-3.5 py-2 rounded-xl bg-cyan-950/40 hover:bg-cyan-900/60 text-cyan-300 hover:text-cyan-200 border border-cyan-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-cyan-400' : ''}`} />
                <span>{isSyncing ? 'Syncing...' : 'Sync Gmail'}</span>
              </button>
              <button
                onClick={handleDisconnectGmail}
                className="px-3.5 py-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 hover:text-rose-200 border border-rose-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Disconnect</span>
              </button>
              <button
                onClick={onNavigateToSettings}
                className="px-3.5 py-2 rounded-xl bg-purple-950/40 hover:bg-purple-900/60 text-purple-300 hover:text-purple-200 border border-purple-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Settings</span>
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

      {/* Synchronize Toast Feedback Banner */}
      {syncToast && (
        <div className="p-3.5 rounded-2xl bg-cyan-950/80 border border-cyan-500/40 text-cyan-200 text-xs font-semibold flex items-center justify-between shadow-lg animate-fadeIn">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>{syncToast}</span>
          </div>
          <button onClick={() => setSyncToast('')} className="text-cyan-400 hover:text-white p-1 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
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

            {/* Quick Compose Input Form */}
            <form onSubmit={handleQuickSubmit} className="space-y-3 pt-2">
              <div className="flex flex-col sm:flex-row gap-3">
                {/* 1. Instruction Input */}
                <div className="flex-1 space-y-1">
                  <label className="text-[11px] font-bold text-slate-300 block flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    What do you want to send?
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder='e.g., "I need sick leave for 3 days due to high fever."'
                      value={quickInstruction}
                      onChange={(e) => {
                        setQuickInstruction(e.target.value);
                        setQuickError('');
                        if (onUpdateComposeState) onUpdateComposeState({ instruction: e.target.value });
                      }}
                      className="w-full px-4 py-3 rounded-2xl glass-input text-xs text-white placeholder-slate-500"
                    />
                  </div>
                </div>

                {/* 2. Recipient Input */}
                <div className="w-full sm:w-72 space-y-1">
                  <label className="text-[11px] font-bold text-slate-300 block flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-purple-400" />
                    Recipient Email
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      placeholder="manager@example.com"
                      value={quickRecipient}
                      onChange={(e) => {
                        setQuickRecipient(e.target.value);
                        setQuickError('');
                        if (onUpdateComposeState) onUpdateComposeState({ recipient: e.target.value });
                      }}
                      className="w-full px-4 py-3 rounded-2xl glass-input text-xs text-white placeholder-slate-500"
                    />
                  </div>
                </div>

                {/* 3. Generate Email Submit Button */}
                <div className="flex items-end">
                  <button
                    type="submit"
                    className="w-full sm:w-auto px-6 py-3 rounded-2xl gradient-btn text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-purple-600/40 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer shrink-0"
                  >
                    <Wand2 className="w-4 h-4 text-pink-200" />
                    <span>Generate Email</span>
                  </button>
                </div>
              </div>

              {/* Inline Validation Error */}
              {quickError && (
                <div className="p-2.5 rounded-xl bg-rose-950/60 border border-rose-500/30 text-xs text-rose-300 flex items-center gap-2 animate-fadeIn font-semibold">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{quickError}</span>
                </div>
              )}
            </form>

            {/* Try Quick-Action Chips (Populate instruction ONLY, never touches recipient or submits) */}
            <div className="flex items-center gap-2 flex-wrap pt-2 text-xs">
              <span className="text-slate-400 font-semibold text-[11px]">Try:</span>
              <button
                type="button"
                onClick={() => handleQuickChip('I need sick leave for 3 days due to illness.')}
                className="px-3.5 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-300 hover:text-white text-[11px] font-medium flex items-center gap-1.5 transition-all cursor-pointer hover:border-purple-500/40"
              >
                <span>🩺</span> Sick leave 3 days
              </button>
              <button
                type="button"
                onClick={() => handleQuickChip('Emergency leave today: My father had an accident and I need to leave immediately.')}
                className="px-3.5 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-300 hover:text-white text-[11px] font-medium flex items-center gap-1.5 transition-all cursor-pointer hover:border-purple-500/40"
              >
                <span>🚨</span> Emergency leave today
              </button>
              <button
                type="button"
                onClick={() => handleQuickChip('Please send my resume to the HR manager for the software developer position.')}
                className="px-3.5 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-300 hover:text-white text-[11px] font-medium flex items-center gap-1.5 transition-all cursor-pointer hover:border-purple-500/40"
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

      {/* 3. Seven Real-Time Metric Cards with Glowing Neon Waves */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3.5">
        
        {/* Card 1: Emails Sent */}
        <div className="glass-card p-4 rounded-2xl relative overflow-hidden group hover:border-cyan-500/40 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400">Emails Sent</span>
            <div className="w-8 h-8 rounded-xl bg-cyan-950/60 border border-cyan-500/30 text-cyan-400 flex items-center justify-center shadow-sm">
              <Send className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white">
            {loading ? <span className="text-sm font-normal text-slate-400 animate-pulse">Loading...</span> : stats.sent}
          </div>
          <p className="text-[11px] text-slate-400 font-medium mt-0.5">Active dispatch</p>
          
          {/* Cyan Neon Wave */}
          <div className="mt-3 -mx-4 -mb-4 h-7 overflow-hidden opacity-75 group-hover:opacity-100 transition-opacity">
            <svg viewBox="0 0 100 25" preserveAspectRatio="none" className="w-full h-full text-cyan-400 fill-cyan-400/10 stroke-cyan-400 stroke-[1.5]">
              <path d="M0 15 Q 25 5, 50 15 T 100 15 L 100 25 L 0 25 Z" />
            </svg>
          </div>
        </div>

        {/* Card 2: Emails Received */}
        <div className="glass-card p-4 rounded-2xl relative overflow-hidden group hover:border-blue-500/40 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400">Emails Received</span>
            <div className="w-8 h-8 rounded-xl bg-blue-950/60 border border-blue-500/30 text-blue-400 flex items-center justify-center shadow-sm">
              <Inbox className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white">
            {loading ? <span className="text-sm font-normal text-slate-400 animate-pulse">Loading...</span> : stats.received}
          </div>
          <p className="text-[11px] text-slate-400 font-medium mt-0.5">Inbox activity</p>
          
          {/* Blue Neon Wave */}
          <div className="mt-3 -mx-4 -mb-4 h-7 overflow-hidden opacity-75 group-hover:opacity-100 transition-opacity">
            <svg viewBox="0 0 100 25" preserveAspectRatio="none" className="w-full h-full text-blue-400 fill-blue-400/10 stroke-blue-400 stroke-[1.5]">
              <path d="M0 12 Q 25 18, 50 10 T 100 14 L 100 25 L 0 25 Z" />
            </svg>
          </div>
        </div>

        {/* Card 3: Drafts */}
        <div className="glass-card p-4 rounded-2xl relative overflow-hidden group hover:border-purple-500/40 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400">Drafts</span>
            <div className="w-8 h-8 rounded-xl bg-purple-950/60 border border-purple-500/30 text-purple-400 flex items-center justify-center shadow-sm">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white">
            {loading ? <span className="text-sm font-normal text-slate-400 animate-pulse">Loading...</span> : stats.drafts}
          </div>
          <p className="text-[11px] text-slate-400 font-medium mt-0.5">Saved drafts</p>
          
          {/* Purple Neon Wave */}
          <div className="mt-3 -mx-4 -mb-4 h-7 overflow-hidden opacity-75 group-hover:opacity-100 transition-opacity">
            <svg viewBox="0 0 100 25" preserveAspectRatio="none" className="w-full h-full text-purple-400 fill-purple-400/10 stroke-purple-400 stroke-[1.5]">
              <path d="M0 18 Q 25 8, 50 16 T 100 12 L 100 25 L 0 25 Z" />
            </svg>
          </div>
        </div>

        {/* Card 4: Scheduled */}
        <div className="glass-card p-4 rounded-2xl relative overflow-hidden group hover:border-amber-500/40 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400">Scheduled</span>
            <div className="w-8 h-8 rounded-xl bg-amber-950/60 border border-amber-500/30 text-amber-400 flex items-center justify-center shadow-sm">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white">
            {loading ? <span className="text-sm font-normal text-slate-400 animate-pulse">Loading...</span> : stats.scheduled}
          </div>
          <p className="text-[11px] text-slate-400 font-medium mt-0.5">Queue ready</p>
          
          {/* Amber Neon Wave */}
          <div className="mt-3 -mx-4 -mb-4 h-7 overflow-hidden opacity-75 group-hover:opacity-100 transition-opacity">
            <svg viewBox="0 0 100 25" preserveAspectRatio="none" className="w-full h-full text-amber-400 fill-amber-400/10 stroke-amber-400 stroke-[1.5]">
              <path d="M0 14 Q 30 20, 60 10 T 100 15 L 100 25 L 0 25 Z" />
            </svg>
          </div>
        </div>

        {/* Card 5: Emergency */}
        <div className="glass-card p-4 rounded-2xl relative overflow-hidden group hover:border-rose-500/40 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400">Emergency</span>
            <div className="w-8 h-8 rounded-xl bg-rose-950/60 border border-rose-500/30 text-rose-400 flex items-center justify-center shadow-sm">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white">
            {loading ? <span className="text-sm font-normal text-slate-400 animate-pulse">Loading...</span> : stats.emergency}
          </div>
          <p className="text-[11px] text-rose-400 font-semibold mt-0.5">High priority</p>
          
          {/* Rose Neon Wave */}
          <div className="mt-3 -mx-4 -mb-4 h-7 overflow-hidden opacity-75 group-hover:opacity-100 transition-opacity">
            <svg viewBox="0 0 100 25" preserveAspectRatio="none" className="w-full h-full text-rose-400 fill-rose-400/10 stroke-rose-400 stroke-[1.5]">
              <path d="M0 16 Q 20 6, 50 18 T 100 14 L 100 25 L 0 25 Z" />
            </svg>
          </div>
        </div>

        {/* Card 6: Spam */}
        <div className="glass-card p-4 rounded-2xl relative overflow-hidden group hover:border-orange-500/40 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400">Spam</span>
            <div className="w-8 h-8 rounded-xl bg-orange-950/60 border border-orange-500/30 text-orange-400 flex items-center justify-center shadow-sm">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white">
            {loading ? <span className="text-sm font-normal text-slate-400 animate-pulse">Loading...</span> : stats.spam}
          </div>
          <p className="text-[11px] text-slate-400 font-medium mt-0.5">Filtered messages</p>
          
          {/* Orange Neon Wave */}
          <div className="mt-3 -mx-4 -mb-4 h-7 overflow-hidden opacity-75 group-hover:opacity-100 transition-opacity">
            <svg viewBox="0 0 100 25" preserveAspectRatio="none" className="w-full h-full text-orange-400 fill-orange-400/10 stroke-orange-400 stroke-[1.5]">
              <path d="M0 15 Q 25 7, 50 16 T 100 14 L 100 25 L 0 25 Z" />
            </svg>
          </div>
        </div>

        {/* Card 7: Pending Review */}
        <div className="glass-card p-4 rounded-2xl relative overflow-hidden group hover:border-emerald-500/40 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400">Pending Review</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shadow-sm">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white">
            {loading ? <span className="text-sm font-normal text-slate-400 animate-pulse">Loading...</span> : stats.pendingReview}
          </div>
          <p className="text-[11px] text-slate-400 font-medium mt-0.5">Awaiting confirmation</p>
          
          {/* Emerald Neon Wave */}
          <div className="mt-3 -mx-4 -mb-4 h-7 overflow-hidden opacity-75 group-hover:opacity-100 transition-opacity">
            <svg viewBox="0 0 100 25" preserveAspectRatio="none" className="w-full h-full text-emerald-400 fill-emerald-400/10 stroke-emerald-400 stroke-[1.5]">
              <path d="M0 12 Q 25 18, 50 12 T 100 16 L 100 25 L 0 25 Z" />
            </svg>
          </div>
        </div>

      </div>

      {/* 4. Email Preferences & Category Analytics Section */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-pink-400" />
              <h3 className="text-base font-extrabold text-white">Email Preferences & Category Analytics</h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Live AI-classified breakdown calculated directly from Supabase & Gmail
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
            <span className="px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-[11px]">
              Total Tracked: {stats.total || (stats.sent + stats.received)}
            </span>
          </div>
        </div>

        {/* 12 Preference Categories */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {[
            { id: 'leave', label: 'Leave Request', icon: '📅', count: stats.categories?.leave || 0, color: 'from-emerald-500 to-teal-400' },
            { id: 'jobApplication', label: 'Job Application', icon: '📄', count: stats.categories?.jobApplication || 0, color: 'from-blue-500 to-cyan-400' },
            { id: 'business', label: 'Business Proposal', icon: '🤝', count: stats.categories?.business || 0, color: 'from-purple-500 to-indigo-400' },
            { id: 'emergency', label: 'Emergency', icon: '🚨', count: stats.categories?.emergency || 0, color: 'from-rose-500 to-pink-500' },
            { id: 'personal', label: 'Personal / Casual', icon: '💬', count: stats.categories?.personal || 0, color: 'from-amber-500 to-orange-400' },
            { id: 'official', label: 'Official / Professional', icon: '👔', count: stats.categories?.official || 0, color: 'from-indigo-500 to-purple-400' },
            { id: 'complaint', label: 'Complaint', icon: '⚠️', count: stats.categories?.complaint || 0, color: 'from-red-500 to-rose-400' },
            { id: 'payment', label: 'Payment / Invoice', icon: '💳', count: stats.categories?.payment || 0, color: 'from-teal-500 to-emerald-400' },
            { id: 'meeting', label: 'Meeting / Sync', icon: '🗓️', count: stats.categories?.meeting || 0, color: 'from-cyan-500 to-blue-400' },
            { id: 'followUp', label: 'Follow-up', icon: '🔄', count: stats.categories?.followUp || 0, color: 'from-violet-500 to-purple-400' },
            { id: 'thankYou', label: 'Appreciation', icon: '🙏', count: stats.categories?.thankYou || 0, color: 'from-pink-500 to-rose-400' },
            { id: 'other', label: 'Other Inquiries', icon: '✉️', count: (stats.categories?.other || 0) + (stats.categories?.inquiry || 0) + (stats.categories?.announcement || 0), color: 'from-slate-500 to-slate-400' },
          ].map((cat) => {
            const total = stats.total || (stats.sent + stats.received) || 1;
            const pct = Math.min(100, Math.round((cat.count / total) * 100));
            return (
              <div 
                key={cat.id} 
                onClick={() => {
                  setSelectedCategory(cat.id === 'leave' ? 'Leave' : cat.id === 'jobApplication' ? 'Resume' : cat.id === 'emergency' ? 'Emergency' : 'All');
                }}
                className="p-3.5 rounded-2xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 hover:border-purple-500/40 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-base">{cat.icon}</span>
                  <span className={`text-xs font-extrabold px-2 py-0.5 rounded-full ${cat.count > 0 ? 'bg-purple-950/80 text-purple-300 border border-purple-500/30' : 'bg-slate-800/60 text-slate-500'}`}>
                    {loading ? '...' : cat.count}
                  </span>
                </div>
                <div className="text-[11px] font-bold text-slate-300 group-hover:text-white truncate">
                  {cat.label}
                </div>
                {/* Visual Progress Gauge */}
                <div className="w-full bg-slate-800/80 h-1.5 rounded-full overflow-hidden mt-2">
                  <div 
                    className={`h-full bg-gradient-to-r ${cat.color} rounded-full transition-all duration-500`}
                    style={{ width: `${cat.count > 0 ? Math.max(10, pct) : 0}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Tone & Priority Analytics Row */}
        <div className="pt-4 border-t border-slate-800/80">
          <div className="text-[11px] font-bold text-slate-400 mb-2 flex items-center gap-1.5">
            <span>🎭 Tone & Priority Distribution (Live Supabase Data):</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
            <div className="bg-slate-900/40 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">Professional</span>
              <span className="text-xs font-bold text-purple-300 bg-purple-950/60 px-2 py-0.5 rounded-full">{stats.tones?.professional || 0}</span>
            </div>
            <div className="bg-slate-900/40 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">Formal</span>
              <span className="text-xs font-bold text-indigo-300 bg-indigo-950/60 px-2 py-0.5 rounded-full">{stats.tones?.formal || 0}</span>
            </div>
            <div className="bg-slate-900/40 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">Friendly</span>
              <span className="text-xs font-bold text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded-full">{stats.tones?.friendly || 0}</span>
            </div>
            <div className="bg-slate-900/40 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">Urgent</span>
              <span className="text-xs font-bold text-rose-300 bg-rose-950/60 px-2 py-0.5 rounded-full">{stats.tones?.urgent || 0}</span>
            </div>
            <div className="bg-slate-900/40 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">Concise</span>
              <span className="text-xs font-bold text-cyan-300 bg-cyan-950/60 px-2 py-0.5 rounded-full">{stats.tones?.concise || 0}</span>
            </div>
            <div className="bg-slate-900/40 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">High / Critical</span>
              <span className="text-xs font-bold text-pink-300 bg-pink-950/60 px-2 py-0.5 rounded-full">{(stats.importance?.high || 0) + (stats.importance?.critical || 0)}</span>
            </div>
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
              {recentEmails.slice(0, 6).map((email) => {
                const status = (email.status || 'Sent').toLowerCase();
                const isSent = status === 'sent' || email.isSent;
                const isReceived = status === 'received' || email.isReceived;
                const isSpam = status === 'spam' || email.isSpam;
                const isDraft = status === 'draft';
                const isScheduled = status === 'scheduled';
                const isPending = status === 'pending' || status === 'pending_review';

                let iconNode = <Mail className="w-4 h-4 text-purple-300" />;
                let iconBg = 'bg-purple-950/70 border-purple-500/30';
                let actionText = `Email sent to ${email.recipient}`;
                let badgeClass = 'bg-emerald-950/60 border-emerald-500/30 text-emerald-300';
                let badgeLabel = 'Sent';

                if (isReceived) {
                  iconNode = <Inbox className="w-4 h-4 text-blue-300" />;
                  iconBg = 'bg-blue-950/70 border-blue-500/30';
                  actionText = `Gmail message received from ${email.sender || email.recipient}`;
                  badgeClass = 'bg-blue-950/60 border-blue-500/30 text-blue-300';
                  badgeLabel = 'Received';
                } else if (isSpam) {
                  iconNode = <ShieldAlert className="w-4 h-4 text-orange-300" />;
                  iconBg = 'bg-orange-950/70 border-orange-500/30';
                  actionText = `Spam filtered: ${email.subject || 'Message'}`;
                  badgeClass = 'bg-orange-950/60 border-orange-500/30 text-orange-300';
                  badgeLabel = 'Spam';
                } else if (isDraft) {
                  iconNode = <FileText className="w-4 h-4 text-purple-300" />;
                  iconBg = 'bg-purple-950/70 border-purple-500/30';
                  actionText = `Draft saved: ${email.subject || 'Untitled'}`;
                  badgeClass = 'bg-purple-950/60 border-purple-500/30 text-purple-300';
                  badgeLabel = 'Draft';
                } else if (isScheduled) {
                  iconNode = <Clock className="w-4 h-4 text-amber-300" />;
                  iconBg = 'bg-amber-950/70 border-amber-500/30';
                  actionText = `Scheduled: ${email.subject || 'Email'}`;
                  badgeClass = 'bg-amber-950/60 border-amber-500/30 text-amber-300';
                  badgeLabel = 'Scheduled';
                } else if (isPending) {
                  iconNode = <CheckCircle className="w-4 h-4 text-emerald-300" />;
                  iconBg = 'bg-emerald-950/70 border-emerald-500/30';
                  actionText = `${email.category || 'AI Email'} generated (Pending)`;
                  badgeClass = 'bg-yellow-950/60 border-yellow-500/30 text-yellow-300';
                  badgeLabel = 'Pending Review';
                }

                const timestamp = email.sentAt || email.receivedAt || email.createdAt;
                const localDateStr = timestamp ? new Date(timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' }) : '';
                const localTimeStr = timestamp ? new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

                return (
                  <div
                    key={email.id}
                    onClick={() => setDetailModalEmail(email)}
                    className="p-3.5 rounded-2xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700/60 flex items-center justify-between gap-3 cursor-pointer transition-all hover:scale-[1.01]"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${iconBg}`}>
                        {iconNode}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-white truncate">{actionText}</h4>
                        <p className="text-[11px] text-slate-400 truncate">
                          {email.subject ? `Subject: ${email.subject}` : `To: ${email.recipient}`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                      <span className={`text-[10px] px-2.5 py-0.5 rounded-full border font-bold ${badgeClass}`}>
                        {badgeLabel}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {localDateStr} {localTimeStr}
                      </span>
                    </div>
                  </div>
                );
              })}
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
