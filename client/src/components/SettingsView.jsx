import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Shield, 
  CheckCircle, 
  ExternalLink, 
  Server, 
  RefreshCw, 
  AlertCircle, 
  UserCheck, 
  Save, 
  Copy,
  Mail,
  Lock,
  Sparkles,
  Sun,
  Moon
} from 'lucide-react';
import { apiFetch, safeParseResponse, getApiBaseUrl, setCustomBackendUrl, DEFAULT_SUPABASE_EDGE_FUNCTION } from '../utils/api';
import { signInWithGoogle } from '../utils/supabaseClient';

export function SettingsView() {
  // Gmail OAuth status
  const [authStatus, setAuthStatus] = useState({
    isConnected: false,
    status: 'DISCONNECTED',
    connectedEmail: null,
    isGoogleConfigured: true,
    mode: 'Checking connection...'
  });
  const [connectingGoogle, setConnectingGoogle] = useState(false);
  const [authError, setAuthError] = useState('');

  // Backend API URL State
  const [activeApiBase, setActiveApiBase] = useState(getApiBaseUrl());
  const [backendUrlInput, setBackendUrlInput] = useState(getApiBaseUrl());
  const [testingBackend, setTestingBackend] = useState(false);
  const [backendStatus, setBackendStatus] = useState({ tested: false, success: false, message: '' });

  // Signature Settings State
  const [signature, setSignature] = useState({
    name: localStorage.getItem('userName') || '',
    designation: '',
    company: '',
    phone: '',
    website: '',
    preferredTone: 'Professional',
    enabled: true
  });
  const [savingSig, setSavingSig] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const currentTheme = 'dark';

  useEffect(() => {
    document.documentElement.classList.add('dark');
    document.documentElement.classList.remove('light');
    localStorage.setItem('scribe_theme', 'dark');
  }, []);

  const dynamicRedirectUri = `${activeApiBase.replace(/\/+$/, '')}/auth/google/callback`;

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      // 1. Fetch OAuth status
      const authRes = await apiFetch('/api/auth/status');
      const authData = await safeParseResponse(authRes);
      if (authData) {
        setAuthStatus({
          isConnected: !!authData.isConnected,
          status: authData.status || (authData.isConnected ? 'CONNECTED' : 'DISCONNECTED'),
          connectedEmail: authData.connectedEmail || null,
          isGoogleConfigured: true,
          mode: authData.isConnected ? 'Gmail OAuth Active' : 'Not Connected'
        });
      }

      // 2. Fetch User Signature
      const sigRes = await apiFetch('/api/settings/signature');
      const sigData = await safeParseResponse(sigRes);
      if (sigData && sigData.name) {
        setSignature({
          name: sigData.name || '',
          designation: sigData.designation || '',
          company: sigData.company || '',
          phone: sigData.phone || '',
          website: sigData.website || '',
          preferredTone: sigData.preferredTone || 'Professional',
          enabled: sigData.enabled !== undefined ? !!sigData.enabled : true
        });
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    }
  };

  const handleDisconnect = async () => {
    if (!window.confirm('Are you sure you want to disconnect your Google account?')) return;
    try {
      const res = await apiFetch('/api/auth/google/disconnect', { method: 'POST' });
      const data = await safeParseResponse(res);
      if (data.success) {
        setAuthStatus({
          isConnected: false,
          status: 'DISCONNECTED',
          connectedEmail: null,
          isGoogleConfigured: true,
          mode: 'Not Connected'
        });
        fetchSettings();
      } else {
        alert(data.error || 'Failed to disconnect account.');
      }
    } catch (err) {
      alert('Error disconnecting: ' + err.message);
    }
  };

  const handleConnectClick = async () => {
    setConnectingGoogle(true);
    setAuthError('');
    try {
      const res = await apiFetch('/api/auth/google/start');
      const data = await safeParseResponse(res);
      if (data && data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data?.error || 'Google OAuth is not configured in backend environment.');
      }
    } catch (err) {
      console.error('OAuth start error:', err);
      setAuthError(err.message || 'Failed to initiate Google OAuth. Please ensure GOOGLE_CLIENT_ID is set in Supabase Secrets.');
      setConnectingGoogle(false);
    }
  };

  const handleSaveBackendUrl = (e) => {
    e.preventDefault();
    setCustomBackendUrl(backendUrlInput);
    setActiveApiBase(getApiBaseUrl());
    setBackendStatus({
      tested: true,
      success: true,
      message: 'Backend URL updated in local configuration.'
    });
    fetchSettings();
  };

  const handleTestBackend = async () => {
    setTestingBackend(true);
    setBackendStatus({ tested: false, success: false, message: '' });
    try {
      const res = await apiFetch('/api/health');
      const data = await safeParseResponse(res);
      if (res.ok && data.status === 'online') {
        setBackendStatus({
          tested: true,
          success: true,
          message: `Connection successful! Supabase Edge Function is active (${data.service || 'Online'}).`
        });
      } else {
        setBackendStatus({
          tested: true,
          success: false,
          message: `Endpoint responded with status ${res.status}.`
        });
      }
    } catch (err) {
      setBackendStatus({
        tested: true,
        success: false,
        message: err.message || 'Unable to reach backend endpoint.'
      });
    } finally {
      setTestingBackend(false);
    }
  };

  const handleSaveSignature = async (e) => {
    e.preventDefault();
    setSavingSig(true);
    try {
      const res = await apiFetch('/api/settings/signature', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(signature)
      });
      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      alert('Failed to save signature: ' + err.message);
    } finally {
      setSavingSig(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
      <div className="glass-panel p-6 rounded-3xl border border-[#2E2D2B] bg-[#1A1918] shadow-xl">
        <h2 className="text-xl font-extrabold text-[#F5F3EF] flex items-center gap-2">
          <Settings className="w-5 h-5 text-[#D4A373]" />
          Settings & Account Authorization
        </h2>
        <p className="text-xs text-[#99958F] mt-1">Configure Gmail sender authorization, theme appearance, backend endpoint, and email signature defaults</p>
      </div>

      {/* 0. Appearance & Theme Selection Card */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-[#2E2D2B] bg-[#1A1918] shadow-xl space-y-4">
        <div className="flex items-start justify-between border-b border-[#2E2D2B] pb-4">
          <div>
            <h3 className="text-base font-extrabold text-[#F5F3EF] flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#D4A373]" />
              Warm Cashmere & Charcoal Palette
            </h3>
            <p className="text-xs text-[#99958F] mt-1">
              Editorial Minimalist design permanently locked to Dark Mode with rich soot and muted almond accents
            </p>
          </div>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#22211F] text-[#D4A373] border border-[#2E2D2B]">
            Locked Dark Mode ✓
          </span>
        </div>
      </div>

      {/* 1. Official Google OAuth 2.0 Authorization Card */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-[#2E2D2B] bg-[#1A1918] shadow-xl space-y-6">
        <div className="flex items-start justify-between border-b border-[#2E2D2B] pb-4">
          <div>
            <h3 className="text-base font-extrabold text-[#F5F3EF] flex items-center gap-2">
              <Shield className="w-5 h-5 text-[#D4A373]" />
              Official Google OAuth 2.0 Gmail Authorization
            </h3>
            <p className="text-xs text-[#99958F] mt-1">
              Authorize Scribe AI to send emails directly via Google OAuth 2.0 Gmail REST API
            </p>
          </div>
          <span className={`text-xs font-bold px-3 py-1 rounded-full ${
            authStatus.isConnected
              ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40'
              : 'bg-[#22211F] text-[#D4A373] border border-[#2E2D2B]'
          }`}>
            {authStatus.isConnected ? 'Gmail OAuth Active ✓' : 'Not Connected'}
          </span>
        </div>

        {authError && (
          <div className="p-3.5 rounded-2xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs font-bold animate-fadeIn">
            {authError}
          </div>
        )}

        {authStatus.isConnected ? (
          <div className="p-5 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                <span className="text-xs font-bold text-[#F5F3EF]">
                  Connected account: <span className="text-emerald-300 font-mono">{authStatus.connectedEmail}</span>
                </span>
              </div>
              <button
                onClick={handleDisconnect}
                className="px-4 py-2 rounded-xl bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 text-xs font-bold border border-rose-500/30 transition-all cursor-pointer shadow-sm"
              >
                Disconnect Google
              </button>
            </div>
            <p className="text-xs text-[#99958F]">
              All AI-generated emails are dispatched directly from your authenticated Gmail address (<span className="font-semibold text-[#ECE8E1]">{authStatus.connectedEmail}</span>) via the official Google OAuth 2.0 Gmail API.
            </p>
          </div>
        ) : (
          <div className="p-6 rounded-2xl bg-[#161514] border border-[#2E2D2B] space-y-4 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h4 className="text-base font-extrabold text-[#F5F3EF] flex items-center justify-center sm:justify-start gap-2">
                <Shield className="w-5 h-5 text-[#D4A373]" />
                Connect with Google
              </h4>
              <p className="text-xs text-[#99958F] mt-1 max-w-xl">
                Click the button to choose your Google account and grant 1-click Gmail sending permissions for genuine email dispatches.
              </p>
            </div>

            <button
              onClick={handleConnectClick}
              disabled={connectingGoogle}
              className="px-6 py-3.5 rounded-2xl gold-btn text-[#121211] font-extrabold text-xs inline-flex items-center gap-2 shadow-lg shadow-[#D4A373]/20 hover:scale-105 transition-transform cursor-pointer shrink-0 disabled:opacity-50"
            >
              <ExternalLink className="w-4 h-4" />
              <span>{connectingGoogle ? 'Connecting Google...' : '⚡ Connect with Google'}</span>
            </button>
          </div>
        )}
      </div>

      {/* 2. User Signature Settings Card */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-[#2E2D2B] bg-[#1A1918] shadow-xl space-y-6">
        <div className="flex items-start justify-between border-b border-[#2E2D2B] pb-4">
          <div>
            <h3 className="text-base font-extrabold text-[#F5F3EF] flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-[#D4A373]" />
              Personal Email Signature
            </h3>
            <p className="text-xs text-[#99958F] mt-1">Automatically appended to all AI-drafted emails</p>
          </div>
        </div>

        <form onSubmit={handleSaveSignature} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-[#ECE8E1] block mb-1">Full Name</label>
              <input
                type="text"
                placeholder="Alex Morgan"
                value={signature.name}
                onChange={(e) => setSignature({ ...signature, name: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-2xl glass-input text-xs text-[#F5F3EF]"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-[#ECE8E1] block mb-1">Designation / Title</label>
              <input
                type="text"
                placeholder="Product Lead / Senior Engineer"
                value={signature.designation}
                onChange={(e) => setSignature({ ...signature, designation: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-2xl glass-input text-xs text-[#F5F3EF]"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-[#ECE8E1] block mb-1">Company / Organization</label>
              <input
                type="text"
                placeholder="Acme Corp"
                value={signature.company}
                onChange={(e) => setSignature({ ...signature, company: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-2xl glass-input text-xs text-[#F5F3EF]"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-[#ECE8E1] block mb-1">Phone Number</label>
              <input
                type="text"
                placeholder="+1 (555) 019-2834"
                value={signature.phone}
                onChange={(e) => setSignature({ ...signature, phone: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-2xl glass-input text-xs text-[#F5F3EF]"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-[#2E2D2B]">
            {saveSuccess && (
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 animate-fadeIn">
                <CheckCircle className="w-4 h-4" /> Signature saved successfully!
              </span>
            )}
            <button
              type="submit"
              disabled={savingSig}
              className="ml-auto px-5 py-2 rounded-xl gold-btn text-[#121211] text-xs font-bold shadow-md cursor-pointer disabled:opacity-50"
            >
              {savingSig ? 'Saving...' : 'Save Signature'}
            </button>
          </div>
        </form>
      </div>

      {/* 4. GitHub Repository & Deployment Details Card */}
      <div className="rounded-3xl p-6 border bg-[#1A1918] border-[#2E2D2B] shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#D4A373]/15 text-[#D4A373] border border-[#D4A373]/30 flex items-center justify-center shadow-xs">
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
              </svg>
            </div>
            <div>
              <h3 className="text-base font-extrabold text-[#F5F3EF]">Open Source Repository & Deployment</h3>
              <p className="text-xs text-[#99958F]">View source code, build configs, and deployment workflows on GitHub</p>
            </div>
          </div>

          <a
            href="https://github.com/yuvasriram2909/Scribe-AI"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-xl gold-btn text-[#121211] text-xs font-bold shadow-md inline-flex items-center gap-2 cursor-pointer"
          >
            <span>Open Repository</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div className="p-3.5 rounded-2xl bg-[#121211]/60 border border-[#2E2D2B] space-y-1">
            <span className="text-[10px] uppercase tracking-wider text-[#99958F] font-bold">GitHub Repository</span>
            <p className="text-xs font-mono text-[#D4A373] truncate">yuvasriram2909/Scribe-AI</p>
          </div>
          <div className="p-3.5 rounded-2xl bg-[#121211]/60 border border-[#2E2D2B] space-y-1">
            <span className="text-[10px] uppercase tracking-wider text-[#99958F] font-bold">Vercel Deployment</span>
            <p className="text-xs font-mono text-emerald-400 truncate">scribe-ai-self.vercel.app</p>
          </div>
          <div className="p-3.5 rounded-2xl bg-[#121211]/60 border border-[#2E2D2B] space-y-1">
            <span className="text-[10px] uppercase tracking-wider text-[#99958F] font-bold">Active Branch</span>
            <p className="text-xs font-mono text-[#ECE8E1] truncate">main (Production)</p>
          </div>
        </div>
      </div>
    </div>
  );
}
