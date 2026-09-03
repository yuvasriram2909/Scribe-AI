import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Send, Check, AlertCircle, RefreshCw, Paperclip, X, 
  ArrowLeft, ArrowRight, UserPlus, Eye, Edit3, ShieldCheck, ShieldAlert,
  Calendar, FileText, Briefcase, HelpCircle, Users, ExternalLink, Heart, Mail, Clock
} from 'lucide-react';
import { apiFetch, safeParseResponse } from '../utils/api';
import { signInWithGoogle } from '../utils/supabaseClient';
import { 
  EMAIL_CATEGORIES, 
  classifyEmailIntent, 
  generateIntelligentEmail 
} from '../utils/aiEngine';

const AVAILABLE_TONES = [
  'Formal',
  'Professional',
  'Polite',
  'Friendly',
  'Casual',
  'Warm',
  'Persuasive',
  'Apologetic',
  'Urgent',
  'Firm',
  'Respectful',
  'Concise'
];

export function ComposeWorkflow({ 
  composeState = {}, 
  onUpdateComposeState, 
  onResetCompose, 
  initialData = {}, 
  onComplete, 
  onCancel, 
  onNavigateToSettings 
}) {
  // Helper to sync state directly with the authoritative composeState
  const updateState = (updates) => {
    if (onUpdateComposeState) {
      onUpdateComposeState(updates);
    }
  };

  // Authoritative form state values (with initialData fallback for backwards compatibility)
  const instruction = composeState.instruction !== undefined ? composeState.instruction : (initialData.instruction || '');
  const recipient = composeState.recipient !== undefined ? composeState.recipient : (initialData.recipient || '');
  const cc = composeState.cc || '';
  const bcc = composeState.bcc || '';
  const subject = composeState.subject || '';
  const body = composeState.body || '';
  const selectedFile = composeState.selectedFile || null;
  const step = composeState.step || 1;
  const emailType = composeState.emailType || 'Professional / Official';
  const detectedCategory = composeState.detectedCategory || 'Professional / Official';
  const situation = composeState.situation || '💼 Official / Professional';
  const situationSource = composeState.situationSource || 'auto';
  const tone = composeState.tone || 'Professional';
  const priority = composeState.priority || 'MEDIUM';
  const importance = composeState.importance || 'MEDIUM';
  const urgency = composeState.urgency || 'Normal response';
  const errorMessage = composeState.errorMessage || '';
  const sentResult = composeState.sentResult || null;

  const [aiLoading, setAiLoading] = useState(false);
  const [showCcBcc, setShowCcBcc] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [draftToast, setDraftToast] = useState('');
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleTime, setScheduleTime] = useState('');

  // Register Pending Review when entering Step 3 Preview
  useEffect(() => {
    if (step === 3 && subject && body && recipient) {
      apiFetch('/api/emails/pending', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient,
          subject,
          body,
          category: detectedCategory,
          situation,
          priority,
          tone
        })
      }).catch((e) => console.warn('Pending review track notice:', e));
    }
  }, [step, subject, body, recipient]);

  const handleSaveDraft = async () => {
    if (!recipient.trim() && !subject.trim()) {
      updateState({ errorMessage: 'Please enter a recipient or subject to save a draft.' });
      return;
    }
    try {
      const res = await apiFetch('/api/emails/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient,
          cc,
          bcc,
          subject: subject || '(Untitled Draft)',
          body: body || '',
          category: detectedCategory,
          situation,
          priority,
          tone
        })
      });
      if (res.ok) {
        setDraftToast('✓ Draft successfully saved in Supabase database!');
        setTimeout(() => setDraftToast(''), 4000);
      }
    } catch (e) {
      console.error('Save draft error:', e);
    }
  };

  const handleConfirmSchedule = async () => {
    if (!recipient.trim()) {
      updateState({ errorMessage: 'Please enter a valid recipient email before scheduling.' });
      return;
    }
    try {
      const res = await apiFetch('/api/emails/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient,
          cc,
          bcc,
          subject: subject || '(Scheduled Email)',
          body: body || '',
          category: detectedCategory,
          situation,
          priority,
          tone,
          scheduledAt: scheduleTime ? new Date(scheduleTime).toISOString() : new Date(Date.now() + 3600000).toISOString()
        })
      });
      if (res.ok) {
        setShowScheduleModal(false);
        setDraftToast('✓ Email successfully scheduled in Supabase queue!');
        setTimeout(() => setDraftToast(''), 4000);
      }
    } catch (e) {
      console.error('Schedule error:', e);
    }
  };

  // Automatic AI Generation Trigger (when autoGenerate === true from Dashboard)
  useEffect(() => {
    if (composeState.autoGenerate && recipient && (instruction || subject)) {
      updateState({ autoGenerate: false });
      executeAIGeneration(instruction || subject, recipient);
    }
  }, [composeState.autoGenerate]);

  // Core AI Intent Classification & Email Generation Function
  const executeAIGeneration = async (instrText, recipText) => {
    updateState({ errorMessage: '', step: 2 });
    setAiLoading(true);

    try {
      // 1. High-precision local classification & factual generation
      const localResult = generateIntelligentEmail({
        instruction: instrText,
        userSubject: subject,
        recipient: recipText,
        hasAttachment: !!selectedFile,
        senderName: localStorage.getItem('userName') || ''
      });

      updateState({
        emailType: localResult.category,
        detectedCategory: localResult.category,
        situation: localResult.situation,
        tone: localResult.tone,
        priority: localResult.priority,
        importance: localResult.priority,
        urgency: localResult.urgency,
        situationSource: 'auto',
        subject: localResult.subject,
        body: localResult.body,
        step: 3, // Directly show Email Preview screen!
        errorMessage: ''
      });

      // 2. Background pass-through to Gemini API if configured
      try {
        const genRes = await apiFetch('/api/ai/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            instruction: instrText,
            subject: localResult.subject,
            situation: localResult.situation,
            category: localResult.category,
            tone: localResult.tone,
            priority: localResult.priority,
            urgency: localResult.urgency,
            recipient: recipText
          })
        });
        const genData = await safeParseResponse(genRes);
        if (genData && genData.body && !genData.error) {
          updateState({
            subject: genData.subject || localResult.subject,
            body: genData.body || genData.email_body || localResult.body
          });
        }
      } catch (apiErr) {
        console.warn('Backend generation note (using local intelligence):', apiErr);
      }
    } catch (err) {
      console.error('AI Generation Error:', err);
      updateState({
        errorMessage: err.message || 'Unable to generate email. Please try again.',
        step: 1
      });
    } finally {
      setAiLoading(false);
    }
  };

  // STEP 1 Form Submission (when user is composing directly on Step 1)
  const handleGenerateEmail = (e) => {
    if (e) e.preventDefault();
    const cleanInstr = instruction.trim();
    const cleanRecip = recipient.trim();

    if (!cleanInstr && !subject.trim()) {
      updateState({ errorMessage: 'Please describe what you want to send in the problem details.' });
      return;
    }
    if (!cleanRecip) {
      updateState({ errorMessage: 'Please enter a recipient email address.' });
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanRecip)) {
      updateState({ errorMessage: 'Please enter a valid email address (e.g. manager@example.com).' });
      return;
    }

    executeAIGeneration(cleanInstr || subject.trim(), cleanRecip);
  };

  // User override for Category (regenerates email with new category while keeping recipient & facts)
  const handleManualSituationChange = (newCatId) => {
    const catObj = EMAIL_CATEGORIES.find(c => c.id === newCatId || c.name === newCatId);
    if (!catObj) return;

    const reGen = generateIntelligentEmail({
      instruction: instruction || subject,
      userSubject: subject,
      recipient,
      hasAttachment: !!selectedFile,
      customCategory: catObj.id,
      customTone: catObj.defaultTone,
      customPriority: catObj.importance,
      senderName: localStorage.getItem('userName') || ''
    });

    updateState({
      situationSource: 'manual',
      emailType: catObj.name,
      detectedCategory: catObj.name,
      situation: `${catObj.icon} ${catObj.name}`,
      tone: catObj.defaultTone,
      priority: catObj.importance,
      importance: catObj.importance,
      urgency: catObj.urgency,
      subject: reGen.subject || subject,
      body: reGen.body || body
    });
  };

  // User override for Tone (regenerates email body with new tone while keeping recipient & facts)
  const handleManualToneChange = (newTone) => {
    const reGen = generateIntelligentEmail({
      instruction: instruction || subject,
      userSubject: subject,
      recipient,
      hasAttachment: !!selectedFile,
      customCategory: detectedCategory,
      customTone: newTone,
      customPriority: priority,
      senderName: localStorage.getItem('userName') || ''
    });

    updateState({
      situationSource: 'manual',
      tone: newTone,
      body: reGen.body || body
    });
  };

  // User override for Priority
  const handleManualPriorityChange = (newPriority) => {
    updateState({
      situationSource: 'manual',
      priority: newPriority,
      importance: newPriority
    });
  };

  // STEP 3 -> STEP 4: Trigger Security Confirmation Modal
  const handleStartSending = () => {
    if (!recipient.trim()) {
      updateState({ errorMessage: 'Recipient email is required.' });
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recipient.trim())) {
      updateState({ errorMessage: 'Please enter a valid recipient email address.' });
      return;
    }
    if (!subject.trim()) {
      updateState({ errorMessage: 'Email subject is required.' });
      return;
    }
    if (!body.trim()) {
      updateState({ errorMessage: 'Email body cannot be empty.' });
      return;
    }
    updateState({ errorMessage: '' });
    setShowConfirmModal(true);
  };

  // STEP 4 -> STEP 5 & 6: Final Confirmed Dispatch via Gmail API
  const handleFinalConfirmedSend = async () => {
    setShowConfirmModal(false);
    updateState({ step: 5 }); // Sending progress animation

    try {
      const formData = new FormData();
      formData.append('recipient', recipient);
      formData.append('cc', cc);
      formData.append('bcc', bcc);
      formData.append('subject', subject);
      formData.append('body', body);
      formData.append('category', detectedCategory);
      formData.append('situation', situation);
      formData.append('situationSource', situationSource);
      formData.append('priority', priority);
      formData.append('tone', tone);
      formData.append('confirmToken', 'CONFIRMED');

      if (selectedFile) {
        formData.append('attachments', selectedFile);
      }

      const res = await apiFetch('/api/emails/send', {
        method: 'POST',
        body: formData
      });

      const data = await safeParseResponse(res);
      if (!res.ok || data.error) throw new Error(data.error || 'Failed to send email.');

      updateState({
        sentResult: data,
        step: 6 // Success screen animation
      });
    } catch (err) {
      console.error('Send Error:', err);
      updateState({
        errorMessage: err.message || 'Failed to send email. Please check your Gmail connection.',
        step: 3
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">

      {/* WORKFLOW STEP PROGRESS HEADER */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex items-center justify-between overflow-x-auto scrollbar-none gap-2 shadow-xl">
        {[
          { num: 1, label: 'Instruction' },
          { num: 2, label: 'AI Intelligence' },
          { num: 3, label: 'Email Preview' },
          { num: 4, label: 'Review & Confirm' },
          { num: 5, label: 'Sent' }
        ].map((s) => (
          <div key={s.num} className="flex items-center gap-2 shrink-0">
            <div className={`w-7 h-7 rounded-full text-xs font-extrabold flex items-center justify-center transition-all ${
              step >= s.num ? 'bg-gradient-to-tr from-purple-600 to-blue-600 text-white shadow-md shadow-purple-600/30' : 'bg-slate-800 text-slate-400'
            }`}>
              {step > s.num ? <Check className="w-4 h-4 text-white" /> : s.num}
            </div>
            <span className={`text-xs font-semibold ${step >= s.num ? 'text-white' : 'text-slate-500'}`}>
              {s.label}
            </span>
            {s.num < 5 && <div className="w-6 sm:w-10 h-0.5 bg-slate-800 mx-1" />}
          </div>
        ))}
      </div>

      {/* ERROR BANNER WITH RE-AUTHORIZE BUTTON */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs flex items-center justify-between gap-3 animate-fadeIn flex-wrap shadow-lg">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          {(errorMessage.includes('Gmail') || errorMessage.includes('connect') || errorMessage.includes('OAuth') || errorMessage.includes('scopes') || errorMessage.includes('permission') || errorMessage.includes('revoked') || errorMessage.includes('expired')) && (
            <button
              onClick={async () => {
                try {
                  const res = await apiFetch('/api/auth/google/start');
                  const data = await safeParseResponse(res);
                  if (data && data.url) {
                    window.location.href = data.url;
                  } else if (onNavigateToSettings) {
                    onNavigateToSettings();
                  }
                } catch (e) {
                  if (onNavigateToSettings) onNavigateToSettings();
                }
              }}
              className="px-4 py-2 rounded-xl gradient-btn text-white font-bold text-xs flex items-center gap-1.5 shadow-md cursor-pointer"
            >
              <ExternalLink className="w-4 h-4" />
              ⚡ Connect Google Gmail
            </button>
          )}
        </div>
      )}

      {/* STEP 1: INSTRUCTION & RECIPIENTS FORM */}
      {step === 1 && (
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6 shadow-2xl">
          <div className="border-b border-slate-800 pb-4">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-cyan-400" />
              AI Intelligent Email Compose
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Enter your communication request. Scribe AI will automatically classify intent, set tone and urgency, and compose a fact-grounded email.
            </p>
          </div>

          <form onSubmit={handleGenerateEmail} className="space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300 block">
                  Recipient Email (To) <span className="text-rose-400">*</span>
                </label>

                {!showCcBcc && (
                  <button
                    type="button"
                    onClick={() => setShowCcBcc(true)}
                    className="text-xs font-bold text-purple-400 hover:text-purple-300 flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    + Add CC / BCC
                  </button>
                )}
              </div>

              <input
                type="email"
                required
                placeholder="manager@example.com, client@example.com, hr@company.com"
                value={recipient}
                onChange={(e) => updateState({ recipient: e.target.value, errorMessage: '' })}
                className="w-full px-4 py-3 rounded-2xl glass-input text-xs text-white placeholder-slate-500"
              />

              {showCcBcc && (
                <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-purple-400" /> Extra Email Deliveries (CC & BCC)
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setShowCcBcc(false);
                        updateState({ cc: '', bcc: '' });
                      }}
                      className="text-[10px] text-slate-400 hover:text-rose-400 cursor-pointer"
                    >
                      Hide CC/BCC
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                        CC (Carbon Copy)
                      </label>
                      <input
                        type="text"
                        placeholder="lead@company.com, team@firm.com"
                        value={cc}
                        onChange={(e) => updateState({ cc: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl glass-input text-xs text-white"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                        BCC (Blind Carbon Copy)
                      </label>
                      <input
                        type="text"
                        placeholder="archive@company.com, audit@firm.com"
                        value={bcc}
                        onChange={(e) => updateState({ bcc: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl glass-input text-xs text-white"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-300 block">
                  Subject / Topic <span className="text-[11px] font-normal text-slate-500">(Optional — AI automatically generates based on intent)</span>
                </label>
              </div>
              <input
                type="text"
                placeholder="e.g. Leave Request for 3 Days Due to Illness, or Complaint regarding delayed delivery"
                value={subject}
                onChange={(e) => updateState({ subject: e.target.value })}
                className="w-full px-4 py-2.5 rounded-2xl glass-input text-xs text-white placeholder-slate-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                What do you want to communicate? / Instruction <span className="text-rose-400">*</span>
              </label>
              <textarea
                rows={4}
                placeholder='Example: "I need sick leave for 3 days due to illness" or "My father had an accident and I need to leave immediately."'
                value={instruction}
                onChange={(e) => updateState({ instruction: e.target.value, errorMessage: '' })}
                className="w-full px-4 py-3 rounded-2xl glass-input text-xs text-white leading-relaxed placeholder-slate-500"
              />
            </div>

            {/* Optional Attachment */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1 flex items-center gap-1.5">
                <Paperclip className="w-4 h-4 text-purple-400" /> Attach Document or Resume (Optional)
              </label>
              <input
                type="file"
                onChange={(e) => updateState({ selectedFile: e.target.files[0] || null })}
                className="block w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-slate-800 file:text-purple-300 hover:file:bg-slate-700 file:cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              {onCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs border border-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
              )}

              <button
                type="submit"
                disabled={aiLoading}
                className="px-8 py-3 rounded-xl gradient-btn text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-purple-600/30 hover:scale-[1.02] active:scale-[0.98] transition-transform cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <Sparkles className="w-4 h-4 text-pink-200" />
                {aiLoading ? 'Analyzing & Generating...' : 'Generate Intelligent Email ✦'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* STEP 2: AI PROCESSING ANIMATION */}
      {step === 2 && (
        <div className="glass-panel p-12 rounded-3xl border border-slate-800 text-center space-y-4 animate-pulse shadow-2xl">
          <div className="w-16 h-16 mx-auto rounded-2xl gradient-btn flex items-center justify-center shadow-lg shadow-purple-600/40">
            <Sparkles className="w-8 h-8 text-white animate-spin" />
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-extrabold text-white">Scribe AI Engine Analyzing Request...</h3>
            <div className="text-slate-400 text-xs max-w-md mx-auto space-y-1">
              <p>• Classifying email intent across 20 categories...</p>
              <p>• Determining optimal tone & recipient relationship...</p>
              <p>• Detecting importance & urgency level...</p>
              <p>• Formatting structure & generating clear subject...</p>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: UPGRADED 5-FACET AI ANALYSIS & GMAIL PREVIEW */}
      {step === 3 && (
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6 shadow-2xl">
          
          {draftToast && (
            <div className="p-3.5 rounded-2xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-200 text-xs font-semibold flex items-center justify-between shadow-lg animate-fadeIn">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{draftToast}</span>
              </div>
              <button onClick={() => setDraftToast('')} className="text-emerald-400 hover:text-white p-1 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* UPGRADED 5-FACET AI EMAIL ANALYSIS CARD */}
          <div className="p-5 sm:p-6 rounded-3xl bg-[#0E1424]/90 backdrop-blur-xl border border-purple-500/20 space-y-5 shadow-2xl animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-cyan-400" />
                <h3 className="text-xs font-extrabold text-white tracking-wider uppercase">AI EMAIL INTELLIGENCE ANALYSIS</h3>
              </div>

              <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-purple-950/70 text-purple-300 border border-purple-500/30">
                {situationSource === 'manual' ? 'Status: User Configured' : 'Status: AI Classified'}
              </span>
            </div>

            {/* 5 Distinct Analysis Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 text-xs">
              
              {/* 1. Email Type */}
              <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800/80 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  📧 Email Type
                </span>
                <div className="text-xs font-extrabold text-white truncate" title={emailType}>
                  {emailType || 'Professional'}
                </div>
              </div>

              {/* 2. Detected Situation */}
              <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800/80 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  🎯 Situation
                </span>
                <div className="text-xs font-extrabold text-cyan-300 truncate" title={situation}>
                  {situation || 'Official'}
                </div>
              </div>

              {/* 3. Priority / Importance */}
              <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800/80 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  🔥 Priority
                </span>
                <div className="text-xs font-extrabold">
                  {priority === 'CRITICAL' ? (
                    <span className="text-rose-400 flex items-center gap-1 font-bold">🚨 CRITICAL</span>
                  ) : priority === 'HIGH' || priority === 'High' ? (
                    <span className="text-amber-400 flex items-center gap-1 font-bold">🔥 HIGH</span>
                  ) : priority === 'MEDIUM' || priority === 'Medium' ? (
                    <span className="text-cyan-400 flex items-center gap-1 font-bold">⚡ MEDIUM</span>
                  ) : (
                    <span className="text-emerald-400 flex items-center gap-1 font-bold">🟢 LOW</span>
                  )}
                </div>
              </div>

              {/* 4. Tone */}
              <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800/80 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  💬 Tone
                </span>
                <div className="text-xs font-extrabold text-purple-300 truncate" title={tone}>
                  {tone}
                </div>
              </div>

              {/* 5. Urgency */}
              <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800/80 space-y-1 col-span-2 sm:col-span-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  ⏱ Urgency
                </span>
                <div className="text-xs font-extrabold text-pink-300 truncate" title={urgency}>
                  {urgency || 'Normal response'}
                </div>
              </div>

            </div>

            {/* Change Situation, Tone, & Priority Overrides */}
            <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <span className="text-slate-400 font-semibold text-[11px]">
                Want to adjust parameters? Change below to automatically regenerate:
              </span>
              <div className="flex items-center gap-2 flex-wrap">
                {/* Category Dropdown (20 categories) */}
                <select
                  value={EMAIL_CATEGORIES.find(c => c.name === emailType || c.name === detectedCategory)?.id || ''}
                  onChange={(e) => handleManualSituationChange(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 text-[11px] font-bold text-cyan-300 border border-slate-700 cursor-pointer"
                >
                  <option value="" disabled>Change Category (20 Types) ▼</option>
                  {EMAIL_CATEGORIES.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.icon} {c.name}
                    </option>
                  ))}
                </select>

                {/* Tone Dropdown (12 tones) */}
                <select
                  value={AVAILABLE_TONES.find(t => tone.includes(t)) || ''}
                  onChange={(e) => handleManualToneChange(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 text-[11px] font-bold text-purple-300 border border-slate-700 cursor-pointer"
                >
                  <option value="" disabled>Change Tone ▼</option>
                  {AVAILABLE_TONES.map(t => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>

                {/* Priority Dropdown (4 levels) */}
                <select
                  value={priority.toUpperCase()}
                  onChange={(e) => handleManualPriorityChange(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 text-[11px] font-bold text-amber-300 border border-slate-700 cursor-pointer"
                >
                  <option value="LOW">🟢 Low</option>
                  <option value="MEDIUM">⚡ Medium</option>
                  <option value="HIGH">🔥 High</option>
                  <option value="CRITICAL">🚨 Critical</option>
                </select>
              </div>
            </div>
          </div>

          {/* GMAIL-STYLE EMAIL PREVIEW CARD */}
          <div className="rounded-2xl border border-slate-800 bg-[#0E1322] overflow-hidden shadow-xl">
            {/* Header Toolbar */}
            <div className="bg-slate-900/80 px-6 py-3 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-purple-400" />
                <span className="text-xs font-bold text-white tracking-wider">EMAIL PREVIEW</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                    isEditing ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  {isEditing ? 'Done Editing' : 'Edit Email'}
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4 text-xs">
              {/* Recipient Rows */}
              <div className="space-y-2 pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 font-bold w-12 shrink-0">To:</span>
                  {isEditing ? (
                    <input
                      type="email"
                      value={recipient}
                      onChange={(e) => updateState({ recipient: e.target.value })}
                      placeholder="recipient@example.com"
                      className="w-full px-3 py-1.5 rounded-lg glass-input text-xs text-cyan-300 font-mono font-bold"
                    />
                  ) : (
                    <span className="text-cyan-300 font-mono font-bold">{recipient}</span>
                  )}
                </div>
                {cc && (
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 font-bold w-12 shrink-0">CC:</span>
                    <span className="text-slate-300 font-mono">{cc}</span>
                  </div>
                )}
                {bcc && (
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 font-bold w-12 shrink-0">BCC:</span>
                    <span className="text-slate-300 font-mono">{bcc}</span>
                  </div>
                )}
              </div>

              {/* Subject Line */}
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Subject Line
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => updateState({ subject: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg glass-input text-xs text-white font-bold"
                  />
                ) : (
                  <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-white font-bold text-sm">
                    {subject}
                  </div>
                )}
              </div>

              {/* Body Content */}
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Email Body
                </label>
                {isEditing ? (
                  <textarea
                    rows={12}
                    value={body}
                    onChange={(e) => updateState({ body: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg glass-input text-xs text-white leading-relaxed font-sans"
                  />
                ) : (
                  <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-slate-200 whitespace-pre-wrap leading-relaxed font-sans text-xs">
                    {body}
                  </div>
                )}
              </div>

              {/* Attached file tag */}
              {selectedFile && (
                <div className="p-3 rounded-xl bg-purple-950/60 border border-purple-500/30 text-purple-300 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Paperclip className="w-4 h-4 text-purple-400" />
                    <span>Attached: <strong>{selectedFile.name}</strong> ({(selectedFile.size / 1024).toFixed(1)} KB)</span>
                  </div>
                  <button onClick={() => updateState({ selectedFile: null })} className="text-slate-400 hover:text-rose-400">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
            <button
              onClick={() => updateState({ step: 1 })}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Instruction
            </button>

            <div className="flex items-center gap-2.5 flex-wrap justify-end">
              <button
                type="button"
                onClick={handleSaveDraft}
                className="px-4 py-2.5 rounded-xl bg-purple-950/60 hover:bg-purple-900/60 text-purple-300 border border-purple-500/30 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
              >
                <FileText className="w-4 h-4 text-purple-400" />
                <span>Save Draft</span>
              </button>

              <button
                type="button"
                onClick={() => setShowScheduleModal(true)}
                className="px-4 py-2.5 rounded-xl bg-amber-950/60 hover:bg-amber-900/60 text-amber-300 border border-amber-500/30 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
              >
                <Clock className="w-4 h-4 text-amber-400" />
                <span>Schedule Send</span>
              </button>

              <button
                onClick={handleStartSending}
                disabled={aiLoading}
                className="px-6 py-2.5 rounded-xl gradient-btn text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-purple-600/30 hover:scale-[1.02] active:scale-[0.98] transition-transform cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 text-pink-200" />
                Confirm & Send Email ✈
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SCHEDULE MODAL */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="glass-panel max-w-md w-full p-6 rounded-3xl border border-slate-700 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">Schedule Email Dispatch</h3>
              </div>
              <button onClick={() => setShowScheduleModal(false)} className="text-slate-400 hover:text-white p-1 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-semibold text-slate-300">
                Choose Scheduled Date & Time:
              </label>
              <input
                type="datetime-local"
                value={scheduleTime}
                onChange={(e) => setScheduleTime(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-800 text-white text-xs border border-slate-700 focus:outline-none focus:border-amber-500"
              />
              <p className="text-[11px] text-slate-400">
                Your email will be queued in Supabase as "Scheduled" and will appear on the dashboard queue.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setShowScheduleModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSchedule}
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold cursor-pointer shadow-lg shadow-amber-500/20"
              >
                Save Schedule
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 4: CONFIRMATION SECURITY MODAL */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="glass-panel max-w-lg w-full p-6 sm:p-8 rounded-3xl border border-slate-700 space-y-6 shadow-2xl">
            <div className="flex items-center gap-3 text-white border-b border-slate-800 pb-4">
              <div className="w-10 h-10 rounded-xl bg-purple-950/60 border border-purple-500/30 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Final Security Confirmation</h3>
                <p className="text-xs text-slate-400">Please review before sending via Gmail API</p>
              </div>
            </div>

            <div className="space-y-3 text-xs bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Email Type:</span>
                <span className="font-bold text-white">{emailType}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Priority:</span>
                <span className="font-bold text-white">{priority}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Recipient (To):</span>
                <span className="font-mono font-bold text-cyan-300">{recipient}</span>
              </div>
              {cc && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">CC:</span>
                  <span className="font-mono text-slate-300">{cc}</span>
                </div>
              )}
              {bcc && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">BCC:</span>
                  <span className="font-mono text-slate-300">{bcc}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Subject:</span>
                <span className="font-bold text-white truncate max-w-[200px]">{subject}</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-amber-950/60 border border-amber-500/30 text-amber-300 text-[11px] flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Clicking "Authorize & Send Now" will transmit this message directly to the recipient via your Gmail API credentials.</span>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-700 cursor-pointer"
              >
                Cancel / Edit
              </button>
              <button
                onClick={handleFinalConfirmedSend}
                className="px-6 py-2.5 rounded-xl gradient-btn text-white font-bold text-xs flex items-center gap-2 shadow-md hover:scale-[1.02] transition-transform cursor-pointer"
              >
                <Send className="w-4 h-4" />
                Authorize & Send Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 5: SENDING PROGRESS ANIMATION */}
      {step === 5 && (
        <div className="glass-panel p-12 rounded-3xl border border-slate-800 text-center space-y-4 animate-pulse shadow-2xl">
          <div className="w-16 h-16 mx-auto rounded-2xl gradient-btn flex items-center justify-center shadow-lg shadow-purple-600/40">
            <Send className="w-8 h-8 text-white animate-bounce" />
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-bold text-white">Transmitting Email via Gmail API...</h3>
            <p className="text-slate-400 text-xs max-w-md mx-auto">
              Authenticating Google OAuth credentials, encoding MIME headers, and completing email delivery.
            </p>
          </div>
        </div>
      )}

      {/* STEP 6: SENT SUCCESS SCREEN */}
      {step === 6 && (
        <div className="glass-panel p-8 sm:p-12 rounded-3xl border border-emerald-500/30 text-center space-y-6 animate-fadeIn shadow-2xl">
          <div className="w-20 h-20 mx-auto rounded-2xl bg-emerald-950/60 border border-emerald-500/40 flex items-center justify-center shadow-lg shadow-emerald-900/30">
            <Check className="w-10 h-10 text-emerald-400" />
          </div>

          <div className="space-y-2">
            <h3 className="text-2xl font-extrabold text-white">Email Sent Successfully!</h3>
            <p className="text-slate-400 text-xs max-w-md mx-auto">
              Your email was successfully delivered to <strong className="text-cyan-300 font-mono">{recipient}</strong> and recorded in your account email history.
            </p>
          </div>

          {sentResult && (
            <div className="max-w-md mx-auto p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs text-left space-y-2 font-mono">
              <div className="flex justify-between">
                <span className="text-slate-500">Status:</span>
                <span className="text-emerald-400 font-bold">✓ Sent</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Email Type:</span>
                <span className="text-purple-300 font-bold">{emailType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Gmail Message ID:</span>
                <span className="text-slate-300 truncate max-w-[200px]">{sentResult.gmailMessageId || 'N/A'}</span>
              </div>
            </div>
          )}

          <div className="flex items-center justify-center gap-4 pt-4">
            <button
              onClick={() => {
                if (onResetCompose) {
                  onResetCompose();
                } else {
                  updateState({
                    step: 1,
                    instruction: '',
                    recipient: '',
                    cc: '',
                    bcc: '',
                    subject: '',
                    body: '',
                    selectedFile: null,
                    sentResult: null
                  });
                }
              }}
              className="px-6 py-3 rounded-xl gradient-btn text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-purple-600/30 hover:scale-[1.02] cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              Compose Another Email
            </button>

            {onComplete && (
              <button
                onClick={() => {
                  if (onResetCompose) onResetCompose();
                  onComplete();
                }}
                className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 font-bold text-xs cursor-pointer"
              >
                Go to Dashboard
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
