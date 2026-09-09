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
  ADVANCED_TONES,
  classifyEmailIntent, 
  generateIntelligentEmail 
} from '../utils/aiEngine';
import { 
  validateEmailList, 
  parseEmailList, 
  formatEmailList 
} from '../utils/emailValidation';

const AVAILABLE_TONES = ADVANCED_TONES;

export function ComposeWorkflow({ 
  composeState = {}, 
  onUpdateComposeState, 
  onResetCompose, 
  initialData = {}, 
  onComplete, 
  onNavigateToDashboard,
  onViewHistory,
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
  const cc = composeState.cc !== undefined ? composeState.cc : (initialData.cc || '');
  const bcc = composeState.bcc !== undefined ? composeState.bcc : (initialData.bcc || '');
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

  const gmailDraftId = composeState.gmailDraftId || initialData.gmail_draft_id || initialData.gmailDraftId || null;
  const scribeDraftId = composeState.scribeDraftId || composeState.id || initialData.scribe_draft_id || initialData.scribeDraftId || initialData.id || null;

  const [aiLoading, setAiLoading] = useState(false);
  const [showCcBcc, setShowCcBcc] = useState(Boolean(composeState.cc || composeState.bcc || initialData.cc || initialData.bcc));
  const [isEditing, setIsEditing] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [draftToast, setDraftToast] = useState('');
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleTime, setScheduleTime] = useState('');

  // Parsed recipient list for multi-recipient rendering and interaction
  const parsedRecipients = parseEmailList(recipient);
  const removeRecipient = (toRemove) => {
    const remaining = parsedRecipients.filter(r => r.toLowerCase() !== toRemove.toLowerCase());
    updateState({ recipient: remaining.join(', '), errorMessage: '' });
  };

  // Register Pending Review when entering Step 3 Preview
  useEffect(() => {
    if (step === 3 && subject && body && recipient) {
      apiFetch('/api/emails/pending', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient,
          cc,
          bcc,
          subject,
          body,
          category: detectedCategory,
          situation,
          priority,
          tone
        })
      }).catch(() => {});
    }
  }, [step, subject, body, recipient]);

  const handleSaveDraft = async () => {
    if (!recipient && !subject && !body) {
      updateState({ errorMessage: 'Cannot save an empty email as draft.' });
      return;
    }
    try {
      const activeDraftId = composeState.scribeDraftId || composeState.id || initialData.scribe_draft_id || initialData.id || null;
      const res = await apiFetch('/api/emails/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: activeDraftId,
          recipient,
          cc,
          bcc,
          subject: subject || '(Untitled Draft)',
          body: body || '',
          category: detectedCategory,
          situation,
          priority,
          tone,
          gmailDraftId,
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.gmailDraftId) {
          updateState({ gmailDraftId: data.gmailDraftId });
        }
        if (data?.email?.id) {
          updateState({ id: data.email.id, scribeDraftId: data.email.id });
        }
        setDraftToast('✓ Saved as Gmail Draft & synchronized with mailbox!');
        setTimeout(() => setDraftToast(''), 4000);
      }
    } catch (e) {
      console.error('Save draft error:', e);
    }
  };

  const handleConfirmSchedule = async () => {
    const valRes = validateEmailList(recipient, { fieldName: 'Recipient email' });
    if (!valRes.isValid) {
      updateState({ errorMessage: valRes.error });
      return;
    }
    if (cc && cc.trim()) {
      const ccVal = validateEmailList(cc, { fieldName: 'CC', allowEmpty: true });
      if (!ccVal.isValid) {
        updateState({ errorMessage: ccVal.error });
        return;
      }
    }
    if (bcc && bcc.trim()) {
      const bccVal = validateEmailList(bcc, { fieldName: 'BCC', allowEmpty: true });
      if (!bccVal.isValid) {
        updateState({ errorMessage: bccVal.error });
        return;
      }
    }
    try {
      const res = await apiFetch('/api/emails/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient: valRes.formatted,
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
        customTone: tone && tone !== 'Professional' ? tone : null,
        senderName: localStorage.getItem('userName') || ''
      });

      updateState({
        emailType: localResult.category,
        detectedCategory: localResult.category,
        situation: localResult.situation,
        tone: localResult.tone || tone,
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
    const valRes = validateEmailList(cleanRecip, { fieldName: 'Recipient email' });
    if (!valRes.isValid) {
      updateState({ errorMessage: valRes.error });
      return;
    }

    if (cc && cc.trim()) {
      const ccVal = validateEmailList(cc, { fieldName: 'CC', allowEmpty: true });
      if (!ccVal.isValid) {
        updateState({ errorMessage: ccVal.error });
        return;
      }
    }

    if (bcc && bcc.trim()) {
      const bccVal = validateEmailList(bcc, { fieldName: 'BCC', allowEmpty: true });
      if (!bccVal.isValid) {
        updateState({ errorMessage: bccVal.error });
        return;
      }
    }

    const normalizedRecipient = valRes.formatted;
    updateState({ recipient: normalizedRecipient, errorMessage: '' });
    executeAIGeneration(cleanInstr || subject.trim(), normalizedRecipient);
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
      tone: reGen.tone || newTone,
      subject: reGen.subject || subject,
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
    const valRes = validateEmailList(recipient, { fieldName: 'Recipient email' });
    if (!valRes.isValid) {
      updateState({ errorMessage: valRes.error });
      return;
    }

    if (cc && cc.trim()) {
      const ccVal = validateEmailList(cc, { fieldName: 'CC', allowEmpty: true });
      if (!ccVal.isValid) {
        updateState({ errorMessage: ccVal.error });
        return;
      }
    }

    if (bcc && bcc.trim()) {
      const bccVal = validateEmailList(bcc, { fieldName: 'BCC', allowEmpty: true });
      if (!bccVal.isValid) {
        updateState({ errorMessage: bccVal.error });
        return;
      }
    }

    if (!subject.trim()) {
      updateState({ errorMessage: 'Email subject is required.' });
      return;
    }
    if (!body.trim()) {
      updateState({ errorMessage: 'Email body cannot be empty.' });
      return;
    }

    updateState({ recipient: valRes.formatted, errorMessage: '' });
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

      const activeDraftId = composeState.scribeDraftId || composeState.id || initialData.scribe_draft_id || initialData.id;
      if (activeDraftId) {
        formData.append('draftId', activeDraftId);
      }
      if (gmailDraftId) {
        formData.append('gmailDraftId', gmailDraftId);
      }

      if (selectedFile) {
        formData.append('attachments', selectedFile);
      }

      const res = await apiFetch('/api/emails/send', {
        method: 'POST',
        body: formData
      });

      const data = await safeParseResponse(res);
      if (!res.ok || data.error) throw new Error(data.error || 'Failed to send email.');

      // Instant optimistic increment for stats cache in localStorage (0ms latency)
      try {
        const cachedRaw = localStorage.getItem('scribe_stats_cache');
        const cached = cachedRaw ? JSON.parse(cachedRaw) : null;
        if (cached) {
          cached.sent = (Number(cached.sent) || 0) + 1;
          cached.sentToday = (Number(cached.sentToday) || 0) + 1;
          cached.total = (Number(cached.total) || 0) + 1;
          if (cached.categories) {
            const catKey = (detectedCategory || '').toLowerCase();
            for (const k of Object.keys(cached.categories)) {
              if (catKey.includes(k.toLowerCase())) {
                cached.categories[k] = (cached.categories[k] || 0) + 1;
                break;
              }
            }
          }
          localStorage.setItem('scribe_stats_cache', JSON.stringify(cached));
        }
      } catch (_) {}

      // Dispatch global real-time event for instant 0ms UI metric reaction across the app
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('scribe-email-sent', {
          detail: {
            email: data.email || null,
            category: detectedCategory || 'Official / Professional',
            recipient,
            subject,
            sentAt: new Date().toISOString()
          }
        }));
      }

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
      <div className="glass-panel p-4 rounded-2xl border border-[#2E2D2B] flex items-center justify-between overflow-x-auto scrollbar-none gap-2 shadow-xl">
        {[
          { num: 1, label: 'Instruction' },
          { num: 2, label: 'AI Intelligence' },
          { num: 3, label: 'Email Preview' },
          { num: 4, label: 'Review & Confirm' },
          { num: 5, label: 'Sent' }
        ].map((s) => (
          <div key={s.num} className="flex items-center gap-2 shrink-0">
            <div className={`w-7 h-7 rounded-full text-xs font-extrabold flex items-center justify-center transition-all ${
              step >= s.num ? 'bg-[#D4A373] text-[#121211] shadow-md shadow-[#D4A373]/20' : 'bg-[#22211F] text-[#99958F]'
            }`}>
              {step > s.num ? <Check className="w-4 h-4 text-[#121211]" /> : s.num}
            </div>
            <span className={`text-xs font-semibold ${step >= s.num ? 'text-[#F5F3EF]' : 'text-[#99958F]'}`}>
              {s.label}
            </span>
            {s.num < 5 && <div className="w-6 sm:w-10 h-0.5 bg-[#2E2D2B] mx-1" />}
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
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-[#2E2D2B] space-y-6 shadow-2xl">
          <div className="border-b border-[#2E2D2B] pb-4">
            <h2 className="text-2xl font-bold text-[#F5F3EF] flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-[#D4A373]" />
              AI Intelligent Email Compose
            </h2>
            <p className="text-xs text-[#99958F] mt-1">
              Enter your communication request. Scribe AI will automatically classify intent, set tone and urgency, and compose a fact-grounded email.
            </p>
          </div>

          <form onSubmit={handleGenerateEmail} className="space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-[#ECE8E1] block">
                  Recipient Email (To) <span className="text-rose-400">*</span>
                </label>

                {!showCcBcc && (
                  <button
                    type="button"
                    onClick={() => setShowCcBcc(true)}
                    className="text-xs font-bold text-[#D4A373] hover:text-[#c59362] flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    + Add CC / BCC
                  </button>
                )}
              </div>

              <input
                type="text"
                required
                placeholder="manager@example.com, client@example.com, hr@company.com"
                value={recipient}
                onChange={(e) => updateState({ recipient: e.target.value, errorMessage: '' })}
                className="w-full px-4 py-3 rounded-2xl glass-input text-xs text-[#F5F3EF] placeholder-[#99958F]"
              />

              <div className="flex items-center justify-between text-[11px] text-[#99958F] px-1">
                <span>💡 You can enter multiple recipient emails separated by comma (<code className="text-[#D4A373]">,</code>) or semicolon (<code className="text-[#D4A373]">;</code>)</span>
                {parsedRecipients.length > 1 && (
                  <span className="text-[#D4A373] font-bold bg-[#D4A373]/10 px-2 py-0.5 rounded-md border border-[#D4A373]/30">
                    ✓ {parsedRecipients.length} recipients detected
                  </span>
                )}
              </div>

              {parsedRecipients.length > 1 && (
                <div className="flex flex-wrap gap-1.5 pt-1 animate-fadeIn">
                  {parsedRecipients.map((emailAddr, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#22211F] border border-[#2E2D2B] text-xs text-[#ECE8E1] font-mono shadow-sm"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-[#D4A373]"></span>
                      <span className="text-[#D4A373] font-bold">{emailAddr}</span>
                      <button
                        type="button"
                        onClick={() => removeRecipient(emailAddr)}
                        className="text-[#99958F] hover:text-rose-400 font-bold ml-1 cursor-pointer transition-colors"
                        title={`Remove ${emailAddr}`}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {showCcBcc && (
                <div className="p-4 rounded-2xl bg-[#161514] border border-[#2E2D2B] space-y-3 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#ECE8E1] flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-[#D4A373]" /> Extra Email Deliveries (CC & BCC)
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setShowCcBcc(false);
                        updateState({ cc: '', bcc: '' });
                      }}
                      className="text-[10px] text-[#99958F] hover:text-rose-400 cursor-pointer"
                    >
                      Hide CC/BCC
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-[#ECE8E1] block mb-1">
                        CC (Carbon Copy)
                      </label>
                      <input
                        type="text"
                        placeholder="lead@company.com, team@firm.com"
                        value={cc}
                        onChange={(e) => updateState({ cc: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl glass-input text-xs text-[#F5F3EF]"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-[#ECE8E1] block mb-1">
                        BCC (Blind Carbon Copy)
                      </label>
                      <input
                        type="text"
                        placeholder="archive@company.com, audit@firm.com"
                        value={bcc}
                        onChange={(e) => updateState({ bcc: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl glass-input text-xs text-[#F5F3EF]"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-[#ECE8E1] block">
                  Subject / Topic <span className="text-[11px] font-normal text-[#99958F]">(Optional — AI automatically generates based on intent)</span>
                </label>
              </div>
              <input
                type="text"
                placeholder="e.g. Leave Request for 3 Days Due to Illness, or Complaint regarding delayed delivery"
                value={subject}
                onChange={(e) => updateState({ subject: e.target.value })}
                className="w-full px-4 py-2.5 rounded-2xl glass-input text-xs text-[#F5F3EF] placeholder-[#99958F]"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[#ECE8E1] block mb-1">
                What do you want to communicate? / Instruction <span className="text-rose-400">*</span>
              </label>
              <textarea
                rows={4}
                placeholder='Example: "I need sick leave for 3 days due to illness" or "My father had an accident and I need to leave immediately."'
                value={instruction}
                onChange={(e) => updateState({ instruction: e.target.value, errorMessage: '' })}
                className="w-full px-4 py-3 rounded-2xl glass-input text-xs text-[#F5F3EF] leading-relaxed placeholder-[#99958F]"
              />
            </div>

            {/* Tone & Style Selector */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-[#ECE8E1] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#D4A373]" />
                  <span>Communication Tone & Style</span>
                  <span className="text-[10px] text-[#D4A373] bg-[#D4A373]/10 px-2 py-0.5 rounded-full border border-[#D4A373]/30 font-semibold">
                    12 Advanced Tones
                  </span>
                </label>
                <span className="text-[11px] text-[#99958F]">
                  Auto-adapts to situation or select preferred style
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {AVAILABLE_TONES.map(t => {
                  const isSelected = tone && (tone.toLowerCase().includes(t.id) || tone.toLowerCase().includes(t.name.toLowerCase()));
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => updateState({ tone: t.name })}
                      className={`p-2.5 rounded-2xl border text-left transition-all flex flex-col justify-between cursor-pointer group hover:scale-[1.01] ${
                        isSelected 
                          ? 'border-[#D4A373] bg-[#D4A373]/12 shadow-sm shadow-[#D4A373]/20 ring-1 ring-[#D4A373]/40' 
                          : 'border-[#2E2D2B] bg-[#161514] hover:border-[#D4A373]/40 hover:bg-[#1C1B19]'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-sm">{t.icon}</span>
                        <span className={`text-[11px] font-bold truncate ${isSelected ? 'text-[#D4A373]' : 'text-[#ECE8E1] group-hover:text-[#F5F3EF]'}`}>
                          {t.name}
                        </span>
                      </div>
                      <p className="text-[10px] text-[#99958F] line-clamp-2 leading-tight">
                        {t.tagline}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Optional Attachment */}
            <div>
              <label className="text-xs font-semibold text-[#ECE8E1] block mb-1 flex items-center gap-1.5">
                <Paperclip className="w-4 h-4 text-[#D4A373]" /> Attach Document or Resume (Optional)
              </label>
              <input
                type="file"
                onChange={(e) => updateState({ selectedFile: e.target.files[0] || null })}
                className="block w-full text-xs text-[#99958F] file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#22211F] file:text-[#D4A373] hover:file:bg-[#2A2926] file:cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#2E2D2B]">
              {onCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  className="px-5 py-2.5 rounded-xl bg-[#22211F] hover:bg-[#2A2926] text-[#ECE8E1] font-bold text-xs border border-[#2E2D2B] cursor-pointer"
                >
                  Cancel
                </button>
              )}

              <button
                type="submit"
                disabled={aiLoading}
                className="px-8 py-3 rounded-xl gold-btn light-sweep text-[#121211] font-bold text-xs flex items-center gap-2 shadow-lg cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed group"
              >
                <Sparkles className="w-4 h-4 text-[#121211] btn-icon-spin transition-transform" />
                <span>{aiLoading ? 'Analyzing & Generating...' : 'Generate Intelligent Email'}</span>
                <span className="btn-arrow-slide transition-transform duration-200">✦</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* STEP 2: AI PROCESSING ANIMATION */}
      {step === 2 && (
        <div className="glass-panel p-12 rounded-3xl border border-[#2E2D2B] text-center space-y-4 animate-pulse shadow-2xl">
          <div className="w-16 h-16 mx-auto rounded-2xl gold-btn flex items-center justify-center shadow-lg shadow-[#D4A373]/20">
            <Sparkles className="w-8 h-8 text-[#121211] animate-spin" />
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-extrabold text-[#F5F3EF]">Scribe AI Engine Analyzing Request...</h3>
            <div className="text-[#99958F] text-xs max-w-md mx-auto space-y-1">
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
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-[#2E2D2B] space-y-6 shadow-2xl">
          
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
          <div className="p-5 sm:p-6 rounded-3xl bg-[#1A1918] backdrop-blur-xl border border-[#2E2D2B] space-y-5 shadow-2xl animate-fadeIn">
            <div className="flex items-center justify-between border-b border-[#2E2D2B] pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#D4A373]" />
                <h3 className="text-xs font-extrabold text-[#F5F3EF] tracking-wider uppercase">AI EMAIL INTELLIGENCE ANALYSIS</h3>
              </div>

              <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-[#22211F] text-[#D4A373] border border-[#2E2D2B]">
                {situationSource === 'manual' ? 'Status: User Configured' : 'Status: AI Classified'}
              </span>
            </div>

            {/* 5 Distinct Analysis Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 text-xs">
              
              {/* 1. Email Type */}
              <div className="p-3 rounded-2xl bg-[#161514] border border-[#2E2D2B] space-y-1">
                <span className="text-[10px] font-bold text-[#99958F] uppercase tracking-wider block">
                  📧 Email Type
                </span>
                <div className="text-xs font-extrabold text-[#F5F3EF] truncate" title={emailType}>
                  {emailType || 'Professional'}
                </div>
              </div>

              {/* 2. Detected Situation */}
              <div className="p-3 rounded-2xl bg-[#161514] border border-[#2E2D2B] space-y-1">
                <span className="text-[10px] font-bold text-[#99958F] uppercase tracking-wider block">
                  🎯 Situation
                </span>
                <div className="text-xs font-extrabold text-[#D4A373] truncate" title={situation}>
                  {situation || 'Official'}
                </div>
              </div>

              {/* 3. Priority / Importance */}
              <div className="p-3 rounded-2xl bg-[#161514] border border-[#2E2D2B] space-y-1">
                <span className="text-[10px] font-bold text-[#99958F] uppercase tracking-wider block">
                  🔥 Priority
                </span>
                <div className="text-xs font-extrabold">
                  {priority === 'CRITICAL' ? (
                    <span className="text-rose-400 flex items-center gap-1 font-bold">🚨 CRITICAL</span>
                  ) : priority === 'HIGH' || priority === 'High' ? (
                    <span className="text-[#D4A373] flex items-center gap-1 font-bold">🔥 HIGH</span>
                  ) : priority === 'MEDIUM' || priority === 'Medium' ? (
                    <span className="text-[#ECE8E1] flex items-center gap-1 font-bold">⚡ MEDIUM</span>
                  ) : (
                    <span className="text-emerald-400 flex items-center gap-1 font-bold">🟢 LOW</span>
                  )}
                </div>
              </div>

              {/* 4. Tone */}
              <div className="p-3 rounded-2xl bg-[#161514] border border-[#2E2D2B] space-y-1">
                <span className="text-[10px] font-bold text-[#99958F] uppercase tracking-wider block">
                  💬 Tone
                </span>
                <div className="text-xs font-extrabold text-[#ECE8E1] truncate" title={tone}>
                  {tone}
                </div>
              </div>

              {/* 5. Urgency */}
              <div className="p-3 rounded-2xl bg-[#161514] border border-[#2E2D2B] space-y-1 col-span-2 sm:col-span-1">
                <span className="text-[10px] font-bold text-[#99958F] uppercase tracking-wider block">
                  ⏱ Urgency
                </span>
                <div className="text-xs font-extrabold text-[#D4A373] truncate" title={urgency}>
                  {urgency || 'Normal response'}
                </div>
              </div>

            </div>

            {/* Change Situation, Tone, & Priority Overrides */}
            <div className="pt-3 border-t border-[#2E2D2B] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <span className="text-[#99958F] font-semibold text-[11px]">
                Want to adjust parameters? Change below to automatically regenerate:
              </span>
              <div className="flex items-center gap-2 flex-wrap">
                {/* Category Dropdown (20 categories) */}
                <select
                  value={EMAIL_CATEGORIES.find(c => c.name === emailType || c.name === detectedCategory)?.id || ''}
                  onChange={(e) => handleManualSituationChange(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-[#22211F] text-[11px] font-bold text-[#D4A373] border border-[#2E2D2B] cursor-pointer"
                >
                  <option value="" disabled>Change Category (20 Types) ▼</option>
                  {EMAIL_CATEGORIES.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.icon} {c.name}
                    </option>
                  ))}
                </select>

                {/* Tone Dropdown (12 Advanced Tones) */}
                <select
                  value={AVAILABLE_TONES.find(t => tone && (tone.toLowerCase().includes(t.id) || tone.toLowerCase().includes(t.name.toLowerCase())))?.name || tone}
                  onChange={(e) => handleManualToneChange(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-[#22211F] text-[11px] font-bold text-[#ECE8E1] border border-[#2E2D2B] cursor-pointer"
                >
                  <option value="" disabled>Change Tone ▼</option>
                  {AVAILABLE_TONES.map(t => (
                    <option key={t.id} value={t.name}>
                      {t.icon} {t.name}
                    </option>
                  ))}
                </select>

                {/* Priority Dropdown (4 levels) */}
                <select
                  value={priority.toUpperCase()}
                  onChange={(e) => handleManualPriorityChange(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-[#22211F] text-[11px] font-bold text-[#D4A373] border border-[#2E2D2B] cursor-pointer"
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
          <div className="rounded-2xl border border-[#2E2D2B] bg-[#161514] overflow-hidden shadow-xl">
            {/* Header Toolbar */}
            <div className="bg-[#1A1918] px-6 py-3 border-b border-[#2E2D2B] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#D4A373]" />
                <span className="text-xs font-bold text-[#F5F3EF] tracking-wider">EMAIL PREVIEW</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                    isEditing ? 'bg-[#D4A373] text-[#121211]' : 'bg-[#22211F] text-[#ECE8E1] border border-[#2E2D2B] hover:bg-[#2A2926]'
                  }`}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  {isEditing ? 'Done Editing' : 'Edit Email'}
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4 text-xs">
              {/* Recipient Rows with CC & BCC */}
              <div className="space-y-2 pb-3 border-b border-[#2E2D2B]">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="text-[#99958F] font-bold w-12 shrink-0">To:</span>
                    {isEditing ? (
                      <input
                        type="text"
                        value={recipient}
                        onChange={(e) => updateState({ recipient: e.target.value })}
                        placeholder="recipient1@example.com, recipient2@example.com"
                        className="w-full px-3 py-1.5 rounded-lg glass-input text-xs text-[#D4A373] font-mono font-bold"
                      />
                    ) : (
                      <div className="flex flex-wrap gap-1.5 items-center">
                        {parsedRecipients.length > 0 ? (
                          parsedRecipients.map((em, idx) => (
                            <span key={idx} className="px-2 py-0.5 rounded-md bg-[#22211F] border border-[#2E2D2B] text-[11px] text-[#D4A373] font-mono font-bold">
                              {em}
                            </span>
                          ))
                        ) : (
                          <span className="text-[#D4A373] font-mono font-bold truncate">{recipient}</span>
                        )}
                      </div>
                    )}
                  </div>
                  {!isEditing && (
                    <button
                      type="button"
                      onClick={() => setShowCcBcc(!showCcBcc)}
                      className="text-[11px] font-bold text-[#D4A373] hover:text-[#c59362] shrink-0 transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      {showCcBcc || cc || bcc ? (showCcBcc ? 'Hide CC/BCC' : 'Edit CC/BCC') : '+ Add CC/BCC'}
                    </button>
                  )}
                </div>

                {/* CC (Carbon Copy) */}
                {(isEditing || showCcBcc || cc) && (
                  <div className="flex items-center gap-2 animate-fadeIn">
                    <span className="text-[#99958F] font-bold w-12 shrink-0">CC:</span>
                    {isEditing || showCcBcc ? (
                      <input
                        type="text"
                        value={cc}
                        onChange={(e) => updateState({ cc: e.target.value })}
                        placeholder="team@example.com, lead@example.com"
                        className="w-full px-3 py-1.5 rounded-lg glass-input text-xs text-[#ECE8E1] font-mono"
                      />
                    ) : (
                      <span className="text-[#ECE8E1] font-mono">{cc}</span>
                    )}
                  </div>
                )}

                {/* BCC (Blind Carbon Copy) */}
                {(isEditing || showCcBcc || bcc) && (
                  <div className="flex items-center gap-2 animate-fadeIn">
                    <span className="text-[#99958F] font-bold w-12 shrink-0">BCC:</span>
                    {isEditing || showCcBcc ? (
                      <input
                        type="text"
                        value={bcc}
                        onChange={(e) => updateState({ bcc: e.target.value })}
                        placeholder="archive@example.com, records@example.com"
                        className="w-full px-3 py-1.5 rounded-lg glass-input text-xs text-[#ECE8E1] font-mono"
                      />
                    ) : (
                      <span className="text-[#ECE8E1] font-mono">{bcc}</span>
                    )}
                  </div>
                )}
              </div>

              {/* Subject Line */}
              <div>
                <label className="text-[10px] font-bold text-[#99958F] uppercase tracking-wider block mb-1">
                  Subject Line
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => updateState({ subject: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg glass-input text-xs text-[#F5F3EF] font-bold"
                  />
                ) : (
                  <div className="p-3 rounded-xl bg-[#1A1918] border border-[#2E2D2B] text-[#F5F3EF] font-bold text-sm">
                    {subject}
                  </div>
                )}
              </div>

              {/* Body Content */}
              <div>
                <label className="text-[10px] font-bold text-[#99958F] uppercase tracking-wider block mb-1">
                  Email Body
                </label>
                {isEditing ? (
                  <textarea
                    rows={12}
                    value={body}
                    onChange={(e) => updateState({ body: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg glass-input text-xs text-[#F5F3EF] leading-relaxed font-sans"
                  />
                ) : (
                  <div className="p-4 rounded-xl bg-[#1A1918] border border-[#2E2D2B] text-[#ECE8E1] whitespace-pre-wrap leading-relaxed font-sans text-xs">
                    {body}
                  </div>
                )}
              </div>

              {/* Attached file tag */}
              {selectedFile && (
                <div className="p-3 rounded-xl bg-[#22211F] border border-[#2E2D2B] text-[#ECE8E1] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Paperclip className="w-4 h-4 text-[#D4A373]" />
                    <span>Attached: <strong>{selectedFile.name}</strong> ({(selectedFile.size / 1024).toFixed(1)} KB)</span>
                  </div>
                  <button onClick={() => updateState({ selectedFile: null })} className="text-[#99958F] hover:text-rose-400">
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
              className="px-5 py-2.5 rounded-xl bg-[#22211F] hover:bg-[#2A2926] text-[#ECE8E1] border border-[#2E2D2B] text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Instruction
            </button>

            <div className="flex items-center gap-2.5 flex-wrap justify-end">
              <button
                type="button"
                onClick={handleSaveDraft}
                className="px-4 py-2.5 rounded-xl bg-[#22211F] hover:bg-[#2A2926] text-[#ECE8E1] border border-[#2E2D2B] text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
              >
                <FileText className="w-4 h-4 text-[#D4A373]" />
                <span>Save Draft</span>
              </button>

              <button
                type="button"
                onClick={() => setShowScheduleModal(true)}
                className="px-4 py-2.5 rounded-xl bg-[#22211F] hover:bg-[#2A2926] text-[#D4A373] border border-[#2E2D2B] text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
              >
                <Clock className="w-4 h-4 text-[#D4A373]" />
                <span>Schedule Send</span>
              </button>

              <button
                onClick={handleStartSending}
                disabled={aiLoading}
                className="px-6 py-2.5 rounded-xl gold-btn light-sweep text-[#121211] font-bold text-xs flex items-center justify-center gap-2 shadow-lg cursor-pointer group"
              >
                <ShieldCheck className="w-4 h-4 text-[#121211] btn-icon-spin transition-transform" />
                <span>Confirm & Send Email</span>
                <span className="btn-arrow-slide transition-transform duration-200">✈</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SCHEDULE MODAL */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="glass-panel max-w-md w-full p-6 rounded-3xl border border-[#2E2D2B] bg-[#1A1918] space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#2E2D2B] pb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-[#D4A373]" />
                <h3 className="text-base font-bold text-[#F5F3EF]">Schedule Email Dispatch</h3>
              </div>
              <button onClick={() => setShowScheduleModal(false)} className="text-[#99958F] hover:text-[#F5F3EF] p-1 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-semibold text-[#ECE8E1]">
                Choose Scheduled Date & Time:
              </label>
              <input
                type="datetime-local"
                value={scheduleTime}
                onChange={(e) => setScheduleTime(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-[#121211] text-[#F5F3EF] text-xs border border-[#2E2D2B] focus:outline-none focus:border-[#D4A373]"
              />
              <p className="text-[11px] text-[#99958F]">
                Your email will be queued in Supabase as "Scheduled" and will appear on the dashboard queue.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#2E2D2B]">
              <button
                onClick={() => setShowScheduleModal(false)}
                className="px-4 py-2 rounded-xl bg-[#22211F] hover:bg-[#2A2926] text-[#99958F] text-xs font-bold border border-[#2E2D2B] cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSchedule}
                className="px-5 py-2 rounded-xl gold-btn text-[#121211] text-xs font-bold cursor-pointer shadow-lg shadow-[#D4A373]/20"
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
          <div className="glass-panel max-w-lg w-full p-6 sm:p-8 rounded-3xl border border-[#2E2D2B] bg-[#1A1918] space-y-6 shadow-2xl">
            <div className="flex items-center gap-3 text-[#F5F3EF] border-b border-[#2E2D2B] pb-4">
              <div className="w-10 h-10 rounded-xl bg-[#22211F] border border-[#2E2D2B] flex items-center justify-center shrink-0">
                <ShieldCheck className="w-6 h-6 text-[#D4A373]" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#F5F3EF]">Final Security Confirmation</h3>
                <p className="text-xs text-[#99958F]">Please review before sending via Gmail API</p>
              </div>
            </div>

            <div className="space-y-3 text-xs bg-[#161514] p-4 rounded-2xl border border-[#2E2D2B]">
              <div className="flex items-center justify-between">
                <span className="text-[#99958F]">Email Type:</span>
                <span className="font-bold text-[#F5F3EF]">{emailType}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#99958F]">Priority:</span>
                <span className="font-bold text-[#F5F3EF]">{priority}</span>
              </div>
              <div className="flex items-start justify-between gap-2">
                <span className="text-[#99958F] shrink-0">
                  Recipient (To){parsedRecipients.length > 1 ? ` (${parsedRecipients.length})` : ''}:
                </span>
                <div className="flex flex-wrap justify-end gap-1 font-mono font-bold text-[#D4A373] max-w-[280px]">
                  {parsedRecipients.length > 0 ? (
                    parsedRecipients.map((em, idx) => (
                      <span key={idx} className="px-1.5 py-0.5 rounded bg-[#22211F] border border-[#2E2D2B] text-[11px]">
                        {em}
                      </span>
                    ))
                  ) : (
                    <span>{recipient}</span>
                  )}
                </div>
              </div>
              {cc && (
                <div className="flex items-center justify-between">
                  <span className="text-[#99958F]">CC:</span>
                  <span className="font-mono text-[#ECE8E1]">{cc}</span>
                </div>
              )}
              {bcc && (
                <div className="flex items-center justify-between">
                  <span className="text-[#99958F]">BCC:</span>
                  <span className="font-mono text-[#ECE8E1]">{bcc}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-[#99958F]">Subject:</span>
                <span className="font-bold text-[#F5F3EF] truncate max-w-[200px]">{subject}</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#22211F] border border-[#D4A373]/30 text-[#D4A373] text-[11px] flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-[#D4A373] shrink-0" />
              <span>Clicking "Authorize & Send Now" will transmit this message directly to the recipient via your Gmail API credentials.</span>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2.5 rounded-xl bg-[#22211F] hover:bg-[#2A2926] text-[#99958F] text-xs font-bold border border-[#2E2D2B] cursor-pointer"
              >
                Cancel / Edit
              </button>
              <button
                onClick={handleFinalConfirmedSend}
                className="px-6 py-2.5 rounded-xl gold-btn text-[#121211] font-bold text-xs flex items-center gap-2 shadow-md hover:scale-[1.02] transition-transform cursor-pointer"
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
        <div className="glass-panel p-12 rounded-3xl border border-[#2E2D2B] bg-[#1A1918] text-center space-y-4 animate-pulse shadow-2xl">
          <div className="w-16 h-16 mx-auto rounded-2xl gold-btn flex items-center justify-center shadow-lg shadow-[#D4A373]/20">
            <Send className="w-8 h-8 text-[#121211] animate-bounce" />
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-bold text-[#F5F3EF]">Transmitting Email via Gmail API...</h3>
            <p className="text-[#99958F] text-xs max-w-md mx-auto">
              Authenticating Google OAuth credentials, encoding MIME headers, and completing email delivery.
            </p>
          </div>
        </div>
      )}

      {/* STEP 6: SENT SUCCESS SCREEN */}
      {step === 6 && (
        <div className="glass-panel p-8 sm:p-12 rounded-3xl border border-emerald-500/30 bg-[#1A1918] text-center space-y-6 animate-fadeIn shadow-2xl">
          <div className="w-20 h-20 mx-auto rounded-2xl bg-emerald-950/60 border border-emerald-500/40 flex items-center justify-center shadow-lg shadow-emerald-900/30">
            <Check className="w-10 h-10 text-emerald-400" />
          </div>

          <div className="space-y-2">
            <h3 className="text-2xl font-extrabold text-[#F5F3EF]">Email Sent Successfully!</h3>
            <p className="text-[#99958F] text-xs max-w-md mx-auto">
              {parsedRecipients.length > 1 ? (
                <>Your email was successfully delivered to <strong className="text-[#D4A373]">{parsedRecipients.length} recipients</strong> (<span className="font-mono text-[#D4A373]">{recipient}</span>) and recorded in your account email history.</>
              ) : (
                <>Your email was successfully delivered to <strong className="text-[#D4A373] font-mono">{recipient}</strong> and recorded in your account email history.</>
              )}
            </p>
          </div>

          {sentResult && (
            <div className="max-w-md mx-auto p-4 rounded-2xl bg-[#161514] border border-[#2E2D2B] text-xs text-left space-y-2 font-mono">
              <div className="flex justify-between">
                <span className="text-[#99958F]">Status:</span>
                <span className="text-emerald-400 font-bold">✓ Sent</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#99958F]">Email Type:</span>
                <span className="text-[#ECE8E1] font-bold">{emailType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#99958F]">Gmail Message ID:</span>
                <span className="text-[#ECE8E1] truncate max-w-[200px]">{sentResult.gmailMessageId || 'N/A'}</span>
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
              className="px-6 py-3 rounded-xl gold-btn text-[#121211] font-bold text-xs flex items-center gap-2 shadow-lg shadow-[#D4A373]/20 hover:scale-[1.02] cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              Compose Another Email
            </button>

            {(onNavigateToDashboard || onComplete) && (
              <button
                onClick={() => {
                  if (onResetCompose) onResetCompose();
                  if (onNavigateToDashboard) onNavigateToDashboard();
                  else if (onComplete) onComplete();
                }}
                className="px-6 py-3 rounded-xl bg-[#22211F] hover:bg-[#2A2926] text-[#F5F3EF] border border-[#2E2D2B] font-bold text-xs cursor-pointer flex items-center gap-2"
              >
                Go to Dashboard
              </button>
            )}

            {onViewHistory && (
              <button
                onClick={() => {
                  if (onResetCompose) onResetCompose();
                  onViewHistory();
                }}
                className="px-4 py-3 rounded-xl hover:bg-[#22211F] text-[#99958F] hover:text-[#F5F3EF] text-xs font-semibold cursor-pointer transition-colors"
              >
                View in History
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
