import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Send, Check, AlertCircle, RefreshCw, Paperclip, X, 
  ArrowLeft, ArrowRight, UserPlus, Eye, Edit3, ShieldCheck, ShieldAlert,
  Calendar, FileText, Briefcase, HelpCircle, Users, ExternalLink, Heart, Mail
} from 'lucide-react';
import { apiFetch, safeParseResponse } from '../utils/api';
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

export function ComposeWorkflow({ initialData = {}, onComplete, onCancel, onNavigateToSettings }) {
  const [step, setStep] = useState(1);
  const [instruction, setInstruction] = useState(initialData.instruction || '');
  const [recipient, setRecipient] = useState(initialData.recipient || '');
  const [cc, setCc] = useState('');
  const [bcc, setBcc] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  
  // Upgraded 5-Facet AI Analysis State
  const [emailType, setEmailType] = useState('Professional / Official');
  const [detectedCategory, setDetectedCategory] = useState('Professional / Official');
  const [situation, setSituation] = useState('💼 Official / Professional');
  const [situationSource, setSituationSource] = useState('auto');
  const [tone, setTone] = useState('Professional');
  const [priority, setPriority] = useState('MEDIUM');
  const [importance, setImportance] = useState('MEDIUM');
  const [urgency, setUrgency] = useState('Normal response');

  const [aiLoading, setAiLoading] = useState(false);
  const [showCcBcc, setShowCcBcc] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [sentResult, setSentResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (initialData.instruction) setInstruction(initialData.instruction);
    if (initialData.recipient) setRecipient(initialData.recipient);
  }, [initialData]);

  // STEP 1 -> STEP 2 -> STEP 3: Automatic AI Intent Classification & Fact-Grounded Generation
  const handleGenerateEmail = async (e) => {
    if (e) e.preventDefault();
    if (!instruction.trim() && !subject.trim()) {
      setErrorMessage('Please describe what you want to send in the problem details.');
      return;
    }
    if (!recipient.trim()) {
      setErrorMessage('Please enter a recipient email address.');
      return;
    }

    setErrorMessage('');
    setAiLoading(true);
    setStep(2); // Show AI loading animation

    try {
      // 1. High-precision local classification & factual generation
      const localResult = generateIntelligentEmail({
        instruction: instruction || subject,
        userSubject: subject,
        recipient,
        hasAttachment: !!selectedFile,
        senderName: localStorage.getItem('userName') || ''
      });

      setEmailType(localResult.category);
      setDetectedCategory(localResult.category);
      setSituation(localResult.situation);
      setTone(localResult.tone);
      setPriority(localResult.priority);
      setImportance(localResult.priority);
      setUrgency(localResult.urgency);
      setSituationSource('auto');

      if (localResult.subject) setSubject(localResult.subject);
      if (localResult.body) setBody(localResult.body);

      // 2. Attempt backend pass-through for Gemini enhancement if available
      try {
        const genRes = await apiFetch('/api/ai/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            instruction,
            subject: localResult.subject,
            situation: localResult.situation,
            category: localResult.category,
            tone: localResult.tone,
            priority: localResult.priority,
            urgency: localResult.urgency,
            recipient
          })
        });
        const genData = await safeParseResponse(genRes);
        if (genData && genData.body && !genData.error) {
          if (genData.subject) setSubject(genData.subject);
          setBody(genData.body || genData.email_body);
        }
      } catch (apiErr) {
        console.warn('Backend generation note (using local intelligence):', apiErr);
      }

      setStep(3); // Show preview screen
    } catch (err) {
      console.error('AI Generation Error:', err);
      setErrorMessage(err.message || 'Unable to generate email. Please try again.');
      setStep(1);
    } finally {
      setAiLoading(false);
    }
  };

  // Regeneration when user selects a different category from dropdown
  const handleManualSituationChange = (newCatId) => {
    const catObj = EMAIL_CATEGORIES.find(c => c.id === newCatId || c.name === newCatId);
    if (!catObj) return;

    setSituationSource('manual');
    setEmailType(catObj.name);
    setDetectedCategory(catObj.name);
    setSituation(`${catObj.icon} ${catObj.name}`);
    setTone(catObj.defaultTone);
    setPriority(catObj.importance);
    setImportance(catObj.importance);
    setUrgency(catObj.urgency);

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

    if (reGen.subject) setSubject(reGen.subject);
    if (reGen.body) setBody(reGen.body);
  };

  // Regeneration when user selects a different tone
  const handleManualToneChange = (newTone) => {
    setTone(newTone);
    setSituationSource('manual');

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

    if (reGen.body) setBody(reGen.body);
  };

  // Update priority without breaking structure
  const handleManualPriorityChange = (newPriority) => {
    setPriority(newPriority);
    setImportance(newPriority);
    setSituationSource('manual');
  };

  // STEP 3 -> STEP 4: Trigger Security Confirmation Modal
  const handleStartSending = () => {
    if (!recipient.trim()) {
      setErrorMessage('Recipient email is required.');
      return;
    }
    if (!subject.trim()) {
      setErrorMessage('Email subject is required.');
      return;
    }
    if (!body.trim()) {
      setErrorMessage('Email body cannot be empty.');
      return;
    }
    setErrorMessage('');
    setShowConfirmModal(true);
  };

  // STEP 4 -> STEP 5 & 6: Final Confirmed Dispatch
  const handleFinalConfirmedSend = async () => {
    setShowConfirmModal(false);
    setStep(5); // Sending progress animation

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

      setSentResult(data);
      setStep(6); // Success screen animation
    } catch (err) {
      console.error('Send Error:', err);
      setErrorMessage(err.message);
      setStep(3);
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
              Enter what you want to communicate. Scribe AI will classify the intent, determine tone & importance, and generate a professional, fact-grounded email.
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
                placeholder="client@example.com, manager@company.com, hr@firm.com"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl glass-input text-xs text-white"
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
                        setCc('');
                        setBcc('');
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
                        onChange={(e) => setCc(e.target.value)}
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
                        onChange={(e) => setBcc(e.target.value)}
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
                  Subject / Topic <span className="text-[11px] font-normal text-slate-500">(Optional — AI generates automatically based on intent)</span>
                </label>
              </div>
              <input
                type="text"
                placeholder="e.g. Leave Request for 3 Days Due to Illness, or Complaint about delayed delivery"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl glass-input text-xs text-white"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                What do you want to communicate? / Instruction <span className="text-rose-400">*</span>
              </label>
              <textarea
                rows={4}
                placeholder="Example: I am sick and need leave for 3 days, or My father had an accident and I need to leave immediately."
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl glass-input text-xs text-white leading-relaxed"
              />
            </div>

            {/* Optional Attachment */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1 flex items-center gap-1.5">
                <Paperclip className="w-4 h-4 text-purple-400" /> Attach Document or Resume (Optional)
              </label>
              <input
                type="file"
                onChange={(e) => setSelectedFile(e.target.files[0])}
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
              <p>• Classifying email intent (20 categories)...</p>
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
                  <span className="text-cyan-300 font-mono font-bold">{recipient}</span>
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
                    onChange={(e) => setSubject(e.target.value)}
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
                    onChange={(e) => setBody(e.target.value)}
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
                  <button onClick={() => setSelectedFile(null)} className="text-slate-400 hover:text-rose-400">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex items-center justify-between gap-4 pt-2">
            <button
              onClick={() => setStep(1)}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Edit Instruction
            </button>

            <button
              onClick={handleStartSending}
              disabled={aiLoading}
              className="px-8 py-3 rounded-xl gradient-btn text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-purple-600/30 hover:scale-[1.02] active:scale-[0.98] transition-transform cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-pink-200" />
              Confirm & Send Email ✈
            </button>
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
                setStep(1);
                setInstruction('');
                setRecipient('');
                setCc('');
                setBcc('');
                setSubject('');
                setBody('');
                setSelectedFile(null);
                setSentResult(null);
              }}
              className="px-6 py-3 rounded-xl gradient-btn text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-purple-600/30 hover:scale-[1.02] cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              Compose Another Email
            </button>

            {onComplete && (
              <button
                onClick={onComplete}
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
