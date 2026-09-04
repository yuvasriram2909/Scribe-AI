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
  Sun, Moon, Search, Calendar, BarChart2
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
  const [theme, setTheme] = useState(() => localStorage.getItem('scribe_theme') || 'dark');
  const [currentUserEmail, setCurrentUserEmail] = useState(() => localStorage.getItem('userEmail') || '');
  const [currentUserName, setCurrentUserName] = useState(() => localStorage.getItem('userName') || '');

  // Synchronize theme class with documentElement and localStorage
  useEffect(() => {
    localStorage.setItem('scribe_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

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
    <div className={`min-h-screen flex flex-col md:flex-row font-sans selection:bg-amber-500 selection:text-stone-950 relative overflow-x-hidden transition-colors duration-200 ${
      theme === 'dark' ? 'bg-[#08090C] text-stone-100' : 'bg-[#FAF8F5] text-stone-900'
    }`}>
      
      {/* Subtle Ambient Cosmic Gold Glows */}
      {theme === 'dark' ? (
        <>
          <div className="fixed top-0 left-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none -z-10" />
          <div className="fixed bottom-10 right-10 w-96 h-96 bg-yellow-600/5 rounded-full blur-3xl pointer-events-none -z-10" />
        </>
      ) : (
        <>
          <div className="fixed top-0 left-1/4 w-96 h-96 bg-amber-200/20 rounded-full blur-3xl pointer-events-none -z-10" />
          <div className="fixed bottom-10 right-10 w-96 h-96 bg-orange-100/30 rounded-full blur-3xl pointer-events-none -z-10" />
        </>
      )}

      {/* ============================================================
          VERTICAL SIDEBAR NAVIGATION (Luxury Gold & Obsidian / Ivory)
      ============================================================ */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 backdrop-blur-xl flex flex-col justify-between transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:z-auto shadow-2xl
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        ${theme === 'dark' 
          ? 'bg-[#0D0E12] border-r border-[#1F222B] text-stone-200' 
          : 'bg-white border-r border-amber-900/10 text-stone-800'
        }
      `}>
        <div className="p-5 space-y-6 overflow-y-auto">
          {/* Brand Logo Header */}
          <div 
            className="flex items-center gap-3 cursor-pointer group px-2" 
            onClick={() => { setActiveTab('dashboard'); setMobileMenuOpen(false); }}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 p-[1px] shadow-lg shadow-amber-500/25 group-hover:scale-105 transition-transform shrink-0">
              <div className={`w-full h-full ${theme === 'dark' ? 'bg-[#0E1015]' : 'bg-[#FFFDF9]'} rounded-[11px] flex items-center justify-center`}>
                <Send className="w-5 h-5 text-amber-500 transform rotate-[-20deg]" />
              </div>
            </div>
            <div>
              <h1 className={`text-base font-extrabold tracking-tight leading-tight flex items-center gap-1 ${theme === 'dark' ? 'text-white' : 'text-stone-900'}`}>
                AI Smart <span className="text-amber-500">Sender</span>
              </h1>
              <p className={`text-[11px] font-medium truncate ${theme === 'dark' ? 'text-stone-400' : 'text-stone-500'}`}>
                AI-Powered Email Assistant
              </p>
            </div>
          </div>

          {/* Glowing Compose Button with Light Sweep and Micro-Motion */}
          <button
            onClick={() => handleStartCompose()}
            className="w-full py-3 px-4 rounded-xl gold-btn light-sweep font-bold text-xs flex items-center justify-center gap-2 shadow-lg cursor-pointer group"
          >
            <PlusCircle className="w-4 h-4 text-stone-950 btn-icon-spin transition-transform" />
            <span className="text-stone-950">Compose New Email</span>
          </button>

          {/* Vertical Navigation Links with Premium Hover Transitions */}
          <nav className="space-y-1.5 pt-1">
            
            <button
              onClick={() => { setActiveTab('dashboard'); setMobileMenuOpen(false); }}
              className={`w-full text-left px-4 py-3 rounded-xl text-xs font-semibold flex items-center justify-between nav-item-interactive group cursor-pointer ${
                activeTab === 'dashboard'
                  ? theme === 'dark'
                    ? 'bg-amber-500/10 text-amber-300 font-bold border border-amber-500/40 shadow-sm shadow-amber-500/15'
                    : 'bg-[#FFF9EE] text-amber-900 font-bold border border-amber-300 shadow-sm'
                  : theme === 'dark'
                    ? 'text-stone-400 hover:text-white hover:bg-stone-800/40'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-amber-50/70'
              }`}
            >
              <div className="flex items-center gap-3">
                <LayoutDashboard className={`w-4 h-4 nav-icon transition-all duration-200 ${activeTab === 'dashboard' ? 'text-amber-500' : 'text-stone-400 group-hover:text-amber-400'}`} />
                <span>Dashboard</span>
              </div>
            </button>

            <button
              onClick={() => handleStartCompose()}
              className={`w-full text-left px-4 py-3 rounded-xl text-xs font-semibold flex items-center justify-between nav-item-interactive group cursor-pointer ${
                activeTab === 'compose'
                  ? theme === 'dark'
                    ? 'bg-amber-500/10 text-amber-300 font-bold border border-amber-500/40 shadow-sm shadow-amber-500/15'
                    : 'bg-[#FFF9EE] text-amber-900 font-bold border border-amber-300 shadow-sm'
                  : theme === 'dark'
                    ? 'text-stone-400 hover:text-white hover:bg-stone-800/40'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-amber-50/70'
              }`}
            >
              <div className="flex items-center gap-3">
                <Send className={`w-4 h-4 nav-icon transition-all duration-200 ${activeTab === 'compose' ? 'text-amber-500' : 'text-stone-400 group-hover:text-amber-400'}`} />
                <span>Compose Email</span>
              </div>
            </button>

            <button
              onClick={() => { setActiveTab('history'); setMobileMenuOpen(false); }}
              className={`w-full text-left px-4 py-3 rounded-xl text-xs font-semibold flex items-center justify-between nav-item-interactive group cursor-pointer ${
                activeTab === 'history'
                  ? theme === 'dark'
                    ? 'bg-amber-500/10 text-amber-300 font-bold border border-amber-500/40 shadow-sm shadow-amber-500/15'
                    : 'bg-[#FFF9EE] text-amber-900 font-bold border border-amber-300 shadow-sm'
                  : theme === 'dark'
                    ? 'text-stone-400 hover:text-white hover:bg-stone-800/40'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-amber-50/70'
              }`}
            >
              <div className="flex items-center gap-3">
                <History className={`w-4 h-4 nav-icon transition-all duration-200 ${activeTab === 'history' ? 'text-amber-500' : 'text-stone-400 group-hover:text-amber-400'}`} />
                <span>Email History</span>
              </div>
            </button>

            <button
              onClick={() => { setActiveTab('contacts'); setMobileMenuOpen(false); }}
              className={`w-full text-left px-4 py-3 rounded-xl text-xs font-semibold flex items-center justify-between nav-item-interactive group cursor-pointer ${
                activeTab === 'contacts'
                  ? theme === 'dark'
                    ? 'bg-amber-500/10 text-amber-300 font-bold border border-amber-500/40 shadow-sm shadow-amber-500/15'
                    : 'bg-[#FFF9EE] text-amber-900 font-bold border border-amber-300 shadow-sm'
                  : theme === 'dark'
                    ? 'text-stone-400 hover:text-white hover:bg-stone-800/40'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-amber-50/70'
              }`}
            >
              <div className="flex items-center gap-3">
                <Users className={`w-4 h-4 nav-icon transition-all duration-200 ${activeTab === 'contacts' ? 'text-amber-500' : 'text-stone-400 group-hover:text-amber-400'}`} />
                <span>Contacts & Address Book</span>
              </div>
            </button>

            <button
              onClick={() => { setActiveTab('templates'); setMobileMenuOpen(false); }}
              className={`w-full text-left px-4 py-3 rounded-xl text-xs font-semibold flex items-center justify-between nav-item-interactive group cursor-pointer ${
                activeTab === 'templates'
                  ? theme === 'dark'
                    ? 'bg-amber-500/10 text-amber-300 font-bold border border-amber-500/40 shadow-sm shadow-amber-500/15'
                    : 'bg-[#FFF9EE] text-amber-900 font-bold border border-amber-300 shadow-sm'
                  : theme === 'dark'
                    ? 'text-stone-400 hover:text-white hover:bg-stone-800/40'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-amber-50/70'
              }`}
            >
              <div className="flex items-center gap-3">
                <Layout className={`w-4 h-4 nav-icon transition-all duration-200 ${activeTab === 'templates' ? 'text-amber-500' : 'text-stone-400 group-hover:text-amber-400'}`} />
                <span>Canned Templates</span>
              </div>
            </button>

            <button
              onClick={() => { setActiveTab('notifications'); setMobileMenuOpen(false); }}
              className={`w-full text-left px-4 py-3 rounded-xl text-xs font-semibold flex items-center justify-between nav-item-interactive group cursor-pointer ${
                activeTab === 'notifications'
                  ? theme === 'dark'
                    ? 'bg-amber-500/10 text-amber-300 font-bold border border-amber-500/40 shadow-sm shadow-amber-500/15'
                    : 'bg-[#FFF9EE] text-amber-900 font-bold border border-amber-300 shadow-sm'
                  : theme === 'dark'
                    ? 'text-stone-400 hover:text-white hover:bg-stone-800/40'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-amber-50/70'
              }`}
            >
              <div className="flex items-center gap-3">
                <Bell className={`w-4 h-4 nav-icon transition-all duration-200 ${activeTab === 'notifications' ? 'text-amber-500' : 'text-stone-400 group-hover:text-amber-400'}`} />
                <span>Notifications</span>
              </div>
              {unreadNotifCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-amber-500 text-stone-950 text-[10px] font-extrabold shadow-sm">
                  {unreadNotifCount}
                </span>
              )}
            </button>

            <button
              onClick={() => { setActiveTab('settings'); setMobileMenuOpen(false); }}
              className={`w-full text-left px-4 py-3 rounded-xl text-xs font-semibold flex items-center justify-between nav-item-interactive group cursor-pointer ${
                activeTab === 'settings'
                  ? theme === 'dark'
                    ? 'bg-amber-500/10 text-amber-300 font-bold border border-amber-500/40 shadow-sm shadow-amber-500/15'
                    : 'bg-[#FFF9EE] text-amber-900 font-bold border border-amber-300 shadow-sm'
                  : theme === 'dark'
                    ? 'text-stone-400 hover:text-white hover:bg-stone-800/40'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-amber-50/70'
              }`}
            >
              <div className="flex items-center gap-3">
                <Settings className={`w-4 h-4 nav-icon transition-all duration-200 ${activeTab === 'settings' ? 'text-amber-500' : 'text-stone-400 group-hover:text-amber-400'}`} />
                <span>Settings</span>
              </div>
            </button>

            <button
              onClick={() => { setActiveTab('trash'); setMobileMenuOpen(false); }}
              className={`w-full text-left px-4 py-3 rounded-xl text-xs font-semibold flex items-center justify-between nav-item-interactive group cursor-pointer ${
                activeTab === 'trash'
                  ? theme === 'dark'
                    ? 'bg-amber-500/10 text-amber-300 font-bold border border-amber-500/40 shadow-sm shadow-amber-500/15'
                    : 'bg-[#FFF9EE] text-amber-900 font-bold border border-amber-300 shadow-sm'
                  : theme === 'dark'
                    ? 'text-stone-400 hover:text-white hover:bg-stone-800/40'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-amber-50/70'
              }`}
            >
              <div className="flex items-center gap-3">
                <Trash2 className={`w-4 h-4 nav-icon transition-all duration-200 ${activeTab === 'trash' ? 'text-amber-500' : 'text-stone-400 group-hover:text-amber-400'}`} />
                <span>Trash</span>
              </div>
            </button>
          </nav>
        </div>

        {/* Sidebar Bottom: Upgrade to Premium Card (Matching Mockup) */}
        <div className="p-4 space-y-3">
          <div className={`p-4 rounded-2xl border relative overflow-hidden group ${
            theme === 'dark' 
              ? 'bg-gradient-to-b from-[#161822] to-[#0E1016] border-amber-500/20 shadow-xl' 
              : 'bg-gradient-to-b from-[#FFFDF8] to-[#FBF3DE] border-amber-300/80 shadow-md'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center text-stone-950 shadow-md shadow-amber-500/30">
                <Crown className="w-4 h-4" />
              </div>
              <h4 className={`text-xs font-extrabold ${theme === 'dark' ? 'text-white' : 'text-stone-900'}`}>
                Upgrade to Premium
              </h4>
            </div>
            
            <div className={`space-y-1 text-[11px] mb-3 leading-relaxed ${theme === 'dark' ? 'text-stone-400' : 'text-stone-600'}`}>
              <div className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" /> <span>Unlock advanced features</span></div>
              <div className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" /> <span>Higher email limits</span></div>
              <div className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" /> <span>AI personalization</span></div>
              <div className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" /> <span>Priority support</span></div>
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
        theme === 'dark' ? 'bg-[#08090C]' : 'bg-[#FAF8F5]'
      }`}>
        
        {/* Top Navigation Bar */}
        <header className={`sticky top-0 z-30 backdrop-blur-xl px-6 py-4 flex items-center justify-between shadow-sm transition-colors ${
          theme === 'dark'
            ? 'bg-[#0D0E12]/90 border-b border-[#1F222B]'
            : 'bg-white/90 border-b border-amber-900/10'
        }`}>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`p-2 rounded-xl md:hidden border transition-transform active:scale-95 cursor-pointer ${
                theme === 'dark' ? 'bg-stone-800/80 border-stone-700 text-stone-200' : 'bg-stone-100 border-stone-300 text-stone-800'
              }`}
            >
              <Menu className="w-5 h-5" />
            </button>

            <div>
              <h2 className={`text-xl font-extrabold tracking-tight flex items-center gap-2 ${
                theme === 'dark' ? 'text-white' : 'text-stone-900'
              }`}>
                <span>{getPageTitle()}</span>
                {activeTab === 'dashboard' && <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />}
              </h2>
              {activeTab === 'dashboard' && (
                <p className={`text-xs ${theme === 'dark' ? 'text-stone-400' : 'text-stone-600'}`}>
                  Welcome back, <span className="font-bold text-amber-500">{displayName}</span>! 👋
                </p>
              )}
            </div>
          </div>

          {/* Search bar in header (Matching Mockup with Interactive Glow) */}
          <div className="hidden lg:flex items-center flex-1 max-w-md mx-8">
            <div className={`w-full flex items-center gap-2.5 px-4 py-2 rounded-full border input-interactive group ${
              theme === 'dark' 
                ? 'bg-[#14161F] border-stone-800' 
                : 'bg-[#F5F2EB] border-amber-900/10'
            }`}>
              <Search className="w-4 h-4 text-stone-400 group-hover:text-amber-500 group-focus-within:text-amber-500 group-hover:scale-110 transition-all duration-200 shrink-0" />
              <input
                type="text"
                placeholder="Search emails, contacts, templates..."
                className={`w-full text-xs bg-transparent outline-none placeholder:text-stone-400 ${
                  theme === 'dark' ? 'text-white' : 'text-stone-900'
                }`}
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Live Gmail Connection Status Pill (Matching Screenshot) */}
            <div className={`hidden sm:inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all ${
              isGmailConnected
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-xs'
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-xs'
            }`}>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-xs shadow-emerald-400/50"></span>
              <span>Gmail Connected</span>
            </div>

            {/* Dark / Light Mode Toggle Button with Micro-Scale */}
            <button
              onClick={toggleTheme}
              className={`p-2 sm:px-3 sm:py-1.5 rounded-full border flex items-center gap-2 transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer shadow-xs ${
                theme === 'dark'
                  ? 'bg-stone-800/80 border-amber-500/30 text-amber-400 hover:bg-stone-700/80 hover:border-amber-500/50'
                  : 'bg-amber-100/70 border-amber-300 text-amber-800 hover:bg-amber-200/70'
              }`}
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-semibold text-stone-200 hidden sm:inline">Light</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-amber-700" />
                  <span className="text-xs font-semibold text-stone-800 hidden sm:inline">Dark</span>
                </>
              )}
            </button>

            {/* Notification Bell with Bell-Hover Shake Animation */}
            <button
              onClick={() => setActiveTab('notifications')}
              className={`relative p-2.5 rounded-xl border transition-all duration-200 bell-hover hover:scale-105 active:scale-95 cursor-pointer ${
                theme === 'dark'
                  ? 'bg-stone-800/80 hover:bg-stone-700/80 border-stone-700 hover:border-amber-500/40 text-stone-300'
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
                className={`flex items-center gap-2.5 p-1.5 pr-3 rounded-2xl border cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:border-amber-500/40 hover:shadow-md active:scale-[0.98] ${
                  theme === 'dark'
                    ? 'bg-stone-800/80 hover:bg-stone-700/80 border-stone-700'
                    : 'bg-white hover:bg-stone-50 border-amber-900/15 shadow-xs'
                }`}
              >
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-stone-950 font-extrabold text-xs flex items-center justify-center shadow-sm">
                  {displayName[0].toUpperCase()}
                </div>
                <div className="hidden sm:block text-left">
                  <span className={`text-xs font-bold block leading-tight ${
                    theme === 'dark' ? 'text-white' : 'text-stone-900'
                  }`}>
                    {displayName}
                  </span>
                  <span className="text-[10px] text-amber-500 font-semibold flex items-center gap-1">
                    👑 Premium Plan
                  </span>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-stone-400 transition-transform duration-200 ${userDropdownOpen ? 'rotate-180' : ''}`} />
              </div>

              {/* User Dropdown Menu */}
              {userDropdownOpen && (
                <div className={`absolute right-0 mt-2 w-56 rounded-2xl p-2 border shadow-2xl z-50 animate-fadeIn ${
                  theme === 'dark' ? 'bg-[#12141A] border-stone-700 text-white' : 'bg-white border-stone-200 text-stone-900'
                }`}>
                  <div className={`p-3 border-b mb-1 ${theme === 'dark' ? 'border-stone-800' : 'border-stone-100'}`}>
                    <p className="text-xs font-bold truncate">{displayName}</p>
                    <p className={`text-[11px] font-mono truncate ${theme === 'dark' ? 'text-stone-400' : 'text-stone-500'}`}>{currentUserEmail}</p>
                  </div>
                  <button
                    onClick={() => { setActiveTab('settings'); setUserDropdownOpen(false); }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium flex items-center gap-2 cursor-pointer transition-colors ${
                      theme === 'dark' ? 'text-stone-300 hover:text-white hover:bg-stone-800' : 'text-stone-700 hover:text-stone-900 hover:bg-stone-100'
                    }`}
                  >
                    <Settings className="w-4 h-4 text-stone-400" />
                    <span>Account Settings</span>
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-medium text-rose-500 hover:bg-rose-500/10 flex items-center gap-2 cursor-pointer mt-1 transition-colors"
                  >
                    <LogOut className="w-4 h-4 text-rose-500" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Global Toast Alert */}
        {toastMessage && (
          <div className="mx-6 mt-4 p-3.5 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-200 text-xs font-semibold shadow-lg flex items-center justify-between animate-fadeIn">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className={theme === 'dark' ? 'text-amber-200' : 'text-amber-900'}>{toastMessage}</span>
            </div>
            <button onClick={() => setToastMessage('')} className="text-stone-400 hover:text-white">
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
              onViewNotifications={() => setActiveTab('notifications')}
              onNavigateToSettings={() => setActiveTab('settings')}
              composeState={composeState}
              onUpdateComposeState={handleUpdateComposeState}
              theme={theme}
              toggleTheme={toggleTheme}
            />
          )}

          {activeTab === 'compose' && (
            <ComposeWorkflow
              composeState={composeState}
              onUpdateComposeState={handleUpdateComposeState}
              onResetCompose={handleResetCompose}
              initialData={composeInitialData}
              onComplete={() => setActiveTab('dashboard')}
              onCancel={() => {
                handleResetCompose();
                setActiveTab('dashboard');
              }}
              onNavigateToSettings={() => setActiveTab('settings')}
            />
          )}

          {activeTab === 'history' && (
            <EmailHistory />
          )}

          {activeTab === 'notifications' && (
            <NotificationCenter />
          )}

          {activeTab === 'contacts' && (
            <ContactsManager
              onQuickCompose={(contact) => {
                handleStartCompose({ recipient: contact.email });
              }}
            />
          )}

          {activeTab === 'templates' && (
            <TemplatesLibrary
              onSelectTemplate={(instruction) => {
                handleStartCompose({ instruction });
              }}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView />
          )}

          {activeTab === 'trash' && (
            <TrashView />
          )}
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-800/80 py-4 px-6 text-xs text-slate-500 bg-[#0B0F19]/50">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
            <span className="font-semibold text-slate-400">Scribe AI — Official Gmail Automation Platform</span>
            <span className="flex items-center gap-1.5 text-slate-400 font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> Security Pipeline: Instruction → AI Categorization → Gmail Preview → User Confirmation → Send
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}
