import React, { useState, useEffect } from 'react';
import { 
  Mail, Send, AlertTriangle, Calendar, FileText, Briefcase, Sparkles, 
  ArrowRight, CheckCircle, Trash2, Search, Filter, RefreshCw, X, AlertCircle, Clock, ShieldAlert, Heart, Users
} from 'lucide-react';
import { apiFetch } from '../utils/api';

const CATEGORIES_LIST = [
  { id: 'All', label: 'All Situations' },
  { id: 'Emergency', label: '🚨 Emergency' },
  { id: 'Important', label: '⚠️ Important / Necessary' },
  { id: 'Official', label: '💼 Official / Professional' },
  { id: 'Leave', label: '📅 Leave / Holiday' },
  { id: 'Resume', label: '📄 Resume / Job Application' },
  { id: 'Follow-up', label: '🔄 Follow-up' },
  { id: 'Casual', label: '💬 Casual' },
  { id: 'Occasion', label: '🎉 Celebration / Occasion' }
];

const STATUS_FILTERS = [
  'All',
  'Sent',
  'Failed',
  'Sending',
  'Draft'
];

export function Dashboard({ onStartCompose, onViewHistory }) {
  const [stats, setStats] = useState({
    totalEmails: 0,
    sentToday: 0,
    emergency: 0,
    leave: 0,
    resume: 0,
    official: 0
  });

  const [recentEmails, setRecentEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [retryingId, setRetryingId] = useState(null);

  // Filters & Search
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Email Detail Modal
  const [detailModalEmail, setDetailModalEmail] = useState(null);

  // Quick compose state
  const [quickInstruction, setQuickInstruction] = useState('');
  const [quickRecipient, setQuickRecipient] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, [selectedCategory, selectedStatus, searchQuery]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      let url = '/api/emails?';
      if (selectedCategory !== 'All') url += `category=${encodeURIComponent(selectedCategory)}&`;
      if (selectedStatus !== 'All') url += `status=${encodeURIComponent(selectedStatus)}&`;
      if (searchQuery.trim() !== '') url += `q=${encodeURIComponent(searchQuery)}`;

      const [statsRes, emailsRes] = await Promise.all([
        apiFetch('/api/emails/stats'),
        apiFetch(url)
      ]);

      if (statsRes.ok) setStats(await statsRes.json());
      if (emailsRes.ok) {
        const data = await emailsRes.json();
        setRecentEmails(data);
      }
    } catch (err) {
      console.error('Failed to load dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickSubmit = (e) => {
    e.preventDefault();
    if (!quickInstruction.trim()) return;
    onStartCompose({
      instruction: quickInstruction,
      recipient: quickRecipient
    });
  };

  const handleDeleteEmail = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this email record?')) {
      return;
    }

    setDeletingId(id);
    try {
      const res = await apiFetch(`/api/emails/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setRecentEmails(prev => prev.filter(email => email.id !== id));
        if (detailModalEmail?.id === id) setDetailModalEmail(null);
        fetchDashboardData();
      }
    } catch (err) {
      console.error('Error deleting email:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const handleRetryEmail = async (e, email) => {
    e.stopPropagation();
    setRetryingId(email.id);
    try {
      const res = await apiFetch(`/api/emails/${email.id}/retry`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setRecentEmails(prev => prev.map(item => item.id === email.id ? data.email : item));
        if (detailModalEmail?.id === email.id) setDetailModalEmail(data.email);
        alert(`✅ Email retried and sent successfully to ${email.recipient}!`);
        fetchDashboardData();
      } else {
        alert(`❌ Retry failed: ${data.error || 'Check Gmail OAuth connection.'}`);
      }
    } catch (err) {
      console.error('Retry error:', err);
      alert(`❌ Retry error: ${err.message}`);
    } finally {
      setRetryingId(null);
    }
  };

  const renderStatusBadge = (status, errorMessage) => {
    if (status === 'Sent') {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full">
          <CheckCircle className="w-3 h-3 text-emerald-400" />
          Sent
        </span>
      );
    }
    if (status === 'Failed') {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-400 bg-red-500/10 border border-red-500/30 px-2 py-0.5 rounded-full" title={errorMessage || 'Sending failed'}>
          <AlertCircle className="w-3 h-3 text-red-400 shrink-0" />
          Failed
        </span>
      );
    }
    if (status === 'Sending') {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/30 px-2 py-0.5 rounded-full animate-pulse">
          <RefreshCw className="w-3 h-3 text-indigo-400 animate-spin" />
          Sending...
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-400 bg-slate-800 border border-slate-700 px-2 py-0.5 rounded-full">
        <Clock className="w-3 h-3 text-slate-400" />
        {status || 'Draft'}
      </span>
    );
  };

  const getCategoryBadgeClass = (category) => {
    if (!category) return 'badge-official';
    if (category.includes('Emergency')) return 'badge-emergency';
    if (category.includes('Leave')) return 'badge-leave';
    if (category.includes('Resume')) return 'badge-resume';
    if (category.includes('Official')) return 'badge-official';
    if (category.includes('Casual')) return 'badge-casual';
    if (category.includes('Occasion')) return 'badge-leave';
    if (category.includes('Follow-up')) return 'badge-resume';
    return 'badge-official';
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      
      {/* Hero Welcome & Quick Compose Section */}
      <div className="relative overflow-hidden rounded-2xl glass-panel p-8 border border-indigo-500/20">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-1/3 -mb-8 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-4">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-spin-slow" />
            AI Smart Sender Real-Time Engine
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-3">
            What do you want to send today?
          </h1>
          <p className="text-slate-400 text-sm sm:text-base mb-6">
            Enter a single line instruction. AI classifies, generates, previews, and dispatches via Gmail with real-time status tracking.
          </p>

          {/* Quick Compose Form */}
          <form onSubmit={handleQuickSubmit} className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder='e.g., "I am on leave for 3 days." or "Send my resume for developer position."'
                  value={quickInstruction}
                  onChange={(e) => setQuickInstruction(e.target.value)}
                  className="w-full pl-4 pr-4 py-3.5 rounded-xl glass-input text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="w-full sm:w-64 relative">
                <input
                  type="email"
                  placeholder="Recipient (e.g. manager@company.com)"
                  value={quickRecipient}
                  onChange={(e) => setQuickRecipient(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-xl glass-input text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <button
                type="submit"
                className="px-6 py-3.5 rounded-xl gradient-btn text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25 hover:scale-[1.02] active:scale-[0.98] transition-transform"
              >
                <Sparkles className="w-4 h-4 text-indigo-200" />
                Generate Email
              </button>
            </div>
            
            {/* Quick Suggestions */}
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 pt-1">
              <span className="text-slate-500 font-medium">Try:</span>
              <button
                type="button"
                onClick={() => setQuickInstruction('I am on leave for 3 days.')}
                className="px-2.5 py-1 rounded-md bg-slate-800/60 hover:bg-slate-700/60 text-slate-300 transition-colors border border-slate-700/50"
              >
                🏖️ Leave for 3 days
              </button>
              <button
                type="button"
                onClick={() => setQuickInstruction('I need emergency leave for 1 hour.')}
                className="px-2.5 py-1 rounded-md bg-slate-800/60 hover:bg-slate-700/60 text-slate-300 transition-colors border border-slate-700/50"
              >
                🚨 Emergency leave 1hr
              </button>
              <button
                type="button"
                onClick={() => setQuickInstruction('Send my resume for a software developer position.')}
                className="px-2.5 py-1 rounded-md bg-slate-800/60 hover:bg-slate-700/60 text-slate-300 transition-colors border border-slate-700/50"
              >
                📄 Send Resume
              </button>
              <button
                type="button"
                onClick={() => setQuickInstruction('Tell my client that the project update is ready for review.')}
                className="px-2.5 py-1 rounded-md bg-slate-800/60 hover:bg-slate-700/60 text-slate-300 transition-colors border border-slate-700/50"
              >
                💼 Work status update
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Metrics Counter Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="glass-panel p-4 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Total Emails</span>
            <Mail className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-2xl font-bold text-white">{stats.totalEmails}</p>
          <span className="text-[10px] text-slate-500">Processed overall</span>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Sent Today</span>
            <Send className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-emerald-400">{stats.sentToday}</p>
          <span className="text-[10px] text-emerald-500/80">Active dispatch</span>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Emergency</span>
            <AlertTriangle className="w-4 h-4 text-red-400" />
          </div>
          <p className="text-2xl font-bold text-red-400">{stats.emergency}</p>
          <span className="text-[10px] text-red-500/80">High priority</span>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Leave</span>
            <Calendar className="w-4 h-4 text-emerald-300" />
          </div>
          <p className="text-2xl font-bold text-emerald-300">{stats.leave}</p>
          <span className="text-[10px] text-slate-500">Holiday requests</span>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Resume</span>
            <FileText className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-2xl font-bold text-blue-400">{stats.resume}</p>
          <span className="text-[10px] text-slate-500">Job applications</span>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Official</span>
            <Briefcase className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-2xl font-bold text-purple-400">{stats.official}</p>
          <span className="text-[10px] text-slate-500">Client updates</span>
        </div>
      </div>

      {/* Real-Time Email Activity & Recent Emails System */}
      <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-slate-800 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Mail className="w-5 h-5 text-indigo-400" />
              Real-Time Email Activity
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Live status tracking & activity log across all 8 supported categories</p>
          </div>

          {/* Search & Status Filters */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative w-full sm:w-60">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search recipient, subject..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-2 rounded-xl glass-input text-xs text-white"
              />
            </div>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 rounded-xl glass-input text-xs text-slate-200 font-semibold"
            >
              {STATUS_FILTERS.map(st => (
                <option key={st} value={st}>Status: {st}</option>
              ))}
            </select>

            <button
              onClick={onViewHistory}
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors ml-auto"
            >
              All History <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Category Filters Toolbar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
          {CATEGORIES_LIST.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat.id
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-slate-800/60 text-slate-400 hover:bg-slate-700/60 hover:text-slate-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Email Cards Grid */}
        {loading ? (
          <div className="text-center py-12 text-slate-500 animate-pulse">
            <RefreshCw className="w-8 h-8 mx-auto mb-2 animate-spin text-indigo-400" />
            <p className="text-xs font-medium">Syncing email status from server...</p>
          </div>
        ) : recentEmails.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <Mail className="w-10 h-10 mx-auto mb-2 opacity-40 text-slate-400" />
            <p className="text-sm font-semibold text-slate-300">No email activity matching your filter.</p>
            <p className="text-xs text-slate-500 mt-1">Compose a new email or change category/status filter.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentEmails.map((email) => (
              <div
                key={email.id}
                onClick={() => setDetailModalEmail(email)}
                className="p-5 rounded-2xl glass-card flex flex-col justify-between gap-4 border border-slate-800/80 hover:border-indigo-500/40 transition-all cursor-pointer group shadow-lg"
              >
                <div className="space-y-2 min-w-0">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${getCategoryBadgeClass(email.situation || email.category)}`}>
                        {email.situation || email.category}
                      </span>
                      <span className="text-[10px] font-bold text-slate-300">
                        {email.priority === 'High' ? '🔴 High' : email.priority === 'Medium' ? '🟡 Medium' : '🟢 Normal'}
                      </span>
                    </div>
                  </div>

                  <div className="pt-1">
                    <span className="text-[11px] font-mono text-indigo-300 block font-semibold truncate">
                      To: {email.recipient}
                    </span>
                    {(email.cc || email.bcc) && (
                      <span className="text-[10px] font-mono text-slate-500 block truncate">
                        {email.cc && `CC: ${email.cc}`} {email.bcc && `BCC: ${email.bcc}`}
                      </span>
                    )}
                  </div>

                  <h4 className="text-sm font-bold text-slate-100 truncate group-hover:text-indigo-300 transition-colors">
                    {email.subject}
                  </h4>
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed font-sans">
                    {email.body}
                  </p>

                  {email.errorMessage && (
                    <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-[11px] flex items-center justify-between gap-2 mt-2">
                      <span className="truncate">{email.errorMessage}</span>
                      <button
                        onClick={(e) => handleRetryEmail(e, email)}
                        disabled={retryingId === email.id}
                        className="px-2 py-1 rounded bg-red-600 hover:bg-red-500 text-white font-bold text-[10px] shrink-0 flex items-center gap-1 shadow"
                      >
                        <RefreshCw className={`w-3 h-3 ${retryingId === email.id ? 'animate-spin' : ''}`} />
                        Retry
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-800/60 text-xs">
                  <span className="text-[10px] text-slate-500">
                    {new Date(email.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>

                  <div className="flex items-center gap-2">
                    {email.status === 'Failed' && (
                      <button
                        onClick={(e) => handleRetryEmail(e, email)}
                        disabled={retryingId === email.id}
                        className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-semibold hover:bg-amber-500/30 flex items-center gap-1"
                      >
                        <RefreshCw className={`w-3 h-3 ${retryingId === email.id ? 'animate-spin' : ''}`} /> Retry
                      </button>
                    )}
                    <button
                      onClick={(e) => handleDeleteEmail(e, email.id)}
                      disabled={deletingId === email.id}
                      className="p-1 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      title="Delete email record"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* FULL EMAIL DETAILS MODAL */}
      {detailModalEmail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="glass-panel max-w-2xl w-full p-6 sm:p-8 rounded-2xl border border-indigo-500/30 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <span className={`text-xs font-bold px-3 py-1 rounded-full ${getCategoryBadgeClass(detailModalEmail.category)}`}>
                  {detailModalEmail.category}
                </span>
                {renderStatusBadge(detailModalEmail.status, detailModalEmail.errorMessage)}
              </div>

              <button
                onClick={() => setDetailModalEmail(null)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">To:</span>
                  <span className="text-indigo-300 font-mono font-semibold">{detailModalEmail.recipient}</span>
                </div>
                {detailModalEmail.cc && (
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">CC:</span>
                    <span className="text-slate-300 font-mono">{detailModalEmail.cc}</span>
                  </div>
                )}
                {detailModalEmail.bcc && (
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">BCC:</span>
                    <span className="text-slate-300 font-mono">{detailModalEmail.bcc}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Date & Time:</span>
                  <span className="text-slate-300">{new Date(detailModalEmail.createdAt).toLocaleString()}</span>
                </div>
                {detailModalEmail.sentAt && (
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Gmail Sent Timestamp:</span>
                    <span className="text-emerald-400 font-mono">{new Date(detailModalEmail.sentAt).toLocaleString()}</span>
                  </div>
                )}
              </div>

              <div>
                <span className="text-slate-500 font-medium block mb-1">Subject Line:</span>
                <h3 className="text-sm font-bold text-white bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                  {detailModalEmail.subject}
                </h3>
              </div>

              <div>
                <span className="text-slate-500 font-medium block mb-1">Email Body Prose:</span>
                <div className="p-4 rounded-lg bg-slate-900/60 border border-slate-800 whitespace-pre-wrap text-slate-200 text-xs leading-relaxed min-h-[140px]">
                  {detailModalEmail.body}
                </div>
              </div>

              {detailModalEmail.errorMessage && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs space-y-2">
                  <span className="font-bold flex items-center gap-1 text-red-400">
                    <AlertCircle className="w-4 h-4" /> Failure Details:
                  </span>
                  <p>{detailModalEmail.errorMessage}</p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              {detailModalEmail.status === 'Failed' ? (
                <button
                  onClick={(e) => handleRetryEmail(e, detailModalEmail)}
                  disabled={retryingId === detailModalEmail.id}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/30"
                >
                  <RefreshCw className={`w-4 h-4 ${retryingId === detailModalEmail.id ? 'animate-spin' : ''}`} />
                  Retry Sending Now
                </button>
              ) : (
                <div></div>
              )}

              <div className="flex items-center gap-3">
                <button
                  onClick={(e) => handleDeleteEmail(e, detailModalEmail.id)}
                  className="px-4 py-2.5 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 text-xs font-semibold"
                >
                  Delete Record
                </button>

                <button
                  onClick={() => setDetailModalEmail(null)}
                  className="px-6 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:text-white text-xs font-semibold"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
