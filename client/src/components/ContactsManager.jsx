import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Trash2, Send, Mail, Tag, Plus, Check } from 'lucide-react';
import { apiFetch } from '../utils/api';

const RELATIONSHIPS = [
  { name: 'Client', tone: 'Professional', badge: 'bg-purple-950/60 text-purple-300 border-purple-500/30' },
  { name: 'Manager', tone: 'Formal + Professional', badge: 'bg-rose-950/60 text-rose-300 border-rose-500/30' },
  { name: 'HR', tone: 'Formal', badge: 'bg-blue-950/60 text-blue-300 border-blue-500/30' },
  { name: 'Friend', tone: 'Casual', badge: 'bg-slate-800 text-slate-300 border-slate-700' },
  { name: 'Colleague', tone: 'Professional', badge: 'bg-emerald-950/60 text-emerald-300 border-emerald-500/30' },
  { name: 'Other', tone: 'Professional', badge: 'bg-slate-800 text-slate-300 border-slate-700' }
];

export function ContactsManager({ onQuickCompose }) {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [relationship, setRelationship] = useState('Client');

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
    if (!name || !email) return;

    try {
      const res = await apiFetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, relationship })
      });

      if (res.ok) {
        const newContact = await res.json();
        setContacts(prev => [newContact, ...prev]);
        setName('');
        setEmail('');
        setShowAddForm(false);
      }
    } catch (err) {
      console.error('Failed to add contact:', err);
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

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Header Card */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 flex items-center justify-between shadow-xl">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-400" />
            Contacts & Address Book
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Store frequent contacts to easily select recipients while composing emails
          </p>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2.5 rounded-xl gradient-btn text-white text-xs font-bold flex items-center gap-2 shadow-md cursor-pointer"
        >
          <UserPlus className="w-4 h-4 text-pink-200" />
          {showAddForm ? 'Close Form' : 'Add New Contact'}
        </button>
      </div>

      {/* Add Contact Form */}
      {showAddForm && (
        <form onSubmit={handleAddContact} className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4 animate-fadeIn shadow-xl">
          <h3 className="text-sm font-extrabold text-white">Add New Contact</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Full Name</label>
              <input
                type="text"
                required
                placeholder="Sarah Connor"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl glass-input text-xs text-white"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Email Address</label>
              <input
                type="email"
                required
                placeholder="sarah@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl glass-input text-xs text-white"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Relationship</label>
              <select
                value={relationship}
                onChange={(e) => setRelationship(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-800 border border-slate-700 text-xs font-bold text-slate-200"
              >
                {RELATIONSHIPS.map(r => (
                  <option key={r.name} value={r.name}>{r.name} ({r.tone})</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl gradient-btn text-white text-xs font-bold shadow-md cursor-pointer"
            >
              Save Contact
            </button>
          </div>
        </form>
      )}

      {/* Contacts Grid */}
      {loading ? (
        <div className="glass-panel p-12 text-center text-xs text-slate-400 rounded-3xl border border-slate-800">
          Loading contacts...
        </div>
      ) : contacts.length === 0 ? (
        <div className="glass-panel p-12 text-center text-xs text-slate-400 rounded-3xl border border-slate-800 space-y-2">
          <Users className="w-8 h-8 text-purple-400 mx-auto opacity-50" />
          <p className="font-bold text-white">No contacts saved yet.</p>
          <p className="text-slate-400">Add frequent recipients for quick 1-click email drafting.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {contacts.map(c => {
            const rel = RELATIONSHIPS.find(r => r.name === c.relationship) || RELATIONSHIPS[0];
            return (
              <div key={c.id} className="glass-card p-5 rounded-2xl border border-slate-800 space-y-3 flex flex-col justify-between hover:scale-[1.01] transition-all">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white font-extrabold text-sm flex items-center justify-center shadow-md">
                      {c.name[0].toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-xs font-extrabold text-white">{c.name}</h4>
                      <p className="text-[11px] text-cyan-300 font-mono">{c.email}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${rel.badge}`}>
                    {c.relationship}
                  </span>
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                  <button
                    onClick={() => onQuickCompose && onQuickCompose(c)}
                    className="text-xs text-purple-400 hover:text-purple-300 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" /> Compose Email
                  </button>
                  <button
                    onClick={() => handleDeleteContact(c.id)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 cursor-pointer"
                    title="Delete Contact"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
