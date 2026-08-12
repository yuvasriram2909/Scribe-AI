import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Mail, Bell, LayoutDashboard, History, Settings, 
  Send, ShieldCheck, PlusCircle, Menu, X, LogOut, User,
  Users, Layout, Trash2, CheckCircle
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

  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('gmail') === 'connected' || params.get('auth') === 'success') {
      setActiveTab('dashboard');
      setToastMessage('✓ Gmail Connected Successfully!');
      window.history.replaceState({}, '', window.location.pathname);
      setTimeout(() => setToastMessage(''), 5000);
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
        setUnreadNotifCount(data.unreadCount || 0);
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
      }
    } catch (err) {
      console.error('Failed to check auth status:', err);
    }
  };

  const handleLoginSuccess = (user) => {
    setCurrentUserEmail(user.email);
    setCurrentUserName(user.name || user.email.split('@')[0]);
    navigateTo('/app');
    setActiveTab('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userName');
    localStorage.removeItem('authToken');
    setCurrentUserEmail('');
    setCurrentUserName('');
    setUnreadNotifCount(0);
    navigateTo('/');
  };

  const handleStartCompose = (data = {}) => {
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
      case 'contacts': return 'Address Book & Contacts Manager';
      case 'templates': return 'Canned Email Templates';
      case 'settings': return 'Settings & Account Authorization';
      case 'trash': return 'Deleted Emails (Trash)';
      default: return 'Scribe AI';
    }
  };

  // Public Routes (Accessible without login)
  if (currentRoute === '/privacy') {
    return <PrivacyPolicy onBackToHome={() => navigateTo('/')} onNavigateToTerms={() => navigateTo('/terms')} />;
  }

  if (currentRoute === '/terms') {
    return <TermsOfService onBackToHome={() => navigateTo('/')} onNavigateToPrivacy={() => navigateTo('/privacy')} />;
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

  return (
    <div className="min-h-screen bg-[#F7F4EA] text-[#28321D] flex flex-col md:flex-row font-sans selection:bg-[#667A45] selection:text-white">
      
      {/* ============================================================
          VERTICAL SIDEBAR NAVIGATION (Deep Olive / Dark Olive Theme)
      ============================================================ */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-[#28321D] border-r border-[#3F4D2A] flex flex-col justify-between transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:z-auto
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 space-y-6">
          {/* Brand Logo Header */}
          <div 
            className="flex items-center gap-3 cursor-pointer group" 
            onClick={() => { setActiveTab('dashboard'); setMobileMenuOpen(false); }}
          >
            <div className="w-10 h-10 rounded-xl bg-[#667A45] flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5 text-[#FAF8F1]" />
            </div>
            <div>
              <h1 className="text-base font-extrabold text-[#FAF8F1] tracking-tight leading-tight flex items-center gap-1">
                AI Smart <span className="text-[#879B62]">Sender</span>
              </h1>
              <p className="text-[10px] text-[#E8DFC8] font-medium truncate max-w-[130px]">
                AI-Powered Email Assistant
              </p>
            </div>
          </div>

          {/* Quick Action Compose Button */}
          <button
            onClick={() => handleStartCompose()}
            className="w-full py-3 px-4 rounded-xl bg-[#667A45] hover:bg-[#3F4D2A] text-[#FAF8F1] font-bold text-xs flex items-center justify-center gap-2 shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer border border-[#879B62]/40"
          >
            <PlusCircle className="w-4 h-4 text-[#E8DFC8]" />
            Compose New Email
          </button>

          {/* Vertical Navigation Links */}
          <nav className="space-y-1 pt-1">
            
            <button
              onClick={() => { setActiveTab('dashboard'); setMobileMenuOpen(false); }}
              className={`w-full text-left px-4 py-3 rounded-xl text-xs font-semibold flex items-center justify-between transition-all duration-200 cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-[#667A45] text-[#FAF8F1] font-bold shadow-md border-l-4 border-[#B99A5B]'
                  : 'text-[#E8DFC8] hover:text-white hover:bg-[#3F4D2A]'
              }`}
            >
              <div className="flex items-center gap-3">
                <LayoutDashboard className={`w-4 h-4 ${activeTab === 'dashboard' ? 'text-[#FAF8F1]' : 'text-[#879B62]'}`} />
                <span>✦ Dashboard</span>
              </div>
            </button>

            <button
              onClick={() => handleStartCompose()}
              className={`w-full text-left px-4 py-3 rounded-xl text-xs font-semibold flex items-center justify-between transition-all duration-200 cursor-pointer ${
                activeTab === 'compose'
                  ? 'bg-[#667A45] text-[#FAF8F1] font-bold shadow-md border-l-4 border-[#B99A5B]'
                  : 'text-[#E8DFC8] hover:text-white hover:bg-[#3F4D2A]'
              }`}
            >
              <div className="flex items-center gap-3">
                <Send className={`w-4 h-4 ${activeTab === 'compose' ? 'text-[#FAF8F1]' : 'text-[#879B62]'}`} />
                <span>✈ Compose Email</span>
              </div>
            </button>

            <button
              onClick={() => { setActiveTab('history'); setMobileMenuOpen(false); }}
              className={`w-full text-left px-4 py-3 rounded-xl text-xs font-semibold flex items-center justify-between transition-all duration-200 cursor-pointer ${
                activeTab === 'history'
                  ? 'bg-[#667A45] text-[#FAF8F1] font-bold shadow-md border-l-4 border-[#B99A5B]'
                  : 'text-[#E8DFC8] hover:text-white hover:bg-[#3F4D2A]'
              }`}
            >
              <div className="flex items-center gap-3">
                <History className={`w-4 h-4 ${activeTab === 'history' ? 'text-[#FAF8F1]' : 'text-[#879B62]'}`} />
                <span>◷ Email History</span>
              </div>
            </button>

            <button
              onClick={() => { setActiveTab('notifications'); setMobileMenuOpen(false); }}
              className={`w-full text-left px-4 py-3 rounded-xl text-xs font-semibold flex items-center justify-between transition-all duration-200 cursor-pointer ${
                activeTab === 'notifications'
                  ? 'bg-[#667A45] text-[#FAF8F1] font-bold shadow-md border-l-4 border-[#B99A5B]'
                  : 'text-[#E8DFC8] hover:text-white hover:bg-[#3F4D2A]'
              }`}
            >
              <div className="flex items-center gap-3">
                <Bell className={`w-4 h-4 ${activeTab === 'notifications' ? 'text-[#FAF8F1]' : 'text-[#B99A5B]'}`} />
                <span>🔔 Notifications</span>
              </div>
              {unreadNotifCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-[#B99A5B] text-[#28321D] text-[10px] font-extrabold shadow-sm">
                  {unreadNotifCount}
                </span>
              )}
            </button>

            <button
              onClick={() => { setActiveTab('contacts'); setMobileMenuOpen(false); }}
              className={`w-full text-left px-4 py-3 rounded-xl text-xs font-semibold flex items-center justify-between transition-all duration-200 cursor-pointer ${
                activeTab === 'contacts'
                  ? 'bg-[#667A45] text-[#FAF8F1] font-bold shadow-md border-l-4 border-[#B99A5B]'
                  : 'text-[#E8DFC8] hover:text-white hover:bg-[#3F4D2A]'
              }`}
            >
              <div className="flex items-center gap-3">
                <Users className={`w-4 h-4 ${activeTab === 'contacts' ? 'text-[#FAF8F1]' : 'text-[#879B62]'}`} />
                <span>👥 Contacts & Address Book</span>
              </div>
            </button>

            <button
              onClick={() => { setActiveTab('templates'); setMobileMenuOpen(false); }}
              className={`w-full text-left px-4 py-3 rounded-xl text-xs font-semibold flex items-center justify-between transition-all duration-200 cursor-pointer ${
                activeTab === 'templates'
                  ? 'bg-[#667A45] text-[#FAF8F1] font-bold shadow-md border-l-4 border-[#B99A5B]'
                  : 'text-[#E8DFC8] hover:text-white hover:bg-[#3F4D2A]'
              }`}
            >
              <div className="flex items-center gap-3">
                <Layout className={`w-4 h-4 ${activeTab === 'templates' ? 'text-[#FAF8F1]' : 'text-[#879B62]'}`} />
                <span>▣ Canned Templates</span>
              </div>
            </button>

            <button
              onClick={() => { setActiveTab('settings'); setMobileMenuOpen(false); }}
              className={`w-full text-left px-4 py-3 rounded-xl text-xs font-semibold flex items-center justify-between transition-all duration-200 cursor-pointer ${
                activeTab === 'settings'
                  ? 'bg-[#667A45] text-[#FAF8F1] font-bold shadow-md border-l-4 border-[#B99A5B]'
                  : 'text-[#E8DFC8] hover:text-white hover:bg-[#3F4D2A]'
              }`}
            >
              <div className="flex items-center gap-3">
                <Settings className={`w-4 h-4 ${activeTab === 'settings' ? 'text-[#FAF8F1]' : 'text-[#879B62]'}`} />
                <span>⚙ Settings</span>
              </div>
            </button>

            <button
              onClick={() => { setActiveTab('trash'); setMobileMenuOpen(false); }}
              className={`w-full text-left px-4 py-3 rounded-xl text-xs font-semibold flex items-center justify-between transition-all duration-200 cursor-pointer ${
                activeTab === 'trash'
                  ? 'bg-[#667A45] text-[#FAF8F1] font-bold shadow-md border-l-4 border-[#B99A5B]'
                  : 'text-[#E8DFC8] hover:text-white hover:bg-[#3F4D2A]'
              }`}
            >
              <div className="flex items-center gap-3">
                <Trash2 className={`w-4 h-4 ${activeTab === 'trash' ? 'text-[#FAF8F1]' : 'text-[#879B62]'}`} />
                <span>🗑 Trash</span>
              </div>
            </button>
          </nav>
        </div>

        {/* Sidebar Bottom: User Profile Card */}
        <div className="p-4 m-4 rounded-2xl bg-[#3F4D2A] border border-[#879B62]/30 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0 pr-2">
              <div className="w-8 h-8 rounded-full bg-[#667A45] text-[#FAF8F1] font-extrabold text-xs flex items-center justify-center shrink-0 border border-[#879B62]/40">
                {(currentUserName || currentUserEmail)[0].toUpperCase()}
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold text-[#FAF8F1] block truncate">
                  {currentUserName || 'User Account'}
                </span>
                <span className="text-[10px] text-[#E8DFC8] font-mono block truncate">
                  {currentUserEmail}
                </span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg text-[#E8DFC8] hover:text-white hover:bg-[#28321D] transition-colors shrink-0 cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-40 bg-[#28321D]/60 backdrop-blur-sm md:hidden"
        ></div>
      )}

      {/* ============================================================
          MAIN RIGHT CONTENT AREA (Beige / Cream Theme)
      ============================================================ */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen bg-[#F7F4EA]">
        
        {/* Top Navigation Bar */}
        <header className="sticky top-0 z-30 bg-[#FAF8F1] border-b border-[#D8D1BC] px-6 py-4 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl bg-[#F2EBDD] border border-[#D8D1BC] md:hidden text-[#28321D]"
            >
              <Menu className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-extrabold text-[#28321D] tracking-tight">
              {getPageTitle()}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            {/* Connected Gmail Status Badge */}
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#E6F4EA] border border-[#A8DADC] text-[11px] font-bold text-[#137333]">
              <span className="w-2 h-2 rounded-full bg-[#667A45] animate-pulse"></span>
              <span>{isGmailConnected ? 'Gmail Connected' : 'Gmail OAuth Active'}</span>
            </div>

            <button
              onClick={() => setActiveTab('notifications')}
              className="relative p-2.5 rounded-xl bg-[#F2EBDD] border border-[#D8D1BC] text-[#28321D] hover:bg-[#E8DFC8] transition-colors cursor-pointer"
              title="Notifications"
            >
              <Bell className="w-4.5 h-4.5 text-[#667A45]" />
              {unreadNotifCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4.5 h-4.5 rounded-full bg-[#B99A5B] text-[#28321D] text-[9px] font-extrabold flex items-center justify-center shadow-xs">
                  {unreadNotifCount}
                </span>
              )}
            </button>

            <div 
              onClick={() => setActiveTab('settings')}
              className="w-9 h-9 rounded-full bg-[#667A45] text-[#FAF8F1] font-bold text-xs flex items-center justify-center border border-[#879B62] cursor-pointer shadow-xs"
              title="User Settings"
            >
              {(currentUserName || currentUserEmail)[0].toUpperCase()}
            </div>
          </div>
        </header>

        {/* View Content Container */}
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
          {activeTab === 'dashboard' && (
            <Dashboard
              onStartCompose={handleStartCompose}
              onViewHistory={() => setActiveTab('history')}
              onViewNotifications={() => setActiveTab('notifications')}
            />
          )}

          {activeTab === 'compose' && (
            <ComposeWorkflow
              initialData={composeInitialData}
              onComplete={() => setActiveTab('dashboard')}
              onCancel={() => setActiveTab('dashboard')}
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
                setComposeInitialData({ recipient: contact.email });
                setActiveTab('compose');
              }}
            />
          )}

          {activeTab === 'templates' && (
            <TemplatesLibrary
              onSelectTemplate={(instruction) => {
                setComposeInitialData({ instruction });
                setActiveTab('compose');
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
        <footer className="border-t border-[#D8D1BC] py-4 px-6 text-xs text-[#6F725F] bg-[#FAF8F1]">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
            <span className="font-semibold">Scribe AI — Official Gmail Automation Platform</span>
            <span className="flex items-center gap-1.5 text-[#3F4D2A] font-medium">
              <ShieldCheck className="w-4 h-4 text-[#667A45]" /> Security Pipeline: Instruction → AI Categorization → Gmail Preview → User Confirmation → Send
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}
