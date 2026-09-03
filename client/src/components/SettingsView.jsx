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
  Sparkles
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
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 shadow-xl">
        <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
          <Settings className="w-5 h-5 text-purple-400" />
          Settings & Account Authorization
        </h2>
        <p className="text-xs text-slate-400 mt-1">Configure Gmail sender authorization, backend endpoint, and email signature defaults</p>
      </div>

      {/* 1. Official Google OAuth 2.0 Authorization Card */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-xl space-y-6">
        <div className="flex items-start justify-between border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-cyan-400" />
              Official Google OAuth 2.0 Gmail Authorization
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Authorize Scribe AI to send emails directly via Google OAuth 2.0 Gmail REST API
            </p>
          </div>
          <span className={`text-xs font-bold px-3 py-1 rounded-full ${
            authStatus.isConnected
              ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40'
              : 'bg-amber-950/80 text-amber-300 border border-amber-500/40'
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
                <span className="text-xs font-bold text-white">
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
            <p className="text-xs text-slate-400">
              All AI-generated emails are dispatched directly from your authenticated Gmail address (<span className="font-semibold text-slate-200">{authStatus.connectedEmail}</span>) via the official Google OAuth 2.0 Gmail API.
            </p>
          </div>
        ) : (
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h4 className="text-base font-extrabold text-white flex items-center justify-center sm:justify-start gap-2">
                <Shield className="w-5 h-5 text-purple-400" />
                Connect with Google
              </h4>
              <p className="text-xs text-slate-400 mt-1 max-w-xl">
                Click the button to choose your Google account and grant 1-click Gmail sending permissions for genuine email dispatches.
              </p>
            </div>

            <button
              onClick={handleConnectClick}
              disabled={connectingGoogle}
              className="px-6 py-3.5 rounded-2xl gradient-btn text-white font-extrabold text-xs inline-flex items-center gap-2 shadow-lg shadow-purple-600/30 hover:scale-105 transition-transform cursor-pointer shrink-0 disabled:opacity-50"
            >
              <ExternalLink className="w-4 h-4" />
              <span>{connectingGoogle ? 'Connecting Google...' : '⚡ Connect with Google'}</span>
            </button>
          </div>
        )}

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300">
              Developer Note — Google Cloud Console Authorized Redirect URI:
            </span>
            <button
              onClick={() => {
                navigator.clipboard.writeText(dynamicRedirectUri);
                alert('Redirect URI copied to clipboard!');
              }}
              className="text-[11px] text-purple-400 hover:text-purple-300 font-bold flex items-center gap-1 cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" />
              Copy Redirect URI
            </button>
          </div>
          <code className="text-xs font-mono text-cyan-300 bg-black/40 px-3 py-2 rounded-xl block break-all border border-slate-800">
            {dynamicRedirectUri}
          </code>
        </div>
      </div>

      {/* 2. Supabase Edge Function Backend Configuration Card */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-xl space-y-6">
        <div className="flex items-start justify-between border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <Server className="w-5 h-5 text-purple-400" />
              Supabase Edge Function & Backend API Connection
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Active backend endpoint for OAuth dispatch, AI generation, and database sync
            </p>
          </div>
        </div>

        <form onSubmit={handleSaveBackendUrl} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">
              Backend API / Edge Function URL
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="https://bjxjorlxjijssrqjosed.supabase.co/functions/v1/api"
                value={backendUrlInput}
                onChange={(e) => setBackendUrlInput(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl glass-input text-xs text-white font-mono"
              />
              <button
                type="button"
                onClick={handleTestBackend}
                disabled={testingBackend}
                className="px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold shrink-0 cursor-pointer flex items-center gap-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${testingBackend ? 'animate-spin' : ''}`} />
                Test
              </button>
            </div>
          </div>

          {backendStatus.tested && (
            <div className={`p-3 rounded-2xl text-xs font-bold flex items-center gap-2 ${
              backendStatus.success ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/30' : 'bg-rose-950/80 text-rose-300 border border-rose-500/30'
            }`}>
              {backendStatus.success ? <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
              <span>{backendStatus.message}</span>
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={() => {
                setCustomBackendUrl('');
                setBackendUrlInput(DEFAULT_SUPABASE_EDGE_FUNCTION);
                setActiveApiBase(DEFAULT_SUPABASE_EDGE_FUNCTION);
                setBackendStatus({
                  tested: true,
                  success: true,
                  message: 'Reset backend URL to default Supabase Edge Function.'
                });
                fetchSettings();
              }}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-bold cursor-pointer"
            >
              Reset to Default
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl gradient-btn text-white text-xs font-bold shadow-md cursor-pointer"
            >
              Save Backend URL
            </button>
          </div>
        </form>
      </div>

      {/* 3. User Signature Settings Card */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-xl space-y-6">
        <div className="flex items-start justify-between border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-purple-400" />
              Personal Email Signature
            </h3>
            <p className="text-xs text-slate-400 mt-1">Automatically appended to all AI-drafted emails</p>
          </div>
        </div>

        <form onSubmit={handleSaveSignature} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Full Name</label>
              <input
                type="text"
                placeholder="Alex Morgan"
                value={signature.name}
                onChange={(e) => setSignature({ ...signature, name: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-2xl glass-input text-xs text-white"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Designation / Title</label>
              <input
                type="text"
                placeholder="Product Lead / Senior Engineer"
                value={signature.designation}
                onChange={(e) => setSignature({ ...signature, designation: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-2xl glass-input text-xs text-white"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Company / Organization</label>
              <input
                type="text"
                placeholder="Acme Corp"
                value={signature.company}
                onChange={(e) => setSignature({ ...signature, company: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-2xl glass-input text-xs text-white"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Phone Number</label>
              <input
                type="text"
                placeholder="+1 (555) 019-2834"
                value={signature.phone}
                onChange={(e) => setSignature({ ...signature, phone: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-2xl glass-input text-xs text-white"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-800">
            {saveSuccess && (
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 animate-fadeIn">
                <CheckCircle className="w-4 h-4" /> Signature saved successfully!
              </span>
            )}
            <button
              type="submit"
              disabled={savingSig}
              className="ml-auto px-5 py-2 rounded-xl gradient-btn text-white text-xs font-bold shadow-md cursor-pointer disabled:opacity-50"
            >
              {savingSig ? 'Saving...' : 'Save Signature'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
