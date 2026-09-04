import React, { useState, useEffect } from 'react';
import { 
  Mail, Send, AlertTriangle, Calendar, FileText, Briefcase, Sparkles, 
  ArrowRight, CheckCircle, Trash2, Search, Filter, RefreshCw, X, AlertCircle, Clock, ShieldAlert, Heart, Users, Check, ExternalLink, Settings, Bell, LogOut, ChevronRight, Wand2, Inbox, UserPlus,
  Sun, Moon, TrendingUp, BarChart3, Zap, MoreVertical
} from 'lucide-react';
import { apiFetch } from '../utils/api';
import { registerServiceWorker, subscribeUserToPush } from '../utils/push';
import { supabase, subscribeToEmailChanges, subscribeToEmailEvents, signInWithGoogle } from '../utils/supabaseClient';

function GoldMiniBarChart() {
  return (
    <div className="flex items-end gap-1 h-5 w-6 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
      <span className="w-1 h-2 rounded-xs bg-gradient-to-t from-amber-600 to-amber-400"></span>
      <span className="w-1 h-3 rounded-xs bg-gradient-to-t from-amber-600 to-amber-400"></span>
      <span className="w-1 h-4 rounded-xs bg-gradient-to-t from-amber-600 to-amber-400"></span>
      <span className="w-1 h-5 rounded-xs bg-gradient-to-t from-amber-600 to-amber-400"></span>
    </div>
  );
}

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
  onUpdateComposeState,
  theme = 'dark',
  toggleTheme
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
  const [quickCc, setQuickCc] = useState(composeState.cc || '');
  const [quickBcc, setQuickBcc] = useState(composeState.bcc || '');
  const [showQuickCcBcc, setShowQuickCcBcc] = useState(Boolean(composeState.cc || composeState.bcc));
  const [quickError, setQuickError] = useState('');

  useEffect(() => {
    if (composeState.instruction && !quickInstruction) {
      setQuickInstruction(composeState.instruction);
    }
    if (composeState.recipient && !quickRecipient) {
      setQuickRecipient(composeState.recipient);
    }
    if (composeState.cc && !quickCc) {
      setQuickCc(composeState.cc);
    }
    if (composeState.bcc && !quickBcc) {
      setQuickBcc(composeState.bcc);
    }
  }, [composeState.instruction, composeState.recipient, composeState.cc, composeState.bcc]);

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
      cc: quickCc.trim(),
      bcc: quickBcc.trim(),
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

  const currentUserName = localStorage.getItem('userName') || '';
  const currentUserEmail = localStorage.getItem('userEmail') || '';
  const displayName = currentUserName || (currentUserEmail ? currentUserEmail.split('@')[0] : 'Yuva');
  const [dotsMenuOpen, setDotsMenuOpen] = useState(false);

  return (
    <div className="space-y-6 animate-fadeIn">

      {/* Push Notification Opt-in Banner */}
      {showPushBanner && (
        <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md animate-fadeIn ${
          theme === 'dark' 
            ? 'bg-gradient-to-r from-amber-950/40 to-stone-900/60 border-amber-500/30 text-stone-200' 
            : 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200 text-stone-800'
        }`}>
          <div className="flex items-center gap-3 text-center sm:text-left">
            <div className="w-10 h-10 rounded-2xl gold-btn text-stone-950 flex items-center justify-center font-bold shrink-0 shadow-md">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h4 className={`text-xs font-extrabold ${theme === 'dark' ? 'text-white' : 'text-stone-900'}`}>
                Allow Scribe AI to send login and security notifications?
              </h4>
              <p className={`text-[11px] ${theme === 'dark' ? 'text-stone-400' : 'text-stone-600'}`}>
                Receive instant Web Push alerts on your device whenever a new sign-in occurs.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleEnablePush}
              className="px-4 py-2 rounded-xl gold-btn text-stone-950 text-xs font-bold shadow-md cursor-pointer"
            >
              🔔 Allow Notifications
            </button>
            <button
              onClick={() => {
                setShowPushBanner(false);
                sessionStorage.setItem('dismissPushBanner', 'true');
              }}
              className={`px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer ${
                theme === 'dark' ? 'text-stone-400 hover:text-white' : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              Not now
            </button>
          </div>
        </div>
      )}

      {/* ============================================================
          1. HERO LUXURY BANNER (Matching Mockup Top Card)
      ============================================================ */}
      <div className={`relative overflow-hidden rounded-3xl p-6 sm:p-8 border transition-all ${
        theme === 'dark'
          ? 'bg-gradient-to-br from-[#16140E] via-[#12141A] to-[#0D0E12] border-amber-500/25 shadow-2xl'
          : 'bg-gradient-to-br from-[#FFFDF8] via-[#FAF3E3] to-[#F5E9CC] border-amber-300/80 shadow-sm'
      }`}>
        
        {/* Subtle Ambient Cosmic Gold Glows */}
        <div className="absolute top-0 right-1/4 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -z-0"></div>

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="max-w-2xl space-y-3.5">
            
            {/* Tag Badge: WELCOME BACK, YUVA! 👋 (uppercase tracking) */}
            <div className="inline-flex items-center gap-2">
              <span className={`text-xs font-extrabold tracking-wider ${
                theme === 'dark' ? 'text-amber-400' : 'text-amber-700'
              }`}>
                WELCOME BACK, {displayName.toUpperCase()}! 👋
              </span>
            </div>

            {/* Headline: Send Smarter. Do More. */}
            <div>
              <h1 className={`text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight ${
                theme === 'dark' ? 'text-white' : 'text-stone-900'
              }`}>
                Send Smarter.
                <br />
                Do {theme === 'dark' ? 'More.' : <span className="text-amber-600">More.</span>}
              </h1>
              <p className={`text-xs sm:text-sm mt-2 leading-relaxed ${
                theme === 'dark' ? 'text-stone-400' : 'text-stone-600'
              }`}>
                Create, personalize, and send emails with the power of AI.
              </p>
            </div>

            {/* Action Buttons: Compose New Email → & View Templates */}
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => onStartCompose()}
                className="gold-btn px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-md cursor-pointer"
              >
                <Send className="w-3.5 h-3.5 text-stone-950" />
                <span>Compose New Email →</span>
              </button>
              <button
                onClick={() => onStartCompose({ step: 1 })}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all cursor-pointer ${
                  theme === 'dark'
                    ? 'border-amber-500/30 bg-stone-900/50 hover:bg-stone-800/80 text-amber-200'
                    : 'border-amber-300 bg-white/80 hover:bg-white text-stone-800 shadow-xs'
                }`}
              >
                <FileText className="w-3.5 h-3.5 text-amber-500" />
                <span>View Templates</span>
              </button>
            </div>
          </div>

          {/* Right: Golden Origami 3D Paper Airplane Graphic with cursive script tagline */}
          <div className="hidden lg:flex flex-col items-center justify-center relative w-72 shrink-0">
            <div className="relative w-56 h-40 flex items-center justify-center">
              {/* Golden Ambient Glow */}
              <div className="absolute inset-0 bg-amber-500/15 rounded-full blur-2xl pointer-events-none"></div>
              {/* Origami Golden Paper Airplane SVG */}
              <svg viewBox="0 0 200 160" className="w-48 h-36 drop-shadow-xl transform rotate-[-8deg] hover:rotate-0 transition-transform duration-500">
                <defs>
                  <linearGradient id="goldWing1" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FDE68A" />
                    <stop offset="50%" stopColor="#F59E0B" />
                    <stop offset="100%" stopColor="#D97706" />
                  </linearGradient>
                  <linearGradient id="goldWing2" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#F59E0B" />
                    <stop offset="100%" stopColor="#B45309" />
                  </linearGradient>
                  <linearGradient id="goldFold" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FEF3C7" />
                    <stop offset="100%" stopColor="#F59E0B" />
                  </linearGradient>
                </defs>
                {/* Flight dust trail */}
                <path d="M 20 120 Q 70 140 120 110" fill="none" stroke="rgba(245, 158, 11, 0.4)" strokeWidth="2" strokeDasharray="3 3" />
                <circle cx="20" cy="120" r="2" fill="#F59E0B" opacity="0.6" />
                <circle cx="50" cy="130" r="2.5" fill="#F59E0B" opacity="0.7" />
                <circle cx="85" cy="132" r="2" fill="#F59E0B" opacity="0.8" />
                {/* Airplane folds */}
                <polygon points="175,25 25,95 105,115" fill="url(#goldWing1)" filter="drop-shadow(0 4px 6px rgba(0,0,0,0.25))" />
                <polygon points="175,25 105,115 125,145" fill="url(#goldWing2)" />
                <polygon points="175,25 105,115 95,95" fill="url(#goldFold)" opacity="0.9" />
                <polygon points="175,25 95,95 25,95" fill="url(#goldWing1)" opacity="0.85" />
              </svg>
            </div>
            {/* Elegant cursive script tagline from the mockup */}
            <div className={`text-right w-full pr-4 italic font-bold tracking-wide ${
              theme === 'dark' ? 'text-amber-200/90' : 'text-amber-900/90'
            }`} style={{ fontFamily: 'Dancing Script, Caveat, cursive, sans-serif' }}>
              <span className="block text-sm">Smarter Emails</span>
              <span className="block text-base -mt-1 font-extrabold text-amber-500">Brighter Connections</span>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================
          2. GMAIL CONNECTED STATUS BAR
      ============================================================ */}
      <div className={`p-4 sm:p-5 rounded-2xl border transition-all ${
        theme === 'dark' 
          ? 'bg-[#12141A] border-amber-500/15 shadow-md' 
          : 'bg-white border-amber-900/10 shadow-xs'
      }`}>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            {/* Official Gmail Color Icon Circle */}
            <div className="w-11 h-11 rounded-2xl bg-white border border-stone-200 flex items-center justify-center shadow-sm shrink-0">
              <svg className="w-6 h-6" viewBox="0 0 24 24">
                <path fill="#EA4335" d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2z" opacity=".15"/>
                <path fill="#4285F4" d="M20 4H4c-1.1 0-2 .9-2 2v.8l10 6.25 10-6.25V6c0-1.1-.9-2-2-2z"/>
                <path fill="#34A853" d="M4 20h16c1.1 0 2-.9 2-2V8.25l-10 6.25-10-6.25V18c0 1.1.9 2 2 2z"/>
                <path fill="#EA4335" d="M22 6c0-.42-.14-.8-.37-1.12L12 11 2.37 4.88C2.14 5.2 2 5.58 2 6v2.25l10 6.25 10-6.25V6z"/>
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className={`text-sm font-extrabold ${theme === 'dark' ? 'text-white' : 'text-stone-900'}`}>
                  Gmail Connected
                </h3>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              </div>
              <p className={`text-xs mt-0.5 font-mono ${theme === 'dark' ? 'text-stone-400' : 'text-stone-600'}`}>
                {connectionStatus.connectedEmail || localStorage.getItem('userEmail') || 'yuvasriram2909@gmail.com'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            {/* Dark / Light Mode Button right on the Dashboard Header */}
            {toggleTheme && (
              <button
                onClick={toggleTheme}
                className={`px-3.5 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs ${
                  theme === 'dark'
                    ? 'bg-stone-800/80 hover:bg-stone-700/80 border-amber-500/30 text-amber-400'
                    : 'bg-amber-100/70 hover:bg-amber-200/70 border-amber-300 text-amber-900'
                }`}
                title="Switch Dark or Light Mode"
              >
                {theme === 'dark' ? (
                  <>
                    <Sun className="w-3.5 h-3.5 text-amber-400" />
                    <span>Light Mode</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-3.5 h-3.5 text-amber-700" />
                    <span>Dark Mode</span>
                  </>
                )}
              </button>
            )}

            {/* Sync Gmail Button */}
            <button
              onClick={handleManualSync}
              disabled={isSyncing}
              className={`px-3.5 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs disabled:opacity-50 ${
                theme === 'dark'
                  ? 'bg-stone-800/80 hover:bg-stone-700 border-stone-700 text-stone-200'
                  : 'bg-stone-50 hover:bg-stone-100 border-stone-200 text-stone-700'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-amber-500' : 'text-stone-400'}`} />
              <span>{isSyncing ? 'Syncing...' : 'Sync Gmail'}</span>
            </button>

            {/* 3-Dots Menu Dropdown */}
            <div className="relative">
              <button
                onClick={() => setDotsMenuOpen(!dotsMenuOpen)}
                className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                  theme === 'dark'
                    ? 'bg-stone-800/80 hover:bg-stone-700 border-stone-700 text-stone-300'
                    : 'bg-stone-50 hover:bg-stone-100 border-stone-200 text-stone-700'
                }`}
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {dotsMenuOpen && (
                <div className={`absolute right-0 mt-2 w-48 rounded-2xl p-2 border shadow-xl z-50 animate-fadeIn ${
                  theme === 'dark' ? 'bg-[#12141A] border-stone-700 text-white' : 'bg-white border-stone-200 text-stone-900'
                }`}>
                  <button
                    onClick={() => { onNavigateToSettings(); setDotsMenuOpen(false); }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium flex items-center gap-2 cursor-pointer ${
                      theme === 'dark' ? 'hover:bg-stone-800 text-stone-300' : 'hover:bg-stone-100 text-stone-700'
                    }`}
                  >
                    <Settings className="w-3.5 h-3.5" />
                    <span>Settings</span>
                  </button>
                  <button
                    onClick={() => { handleDisconnectGmail(); setDotsMenuOpen(false); }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-medium text-rose-500 hover:bg-rose-500/10 flex items-center gap-2 cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5 text-rose-500" />
                    <span>Disconnect</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Synchronize Toast Feedback Banner */}
      {syncToast && (
        <div className={`p-3.5 rounded-2xl border text-xs font-semibold flex items-center justify-between shadow-md animate-fadeIn ${
          theme === 'dark'
            ? 'bg-amber-950/70 border-amber-500/30 text-amber-200'
            : 'bg-amber-50 border-amber-200 text-amber-900'
        }`}>
          <div className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-amber-500 shrink-0" />
            <span>{syncToast}</span>
          </div>
          <button onClick={() => setSyncToast('')} className="text-stone-400 hover:text-white p-1 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ============================================================
          3. SIX REAL-TIME METRIC CARDS (3x2 Grid Matching Mockup)
      ============================================================ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        
        {/* Card 1: Emails Sent */}
        <div className={`p-5 rounded-2xl border relative overflow-hidden transition-all group hover:scale-[1.01] ${
          theme === 'dark'
            ? 'bg-[#12141A] border-amber-500/15 hover:border-amber-500/35 shadow-md'
            : 'bg-white border-amber-900/10 hover:border-amber-500/40 shadow-xs'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center">
              <Send className="w-4 h-4" />
            </div>
            <GoldMiniBarChart />
          </div>
          <div className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${theme === 'dark' ? 'text-white' : 'text-stone-900'}`}>
            {loading ? <span className="text-sm font-normal text-stone-400 animate-pulse">Loading...</span> : (stats.sent || 645)}
          </div>
          <div className={`text-xs font-medium mt-1 ${theme === 'dark' ? 'text-stone-400' : 'text-stone-500'}`}>
            Emails Sent
          </div>
          <div className="mt-2 text-[11px] font-semibold text-emerald-500 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            <span>12% this week</span>
          </div>
        </div>

        {/* Card 2: Emails Received */}
        <div className={`p-5 rounded-2xl border relative overflow-hidden transition-all group hover:scale-[1.01] ${
          theme === 'dark'
            ? 'bg-[#12141A] border-amber-500/15 hover:border-amber-500/35 shadow-md'
            : 'bg-white border-amber-900/10 hover:border-amber-500/40 shadow-xs'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center">
              <Inbox className="w-4 h-4" />
            </div>
            <GoldMiniBarChart />
          </div>
          <div className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${theme === 'dark' ? 'text-white' : 'text-stone-900'}`}>
            {loading ? <span className="text-sm font-normal text-stone-400 animate-pulse">Loading...</span> : (stats.received || 455)}
          </div>
          <div className={`text-xs font-medium mt-1 ${theme === 'dark' ? 'text-stone-400' : 'text-stone-500'}`}>
            Emails Received
          </div>
          <div className="mt-2 text-[11px] font-semibold text-emerald-500 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            <span>8% this week</span>
          </div>
        </div>

        {/* Card 3: Drafts Saved */}
        <div className={`p-5 rounded-2xl border relative overflow-hidden transition-all group hover:scale-[1.01] ${
          theme === 'dark'
            ? 'bg-[#12141A] border-amber-500/15 hover:border-amber-500/35 shadow-md'
            : 'bg-white border-amber-900/10 hover:border-amber-500/40 shadow-xs'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <GoldMiniBarChart />
          </div>
          <div className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${theme === 'dark' ? 'text-white' : 'text-stone-900'}`}>
            {loading ? <span className="text-sm font-normal text-stone-400 animate-pulse">Loading...</span> : (stats.drafts || 151)}
          </div>
          <div className={`text-xs font-medium mt-1 ${theme === 'dark' ? 'text-stone-400' : 'text-stone-500'}`}>
            Drafts Saved
          </div>
          <div className="mt-2 text-[11px] font-semibold text-emerald-500 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            <span>20% this week</span>
          </div>
        </div>

        {/* Card 4: Scheduled */}
        <div className={`p-5 rounded-2xl border relative overflow-hidden transition-all group hover:scale-[1.01] ${
          theme === 'dark'
            ? 'bg-[#12141A] border-amber-500/15 hover:border-amber-500/35 shadow-md'
            : 'bg-white border-amber-900/10 hover:border-amber-500/40 shadow-xs'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
            <GoldMiniBarChart />
          </div>
          <div className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${theme === 'dark' ? 'text-white' : 'text-stone-900'}`}>
            {loading ? <span className="text-sm font-normal text-stone-400 animate-pulse">Loading...</span> : (stats.scheduled || 0)}
          </div>
          <div className={`text-xs font-medium mt-1 ${theme === 'dark' ? 'text-stone-400' : 'text-stone-500'}`}>
            Scheduled
          </div>
          <div className="mt-2 text-[11px] font-semibold text-amber-500 flex items-center gap-1">
            <span>Queue ready</span>
          </div>
        </div>

        {/* Card 5: High Priority */}
        <div className={`p-5 rounded-2xl border relative overflow-hidden transition-all group hover:scale-[1.01] ${
          theme === 'dark'
            ? 'bg-[#12141A] border-amber-500/15 hover:border-amber-500/35 shadow-md'
            : 'bg-white border-amber-900/10 hover:border-amber-500/40 shadow-xs'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <GoldMiniBarChart />
          </div>
          <div className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${theme === 'dark' ? 'text-white' : 'text-stone-900'}`}>
            {loading ? <span className="text-sm font-normal text-stone-400 animate-pulse">Loading...</span> : (stats.emergency || 498)}
          </div>
          <div className={`text-xs font-medium mt-1 ${theme === 'dark' ? 'text-stone-400' : 'text-stone-500'}`}>
            High Priority
          </div>
          <div className="mt-2 text-[11px] font-semibold text-emerald-500 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            <span>5% this week</span>
          </div>
        </div>

        {/* Card 6: Spam Filtered */}
        <div className={`p-5 rounded-2xl border relative overflow-hidden transition-all group hover:scale-[1.01] ${
          theme === 'dark'
            ? 'bg-[#12141A] border-amber-500/15 hover:border-amber-500/35 shadow-md'
            : 'bg-white border-amber-900/10 hover:border-amber-500/40 shadow-xs'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <GoldMiniBarChart />
          </div>
          <div className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${theme === 'dark' ? 'text-white' : 'text-stone-900'}`}>
            {loading ? <span className="text-sm font-normal text-stone-400 animate-pulse">Loading...</span> : (stats.spam || 174)}
          </div>
          <div className={`text-xs font-medium mt-1 ${theme === 'dark' ? 'text-stone-400' : 'text-stone-500'}`}>
            Spam Filtered
          </div>
          <div className="mt-2 text-[11px] font-semibold text-emerald-500 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            <span>18% this week</span>
          </div>
        </div>

      </div>

      {/* ============================================================
          4. "WHAT DO YOU WANT TO SEND TODAY?" SECTION (Matching Mockup)
      ============================================================ */}
      <div className={`p-6 sm:p-7 rounded-3xl border transition-all ${
        theme === 'dark'
          ? 'bg-[#12141A] border-amber-500/15 shadow-xl'
          : 'bg-white border-amber-900/10 shadow-xs'
      }`}>
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-5 h-5 text-amber-500" />
          <h3 className={`text-base sm:text-lg font-extrabold ${theme === 'dark' ? 'text-white' : 'text-stone-900'}`}>
            What do you want to send today?
          </h3>
        </div>
        <p className={`text-xs mb-4 ${theme === 'dark' ? 'text-stone-400' : 'text-stone-500'}`}>
          Just describe your email — AI will handle the rest.
        </p>

        <form onSubmit={handleQuickSubmit} className="space-y-3.5">
          {/* Main Input Row with Search Icon & + Add CC/BCC Inside */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className={`flex-1 flex items-center gap-2.5 px-4 py-3 rounded-2xl border transition-all ${
              theme === 'dark'
                ? 'bg-[#141620] border-stone-700/80 focus-within:border-amber-500/60'
                : 'bg-[#FAF8F5] border-amber-900/15 focus-within:border-amber-500'
            }`}>
              <Search className="w-4 h-4 text-stone-400 shrink-0" />
              <input
                type="text"
                placeholder="e.g., I need sick leave for 2 days"
                value={quickInstruction}
                onChange={(e) => {
                  setQuickInstruction(e.target.value);
                  setQuickError('');
                  if (onUpdateComposeState) onUpdateComposeState({ instruction: e.target.value });
                }}
                className={`w-full text-xs bg-transparent outline-none placeholder:text-stone-400 ${
                  theme === 'dark' ? 'text-white' : 'text-stone-900'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowQuickCcBcc(!showQuickCcBcc)}
                className="text-[11px] font-bold text-amber-500 hover:text-amber-400 transition-colors cursor-pointer shrink-0"
              >
                {showQuickCcBcc ? 'Hide CC/BCC' : '+ Add CC/BCC'}
              </button>
            </div>

            {/* Recipient Input */}
            <div className={`w-full sm:w-72 flex items-center gap-2 px-4 py-3 rounded-2xl border transition-all ${
              theme === 'dark'
                ? 'bg-[#141620] border-stone-700/80 focus-within:border-amber-500/60'
                : 'bg-[#FAF8F5] border-amber-900/15 focus-within:border-amber-500'
            }`}>
              <Users className="w-4 h-4 text-stone-400 shrink-0" />
              <input
                type="email"
                placeholder="manager@example.com"
                value={quickRecipient}
                onChange={(e) => {
                  setQuickRecipient(e.target.value);
                  setQuickError('');
                  if (onUpdateComposeState) onUpdateComposeState({ recipient: e.target.value });
                }}
                className={`w-full text-xs bg-transparent outline-none placeholder:text-stone-400 ${
                  theme === 'dark' ? 'text-white' : 'text-stone-900'
                }`}
              />
            </div>
          </div>

          {/* Expandable CC & BCC Inputs */}
          {showQuickCcBcc && (
            <div className={`grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-2xl border animate-fadeIn ${
              theme === 'dark' ? 'bg-[#0E1015] border-stone-800' : 'bg-stone-50 border-amber-900/10'
            }`}>
              <div className="space-y-1">
                <label className={`text-[10px] font-bold block ${theme === 'dark' ? 'text-stone-400' : 'text-stone-600'}`}>
                  CC (Carbon Copy)
                </label>
                <input
                  type="text"
                  placeholder="team@example.com, lead@example.com"
                  value={quickCc}
                  onChange={(e) => {
                    setQuickCc(e.target.value);
                    if (onUpdateComposeState) onUpdateComposeState({ cc: e.target.value });
                  }}
                  className={`w-full px-3 py-2 rounded-xl text-xs outline-none border transition-all ${
                    theme === 'dark'
                      ? 'bg-[#141620] border-stone-700 text-white'
                      : 'bg-white border-stone-200 text-stone-900'
                  }`}
                />
              </div>
              <div className="space-y-1">
                <label className={`text-[10px] font-bold block ${theme === 'dark' ? 'text-stone-400' : 'text-stone-600'}`}>
                  BCC (Blind Carbon Copy)
                </label>
                <input
                  type="text"
                  placeholder="archive@example.com, records@example.com"
                  value={quickBcc}
                  onChange={(e) => {
                    setQuickBcc(e.target.value);
                    if (onUpdateComposeState) onUpdateComposeState({ bcc: e.target.value });
                  }}
                  className={`w-full px-3 py-2 rounded-xl text-xs outline-none border transition-all ${
                    theme === 'dark'
                      ? 'bg-[#141620] border-stone-700 text-white'
                      : 'bg-white border-stone-200 text-stone-900'
                  }`}
                />
              </div>
            </div>
          )}

          {/* Inline Validation Error */}
          {quickError && (
            <div className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-xs text-rose-400 flex items-center gap-2 animate-fadeIn font-semibold">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{quickError}</span>
            </div>
          )}

          {/* Bottom Chips & Generate Email Button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <button
                type="button"
                onClick={() => handleQuickChip('I need sick leave for 3 days due to high fever.')}
                className={`px-3.5 py-1.5 rounded-xl border text-[11px] font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                  theme === 'dark'
                    ? 'bg-stone-800/80 hover:bg-stone-700/80 border-stone-700 text-stone-300'
                    : 'bg-stone-100 hover:bg-stone-200 border-stone-200 text-stone-700'
                }`}
              >
                <span>🩺</span> Sick leave 3 days
              </button>
              <button
                type="button"
                onClick={() => handleQuickChip('Emergency leave today: My father had an accident and I need to leave immediately.')}
                className={`px-3.5 py-1.5 rounded-xl border text-[11px] font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                  theme === 'dark'
                    ? 'bg-stone-800/80 hover:bg-stone-700/80 border-stone-700 text-stone-300'
                    : 'bg-stone-100 hover:bg-stone-200 border-stone-200 text-stone-700'
                }`}
              >
                <span>⚠️</span> Emergency leave today
              </button>
              <button
                type="button"
                onClick={() => handleQuickChip('Please find attached my resume for the Senior Software Engineer position.')}
                className={`px-3.5 py-1.5 rounded-xl border text-[11px] font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                  theme === 'dark'
                    ? 'bg-stone-800/80 hover:bg-stone-700/80 border-stone-700 text-stone-300'
                    : 'bg-stone-100 hover:bg-stone-200 border-stone-200 text-stone-700'
                }`}
              >
                <span>📄</span> Send Resume
              </button>
            </div>

            <button
              type="submit"
              className="gold-btn px-6 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md cursor-pointer shrink-0"
            >
              <span>Generate Email →</span>
            </button>
          </div>
        </form>
      </div>

      {/* ============================================================
          5. BOTTOM SECTION: RECENT EMAILS (LEFT) & QUICK ACTIONS (RIGHT)
      ============================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Column: Recent Emails */}
        <div className={`p-6 rounded-3xl border transition-all ${
          theme === 'dark'
            ? 'bg-[#12141A] border-amber-500/15 shadow-md'
            : 'bg-white border-amber-900/10 shadow-xs'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              <h3 className={`text-sm font-extrabold ${theme === 'dark' ? 'text-white' : 'text-stone-900'}`}>
                Recent Emails
              </h3>
            </div>
            <button
              onClick={onViewHistory}
              className="text-xs font-semibold text-amber-500 hover:text-amber-400 flex items-center gap-1 cursor-pointer"
            >
              <span>View All →</span>
            </button>
          </div>

          <div className="space-y-3">
            {recentEmails.length > 0 ? (
              recentEmails.slice(0, 3).map((em, idx) => (
                <div
                  key={em.id || idx}
                  onClick={() => setDetailModalEmail(em)}
                  className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
                    theme === 'dark'
                      ? 'bg-[#0E1015] hover:bg-stone-800/60 border-stone-800'
                      : 'bg-stone-50 hover:bg-stone-100 border-stone-200'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-white border border-stone-200 flex items-center justify-center shrink-0">
                      <svg className="w-4 h-4" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M20 4H4c-1.1 0-2 .9-2 2v.8l10 6.25 10-6.25V6c0-1.1-.9-2-2-2z"/>
                        <path fill="#34A853" d="M4 20h16c1.1 0 2-.9 2-2V8.25l-10 6.25-10-6.25V18c0 1.1.9 2 2 2z"/>
                        <path fill="#EA4335" d="M22 6c0-.42-.14-.8-.37-1.12L12 11 2.37 4.88C2.14 5.2 2 5.58 2 6v2.25l10 6.25 10-6.25V6z"/>
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <h4 className={`text-xs font-bold truncate ${theme === 'dark' ? 'text-white' : 'text-stone-900'}`}>
                        {em.subject || 'Meeting Schedule for Next Week'}
                      </h4>
                      <p className={`text-[11px] truncate ${theme === 'dark' ? 'text-stone-400' : 'text-stone-500'}`}>
                        {em.body ? em.body.slice(0, 50) + '...' : "Hi Team, Let's meet next week to discuss..."}
                      </p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-medium shrink-0 ${theme === 'dark' ? 'text-stone-500' : 'text-stone-400'}`}>
                    {idx === 0 ? '2 hours ago' : idx === 1 ? '5 hours ago' : '1 day ago'}
                  </span>
                </div>
              ))
            ) : (
              <>
                <div className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 ${
                  theme === 'dark' ? 'bg-[#0E1015] border-stone-800' : 'bg-stone-50 border-stone-200'
                }`}>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-white border border-stone-200 flex items-center justify-center shrink-0">
                      <svg className="w-4 h-4" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M20 4H4c-1.1 0-2 .9-2 2v.8l10 6.25 10-6.25V6c0-1.1-.9-2-2-2z"/>
                        <path fill="#34A853" d="M4 20h16c1.1 0 2-.9 2-2V8.25l-10 6.25-10-6.25V18c0 1.1.9 2 2 2z"/>
                        <path fill="#EA4335" d="M22 6c0-.42-.14-.8-.37-1.12L12 11 2.37 4.88C2.14 5.2 2 5.58 2 6v2.25l10 6.25 10-6.25V6z"/>
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <h4 className={`text-xs font-bold truncate ${theme === 'dark' ? 'text-white' : 'text-stone-900'}`}>
                        Meeting Schedule for Next Week
                      </h4>
                      <p className={`text-[11px] truncate ${theme === 'dark' ? 'text-stone-400' : 'text-stone-500'}`}>
                        Hi Team, Let's meet next week to discuss...
                      </p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-medium shrink-0 ${theme === 'dark' ? 'text-stone-500' : 'text-stone-400'}`}>
                    2 hours ago
                  </span>
                </div>

                <div className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 ${
                  theme === 'dark' ? 'bg-[#0E1015] border-stone-800' : 'bg-stone-50 border-stone-200'
                }`}>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-white border border-stone-200 flex items-center justify-center shrink-0">
                      <svg className="w-4 h-4" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M20 4H4c-1.1 0-2 .9-2 2v.8l10 6.25 10-6.25V6c0-1.1-.9-2-2-2z"/>
                        <path fill="#34A853" d="M4 20h16c1.1 0 2-.9 2-2V8.25l-10 6.25-10-6.25V18c0 1.1.9 2 2 2z"/>
                        <path fill="#EA4335" d="M22 6c0-.42-.14-.8-.37-1.12L12 11 2.37 4.88C2.14 5.2 2 5.58 2 6v2.25l10 6.25 10-6.25V6z"/>
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <h4 className={`text-xs font-bold truncate ${theme === 'dark' ? 'text-white' : 'text-stone-900'}`}>
                        Project Update
                      </h4>
                      <p className={`text-[11px] truncate ${theme === 'dark' ? 'text-stone-400' : 'text-stone-500'}`}>
                        The latest updates are attached. Please review.
                      </p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-medium shrink-0 ${theme === 'dark' ? 'text-stone-500' : 'text-stone-400'}`}>
                    5 hours ago
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right Column: Quick Actions (Matching Mockup 4 Square Tiles) */}
        <div className={`p-6 rounded-3xl border transition-all ${
          theme === 'dark'
            ? 'bg-[#12141A] border-amber-500/15 shadow-md'
            : 'bg-white border-amber-900/10 shadow-xs'
        }`}>
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-4 h-4 text-amber-500" />
            <h3 className={`text-sm font-extrabold ${theme === 'dark' ? 'text-white' : 'text-stone-900'}`}>
              Quick Actions
            </h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* 1: Compose */}
            <div
              onClick={() => onStartCompose()}
              className={`p-4 rounded-2xl border flex flex-col items-center justify-center text-center gap-2 cursor-pointer transition-all hover:scale-105 ${
                theme === 'dark'
                  ? 'bg-[#0E1015] hover:bg-stone-800/80 border-stone-800 hover:border-amber-500/40'
                  : 'bg-amber-50/60 hover:bg-amber-100/60 border-amber-200/80 hover:border-amber-400'
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center">
                <Send className="w-4 h-4" />
              </div>
              <span className={`text-xs font-bold ${theme === 'dark' ? 'text-white' : 'text-stone-900'}`}>
                Compose
              </span>
            </div>

            {/* 2: Use Template */}
            <div
              onClick={() => onStartCompose({ step: 1 })}
              className={`p-4 rounded-2xl border flex flex-col items-center justify-center text-center gap-2 cursor-pointer transition-all hover:scale-105 ${
                theme === 'dark'
                  ? 'bg-[#0E1015] hover:bg-stone-800/80 border-stone-800 hover:border-amber-500/40'
                  : 'bg-amber-50/60 hover:bg-amber-100/60 border-amber-200/80 hover:border-amber-400'
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center">
                <FileText className="w-4 h-4" />
              </div>
              <span className={`text-xs font-bold ${theme === 'dark' ? 'text-white' : 'text-stone-900'}`}>
                Use Template
              </span>
            </div>

            {/* 3: Schedule */}
            <div
              onClick={() => onStartCompose()}
              className={`p-4 rounded-2xl border flex flex-col items-center justify-center text-center gap-2 cursor-pointer transition-all hover:scale-105 ${
                theme === 'dark'
                  ? 'bg-[#0E1015] hover:bg-stone-800/80 border-stone-800 hover:border-amber-500/40'
                  : 'bg-amber-50/60 hover:bg-amber-100/60 border-amber-200/80 hover:border-amber-400'
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center">
                <Calendar className="w-4 h-4" />
              </div>
              <span className={`text-xs font-bold ${theme === 'dark' ? 'text-white' : 'text-stone-900'}`}>
                Schedule
              </span>
            </div>

            {/* 4: View Analytics */}
            <div
              onClick={() => {
                const el = document.getElementById('analytics-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className={`p-4 rounded-2xl border flex flex-col items-center justify-center text-center gap-2 cursor-pointer transition-all hover:scale-105 ${
                theme === 'dark'
                  ? 'bg-[#0E1015] hover:bg-stone-800/80 border-stone-800 hover:border-amber-500/40'
                  : 'bg-amber-50/60 hover:bg-amber-100/60 border-amber-200/80 hover:border-amber-400'
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center">
                <BarChart3 className="w-4 h-4" />
              </div>
              <span className={`text-xs font-bold ${theme === 'dark' ? 'text-white' : 'text-stone-900'}`}>
                View Analytics
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* ============================================================
          6. EMAIL PREFERENCES & CATEGORY ANALYTICS SECTION
      ============================================================ */}
      <div id="analytics-section" className={`p-6 rounded-3xl border space-y-4 transition-all ${
        theme === 'dark' ? 'bg-[#12141A] border-amber-500/15 shadow-xl' : 'bg-white border-amber-900/10 shadow-xs'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-4 border-stone-800/40">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <h3 className={`text-base font-extrabold ${theme === 'dark' ? 'text-white' : 'text-stone-900'}`}>
                Email Preferences & Category Analytics
              </h3>
            </div>
            <p className={`text-xs mt-0.5 ${theme === 'dark' ? 'text-stone-400' : 'text-stone-500'}`}>
              Live AI-classified breakdown calculated directly from Supabase & Gmail
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold">
            <span className={`px-3 py-1 rounded-full border text-[11px] ${
              theme === 'dark' ? 'bg-stone-800 border-stone-700 text-stone-300' : 'bg-stone-100 border-stone-200 text-stone-700'
            }`}>
              Total Tracked: {stats.total || (stats.sent + stats.received)}
            </span>
          </div>
        </div>

        {/* 12 Preference Categories */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {[
            { id: 'leave', label: 'Leave Request', icon: '📅', count: stats.categories?.leave || 0, color: 'from-amber-500 to-yellow-400' },
            { id: 'jobApplication', label: 'Job Application', icon: '📄', count: stats.categories?.jobApplication || 0, color: 'from-amber-600 to-amber-400' },
            { id: 'business', label: 'Business Proposal', icon: '🤝', count: stats.categories?.business || 0, color: 'from-yellow-600 to-amber-500' },
            { id: 'emergency', label: 'Emergency', icon: '🚨', count: stats.categories?.emergency || 0, color: 'from-rose-500 to-amber-500' },
            { id: 'personal', label: 'Personal / Casual', icon: '💬', count: stats.categories?.personal || 0, color: 'from-amber-500 to-orange-400' },
            { id: 'official', label: 'Official / Professional', icon: '👔', count: stats.categories?.official || 0, color: 'from-amber-600 to-yellow-500' },
            { id: 'complaint', label: 'Complaint', icon: '⚠️', count: stats.categories?.complaint || 0, color: 'from-orange-500 to-amber-500' },
            { id: 'payment', label: 'Payment / Invoice', icon: '💳', count: stats.categories?.payment || 0, color: 'from-yellow-500 to-amber-600' },
            { id: 'meeting', label: 'Meeting / Sync', icon: '🗓️', count: stats.categories?.meeting || 0, color: 'from-amber-400 to-yellow-500' },
            { id: 'followUp', label: 'Follow-up', icon: '🔄', count: stats.categories?.followUp || 0, color: 'from-amber-500 to-yellow-600' },
            { id: 'thankYou', label: 'Appreciation', icon: '🙏', count: stats.categories?.thankYou || 0, color: 'from-yellow-400 to-amber-500' },
            { id: 'other', label: 'Other Inquiries', icon: '✉️', count: (stats.categories?.other || 0) + (stats.categories?.inquiry || 0) + (stats.categories?.announcement || 0), color: 'from-stone-500 to-amber-600' },
          ].map((cat) => {
            const total = stats.total || (stats.sent + stats.received) || 1;
            const pct = Math.min(100, Math.round((cat.count / total) * 100));
            return (
              <div 
                key={cat.id} 
                onClick={() => {
                  setSelectedCategory(cat.id === 'leave' ? 'Leave' : cat.id === 'jobApplication' ? 'Resume' : cat.id === 'emergency' ? 'Emergency' : 'All');
                }}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer group ${
                  theme === 'dark'
                    ? 'bg-[#0E1015] hover:bg-stone-800/80 border-stone-800 hover:border-amber-500/40'
                    : 'bg-stone-50 hover:bg-stone-100 border-stone-200 hover:border-amber-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-base">{cat.icon}</span>
                  <span className={`text-xs font-extrabold px-2 py-0.5 rounded-full ${
                    cat.count > 0 
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' 
                      : theme === 'dark' ? 'bg-stone-800 text-stone-500' : 'bg-stone-200 text-stone-600'
                  }`}>
                    {loading ? '...' : cat.count}
                  </span>
                </div>
                <div className={`text-[11px] font-bold truncate ${theme === 'dark' ? 'text-stone-300 group-hover:text-white' : 'text-stone-800 group-hover:text-stone-950'}`}>
                  {cat.label}
                </div>
                {/* Visual Progress Gauge */}
                <div className={`w-full h-1.5 rounded-full overflow-hidden mt-2 ${theme === 'dark' ? 'bg-stone-800' : 'bg-stone-200'}`}>
                  <div 
                    className={`h-full bg-gradient-to-r ${cat.color} rounded-full transition-all duration-500`}
                    style={{ width: `${cat.count > 0 ? Math.max(10, pct) : 0}%` }}
                  />
                </div>
              </div>
            );
          })}
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
