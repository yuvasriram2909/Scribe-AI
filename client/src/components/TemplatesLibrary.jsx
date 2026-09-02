import React, { useState } from 'react';
import { Layout, Sparkles, ArrowRight, Calendar, FileText, Briefcase, Heart, AlertTriangle } from 'lucide-react';

const CANNED_TEMPLATES_LIST = [
  { id: '1', title: 'Emergency Leave', category: 'Emergency', situation: '🚨 Emergency', tone: 'Urgent', defaultInstruction: 'I need emergency leave this afternoon due to an urgent personal appointment.' },
  { id: '2', title: 'Sick Leave', category: 'Leave', situation: '📅 Leave / Holiday', tone: 'Professional', defaultInstruction: 'I am taking sick leave today as I am unwell and unable to work.' },
  { id: '3', title: 'Casual Leave', category: 'Leave', situation: '📅 Leave / Holiday', tone: 'Professional', defaultInstruction: 'I would like to request casual leave for 2 days next week for personal work.' },
  { id: '4', title: 'Vacation Leave', category: 'Leave', situation: '📅 Leave / Holiday', tone: 'Friendly', defaultInstruction: 'Requesting annual vacation leave for 5 business days.' },
  { id: '5', title: 'Resume Submission', category: 'Resume', situation: '📄 Resume / Job Application', tone: 'Formal', defaultInstruction: 'Submitting my resume for the open Senior Developer position.' },
  { id: '6', title: 'Job Application', category: 'Resume', situation: '📄 Resume / Job Application', tone: 'Formal', defaultInstruction: 'Applying for the Software Engineer role with attached resume and portfolio.' },
  { id: '7', title: 'Internship Application', category: 'Resume', situation: '📄 Resume / Job Application', tone: 'Formal', defaultInstruction: 'Expressing interest in the Summer Technical Internship Program.' },
  { id: '8', title: 'Project Update', category: 'Official', situation: '💼 Official / Professional', tone: 'Professional', defaultInstruction: 'Providing weekly status report and milestone update for the project.' },
  { id: '9', title: 'Meeting Request', category: 'Official', situation: '💼 Official / Professional', tone: 'Professional', defaultInstruction: 'Requesting a 30-minute sync meeting to discuss project timeline.' },
  { id: '10', title: 'Client Communication', category: 'Official', situation: '💼 Official / Professional', tone: 'Professional', defaultInstruction: 'Sending product proposal and technical specifications to client.' },
  { id: '11', title: 'Follow-up Email', category: 'Follow-up', situation: '🔄 Follow-up', tone: 'Professional', defaultInstruction: 'Following up on our previous discussion regarding contract approval.' },
  { id: '12', title: 'Payment Reminder', category: 'Official', situation: '💼 Official / Professional', tone: 'Formal', defaultInstruction: 'Friendly reminder regarding pending invoice payment.' },
  { id: '13', title: 'Complaint Letter', category: 'Official', situation: '💼 Official / Professional', tone: 'Formal', defaultInstruction: 'Formally raising an issue regarding delayed service delivery.' },
  { id: '14', title: 'Apology Email', category: 'Official', situation: '💼 Official / Professional', tone: 'Respectful', defaultInstruction: 'Sincere apology for the unexpected delay in project submission.' },
  { id: '15', title: 'Thank You Note', category: 'Casual', situation: '💬 Casual', tone: 'Warm', defaultInstruction: 'Expressing gratitude for support during the recent product release.' },
  { id: '16', title: 'Congratulations', category: 'Celebration', situation: '🎉 Celebration', tone: 'Warm', defaultInstruction: 'Congratulating colleague on recent promotion and achievement.' },
  { id: '17', title: 'Birthday Wishes', category: 'Celebration', situation: '🎉 Celebration', tone: 'Friendly', defaultInstruction: 'Sending warm birthday wishes to team member.' },
  { id: '18', title: 'Welcome Message', category: 'Casual', situation: '💬 Casual', tone: 'Warm', defaultInstruction: 'Welcoming new team member to the department.' },
  { id: '19', title: 'Farewell Note', category: 'Casual', situation: '💬 Casual', tone: 'Warm', defaultInstruction: 'Sending farewell message on my last working day with the company.' }
];

const CATEGORY_TABS = [
  'All',
  'Emergency',
  'Leave',
  'Resume',
  'Official',
  'Follow-up',
  'Celebration',
  'Casual'
];

export function TemplatesLibrary({ onSelectTemplate }) {
  const [selectedCategory, setSelectedCategory] = useState('All');

  const filtered = selectedCategory === 'All'
    ? CANNED_TEMPLATES_LIST
    : CANNED_TEMPLATES_LIST.filter(t => t.category === selectedCategory);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Header */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4 shadow-xl">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <Layout className="w-5 h-5 text-purple-400" />
            Canned Email Templates Library
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            19 predefined professional scenarios. Select any template to auto-populate email instructions.
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {CATEGORY_TABS.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'gradient-btn text-white shadow-md'
                  : 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(t => (
          <div key={t.id} className="glass-card p-5 rounded-2xl border border-slate-800 space-y-3 flex flex-col justify-between hover:scale-[1.01] transition-all shadow-lg">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-purple-950/60 text-purple-300 border border-purple-500/30">
                  {t.situation}
                </span>
                <span className="text-[10px] font-semibold text-slate-500">Tone: {t.tone}</span>
              </div>

              <h3 className="text-sm font-extrabold text-white">
                {t.title}
              </h3>

              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300 font-mono leading-relaxed line-clamp-3">
                "{t.defaultInstruction}"
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-end">
              <button
                onClick={() => onSelectTemplate && onSelectTemplate(t.defaultInstruction)}
                className="px-4 py-2 rounded-xl gradient-btn text-white text-xs font-bold flex items-center gap-1.5 shadow-md hover:scale-105 transition-transform cursor-pointer"
              >
                <span>Use Template</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
