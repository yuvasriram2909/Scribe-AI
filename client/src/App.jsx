import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Mail, Bell, LayoutDashboard, History, Settings, 
  Send, ShieldCheck, PlusCircle, Menu, X, LogOut, User
} from 'lucide-react';

import { LoginPage } from './components/LoginPage';
import { Dashboard } from './components/Dashboard';
import { ComposeWorkflow } from './components/ComposeWorkflow';
import { EmailHistory } from './components/EmailHistory';
import { NotificationCenter } from './components/NotificationCenter';
import { SettingsView } from './components/SettingsView';
import { ContactsManager } from './components/ContactsManager';
import { TemplatesLibrary } from './components/TemplatesLibrary';
import { apiFetch } from './utils/api';
import { Users, Layout } from 'lucide-react';

export default function App() {
  const [currentUserEmail, setCurrentUserEmail] = useState(() => localStorage.getItem('userEmail') || '');
  const [currentUserName, setCurrentUserName] = useState(() => localStorage.getItem('userName') || '');

  const [activeTab, setActiveTab] = useState('dashboard');
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const [composeInitialData, setComposeInitialData] = useState({});
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (currentUserEmail) {
      fetchUnreadNotifs();
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

  const handleLoginSuccess = (user) => {
    setCurrentUserEmail(user.email);
    setCurrentUserName(user.name || user.email.split('@')[0]);
    setActiveTab('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userName');
    localStorage.removeItem('authToken');
    setCurrentUserEmail('');
    setCurrentUserName('');
    setUnreadNotifCount(0);
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
      default: return 'AI Smart Email Sender';
    }
  };

  // If no user is logged in, show the Login Page
  if (!currentUserEmail) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col md:flex-row font-sans selection:bg-indigo-500 selection:text-white">
      
      {/* ============================================================
          VERTICAL SIDEBAR NAVIGATION (Desktop & Mobile Drawer)
      ============================================================ */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 glass-panel border-r border-slate-800/80 flex flex-col justify-between transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:z-auto
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 space-y-6">
          {/* Brand Logo Header */}
          <div 
            className="flex items-center gap-3 cursor-pointer group" 
            onClick={() => { setActiveTab('dashboard'); setMobileMenuOpen(false); }}
          >
            <div className="w-10 h-10 rounded-xl gradient-btn flex items-center justify-center shadow-lg shadow-indigo-500/30 group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5 text-white animate-glow" />
            </div>
            <div>
              <h1 className="text-base font-extrabold text-white tracking-tight leading-tight flex items-center gap-1">
                AI Smart <span className="gradient-text">Sender</span>
              </h1>
              <p className="text-[10px] text-slate-400 font-medium truncate max-w-[120px]">
                {currentUserEmail}
              </p>
            </div>
          </div>

          {/* Quick Action Compose Button */}
          <button
            onClick={() => handleStartCompose()}
            className="w-full py-3 px-4 rounded-xl gradient-btn text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <PlusCircle className="w-4 h-4 text-indigo-200" />
            Compose New Email
          </button>

          {/* Streamlined Vertical Navigation Links */}
          <nav className="space-y-1 pt-2">
            <button
              onClick={() => { setActiveTab('dashboard'); setMobileMenuOpen(false); }}
              className={`w-full text-left px-4 py-3 rounded-xl text-xs font-semibold flex items-center justify-between transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 shadow-md shadow-indigo-600/10'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <LayoutDashboard className="w-4 h-4 text-indigo-400" />
                <span>Dashboard</span>
              </div>
            </button>

            <button
              onClick={() => handleStartCompose()}
              className={`w-full text-left px-4 py-3 rounded-xl text-xs font-semibold flex items-center justify-between transition-all ${
                activeTab === 'compose'
                  ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 shadow-md shadow-indigo-600/10'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <Send className="w-4 h-4 text-indigo-400" />
                <span>Compose Email</span>
              </div>
            </button>

            <button
              onClick={() => { setActiveTab('history'); setMobileMenuOpen(false); }}
              className={`w-full text-left px-4 py-3 rounded-xl text-xs font-semibold flex items-center justify-between transition-all ${
                activeTab === 'history'
                  ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 shadow-md shadow-indigo-600/10'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <History className="w-4 h-4 text-indigo-400" />
                <span>Email History</span>
              </div>
            </button>

            <button
              onClick={() => { setActiveTab('notifications'); setMobileMenuOpen(false); }}
              className={`w-full text-left px-4 py-3 rounded-xl text-xs font-semibold flex items-center justify-between transition-all ${
                activeTab === 'notifications'
                  ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 shadow-md shadow-indigo-600/10'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <Bell className="w-4 h-4 text-amber-400" />
                <span>Notifications</span>
              </div>
              {unreadNotifCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/40 text-[10px] font-bold">
                  {unreadNotifCount}
                </span>
              )}
            </button>

            <button
              onClick={() => { setActiveTab('contacts'); setMobileMenuOpen(false); }}
              className={`w-full text-left px-4 py-3 rounded-xl text-xs font-semibold flex items-center justify-between transition-all ${
                activeTab === 'contacts'
                  ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 shadow-md shadow-indigo-600/10'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <Users className="w-4 h-4 text-purple-400" />
                <span>Contacts & Address Book</span>
              </div>
            </button>

            <button
              onClick={() => { setActiveTab('templates'); setMobileMenuOpen(false); }}
              className={`w-full text-left px-4 py-3 rounded-xl text-xs font-semibold flex items-center justify-between transition-all ${
                activeTab === 'templates'
                  ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 shadow-md shadow-indigo-600/10'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <Layout className="w-4 h-4 text-emerald-400" />
                <span>Canned Templates</span>
              </div>
            </button>

            <button
              onClick={() => { setActiveTab('settings'); setMobileMenuOpen(false); }}
              className={`w-full text-left px-4 py-3 rounded-xl text-xs font-semibold flex items-center justify-between transition-all ${
                activeTab === 'settings'
                  ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 shadow-md shadow-indigo-600/10'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <Settings className="w-4 h-4 text-indigo-400" />
                <span>Settings</span>
              </div>
            </button>
          </nav>
        </div>

        {/* Sidebar Footer User Account & Logout */}
        <div className="p-4 m-4 rounded-xl glass-card border border-slate-800/80 space-y-3">
          <div className="flex items-center justify-between">
            <div className="min-w-0 pr-2">
              <span className="text-[11px] font-bold text-white block truncate">
                {currentUserName || 'User Account'}
              </span>
              <span className="text-[10px] text-slate-400 font-mono block truncate">
                {currentUserEmail}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0"
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
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
        ></div>
      )}

      {/* ============================================================
          MAIN RIGHT CONTENT AREA
      ============================================================ */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        
        {/* Header Bar */}
        <header className="sticky top-0 z-30 glass-panel border-b border-slate-800/80 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 md:hidden text-slate-300"
            >
              <Menu className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-bold text-white tracking-tight">
              {getPageTitle()}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400 font-mono hidden sm:inline-block">
              {currentUserEmail}
            </span>
            <button
              onClick={() => setActiveTab('notifications')}
              className="relative p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-colors"
              title="Notifications"
            >
              <Bell className="w-4 h-4 text-amber-400" />
              {unreadNotifCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center animate-pulse">
                  {unreadNotifCount}
                </span>
              )}
            </button>
          </div>
        </header>

        {/* View Content */}
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
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-800/80 py-4 px-6 text-xs text-slate-500">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>AI Smart Email Sender — Gmail Automation Platform</span>
            <span className="flex items-center gap-1.5 text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> Security Pipeline: Instruction → AI Categorization → Gmail Preview → User Confirmation → Send
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}
