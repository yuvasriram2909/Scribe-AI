import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Trash2, Send, Mail, Tag, Plus, Check, AlertCircle, Search, Edit3, X } from 'lucide-react';
import { apiFetch } from '../utils/api';
import { isValidEmail } from '../utils/emailValidation';

const RELATIONSHIPS = [
  { name: 'Client', tone: 'Professional', badge: 'bg-[#22211F] text-[#D4A373] border-[#2E2D2B]' },
  { name: 'Manager', tone: 'Formal + Professional', badge: 'bg-[#22211F] text-[#ECE8E1] border-[#2E2D2B]' },
  { name: 'HR', tone: 'Formal', badge: 'bg-[#22211F] text-[#ECE8E1] border-[#2E2D2B]' },
  { name: 'Friend', tone: 'Casual', badge: 'bg-[#22211F] text-[#99958F] border-[#2E2D2B]' },
  { name: 'Colleague', tone: 'Professional', badge: 'bg-[#22211F] text-[#D4A373] border-[#2E2D2B]' },
  { name: 'Other', tone: 'Professional', badge: 'bg-[#22211F] text-[#99958F] border-[#2E2D2B]' }
];

export function ContactsManager({ onQuickCompose, onComposeTo }) {
  const handleCompose = onComposeTo || onQuickCompose;
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formError, setFormError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Add Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [relationship, setRelationship] = useState('Client');

  // Edit Modal State
  const [editingContact, setEditingContact] = useState(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRelationship, setEditRelationship] = useState('Client');
  const [editError, setEditError] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/contacts');
      if (res.ok) setContacts(await res.json());
    } catch (err) {
      console.error('Failed to load contacts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddContact = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!name || !name.trim()) {
      setFormError('Please enter the contact full name.');
      return;
    }
    if (!email || !email.trim() || !isValidEmail(email)) {
      setFormError('Please enter a valid email address (e.g. sarah@example.com).');
      return;
    }

    try {
      const res = await apiFetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), relationship })
      });

      if (res.ok) {
        const newContact = await res.json();
        setContacts(prev => [newContact, ...prev]);
        setName('');
        setEmail('');
        setFormError('');
        setShowAddForm(false);
      } else {
        const errData = await res.json().catch(() => ({}));
        setFormError(errData.error || 'Failed to save contact.');
      }
    } catch (err) {
      console.error('Failed to add contact:', err);
      setFormError(err.message || 'Network error while adding contact.');
    }
  };

  const openEditModal = (c) => {
    setEditingContact(c);
    setEditName(c.name || '');
    setEditEmail(c.email || '');
    setEditRelationship(c.relationship || 'Client');
    setEditError('');
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingContact) return;
    setEditError('');

    if (!editName || !editName.trim()) {
      setEditError('Please enter the contact full name.');
      return;
    }
    if (!editEmail || !editEmail.trim() || !isValidEmail(editEmail)) {
      setEditError('Please enter a valid email address.');
      return;
    }

    setSavingEdit(true);
    try {
      const res = await apiFetch(`/api/contacts/${editingContact.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName.trim(),
          email: editEmail.trim(),
          relationship: editRelationship
        })
      });

      if (res.ok) {
        const updated = await res.json();
        setContacts(prev => prev.map(c => c.id === editingContact.id ? { ...c, ...updated, name: editName.trim(), email: editEmail.trim(), relationship: editRelationship } : c));
        setEditingContact(null);
      } else {
        const errData = await res.json().catch(() => ({}));
        setEditError(errData.error || 'Failed to update contact.');
      }
    } catch (err) {
      setEditError(err.message || 'Error updating contact.');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteContact = async (id) => {
    if (!window.confirm('Are you sure you want to delete this contact?')) return;
    try {
      const res = await apiFetch(`/api/contacts/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setContacts(prev => prev.filter(c => c.id !== id));
      }
    } catch (err) {
      console.error('Failed to delete contact:', err);
    }
  };

  const filteredContacts = contacts.filter(c => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const cName = (c.name || '').toLowerCase();
    const cEmail = (c.email || '').toLowerCase();
    const cRel = (c.relationship || '').toLowerCase();
    return cName.includes(q) || cEmail.includes(q) || cRel.includes(q);
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Header Card */}
      <div className="glass-panel p-6 rounded-3xl border border-[#2E2D2B] bg-[#1A1918] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 shadow-xl">
        <div>
          <h2 className="text-xl font-extrabold text-[#F5F3EF] flex items-center gap-2">
            <Users className="w-5 h-5 text-[#D4A373]" />
            Contacts & Address Book
          </h2>
          <p className="text-xs text-[#99958F] mt-1">
            Store frequent contacts to easily select recipients while composing emails
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Search Box */}
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-[#99958F] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search contacts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl glass-input text-xs text-[#F5F3EF] placeholder-[#99958F]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#99958F] hover:text-[#ECE8E1]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-4 py-2.5 rounded-xl gold-btn text-[#121211] text-xs font-bold flex items-center gap-2 shadow-md cursor-pointer shrink-0"
          >
            <UserPlus className="w-4 h-4 text-[#121211]" />
            {showAddForm ? 'Close Form' : 'Add Contact'}
          </button>
        </div>
      </div>

      {/* Add Contact Form */}
      {showAddForm && (
        <form onSubmit={handleAddContact} className="glass-panel p-6 rounded-3xl border border-[#2E2D2B] bg-[#1A1918] space-y-4 animate-fadeIn shadow-xl">
          <h3 className="text-sm font-extrabold text-[#F5F3EF]">Add New Contact</h3>

          {formError && (
            <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{formError}</span>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-bold text-[#ECE8E1] block mb-1">Full Name</label>
              <input
                type="text"
                required
                placeholder="Sarah Connor"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl glass-input text-xs text-[#F5F3EF]"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-[#ECE8E1] block mb-1">Email Address</label>
              <input
                type="email"
                required
                placeholder="sarah@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl glass-input text-xs text-[#F5F3EF]"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-[#ECE8E1] block mb-1">Relationship</label>
              <select
                value={relationship}
                onChange={(e) => setRelationship(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-[#22211F] border border-[#2E2D2B] text-xs font-bold text-[#F5F3EF]"
              >
                {RELATIONSHIPS.map(r => (
                  <option key={r.name} value={r.name}>{r.name} ({r.tone})</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-[#2E2D2B]">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 rounded-xl bg-[#22211F] hover:bg-[#2A2926] text-[#99958F] text-xs font-bold border border-[#2E2D2B]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl gold-btn text-[#121211] text-xs font-bold shadow-md cursor-pointer"
            >
              Save Contact
            </button>
          </div>
        </form>
      )}

      {/* Edit Contact Modal */}
      {editingContact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <form onSubmit={handleSaveEdit} className="glass-panel p-6 rounded-3xl border border-[#2E2D2B] bg-[#1A1918] max-w-md w-full space-y-4 shadow-2xl animate-scaleUp">
            <div className="flex items-center justify-between border-b border-[#2E2D2B] pb-3">
              <h3 className="text-sm font-extrabold text-[#F5F3EF] flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-[#D4A373]" />
                Edit Contact
              </h3>
              <button
                type="button"
                onClick={() => setEditingContact(null)}
                className="text-[#99958F] hover:text-[#ECE8E1]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {editError && (
              <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{editError}</span>
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-[#ECE8E1] block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs text-[#F5F3EF]"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-[#ECE8E1] block mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs text-[#F5F3EF]"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-[#ECE8E1] block mb-1">Relationship</label>
                <select
                  value={editRelationship}
                  onChange={(e) => setEditRelationship(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#22211F] border border-[#2E2D2B] text-xs font-bold text-[#F5F3EF]"
                >
                  {RELATIONSHIPS.map(r => (
                    <option key={r.name} value={r.name}>{r.name} ({r.tone})</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#2E2D2B]">
              <button
                type="button"
                onClick={() => setEditingContact(null)}
                className="px-4 py-2 rounded-xl bg-[#22211F] hover:bg-[#2A2926] text-[#99958F] text-xs font-bold border border-[#2E2D2B]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingEdit}
                className="px-5 py-2 rounded-xl gold-btn text-[#121211] text-xs font-bold shadow-md cursor-pointer disabled:opacity-50"
              >
                {savingEdit ? 'Saving...' : 'Update Contact'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Contacts Grid */}
      {loading ? (
        <div className="glass-panel p-12 text-center text-xs text-[#99958F] rounded-3xl border border-[#2E2D2B] bg-[#1A1918]">
          Loading contacts...
        </div>
      ) : filteredContacts.length === 0 ? (
        <div className="glass-panel p-12 text-center text-xs text-[#99958F] rounded-3xl border border-[#2E2D2B] bg-[#1A1918] space-y-2">
          <Users className="w-8 h-8 text-[#D4A373] mx-auto opacity-50" />
          <p className="font-bold text-[#F5F3EF]">
            {searchQuery ? `No contacts matching "${searchQuery}"` : 'No contacts saved yet.'}
          </p>
          <p className="text-[#99958F]">Add frequent recipients for quick 1-click email drafting.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredContacts.map(c => {
            const rel = RELATIONSHIPS.find(r => r.name === c.relationship) || RELATIONSHIPS[0];
            return (
              <div key={c.id} className="glass-card p-5 rounded-2xl border border-[#2E2D2B] bg-[#161514] space-y-3 flex flex-col justify-between hover:scale-[1.01] transition-all">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#22211F] border border-[#2E2D2B] text-[#D4A373] font-extrabold text-sm flex items-center justify-center shadow-md">
                      {(c.name || 'U')[0].toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-extrabold text-[#F5F3EF] truncate">{c.name}</h4>
                      <p className="text-[11px] text-[#D4A373] font-mono truncate">{c.email}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${rel.badge}`}>
                    {c.relationship}
                  </span>
                </div>

                <div className="pt-3 border-t border-[#2E2D2B] flex items-center justify-between">
                  <button
                    onClick={() => handleCompose && handleCompose(c)}
                    className="text-xs text-[#D4A373] hover:text-[#c59362] font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" /> Compose Email
                  </button>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(c)}
                      className="p-1.5 rounded-lg text-[#99958F] hover:text-[#ECE8E1] hover:bg-[#22211F] cursor-pointer"
                      title="Edit Contact"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteContact(c.id)}
                      className="p-1.5 rounded-lg text-[#99958F] hover:text-rose-400 hover:bg-rose-500/10 cursor-pointer"
                      title="Delete Contact"
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
    </div>
  );
}
