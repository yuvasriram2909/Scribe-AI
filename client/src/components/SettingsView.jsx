import React, { useState, useEffect } from 'react';
import { Settings, Shield, CheckCircle, ExternalLink, Save, UserCheck, Check, Lock, AlertTriangle, Copy } from 'lucide-react';
import { apiFetch } from '../utils/api';

export function SettingsView() {
  const [authStatus, setAuthStatus] = useState({
    isConnected: false,
    connectedEmail: null,
    isGoogleConfigured: false,
    mode: 'Loading...'
  });

  const [authUrl, setAuthUrl] = useState(null);
  const [copiedUri, setCopiedUri] = useState(false);

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

  const EXACT_REDIRECT_URI = 'https://scribe-ai-1-5nqu.onrender.com/api/auth/google/callback';

  const handleCopyUri = () => {
    navigator.clipboard.writeText(EXACT_REDIRECT_URI);
    setCopiedUri(true);
    setTimeout(() => setCopiedUri(false), 3000);
  };

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
      <div className="glass-panel p-6 rounded-3xl border border-[#D8D1BC]">
        <h2 className="text-xl font-extrabold text-[#28321D] flex items-center gap-2">
          <Settings className="w-5 h-5 text-[#667A45]" />
          Settings & Account Authorization
        </h2>
        <p className="text-xs text-[#6F725F] mt-1">Configure Gmail sender authorization, user signature, and security defaults</p>
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
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-[#FAF8F1] border border-[#D8D1BC] space-y-4 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h4 className="text-base font-extrabold text-[#28321D] flex items-center justify-center sm:justify-start gap-2">
                  <Shield className="w-5 h-5 text-[#667A45]" />
                  Connect Real Gmail Account via Google OAuth
                </h4>
                <p className="text-xs text-[#6F725F] mt-1 max-w-xl">
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
                className="px-8 py-4 rounded-2xl gradient-btn text-[#FAF8F1] font-extrabold text-xs inline-flex items-center gap-2 shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer shrink-0"
              >
                <ExternalLink className="w-4 h-4 text-[#FAF8F1]" />
                ⚡ Connect Google Account Directly
              </button>
            </div>

            {/* Error 400: redirect_uri_mismatch Resolution Banner */}
            <div className="p-5 rounded-2xl bg-red-50 border border-red-200 text-xs text-[#28321D] space-y-3 shadow-xs">
              <div className="flex items-center gap-2 text-red-900 font-extrabold text-sm">
                <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
                Fixing "Error 400: redirect_uri_mismatch":
              </div>
              <p className="text-red-800 font-medium">
                Google blocked sign-in because this exact Redirect URI is missing in your Google Cloud Console.
              </p>

              <div className="p-4 rounded-xl bg-white border border-red-200 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="font-bold text-[#3F4D2A]">Exact Required Redirect URI:</span>
                  <button
                    onClick={handleCopyUri}
                    className="px-3 py-1 rounded-lg bg-[#667A45] hover:bg-[#3F4D2A] text-[#FAF8F1] font-bold text-[11px] flex items-center gap-1 transition-all cursor-pointer shadow-xs"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    {copiedUri ? 'Copied ✓' : 'Copy Exact URI'}
                  </button>
                </div>
                <code className="block p-2.5 rounded-lg bg-[#FAF8F1] border border-[#D8D1BC] font-mono text-[#28321D] text-xs break-all select-all font-bold">
                  {EXACT_REDIRECT_URI}
                </code>

                <span className="font-bold text-[#3F4D2A] block pt-1">⚡ 60-Second Fix in Google Cloud Console:</span>
                <ol className="list-decimal list-inside space-y-1.5 text-[#6F725F] leading-relaxed">
                  <li>Open <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noreferrer" className="text-[#667A45] font-bold underline">Google Cloud Credentials Console</a></li>
                  <li>Click your <strong>OAuth 2.0 Web Client ID</strong> (or click the Pencil icon to edit)</li>
                  <li>Under <strong>Authorized redirect URIs</strong>, click <strong>+ ADD URI</strong></li>
                  <li>Paste: <code className="bg-[#E8DFC8] px-2 py-0.5 rounded text-[#28321D] font-mono text-[11px] font-bold">{EXACT_REDIRECT_URI}</code></li>
                  <li>Click <strong>SAVE</strong> at the bottom of the page in Google Cloud Console.</li>
                </ol>
              </div>
            </div>

            {/* Error 403: access_denied Resolution Banner */}
            <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-[#28321D] space-y-3 shadow-xs">
              <div className="flex items-center gap-2 text-amber-900 font-extrabold text-sm">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                Fixing "Error 403: access_denied / App not completed Google verification process":
              </div>
              <p className="text-[#6F725F]">
                If Google shows <strong>"Access blocked: scribe-ai-1-5nqu.onrender.com has not completed the Google verification process"</strong>, follow one of these 2 quick solutions in Google Cloud Console:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="p-3 rounded-xl bg-white border border-amber-200 space-y-1">
                  <span className="font-bold text-[#3F4D2A] block">⚡ Option A (30-second fix): Add Test User</span>
                  <p className="text-[#6F725F] text-[11px] leading-relaxed">
                    1. Open <a href="https://console.cloud.google.com/apis/credentials/consent" target="_blank" rel="noreferrer" className="text-[#667A45] font-bold underline">OAuth Consent Screen</a><br/>
                    2. Scroll down to <strong>Test Users</strong> → Click <strong>+ ADD USERS</strong><br/>
                    3. Enter email: <code className="bg-[#E8DFC8] px-1 rounded text-[#28321D] font-mono">yuvasriram2909@gmail.com</code> → Save.
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-white border border-amber-200 space-y-1">
                  <span className="font-bold text-[#3F4D2A] block">🌐 Option B: Publish App for all users</span>
                  <p className="text-[#6F725F] text-[11px] leading-relaxed">
                    1. Open <a href="https://console.cloud.google.com/apis/credentials/consent" target="_blank" rel="noreferrer" className="text-[#667A45] font-bold underline">OAuth Consent Screen</a><br/>
                    2. Under Publishing Status, click <strong>PUBLISH APP</strong>.<br/>
                    3. Now any Google user can connect without 403!
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSaveCredentials} className="p-6 rounded-2xl bg-[#FFFFFF] border border-[#D8D1BC] space-y-4 shadow-sm">
              <div className="border-b border-[#D8D1BC] pb-3">
                <h4 className="text-xs font-extrabold text-[#28321D] uppercase tracking-wider flex items-center gap-2">
                  <ExternalLink className="w-4 h-4 text-[#667A45]" />
                  Enter Google OAuth 2.0 Credentials
                </h4>
                <p className="text-xs text-[#6F725F] mt-1">
                  Paste your Client ID & Secret below to connect your Google account securely.
                </p>
              </div>

              {credsMsg && (
                <div className="p-3 rounded-xl text-xs font-bold bg-[#FEF3C7] border border-[#FDE68A] text-[#92400E]">
                  {credsMsg}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-[#28321D] block mb-1">Google Client ID *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 123456789-abc.apps.googleusercontent.com"
                    value={inputClientId}
                    onChange={(e) => setInputClientId(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl glass-input text-xs text-[#28321D]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[#28321D] block mb-1">Google Client Secret *</label>
                  <input
                    type="password"
                    required
                    placeholder="e.g. GOCSPX-xxxxxxxxxxxx"
                    value={inputClientSecret}
                    onChange={(e) => setInputClientSecret(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl glass-input text-xs text-[#28321D]"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-[#D8D1BC] flex items-center justify-end">
                <button
                  type="submit"
                  disabled={savingCreds}
                  className="px-8 py-3.5 rounded-xl gradient-btn text-[#FAF8F1] font-bold text-xs inline-flex items-center gap-2 shadow-xs cursor-pointer"
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
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-[#D8D1BC] space-y-6">
        <div className="border-b border-[#D8D1BC] pb-4 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-[#28321D] flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-[#667A45]" />
              User Signature Configuration
            </h3>
            <p className="text-xs text-[#6F725F] mt-1">
              Your signature is automatically appended to generated professional emails.
            </p>
          </div>

          <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-[#28321D]">
            <input
              type="checkbox"
              checked={signature.enabled}
              onChange={(e) => setSignature({ ...signature, enabled: e.target.checked })}
              className="rounded bg-[#FAF8F1] border-[#D8D1BC] text-[#667A45] focus:ring-[#667A45] w-4 h-4"
            />
            Enable Signature
          </label>
        </div>

        <form onSubmit={handleSaveSignature} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-[#28321D] block mb-1">Full Name</label>
              <input
                type="text"
                placeholder="Alex Morgan"
                value={signature.name || ''}
                onChange={(e) => setSignature({ ...signature, name: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs text-[#28321D]"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[#28321D] block mb-1">Designation / Role</label>
              <input
                type="text"
                placeholder="Senior Software Engineer"
                value={signature.designation || ''}
                onChange={(e) => setSignature({ ...signature, designation: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs text-[#28321D]"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[#28321D] block mb-1">Company</label>
              <input
                type="text"
                placeholder="TechCorp Innovations"
                value={signature.company || ''}
                onChange={(e) => setSignature({ ...signature, company: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs text-[#28321D]"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[#28321D] block mb-1">Phone Number</label>
              <input
                type="text"
                placeholder="+1 (555) 234-5678"
                value={signature.phone || ''}
                onChange={(e) => setSignature({ ...signature, phone: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs text-[#28321D]"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            {saveSuccess && (
              <span className="text-xs text-[#137333] font-bold flex items-center gap-1">
                <Check className="w-4 h-4" /> Signature saved successfully!
              </span>
            )}
            <button
              type="submit"
              disabled={savingSig}
              className="ml-auto px-6 py-2.5 rounded-xl gradient-btn text-[#FAF8F1] text-xs font-bold flex items-center gap-2 shadow-xs cursor-pointer"
            >
              <Save className="w-4 h-4" />
              {savingSig ? 'Saving...' : 'Save Signature Settings'}
            </button>
          </div>
        </form>
      </div>

      {/* 3. Security Policy Statement */}
      <div className="glass-panel p-6 rounded-3xl border border-[#D8D1BC] text-xs text-[#6F725F] space-y-2">
        <div className="flex items-center gap-2 text-[#3F4D2A] font-extrabold">
          <Lock className="w-4 h-4 text-[#667A45]" /> Security & Privacy Assurance
        </div>
        <p>
          Scribe AI strictly adheres to explicit user confirmation principles. No email is sent without your explicit approval click in Step 4. All API keys and OAuth tokens remain securely stored server-side.
        </p>
      </div>
    </div>
  );
}
