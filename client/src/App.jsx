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
  Users, Layout, Trash2, CheckCircle, ChevronDown, Rocket, Crown, ExternalLink
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

export default function App() {
  const [currentUserEmail, setCurrentUserEmail] = useState(() => localStorage.getItem('userEmail') || '');
  const [currentUserName, setCurrentUserName] = useState(() => localStorage.getItem('userName') || '');

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

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('gmail') === 'connected' || params.get('auth') === 'success') {
      const emailParam = params.get('email');
      if (emailParam) {
        localStorage.setItem('userEmail', emailParam.toLowerCase().trim());
        setCurrentUserEmail(emailParam.toLowerCase().trim());
      }
      setActiveTab('dashboard');
      setToastMessage('✓ Gmail Connected Successfully!');
      window.history.replaceState({}, '', window.location.pathname);
      setTimeout(() => setToastMessage(''), 5000);
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
      const interval = setInterval(fetchUnreadNotifs, 10000);
      return () => clearInterval(interval);
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
      await apiFetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {}
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userName');
    localStorage.removeItem('authToken');
    setCurrentUserEmail('');
    setCurrentUserName('');
    setUnreadNotifCount(0);
    navigateTo('/');
  };

  const handleStartCompose = (data = {}) => {
    setComposeState(prev => ({
      ...prev,
      instruction: data.instruction !== undefined ? data.instruction : prev.instruction,
      recipient: data.recipient !== undefined ? data.recipient : prev.recipient,
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
      case 'history': return 'Sent Email History';
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
    <div className="min-h-screen bg-[#080C14] text-slate-100 flex flex-col md:flex-row font-sans selection:bg-purple-600 selection:text-white relative overflow-x-hidden">
      
      {/* Subtle Ambient Cosmic Glows */}
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none -z-10 animate-pulseGlow" />
      <div className="fixed bottom-10 right-10 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* ============================================================
          VERTICAL SIDEBAR NAVIGATION (Dark Neon Glass Theme)
      ============================================================ */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-[#0B0F19]/90 backdrop-blur-xl border-r border-slate-800/80 flex flex-col justify-between transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:z-auto shadow-2xl
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-5 space-y-6 overflow-y-auto">
          {/* Brand Logo Header */}
          <div 
            className="flex items-center gap-3 cursor-pointer group px-2" 
            onClick={() => { setActiveTab('dashboard'); setMobileMenuOpen(false); }}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-500 to-cyan-400 p-[1px] shadow-lg shadow-purple-500/20 group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-[#0D121F] rounded-[11px] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-cyan-300 animate-pulse" />
              </div>
            </div>
            <div>
              <h1 className="text-base font-extrabold text-white tracking-tight leading-tight flex items-center gap-1.5">
                AI Smart <span className="bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">Sender</span>
              </h1>
              <p className="text-[11px] text-slate-400 font-medium truncate">
                AI-Powered Email Assistant
              </p>
            </div>
          </div>

          {/* Glowing Compose Button */}
          <button
            onClick={() => handleStartCompose()}
            className="w-full py-3 px-4 rounded-xl gradient-btn font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-purple-600/30 hover:shadow-purple-600/50 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer border border-purple-400/30"
          >
            <PlusCircle className="w-4 h-4 text-pink-200" />
            <span>Compose New Email</span>
          </button>

          {/* Vertical Navigation Links */}
          <nav className="space-y-1.5 pt-1">
            
            <button
              onClick={() => { setActiveTab('dashboard'); setMobileMenuOpen(false); }}
              className={`w-full text-left px-4 py-3 rounded-xl text-xs font-semibold flex items-center justify-between transition-all duration-200 cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-gradient-to-r from-purple-900/50 to-indigo-900/40 text-purple-200 font-bold border border-purple-500/40 shadow-lg shadow-purple-900/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <LayoutDashboard className={`w-4 h-4 ${activeTab === 'dashboard' ? 'text-purple-400' : 'text-slate-400'}`} />
                <span>Dashboard</span>
              </div>
            </button>

            <button
              onClick={() => handleStartCompose()}
              className={`w-full text-left px-4 py-3 rounded-xl text-xs font-semibold flex items-center justify-between transition-all duration-200 cursor-pointer ${
                activeTab === 'compose'
                  ? 'bg-gradient-to-r from-purple-900/50 to-indigo-900/40 text-purple-200 font-bold border border-purple-500/40 shadow-lg shadow-purple-900/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <Send className={`w-4 h-4 ${activeTab === 'compose' ? 'text-purple-400' : 'text-slate-400'}`} />
                <span>Compose Email</span>
              </div>
            </button>

            <button
              onClick={() => { setActiveTab('history'); setMobileMenuOpen(false); }}
              className={`w-full text-left px-4 py-3 rounded-xl text-xs font-semibold flex items-center justify-between transition-all duration-200 cursor-pointer ${
                activeTab === 'history'
                  ? 'bg-gradient-to-r from-purple-900/50 to-indigo-900/40 text-purple-200 font-bold border border-purple-500/40 shadow-lg shadow-purple-900/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <History className={`w-4 h-4 ${activeTab === 'history' ? 'text-purple-400' : 'text-slate-400'}`} />
                <span>Email History</span>
              </div>
            </button>

            <button
              onClick={() => { setActiveTab('contacts'); setMobileMenuOpen(false); }}
              className={`w-full text-left px-4 py-3 rounded-xl text-xs font-semibold flex items-center justify-between transition-all duration-200 cursor-pointer ${
                activeTab === 'contacts'
                  ? 'bg-gradient-to-r from-purple-900/50 to-indigo-900/40 text-purple-200 font-bold border border-purple-500/40 shadow-lg shadow-purple-900/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <Users className={`w-4 h-4 ${activeTab === 'contacts' ? 'text-purple-400' : 'text-slate-400'}`} />
                <span>Contacts & Address Book</span>
              </div>
            </button>

            <button
              onClick={() => { setActiveTab('templates'); setMobileMenuOpen(false); }}
              className={`w-full text-left px-4 py-3 rounded-xl text-xs font-semibold flex items-center justify-between transition-all duration-200 cursor-pointer ${
                activeTab === 'templates'
                  ? 'bg-gradient-to-r from-purple-900/50 to-indigo-900/40 text-purple-200 font-bold border border-purple-500/40 shadow-lg shadow-purple-900/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <Layout className={`w-4 h-4 ${activeTab === 'templates' ? 'text-purple-400' : 'text-slate-400'}`} />
                <span>Canned Templates</span>
              </div>
            </button>

            <button
              onClick={() => { setActiveTab('notifications'); setMobileMenuOpen(false); }}
              className={`w-full text-left px-4 py-3 rounded-xl text-xs font-semibold flex items-center justify-between transition-all duration-200 cursor-pointer ${
                activeTab === 'notifications'
                  ? 'bg-gradient-to-r from-purple-900/50 to-indigo-900/40 text-purple-200 font-bold border border-purple-500/40 shadow-lg shadow-purple-900/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <Bell className={`w-4 h-4 ${activeTab === 'notifications' ? 'text-purple-400' : 'text-slate-400'}`} />
                <span>Notifications</span>
              </div>
              {unreadNotifCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-pink-500 text-white text-[10px] font-extrabold shadow-sm shadow-pink-500/40">
                  {unreadNotifCount}
                </span>
              )}
            </button>

            <button
              onClick={() => { setActiveTab('settings'); setMobileMenuOpen(false); }}
              className={`w-full text-left px-4 py-3 rounded-xl text-xs font-semibold flex items-center justify-between transition-all duration-200 cursor-pointer ${
                activeTab === 'settings'
                  ? 'bg-gradient-to-r from-purple-900/50 to-indigo-900/40 text-purple-200 font-bold border border-purple-500/40 shadow-lg shadow-purple-900/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <Settings className={`w-4 h-4 ${activeTab === 'settings' ? 'text-purple-400' : 'text-slate-400'}`} />
                <span>Settings</span>
              </div>
            </button>

            <button
              onClick={() => { setActiveTab('trash'); setMobileMenuOpen(false); }}
              className={`w-full text-left px-4 py-3 rounded-xl text-xs font-semibold flex items-center justify-between transition-all duration-200 cursor-pointer ${
                activeTab === 'trash'
                  ? 'bg-gradient-to-r from-purple-900/50 to-indigo-900/40 text-purple-200 font-bold border border-purple-500/40 shadow-lg shadow-purple-900/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <Trash2 className={`w-4 h-4 ${activeTab === 'trash' ? 'text-purple-400' : 'text-slate-400'}`} />
                <span>Trash</span>
              </div>
            </button>
          </nav>
        </div>

        {/* Sidebar Bottom: Rocket Productivity Promo Card */}
        <div className="p-4 space-y-3">
          <div className="p-4 rounded-2xl bg-gradient-to-b from-[#161B2E] to-[#0E1322] border border-purple-500/20 shadow-xl relative overflow-hidden group">
            <div className="absolute -top-6 -right-6 w-20 h-20 bg-purple-500/10 rounded-full blur-xl group-hover:bg-purple-500/20 transition-all"></div>
            
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-purple-500/30">
                <Rocket className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-extrabold text-white">Supercharge Your Productivity</h4>
            </div>
            
            <p className="text-[11px] text-slate-400 mb-3 leading-relaxed">
              Let AI handle your emails while you focus on what matters.
            </p>

            <button
              onClick={() => setActiveTab('settings')}
              className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold text-[11px] flex items-center justify-center gap-1.5 shadow-md shadow-purple-600/30 hover:shadow-purple-600/50 transition-all cursor-pointer"
            >
              <Crown className="w-3.5 h-3.5 text-amber-300" />
              <span>Explore Premium</span>
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
          MAIN RIGHT CONTENT AREA (Cosmic Dark Glass Layout)
      ============================================================ */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen bg-[#080C14]">
        
        {/* Top Navigation Bar */}
        <header className="sticky top-0 z-30 bg-[#0B0F19]/80 backdrop-blur-xl border-b border-slate-800/80 px-6 py-4 flex items-center justify-between shadow-xl">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl bg-slate-800/80 border border-slate-700 md:hidden text-slate-200"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div>
              <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
                <span>{getPageTitle()}</span>
                {activeTab === 'dashboard' && <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />}
              </h2>
              {activeTab === 'dashboard' && (
                <p className="text-xs text-slate-400">
                  Welcome back, <span className="font-semibold text-slate-200">{displayName}</span>! 👋
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Connected Gmail Status Badge */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-[11px] font-bold text-emerald-400 shadow-sm shadow-emerald-900/20">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>{isGmailConnected ? '● Gmail Connected' : '● Gmail OAuth Active'}</span>
            </div>

            {/* Notification Bell */}
            <button
              onClick={() => setActiveTab('notifications')}
              className="relative p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/80 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Notifications"
            >
              <Bell className="w-4.5 h-4.5" />
              {unreadNotifCount > 0 && (
                <span className="absolute -top-1 -right-1 px-1.5 py-0.5 rounded-full bg-pink-500 text-white text-[9px] font-extrabold shadow-sm shadow-pink-500/40">
                  {unreadNotifCount}
                </span>
              )}
            </button>

            {/* User Profile Pill & Dropdown */}
            <div className="relative">
              <div 
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2.5 p-1.5 pr-3 rounded-2xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/80 cursor-pointer transition-all"
              >
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-purple-600 text-white font-extrabold text-xs flex items-center justify-center shadow-md shadow-purple-600/30">
                  {displayName[0].toUpperCase()}
                </div>
                <div className="hidden sm:block text-left">
                  <span className="text-xs font-bold text-white block leading-tight">
                    {displayName}
                  </span>
                  <span className="text-[10px] text-amber-400 font-semibold flex items-center gap-1">
                    👑 Premium Plan
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </div>

              {/* User Dropdown Menu */}
              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 glass-panel rounded-2xl p-2 border border-slate-700 shadow-2xl z-50 animate-fadeIn">
                  <div className="p-3 border-b border-slate-800 mb-1">
                    <p className="text-xs font-bold text-white truncate">{displayName}</p>
                    <p className="text-[11px] text-slate-400 font-mono truncate">{currentUserEmail}</p>
                  </div>
                  <button
                    onClick={() => { setActiveTab('settings'); setUserDropdownOpen(false); }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/70 flex items-center gap-2 cursor-pointer"
                  >
                    <Settings className="w-4 h-4 text-slate-400" />
                    <span>Account Settings</span>
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-medium text-rose-400 hover:bg-rose-500/10 flex items-center gap-2 cursor-pointer mt-1"
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
          <div className="mx-6 mt-4 p-3.5 rounded-2xl bg-purple-900/60 border border-purple-500/40 text-purple-200 text-xs font-semibold shadow-lg shadow-purple-950/50 flex items-center justify-between animate-fadeIn">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-300" />
              <span>{toastMessage}</span>
            </div>
            <button onClick={() => setToastMessage('')} className="text-slate-400 hover:text-white">
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
