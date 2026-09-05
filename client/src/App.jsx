/**
 * ============================================================================
 * Scribe-AI — Main Application Component (App.jsx)
 * ============================================================================
 * Futuristic Cyber-Glass Dark UI Theme
 * - Multi-user authentication & session management
 * - View switching (Dashboard, Compose, History, Contacts, Templates, Settings, Trash)
 * - Real-time notification counters & toast triggers
 * - Interactive sidebar with glowing neon badges & rocket promo card
 * - Header with user avatar, status pill, and notification bell
 */

import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Mail, Bell, LayoutDashboard, History, Settings, 
  Send, ShieldCheck, PlusCircle, Menu, X, LogOut, User,
  Users, Layout, Trash2, CheckCircle, ChevronDown, Rocket, Crown, ExternalLink,
  Search, Calendar, BarChart2
} from 'lucide-react';

import { LoginPage } from './components/LoginPage';
import { Dashboard } from './components/Dashboard';
import { ComposeWorkflow } from './components/ComposeWorkflow';
import { EmailHistory } from './components/EmailHistory';
import { NotificationCenter } from './components/NotificationCenter';
import { SettingsView } from './components/SettingsView';
import { ContactsManager } from './components/ContactsManager';
import { TemplatesLibrary } from './components/TemplatesLibrary';
import { TrashView } from './components/TrashView';
import { PublicLandingPage } from './components/PublicLandingPage';
import { PrivacyPolicy } from './components/PrivacyPolicy';
import { TermsOfService } from './components/TermsOfService';
import { apiFetch } from './utils/api';
import { supabase, subscribeToNotificationChanges, signOutUser } from './utils/supabaseClient';

export default function App() {
  // Lock theme permanently to dark mode
  const theme = 'dark';
  const [currentUserEmail, setCurrentUserEmail] = useState(() => localStorage.getItem('userEmail') || '');
  const [currentUserName, setCurrentUserName] = useState(() => localStorage.getItem('userName') || '');

  // Synchronize and permanently enforce dark theme on documentElement and storage
  useEffect(() => {
    localStorage.setItem('scribe_theme', 'dark');
    document.documentElement.classList.add('dark');
    document.documentElement.classList.remove('light');
    if (document.body) {
      document.body.classList.add('dark');
      document.body.classList.remove('light');
    }
  }, []);

  const [currentRoute, setCurrentRoute] = useState(() => window.location.pathname);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const [composeInitialData, setComposeInitialData] = useState({});
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isGmailConnected, setIsGmailConnected] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  // Single Source of Truth for Compose Form State
  const [composeState, setComposeState] = useState({
    instruction: '',
    recipient: '',
    cc: '',
    bcc: '',
    subject: '',
    body: '',
    selectedFile: null,
    step: 1, // 1: Form, 2: Loading, 3: Preview, 4: Modal, 5: Sending, 6: Sent
    emailType: 'Professional / Official',
    detectedCategory: 'Professional / Official',
    situation: '💼 Official / Professional',
    situationSource: 'auto',
    tone: 'Professional',
    priority: 'MEDIUM',
    importance: 'MEDIUM',
    urgency: 'Normal response',
    errorMessage: '',
    sentResult: null,
    autoGenerate: false
  });

  const handleUpdateComposeState = (updates) => {
    setComposeState(prev => ({ ...prev, ...updates }));
  };

  const handleResetCompose = () => {
    setComposeState({
      instruction: '',
      recipient: '',
      cc: '',
      bcc: '',
      subject: '',
      body: '',
      selectedFile: null,
      step: 1,
      emailType: 'Professional / Official',
      detectedCategory: 'Professional / Official',
      situation: '💼 Official / Professional',
      situationSource: 'auto',
      tone: 'Professional',
      priority: 'MEDIUM',
      importance: 'MEDIUM',
      urgency: 'Normal response',
      errorMessage: '',
      sentResult: null,
      autoGenerate: false
    });
  };

  const [toastMessage, setToastMessage] = useState('');

  // Listen to Supabase Auth State & Session
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const supaUser = session.user;
        const email = supaUser.email || '';
        const name = supaUser.user_metadata?.full_name || supaUser.user_metadata?.name || email.split('@')[0];
        setCurrentUserEmail(email);
        setCurrentUserName(name);
        localStorage.setItem('userEmail', email);
        localStorage.setItem('userName', name);
        localStorage.setItem('userId', supaUser.id);
        if (session.access_token) localStorage.setItem('authToken', session.access_token);

        if (session.provider_token) {
          apiFetch('/api/auth/google/save-session-tokens', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              providerToken: session.provider_token,
              providerRefreshToken: session.provider_refresh_token,
              email: email,
            }),
          }).catch((e) => console.warn('Sync session tokens notice:', e));
        }

        // Trigger automatic Gmail sync on session restore
        apiFetch('/api/gmail/sync', { method: 'POST' }).catch(() => {});
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const supaUser = session.user;
        const email = supaUser.email || '';
        const name = supaUser.user_metadata?.full_name || supaUser.user_metadata?.name || email.split('@')[0];
        setCurrentUserEmail(email);
        setCurrentUserName(name);
        localStorage.setItem('userEmail', email);
        localStorage.setItem('userName', name);
        localStorage.setItem('userId', supaUser.id);
        if (session.access_token) localStorage.setItem('authToken', session.access_token);

        if (session.provider_token) {
          apiFetch('/api/auth/google/save-session-tokens', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              providerToken: session.provider_token,
              providerRefreshToken: session.provider_refresh_token,
              email: email,
            }),
          }).catch((e) => console.warn('Sync session tokens notice:', e));
        }

        if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
          // Trigger automatic Gmail sync on user login
          apiFetch('/api/gmail/sync', { method: 'POST' }).catch(() => {});
        }
      } else if (event === 'SIGNED_OUT') {
        setCurrentUserEmail('');
        setCurrentUserName('');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('gmail') === 'connected' || params.get('auth') === 'success') {
      const emailParam = params.get('email');
      const userIdParam = params.get('user_id');
      const authLinkParam = params.get('auth_link');

      if (emailParam) {
        localStorage.setItem('userEmail', emailParam.toLowerCase().trim());
        setCurrentUserEmail(emailParam.toLowerCase().trim());
      }
      if (userIdParam) {
        localStorage.setItem('userId', userIdParam);
      }
      if (authLinkParam) {
        window.location.href = authLinkParam;
        return;
      }

      setActiveTab('dashboard');
      setToastMessage('✓ Gmail Connected Successfully!');
      window.history.replaceState({}, '', window.location.pathname);
      setTimeout(() => setToastMessage(''), 5000);
      checkGmailConnection();
      // Auto-trigger sync immediately upon connecting Gmail
      apiFetch('/api/gmail/sync', { method: 'POST' }).catch(() => {});
    } else if (params.get('gmail') === 'missing_scopes') {
      setActiveTab('settings');
      setToastMessage('⚠️ Gmail sending permission was not granted. Please click "Connect with Google" and check the "Send email on your behalf" box.');
      window.history.replaceState({}, '', window.location.pathname);
      setTimeout(() => setToastMessage(''), 8000);
    } else if (params.get('gmail') === 'cancelled') {
      setToastMessage('⚠️ Gmail connection cancelled.');
      window.history.replaceState({}, '', window.location.pathname);
      setTimeout(() => setToastMessage(''), 5000);
    }
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentRoute(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = (path) => {
    window.history.pushState({}, '', path);
    setCurrentRoute(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    if (currentUserEmail) {
      fetchUnreadNotifs();
      checkGmailConnection();

      // Trigger automatic background Gmail synchronization whenever any user logs in or switches
      apiFetch('/api/gmail/sync', { method: 'POST' })
        .then(r => r.json())
        .then(d => {
          if (d?.newReceived > 0 || d?.newSent > 0) {
            fetchUnreadNotifs();
          }
        })
        .catch(() => {});

      // Instant updates via Supabase Realtime channel
      const unsubscribe = subscribeToNotificationChanges(currentUserEmail, () => {
        fetchUnreadNotifs();
      });

      const interval = setInterval(fetchUnreadNotifs, 20000);
      return () => {
        if (typeof unsubscribe === 'function') unsubscribe();
        clearInterval(interval);
      };
    }
  }, [currentUserEmail]);

  const fetchUnreadNotifs = async () => {
    try {
      const res = await apiFetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        setUnreadNotifCount(typeof data.unreadCount === 'number' ? data.unreadCount : 0);
      }
    } catch (err) {
      console.error('Failed to poll notifications count:', err);
    }
  };

  const checkGmailConnection = async () => {
    try {
      const res = await apiFetch('/api/auth/status');
      if (res.ok) {
        const data = await res.json();
        setIsGmailConnected(!!data.isConnected);
      } else {
        setIsGmailConnected(false);
      }
    } catch (err) {
      console.error('Failed to check auth status:', err);
      setIsGmailConnected(false);
    }
  };

  const handleLoginSuccess = (user) => {
    setCurrentUserEmail(user.email);
    setCurrentUserName(user.name || user.email.split('@')[0]);
    navigateTo('/app');
    setActiveTab('dashboard');
  };

  const handleLogout = async () => {
    try {
      await signOutUser();
    } catch (_) {}
    try {
      await apiFetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {}
    localStorage.clear();
    setCurrentUserEmail('');
    setCurrentUserName('');
    setUnreadNotifCount(0);
    setIsGmailConnected(false);
    navigateTo('/');
  };

  const handleStartCompose = (data = {}) => {
    setComposeState(prev => ({
      ...prev,
      instruction: data.instruction !== undefined ? data.instruction : prev.instruction,
      recipient: data.recipient !== undefined ? data.recipient : prev.recipient,
      cc: data.cc !== undefined ? data.cc : prev.cc,
      bcc: data.bcc !== undefined ? data.bcc : prev.bcc,
      subject: data.subject !== undefined ? data.subject : prev.subject,
      body: data.body !== undefined ? data.body : prev.body,
      selectedFile: data.selectedFile !== undefined ? data.selectedFile : prev.selectedFile,
      autoGenerate: !!data.autoGenerate,
      step: data.autoGenerate ? 2 : (data.step || prev.step || 1),
      errorMessage: ''
    }));
    setComposeInitialData(data);
    setActiveTab('compose');
    setMobileMenuOpen(false);
  };

  const getPageTitle = () => {
    switch (activeTab) {
      case 'dashboard': return 'Dashboard';
      case 'compose': return 'AI Smart Email Compose';
      case 'history': return 'Email History & Archives';
      case 'notifications': return 'Notifications';
      case 'contacts': return 'Contacts & Address Book';
      case 'templates': return 'Canned Email Templates';
      case 'settings': return 'Settings & Account Authorization';
      case 'trash': return 'Deleted Emails (Trash)';
      default: return 'Scribe AI';
    }
  };

  // Public Routes (Accessible without login)
  if (currentRoute === '/privacy') {
    return (
      <PrivacyPolicy 
        onBackToHome={() => navigateTo('/')} 
        onNavigateToTerms={() => navigateTo('/terms')} 
        onNavigateToLogin={() => navigateTo('/login')}
      />
    );
  }

  if (currentRoute === '/terms') {
    return (
      <TermsOfService 
        onBackToHome={() => navigateTo('/')} 
        onNavigateToPrivacy={() => navigateTo('/privacy')} 
        onNavigateToLogin={() => navigateTo('/login')}
      />
    );
  }

  if (currentRoute === '/login') {
    return <LoginPage onLoginSuccess={handleLoginSuccess} onBackToHome={() => navigateTo('/')} />;
  }

  // If on homepage and not logged in, show Public Landing Page
  if (!currentUserEmail && (currentRoute === '/' || currentRoute === '')) {
    return (
      <PublicLandingPage
        onNavigateToLogin={() => navigateTo('/login')}
        onNavigateToPrivacy={() => navigateTo('/privacy')}
        onNavigateToTerms={() => navigateTo('/terms')}
      />
    );
  }

  // If no user is logged in, show Login Page
  if (!currentUserEmail) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} onBackToHome={() => navigateTo('/')} />;
  }

  const displayName = currentUserName || (currentUserEmail ? currentUserEmail.split('@')[0] : 'User');

  return (
    <div className={`min-h-screen flex flex-col md:flex-row font-sans selection:bg-[#D4A373] selection:text-[#121211] relative overflow-x-hidden transition-colors duration-200 ${
      theme === 'dark' ? 'bg-[#121211] text-[#F5F3EF]' : 'bg-[#FAF8F5] text-stone-900'
    }`}>
      
      {/* Subtle Ambient Warm Cashmere Glows */}
      {theme === 'dark' ? (
        <>
          <div className="fixed top-0 left-1/4 w-96 h-96 bg-[#D4A373]/5 rounded-full blur-3xl pointer-events-none -z-10" />
          <div className="fixed bottom-10 right-10 w-96 h-96 bg-[#C59362]/5 rounded-full blur-3xl pointer-events-none -z-10" />
        </>
      ) : (
        <>
          <div className="fixed top-0 left-1/4 w-96 h-96 bg-[#D4A373]/15 rounded-full blur-3xl pointer-events-none -z-10" />
          <div className="fixed bottom-10 right-10 w-96 h-96 bg-orange-100/30 rounded-full blur-3xl pointer-events-none -z-10" />
        </>
      )}

      {/* ============================================================
          VERTICAL SIDEBAR NAVIGATION (Warm Cashmere & Charcoal)
      ============================================================ */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 backdrop-blur-xl flex flex-col justify-between transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:z-auto shadow-2xl
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        ${theme === 'dark' 
          ? 'bg-[#121211] border-r border-[#2E2D2B] text-[#F5F3EF]' 
          : 'bg-white border-r border-amber-900/10 text-stone-800'
        }
      `}>
        <div className="p-5 space-y-6 overflow-y-auto">
          {/* Brand Logo Header */}
          <div 
            className="flex items-center gap-3 cursor-pointer group px-2" 
            onClick={() => { setActiveTab('dashboard'); setMobileMenuOpen(false); }}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#D4A373] to-[#ECE8E1] p-[1px] shadow-lg shadow-[#D4A373]/20 group-hover:scale-105 transition-transform shrink-0">
              <div className={`w-full h-full ${theme === 'dark' ? 'bg-[#1A1918]' : 'bg-[#FFFDF9]'} rounded-[11px] flex items-center justify-center`}>
                <Send className="w-5 h-5 text-[#D4A373] transform rotate-[-20deg]" />
              </div>
            </div>
            <div>
              <h1 className={`text-base font-extrabold tracking-tight leading-tight flex items-center gap-1 ${theme === 'dark' ? 'text-[#F5F3EF]' : 'text-stone-900'}`}>
                AI Smart <span className="text-[#D4A373]">Sender</span>
              </h1>
              <p className={`text-[11px] font-medium truncate ${theme === 'dark' ? 'text-[#99958F]' : 'text-stone-500'}`}>
                AI-Powered Email Assistant
              </p>
            </div>
          </div>

          {/* Glowing Compose Button with Light Sweep and Micro-Motion */}
          <button
            onClick={() => handleStartCompose()}
            className="w-full py-3 px-4 rounded-xl gold-btn light-sweep font-bold text-xs flex items-center justify-center gap-2 shadow-lg cursor-pointer group"
          >
            <PlusCircle className="w-4 h-4 text-[#121211] btn-icon-spin transition-transform" />
            <span className="text-[#121211]">Compose New Email</span>
          </button>

          {/* Vertical Navigation Links with Premium Hover Transitions */}
          <nav className="space-y-1.5 pt-1">
            
            <button
              onClick={() => { setActiveTab('dashboard'); setMobileMenuOpen(false); }}
              className={`w-full text-left px-4 py-3 rounded-xl text-xs font-semibold flex items-center justify-between nav-item-interactive group cursor-pointer ${
                activeTab === 'dashboard'
                  ? theme === 'dark'
                    ? 'bg-[#D4A373]/12 text-[#ECE8E1] font-bold border border-[#D4A373]/35 shadow-sm shadow-[#D4A373]/10'
                    : 'bg-[#FFF9EE] text-amber-900 font-bold border border-amber-300 shadow-sm'
                  : theme === 'dark'
                    ? 'text-[#99958F] hover:text-[#F5F3EF] hover:bg-[#1A1918]'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-amber-50/70'
              }`}
            >
              <div className="flex items-center gap-3">
                <LayoutDashboard className={`w-4 h-4 nav-icon transition-all duration-200 ${activeTab === 'dashboard' ? 'text-[#D4A373]' : 'text-[#99958F] group-hover:text-[#D4A373]'}`} />
                <span>Dashboard</span>
              </div>
            </button>

            <button
              onClick={() => handleStartCompose()}
              className={`w-full text-left px-4 py-3 rounded-xl text-xs font-semibold flex items-center justify-between nav-item-interactive group cursor-pointer ${
                activeTab === 'compose'
                  ? theme === 'dark'
                    ? 'bg-[#D4A373]/12 text-[#ECE8E1] font-bold border border-[#D4A373]/35 shadow-sm shadow-[#D4A373]/10'
                    : 'bg-[#FFF9EE] text-amber-900 font-bold border border-amber-300 shadow-sm'
                  : theme === 'dark'
                    ? 'text-[#99958F] hover:text-[#F5F3EF] hover:bg-[#1A1918]'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-amber-50/70'
              }`}
            >
              <div className="flex items-center gap-3">
                <Send className={`w-4 h-4 nav-icon transition-all duration-200 ${activeTab === 'compose' ? 'text-[#D4A373]' : 'text-[#99958F] group-hover:text-[#D4A373]'}`} />
                <span>Compose Email</span>
              </div>
            </button>

            <button
              onClick={() => { setActiveTab('history'); setMobileMenuOpen(false); }}
              className={`w-full text-left px-4 py-3 rounded-xl text-xs font-semibold flex items-center justify-between nav-item-interactive group cursor-pointer ${
                activeTab === 'history'
                  ? theme === 'dark'
                    ? 'bg-[#D4A373]/12 text-[#ECE8E1] font-bold border border-[#D4A373]/35 shadow-sm shadow-[#D4A373]/10'
                    : 'bg-[#FFF9EE] text-amber-900 font-bold border border-amber-300 shadow-sm'
                  : theme === 'dark'
                    ? 'text-[#99958F] hover:text-[#F5F3EF] hover:bg-[#1A1918]'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-amber-50/70'
              }`}
            >
              <div className="flex items-center gap-3">
                <History className={`w-4 h-4 nav-icon transition-all duration-200 ${activeTab === 'history' ? 'text-[#D4A373]' : 'text-[#99958F] group-hover:text-[#D4A373]'}`} />
                <span>Email History</span>
              </div>
            </button>

            <button
              onClick={() => { setActiveTab('contacts'); setMobileMenuOpen(false); }}
              className={`w-full text-left px-4 py-3 rounded-xl text-xs font-semibold flex items-center justify-between nav-item-interactive group cursor-pointer ${
                activeTab === 'contacts'
                  ? theme === 'dark'
                    ? 'bg-[#D4A373]/12 text-[#ECE8E1] font-bold border border-[#D4A373]/35 shadow-sm shadow-[#D4A373]/10'
                    : 'bg-[#FFF9EE] text-amber-900 font-bold border border-amber-300 shadow-sm'
                  : theme === 'dark'
                    ? 'text-[#99958F] hover:text-[#F5F3EF] hover:bg-[#1A1918]'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-amber-50/70'
              }`}
            >
              <div className="flex items-center gap-3">
                <Users className={`w-4 h-4 nav-icon transition-all duration-200 ${activeTab === 'contacts' ? 'text-[#D4A373]' : 'text-[#99958F] group-hover:text-[#D4A373]'}`} />
                <span>Contacts & Address Book</span>
              </div>
            </button>

            <button
              onClick={() => { setActiveTab('templates'); setMobileMenuOpen(false); }}
              className={`w-full text-left px-4 py-3 rounded-xl text-xs font-semibold flex items-center justify-between nav-item-interactive group cursor-pointer ${
                activeTab === 'templates'
                  ? theme === 'dark'
                    ? 'bg-[#D4A373]/12 text-[#ECE8E1] font-bold border border-[#D4A373]/35 shadow-sm shadow-[#D4A373]/10'
                    : 'bg-[#FFF9EE] text-amber-900 font-bold border border-amber-300 shadow-sm'
                  : theme === 'dark'
                    ? 'text-[#99958F] hover:text-[#F5F3EF] hover:bg-[#1A1918]'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-amber-50/70'
              }`}
            >
              <div className="flex items-center gap-3">
                <Layout className={`w-4 h-4 nav-icon transition-all duration-200 ${activeTab === 'templates' ? 'text-[#D4A373]' : 'text-[#99958F] group-hover:text-[#D4A373]'}`} />
                <span>Canned Templates</span>
              </div>
            </button>

            <button
              onClick={() => { setActiveTab('notifications'); setMobileMenuOpen(false); }}
              className={`w-full text-left px-4 py-3 rounded-xl text-xs font-semibold flex items-center justify-between nav-item-interactive group cursor-pointer ${
                activeTab === 'notifications'
                  ? theme === 'dark'
                    ? 'bg-[#D4A373]/12 text-[#ECE8E1] font-bold border border-[#D4A373]/35 shadow-sm shadow-[#D4A373]/10'
                    : 'bg-[#FFF9EE] text-amber-900 font-bold border border-amber-300 shadow-sm'
                  : theme === 'dark'
                    ? 'text-[#99958F] hover:text-[#F5F3EF] hover:bg-[#1A1918]'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-amber-50/70'
              }`}
            >
              <div className="flex items-center gap-3">
                <Bell className={`w-4 h-4 nav-icon transition-all duration-200 ${activeTab === 'notifications' ? 'text-[#D4A373]' : 'text-[#99958F] group-hover:text-[#D4A373]'}`} />
                <span>Notifications</span>
              </div>
              {unreadNotifCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-[#D4A373] text-[#121211] text-[10px] font-extrabold shadow-sm">
                  {unreadNotifCount}
                </span>
              )}
            </button>

            <button
              onClick={() => { setActiveTab('settings'); setMobileMenuOpen(false); }}
              className={`w-full text-left px-4 py-3 rounded-xl text-xs font-semibold flex items-center justify-between nav-item-interactive group cursor-pointer ${
                activeTab === 'settings'
                  ? theme === 'dark'
                    ? 'bg-[#D4A373]/12 text-[#ECE8E1] font-bold border border-[#D4A373]/35 shadow-sm shadow-[#D4A373]/10'
                    : 'bg-[#FFF9EE] text-amber-900 font-bold border border-amber-300 shadow-sm'
                  : theme === 'dark'
                    ? 'text-[#99958F] hover:text-[#F5F3EF] hover:bg-[#1A1918]'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-amber-50/70'
              }`}
            >
              <div className="flex items-center gap-3">
                <Settings className={`w-4 h-4 nav-icon transition-all duration-200 ${activeTab === 'settings' ? 'text-[#D4A373]' : 'text-[#99958F] group-hover:text-[#D4A373]'}`} />
                <span>Settings</span>
              </div>
            </button>

            <button
              onClick={() => { setActiveTab('trash'); setMobileMenuOpen(false); }}
              className={`w-full text-left px-4 py-3 rounded-xl text-xs font-semibold flex items-center justify-between nav-item-interactive group cursor-pointer ${
                activeTab === 'trash'
                  ? theme === 'dark'
                    ? 'bg-[#D4A373]/12 text-[#ECE8E1] font-bold border border-[#D4A373]/35 shadow-sm shadow-[#D4A373]/10'
                    : 'bg-[#FFF9EE] text-amber-900 font-bold border border-amber-300 shadow-sm'
                  : theme === 'dark'
                    ? 'text-[#99958F] hover:text-[#F5F3EF] hover:bg-[#1A1918]'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-amber-50/70'
              }`}
            >
              <div className="flex items-center gap-3">
                <Trash2 className={`w-4 h-4 nav-icon transition-all duration-200 ${activeTab === 'trash' ? 'text-[#D4A373]' : 'text-[#99958F] group-hover:text-[#D4A373]'}`} />
                <span>Trash</span>
              </div>
            </button>
          </nav>
        </div>

        {/* Sidebar Bottom: Upgrade to Premium Card */}
        <div className="p-4 space-y-3">
          <div className={`p-4 rounded-2xl border relative overflow-hidden group ${
            theme === 'dark' 
              ? 'bg-gradient-to-b from-[#1A1918] to-[#161514] border-[#2E2D2B] shadow-xl' 
              : 'bg-gradient-to-b from-[#FFFDF8] to-[#FBF3DE] border-amber-300/80 shadow-md'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#D4A373] to-[#ECE8E1] flex items-center justify-center text-[#121211] shadow-md shadow-[#D4A373]/20">
                <Crown className="w-4 h-4" />
              </div>
              <h4 className={`text-xs font-extrabold ${theme === 'dark' ? 'text-[#F5F3EF]' : 'text-stone-900'}`}>
                Upgrade to Premium
              </h4>
            </div>
            
            <div className={`space-y-1 text-[11px] mb-3 leading-relaxed ${theme === 'dark' ? 'text-[#99958F]' : 'text-stone-600'}`}>
              <div className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-[#D4A373] shrink-0" /> <span>Unlock advanced features</span></div>
              <div className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-[#D4A373] shrink-0" /> <span>Higher email limits</span></div>
              <div className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-[#D4A373] shrink-0" /> <span>AI personalization</span></div>
              <div className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-[#D4A373] shrink-0" /> <span>Priority support</span></div>
            </div>

            <button
              onClick={() => setActiveTab('settings')}
              className="w-full py-2.5 px-3 rounded-xl gold-btn light-sweep font-bold text-[11px] flex items-center justify-center gap-1.5 shadow-md cursor-pointer group"
            >
              <span>Upgrade Now</span>
              <span className="btn-arrow-slide transition-transform duration-200">→</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm md:hidden"
        ></div>
      )}

      {/* ============================================================
          MAIN RIGHT CONTENT AREA
      ============================================================ */}
      <div className={`flex-1 flex flex-col min-w-0 min-h-screen ${
        theme === 'dark' ? 'bg-[#121211]' : 'bg-[#FAF8F5]'
      }`}>
        
        {/* Top Navigation Bar */}
        <header className={`sticky top-0 z-30 backdrop-blur-xl px-6 py-4 flex items-center justify-between shadow-sm transition-colors ${
          theme === 'dark'
            ? 'bg-[#121211]/95 border-b border-[#2E2D2B]'
            : 'bg-white/90 border-b border-amber-900/10'
        }`}>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`p-2 rounded-xl md:hidden border transition-transform active:scale-95 cursor-pointer ${
                theme === 'dark' ? 'bg-[#1A1918] border-[#2E2D2B] text-[#F5F3EF]' : 'bg-stone-100 border-stone-300 text-stone-800'
              }`}
            >
              <Menu className="w-5 h-5" />
            </button>

            <div>
              <h2 className={`text-xl font-extrabold tracking-tight flex items-center gap-2 ${
                theme === 'dark' ? 'text-[#F5F3EF]' : 'text-stone-900'
              }`}>
                <span>{getPageTitle()}</span>
                {activeTab === 'dashboard' && <Sparkles className="w-4 h-4 text-[#D4A373] animate-pulse" />}
              </h2>
              {activeTab === 'dashboard' && (
                <p className={`text-xs ${theme === 'dark' ? 'text-[#99958F]' : 'text-stone-600'}`}>
                  Welcome back, <span className="font-bold text-[#D4A373]">{displayName}</span>! 👋
                </p>
              )}
            </div>
          </div>

          {/* Search bar in header (Warm Cashmere Minimalist with Interactive Glow) */}
          <div className="hidden lg:flex items-center flex-1 max-w-md mx-8">
            <div className={`w-full flex items-center gap-2.5 px-4 py-2 rounded-full border input-interactive group ${
              theme === 'dark' 
                ? 'bg-[#1A1918] border-[#2E2D2B]' 
                : 'bg-[#F5F2EB] border-amber-900/10'
            }`}>
              <Search className="w-4 h-4 text-[#99958F] group-hover:text-[#D4A373] group-focus-within:text-[#D4A373] group-hover:scale-110 transition-all duration-200 shrink-0" />
              <input
                type="text"
                placeholder="Search emails, contacts, templates..."
                className={`w-full text-xs bg-transparent outline-none placeholder:text-[#99958F] ${
                  theme === 'dark' ? 'text-[#F5F3EF]' : 'text-stone-900'
                }`}
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Live Gmail Connection Status Pill */}
            <div className={`hidden sm:inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all ${
              isGmailConnected
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-xs'
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-xs'
            }`}>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-xs shadow-emerald-400/50"></span>
              <span>Gmail Connected</span>
            </div>

            {/* GitHub Repository Link Button */}
            <a
              href="https://github.com/yuvasriram2909/Scribe-AI"
              target="_blank"
              rel="noopener noreferrer"
              className={`p-2.5 rounded-xl border transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer inline-flex items-center justify-center ${
                theme === 'dark'
                  ? 'bg-[#1A1918] hover:bg-[#22211F] border-[#2E2D2B] hover:border-[#D4A373]/40 text-[#99958F] hover:text-[#D4A373]'
                  : 'bg-stone-100 hover:bg-stone-200 border-stone-200 hover:border-amber-400 text-stone-700'
              }`}
              title="GitHub Repository"
            >
              <svg className="w-4.5 h-4.5 fill-current" viewBox="0 0 24 24">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
              </svg>
            </a>

            {/* Notification Bell with Bell-Hover Shake Animation */}
            <button
              onClick={() => setActiveTab('notifications')}
              className={`relative p-2.5 rounded-xl border transition-all duration-200 bell-hover hover:scale-105 active:scale-95 cursor-pointer ${
                theme === 'dark'
                  ? 'bg-[#1A1918] hover:bg-[#22211F] border-[#2E2D2B] hover:border-[#D4A373]/40 text-[#F5F3EF]'
                  : 'bg-stone-100 hover:bg-stone-200 border-stone-200 hover:border-amber-400 text-stone-700'
              }`}
              title="Notifications"
            >
              <Bell className="w-4.5 h-4.5" />
              <span className="absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[9px] font-extrabold shadow-sm">
                {unreadNotifCount > 0 ? unreadNotifCount : '3'}
              </span>
            </button>

            {/* User Profile Pill & Dropdown with Hover Lift & Glow */}
            <div className="relative">
              <div 
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className={`flex items-center gap-2.5 p-1.5 pr-3 rounded-2xl border cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:border-[#D4A373]/40 hover:shadow-md active:scale-[0.98] ${
                  theme === 'dark'
                    ? 'bg-[#1A1918] hover:bg-[#22211F] border-[#2E2D2B]'
                    : 'bg-white hover:bg-stone-50 border-amber-900/15 shadow-xs'
                }`}
              >
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#D4A373] to-[#ECE8E1] text-[#121211] font-extrabold text-xs flex items-center justify-center shadow-sm">
                  {displayName[0].toUpperCase()}
                </div>
                <div className="hidden sm:block text-left">
                  <span className={`text-xs font-bold block leading-tight ${
                    theme === 'dark' ? 'text-[#F5F3EF]' : 'text-stone-900'
                  }`}>
                    {displayName}
                  </span>
                  <span className="text-[10px] text-[#D4A373] font-semibold flex items-center gap-1">
                    👑 Premium Plan
                  </span>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-[#99958F] transition-transform duration-200 ${userDropdownOpen ? 'rotate-180' : ''}`} />
              </div>

              {/* User Dropdown Menu */}
              {userDropdownOpen && (
                <div className={`absolute right-0 mt-2 w-56 rounded-2xl p-2 border shadow-2xl z-50 animate-fadeIn ${
                  theme === 'dark' ? 'bg-[#22211F] border-[#2E2D2B] text-[#F5F3EF]' : 'bg-white border-stone-200 text-stone-900'
                }`}>
                  <div className={`p-3 border-b mb-1 ${theme === 'dark' ? 'border-[#2E2D2B]' : 'border-stone-100'}`}>
                    <p className="text-xs font-bold truncate">{displayName}</p>
                    <p className={`text-[11px] font-mono truncate ${theme === 'dark' ? 'text-[#99958F]' : 'text-stone-500'}`}>{currentUserEmail}</p>
                  </div>
                  <button
                    onClick={() => { setActiveTab('settings'); setUserDropdownOpen(false); }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium flex items-center gap-2 cursor-pointer transition-colors ${
                      theme === 'dark' ? 'text-[#ECE8E1] hover:text-[#F5F3EF] hover:bg-[#1A1918]' : 'text-stone-700 hover:text-stone-900 hover:bg-stone-100'
                    }`}
                  >
                    <Settings className="w-4 h-4 text-[#99958F]" />
                    <span>Account Settings</span>
                  </button>
                  <a
                    href="https://github.com/yuvasriram2909/Scribe-AI"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setUserDropdownOpen(false)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium flex items-center gap-2 cursor-pointer transition-colors ${
                      theme === 'dark' ? 'text-[#ECE8E1] hover:text-[#F5F3EF] hover:bg-[#1A1918]' : 'text-stone-700 hover:text-stone-900 hover:bg-stone-100'
                    }`}
                  >
                    <svg className="w-4 h-4 text-[#D4A373] fill-current shrink-0" viewBox="0 0 24 24">
                      <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
                    </svg>
                    <span>GitHub Repository</span>
                  </a>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-medium text-rose-400 hover:bg-rose-500/10 flex items-center gap-2 cursor-pointer mt-1 transition-colors"
                  >
                    <LogOut className="w-4 h-4 text-rose-400" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Global Toast Alert */}
        {toastMessage && (
          <div className="mx-6 mt-4 p-3.5 rounded-2xl bg-[#D4A373]/20 border border-[#D4A373]/40 text-[#ECE8E1] text-xs font-semibold shadow-lg flex items-center justify-between animate-fadeIn">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#D4A373]" />
              <span className={theme === 'dark' ? 'text-[#ECE8E1]' : 'text-amber-900'}>{toastMessage}</span>
            </div>
            <button onClick={() => setToastMessage('')} className="text-[#99958F] hover:text-[#F5F3EF]">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* View Content Container */}
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
          {activeTab === 'dashboard' && (
            <Dashboard 
              onStartCompose={handleStartCompose}
              onViewHistory={() => setActiveTab('history')}
              onNavigateToSettings={() => setActiveTab('settings')}
              onUpdateComposeState={handleUpdateComposeState}
              currentUserName={currentUserName}
              currentUserEmail={currentUserEmail}
              theme={theme}
            />
          )}
          {activeTab === 'compose' && (
            <ComposeWorkflow
              composeState={composeState}
              onUpdateComposeState={handleUpdateComposeState}
              onResetCompose={handleResetCompose}
              initialData={composeInitialData}
              onComplete={() => setActiveTab('history')}
              onCancel={() => setActiveTab('dashboard')}
              onNavigateToSettings={() => setActiveTab('settings')}
            />
          )}
          {activeTab === 'history' && (
            <EmailHistory 
              onStartCompose={handleStartCompose}
            />
          )}
          {activeTab === 'contacts' && (
            <ContactsManager 
              onComposeTo={(contact) => {
                handleStartCompose({ 
                  recipient: contact.email,
                  instruction: `Email to ${contact.name}`
                });
              }}
            />
          )}
          {activeTab === 'templates' && (
            <TemplatesLibrary 
              onUseTemplate={(tpl) => {
                handleStartCompose({
                  subject: tpl.subject,
                  body: tpl.body,
                  emailType: tpl.category || 'Professional / Official',
                  detectedCategory: tpl.category || 'Professional / Official',
                  situation: tpl.category || '💼 Official / Professional',
                  situationSource: 'manual'
                });
              }}
            />
          )}
          {activeTab === 'notifications' && (
            <NotificationCenter />
          )}
          {activeTab === 'settings' && (
            <SettingsView />
          )}
          {activeTab === 'trash' && (
            <TrashView />
          )}
        </main>

        {/* Footer */}
        <footer className="border-t border-[#2E2D2B] py-4 px-6 text-xs text-[#99958F] bg-[#121211]">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
            <span className="font-semibold text-[#F5F3EF]">Scribe AI — Official Gmail Automation Platform</span>
            <span className="flex items-center gap-1.5 text-[#99958F] font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> Security Pipeline: Instruction → AI Categorization → Gmail Preview → User Confirmation → Send
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}
