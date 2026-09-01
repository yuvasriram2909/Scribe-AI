/**
 * ============================================================================
 * Scribe-AI — ComposeWorkflow Component
 * ============================================================================
 * An 11-step human-in-the-loop email composition interface that integrates:
 * - Natural language instruction capture
 * - Google Gemini AI situation classification & drafting
 * - Manual situation/priority/tone overrides
 * - Security verification & confirmation modal
 * - Official Gmail REST API dispatch via OAuth 2.0
 */

import React, { useState } from 'react';
import { 
  Sparkles, Send, Edit3, RefreshCw, X, CheckCircle, ShieldAlert, Paperclip, 
  AlertCircle, ArrowLeft, FileText, Check, ShieldCheck, Mail, Users, UserPlus, ExternalLink, ChevronDown, Key
} from 'lucide-react';
import { apiFetch, safeParseResponse } from '../utils/api';

const SUPPORTED_SITUATIONS = [
  { id: '🚨 Emergency', label: '🚨 Emergency', category: 'Emergency', priority: 'High', tone: 'Urgent', badgeClass: 'badge-emergency' },
  { id: '⚠️ Important / Necessary', label: '⚠️ Important / Necessary', category: 'Important', priority: 'High', tone: 'Professional', badgeClass: 'badge-important' },
  { id: '💼 Official / Professional', label: '💼 Official / Professional', category: 'Official/Professional', priority: 'Normal', tone: 'Professional', badgeClass: 'badge-official' },
  { id: '📅 Leave / Holiday', label: '📅 Leave / Holiday', category: 'Leave/Holiday', priority: 'Normal', tone: 'Professional', badgeClass: 'badge-leave' },
  { id: '📄 Resume / Job Application', label: '📄 Resume / Job Application', category: 'Resume/Job Application', priority: 'Normal', tone: 'Formal', badgeClass: 'badge-resume' },
  { id: '🔄 Follow-up', label: '🔄 Follow-up', category: 'Follow-up', priority: 'Normal', tone: 'Professional', badgeClass: 'badge-followup' },
  { id: '💬 Casual', label: '💬 Casual', category: 'Casual', priority: 'Normal', tone: 'Friendly', badgeClass: 'badge-casual' },
  { id: '🎉 Celebration / Occasion', label: '🎉 Celebration / Occasion', category: 'Occasion', priority: 'Normal', tone: 'Warm', badgeClass: 'badge-celebration' }
];

export function ComposeWorkflow({ initialData = {}, onComplete, onCancel, onNavigateToSettings }) {
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
      <div className="glass-panel p-4 rounded-2xl border border-[#D8D1BC] flex items-center justify-between overflow-x-auto scrollbar-none gap-2">
        {[
          { num: 1, label: 'Instruction' },
          { num: 2, label: 'AI Analysis' },
          { num: 3, label: 'Email Preview' },
          { num: 4, label: 'Review & Confirm' },
          { num: 5, label: 'Sent' }
        ].map((s) => (
          <div key={s.num} className="flex items-center gap-2 shrink-0">
            <div className={`w-7 h-7 rounded-full text-xs font-extrabold flex items-center justify-center transition-all ${
              step >= s.num ? 'bg-[#667A45] text-[#FAF8F1] shadow-xs' : 'bg-[#F2EBDD] text-[#6F725F]'
            }`}>
              {step > s.num ? <Check className="w-4 h-4 text-[#FAF8F1]" /> : s.num}
            </div>
            <span className={`text-xs font-semibold ${step >= s.num ? 'text-[#28321D]' : 'text-[#6F725F]'}`}>
              {s.label}
            </span>
            {s.num < 5 && <div className="w-6 sm:w-10 h-0.5 bg-[#D8D1BC] mx-1" />}
          </div>
        ))}
      </div>

      {/* ERROR BANNER WITH RE-AUTHORIZE BUTTON */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center justify-between gap-3 animate-fadeIn flex-wrap">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          {(errorMessage.includes('Gmail') || errorMessage.includes('connect') || errorMessage.includes('OAuth') || errorMessage.includes('scopes') || errorMessage.includes('revoked') || errorMessage.includes('expired')) && (
            <button
              onClick={async () => {
                try {
                  const res = await apiFetch('/api/auth/google/url');
                  const data = await res.json();
                  if (data && data.url) {
                    window.location.href = data.url;
                  } else if (onNavigateToSettings) {
                    onNavigateToSettings();
                  }
                } catch (e) {
                  if (onNavigateToSettings) onNavigateToSettings();
                }
              }}
              className="px-4 py-2 rounded-xl gradient-btn text-[#FAF8F1] font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <ExternalLink className="w-4 h-4" />
              ⚡ Connect Google Gmail
            </button>
          )}
        </div>
      )}

      {/* STEP 1: INSTRUCTION & RECIPIENTS FORM */}
      {step === 1 && (
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-[#D8D1BC] space-y-6">
          <div className="border-b border-[#D8D1BC] pb-4">
            <h2 className="text-2xl font-bold text-[#28321D] flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-[#667A45]" />
              AI Smart Email Compose
            </h2>
            <p className="text-xs text-[#6F725F] mt-1">
              Describe what you want to send. Let AI create a professional email for you.
            </p>
          </div>

          <form onSubmit={handleGenerateEmail} className="space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-[#28321D] block">
                  Recipient Email (To) <span className="text-red-600">*</span>
                </label>

                {!showCcBcc && (
                  <button
                    type="button"
                    onClick={() => setShowCcBcc(true)}
                    className="text-xs font-bold text-[#667A45] hover:text-[#3F4D2A] flex items-center gap-1 transition-colors cursor-pointer"
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
                className="w-full px-4 py-3 rounded-xl glass-input text-xs text-[#28321D] focus:ring-2 focus:ring-[#667A45]"
              />

              {showCcBcc && (
                <div className="p-4 rounded-xl bg-[#FAF8F1] border border-[#D8D1BC] space-y-3 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#3F4D2A] flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-[#667A45]" /> Extra Email Deliveries (CC & BCC)
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setShowCcBcc(false);
                        setCc('');
                        setBcc('');
                      }}
                      className="text-[10px] text-[#6F725F] hover:text-red-600 cursor-pointer"
                    >
                      Hide CC/BCC
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-[#28321D] block mb-1">
                        CC (Carbon Copy)
                      </label>
                      <input
                        type="text"
                        placeholder="lead@company.com, team@firm.com"
                        value={cc}
                        onChange={(e) => setCc(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg glass-input text-xs text-[#28321D]"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-[#28321D] block mb-1">
                        BCC (Blind Carbon Copy)
                      </label>
                      <input
                        type="text"
                        placeholder="archive@company.com, audit@firm.com"
                        value={bcc}
                        onChange={(e) => setBcc(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg glass-input text-xs text-[#28321D]"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="text-xs font-bold text-[#28321D] block mb-1">
                What do you want to send? <span className="text-red-600">*</span>
              </label>
              <textarea
                rows={4}
                required
                placeholder="Example: Inform my manager that I need emergency leave this afternoon because of a doctor's appointment."
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
                className="w-full px-4 py-3 rounded-xl glass-input text-xs text-[#28321D] focus:ring-2 focus:ring-[#667A45] leading-relaxed"
              />
            </div>

            {/* Optional Attachment */}
            <div>
              <label className="text-xs font-semibold text-[#28321D] block mb-1 flex items-center gap-1.5">
                <Paperclip className="w-4 h-4 text-[#667A45]" /> Attach Resume or Document (Optional)
              </label>
              <input
                type="file"
                onChange={(e) => setSelectedFile(e.target.files[0])}
                className="block w-full text-xs text-[#6F725F] file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#E8DFC8] file:text-[#3F4D2A] hover:file:bg-[#D8D1BC] file:cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#D8D1BC]">
              {onCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  className="px-5 py-2.5 rounded-xl bg-[#FAF8F1] hover:bg-[#E8DFC8] text-[#28321D] font-bold text-xs border border-[#D8D1BC] cursor-pointer"
                >
                  Cancel
                </button>
              )}

              <button
                type="submit"
                className="px-8 py-3 rounded-xl gradient-btn text-[#FAF8F1] font-bold text-xs flex items-center gap-2 shadow-md hover:scale-[1.02] active:scale-[0.98] transition-transform cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-[#E8DFC8]" />
                Generate Email ✦
              </button>
            </div>
          </form>
        </div>
      )}

      {/* STEP 2: AI PROCESSING ANIMATION */}
      {step === 2 && (
        <div className="glass-panel p-12 rounded-3xl border border-[#D8D1BC] text-center space-y-4 animate-pulse">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-[#667A45] text-[#FAF8F1] flex items-center justify-center shadow-lg">
            <Sparkles className="w-8 h-8 animate-spin-slow" />
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-extrabold text-[#28321D]">Creating Professional Email...</h3>
            <div className="text-[#6F725F] text-xs max-w-md mx-auto space-y-1">
              <p>• Understanding instruction...</p>
              <p>• Detecting situation & priority...</p>
              <p>• Analyzing tone...</p>
              <p>• Preparing preview...</p>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: DETECTED SITUATION UI & EMAIL PREVIEW */}
      {step === 3 && (
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-[#D8D1BC] space-y-6">
          
          {/* AI EMAIL ANALYSIS CARD */}
          <div className="p-5 rounded-2xl bg-[#FAF8F1] border border-[#D8D1BC] space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-[#D8D1BC] pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#667A45]" />
                <h3 className="text-xs font-extrabold text-[#28321D] tracking-wider uppercase">AI EMAIL ANALYSIS</h3>
              </div>

              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#E8DFC8] text-[#3F4D2A] border border-[#D8D1BC]">
                {situationSource === 'manual' ? 'Status: Manually Selected' : 'Status: AI Detected'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-[10px] font-bold text-[#6F725F] uppercase tracking-wider block mb-1">
                  Detected Situation
                </span>
                <div className="text-base font-extrabold text-[#28321D]">
                  {situation}
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold text-[#6F725F] uppercase tracking-wider block mb-1">Priority</span>
                <div className="text-sm font-bold text-[#28321D]">
                  {priority === 'High' ? '🔴 High' : priority === 'Medium' ? '🟡 Medium' : '🟢 Normal'}
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold text-[#6F725F] uppercase tracking-wider block mb-1">Tone</span>
                <div className="text-sm font-bold text-[#28321D]">
                  {tone}
                </div>
              </div>
            </div>

            {/* Change Situation & Tone Controls */}
            <div className="pt-3 border-t border-[#D8D1BC] flex items-center justify-between gap-3 flex-wrap">
              <span className="text-xs text-[#6F725F] font-semibold">
                Need a different situation or tone? Change to automatically regenerate:
              </span>
              <div className="flex items-center gap-2">
                <select
                  value={situation}
                  onChange={(e) => handleManualSituationChange(e.target.value)}
                  className="px-3.5 py-2 rounded-xl bg-[#FFFFFF] text-xs font-bold text-[#3F4D2A] border border-[#D8D1BC] cursor-pointer"
                >
                  <option value="" disabled>Change Situation ▼</option>
                  {SUPPORTED_SITUATIONS.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* GMAIL-STYLE EMAIL PREVIEW CARD */}
          <div className="rounded-2xl border border-[#D8D1BC] bg-[#FFFFFF] overflow-hidden shadow-lg">
            {/* Header Toolbar */}
            <div className="bg-[#FAF8F1] px-6 py-3 border-b border-[#D8D1BC] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#667A45]" />
                <span className="text-xs font-bold text-[#28321D] tracking-wider">EMAIL PREVIEW</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                    isEditing ? 'bg-[#667A45] text-[#FAF8F1]' : 'bg-[#FAF8F1] text-[#28321D] border border-[#D8D1BC] hover:bg-[#E8DFC8]'
                  }`}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  {isEditing ? 'Done Editing' : 'Edit Email'}
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4 text-xs">
              {/* Recipient Rows */}
              <div className="space-y-2 pb-3 border-b border-[#D8D1BC]">
                <div className="flex items-center gap-2">
                  <span className="text-[#6F725F] font-bold w-12 shrink-0">To:</span>
                  <span className="text-[#3F4D2A] font-mono font-bold">{recipient}</span>
                </div>
                {cc && (
                  <div className="flex items-center gap-2">
                    <span className="text-[#6F725F] font-bold w-12 shrink-0">CC:</span>
                    <span className="text-[#28321D] font-mono">{cc}</span>
                  </div>
                )}
                {bcc && (
                  <div className="flex items-center gap-2">
                    <span className="text-[#6F725F] font-bold w-12 shrink-0">BCC:</span>
                    <span className="text-[#28321D] font-mono">{bcc}</span>
                  </div>
                )}
              </div>

              {/* Subject Line */}
              <div>
                <label className="text-[10px] font-bold text-[#6F725F] uppercase tracking-wider block mb-1">
                  Subject Line
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg glass-input text-xs text-[#28321D] font-bold"
                  />
                ) : (
                  <div className="p-3 rounded-lg bg-[#FAF8F1] border border-[#D8D1BC] text-[#28321D] font-bold text-sm">
                    {subject}
                  </div>
                )}
              </div>

              {/* Body Content */}
              <div>
                <label className="text-[10px] font-bold text-[#6F725F] uppercase tracking-wider block mb-1">
                  Email Body
                </label>
                {isEditing ? (
                  <textarea
                    rows={12}
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg glass-input text-xs text-[#28321D] leading-relaxed font-sans"
                  />
                ) : (
                  <div className="p-4 rounded-lg bg-[#FAF8F1] border border-[#D8D1BC] text-[#28321D] whitespace-pre-wrap leading-relaxed font-sans text-xs">
                    {body}
                  </div>
                )}
              </div>

              {/* Attached file tag */}
              {selectedFile && (
                <div className="p-3 rounded-lg bg-[#E6F4EA] border border-[#A8DADC] text-[#137333] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Paperclip className="w-4 h-4 text-[#667A45]" />
                    <span>Attached: <strong>{selectedFile.name}</strong> ({(selectedFile.size / 1024).toFixed(1)} KB)</span>
                  </div>
                  <button onClick={() => setSelectedFile(null)} className="text-[#6F725F] hover:text-red-600">
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
              className="px-5 py-2.5 rounded-xl bg-[#FAF8F1] hover:bg-[#E8DFC8] text-[#28321D] border border-[#D8D1BC] text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Edit Instruction
            </button>

            <button
              onClick={handleStartSending}
              disabled={aiLoading}
              className="px-8 py-3 rounded-xl gradient-btn text-[#FAF8F1] font-bold text-xs flex items-center gap-2 shadow-md hover:scale-[1.02] active:scale-[0.98] transition-transform cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-[#E8DFC8]" />
              Confirm & Send Email ✈
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: CONFIRMATION SECURITY MODAL */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#28321D]/60 backdrop-blur-sm animate-fadeIn">
          <div className="glass-panel max-w-lg w-full p-6 sm:p-8 rounded-3xl border border-[#D8D1BC] space-y-6 shadow-2xl">
            <div className="flex items-center gap-3 text-[#28321D] border-b border-[#D8D1BC] pb-4">
              <div className="w-10 h-10 rounded-xl bg-[#667A45]/20 border border-[#879B62]/40 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-6 h-6 text-[#667A45]" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#28321D]">Final Security Confirmation</h3>
                <p className="text-xs text-[#6F725F]">Please review before sending via Gmail API</p>
              </div>
            </div>

            <div className="space-y-3 text-xs bg-[#FAF8F1] p-4 rounded-xl border border-[#D8D1BC]">
              <div className="flex items-center justify-between">
                <span className="text-[#6F725F]">Situation:</span>
                <span className="font-bold text-[#28321D]">{situation}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#6F725F]">Priority:</span>
                <span className="font-bold text-[#28321D]">{priority === 'High' ? '🔴 High' : priority === 'Medium' ? '🟡 Medium' : '🟢 Normal'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#6F725F]">Recipient (To):</span>
                <span className="font-mono font-bold text-[#3F4D2A]">{recipient}</span>
              </div>
              {cc && (
                <div className="flex items-center justify-between">
                  <span className="text-[#6F725F]">CC:</span>
                  <span className="font-mono text-[#28321D]">{cc}</span>
                </div>
              )}
              {bcc && (
                <div className="flex items-center justify-between">
                  <span className="text-[#6F725F]">BCC:</span>
                  <span className="font-mono text-[#28321D]">{bcc}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-[#6F725F]">Subject:</span>
                <span className="font-bold text-[#28321D] truncate max-w-[200px]">{subject}</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#FEF3C7] border border-[#FDE68A] text-[#92400E] text-[11px] flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-[#92400E] shrink-0" />
              <span>Clicking "Authorize & Send Now" will transmit this message directly to the recipient via your Gmail API credentials.</span>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2.5 rounded-xl bg-[#FAF8F1] hover:bg-[#E8DFC8] text-[#28321D] text-xs font-bold border border-[#D8D1BC] cursor-pointer"
              >
                Cancel / Edit
              </button>
              <button
                onClick={handleFinalConfirmedSend}
                className="px-6 py-2.5 rounded-xl gradient-btn text-[#FAF8F1] font-bold text-xs flex items-center gap-2 shadow-md hover:scale-[1.02] transition-transform cursor-pointer"
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
        <div className="glass-panel p-12 rounded-3xl border border-[#D8D1BC] text-center space-y-4 animate-pulse">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-[#667A45] text-[#FAF8F1] flex items-center justify-center shadow-lg">
            <Send className="w-8 h-8 animate-bounce" />
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-bold text-[#28321D]">Transmitting Email via Gmail API...</h3>
            <p className="text-[#6F725F] text-xs max-w-md mx-auto">
              Authenticating Google OAuth credentials, encoding MIME headers, and completing email delivery.
            </p>
          </div>
        </div>
      )}

      {/* STEP 6: SENT SUCCESS SCREEN */}
      {step === 6 && (
        <div className="glass-panel p-8 sm:p-12 rounded-3xl border border-[#A8DADC] text-center space-y-6 animate-fadeIn">
          <div className="w-20 h-20 mx-auto rounded-2xl bg-[#E6F4EA] border border-[#A8DADC] flex items-center justify-center shadow-md">
            <CheckCircle className="w-10 h-10 text-[#137333]" />
          </div>

          <div className="space-y-2">
            <h3 className="text-2xl font-extrabold text-[#28321D]">Email Sent Successfully!</h3>
            <p className="text-[#6F725F] text-xs max-w-md mx-auto">
              Your email was successfully delivered to <strong className="text-[#3F4D2A] font-mono">{recipient}</strong> and recorded in your account email history.
            </p>
          </div>

          {sentResult && (
            <div className="max-w-md mx-auto p-4 rounded-2xl bg-[#FAF8F1] border border-[#D8D1BC] text-xs text-left space-y-2 font-mono">
              <div className="flex justify-between">
                <span className="text-[#6F725F]">Status:</span>
                <span className="text-[#137333] font-bold">✓ Sent</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6F725F]">Situation:</span>
                <span className="text-[#28321D] font-bold">{situation}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6F725F]">Gmail Message ID:</span>
                <span className="text-[#3F4D2A] truncate max-w-[200px]">{sentResult.gmailMessageId || 'N/A'}</span>
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
              className="px-6 py-3 rounded-xl gradient-btn text-[#FAF8F1] font-bold text-xs flex items-center gap-2 shadow-md hover:scale-[1.02] cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              Compose Another Email
            </button>

            {onComplete && (
              <button
                onClick={onComplete}
                className="px-6 py-3 rounded-xl bg-[#FAF8F1] hover:bg-[#E8DFC8] text-[#28321D] border border-[#D8D1BC] font-bold text-xs cursor-pointer"
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
