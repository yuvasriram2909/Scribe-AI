import React, { useState, useEffect } from 'react';
import { Mail, Search, Filter, CheckCircle, Paperclip, RefreshCw, Eye, X, Trash2, AlertCircle, Clock } from 'lucide-react';
import { apiFetch } from '../utils/api';

const CATEGORIES_FILTER = [
  'All',
  'Emergency',
  'Leave',
  'Resume',
  'Official',
  'Follow-up',
  'Occasion',
  'Casual'
];

export function EmailHistory({ onReuseEmail }) {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [retryingId, setRetryingId] = useState(null);

  useEffect(() => {
    fetchEmails();
  }, [selectedCategory, selectedStatus, searchQuery]);

  const fetchEmails = async () => {
    setLoading(true);
    try {
      let url = '/api/emails?';
      if (selectedCategory !== 'All') {
        url += `category=${encodeURIComponent(selectedCategory)}&`;
      }
      if (selectedStatus !== 'All') {
        url += `status=${encodeURIComponent(selectedStatus)}&`;
      }
      if (searchQuery.trim() !== '') {
        url += `q=${encodeURIComponent(searchQuery)}`;
      }

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
    if (!window.confirm('Are you sure you want to delete this email record?')) {
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

  const getBadgeClass = (category) => {
    if (!category) return 'badge-other';
    if (category.includes('Emergency')) return 'badge-emergency';
    if (category.includes('Leave')) return 'badge-leave';
    if (category.includes('Resume')) return 'badge-resume';
    if (category.includes('Official')) return 'badge-official';
    if (category.includes('Casual')) return 'badge-casual';
    return 'badge-other';
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header & Controls */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Mail className="w-6 h-6 text-indigo-400" />
              Sent Email History & Activity
            </h2>
            <p className="text-xs text-slate-400">Complete archive of generated and sent messages with real-time status</p>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 rounded-xl glass-input text-xs text-slate-200 font-semibold"
            >
              <option value="All">All Statuses</option>
              <option value="Sent">Sent</option>
              <option value="Failed">Failed</option>
              <option value="Sending">Sending</option>
            </select>

            {/* Search Box */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search recipient, subject..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl glass-input text-xs text-white"
              />
            </div>
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 pt-2 scrollbar-none">
          <span className="text-xs font-semibold text-slate-400 mr-1 flex items-center gap-1 shrink-0">
            <Filter className="w-3.5 h-3.5" /> Category:
          </span>
          {CATEGORIES_FILTER.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 ${
                selectedCategory === cat
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'bg-slate-800/70 text-slate-400 hover:text-white hover:bg-slate-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Email History Table / List */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
        {loading ? (
          <div className="text-center py-16 text-slate-500">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 opacity-50" />
            <p className="text-xs">Loading email archive...</p>
          </div>
        ) : emails.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <Mail className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm font-semibold text-slate-400">No emails found</p>
            <p className="text-xs text-slate-600 mt-1">Try clearing filters or search queries.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {emails.map((email) => (
              <div
                key={email.id}
                className="p-5 hover:bg-slate-800/30 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full ${getBadgeClass(email.category)}`}>
                      {email.category}
                    </span>
                    {renderStatusBadge(email.status, email.errorMessage)}
                    <span className="text-xs font-mono text-indigo-300 font-semibold">{email.recipient}</span>
                  </div>

                  <h4 className="text-sm font-bold text-white truncate">{email.subject}</h4>
                  <p className="text-xs text-slate-400 line-clamp-1">{email.body}</p>

                  {email.errorMessage && (
                    <p className="text-[11px] text-red-400 font-medium flex items-center gap-1 mt-1">
                      <AlertCircle className="w-3 h-3" /> Error: {email.errorMessage}
                    </p>
                  )}

                  {email.attachments && email.attachments.length > 0 && (
                    <div className="flex items-center gap-1.5 text-[11px] text-blue-400 pt-1">
                      <Paperclip className="w-3 h-3" />
                      <span>{email.attachments.length} Attachment ({email.attachments.map(a => a.filename).join(', ')})</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3 shrink-0 sm:self-center">
                  <span className="text-[10px] text-slate-500 font-mono">
                    {new Date(email.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>

                  {email.status === 'Failed' && (
                    <button
                      onClick={(e) => handleRetryEmail(e, email)}
                      disabled={retryingId === email.id}
                      className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold hover:bg-amber-500/30 flex items-center gap-1"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${retryingId === email.id ? 'animate-spin' : ''}`} /> Retry
                    </button>
                  )}

                  <button
                    onClick={() => setSelectedEmail(email)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                    title="View Email Details"
                  >
                    <Eye className="w-4 h-4" />
                  </button>

                  <button
                    onClick={(e) => handleDeleteEmail(e, email.id)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
                    title="Delete Email"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Email Detail Modal */}
      {selectedEmail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="glass-panel max-w-2xl w-full p-6 sm:p-8 rounded-2xl border border-slate-700 space-y-6 shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full ${getBadgeClass(selectedEmail.category)}`}>
                    {selectedEmail.category}
                  </span>
                  {renderStatusBadge(selectedEmail.status, selectedEmail.errorMessage)}
                </div>
                <h3 className="text-xl font-bold text-white mt-2">{selectedEmail.subject}</h3>
              </div>
              <button
                onClick={() => setSelectedEmail(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
                <div>
                  <span className="text-slate-500 block">To:</span>
                  <span className="text-white font-mono font-medium">{selectedEmail.recipient}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Status:</span>
                  <span className="text-white font-bold">{selectedEmail.status}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Created Date:</span>
                  <span className="text-slate-300">
                    {new Date(selectedEmail.createdAt).toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Gmail Message ID:</span>
                  <span className="text-indigo-300 font-mono">{selectedEmail.gmailMessageId || 'N/A'}</span>
                </div>
              </div>

              <div>
                <span className="text-slate-400 block font-medium mb-1">Message Body:</span>
                <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 whitespace-pre-wrap text-slate-200 text-sm leading-relaxed max-h-60 overflow-y-auto">
                  {selectedEmail.body}
                </div>
              </div>

              {selectedEmail.errorMessage && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs">
                  <span className="font-bold flex items-center gap-1 text-red-400 mb-1">
                    <AlertCircle className="w-4 h-4" /> Failure Details:
                  </span>
                  <p>{selectedEmail.errorMessage}</p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              {selectedEmail.status === 'Failed' ? (
                <button
                  onClick={(e) => handleRetryEmail(e, selectedEmail)}
                  disabled={retryingId === selectedEmail.id}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg"
                >
                  <RefreshCw className={`w-4 h-4 ${retryingId === selectedEmail.id ? 'animate-spin' : ''}`} />
                  Retry Sending Now
                </button>
              ) : (
                <div></div>
              )}

              <div className="flex items-center gap-3">
                <button
                  onClick={(e) => handleDeleteEmail(e, selectedEmail.id)}
                  className="px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 text-xs font-semibold flex items-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4" /> Delete Record
                </button>

                <button
                  onClick={() => setSelectedEmail(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold"
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
