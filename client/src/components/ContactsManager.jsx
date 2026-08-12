import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Trash2, Send, Mail, Tag, Plus, Check } from 'lucide-react';
import { apiFetch } from '../utils/api';

const RELATIONSHIPS = [
  { name: 'Client', tone: 'Professional', badge: 'bg-[#E8DFC8] text-[#3F4D2A] border-[#D8D1BC]' },
  { name: 'Manager', tone: 'Formal + Professional', badge: 'bg-red-50 text-red-700 border-red-200' },
  { name: 'HR', tone: 'Formal', badge: 'bg-[#E0F2FE] text-[#075985] border-[#BAE6FD]' },
  { name: 'Friend', tone: 'Casual', badge: 'bg-[#F3F4F6] text-[#4B5563] border-[#E5E7EB]' },
  { name: 'Colleague', tone: 'Professional', badge: 'bg-[#E6F4EA] text-[#137333] border-[#A8DADC]' },
  { name: 'Other', tone: 'Professional', badge: 'bg-[#FAF8F1] text-[#28321D] border-[#D8D1BC]' }
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
      <div className="glass-panel p-6 rounded-3xl border border-[#D8D1BC] flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-[#28321D] flex items-center gap-2">
            <Users className="w-5 h-5 text-[#667A45]" />
            Contacts & Address Book
          </h2>
          <p className="text-xs text-[#6F725F] mt-1">
            Store frequent contacts to easily select recipients while composing emails
          </p>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2.5 rounded-xl gradient-btn text-[#FAF8F1] text-xs font-bold flex items-center gap-2 shadow-xs cursor-pointer"
        >
          <UserPlus className="w-4 h-4 text-[#E8DFC8]" />
          {showAddForm ? 'Close Form' : 'Add New Contact'}
        </button>
      </div>

      {/* Add Contact Form */}
      {showAddForm && (
        <form onSubmit={handleAddContact} className="glass-panel p-6 rounded-3xl border border-[#D8D1BC] space-y-4 animate-fadeIn">
          <h3 className="text-sm font-bold text-[#28321D]">New Contact Details</h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-bold text-[#28321D] block mb-1">Name</label>
              <input
                type="text"
                required
                placeholder="Alex Morgan"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs text-[#28321D]"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[#28321D] block mb-1">Email Address</label>
              <input
                type="email"
                required
                placeholder="alex@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs text-[#28321D]"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[#28321D] block mb-1">Relationship / Role</label>
              <select
                value={relationship}
                onChange={(e) => setRelationship(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs text-[#28321D] font-bold"
              >
                {RELATIONSHIPS.map(r => (
                  <option key={r.name} value={r.name}>{r.name} (Tone: {r.tone})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl gradient-btn text-[#FAF8F1] text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" /> Save Contact
            </button>
          </div>
        </form>
      )}

      {/* Contacts List Grid */}
      {loading ? (
        <div className="glass-panel p-12 text-center text-xs text-[#6F725F] rounded-3xl space-y-3 border border-[#D8D1BC]">
          <p className="font-semibold">Loading contacts list...</p>
        </div>
      ) : contacts.length === 0 ? (
        <div className="glass-panel p-12 text-center text-xs text-[#6F725F] rounded-3xl space-y-3 border border-[#D8D1BC]">
          <Users className="w-8 h-8 text-[#879B62] mx-auto opacity-50" />
          <p className="font-bold text-[#28321D]">No contacts added yet</p>
          <p className="text-[#6F725F]">Click "Add New Contact" to store team members and client emails.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {contacts.map(c => {
            const relObj = RELATIONSHIPS.find(r => r.name === c.relationship) || RELATIONSHIPS[0];
            return (
              <div key={c.id} className="glass-card p-5 rounded-2xl border border-[#D8D1BC] space-y-3 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${relObj.badge}`}>
                      {c.relationship}
                    </span>
                    <button
                      onClick={() => handleDeleteContact(c.id)}
                      className="p-1 rounded-lg text-[#6F725F] hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <h3 className="text-sm font-bold text-[#28321D]">{c.name}</h3>
                  <p className="text-xs font-mono text-[#3F4D2A]">{c.email}</p>
                </div>

                <div className="pt-3 border-t border-[#D8D1BC] flex items-center justify-between">
                  <span className="text-[10px] text-[#6F725F]">Default Tone: {relObj.tone}</span>
                  <button
                    onClick={() => onQuickCompose && onQuickCompose(c)}
                    className="px-3 py-1.5 rounded-xl bg-[#667A45] hover:bg-[#3F4D2A] text-[#FAF8F1] text-xs font-bold flex items-center gap-1 transition-all cursor-pointer shadow-xs"
                  >
                    <Send className="w-3.5 h-3.5" /> Email
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
