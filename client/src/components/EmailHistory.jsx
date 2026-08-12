import React, { useState, useEffect } from 'react';
import { Mail, Search, Filter, CheckCircle, Paperclip, RefreshCw, Eye, X, Trash2, AlertCircle, Clock } from 'lucide-react';
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
        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#137333] bg-[#E6F4EA] border border-[#A8DADC] px-2.5 py-0.5 rounded-full">
          <CheckCircle className="w-3 h-3 text-[#667A45]" />
          ✓ Sent
        </span>
      );
    }
    if (status === 'Failed') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-700 bg-red-50 border border-red-200 px-2.5 py-0.5 rounded-full" title={errorMessage || 'Sending failed'}>
          <AlertCircle className="w-3 h-3 text-red-600 shrink-0" />
          Failed
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#6F725F] bg-[#F2EBDD] border border-[#D8D1BC] px-2.5 py-0.5 rounded-full">
        <Clock className="w-3 h-3 text-[#6F725F]" />
        {status || 'Draft'}
      </span>
    );
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Bar */}
      <div className="glass-panel p-6 rounded-3xl border border-[#D8D1BC] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-[#28321D] flex items-center gap-2">
            <Mail className="w-5 h-5 text-[#667A45]" />
            Sent Email History
          </h2>
          <p className="text-xs text-[#6F725F] mt-1">
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
                  ? 'bg-[#667A45] text-[#FAF8F1] shadow-xs'
                  : 'bg-[#FAF8F1] text-[#3F4D2A] border border-[#D8D1BC] hover:bg-[#E8DFC8]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Search Input */}
      <div className="glass-panel p-4 rounded-2xl flex items-center gap-3 border border-[#D8D1BC]">
        <Search className="w-4 h-4 text-[#667A45] shrink-0" />
        <input
          type="text"
          placeholder="Search emails by recipient, subject, or content..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-transparent text-xs text-[#28321D] focus:outline-none placeholder-[#6F725F]"
        />
      </div>

      {/* Cards List */}
      {loading ? (
        <div className="glass-panel p-12 text-center text-xs text-[#6F725F] rounded-3xl space-y-3 border border-[#D8D1BC]">
          <RefreshCw className="w-6 h-6 animate-spin text-[#667A45] mx-auto" />
          <p className="font-semibold">Loading email history...</p>
        </div>
      ) : emails.length === 0 ? (
        <div className="glass-panel p-12 text-center text-xs text-[#6F725F] rounded-3xl space-y-3 border border-[#D8D1BC]">
          <Mail className="w-8 h-8 text-[#879B62] mx-auto opacity-50" />
          <p className="font-bold text-[#28321D]">No email history found</p>
          <p className="text-[#6F725F]">No dispatched emails matching your criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {emails.map(email => (
            <div
              key={email.id}
              onClick={() => setSelectedEmail(email)}
              className="glass-card p-5 rounded-2xl space-y-3 border border-[#D8D1BC] cursor-pointer hover:scale-[1.01] transition-all flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[#3F4D2A] bg-[#E8DFC8] px-2.5 py-0.5 rounded-full border border-[#D8D1BC]">
                    {email.category || 'Email'}
                  </span>
                  {renderStatusBadge(email.status, email.errorMessage)}
                </div>

                <h3 className="text-sm font-bold text-[#28321D] line-clamp-1">
                  {email.subject}
                </h3>
                <p className="text-xs text-[#6F725F]">
                  To: <span className="font-semibold text-[#3F4D2A]">{email.recipient}</span>
                </p>
              </div>

              <div className="pt-3 border-t border-[#D8D1BC] flex items-center justify-between gap-2">
                <span className="text-[10px] text-[#6F725F]">
                  {new Date(email.createdAt).toLocaleDateString()}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedEmail(email);
                    }}
                    className="p-1.5 rounded-lg bg-[#FAF8F1] hover:bg-[#E8DFC8] text-[#3F4D2A] border border-[#D8D1BC] transition-colors cursor-pointer"
                    title="View Email"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={(e) => handleDeleteEmail(e, email.id)}
                    className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 transition-colors cursor-pointer"
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
        <div className="fixed inset-0 z-50 bg-[#28321D]/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel max-w-2xl w-full p-6 sm:p-8 rounded-3xl border border-[#D8D1BC] space-y-6 max-h-[90vh] overflow-y-auto animate-fadeIn shadow-2xl">
            <div className="flex items-start justify-between border-b border-[#D8D1BC] pb-4">
              <div>
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#E8DFC8] text-[#3F4D2A]">
                  {selectedEmail.category}
                </span>
                <h3 className="text-lg font-bold text-[#28321D] mt-2">
                  {selectedEmail.subject}
                </h3>
              </div>
              <button
                onClick={() => setSelectedEmail(null)}
                className="p-1 rounded-lg text-[#6F725F] hover:text-[#28321D] hover:bg-[#E8DFC8] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-[#3F4D2A]">
              <p><strong>To:</strong> {selectedEmail.recipient}</p>
              {selectedEmail.cc && <p><strong>CC:</strong> {selectedEmail.cc}</p>}
              {selectedEmail.bcc && <p><strong>BCC:</strong> {selectedEmail.bcc}</p>}
              <p><strong>Priority:</strong> {selectedEmail.priority || 'Normal'}</p>
              <p><strong>Tone:</strong> {selectedEmail.tone || 'Professional'}</p>
              <p><strong>Sent Date:</strong> {new Date(selectedEmail.createdAt).toLocaleString()}</p>
            </div>

            <div className="p-4 rounded-2xl bg-[#FAF8F1] border border-[#D8D1BC] text-xs text-[#28321D] whitespace-pre-wrap font-sans leading-relaxed">
              {selectedEmail.body}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={(e) => handleDeleteEmail(e, selectedEmail.id)}
                className="px-4 py-2 rounded-xl bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
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
