import React, { useState, useEffect } from 'react';
import { Layout, Sparkles, ArrowRight, Calendar, FileText, Briefcase, Heart, AlertTriangle, Plus, Trash2, Edit3, X, Search, Check, AlertCircle } from 'lucide-react';
import { apiFetch } from '../utils/api';

const PRESET_TEMPLATES = [
  { id: 'preset-1', title: 'Emergency Leave', category: 'Emergency', situation: '🚨 Emergency', tone: 'Urgent', defaultInstruction: 'I need emergency leave this afternoon due to an urgent personal appointment.', is_system: true },
  { id: 'preset-2', title: 'Sick Leave', category: 'Leave', situation: '📅 Leave / Holiday', tone: 'Professional', defaultInstruction: 'I am taking sick leave today as I am unwell and unable to work.', is_system: true },
  { id: 'preset-3', title: 'Casual Leave', category: 'Leave', situation: '📅 Leave / Holiday', tone: 'Professional', defaultInstruction: 'I would like to request casual leave for 2 days next week for personal work.', is_system: true },
  { id: 'preset-4', title: 'Vacation Leave', category: 'Leave', situation: '📅 Leave / Holiday', tone: 'Friendly', defaultInstruction: 'Requesting annual vacation leave for 5 business days.', is_system: true },
  { id: 'preset-5', title: 'Resume Submission', category: 'Resume', situation: '📄 Resume / Job Application', tone: 'Formal', defaultInstruction: 'Submitting my resume for the open Senior Developer position.', is_system: true },
  { id: 'preset-6', title: 'Job Application', category: 'Resume', situation: '📄 Resume / Job Application', tone: 'Formal', defaultInstruction: 'Applying for the Software Engineer role with attached resume and portfolio.', is_system: true },
  { id: 'preset-7', title: 'Internship Application', category: 'Resume', situation: '📄 Resume / Job Application', tone: 'Formal', defaultInstruction: 'Expressing interest in the Summer Technical Internship Program.', is_system: true },
  { id: 'preset-8', title: 'Project Update', category: 'Official', situation: '💼 Official / Professional', tone: 'Professional', defaultInstruction: 'Providing weekly status report and milestone update for the project.', is_system: true },
  { id: 'preset-9', title: 'Meeting Request', category: 'Official', situation: '💼 Official / Professional', tone: 'Professional', defaultInstruction: 'Requesting a 30-minute sync meeting to discuss project timeline.', is_system: true },
  { id: 'preset-10', title: 'Client Communication', category: 'Official', situation: '💼 Official / Professional', tone: 'Professional', defaultInstruction: 'Sending product proposal and technical specifications to client.', is_system: true },
  { id: 'preset-11', title: 'Follow-up Email', category: 'Follow-up', situation: '🔄 Follow-up', tone: 'Professional', defaultInstruction: 'Following up on our previous discussion regarding contract approval.', is_system: true },
  { id: 'preset-12', title: 'Payment Reminder', category: 'Official', situation: '💼 Official / Professional', tone: 'Formal', defaultInstruction: 'Friendly reminder regarding pending invoice payment.', is_system: true },
  { id: 'preset-13', title: 'Complaint Letter', category: 'Official', situation: '💼 Official / Professional', tone: 'Formal', defaultInstruction: 'Formally raising an issue regarding delayed service delivery.', is_system: true },
  { id: 'preset-14', title: 'Apology Email', category: 'Official', situation: '💼 Official / Professional', tone: 'Respectful', defaultInstruction: 'Sincere apology for the unexpected delay in project submission.', is_system: true },
  { id: 'preset-15', title: 'Thank You Note', category: 'Casual', situation: '💬 Casual', tone: 'Warm', defaultInstruction: 'Expressing gratitude for support during the recent product release.', is_system: true },
  { id: 'preset-16', title: 'Congratulations', category: 'Celebration', situation: '🎉 Celebration', tone: 'Warm', defaultInstruction: 'Congratulating colleague on recent promotion and achievement.', is_system: true },
  { id: 'preset-17', title: 'Birthday Wishes', category: 'Celebration', situation: '🎉 Celebration', tone: 'Friendly', defaultInstruction: 'Sending warm birthday wishes to team member.', is_system: true },
  { id: 'preset-18', title: 'Welcome Message', category: 'Casual', situation: '💬 Casual', tone: 'Warm', defaultInstruction: 'Welcoming new team member to the department.', is_system: true },
  { id: 'preset-19', title: 'Farewell Note', category: 'Casual', situation: '💬 Casual', tone: 'Warm', defaultInstruction: 'Sending farewell message on my last working day with the company.', is_system: true }
];

const CATEGORY_TABS = [
  'All',
  'Emergency',
  'Leave',
  'Resume',
  'Official',
  'Follow-up',
  'Celebration',
  'Casual',
  'Custom'
];

export function TemplatesLibrary({ onSelectTemplate, onUseTemplate }) {
  const handleUse = onUseTemplate || onSelectTemplate;
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [templates, setTemplates] = useState(PRESET_TEMPLATES);
  const [loading, setLoading] = useState(false);

  // New Template Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Official');
  const [newSituation, setNewSituation] = useState('💼 Official / Professional');
  const [newTone, setNewTone] = useState('Professional');
  const [newInstruction, setNewInstruction] = useState('');
  const [createError, setCreateError] = useState('');
  const [savingCreate, setSavingCreate] = useState(false);

  // Edit Template Modal
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState('Official');
  const [editSituation, setEditSituation] = useState('💼 Official / Professional');
  const [editTone, setEditTone] = useState('Professional');
  const [editInstruction, setEditInstruction] = useState('');
  const [editError, setEditError] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => {
    fetchBackendTemplates();
  }, []);

  const fetchBackendTemplates = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/templates');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          // Format backend templates
          const formattedBackend = data.map(item => ({
            id: item.id,
            title: item.name || item.title || item.subject || 'Custom Template',
            category: item.category || 'Official',
            situation: item.situation || '💼 Official / Professional',
            tone: item.tone || 'Professional',
            defaultInstruction: item.body || item.defaultInstruction || '',
            is_system: Boolean(item.is_system),
            user_id: item.user_id,
          }));

          // Merge presets with backend custom templates (avoiding duplicate names)
          const customOnly = formattedBackend.filter(b => !b.is_system);
          setTemplates([...PRESET_TEMPLATES, ...customOnly]);
        }
      }
    } catch (err) {
      console.warn('Backend templates notice:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTemplate = async (e) => {
    e.preventDefault();
    setCreateError('');
    if (!newTitle.trim()) {
      setCreateError('Please provide a title for the template.');
      return;
    }
    if (!newInstruction.trim()) {
      setCreateError('Please provide email instructions or body.');
      return;
    }

    setSavingCreate(true);
    try {
      const res = await apiFetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle.trim(),
          category: newCategory,
          situation: newSituation,
          tone: newTone,
          defaultInstruction: newInstruction.trim(),
          body: newInstruction.trim()
        })
      });

      if (res.ok) {
        const created = await res.json();
        const formatted = {
          id: created.id || crypto.randomUUID(),
          title: created.name || newTitle.trim(),
          category: created.category || newCategory,
          situation: created.situation || newSituation,
          tone: created.tone || newTone,
          defaultInstruction: created.body || newInstruction.trim(),
          is_system: false
        };
        setTemplates(prev => [...prev, formatted]);
        setShowCreateModal(false);
        setNewTitle('');
        setNewInstruction('');
      } else {
        const errData = await res.json().catch(() => ({}));
        setCreateError(errData.error || 'Failed to save template.');
      }
    } catch (err) {
      setCreateError(err.message || 'Error saving template.');
    } finally {
      setSavingCreate(false);
    }
  };

  const openEditModal = (t) => {
    setEditingTemplate(t);
    setEditTitle(t.title || '');
    setEditCategory(t.category || 'Official');
    setEditSituation(t.situation || '💼 Official / Professional');
    setEditTone(t.tone || 'Professional');
    setEditInstruction(t.defaultInstruction || '');
    setEditError('');
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingTemplate) return;
    setEditError('');
    if (!editTitle.trim()) {
      setEditError('Template title cannot be empty.');
      return;
    }
    if (!editInstruction.trim()) {
      setEditError('Template instruction cannot be empty.');
      return;
    }

    setSavingEdit(true);
    try {
      const res = await apiFetch(`/api/templates/${editingTemplate.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTitle.trim(),
          category: editCategory,
          situation: editSituation,
          tone: editTone,
          defaultInstruction: editInstruction.trim(),
          body: editInstruction.trim()
        })
      });

      if (res.ok) {
        setTemplates(prev => prev.map(item => item.id === editingTemplate.id ? {
          ...item,
          title: editTitle.trim(),
          category: editCategory,
          situation: editSituation,
          tone: editTone,
          defaultInstruction: editInstruction.trim()
        } : item));
        setEditingTemplate(null);
      } else {
        const errData = await res.json().catch(() => ({}));
        setEditError(errData.error || 'Failed to update template.');
      }
    } catch (err) {
      setEditError(err.message || 'Error updating template.');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteTemplate = async (id) => {
    if (!window.confirm('Are you sure you want to delete this custom template?')) return;
    try {
      const res = await apiFetch(`/api/templates/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setTemplates(prev => prev.filter(t => t.id !== id));
      }
    } catch (err) {
      console.error('Failed to delete template:', err);
    }
  };

  const handleUseClick = (t) => {
    if (!handleUse) return;
    if (typeof onUseTemplate === 'function') {
      onUseTemplate(t);
    } else {
      handleUse(t.defaultInstruction || t.body || '');
    }
  };

  const filtered = templates.filter(t => {
    if (selectedCategory === 'Custom') {
      if (t.is_system) return false;
    } else if (selectedCategory !== 'All' && t.category !== selectedCategory) {
      return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const title = (t.title || '').toLowerCase();
      const instr = (t.defaultInstruction || '').toLowerCase();
      const sit = (t.situation || '').toLowerCase();
      return title.includes(q) || instr.includes(q) || sit.includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Header */}
      <div className="glass-panel p-6 rounded-3xl border border-[#2E2D2B] bg-[#1A1918] space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-[#F5F3EF] flex items-center gap-2">
              <Layout className="w-5 h-5 text-[#D4A373]" />
              Canned Email Templates Library
            </h2>
            <p className="text-xs text-[#99958F] mt-1">
              Select predefined scenarios or create your own custom templates to auto-populate email instructions.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Search Box */}
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-[#99958F] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search templates..."
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
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2.5 rounded-xl gold-btn text-[#121211] text-xs font-bold flex items-center gap-2 shadow-md cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4 text-[#121211]" />
              <span>Create Template</span>
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {CATEGORY_TABS.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'gold-btn text-[#121211] shadow-md'
                  : 'bg-[#22211F] text-[#99958F] border border-[#2E2D2B] hover:bg-[#2A2926]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Create Custom Template Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <form onSubmit={handleCreateTemplate} className="glass-panel p-6 rounded-3xl border border-[#2E2D2B] bg-[#1A1918] max-w-lg w-full space-y-4 shadow-2xl animate-scaleUp">
            <div className="flex items-center justify-between border-b border-[#2E2D2B] pb-3">
              <h3 className="text-sm font-extrabold text-[#F5F3EF] flex items-center gap-2">
                <Plus className="w-4 h-4 text-[#D4A373]" />
                Create Custom Template
              </h3>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-[#99958F] hover:text-[#ECE8E1]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {createError && (
              <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{createError}</span>
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-[#ECE8E1] block mb-1">Template Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Weekly Engineering Sync"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs text-[#F5F3EF]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#ECE8E1] block mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#22211F] border border-[#2E2D2B] text-xs font-bold text-[#F5F3EF]"
                  >
                    <option value="Official">Official</option>
                    <option value="Leave">Leave</option>
                    <option value="Emergency">Emergency</option>
                    <option value="Resume">Resume</option>
                    <option value="Follow-up">Follow-up</option>
                    <option value="Celebration">Celebration</option>
                    <option value="Casual">Casual</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-[#ECE8E1] block mb-1">Tone</label>
                  <select
                    value={newTone}
                    onChange={(e) => setNewTone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#22211F] border border-[#2E2D2B] text-xs font-bold text-[#F5F3EF]"
                  >
                    <option value="Professional">Professional</option>
                    <option value="Formal">Formal</option>
                    <option value="Friendly">Friendly</option>
                    <option value="Urgent">Urgent</option>
                    <option value="Warm">Warm</option>
                    <option value="Respectful">Respectful</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-[#ECE8E1] block mb-1">Situation</label>
                  <input
                    type="text"
                    value={newSituation}
                    onChange={(e) => setNewSituation(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl glass-input text-xs text-[#F5F3EF]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#ECE8E1] block mb-1">Instruction / Body</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Describe the default prompt or content for this template..."
                  value={newInstruction}
                  onChange={(e) => setNewInstruction(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs text-[#F5F3EF]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#2E2D2B]">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 rounded-xl bg-[#22211F] hover:bg-[#2A2926] text-[#99958F] text-xs font-bold border border-[#2E2D2B]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingCreate}
                className="px-5 py-2 rounded-xl gold-btn text-[#121211] text-xs font-bold shadow-md cursor-pointer disabled:opacity-50"
              >
                {savingCreate ? 'Saving...' : 'Save Template'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Custom Template Modal */}
      {editingTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <form onSubmit={handleSaveEdit} className="glass-panel p-6 rounded-3xl border border-[#2E2D2B] bg-[#1A1918] max-w-lg w-full space-y-4 shadow-2xl animate-scaleUp">
            <div className="flex items-center justify-between border-b border-[#2E2D2B] pb-3">
              <h3 className="text-sm font-extrabold text-[#F5F3EF] flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-[#D4A373]" />
                Edit Template
              </h3>
              <button
                type="button"
                onClick={() => setEditingTemplate(null)}
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
                <label className="text-xs font-bold text-[#ECE8E1] block mb-1">Template Title</label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs text-[#F5F3EF]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#ECE8E1] block mb-1">Category</label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#22211F] border border-[#2E2D2B] text-xs font-bold text-[#F5F3EF]"
                  >
                    <option value="Official">Official</option>
                    <option value="Leave">Leave</option>
                    <option value="Emergency">Emergency</option>
                    <option value="Resume">Resume</option>
                    <option value="Follow-up">Follow-up</option>
                    <option value="Celebration">Celebration</option>
                    <option value="Casual">Casual</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-[#ECE8E1] block mb-1">Tone</label>
                  <select
                    value={editTone}
                    onChange={(e) => setEditTone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#22211F] border border-[#2E2D2B] text-xs font-bold text-[#F5F3EF]"
                  >
                    <option value="Professional">Professional</option>
                    <option value="Formal">Formal</option>
                    <option value="Friendly">Friendly</option>
                    <option value="Urgent">Urgent</option>
                    <option value="Warm">Warm</option>
                    <option value="Respectful">Respectful</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-[#ECE8E1] block mb-1">Situation</label>
                  <input
                    type="text"
                    value={editSituation}
                    onChange={(e) => setEditSituation(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl glass-input text-xs text-[#F5F3EF]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#ECE8E1] block mb-1">Instruction / Body</label>
                <textarea
                  rows={4}
                  required
                  value={editInstruction}
                  onChange={(e) => setEditInstruction(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs text-[#F5F3EF]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#2E2D2B]">
              <button
                type="button"
                onClick={() => setEditingTemplate(null)}
                className="px-4 py-2 rounded-xl bg-[#22211F] hover:bg-[#2A2926] text-[#99958F] text-xs font-bold border border-[#2E2D2B]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingEdit}
                className="px-5 py-2 rounded-xl gold-btn text-[#121211] text-xs font-bold shadow-md cursor-pointer disabled:opacity-50"
              >
                {savingEdit ? 'Saving...' : 'Update Template'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Templates Grid */}
      {filtered.length === 0 ? (
        <div className="glass-panel p-12 text-center text-xs text-[#99958F] rounded-3xl border border-[#2E2D2B] bg-[#1A1918] space-y-2">
          <Layout className="w-8 h-8 text-[#D4A373] mx-auto opacity-50" />
          <p className="font-bold text-[#F5F3EF]">
            {searchQuery ? `No templates matching "${searchQuery}"` : 'No templates found in this category.'}
          </p>
          <p className="text-[#99958F]">Create custom templates or select another category above.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(t => (
            <div key={t.id} className="glass-card p-5 rounded-2xl border border-[#2E2D2B] bg-[#161514] space-y-3 flex flex-col justify-between hover:scale-[1.01] transition-all shadow-lg">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#22211F] text-[#D4A373] border border-[#2E2D2B]">
                    {t.situation}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-semibold text-[#99958F]">Tone: {t.tone}</span>
                    {!t.is_system && (
                      <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-md bg-[#D4A373]/15 text-[#D4A373] border border-[#D4A373]/30">
                        Custom
                      </span>
                    )}
                  </div>
                </div>

                <h3 className="text-sm font-extrabold text-[#F5F3EF]">
                  {t.title}
                </h3>

                <div className="p-3 rounded-xl bg-[#121211] border border-[#2E2D2B] text-xs text-[#ECE8E1] font-mono leading-relaxed line-clamp-3">
                  "{t.defaultInstruction}"
                </div>
              </div>

              <div className="pt-3 border-t border-[#2E2D2B] flex items-center justify-between">
                <div>
                  {!t.is_system && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(t)}
                        className="p-1.5 rounded-lg text-[#99958F] hover:text-[#ECE8E1] hover:bg-[#22211F] cursor-pointer"
                        title="Edit Template"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteTemplate(t.id)}
                        className="p-1.5 rounded-lg text-[#99958F] hover:text-rose-400 hover:bg-rose-500/10 cursor-pointer"
                        title="Delete Template"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => handleUseClick(t)}
                  className="px-4 py-2 rounded-xl gold-btn text-[#121211] text-xs font-bold flex items-center gap-1.5 shadow-md hover:scale-105 transition-transform cursor-pointer"
                >
                  <span>Use Template</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
