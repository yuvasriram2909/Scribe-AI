import React, { useState, useEffect } from 'react';
import { Settings, Shield, CheckCircle, ExternalLink, Save, UserCheck, Check, Lock } from 'lucide-react';
import { apiFetch } from '../utils/api';

export function SettingsView() {
  const [authStatus, setAuthStatus] = useState({
    isConnected: false,
    connectedEmail: null,
    isGoogleConfigured: false,
    mode: 'Loading...'
  });

  const [authUrl, setAuthUrl] = useState(null);

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

  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [inputClientId, setInputClientId] = useState('');
  const [inputClientSecret, setInputClientSecret] = useState('');
  const [savingCreds, setSavingCreds] = useState(false);
  const [credsMsg, setCredsMsg] = useState('');

  const handleSaveCredentials = async (e) => {
    e.preventDefault();
    if (!inputClientId.trim() || !inputClientSecret.trim()) {
      setCredsMsg('Please enter both Client ID and Client Secret.');
      return;
    }
    setSavingCreds(true);
    setCredsMsg('');
    try {
      const res = await apiFetch('/api/auth/google/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: inputClientId.trim(), clientSecret: inputClientSecret.trim() })
      });
      const data = await res.json();
      if (res.ok && data.url) {
        setAuthUrl(data.url);
        window.location.href = data.url;
      } else {
        setCredsMsg(`❌ ${data.error || 'Failed to save credentials.'}`);
      }
    } catch (err) {
      setCredsMsg(`❌ Error: ${err.message}`);
    } finally {
      setSavingCreds(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const [authRes, sigRes, urlRes] = await Promise.all([
        apiFetch('/api/auth/status'),
        apiFetch('/api/signature'),
        apiFetch('/api/auth/google/url')
      ]);

      if (authRes.ok) {
        const data = await authRes.json();
        setAuthStatus(data);
      }
      if (sigRes.ok) {
        const sigData = await sigRes.json();
        if (sigData) setSignature(sigData);
      }
      if (urlRes.ok) {
        const urlData = await urlRes.json();
        if (urlData.configured) setAuthUrl(urlData.url);
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
    }
  };

  const handleDisconnect = async () => {
    try {
      const res = await apiFetch('/api/auth/google/disconnect', { method: 'DELETE' });
      if (res.ok) {
        fetchSettings();
      }
    } catch (err) {
      console.error('Failed to disconnect:', err);
    }
  };

  const handleSaveSignature = async (e) => {
    e.preventDefault();
    setSavingSig(true);
    try {
      const res = await apiFetch('/api/signature', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(signature)
      });
      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Failed to save signature:', err);
    } finally {
      setSavingSig(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
      <div className="glass-panel p-6 rounded-2xl border border-slate-800">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Settings className="w-6 h-6 text-indigo-400" />
          Settings & Account Authorization
        </h2>
        <p className="text-xs text-slate-400">Configure Gmail sender authorization, user signature, and security defaults</p>
      </div>

      {/* 1. Official Google OAuth 2.0 Authorization Card */}
      <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-slate-800 space-y-6">
        <div className="flex items-start justify-between border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-indigo-400" />
              Official Google OAuth 2.0 Gmail Authorization
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Authorize Scribe-AI to send emails directly via Google OAuth 2.0 Gmail API
            </p>
          </div>
          <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
            authStatus.isConnected
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
          }`}>
            {authStatus.isConnected ? 'Connected ✓' : 'Not Connected'}
          </span>
        </div>

        {authStatus.isConnected ? (
          <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                <span className="text-sm font-bold text-white">
                  Gmail Account Connected: <span className="text-indigo-300">{authStatus.connectedEmail}</span>
                </span>
              </div>
              <button
                onClick={handleDisconnect}
                className="px-4 py-2 rounded-lg bg-red-600/80 hover:bg-red-600 text-white text-xs font-bold transition-all cursor-pointer shadow-md"
              >
                Disconnect Account
              </button>
            </div>
            <p className="text-xs text-slate-400">
              All AI-generated emails are dispatched directly from your authentic Gmail address ({authStatus.connectedEmail}) via official Google OAuth 2.0 Gmail API.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-indigo-950/30 border border-indigo-500/30 space-y-4 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h4 className="text-base font-extrabold text-white flex items-center justify-center sm:justify-start gap-2">
                  <Shield className="w-5 h-5 text-indigo-400" />
                  Connect Real Gmail Account via Google OAuth
                </h4>
                <p className="text-xs text-slate-300 mt-1 max-w-xl">
                  Click the button to sign in securely with your Google account and grant 1-click Gmail sending permissions for real client dispatches.
                </p>
              </div>

              <button
                type="button"
                onClick={async () => {
                  if (authUrl) {
                    window.location.href = authUrl;
                    return;
                  }
                  try {
                    const res = await apiFetch('/api/auth/google/url');
                    const data = await res.json();
                    if (data && data.url) {
                      setAuthUrl(data.url);
                      window.location.href = data.url;
                    } else {
                      setShowCredentialsModal(true);
                      alert('Please enter your Google Client ID & Secret below to connect Google OAuth.');
                    }
                  } catch (e) {
                    setShowCredentialsModal(true);
                    alert('Please enter your Google Client ID & Secret below to connect Google OAuth.');
                  }
                }}
                className="px-8 py-4 rounded-2xl gradient-btn text-white font-extrabold text-sm inline-flex items-center gap-2.5 shadow-2xl shadow-indigo-500/35 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer shrink-0"
              >
                <ExternalLink className="w-5 h-5 text-white" />
                ⚡ Connect Google Account Directly
              </button>
            </div>

            <div className="p-4 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-xs text-indigo-200 space-y-2">
              <p className="font-bold text-white flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-indigo-400" />
                Need your Google OAuth credentials? (60-second setup):
              </p>
              <ol className="list-decimal list-inside space-y-1 text-slate-300">
                <li>Go to <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noreferrer" className="text-indigo-300 font-bold underline">console.cloud.google.com/apis/credentials</a></li>
                <li>Click <strong>+ CREATE CREDENTIALS</strong> → Select <strong>OAuth client ID</strong> (Type: <em>Web application</em>)</li>
                <li>Under <strong>Authorized redirect URIs</strong>, add: <code className="bg-slate-900 px-2 py-0.5 rounded text-indigo-300 font-mono text-[11px]">https://scribe-ai-1-5nqu.onrender.com/api/auth/google/callback</code></li>
                <li>Copy your <strong>Client ID</strong> and <strong>Client Secret</strong> and paste them below!</li>
              </ol>
            </div>

            <form onSubmit={handleSaveCredentials} className="p-6 rounded-2xl bg-slate-900/90 border border-indigo-500/30 space-y-4 shadow-xl">
              <div className="border-b border-slate-800 pb-3">
                <h4 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
                  <ExternalLink className="w-4 h-4 text-indigo-400" />
                  Enter Google OAuth 2.0 Credentials
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  Paste your Client ID & Secret below to connect your Google account securely.
                </p>
              </div>

              {credsMsg && (
                <div className={`p-3 rounded-xl text-xs font-medium ${
                  credsMsg.startsWith('✅')
                    ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                    : 'bg-amber-500/10 border border-amber-500/30 text-amber-300'
                }`}>
                  {credsMsg}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Google Client ID *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 123456789-abc.apps.googleusercontent.com"
                    value={inputClientId}
                    onChange={(e) => setInputClientId(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl glass-input text-xs text-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Google Client Secret *</label>
                  <input
                    type="password"
                    required
                    placeholder="e.g. GOCSPX-xxxxxxxxxxxx"
                    value={inputClientSecret}
                    onChange={(e) => setInputClientSecret(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl glass-input text-xs text-white"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end">
                <button
                  type="submit"
                  disabled={savingCreds}
                  className="px-8 py-3.5 rounded-xl gradient-btn text-white font-extrabold text-xs inline-flex items-center gap-2 shadow-xl shadow-indigo-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  {savingCreds ? 'Saving & Launching Google Sign-In...' : '⚡ Save & Launch Google OAuth Sign-In'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* 2. User Signature Settings */}
      <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-slate-800 space-y-6">
        <div className="border-b border-slate-800 pb-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-indigo-400" />
              User Signature Configuration
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Your signature is automatically appended to generated professional emails.
            </p>
          </div>

          <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-300">
            <input
              type="checkbox"
              checked={signature.enabled}
              onChange={(e) => setSignature({ ...signature, enabled: e.target.checked })}
              className="rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
            />
            Enable Signature
          </label>
        </div>

        <form onSubmit={handleSaveSignature} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">Full Name</label>
              <input
                type="text"
                placeholder="Alex Morgan"
                value={signature.name || ''}
                onChange={(e) => setSignature({ ...signature, name: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl glass-input text-xs text-white"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">Designation / Role</label>
              <input
                type="text"
                placeholder="Senior Software Engineer"
                value={signature.designation || ''}
                onChange={(e) => setSignature({ ...signature, designation: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl glass-input text-xs text-white"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">Company</label>
              <input
                type="text"
                placeholder="TechCorp Innovations"
                value={signature.company || ''}
                onChange={(e) => setSignature({ ...signature, company: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl glass-input text-xs text-white"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">Phone Number</label>
              <input
                type="text"
                placeholder="+1 (555) 234-5678"
                value={signature.phone || ''}
                onChange={(e) => setSignature({ ...signature, phone: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl glass-input text-xs text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">Website URL</label>
              <input
                type="text"
                placeholder="https://techcorp.example.com"
                value={signature.website || ''}
                onChange={(e) => setSignature({ ...signature, website: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl glass-input text-xs text-white"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">Preferred Default Tone</label>
              <select
                value={signature.preferredTone || 'Professional'}
                onChange={(e) => setSignature({ ...signature, preferredTone: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl glass-input text-xs text-white font-medium"
              >
                <option value="Professional">Professional (Respectful & Clear)</option>
                <option value="Formal">Formal (Authoritative & Precise)</option>
                <option value="Friendly">Friendly (Warm & Approachable)</option>
                <option value="Casual">Casual (Relaxed & Conversational)</option>
                <option value="Urgent">Urgent (Direct & Concise)</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            {saveSuccess && (
              <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                <Check className="w-4 h-4" /> Signature saved successfully!
              </span>
            )}
            <button
              type="submit"
              disabled={savingSig}
              className="ml-auto px-6 py-2.5 rounded-xl gradient-btn text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-indigo-500/20"
            >
              <Save className="w-4 h-4" />
              {savingSig ? 'Saving...' : 'Save Signature Settings'}
            </button>
          </div>
        </form>
      </div>

      {/* 3. Security Policy Statement */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 text-xs text-slate-400 space-y-2">
        <div className="flex items-center gap-2 text-indigo-400 font-bold">
          <Lock className="w-4 h-4" /> Security & Privacy Assurance
        </div>
        <p>
          AI Smart Email Sender strictly adheres to explicit user confirmation principles. No email is sent without your explicit approval click in Step 4. All API keys and OAuth tokens remain securely stored server-side.
        </p>
      </div>
    </div>
  );
}
