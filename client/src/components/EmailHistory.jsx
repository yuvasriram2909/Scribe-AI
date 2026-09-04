import React, { useState, useEffect } from 'react';
import { Mail, Search, Filter, CheckCircle, Paperclip, RefreshCw, Eye, X, Trash2, AlertCircle, Clock, Send, Inbox, ArrowUpRight, ArrowDownLeft, ShieldAlert } from 'lucide-react';
import { apiFetch } from '../utils/api';
import { subscribeToEmailChanges } from '../utils/supabaseClient';

const CATEGORIES_FILTER = [
  'All',
  'Leave Request',
  'Emergency',
  'Job Application',
  'Official',
  'Meeting',
  'Payment',
  'Follow-up',
  'Complaint',
  'Request',
  'Other'
];

const TONES_FILTER = ['All', 'Professional', 'Formal', 'Friendly', 'Urgent', 'Polite', 'Apologetic', 'Concise'];
const IMPORTANCE_FILTER = ['All', 'Low', 'Normal', 'High', 'Critical'];
const DIRECTION_FILTER = ['All', 'Sent', 'Received', 'Drafts'];
const STATUS_FILTER = ['All', 'Sent', 'Received', 'Draft', 'Scheduled', 'Failed', 'Spam'];
const DATE_RANGES = [
  { id: 'All', label: 'All Time' },
  { id: 'today', label: 'Today' },
  { id: 'week', label: 'Last 7 Days' },
  { id: 'month', label: 'Last 30 Days' }
];

export function EmailHistory({ onReuseEmail }) {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [selectedDirection, setSelectedDirection] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedTone, setSelectedTone] = useState('All');
  const [selectedImportance, setSelectedImportance] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedDateRange, setSelectedDateRange] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [retryingId, setRetryingId] = useState(null);

  const hasActiveFilters = selectedDirection !== 'All' || selectedCategory !== 'All' || selectedTone !== 'All' || selectedImportance !== 'All' || selectedStatus !== 'All' || selectedDateRange !== 'All' || searchQuery.trim() !== '';

  const handleResetFilters = () => {
    setSelectedDirection('All');
    setSelectedCategory('All');
    setSelectedTone('All');
    setSelectedImportance('All');
    setSelectedStatus('All');
    setSelectedDateRange('All');
    setSearchQuery('');
  };

  useEffect(() => {
    fetchEmails();

    // Auto-sync Gmail in background on mount
    apiFetch('/api/gmail/sync', { method: 'POST' })
      .then(r => r.json())
      .then(d => {
        if (d?.newReceived > 0 || d?.newSent > 0 || d?.newSpam > 0) {
          fetchEmails();
        }
      })
      .catch(() => {});

    // Supabase Realtime Listener
    const unsubscribe = subscribeToEmailChanges(localStorage.getItem('userId') || localStorage.getItem('userEmail') || '', () => {
      fetchEmails();
    });

    const interval = setInterval(fetchEmails, 15000);
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
      clearInterval(interval);
    };
  }, [selectedDirection, selectedCategory, selectedTone, selectedImportance, selectedStatus, selectedDateRange, searchQuery]);

  const handleManualSync = async () => {
    if (syncing) return;
    setSyncing(true);
    try {
      const res = await apiFetch('/api/gmail/sync', { method: 'POST' });
      const data = await res.json();
      await fetchEmails();
      if (data?.newReceived > 0 || data?.newSent > 0) {
        alert(`Synced ${data.newReceived || 0} received and ${data.newSent || 0} sent emails from Gmail!`);
      }
    } catch (e) {
      console.warn('Manual sync notice:', e);
    } finally {
      setSyncing(false);
    }
  };

  const fetchEmails = async () => {
    setLoading(true);
    try {
      let url = '/api/emails?';
      if (selectedDirection !== 'All') url += `direction=${encodeURIComponent(selectedDirection)}&`;
      if (selectedCategory !== 'All') url += `category=${encodeURIComponent(selectedCategory)}&`;
      if (selectedTone !== 'All') url += `tone=${encodeURIComponent(selectedTone)}&`;
      if (selectedImportance !== 'All') url += `importance=${encodeURIComponent(selectedImportance)}&`;
      if (selectedStatus !== 'All') url += `status=${encodeURIComponent(selectedStatus)}&`;
      if (selectedDateRange !== 'All') url += `dateRange=${encodeURIComponent(selectedDateRange)}&`;
      if (searchQuery.trim() !== '') url += `q=${encodeURIComponent(searchQuery)}`;

      const res = await apiFetch(url);
      if (res.ok) {
        setEmails(await res.json());
      }
    } catch (err) {
      console.error('Failed to fetch email history:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEmail = async (e, id) => {
    if (e) e.stopPropagation();
    if (!window.confirm('Are you sure you want to remove this email record from history?')) {
      return;
    }

    try {
      const res = await apiFetch(`/api/emails/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setEmails(prev => prev.filter(email => email.id !== id));
        if (selectedEmail?.id === id) setSelectedEmail(null);
      }
    } catch (err) {
      console.error('Failed to delete email:', err);
    }
  };

  const handleRetryEmail = async (e, email) => {
    if (e) e.stopPropagation();
    setRetryingId(email.id);
    try {
      const res = await apiFetch(`/api/emails/${email.id}/retry`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setEmails(prev => prev.map(item => item.id === email.id ? data.email : item));
        if (selectedEmail?.id === email.id) setSelectedEmail(data.email);
        alert(`✅ Email retried and sent successfully to ${email.recipient}!`);
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

  const renderEmailBadge = (email) => {
    const isSpam = email.isSpam || email.spam_status === 'spam' || (email.status || '').toLowerCase() === 'spam';
    if (isSpam) {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-300 bg-amber-950/80 border border-amber-500/40 px-2.5 py-0.5 rounded-full shadow-sm">
          <ShieldAlert className="w-3 h-3 text-amber-400" />
          Spam
        </span>
      );
    }
    const isDraft = email.isDraft || email.direction === 'draft' || (email.status || '').toLowerCase() === 'draft';
    if (isDraft) {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-purple-300 bg-purple-950/80 border border-purple-500/40 px-2.5 py-0.5 rounded-full shadow-sm">
          <Clock className="w-3 h-3 text-purple-400" />
          Draft
        </span>
      );
    }
    const isReceived = email.isReceived || email.direction === 'received' || (email.status || '').toLowerCase() === 'received';
    if (isReceived) {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-300 bg-blue-950/80 border border-blue-500/40 px-2.5 py-0.5 rounded-full shadow-sm">
          <ArrowDownLeft className="w-3 h-3 text-blue-400" />
          Received
        </span>
      );
    }
    const isSent = email.isSent || email.direction === 'sent' || (email.status || '').toLowerCase() === 'sent' || (email.status || '').toLowerCase() === 'delivered';
    if (isSent) {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-300 bg-emerald-950/80 border border-emerald-500/40 px-2.5 py-0.5 rounded-full shadow-sm">
          <ArrowUpRight className="w-3 h-3 text-emerald-400" />
          Sent
        </span>
      );
    }
    if ((email.status || '').toLowerCase() === 'failed') {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-300 bg-rose-950/80 border border-rose-500/40 px-2.5 py-0.5 rounded-full shadow-sm" title={email.errorMessage || 'Sending failed'}>
          <AlertCircle className="w-3 h-3 text-rose-400 shrink-0" />
          Failed
        </span>
      );
    }
    if ((email.status || '').toLowerCase() === 'scheduled') {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-300 bg-amber-950/80 border border-amber-500/40 px-2.5 py-0.5 rounded-full shadow-sm">
          <Clock className="w-3 h-3 text-amber-400" />
          Scheduled
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-300 bg-slate-800 border border-slate-700 px-2.5 py-0.5 rounded-full">
        {email.status || 'Email'}
      </span>
    );
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Bar */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <Mail className="w-5 h-5 text-purple-400" />
            Real-time Email History & Archives
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real records loaded directly from Supabase with live synchronisation
          </p>
        </div>

        {/* Direction Segmented Control */}
        <div className="flex items-center bg-slate-900/90 p-1 rounded-2xl border border-slate-800">
          {DIRECTION_FILTER.map(dir => (
            <button
              key={dir}
              onClick={() => setSelectedDirection(dir)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedDirection === dir
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {dir === 'Sent' && <ArrowUpRight className="w-3 h-3 text-emerald-400" />}
              {dir === 'Received' && <ArrowDownLeft className="w-3 h-3 text-blue-400" />}
              {dir === 'Drafts' && <Clock className="w-3 h-3 text-purple-400" />}
              {dir}
            </button>
          ))}
        </div>
      </div>

      {/* Multi-Facet Filter Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-wrap items-center gap-3 shadow-lg">
        {/* Category Dropdown */}
        <div className="flex items-center gap-1.5 text-xs text-slate-300">
          <span className="text-slate-500 font-semibold text-[11px]">Category:</span>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-white rounded-xl px-2.5 py-1.5 text-xs focus:outline-none focus:border-purple-500"
          >
            {CATEGORIES_FILTER.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* Tone Dropdown */}
        <div className="flex items-center gap-1.5 text-xs text-slate-300">
          <span className="text-slate-500 font-semibold text-[11px]">Tone:</span>
          <select
            value={selectedTone}
            onChange={(e) => setSelectedTone(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-white rounded-xl px-2.5 py-1.5 text-xs focus:outline-none focus:border-purple-500"
          >
            {TONES_FILTER.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        {/* Importance Dropdown */}
        <div className="flex items-center gap-1.5 text-xs text-slate-300">
          <span className="text-slate-500 font-semibold text-[11px]">Importance:</span>
          <select
            value={selectedImportance}
            onChange={(e) => setSelectedImportance(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-white rounded-xl px-2.5 py-1.5 text-xs focus:outline-none focus:border-purple-500"
          >
            {IMPORTANCE_FILTER.map(i => <option key={i} value={i}>{i}</option>)}
          </select>
        </div>

        {/* Status Dropdown */}
        <div className="flex items-center gap-1.5 text-xs text-slate-300">
          <span className="text-slate-500 font-semibold text-[11px]">Status:</span>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-white rounded-xl px-2.5 py-1.5 text-xs focus:outline-none focus:border-purple-500"
          >
            {STATUS_FILTER.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {/* Date Range Dropdown */}
        <div className="flex items-center gap-1.5 text-xs text-slate-300">
          <span className="text-slate-500 font-semibold text-[11px]">Date:</span>
          <select
            value={selectedDateRange}
            onChange={(e) => setSelectedDateRange(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-white rounded-xl px-2.5 py-1.5 text-xs focus:outline-none focus:border-purple-500"
          >
            {DATE_RANGES.map(d => <option key={d.id} value={d.id}>{d.label}</option>)}
          </select>
        </div>

        {/* Search Input */}
        <div className="flex-1 min-w-[200px] flex items-center gap-2 bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-700">
          <Search className="w-3.5 h-3.5 text-purple-400 shrink-0" />
          <input
            type="text"
            placeholder="Search subject, recipient, body..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent text-xs text-white focus:outline-none placeholder-slate-500"
          />
        </div>

        {hasActiveFilters && (
          <button
            onClick={handleResetFilters}
            className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1 border border-slate-700 cursor-pointer transition-colors"
            title="Reset all active filters"
          >
            <X className="w-3 h-3 text-rose-400" />
            <span>Clear</span>
          </button>
        )}

        {/* Manual Gmail Sync Button */}
        <button
          onClick={handleManualSync}
          disabled={syncing}
          className="px-3 py-1.5 rounded-xl bg-purple-950/60 hover:bg-purple-900/80 border border-purple-500/40 text-purple-200 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 disabled:opacity-50 shadow-sm"
          title="Synchronize incoming and outgoing emails from connected Gmail"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-purple-300 ${syncing ? 'animate-spin' : ''}`} />
          <span>{syncing ? 'Syncing...' : 'Sync Gmail'}</span>
        </button>
      </div>

      {/* Cards List */}
      {loading ? (
        <div className="glass-panel p-12 text-center text-xs text-slate-400 rounded-3xl space-y-3 border border-slate-800">
          <RefreshCw className="w-6 h-6 animate-spin text-purple-400 mx-auto" />
          <p className="font-semibold">Loading verified emails from Supabase...</p>
        </div>
      ) : emails.length === 0 ? (
        <div className="glass-panel p-12 text-center text-xs text-slate-400 rounded-3xl space-y-3 border border-slate-800 shadow-xl">
          <Mail className="w-8 h-8 text-purple-400 mx-auto opacity-50" />
          <p className="font-bold text-white text-sm">No email records found</p>
          <p className="text-slate-400">No emails matched your selected filters.</p>
          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className="mt-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all cursor-pointer shadow-lg"
            >
              Reset All Filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {emails.map(email => {
            const isDraft = email.isDraft || email.direction === 'draft' || (email.status || '').toLowerCase() === 'draft';
            const isReceived = !isDraft && (email.isReceived || email.direction === 'received' || email.status === 'Received');
            const cat = email.category || email.email_type || 'General';
            const tone = email.tone || 'Professional';
            const priority = email.priority || email.importance || 'Normal';
            const dateStr = new Date(email.sentAt || email.receivedAt || email.createdAt).toLocaleString();

            return (
              <div
                key={email.id}
                onClick={() => setSelectedEmail(email)}
                className="glass-card p-5 rounded-2xl space-y-3 border border-slate-800 cursor-pointer hover:scale-[1.01] transition-all flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-1 flex-wrap">
                    <span className="text-[10px] font-bold text-purple-300 bg-purple-950/60 px-2 py-0.5 rounded-full border border-purple-500/30">
                      {cat}
                    </span>
                    {renderEmailBadge(email)}
                  </div>

                  <h3 className="text-sm font-bold text-white line-clamp-1">
                    {email.subject || '(No Subject)'}
                  </h3>
                  <p className="text-xs text-slate-400 line-clamp-1">
                    {isReceived ? (
                      <>From: <span className="font-semibold text-purple-300 font-mono">{email.sender || email.sender_email || email.gmailAccount || 'External Sender'}</span></>
                    ) : isDraft ? (
                      <>Draft To: <span className="font-semibold text-cyan-300 font-mono">{email.recipient || email.recipient_email || '(Unspecified)'}</span></>
                    ) : (
                      <>To: <span className="font-semibold text-cyan-300 font-mono">{email.recipient || email.recipient_email}</span></>
                    )}
                  </p>

                  <div className="flex items-center gap-2 pt-1 text-[10px] text-slate-400">
                    <span className="bg-slate-800 px-2 py-0.5 rounded-md border border-slate-700">Tone: {tone}</span>
                    <span className={`px-2 py-0.5 rounded-md border ${
                      priority === 'High' || priority === 'Critical'
                        ? 'bg-rose-950/50 text-rose-300 border-rose-500/30'
                        : 'bg-slate-800 border-slate-700 text-slate-300'
                    }`}>
                      Priority: {priority}
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                  <span className="text-[10px] text-slate-500">
                    {dateStr}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedEmail(email);
                      }}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
                      title="View Email"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={(e) => handleDeleteEmail(e, email.id)}
                      className="p-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-500/30 transition-colors cursor-pointer"
                      title="Delete Record"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Modal */}
      {selectedEmail && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel max-w-2xl w-full p-6 sm:p-8 rounded-3xl border border-slate-700 space-y-6 max-h-[90vh] overflow-y-auto animate-fadeIn shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-purple-950/60 text-purple-300 border border-purple-500/30">
                    {selectedEmail.category || selectedEmail.email_type}
                  </span>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                    {selectedEmail.tone || 'Professional'}
                  </span>
                  <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                    (selectedEmail.priority || selectedEmail.importance) === 'High' || (selectedEmail.priority || selectedEmail.importance) === 'Critical'
                      ? 'bg-rose-950/60 text-rose-300 border-rose-500/30'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}>
                    Priority: {selectedEmail.priority || selectedEmail.importance || 'Normal'}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white mt-2">
                  {selectedEmail.subject}
                </h3>
              </div>
              <button
                onClick={() => setSelectedEmail(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs text-slate-300 bg-slate-900/60 p-4 rounded-2xl border border-slate-800 font-mono">
              <p><strong className="text-purple-400">Direction:</strong> {(selectedEmail.isDraft || (selectedEmail.status || '').toLowerCase() === 'draft') ? 'Draft (Unsent)' : (selectedEmail.direction || (selectedEmail.isReceived ? 'Received' : 'Sent'))}</p>
              {(selectedEmail.sender || selectedEmail.sender_email) ? (
                <p><strong className="text-purple-400">From:</strong> {selectedEmail.sender || selectedEmail.sender_email}</p>
              ) : selectedEmail.isReceived ? (
                <p><strong className="text-purple-400">From:</strong> External Sender</p>
              ) : null}
              <p><strong className="text-purple-400">To:</strong> {selectedEmail.recipient || selectedEmail.recipient_email || '(Unspecified)'}</p>
              {selectedEmail.cc && <p><strong className="text-purple-400">Cc:</strong> {selectedEmail.cc}</p>}
              {selectedEmail.bcc && <p><strong className="text-purple-400">Bcc:</strong> {selectedEmail.bcc}</p>}
              <p><strong className="text-purple-400">Status:</strong> {selectedEmail.status}</p>
              {selectedEmail.gmailMessageId && (
                <p><strong className="text-purple-400">Gmail Message ID:</strong> {selectedEmail.gmailMessageId}</p>
              )}
              <p><strong className="text-purple-400">Timestamp:</strong> {new Date(selectedEmail.sentAt || selectedEmail.receivedAt || selectedEmail.createdAt).toLocaleString()}</p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400">Email Body:</label>
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-200 whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto">
                {selectedEmail.body}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              {onReuseEmail && (
                <button
                  onClick={() => {
                    onReuseEmail(selectedEmail);
                    setSelectedEmail(null);
                  }}
                  className="gradient-btn text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-lg flex items-center gap-2"
                >
                  <Send className="w-3.5 h-3.5" />
                  Reuse as Template
                </button>
              )}
              <button
                onClick={() => setSelectedEmail(null)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-5 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
