import React, { useState, useEffect } from 'react';
import { Mail, Search, Filter, CheckCircle, Paperclip, RefreshCw, Eye, X, Trash2, AlertCircle, Clock, Send } from 'lucide-react';
import { apiFetch } from '../utils/api';

const CATEGORIES_FILTER = [
  'All',
  'Emergency',
  'Important',
  'Official',
  'Leave',
  'Resume',
  'Follow-up',
  'Casual',
  'Celebration'
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
    if (!window.confirm('Are you sure you want to move this email record to trash?')) {
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
        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-300 bg-emerald-950/80 border border-emerald-500/40 px-2.5 py-0.5 rounded-full">
          <CheckCircle className="w-3 h-3 text-emerald-400" />
          ✓ Sent
        </span>
      );
    }
    if (status === 'Failed') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-300 bg-rose-950/80 border border-rose-500/40 px-2.5 py-0.5 rounded-full" title={errorMessage || 'Sending failed'}>
          <AlertCircle className="w-3 h-3 text-rose-400 shrink-0" />
          Failed
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-400 bg-slate-800 border border-slate-700 px-2.5 py-0.5 rounded-full">
        <Clock className="w-3 h-3 text-slate-400" />
        {status || 'Draft'}
      </span>
    );
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Bar */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <Mail className="w-5 h-5 text-purple-400" />
            Sent Email History
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Complete archive of generated and dispatched Gmail messages
          </p>
        </div>

        {/* Filter Badges */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
          {CATEGORIES_FILTER.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'gradient-btn text-white shadow-md'
                  : 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Search Input */}
      <div className="glass-panel p-4 rounded-2xl flex items-center gap-3 border border-slate-800 shadow-lg">
        <Search className="w-4 h-4 text-purple-400 shrink-0" />
        <input
          type="text"
          placeholder="Search emails by recipient, subject, or content..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-transparent text-xs text-white focus:outline-none placeholder-slate-500"
        />
      </div>

      {/* Cards List */}
      {loading ? (
        <div className="glass-panel p-12 text-center text-xs text-slate-400 rounded-3xl space-y-3 border border-slate-800">
          <RefreshCw className="w-6 h-6 animate-spin text-purple-400 mx-auto" />
          <p className="font-semibold">Loading email history...</p>
        </div>
      ) : emails.length === 0 ? (
        <div className="glass-panel p-12 text-center text-xs text-slate-400 rounded-3xl space-y-3 border border-slate-800 shadow-xl">
          <Mail className="w-8 h-8 text-purple-400 mx-auto opacity-50" />
          <p className="font-bold text-white">No email history found</p>
          <p className="text-slate-400">No dispatched emails matching your criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {emails.map(email => (
            <div
              key={email.id}
              onClick={() => setSelectedEmail(email)}
              className="glass-card p-5 rounded-2xl space-y-3 border border-slate-800 cursor-pointer hover:scale-[1.01] transition-all flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-purple-300 bg-purple-950/60 px-2.5 py-0.5 rounded-full border border-purple-500/30">
                    {email.category || 'Email'}
                  </span>
                  {renderStatusBadge(email.status, email.errorMessage)}
                </div>

                <h3 className="text-sm font-bold text-white line-clamp-1">
                  {email.subject}
                </h3>
                <p className="text-xs text-slate-400">
                  To: <span className="font-semibold text-cyan-300 font-mono">{email.recipient}</span>
                </p>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                <span className="text-[10px] text-slate-500">
                  {new Date(email.createdAt).toLocaleDateString()}
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
                    title="Move to Trash"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {selectedEmail && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel max-w-2xl w-full p-6 sm:p-8 rounded-3xl border border-slate-700 space-y-6 max-h-[90vh] overflow-y-auto animate-fadeIn shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-purple-950/60 text-purple-300 border border-purple-500/30">
                  {selectedEmail.category}
                </span>
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

            <div className="space-y-2.5 text-xs text-slate-300 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
              <p><strong>To:</strong> <span className="font-mono text-cyan-300">{selectedEmail.recipient}</span></p>
              {selectedEmail.cc && <p><strong>CC:</strong> <span className="font-mono">{selectedEmail.cc}</span></p>}
              {selectedEmail.bcc && <p><strong>BCC:</strong> <span className="font-mono">{selectedEmail.bcc}</span></p>}
              <p><strong>Priority:</strong> <span className="text-white">{selectedEmail.priority || 'Normal'}</span></p>
              <p><strong>Tone:</strong> <span className="text-white">{selectedEmail.tone || 'Professional'}</span></p>
              <p><strong>Sent Date:</strong> {new Date(selectedEmail.createdAt).toLocaleString()}</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 text-xs text-slate-200 whitespace-pre-wrap font-sans leading-relaxed">
              {selectedEmail.body}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
              <button
                onClick={(e) => handleDeleteEmail(e, selectedEmail.id)}
                className="px-4 py-2 rounded-xl bg-rose-950/60 text-rose-300 border border-rose-500/30 hover:bg-rose-900/80 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Trash2 className="w-4 h-4" />
                Move to Trash
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
