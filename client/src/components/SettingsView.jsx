import React, { useState, useEffect } from 'react';
import { Settings, Shield, CheckCircle, ExternalLink, Save, UserCheck, Check, Lock, X, Server, RefreshCw, AlertCircle } from 'lucide-react';
import { apiFetch, getApiBaseUrl, setCustomBackendUrl } from '../utils/api';

export function SettingsView() {
  const [authStatus, setAuthStatus] = useState({
    isConnected: false,
    connectedEmail: null,
    isGoogleConfigured: false,
    mode: 'Loading...'
  });

  const [authUrl, setAuthUrl] = useState(null);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [clientIdInput, setClientIdInput] = useState('');
  const [clientSecretInput, setClientSecretInput] = useState('');
  const [savingCreds, setSavingCreds] = useState(false);

  // Backend URL configuration
  const [backendUrlInput, setBackendUrlInput] = useState(localStorage.getItem('customBackendUrl') || '');
  const [testingBackend, setTestingBackend] = useState(false);
  const [backendStatus, setBackendStatus] = useState({ tested: false, success: false, message: '' });

  // User Signature Form State
  const [signature, setSignature] = useState({
    name: '',
    designation: '',
    company: '',
    phone: '',
    website: '',
    preferredTone: 'Professional',
    enabled: true
  });

  const [savingSig, setSavingSig] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Dynamically compute active redirect URI
  const activeApiBase = getApiBaseUrl();
  const activeBackendOrigin = activeApiBase.startsWith('http') 
    ? activeApiBase.replace(/\/api\/?$/, '') 
    : (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5000');
  const dynamicRedirectUri = `${activeBackendOrigin}/api/auth/google/callback`;

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const [authRes, sigRes, urlRes] = await Promise.all([
        apiFetch('/api/auth/status'),
        apiFetch('/api/settings/signature'),
        apiFetch('/api/auth/google/url')
      ]);

      if (authRes.ok) {
        const data = await authRes.json();
        setAuthStatus(data);
      }
      if (sigRes.ok) {
        const sigData = await sigRes.json();
        setSignature({
          name: sigData.name || '',
          designation: sigData.designation || '',
          company: sigData.company || '',
          phone: sigData.phone || '',
          website: sigData.website || '',
          preferredTone: sigData.preferredTone || 'Professional',
          enabled: sigData.enabled !== undefined ? sigData.enabled : true
        });
      }
      if (urlRes.ok) {
        const urlData = await urlRes.json();
        if (urlData.url) setAuthUrl(urlData.url);
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    }
  };

  const handleTestBackend = async () => {
    setTestingBackend(true);
    setBackendStatus({ tested: false, success: false, message: '' });
    try {
      const targetBase = (backendUrlInput.trim() || activeApiBase).replace(/\/+$/, '');
      const healthUrl = targetBase.endsWith('/api') ? `${targetBase}/health` : `${targetBase}/api/health`;
      const res = await fetch(healthUrl, { method: 'GET' });
      if (res.ok) {
        setBackendStatus({ tested: true, success: true, message: 'Backend connected successfully! API is online.' });
      } else {
        setBackendStatus({ tested: true, success: false, message: `Server returned HTTP ${res.status}.` });
      }
    } catch (err) {
      setBackendStatus({ tested: true, success: false, message: `Could not reach server: ${err.message}` });
    } finally {
      setTestingBackend(false);
    }
  };

  const handleSaveBackendUrl = (e) => {
    e.preventDefault();
    setCustomBackendUrl(backendUrlInput);
    alert('Backend URL configuration updated!');
    fetchSettings();
  };

  const handleSaveSignature = async (e) => {
    e.preventDefault();
    setSavingSig(true);
    setSaveSuccess(false);

    try {
      const res = await apiFetch('/api/settings/signature', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(signature)
      });

      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        alert('Failed to save signature.');
      }
    } catch (err) {
      alert('Error saving signature: ' + err.message);
    } finally {
      setSavingSig(false);
    }
  };

  const handleDisconnect = async () => {
    if (!window.confirm('Are you sure you want to disconnect your Gmail OAuth connection?')) {
      return;
    }

    try {
      const res = await apiFetch('/api/auth/google/disconnect', { method: 'POST' });
      if (res.ok) {
        setAuthStatus({
          isConnected: false,
          connectedEmail: null,
          isGoogleConfigured: true,
          mode: 'Not Connected'
        });
        setAuthUrl(null);
        fetchSettings();
      }
    } catch (err) {
      alert('Error disconnecting: ' + err.message);
    }
  };

  const handleConnectClick = async () => {
    try {
      const res = await apiFetch('/api/auth/google/url');
      const data = await res.json();
      if (data && data.url) {
        window.location.href = data.url;
      } else {
        setShowConfigModal(true);
      }
    } catch (err) {
      setShowConfigModal(true);
    }
  };

  const handleSaveOAuthCredentials = async (e) => {
    e.preventDefault();
    if (!clientIdInput.trim() || !clientSecretInput.trim()) {
      alert('Please enter both Google Client ID and Client Secret.');
      return;
    }

    setSavingCreds(true);
    try {
      const res = await apiFetch('/api/auth/google/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: clientIdInput.trim(), clientSecret: clientSecretInput.trim() })
      });
      const data = await res.json();
      if (res.ok && data.url) {
        setAuthUrl(data.url);
        window.location.href = data.url;
      } else {
        alert(data.error || 'Failed to initialize Google OAuth.');
      }
    } catch (err) {
      alert('Error connecting to OAuth endpoint: ' + err.message);
    } finally {
      setSavingCreds(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
      <div className="glass-panel p-6 rounded-3xl border border-[#D8D1BC]">
        <h2 className="text-xl font-extrabold text-[#28321D] flex items-center gap-2">
          <Settings className="w-5 h-5 text-[#667A45]" />
          Settings & Account Authorization
        </h2>
        <p className="text-xs text-[#6F725F] mt-1">Configure Gmail sender authorization, backend endpoint, and email signature defaults</p>
      </div>

      {/* 1. Official Google OAuth 2.0 Authorization Card */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-[#D8D1BC] space-y-6">
        <div className="flex items-start justify-between border-b border-[#D8D1BC] pb-4">
          <div>
            <h3 className="text-base font-extrabold text-[#28321D] flex items-center gap-2">
              <Shield className="w-5 h-5 text-[#667A45]" />
              Official Google OAuth 2.0 Gmail Authorization
            </h3>
            <p className="text-xs text-[#6F725F] mt-1">
              Authorize Scribe AI to send emails directly via Google OAuth 2.0 Gmail REST API
            </p>
          </div>
          <span className={`text-xs font-bold px-3 py-1 rounded-full ${
            authStatus.isConnected
              ? 'bg-[#E6F4EA] text-[#137333] border border-[#A8DADC]'
              : 'bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]'
          }`}>
            {authStatus.isConnected ? 'Gmail Connected ✓' : 'Not Connected'}
          </span>
        </div>

        {authStatus.isConnected ? (
          <div className="p-5 rounded-2xl bg-[#E6F4EA] border border-[#A8DADC] space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-[#137333] shrink-0" />
                <span className="text-xs font-bold text-[#28321D]">
                  Gmail Account Connected: <span className="text-[#667A45] font-mono">{authStatus.connectedEmail}</span>
                </span>
              </div>
              <button
                onClick={handleDisconnect}
                className="px-4 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold border border-red-200 transition-all cursor-pointer"
              >
                Disconnect Account
              </button>
            </div>
            <p className="text-xs text-[#6F725F]">
              All AI-generated emails are dispatched directly from your authentic Gmail address ({authStatus.connectedEmail}) via official Google OAuth 2.0 Gmail API.
            </p>
          </div>
        ) : (
          <div className="p-6 rounded-2xl bg-[#FAF8F1] border border-[#D8D1BC] space-y-4 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h4 className="text-base font-extrabold text-[#28321D] flex items-center justify-center sm:justify-start gap-2">
                <Shield className="w-5 h-5 text-[#667A45]" />
                Connect Gmail Account via Google OAuth
              </h4>
              <p className="text-xs text-[#6F725F] mt-1 max-w-xl">
                Click the button below to sign in securely with your Google account and grant 1-click Gmail sending permissions for real email dispatches.
              </p>
            </div>

            <button
              type="button"
              onClick={handleConnectClick}
              className="px-8 py-4 rounded-2xl gradient-btn text-[#FAF8F1] font-extrabold text-xs inline-flex items-center gap-2 shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer shrink-0"
            >
              <ExternalLink className="w-4 h-4 text-[#FAF8F1]" />
              ⚡ Connect Google Account
            </button>
          </div>
        )}
      </div>

      {/* 2. Backend Server & Database Endpoint Configuration */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-[#D8D1BC] space-y-6">
        <div className="flex items-start justify-between border-b border-[#D8D1BC] pb-4">
          <div>
            <h3 className="text-base font-extrabold text-[#28321D] flex items-center gap-2">
              <Server className="w-5 h-5 text-[#667A45]" />
              Supabase Edge Function & Backend API Connection
            </h3>
            <p className="text-xs text-[#6F725F] mt-1">
              Active Edge Function endpoint: <code className="font-mono font-bold text-[#3F4D2A] bg-[#FAF8F1] px-2 py-0.5 rounded border border-[#D8D1BC]">{activeApiBase}</code>
            </p>
          </div>
        </div>

        <form onSubmit={handleSaveBackendUrl} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-[#28321D] block mb-1">
              Backend API / Edge Function URL <span className="text-[#6F725F] font-normal">(Defaults to Supabase Edge Function)</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="url"
                placeholder="https://bjxjorlxjijssrqjosed.supabase.co/functions/v1/api"
                value={backendUrlInput}
                onChange={(e) => setBackendUrlInput(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl glass-input text-xs text-[#28321D] font-mono"
              />
              <button
                type="button"
                onClick={handleTestBackend}
                disabled={testingBackend}
                className="px-4 py-2.5 rounded-xl bg-[#FAF8F1] hover:bg-[#E8DFC8] text-[#3F4D2A] border border-[#D8D1BC] text-xs font-bold shrink-0 cursor-pointer flex items-center gap-1"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${testingBackend ? 'animate-spin' : ''}`} />
                Test
              </button>
            </div>
          </div>

          {backendStatus.tested && (
            <div className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
              backendStatus.success ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {backendStatus.success ? <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />}
              <span>{backendStatus.message}</span>
            </div>
          )}

          <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-[#D8D1BC]">
            <div className="text-[11px] text-[#6F725F]">
              Required OAuth Redirect URI for this backend: <code className="font-mono font-bold text-[#28321D] select-all">{dynamicRedirectUri}</code>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(dynamicRedirectUri);
                  alert('Copied Redirect URI to clipboard!');
                }}
                className="px-3 py-1.5 rounded-lg bg-[#FAF8F1] hover:bg-[#E8DFC8] text-[#3F4D2A] border border-[#D8D1BC] text-xs font-bold cursor-pointer"
              >
                Copy Redirect URI
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl gradient-btn text-[#FAF8F1] text-xs font-bold shadow-xs cursor-pointer"
              >
                Save Backend URL
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* 3. User Signature Settings Card */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-[#D8D1BC] space-y-6">
        <div className="flex items-start justify-between border-b border-[#D8D1BC] pb-4">
          <div>
            <h3 className="text-base font-extrabold text-[#28321D] flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-[#667A45]" />
              Personal Email Signature
            </h3>
            <p className="text-xs text-[#6F725F] mt-1">Automatically appended to all AI-drafted emails</p>
          </div>
        </div>

        <form onSubmit={handleSaveSignature} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-[#28321D] block mb-1">Full Name</label>
              <input
                type="text"
                placeholder="Alex Morgan"
                value={signature.name}
                onChange={(e) => setSignature({ ...signature, name: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs text-[#28321D]"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-[#28321D] block mb-1">Designation / Title</label>
              <input
                type="text"
                placeholder="Product Lead / Senior Engineer"
                value={signature.designation}
                onChange={(e) => setSignature({ ...signature, designation: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs text-[#28321D]"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-[#28321D] block mb-1">Company / Organization</label>
              <input
                type="text"
                placeholder="Acme Corp"
                value={signature.company}
                onChange={(e) => setSignature({ ...signature, company: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs text-[#28321D]"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-[#28321D] block mb-1">Phone Number</label>
              <input
                type="text"
                placeholder="+1 (555) 000-1234"
                value={signature.phone}
                onChange={(e) => setSignature({ ...signature, phone: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs text-[#28321D]"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-[#D8D1BC]">
            <label className="flex items-center gap-2 text-xs font-semibold text-[#28321D] cursor-pointer">
              <input
                type="checkbox"
                checked={signature.enabled}
                onChange={(e) => setSignature({ ...signature, enabled: e.target.checked })}
                className="rounded text-[#667A45] focus:ring-[#667A45]"
              />
              <span>Enable signature on all outgoing emails</span>
            </label>

            <button
              type="submit"
              disabled={savingSig}
              className="px-6 py-2.5 rounded-xl gradient-btn text-[#FAF8F1] font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              {savingSig ? 'Saving...' : saveSuccess ? 'Saved ✓' : 'Save Signature'}
            </button>
          </div>
        </form>
      </div>

      {/* Configuration Modal if credentials need initializing */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 bg-[#28321D]/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel max-w-lg w-full p-6 sm:p-8 rounded-3xl border border-[#D8D1BC] space-y-5 animate-fadeIn shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#D8D1BC] pb-3">
              <h3 className="text-sm font-extrabold text-[#28321D] flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#667A45]" />
                Initialize Google OAuth Credentials
              </h3>
              <button onClick={() => setShowConfigModal(false)} className="text-[#6F725F] hover:text-[#28321D]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#6F725F]">
              Enter your Google OAuth Client ID & Secret to activate direct Google Cloud OAuth sign-in.
            </p>

            <div className="p-3.5 rounded-xl bg-[#FAF8F1] border border-[#D8D1BC] text-xs text-[#28321D] flex items-center justify-between gap-2">
              <span className="text-[#6F725F] text-[11px] font-medium">Find your OAuth Credentials:</span>
              <a
                href="https://console.cloud.google.com/apis/credentials"
                target="_blank"
                rel="noreferrer"
                className="text-[#667A45] hover:text-[#3F4D2A] font-extrabold text-[11px] underline inline-flex items-center gap-1 shrink-0"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Google Cloud Credentials Console ↗
              </a>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-[#28321D] space-y-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="font-bold text-amber-900 text-[11px]">⚠️ Required Redirect URI for this Client ID:</span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(dynamicRedirectUri);
                    alert('Copied Redirect URI to clipboard!');
                  }}
                  className="px-2.5 py-1 rounded bg-[#667A45] hover:bg-[#3F4D2A] text-[#FAF8F1] font-bold text-[10px] cursor-pointer"
                >
                  Copy Redirect URI
                </button>
              </div>
              <code className="block p-2 rounded bg-white border border-amber-200 font-mono text-[11px] text-[#28321D] break-all select-all font-bold">
                {dynamicRedirectUri}
              </code>
              <p className="text-[10px] text-amber-800 leading-tight">
                Make sure this exact URI is listed under <strong>Authorized redirect URIs</strong> in Google Cloud Console for your Client ID.
              </p>
            </div>

            <form onSubmit={handleSaveOAuthCredentials} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-[#28321D] block mb-1">Google Client ID</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 123456789-abc.apps.googleusercontent.com"
                  value={clientIdInput}
                  onChange={(e) => setClientIdInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs text-[#28321D]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#28321D] block mb-1">Google Client Secret</label>
                <input
                  type="password"
                  required
                  placeholder="e.g. GOCSPX-xxxxxxxxxxxx"
                  value={clientSecretInput}
                  onChange={(e) => setClientSecretInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs text-[#28321D]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowConfigModal(false)}
                  className="px-4 py-2 rounded-xl bg-[#FAF8F1] hover:bg-[#E8DFC8] text-[#28321D] text-xs font-bold border border-[#D8D1BC] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingCreds}
                  className="px-6 py-2 rounded-xl gradient-btn text-[#FAF8F1] font-bold text-xs flex items-center gap-1.5 shadow-md cursor-pointer"
                >
                  <Lock className="w-3.5 h-3.5" />
                  {savingCreds ? 'Saving...' : '⚡ Save & Launch Google Sign-In'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
