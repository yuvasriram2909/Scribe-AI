import React, { useState, useEffect } from 'react';
import { Trash2, RefreshCw, AlertCircle, CheckCircle, Search, RotateCcw, XCircle } from 'lucide-react';
import { apiFetch } from '../utils/api';

export function TrashView() {
  const [trashedEmails, setTrashedEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEmail, setSelectedEmail] = useState(null);

  useEffect(() => {
    fetchTrashedEmails();
  }, []);

  const fetchTrashedEmails = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/emails?status=Trash');
      if (res.ok) {
        setTrashedEmails(await res.json());
      }
    } catch (err) {
      console.error('Failed to fetch trashed emails:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (id) => {
    try {
      const res = await apiFetch(`/api/emails/${id}/restore`, { method: 'POST' });
      if (res.ok) {
        setTrashedEmails(prev => prev.filter(email => email.id !== id));
        if (selectedEmail?.id === id) setSelectedEmail(null);
      }
    } catch (err) {
      console.error('Failed to restore email:', err);
    }
  };

  const handlePermanentDelete = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this email? This cannot be undone.')) {
      return;
    }
    try {
      const res = await apiFetch(`/api/emails/${id}?permanent=true`, { method: 'DELETE' });
      if (res.ok) {
        setTrashedEmails(prev => prev.filter(email => email.id !== id));
        if (selectedEmail?.id === id) setSelectedEmail(null);
      }
    } catch (err) {
      console.error('Failed to permanently delete email:', err);
    }
  };

  const handleEmptyTrash = async () => {
    if (!window.confirm('Are you sure you want to empty the trash? All trashed emails will be permanently deleted.')) {
      return;
    }
    try {
      const res = await apiFetch('/api/emails/trash/empty', { method: 'DELETE' });
      if (res.ok) {
        setTrashedEmails([]);
        setSelectedEmail(null);
      }
    } catch (err) {
      console.error('Failed to empty trash:', err);
    }
  };

  const filtered = trashedEmails.filter(item => 
    !searchQuery.trim() || 
    item.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.recipient?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Header Card */}
      <div className="glass-panel p-6 rounded-3xl border border-[#2E2D2B] bg-[#1A1918] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
        <div>
          <h2 className="text-xl font-bold text-[#F5F3EF] flex items-center gap-2">
            <Trash2 className="w-5 h-5 text-[#D4A373]" />
            Deleted Emails (Trash)
          </h2>
          <p className="text-xs text-[#99958F] mt-1">
            Emails moved to trash. You can restore them or delete them permanently.
          </p>
        </div>

        {trashedEmails.length > 0 && (
          <button
            onClick={handleEmptyTrash}
            className="px-4 py-2 rounded-xl bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-500/30 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
          >
            <XCircle className="w-4 h-4 text-rose-400" />
            Empty Trash
          </button>
        )}
      </div>

      {/* Search Bar */}
      <div className="glass-panel p-4 rounded-2xl flex items-center gap-3 border border-[#2E2D2B] bg-[#1A1918] shadow-lg">
        <Search className="w-4 h-4 text-[#D4A373] shrink-0" />
        <input
          type="text"
          placeholder="Search deleted emails by recipient or subject..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-transparent text-xs text-[#F5F3EF] focus:outline-none placeholder-[#99958F]"
        />
      </div>

      {/* Trash List */}
      {loading ? (
        <div className="glass-panel p-12 text-center text-xs text-[#99958F] rounded-3xl space-y-3 border border-[#2E2D2B] bg-[#1A1918]">
          <RefreshCw className="w-6 h-6 animate-spin text-[#D4A373] mx-auto" />
          <p className="font-semibold">Loading trash...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-panel p-12 text-center text-xs text-[#99958F] rounded-3xl space-y-3 border border-[#2E2D2B] bg-[#1A1918] shadow-xl">
          <Trash2 className="w-8 h-8 text-[#D4A373] mx-auto opacity-50" />
          <p className="font-bold text-[#F5F3EF]">Trash is empty</p>
          <p className="text-[#99958F]">No deleted emails found in your account.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(email => (
            <div
              key={email.id}
              className="glass-card p-5 rounded-2xl border border-[#2E2D2B] bg-[#161514] space-y-3 flex flex-col justify-between hover:scale-[1.01] transition-all shadow-lg"
            >
              <div className="space-y-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#22211F] text-[#D4A373] border border-[#2E2D2B]">
                  {email.category || 'Email'}
                </span>
                <h3 className="text-sm font-bold text-[#F5F3EF] line-clamp-1">{email.subject}</h3>
                <p className="text-xs text-[#99958F]">To: <span className="text-[#D4A373] font-mono">{email.recipient}</span></p>
              </div>

              <div className="pt-3 border-t border-[#2E2D2B] flex items-center justify-between gap-2">
                <button
                  onClick={() => handleRestore(email.id)}
                  className="px-3 py-1.5 rounded-xl bg-[#22211F] hover:bg-[#2A2926] text-[#D4A373] text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-[#2E2D2B]"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-[#D4A373]" />
                  Restore
                </button>

                <button
                  onClick={() => handlePermanentDelete(email.id)}
                  className="px-3 py-1.5 rounded-xl bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-rose-500/30"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
