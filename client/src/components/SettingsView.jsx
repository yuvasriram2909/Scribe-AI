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

  const handleConnectClick = async () => {
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
        alert('Google OAuth service is currently unavailable. Please try again later.');
      }
    } catch (e) {
      alert('Unable to connect to Google OAuth endpoint. Please check your network connection.');
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
