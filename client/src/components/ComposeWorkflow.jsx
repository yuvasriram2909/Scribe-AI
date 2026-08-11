import React, { useState } from 'react';
import { 
  Sparkles, Send, Edit3, RefreshCw, X, CheckCircle, ShieldAlert, Paperclip, 
  AlertCircle, ArrowLeft, FileText, Check, ShieldCheck, Mail, Users, UserPlus, ExternalLink, ChevronDown
} from 'lucide-react';
import { apiFetch, safeParseResponse } from '../utils/api';

const SUPPORTED_SITUATIONS = [
  { id: '🚨 Emergency', label: '🚨 Emergency', category: 'Emergency', priority: 'High', tone: 'Urgent', badgeClass: 'bg-red-500/20 text-red-300 border-red-500/40' },
  { id: '⚠️ Important / Necessary', label: '⚠️ Important / Necessary', category: 'Important', priority: 'High', tone: 'Professional', badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40' },
  { id: '💼 Official / Professional', label: '💼 Official / Professional', category: 'Official/Professional', priority: 'Normal', tone: 'Professional', badgeClass: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40' },
  { id: '📅 Leave / Holiday', label: '📅 Leave / Holiday', category: 'Leave/Holiday', priority: 'Normal', tone: 'Professional', badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' },
  { id: '📄 Resume / Job Application', label: '📄 Resume / Job Application', category: 'Resume/Job Application', priority: 'Normal', tone: 'Formal', badgeClass: 'bg-blue-500/20 text-blue-300 border-blue-500/40' },
  { id: '🔄 Follow-up', label: '🔄 Follow-up', category: 'Follow-up', priority: 'Normal', tone: 'Professional', badgeClass: 'bg-purple-500/20 text-purple-300 border-purple-500/40' },
  { id: '💬 Casual', label: '💬 Casual', category: 'Casual', priority: 'Normal', tone: 'Friendly', badgeClass: 'bg-pink-500/20 text-pink-300 border-pink-500/40' },
  { id: '🎉 Celebration / Occasion', label: '🎉 Celebration / Occasion', category: 'Occasion', priority: 'Normal', tone: 'Warm', badgeClass: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40' }
];

export function ComposeWorkflow({ initialData = {}, onComplete, onCancel }) {
  // Workflow Steps: 1 = Form, 2 = AI Processing, 3 = Preview, 4 = Confirm Modal, 5 = Sending, 6 = Success
  const [step, setStep] = useState(1);

  // Form inputs
  const [instruction, setInstruction] = useState(initialData.instruction || '');
  const [recipient, setRecipient] = useState(initialData.recipient || '');
  const [cc, setCc] = useState(initialData.cc || '');
  const [bcc, setBcc] = useState(initialData.bcc || '');
  const [showCcBcc, setShowCcBcc] = useState(!!(initialData.cc || initialData.bcc));
  const [selectedFile, setSelectedFile] = useState(null);

  // Situation & AI State
  const [aiLoading, setAiLoading] = useState(false);
  const [situation, setSituation] = useState('💼 Official / Professional');
  const [situationSource, setSituationSource] = useState('ai'); // 'ai' or 'manual'
  const [detectedCategory, setDetectedCategory] = useState('Official/Professional');
  const [priority, setPriority] = useState('Normal');
  const [tone, setTone] = useState('Professional');

  // Draft Data
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  // Confirmation Modal State
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Sent Result
  const [sentResult, setSentResult] = useState(null);

  // STEP 1 -> STEP 2 & 3: AI Categorization and Generation
  const handleGenerateEmail = async (e) => {
    if (e) e.preventDefault();

    if (!instruction.trim()) {
      setErrorMessage('Please enter a short natural-language instruction.');
      return;
    }
    if (!recipient.trim()) {
      setErrorMessage('Please enter a recipient email address.');
      return;
    }

    setErrorMessage('');
    setAiLoading(true);
    setStep(2); // AI Processing step with animation

    try {
      // 1. Categorize Instruction & Detect Situation
      const catRes = await apiFetch('/api/ai/categorize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instruction, recipient })
      });
      const catData = await safeParseResponse(catRes);
      
      const detectedSit = catData.situation || '💼 Official / Professional';
      const sitObj = SUPPORTED_SITUATIONS.find(s => s.id === detectedSit || s.label === detectedSit) || SUPPORTED_SITUATIONS[2];

      setSituation(sitObj.label);
      setSituationSource('ai');
      setDetectedCategory(catData.category || sitObj.category);
      setPriority(catData.priority || sitObj.priority);
      setTone(catData.tone || sitObj.tone);

      // 2. Generate Draft based on detected situation
      const genRes = await apiFetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instruction,
          situation: sitObj.label,
          category: sitObj.category,
          priority: catData.priority || sitObj.priority,
          tone: catData.tone || sitObj.tone,
          recipient
        })
      });
      const genData = await safeParseResponse(genRes);

      setSubject(genData.subject || genData.suggested_subject || 'Email Subject');
      setBody(genData.body || genData.email_body || instruction);
      setStep(3); // Step 3: Preview
    } catch (err) {
      console.error('AI Generation Error:', err);
      setErrorMessage(err.message || 'Failed to generate email.');
      setStep(1);
    } finally {
      setAiLoading(false);
    }
  };

  // Manual Situation Override & Automatic Email Regeneration
  const handleManualSituationChange = async (newSitId) => {
    const sitObj = SUPPORTED_SITUATIONS.find(s => s.id === newSitId || s.label === newSitId);
    if (!sitObj) return;

    setSituation(sitObj.label);
    setSituationSource('manual');
    setPriority(sitObj.priority);
    setTone(sitObj.tone);
    setDetectedCategory(sitObj.category);

    setAiLoading(true);
    try {
      const res = await apiFetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instruction,
          situation: sitObj.label,
          category: sitObj.category,
          priority: sitObj.priority,
          tone: sitObj.tone,
          recipient
        })
      });
      const data = await safeParseResponse(res);
      setSubject(data.subject || data.suggested_subject || subject);
      setBody(data.body || data.email_body || body);
    } catch (err) {
      console.error('Manual Situation Regeneration Error:', err);
    } finally {
      setAiLoading(false);
    }
  };

  // STEP 3 -> STEP 4: Confirm & Send Trigger
  const handleStartSending = () => {
    if (!subject.trim() || !body.trim()) {
      setErrorMessage('Subject and Email Body cannot be empty.');
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
    <div className="max-w-4xl mx-auto space-y-6">

      {/* WORKFLOW STEP PROGRESS HEADER */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex items-center justify-between overflow-x-auto scrollbar-none gap-2">
        {[
          { num: 1, label: 'Short Instruction' },
          { num: 2, label: 'AI Understand' },
          { num: 3, label: 'Situation & Preview' },
          { num: 4, label: 'Confirm & Send' },
          { num: 5, label: 'Sent' }
        ].map((s) => (
          <div key={s.num} className="flex items-center gap-2 shrink-0">
            <div className={`w-7 h-7 rounded-full text-xs font-extrabold flex items-center justify-center transition-all ${
              step >= s.num ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/40' : 'bg-slate-800 text-slate-400'
            }`}>
              {step > s.num ? <Check className="w-4 h-4 text-white" /> : s.num}
            </div>
            <span className={`text-xs font-semibold ${step >= s.num ? 'text-slate-100' : 'text-slate-500'}`}>
              {s.label}
            </span>
            {s.num < 5 && <div className="w-6 sm:w-10 h-0.5 bg-slate-800 mx-1" />}
          </div>
        ))}
      </div>

      {/* ERROR BANNER WITH RE-AUTHORIZE BUTTON */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center justify-between gap-3 animate-fadeIn flex-wrap">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          {(errorMessage.includes('Gmail account not connected') || errorMessage.includes('insufficient authentication scopes')) && (
            <button
              onClick={async () => {
                try {
                  const res = await apiFetch('/api/auth/google/url');
                  const data = await res.json();
                  if (data.url) {
                    window.location.href = data.url;
                  } else {
                    alert(data.message || 'Google OAuth credentials not set in .env');
                  }
                } catch (e) {
                  console.error('OAuth URL fetch error:', e);
                }
              }}
              className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-red-600/30 transition-all shrink-0 cursor-pointer"
            >
              <ExternalLink className="w-4 h-4" />
              {errorMessage.includes('insufficient authentication scopes') ? 'Re-authorize Gmail Permissions' : 'Connect Gmail Account Now'}
            </button>
          )}
        </div>
      )}

      {/* STEP 1: INSTRUCTION & RECIPIENTS FORM */}
      {step === 1 && (
        <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-slate-800 space-y-6">
          <div className="border-b border-slate-800/80 pb-4">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-indigo-400" />
              What do you want to send?
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Write naturally. AI understands intent, detects situation & priority, generates professional draft, and presents preview.
            </p>
          </div>

          <form onSubmit={handleGenerateEmail} className="space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-200 block">
                  Recipient Email (To) <span className="text-red-400">*</span>
                </label>

                {!showCcBcc && (
                  <button
                    type="button"
                    onClick={() => setShowCcBcc(true)}
                    className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
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
                className="w-full px-4 py-3 rounded-xl glass-input text-sm text-white focus:ring-2 focus:ring-indigo-500"
              />

              {showCcBcc && (
                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-indigo-400" /> Extra Email Deliveries (CC & BCC)
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setShowCcBcc(false);
                        setCc('');
                        setBcc('');
                      }}
                      className="text-[10px] text-slate-500 hover:text-red-400"
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
                        className="w-full px-3 py-2 rounded-lg glass-input text-xs text-white focus:ring-1 focus:ring-indigo-500"
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
                        className="w-full px-3 py-2 rounded-lg glass-input text-xs text-white focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-200 block mb-1">
                Short Natural Language Instruction <span className="text-red-400">*</span>
              </label>
              <textarea
                rows={4}
                required
                placeholder='e.g., "I need emergency leave this afternoon because I have a doctor&apos;s appointment."'
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
                className="w-full px-4 py-3 rounded-xl glass-input text-sm text-white focus:ring-2 focus:ring-indigo-500 leading-relaxed"
              />
            </div>

            {/* Optional Attachment */}
            <div>
              <label className="text-xs font-semibold text-slate-200 block mb-1 flex items-center gap-1.5">
                <Paperclip className="w-4 h-4 text-indigo-400" /> Attach Resume or Document (Optional)
              </label>
              <input
                type="file"
                onChange={(e) => setSelectedFile(e.target.files[0])}
                className="block w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-600/20 file:text-indigo-300 hover:file:bg-indigo-600/30 file:cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              {onCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors"
                >
                  Cancel
                </button>
              )}

              <button
                type="submit"
                className="px-8 py-3 rounded-xl gradient-btn text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-indigo-500/25 hover:scale-[1.02] active:scale-[0.98] transition-transform"
              >
                <Sparkles className="w-4 h-4 text-indigo-200" />
                Generate Email
              </button>
            </div>
          </form>
        </div>
      )}

      {/* STEP 2: AI PROCESSING ANIMATION */}
      {step === 2 && (
        <div className="glass-panel p-12 rounded-2xl border border-indigo-500/30 text-center space-y-6 animate-pulse">
          <div className="w-20 h-20 mx-auto rounded-2xl gradient-btn flex items-center justify-center shadow-xl shadow-indigo-500/30">
            <Sparkles className="w-10 h-10 text-white animate-spin-slow" />
          </div>

          <div className="space-y-2">
            <h3 className="text-2xl font-bold text-white tracking-tight">AI Engine Processing...</h3>
            <p className="text-slate-400 text-xs max-w-md mx-auto">
              Analyzing natural instruction, detecting situation & priority, and generating draft.
            </p>
          </div>
        </div>
      )}

      {/* STEP 3: DETECTED SITUATION UI & EMAIL PREVIEW */}
      {step === 3 && (
        <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-slate-800 space-y-6">
          
          {/* AI EMAIL ANALYSIS CARD */}
          <div className="p-5 rounded-2xl glass-card border border-slate-700/80 space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-400" />
                <h3 className="text-xs font-extrabold text-white tracking-wider uppercase">AI Email Analysis</h3>
              </div>

              {situationSource === 'manual' && (
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
                  Manually selected
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  {situationSource === 'manual' ? 'Selected Situation' : 'Detected Situation'}
                </span>
                <div className="text-base font-extrabold text-white flex items-center gap-1.5">
                  {situation}
                </div>
              </div>

              <div>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Priority</span>
                <div className="text-sm font-bold text-slate-200">
                  {priority === 'High' ? '🔴 High' : priority === 'Medium' ? '🟡 Medium' : '🟢 Normal'}
                </div>
              </div>

              <div>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Tone</span>
                <div className="text-sm font-bold text-slate-200">
                  {tone}
                </div>
              </div>
            </div>

            {/* Change Situation Dropdown */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-3 flex-wrap">
              <span className="text-[11px] text-slate-400 font-medium">
                Need a different situation? Change situation to automatically regenerate:
              </span>
              <div className="relative">
                <select
                  value={situation}
                  onChange={(e) => handleManualSituationChange(e.target.value)}
                  className="px-4 py-2 rounded-xl bg-slate-900 text-xs font-bold text-indigo-300 border border-indigo-500/50 hover:border-indigo-400 transition-all cursor-pointer shadow-md focus:outline-none"
                >
                  <option value="" disabled>Change Situation ▼</option>
                  {SUPPORTED_SITUATIONS.map(s => (
                    <option key={s.id} value={s.id} className="bg-slate-900 text-white font-medium">
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* GMAIL-STYLE EMAIL DRAFT CARD */}
          <div className="rounded-xl border border-slate-700/80 bg-slate-950/80 overflow-hidden shadow-2xl">
            {/* Header Toolbar */}
            <div className="bg-slate-900 px-6 py-3 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-bold text-slate-200 tracking-wider">EMAIL PREVIEW</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ${
                    isEditing ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300 hover:text-white'
                  }`}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  {isEditing ? 'Done Editing' : 'Edit Email'}
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4 text-xs">
              {/* Recipient Rows */}
              <div className="space-y-2 pb-3 border-b border-slate-800/80">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 font-semibold w-12 shrink-0">To:</span>
                  <span className="text-indigo-300 font-mono font-semibold">{recipient}</span>
                </div>
                {cc && (
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 font-semibold w-12 shrink-0">CC:</span>
                    <span className="text-slate-300 font-mono">{cc}</span>
                  </div>
                )}
                {bcc && (
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 font-semibold w-12 shrink-0">BCC:</span>
                    <span className="text-slate-300 font-mono">{bcc}</span>
                  </div>
                )}
              </div>

              {/* Subject Line */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Subject Line
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg glass-input text-xs text-white font-semibold focus:ring-1 focus:ring-indigo-500"
                  />
                ) : (
                  <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 text-white font-bold text-sm">
                    {subject}
                  </div>
                )}
              </div>

              {/* Body Content */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Email Body
                </label>
                {isEditing ? (
                  <textarea
                    rows={12}
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg glass-input text-xs text-slate-200 leading-relaxed font-sans focus:ring-1 focus:ring-indigo-500"
                  />
                ) : (
                  <div className="p-4 rounded-lg bg-slate-900/40 border border-slate-800/80 text-slate-200 whitespace-pre-wrap leading-relaxed font-sans text-xs">
                    {body}
                  </div>
                )}
              </div>

              {/* Attached file tag */}
              {selectedFile && (
                <div className="p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Paperclip className="w-4 h-4 text-indigo-400" />
                    <span>Attached: <strong>{selectedFile.name}</strong> ({(selectedFile.size / 1024).toFixed(1)} KB)</span>
                  </div>
                  <button onClick={() => setSelectedFile(null)} className="text-slate-400 hover:text-red-400">
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
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-2 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Edit Instruction
            </button>

            <button
              onClick={handleStartSending}
              disabled={aiLoading}
              className="px-8 py-3 rounded-xl gradient-btn text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-indigo-500/25 hover:scale-[1.02] active:scale-[0.98] transition-transform"
            >
              <ShieldCheck className="w-4 h-4 text-indigo-200" />
              Confirm & Send Email
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: CONFIRMATION SECURITY MODAL */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="glass-panel max-w-lg w-full p-6 sm:p-8 rounded-2xl border border-indigo-500/40 space-y-6 shadow-2xl">
            <div className="flex items-center gap-3 text-indigo-400 border-b border-slate-800 pb-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-6 h-6 text-indigo-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Final Security Confirmation</h3>
                <p className="text-xs text-slate-400">Please review before sending via Gmail API</p>
              </div>
            </div>

            <div className="space-y-3 text-xs bg-slate-900/60 p-4 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Situation:</span>
                <span className="font-bold text-white">{situation}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Priority:</span>
                <span className="font-bold text-white">{priority === 'High' ? '🔴 High' : priority === 'Medium' ? '🟡 Medium' : '🟢 Normal'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Recipient (To):</span>
                <span className="font-mono font-bold text-indigo-300">{recipient}</span>
              </div>
              {cc && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">CC:</span>
                  <span className="font-mono text-slate-300">{cc}</span>
                </div>
              )}
              {bcc && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">BCC:</span>
                  <span className="font-mono text-slate-300">{bcc}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Subject:</span>
                <span className="font-bold text-white truncate max-w-[200px]">{subject}</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Clicking "Authorize & Send Now" will transmit this message directly to the recipient via your Gmail API credentials.</span>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
              >
                Cancel / Edit
              </button>
              <button
                onClick={handleFinalConfirmedSend}
                className="px-6 py-2.5 rounded-xl gradient-btn text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-indigo-500/30 hover:scale-[1.02] transition-transform"
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
        <div className="glass-panel p-12 rounded-2xl border border-indigo-500/40 text-center space-y-6 animate-pulse">
          <div className="w-20 h-20 mx-auto rounded-2xl gradient-btn flex items-center justify-center shadow-xl shadow-indigo-500/40">
            <Send className="w-10 h-10 text-white animate-bounce" />
          </div>

          <div className="space-y-2">
            <h3 className="text-2xl font-bold text-white tracking-tight">Transmitting Email via Gmail API...</h3>
            <p className="text-slate-400 text-xs max-w-md mx-auto">
              Authenticating Google OAuth credentials, encoding MIME headers, and completing email delivery.
            </p>
          </div>
        </div>
      )}

      {/* STEP 6: SENT SUCCESS SCREEN */}
      {step === 6 && (
        <div className="glass-panel p-8 sm:p-12 rounded-2xl border border-emerald-500/40 text-center space-y-6 animate-fadeIn">
          <div className="w-20 h-20 mx-auto rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shadow-xl shadow-emerald-500/20">
            <CheckCircle className="w-10 h-10 text-emerald-400" />
          </div>

          <div className="space-y-2">
            <h3 className="text-2xl font-extrabold text-white">Email Sent Successfully!</h3>
            <p className="text-slate-400 text-xs max-w-md mx-auto">
              Your email has been dispatched to <strong className="text-indigo-300 font-mono">{recipient}</strong> and recorded in your account email history.
            </p>
          </div>

          {sentResult && (
            <div className="max-w-md mx-auto p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-left space-y-2 font-mono">
              <div className="flex justify-between">
                <span className="text-slate-400">Status:</span>
                <span className="text-emerald-400 font-bold">Sent ✓</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Situation:</span>
                <span className="text-white font-bold">{situation}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Gmail Message ID:</span>
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
              className="px-6 py-3 rounded-xl gradient-btn text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-indigo-500/30 hover:scale-[1.02] transition-transform"
            >
              <Sparkles className="w-4 h-4" />
              Compose Another Email
            </button>

            {onComplete && (
              <button
                onClick={onComplete}
                className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition-colors"
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
