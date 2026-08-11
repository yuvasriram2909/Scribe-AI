import React, { useState, useEffect } from 'react';
import { Settings, Shield, CheckCircle, ExternalLink, Save, UserCheck, Key, Lock, Check } from 'lucide-react';
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

  const [appEmail, setAppEmail] = useState('');
  const [appPassword, setAppPassword] = useState('');
  const [savingAppPass, setSavingAppPass] = useState(false);
  const [appPassMsg, setAppPassMsg] = useState('');

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
        if (data.connectedEmail) setAppEmail(data.connectedEmail);
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

  const handleSaveAppPassword = async (e) => {
    e.preventDefault();
    if (!appEmail.trim() || !appPassword.trim()) {
      setAppPassMsg('Please enter your Gmail address and 16-character App Password.');
      return;
    }
    setSavingAppPass(true);
    setAppPassMsg('');
    try {
      const res = await apiFetch('/api/auth/app-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gmailEmail: appEmail, appPassword })
      });
      const data = await res.json();
      if (res.ok) {
        setAppPassMsg('✅ Gmail App Password saved! Connected for live email dispatches.');
        setAppPassword('');
        fetchSettings();
      } else {
        setAppPassMsg(`❌ ${data.error || 'Failed to save App Password.'}`);
      }
    } catch (err) {
      setAppPassMsg(`❌ Error: ${err.message}`);
    } finally {
      setSavingAppPass(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      const res = await apiFetch('/api/auth/google/disconnect', { method: 'DELETE' });
      if (res.ok) {
        setAppEmail('');
        setAppPassword('');
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
            authStatus.isConnected && authStatus.authMethod === 'oauth'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
          }`}>
            {authStatus.isConnected && authStatus.authMethod === 'oauth' ? 'OAuth Connected ✓' : 'Not Connected'}
          </span>
        </div>

        {authUrl ? (
          <div className="space-y-3">
            <p className="text-xs text-slate-300">
              Click the button below to sign in with your Google Account and grant Gmail sending permissions:
            </p>
            <a
              href={authUrl}
              className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs inline-flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
            >
              <ExternalLink className="w-4 h-4" />
              ⚡ Connect via Google OAuth 2.0
            </a>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-400">
            Google OAuth 2.0 is active. Set <strong>GOOGLE_CLIENT_ID</strong> & <strong>GOOGLE_CLIENT_SECRET</strong> in server environment variables to enable 1-click Google popup sign-in.
          </div>
        )}
      </div>

      {/* 2. Direct Gmail App Password Authorization */}
      <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-slate-800 space-y-6">
        <div className="flex items-start justify-between border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-indigo-400" />
              Direct Gmail Connection (App Password)
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Connect any Gmail account instantly without Google Cloud Console setup or security caution screens.
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
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
                <span className="text-sm font-bold text-white">
                  Gmail Account Active: <span className="text-indigo-300">{authStatus.connectedEmail}</span>
                </span>
              </div>
              <button
                onClick={handleDisconnect}
                className="px-3 py-1 rounded-lg bg-red-600/80 hover:bg-red-600 text-white text-xs font-bold transition-all"
              >
                Disconnect
              </button>
            </div>
            <p className="text-xs text-slate-400">
              All AI-generated emails will be dispatched directly from your authentic Gmail address ({authStatus.connectedEmail}).
            </p>
          </div>
        ) : (
          <form onSubmit={handleSaveAppPassword} className="space-y-4">
            <div className="p-4 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-xs text-indigo-200 space-y-2">
              <p className="font-bold text-white flex items-center gap-1.5">
                <Key className="w-4 h-4 text-indigo-400" />
                How to get your 16-character Gmail App Password in 10 seconds:
              </p>
              <ol className="list-decimal list-inside space-y-1 text-slate-300">
                <li>Go to <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noreferrer" className="text-indigo-300 font-bold underline">myaccount.google.com/apppasswords</a></li>
                <li>Type App Name: <strong>Scribe-AI</strong> → Click <strong>Create</strong></li>
                <li>Copy the 16-character password generated by Google and paste it below!</li>
              </ol>
            </div>

            {appPassMsg && (
              <div className={`p-3 rounded-xl text-xs font-medium ${
                appPassMsg.startsWith('✅')
                  ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                  : 'bg-amber-500/10 border border-amber-500/30 text-amber-300'
              }`}>
                {appPassMsg}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Your Gmail Address *</label>
                <input
                  type="email"
                  required
                  placeholder="yourname@gmail.com"
                  value={appEmail}
                  onChange={(e) => setAppEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs text-white"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">16-Character App Password *</label>
                <input
                  type="password"
                  required
                  placeholder="xxxx xxxx xxxx xxxx"
                  value={appPassword}
                  onChange={(e) => setAppPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs text-white"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={savingAppPass}
              className="px-6 py-2.5 rounded-xl gradient-btn text-white text-xs font-bold inline-flex items-center gap-2 shadow-lg shadow-indigo-500/25"
            >
              <Save className="w-4 h-4" />
              {savingAppPass ? 'Connecting Gmail...' : '⚡ Save & Connect Gmail Account'}
            </button>
          </form>
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
