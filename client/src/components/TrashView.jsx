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
      // Fetch trashed emails from API or filter by status=Trash
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
      <div className="glass-panel p-6 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#28321D] flex items-center gap-2">
            <Trash2 className="w-5 h-5 text-[#667A45]" />
            Deleted Emails (Trash)
          </h2>
          <p className="text-xs text-[#6F725F] mt-1">
            Emails moved to trash. You can restore them or delete them permanently.
          </p>
        </div>

        {trashedEmails.length > 0 && (
          <button
            onClick={handleEmptyTrash}
            className="px-4 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
          >
            <XCircle className="w-4 h-4 text-red-600" />
            Empty Trash
          </button>
        )}
      </div>

      {/* Search Input */}
      <div className="glass-panel p-4 rounded-xl flex items-center gap-3">
        <Search className="w-4 h-4 text-[#667A45] shrink-0" />
        <input
          type="text"
          placeholder="Search deleted emails..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-transparent text-xs text-[#28321D] focus:outline-none placeholder-[#6F725F]"
        />
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="glass-panel p-12 text-center text-xs text-[#6F725F] rounded-2xl space-y-3">
          <RefreshCw className="w-6 h-6 animate-spin text-[#667A45] mx-auto" />
          <p>Loading trashed emails...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-panel p-12 text-center text-xs text-[#6F725F] rounded-2xl space-y-3">
          <Trash2 className="w-8 h-8 text-[#879B62] mx-auto opacity-50" />
          <p className="font-bold text-[#28321D]">Trash is empty</p>
          <p className="text-[#6F725F]">No deleted emails found in your trash folder.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(email => (
            <div key={email.id} className="glass-card p-5 rounded-2xl space-y-3 border border-[#D8D1BC] flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[#3F4D2A] bg-[#E8DFC8] px-2.5 py-0.5 rounded-full border border-[#D8D1BC]">
                    {email.category || 'Email'}
                  </span>
                  <span className="text-[10px] text-[#6F725F]">
                    {new Date(email.updatedAt || email.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-[#28321D] line-clamp-1">
                  {email.subject}
                </h3>
                <p className="text-xs text-[#6F725F]">
                  To: <span className="font-semibold text-[#3F4D2A]">{email.recipient}</span>
                </p>
              </div>

              <div className="pt-3 border-t border-[#D8D1BC] flex items-center justify-between gap-2">
                <button
                  onClick={() => handleRestore(email.id)}
                  className="px-3 py-1.5 rounded-lg bg-[#FAF8F1] hover:bg-[#E8DFC8] text-[#3F4D2A] border border-[#D8D1BC] text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-[#667A45]" />
                  Restore
                </button>

                <button
                  onClick={() => handlePermanentDelete(email.id)}
                  className="px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-600" />
                  Delete Permanently
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
