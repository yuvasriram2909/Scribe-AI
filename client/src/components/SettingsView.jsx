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
  Lock
} from 'lucide-react';
import { apiFetch, safeParseResponse, getApiBaseUrl, setCustomBackendUrl, DEFAULT_SUPABASE_EDGE_FUNCTION } from '../utils/api';

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

  // Fetch status on mount
  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      // 1. Fetch Gmail OAuth status
      const res = await apiFetch('/api/auth/status');
      const data = await safeParseResponse(res);
      setAuthStatus(data);
    } catch (err) {
      console.warn('Error fetching auth status:', err);
      setAuthStatus({
        isConnected: false,
        status: 'DISCONNECTED',
        connectedEmail: null,
        isGoogleConfigured: true,
        mode: 'Backend connecting...'
      });
    }

    try {
      // 2. Fetch user signature
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
          enabled: sigData.enabled !== undefined ? sigData.enabled : true
        });
      }
    } catch (err) {
      console.warn('Error fetching signature:', err);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect your Google Gmail account from Scribe AI?')) return;
    try {
      const res = await apiFetch('/api/auth/google/disconnect', { method: 'POST' });
      const data = await safeParseResponse(res);
      if (res.ok) {
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
            {authStatus.isConnected ? 'Gmail OAuth Active ✓' : 'Not Connected'}
          </span>
        </div>

        {authError && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold animate-fadeIn">
            {authError}
          </div>
        )}

        {authStatus.isConnected ? (
          <div className="p-5 rounded-2xl bg-[#E6F4EA] border border-[#A8DADC] space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-[#137333] shrink-0" />
                <span className="text-xs font-bold text-[#28321D]">
                  Connected account: <span className="text-[#667A45] font-mono">{authStatus.connectedEmail}</span>
                </span>
              </div>
              <button
                onClick={handleDisconnect}
                className="px-4 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold border border-red-200 transition-all cursor-pointer"
              >
                Disconnect Google
              </button>
            </div>
            <p className="text-xs text-[#6F725F]">
              All AI-generated emails are dispatched directly from your authenticated Gmail address (<span className="font-semibold text-[#28321D]">{authStatus.connectedEmail}</span>) via the official Google OAuth 2.0 Gmail API.
            </p>
          </div>
        ) : (
          <div className="p-6 rounded-2xl bg-[#FAF8F1] border border-[#D8D1BC] space-y-4 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h4 className="text-base font-extrabold text-[#28321D] flex items-center justify-center sm:justify-start gap-2">
                <Shield className="w-5 h-5 text-[#667A45]" />
                Connect with Google
              </h4>
              <p className="text-xs text-[#6F725F] mt-1 max-w-xl">
                Click the button to choose your Google account and grant 1-click Gmail sending permissions for genuine email dispatches.
              </p>
            </div>

            <button
              type="button"
              onClick={handleConnectClick}
              disabled={connectingGoogle}
              className="px-8 py-4 rounded-2xl gradient-btn text-[#FAF8F1] font-extrabold text-xs inline-flex items-center gap-2 shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer shrink-0 disabled:opacity-60"
            >
              <ExternalLink className="w-4 h-4 text-[#FAF8F1]" />
              {connectingGoogle ? 'Connecting to Google...' : '⚡ Connect with Google'}
            </button>
          </div>
        )}

        {/* Developer configuration info */}
        <div className="p-4 rounded-2xl bg-[#FAF8F1] border border-[#D8D1BC] text-[11px] text-[#6F725F] space-y-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="font-bold text-[#28321D]">Developer Note — Google Cloud Console Authorized Redirect URI:</span>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(dynamicRedirectUri);
                alert('Copied Redirect URI to clipboard!');
              }}
              className="px-2.5 py-1 rounded bg-[#667A45] hover:bg-[#3F4D2A] text-[#FAF8F1] font-bold text-[10px] cursor-pointer flex items-center gap-1"
            >
              <Copy className="w-3 h-3" />
              Copy Redirect URI
            </button>
          </div>
          <code className="block p-2 rounded bg-white border border-[#D8D1BC] font-mono text-[11px] text-[#28321D] break-all select-all font-bold">
            {dynamicRedirectUri}
          </code>
        </div>
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

          <div className="flex items-center justify-between pt-2 border-t border-[#D8D1BC]">
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
              className="px-4 py-2 rounded-xl bg-[#FAF8F1] hover:bg-[#E8DFC8] text-[#3F4D2A] border border-[#D8D1BC] text-xs font-bold cursor-pointer"
            >
              Reset to Default
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl gradient-btn text-[#FAF8F1] text-xs font-bold shadow-xs cursor-pointer"
            >
              Save Backend URL
            </button>
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
    </div>
  );
}
