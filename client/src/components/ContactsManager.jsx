import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Trash2, Send, Mail, Tag, Plus, Check } from 'lucide-react';
import { apiFetch } from '../utils/api';

const RELATIONSHIPS = [
  { name: 'Client', tone: 'Professional', badge: 'bg-purple-500/10 text-purple-300 border-purple-500/30' },
  { name: 'Manager', tone: 'Formal + Professional', badge: 'bg-red-500/10 text-red-300 border-red-500/30' },
  { name: 'HR', tone: 'Formal', badge: 'bg-blue-500/10 text-blue-300 border-blue-500/30' },
  { name: 'Friend', tone: 'Casual', badge: 'bg-pink-500/10 text-pink-300 border-pink-500/30' },
  { name: 'Colleague', tone: 'Professional', badge: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' },
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
        setName('');
        setEmail('');
        setRelationship('Client');
        setShowAddForm(false);
        fetchContacts();
      }
    } catch (err) {
      console.error('Error adding contact:', err);
    }
  };

  const handleDeleteContact = async (id) => {
    try {
      const res = await apiFetch(`/api/contacts/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setContacts(prev => prev.filter(c => c.id !== id));
      }
    } catch (err) {
      console.error('Error deleting contact:', err);
    }
  };

  const getRelationshipBadge = (rel) => {
    const found = RELATIONSHIPS.find(r => r.name === rel);
    return found ? found.badge : 'bg-slate-800 text-slate-300 border-slate-700';
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-indigo-400" />
            Contacts Manager
          </h2>
          <p className="text-xs text-slate-400">
            Save frequent recipients. Contact relationships auto-optimize AI tones (e.g. Client → Professional, HR → Formal).
          </p>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2.5 rounded-xl gradient-btn text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-indigo-500/20"
        >
          <UserPlus className="w-4 h-4" />
          {showAddForm ? 'Close Form' : 'Add New Contact'}
        </button>
      </div>

      {/* Add Contact Modal / Collapsible Form */}
      {showAddForm && (
        <form onSubmit={handleAddContact} className="glass-panel p-6 rounded-2xl border border-indigo-500/30 space-y-4 animate-fadeIn">
          <h3 className="text-base font-bold text-white">New Contact Entry</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">Contact Name *</label>
              <input
                type="text"
                required
                placeholder="John Client"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl glass-input text-xs text-white"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">Email Address *</label>
              <input
                type="email"
                required
                placeholder="john@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl glass-input text-xs text-white"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">Relationship</label>
              <select
                value={relationship}
                onChange={(e) => setRelationship(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl glass-input text-xs text-white"
              >
                {RELATIONSHIPS.map(r => (
                  <option key={r.name} value={r.name}>{r.name} (Tone: {r.tone})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 rounded-xl border border-slate-700 text-slate-400 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" /> Save Contact
            </button>
          </div>
        </form>
      )}

      {/* Contacts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {contacts.map((c) => (
          <div
            key={c.id}
            className="glass-panel p-5 rounded-2xl border border-slate-800/80 hover:border-indigo-500/40 transition-all space-y-4 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-base font-bold text-white">{c.name}</h4>
                  <p className="text-xs text-indigo-300 font-mono mt-0.5">{c.email}</p>
                </div>
                <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-md border ${getRelationshipBadge(c.relationship)}`}>
                  {c.relationship}
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
              <button
                onClick={() => onQuickCompose({ recipient: c.email })}
                className="px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                Quick Email
              </button>

              <button
                onClick={() => handleDeleteContact(c.id)}
                className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                title="Delete Contact"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
