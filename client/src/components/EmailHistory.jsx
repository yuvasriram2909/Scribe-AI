import React, { useState, useEffect } from 'react';
import { 
  Mail, Search, Filter, CheckCircle, Paperclip, RefreshCw, Eye, X, Trash2, 
  AlertCircle, Clock, Send, Inbox, ArrowUpRight, ArrowDownLeft, ShieldAlert,
  Star, Archive, MailOpen, RotateCcw, Edit3, Sparkles
} from 'lucide-react';
import { apiFetch } from '../utils/api';
import { subscribeToEmailChanges } from '../utils/supabaseClient';
import { sanitizeHtml } from '../utils/sanitize';

const FOLDERS = [
  { id: 'inbox', label: 'Inbox', icon: Inbox },
  { id: 'sent', label: 'Sent', icon: ArrowUpRight },
  { id: 'drafts', label: 'Drafts', icon: Clock },
  { id: 'starred', label: 'Starred', icon: Star },
  { id: 'archive', label: 'Archive', icon: Archive },
  { id: 'trash', label: 'Trash', icon: Trash2 },
  { id: 'spam', label: 'Spam', icon: ShieldAlert },
  { id: 'all', label: 'All Mail', icon: Mail }
];

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
  { id: 'yesterday', label: 'Yesterday' },
  { id: 'week', label: 'Last 7 Days' },
  { id: 'month', label: 'Last 30 Days' }
];

export function EmailHistory({ onReuseEmail, onEditDraft }) {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState('inbox');
  const [selectedDirection, setSelectedDirection] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedTone, setSelectedTone] = useState('All');
  const [selectedImportance, setSelectedImportance] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedDateRange, setSelectedDateRange] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [bodyViewMode, setBodyViewMode] = useState('formatted'); // 'formatted' | 'text'
  const [retryingId, setRetryingId] = useState(null);
  const [actionInProgress, setActionInProgress] = useState({});

  const hasActiveFilters = selectedFolder !== 'inbox' || selectedDirection !== 'All' || selectedCategory !== 'All' || selectedTone !== 'All' || selectedImportance !== 'All' || selectedStatus !== 'All' || selectedDateRange !== 'All' || searchQuery.trim() !== '';

  const handleResetFilters = () => {
    setSelectedFolder('inbox');
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
        if (d?.newReceived > 0 || d?.newSent > 0 || d?.newSpam > 0 || d?.newDrafts > 0) {
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
  }, [selectedFolder, selectedDirection, selectedCategory, selectedTone, selectedImportance, selectedStatus, selectedDateRange, searchQuery]);

  const handleManualSync = async () => {
    if (syncing) return;
    setSyncing(true);
    try {
      const res = await apiFetch('/api/gmail/sync', { method: 'POST' });
      const data = await res.json();
      await fetchEmails();
      if (data?.newReceived > 0 || data?.newSent > 0 || data?.newDrafts > 0) {
        alert(`Synced ${data.newReceived || 0} received, ${data.newSent || 0} sent, and ${data.newDrafts || 0} drafts with Gmail!`);
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
      let url = `/api/emails?folder=${encodeURIComponent(selectedFolder)}&`;
      if (selectedDirection !== 'All') url += `direction=${encodeURIComponent(selectedDirection)}&`;
      if (selectedCategory !== 'All') url += `category=${encodeURIComponent(selectedCategory)}&`;
      if (selectedTone !== 'All') url += `tone=${encodeURIComponent(selectedTone)}&`;
      if (selectedImportance !== 'All') url += `importance=${encodeURIComponent(selectedImportance)}&`;
      if (selectedStatus !== 'All') url += `status=${encodeURIComponent(selectedStatus)}&`;
      if (selectedDateRange !== 'All') url += `dateRange=${encodeURIComponent(selectedDateRange)}&`;
      if (searchQuery.trim() !== '') url += `q=${encodeURIComponent(searchQuery)}`;

      const res = await apiFetch(url);
      if (res.ok) {
        const data = await res.json();
        setEmails(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed to fetch email history:', err);
    } finally {
      setLoading(false);
    }
  };

  // ----------------------------------------------------
  // Two-Way Actions: Star, Read, Archive, Trash, Restore
  // ----------------------------------------------------

  const handleToggleStar = async (e, email) => {
    if (e) e.stopPropagation();
    const newStar = !email.isStarred;
    
    // Optimistic UI update
    setEmails(prev => prev.map(em => em.id === email.id ? { ...em, isStarred: newStar } : em));
    if (selectedEmail?.id === email.id) {
      setSelectedEmail(prev => prev ? { ...prev, isStarred: newStar } : null);
    }

    try {
      await apiFetch(`/api/emails/${email.id}/star`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isStarred: newStar })
      });
    } catch (err) {
      console.error('Star toggle failed:', err);
      // Revert on error
      setEmails(prev => prev.map(em => em.id === email.id ? { ...em, isStarred: !newStar } : em));
    }
  };

  const handleToggleRead = async (e, email) => {
    if (e) e.stopPropagation();
    const newRead = !email.isRead;

    // Optimistic UI update
    setEmails(prev => prev.map(em => em.id === email.id ? { ...em, isRead: newRead } : em));
    if (selectedEmail?.id === email.id) {
      setSelectedEmail(prev => prev ? { ...prev, isRead: newRead } : null);
    }

    try {
      await apiFetch(`/api/emails/${email.id}/read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isRead: newRead })
      });
    } catch (err) {
      console.error('Read toggle failed:', err);
      setEmails(prev => prev.map(em => em.id === email.id ? { ...em, isRead: !newRead } : em));
    }
  };

  const handleToggleArchive = async (e, email) => {
    if (e) e.stopPropagation();
    const newArchived = !email.isArchived;

    // Optimistic UI update
    setEmails(prev => {
      if (selectedFolder === 'inbox' && newArchived) {
        return prev.filter(em => em.id !== email.id);
      }
      if (selectedFolder === 'archive' && !newArchived) {
        return prev.filter(em => em.id !== email.id);
      }
      return prev.map(em => em.id === email.id ? { ...em, isArchived: newArchived } : em);
    });

    if (selectedEmail?.id === email.id) {
      setSelectedEmail(prev => prev ? { ...prev, isArchived: newArchived } : null);
    }

    try {
      await apiFetch(`/api/emails/${email.id}/archive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isArchived: newArchived })
      });
    } catch (err) {
      console.error('Archive toggle failed:', err);
      fetchEmails();
    }
  };

  const handleTrashToggle = async (e, email) => {
    if (e) e.stopPropagation();
    const isCurrentlyTrash = Boolean(email.isTrash);
    const endpoint = isCurrentlyTrash ? 'untrash' : 'trash';

    // Optimistic UI update
    setEmails(prev => prev.filter(em => em.id !== email.id));
    if (selectedEmail?.id === email.id) setSelectedEmail(null);

    try {
      await apiFetch(`/api/emails/${email.id}/${endpoint}`, { method: 'POST' });
    } catch (err) {
      console.error('Trash action failed:', err);
      fetchEmails();
    }
  };

  const handleDeletePermanent = async (e, id) => {
    if (e) e.stopPropagation();
    if (!window.confirm('Are you sure you want to permanently delete this email?')) {
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

  const handleOpenEmail = async (email) => {
    setSelectedEmail(email);
    setBodyViewMode(email.bodyHtml ? 'formatted' : 'text');

    // If unread, mark read in background
    if (!email.isRead) {
      handleToggleRead(null, email);
    }

    // If email lacks body_html and has gmailMessageId, fetch full details on-demand
    if (!email.bodyHtml && email.gmailMessageId) {
      try {
        const res = await apiFetch(`/api/emails/${email.id}`);
        if (res.ok) {
          const fullEmail = await res.json();
          setSelectedEmail(fullEmail);
          setEmails(prev => prev.map(item => item.id === fullEmail.id ? fullEmail : item));
          if (fullEmail.bodyHtml) setBodyViewMode('formatted');
        }
      } catch (fErr) {
        console.warn('Detailed email fetch note:', fErr);
      }
    }
  };

  const handleEditDraftAction = (email) => {
    if (onEditDraft) {
      onEditDraft(email);
    } else if (onReuseEmail) {
      onReuseEmail(email);
    }
    setSelectedEmail(null);
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
    const isDraft = email.isDraft || email.is_draft || email.direction === 'draft' || (email.status || '').toLowerCase() === 'draft';
    if (isDraft) {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-purple-300 bg-purple-950/80 border border-purple-500/40 px-2.5 py-0.5 rounded-full shadow-sm">
          <Clock className="w-3 h-3 text-purple-400" />
          Draft
        </span>
      );
    }
    const isReceived = email.isReceived || email.direction === 'received' || email.direction === 'incoming' || (email.status || '').toLowerCase() === 'received' || (email.status || '').toLowerCase() === 'incoming';
    if (isReceived) {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-300 bg-blue-950/80 border border-blue-500/40 px-2.5 py-0.5 rounded-full shadow-sm">
          <ArrowDownLeft className="w-3 h-3 text-blue-400" />
          Received
        </span>
      );
    }
    const isSent = email.isSent || email.direction === 'sent' || email.direction === 'outgoing' || (email.status || '').toLowerCase() === 'sent' || (email.status || '').toLowerCase() === 'outgoing' || (email.status || '').toLowerCase() === 'delivered';
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
        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-300 bg-rose-950/80 border border-rose-500/40 px-2.5 py-0.5 rounded-full shadow-sm">
          <AlertCircle className="w-3 h-3 text-rose-400 shrink-0" />
          Failed
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
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header & Subtitle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white flex items-center gap-2.5">
            <Mail className="w-6 h-6 text-[#D4A373]" />
            <span>Gmail Two-Way Synchronization</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time mailbox mirroring. Actions performed here immediately update your actual Gmail account.
          </p>
        </div>

        {/* Sync Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleManualSync}
            disabled={syncing}
            className="px-4 py-2 rounded-xl bg-[#22211F] hover:bg-[#2E2D2B] border border-[#D4A373]/30 hover:border-[#D4A373]/60 text-[#ECE8E1] text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#D4A373] ${syncing ? 'animate-spin' : ''}`} />
            <span>{syncing ? 'Syncing with Gmail...' : 'Sync Gmail'}</span>
          </button>
        </div>
      </div>

      {/* 1. Folder Navigation Bar (Inbox, Sent, Drafts, Starred, Archive, Trash, Spam) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-800 scrollbar-thin">
        {FOLDERS.map((f) => {
          const IconComponent = f.icon;
          const isActive = selectedFolder === f.id;
          return (
            <button
              key={f.id}
              onClick={() => setSelectedFolder(f.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shrink-0 cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-[#D4A373]/25 to-[#C59362]/15 text-[#F5F3EF] border border-[#D4A373]/50 shadow-sm'
                  : 'bg-slate-900/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800/80'
              }`}
            >
              <IconComponent className={`w-3.5 h-3.5 ${isActive ? 'text-[#D4A373]' : 'text-slate-400'}`} />
              <span>{f.label}</span>
            </button>
          );
        })}
      </div>

      {/* 2. Filter Bar (Categories, Search, Date Range) */}
      <div className="flex items-center gap-2.5 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search subject, recipient, body..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9.5 pr-4 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-white placeholder-slate-500 outline-none focus:border-[#D4A373]/50 transition-colors"
          />
        </div>

        {/* Category Filter */}
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300 outline-none cursor-pointer focus:border-[#D4A373]/50"
        >
          {CATEGORIES_FILTER.map(c => (
            <option key={c} value={c} className="bg-slate-900 text-slate-200">{c === 'All' ? 'All Categories' : c}</option>
          ))}
        </select>

        {/* Date Filter */}
        <select
          value={selectedDateRange}
          onChange={(e) => setSelectedDateRange(e.target.value)}
          className="px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300 outline-none cursor-pointer focus:border-[#D4A373]/50"
        >
          {DATE_RANGES.map(d => (
            <option key={d.id} value={d.id} className="bg-slate-900 text-slate-200">{d.label}</option>
          ))}
        </select>

        {/* Reset Filter */}
        {hasActiveFilters && (
          <button
            onClick={handleResetFilters}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1 border border-slate-700 cursor-pointer transition-colors"
            title="Reset all active filters"
          >
            <X className="w-3 h-3 text-rose-400" />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* 3. Cards Grid */}
      {loading ? (
        <div className="glass-panel p-12 text-center text-xs text-slate-400 rounded-3xl space-y-3 border border-slate-800">
          <RefreshCw className="w-6 h-6 animate-spin text-[#D4A373] mx-auto" />
          <p className="font-semibold">Synchronizing mailbox from Gmail & Supabase...</p>
        </div>
      ) : emails.length === 0 ? (
        <div className="glass-panel p-12 text-center text-xs text-slate-400 rounded-3xl space-y-3 border border-slate-800 shadow-xl">
          <Mail className="w-8 h-8 text-[#D4A373] mx-auto opacity-60" />
          <p className="font-bold text-white text-sm">No emails found in this view</p>
          <p className="text-slate-400 max-w-sm mx-auto">
            {selectedFolder === 'trash' ? 'Trash is empty.' : selectedFolder === 'drafts' ? 'No draft emails saved yet.' : 'Try selecting another folder or clearing active search filters.'}
          </p>
          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className="mt-2 px-4 py-2 rounded-xl bg-[#22211F] hover:bg-[#2E2D2B] border border-[#D4A373]/30 text-[#ECE8E1] text-xs font-bold transition-all cursor-pointer shadow-md"
            >
              Reset All Filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {emails.map(email => {
            const isDraft = email.isDraft || email.is_draft || email.direction === 'draft' || (email.status || '').toLowerCase() === 'draft';
            const isReceived = !isDraft && (email.isReceived || email.direction === 'received' || email.direction === 'incoming' || email.status === 'Received' || email.status === 'incoming');
            const cat = email.category || email.email_type || 'General';
            const tone = email.tone || 'Professional';
            const priority = email.priority || email.importance || 'Normal';
            const dateStr = new Date(email.sentAt || email.receivedAt || email.createdAt).toLocaleString();
            const isRead = email.isRead !== false;
            const isStarred = Boolean(email.isStarred);
            const isArchived = Boolean(email.isArchived);
            const isTrash = Boolean(email.isTrash);

            return (
              <div
                key={email.id}
                onClick={() => handleOpenEmail(email)}
                className={`glass-card p-5 rounded-2xl space-y-3 border transition-all flex flex-col justify-between cursor-pointer group hover:scale-[1.01] ${
                  !isRead 
                    ? 'border-l-4 border-l-[#D4A373] border-slate-800 bg-[#1F1D1B]' 
                    : 'border-slate-800/90 bg-[#161514]'
                }`}
              >
                <div className="space-y-2">
                  {/* Top row: Badges + Star button */}
                  <div className="flex items-center justify-between gap-1 flex-wrap">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold text-[#D4A373] bg-[#D4A373]/15 px-2 py-0.5 rounded-full border border-[#D4A373]/30">
                        {cat}
                      </span>
                      {renderEmailBadge(email)}
                    </div>

                    {/* Star Action */}
                    <button
                      onClick={(e) => handleToggleStar(e, email)}
                      className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                        isStarred 
                          ? 'text-amber-400 hover:text-amber-300 bg-amber-400/10' 
                          : 'text-slate-500 hover:text-amber-400 hover:bg-slate-800'
                      }`}
                      title={isStarred ? 'Unstar in Gmail' : 'Star in Gmail'}
                    >
                      <Star className={`w-4 h-4 ${isStarred ? 'fill-amber-400' : ''}`} />
                    </button>
                  </div>

                  {/* Subject */}
                  <h3 className={`text-sm font-bold line-clamp-1 group-hover:text-[#D4A373] transition-colors ${isRead ? 'text-slate-200' : 'text-white font-extrabold'}`}>
                    {email.subject || '(No Subject)'}
                  </h3>

                  {/* Sender / Recipient */}
                  <p className="text-xs text-slate-400 line-clamp-1">
                    {isReceived ? (
                      <>From: <span className="font-semibold text-purple-300 font-mono">{email.sender || email.sender_email || email.gmailAccount || 'External Sender'}</span></>
                    ) : isDraft ? (
                      <>Draft To: <span className="font-semibold text-cyan-300 font-mono">{email.recipient || email.recipient_email || '(Unspecified)'}</span></>
                    ) : (
                      <>To: <span className="font-semibold text-cyan-300 font-mono">{email.recipient || email.recipient_email}</span></>
                    )}
                  </p>

                  {/* Snippet */}
                  <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                    {email.snippet || (email.body ? email.body.slice(0, 100) : '(No preview)')}
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

                {/* Bottom Row: Date & Action buttons */}
                <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                  <span className="text-[10px] text-slate-500 font-mono">
                    {dateStr}
                  </span>

                  {/* Action Buttons Toolbar */}
                  <div className="flex items-center gap-1.5">
                    {/* Mark Read/Unread Toggle */}
                    <button
                      onClick={(e) => handleToggleRead(e, email)}
                      className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
                      title={isRead ? 'Mark Unread in Gmail' : 'Mark Read in Gmail'}
                    >
                      {isRead ? <Mail className="w-3.5 h-3.5" /> : <MailOpen className="w-3.5 h-3.5 text-[#D4A373]" />}
                    </button>

                    {/* Archive / Move to Inbox Toggle */}
                    {!isTrash && !isDraft && (
                      <button
                        onClick={(e) => handleToggleArchive(e, email)}
                        className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                          isArchived 
                            ? 'bg-blue-950/60 hover:bg-blue-900/80 text-blue-300 border-blue-500/30' 
                            : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border-slate-700'
                        }`}
                        title={isArchived ? 'Move to Inbox in Gmail' : 'Archive in Gmail'}
                      >
                        <Archive className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {/* Trash or Restore Toggle */}
                    <button
                      onClick={(e) => handleTrashToggle(e, email)}
                      className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                        isTrash
                          ? 'bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border-emerald-500/30'
                          : 'bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border-rose-500/30'
                      }`}
                      title={isTrash ? 'Restore from Trash' : 'Move to Trash in Gmail'}
                    >
                      {isTrash ? <RotateCcw className="w-3.5 h-3.5" /> : <Trash2 className="w-3.5 h-3.5" />}
                    </button>

                    {/* View Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenEmail(email);
                      }}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
                      title="View Full Email"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 4. Detail Modal with HTML Sanitizer and Two-Way Controls */}
      {selectedEmail && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel max-w-3xl w-full p-6 sm:p-8 rounded-3xl border border-slate-700 space-y-6 max-h-[90vh] overflow-y-auto animate-fadeIn shadow-2xl bg-[#1A1918]">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#D4A373]/20 text-[#D4A373] border border-[#D4A373]/30">
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
                <h3 className="text-lg font-bold text-white mt-1">
                  {selectedEmail.subject || '(No Subject)'}
                </h3>
              </div>

              {/* Action buttons on top right of modal */}
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => handleToggleStar(e, selectedEmail)}
                  className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                    selectedEmail.isStarred 
                      ? 'bg-amber-400/20 text-amber-400 border-amber-400/40' 
                      : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-amber-400'
                  }`}
                  title={selectedEmail.isStarred ? 'Unstar in Gmail' : 'Star in Gmail'}
                >
                  <Star className={`w-4 h-4 ${selectedEmail.isStarred ? 'fill-amber-400' : ''}`} />
                </button>

                <button
                  onClick={(e) => handleToggleRead(e, selectedEmail)}
                  className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer"
                  title={selectedEmail.isRead ? 'Mark as Unread' : 'Mark as Read'}
                >
                  {selectedEmail.isRead ? <Mail className="w-4 h-4" /> : <MailOpen className="w-4 h-4 text-[#D4A373]" />}
                </button>

                <button
                  onClick={() => setSelectedEmail(null)}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Email Metadata Grid */}
            <div className="space-y-2 text-xs text-slate-300 bg-slate-900/60 p-4 rounded-2xl border border-slate-800 font-mono">
              <p><strong className="text-[#D4A373]">Direction:</strong> {(selectedEmail.isDraft || (selectedEmail.status || '').toLowerCase() === 'draft') ? 'Draft (Unsent)' : (selectedEmail.direction || (selectedEmail.isReceived ? 'Received' : 'Sent'))}</p>
              {(selectedEmail.sender || selectedEmail.sender_email) && (
                <p><strong className="text-[#D4A373]">From:</strong> {selectedEmail.sender || selectedEmail.sender_email}</p>
              )}
              <p><strong className="text-[#D4A373]">To:</strong> {selectedEmail.recipient || selectedEmail.recipient_email || '(Unspecified)'}</p>
              {selectedEmail.cc && <p><strong className="text-[#D4A373]">Cc:</strong> {selectedEmail.cc}</p>}
              {selectedEmail.bcc && <p><strong className="text-[#D4A373]">Bcc:</strong> {selectedEmail.bcc}</p>}
              <p><strong className="text-[#D4A373]">Status:</strong> {selectedEmail.status}</p>
              {selectedEmail.gmailDraftId && (
                <p><strong className="text-purple-400">Gmail Draft ID:</strong> {selectedEmail.gmailDraftId}</p>
              )}
              {selectedEmail.gmailMessageId && (
                <p><strong className="text-purple-400">Gmail Message ID:</strong> {selectedEmail.gmailMessageId}</p>
              )}
              <p><strong className="text-[#D4A373]">Timestamp:</strong> {new Date(selectedEmail.sentAt || selectedEmail.receivedAt || selectedEmail.createdAt).toLocaleString()}</p>
            </div>

            {/* Body View Mode Selector (Formatted HTML vs Plain Text) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-400">Email Content:</label>
                {selectedEmail.bodyHtml && (
                  <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-[11px]">
                    <button
                      onClick={() => setBodyViewMode('formatted')}
                      className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                        bodyViewMode === 'formatted' 
                          ? 'bg-[#D4A373] text-[#121211]' 
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Formatted View
                    </button>
                    <button
                      onClick={() => setBodyViewMode('text')}
                      className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                        bodyViewMode === 'text' 
                          ? 'bg-[#D4A373] text-[#121211]' 
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Plain Text
                    </button>
                  </div>
                )}
              </div>

              {/* Render content */}
              <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-200 leading-relaxed max-h-72 overflow-y-auto">
                {bodyViewMode === 'formatted' && selectedEmail.bodyHtml ? (
                  <div 
                    className="prose prose-invert max-w-none prose-sm font-sans"
                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(selectedEmail.bodyHtml) }} 
                  />
                ) : (
                  <div className="whitespace-pre-wrap font-mono text-xs">
                    {selectedEmail.bodyText || selectedEmail.body || '(No body content)'}
                  </div>
                )}
              </div>
            </div>

            {/* Footer Toolbar */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-800 flex-wrap gap-2">
              {/* Left action button (Delete or Trash) */}
              <div>
                <button
                  onClick={(e) => handleDeletePermanent(e, selectedEmail.id)}
                  className="px-4 py-2 rounded-xl bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-500/30 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Record</span>
                </button>
              </div>

              {/* Right action buttons */}
              <div className="flex items-center gap-2">
                {/* If draft: show Edit in Compose */}
                {(selectedEmail.isDraft || selectedEmail.is_draft || selectedEmail.direction === 'draft' || (selectedEmail.status || '').toLowerCase() === 'draft') && (
                  <button
                    onClick={() => handleEditDraftAction(selectedEmail)}
                    className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold transition-all cursor-pointer shadow-md flex items-center gap-2"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit Draft</span>
                  </button>
                )}

                {/* Reuse as Template */}
                {onReuseEmail && !(selectedEmail.isDraft || selectedEmail.is_draft || selectedEmail.direction === 'draft' || (selectedEmail.status || '').toLowerCase() === 'draft') && (
                  <button
                    onClick={() => {
                      onReuseEmail(selectedEmail);
                      setSelectedEmail(null);
                    }}
                    className="gold-btn text-[#121211] px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-lg flex items-center gap-2"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Reuse as Template</span>
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
        </div>
      )}
    </div>
  );
}
