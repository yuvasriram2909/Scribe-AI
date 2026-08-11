import React, { useState, useEffect } from 'react';
import { Layout, Sparkles, ArrowRight, Calendar, FileText, Briefcase, Heart, AlertTriangle, RefreshCw } from 'lucide-react';
import { apiFetch } from '../utils/api';

const CATEGORY_TABS = [
  { id: 'All', label: 'All Templates' },
  { id: 'Leave/Holiday', label: '🏖️ Leave / Holiday' },
  { id: 'Resume/Job Application', label: '📄 Resume' },
  { id: 'Official/Professional', label: '💼 Official' },
  { id: 'Occasion', label: '🎉 Occasion' },
  { id: 'Emergency', label: '🚨 Emergency' }
];

export function TemplatesLibrary({ onSelectTemplate }) {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All');

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/templates');
      if (res.ok) setTemplates(await res.json());
    } catch (err) {
      console.error('Failed to load templates:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredTemplates = activeTab === 'All'
    ? templates
    : templates.filter(t => t.category.includes(activeTab.split('/')[0]));

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Layout className="w-6 h-6 text-indigo-400" />
            Email Templates Library
          </h2>
          <p className="text-xs text-slate-400">Predefined template scenarios. AI customizes tone, structure, and details automatically.</p>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {CATEGORY_TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all ${
                activeTab === tab.id
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'bg-slate-800/70 text-slate-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 text-slate-500">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 opacity-50" />
          <p className="text-xs">Loading template library...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates.map(template => (
            <div
              key={template.id}
              className="glass-panel p-5 rounded-2xl border border-slate-800 hover:border-indigo-500/40 transition-all space-y-3 flex flex-col justify-between"
            >
              <div>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-800 text-indigo-300 border border-slate-700">
                  {template.category}
                </span>
                <h4 className="text-base font-bold text-white mt-2">{template.title}</h4>
                <p className="text-xs text-slate-400 italic mt-1 line-clamp-2">"{template.instruction}"</p>
              </div>

              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-[10px] text-slate-500">AI Personalization</span>
                <button
                  onClick={() => onSelectTemplate(template.instruction)}
                  className="px-3.5 py-1.5 rounded-xl gradient-btn text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-indigo-500/20 hover:scale-[1.02] transition-transform"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Use Template
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
