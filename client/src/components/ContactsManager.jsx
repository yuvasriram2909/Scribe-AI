import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Trash2, Send, Mail, Tag, Plus, Check } from 'lucide-react';
import { apiFetch } from '../utils/api';

const RELATIONSHIPS = [
  { name: 'Client', tone: 'Professional', badge: 'bg-[#22211F] text-[#D4A373] border-[#2E2D2B]' },
  { name: 'Manager', tone: 'Formal + Professional', badge: 'bg-[#22211F] text-[#ECE8E1] border-[#2E2D2B]' },
  { name: 'HR', tone: 'Formal', badge: 'bg-[#22211F] text-[#ECE8E1] border-[#2E2D2B]' },
  { name: 'Friend', tone: 'Casual', badge: 'bg-[#22211F] text-[#99958F] border-[#2E2D2B]' },
  { name: 'Colleague', tone: 'Professional', badge: 'bg-[#22211F] text-[#D4A373] border-[#2E2D2B]' },
  { name: 'Other', tone: 'Professional', badge: 'bg-[#22211F] text-[#99958F] border-[#2E2D2B]' }
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
      <div className="glass-panel p-6 rounded-3xl border border-[#2E2D2B] bg-[#1A1918] flex items-center justify-between shadow-xl">
        <div>
          <h2 className="text-xl font-extrabold text-[#F5F3EF] flex items-center gap-2">
            <Users className="w-5 h-5 text-[#D4A373]" />
            Contacts & Address Book
          </h2>
          <p className="text-xs text-[#99958F] mt-1">
            Store frequent contacts to easily select recipients while composing emails
          </p>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2.5 rounded-xl gold-btn text-[#121211] text-xs font-bold flex items-center gap-2 shadow-md cursor-pointer"
        >
          <UserPlus className="w-4 h-4 text-[#121211]" />
          {showAddForm ? 'Close Form' : 'Add New Contact'}
        </button>
      </div>

      {/* Add Contact Form */}
      {showAddForm && (
        <form onSubmit={handleAddContact} className="glass-panel p-6 rounded-3xl border border-[#2E2D2B] bg-[#1A1918] space-y-4 animate-fadeIn shadow-xl">
          <h3 className="text-sm font-extrabold text-[#F5F3EF]">Add New Contact</h3>
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

      {/* Contacts Grid */}
      {loading ? (
        <div className="glass-panel p-12 text-center text-xs text-[#99958F] rounded-3xl border border-[#2E2D2B] bg-[#1A1918]">
          Loading contacts...
        </div>
      ) : contacts.length === 0 ? (
        <div className="glass-panel p-12 text-center text-xs text-[#99958F] rounded-3xl border border-[#2E2D2B] bg-[#1A1918] space-y-2">
          <Users className="w-8 h-8 text-[#D4A373] mx-auto opacity-50" />
          <p className="font-bold text-[#F5F3EF]">No contacts saved yet.</p>
          <p className="text-[#99958F]">Add frequent recipients for quick 1-click email drafting.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {contacts.map(c => {
            const rel = RELATIONSHIPS.find(r => r.name === c.relationship) || RELATIONSHIPS[0];
            return (
              <div key={c.id} className="glass-card p-5 rounded-2xl border border-[#2E2D2B] bg-[#161514] space-y-3 flex flex-col justify-between hover:scale-[1.01] transition-all">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#22211F] border border-[#2E2D2B] text-[#D4A373] font-extrabold text-sm flex items-center justify-center shadow-md">
                      {c.name[0].toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-xs font-extrabold text-[#F5F3EF]">{c.name}</h4>
                      <p className="text-[11px] text-[#D4A373] font-mono">{c.email}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${rel.badge}`}>
                    {c.relationship}
                  </span>
                </div>

                <div className="pt-3 border-t border-[#2E2D2B] flex items-center justify-between">
                  <button
                    onClick={() => onQuickCompose && onQuickCompose(c)}
                    className="text-xs text-[#D4A373] hover:text-[#c59362] font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" /> Compose Email
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
            );
          })}
        </div>
      )}
    </div>
  );
}
