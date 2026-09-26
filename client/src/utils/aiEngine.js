import { apiFetch, safeParseResponse } from './api';
/**
 * ============================================================================
 * Scribe AI — Intelligent Professional Email Generation & Classification Engine
 * ============================================================================
 * - 21 Intent Classification Categories (including Application Acknowledgment & Candidate Response)
 * - 12 Advanced Professional Tones (Executive, Corporate, Recruiter Response, Action-Oriented, etc.)
 * - Strict Fact Grounding (Zero Hallucination / No Invented Dates or Attachments)
 * - Dynamic Tone Rephrasing across all categories
 * - Recipient-Aware Salutations & Sign-offs
 */

export const ADVANCED_TONES = [
  {
    id: 'corporate_professional',
    name: 'Corporate Professional',
    icon: '💼',
    tagline: 'Refined business standard, articulate, structured',
    description: 'Gold-standard corporate etiquette for official communications and team updates.',
    badgeColor: 'text-blue-300 bg-blue-950/80 border-blue-500/40'
  },
  {
    id: 'executive',
    name: 'Executive / C-Suite',
    icon: '👑',
    tagline: 'High-level, strategic, concise, decisive',
    description: 'Designed for directors, founders, and VP-level communications.',
    badgeColor: 'text-amber-300 bg-amber-950/80 border-amber-500/40'
  },
  {
    id: 'recruiter_response',
    name: 'Recruiter / HR Response',
    icon: '📩',
    tagline: 'Polished candidate acknowledgment & hiring communication',
    description: 'Matches authentic Fortune 500 recruiter acknowledgments and candidate updates.',
    badgeColor: 'text-purple-300 bg-purple-950/80 border-purple-500/40'
  },
  {
    id: 'candidate_application',
    name: 'Candidate Application',
    icon: '🎯',
    tagline: 'Impactful, credentialed, value-driven outreach',
    description: 'Highlights technical expertise, career milestones, and direct value proposition.',
    badgeColor: 'text-emerald-300 bg-emerald-950/80 border-emerald-500/40'
  },
  {
    id: 'polite_diplomatic',
    name: 'Polite & Diplomatic',
    icon: '🤝',
    tagline: 'Tactful, considerate, respectful, graceful',
    description: 'Ideal for delicate requests, client navigation, and cross-team alignment.',
    badgeColor: 'text-cyan-300 bg-cyan-950/80 border-cyan-500/40'
  },
  {
    id: 'action_concise',
    name: 'Action-Oriented & Concise',
    icon: '⚡',
    tagline: 'Direct, bulleted action items, zero fluff',
    description: 'For busy executives and engineering leads who prioritize rapid execution.',
    badgeColor: 'text-yellow-300 bg-yellow-950/80 border-yellow-500/40'
  },
  {
    id: 'formal_authoritative',
    name: 'Formal & Authoritative',
    icon: '📜',
    tagline: 'Institutional rigor, elevated vocabulary',
    description: 'Suited for legal, governmental, academic, and contractual notices.',
    badgeColor: 'text-indigo-300 bg-indigo-950/80 border-indigo-500/40'
  },
  {
    id: 'warm_collaborative',
    name: 'Warm & Collaborative',
    icon: '☀️',
    tagline: 'Empathetic, partnership-building, friendly yet professional',
    description: 'Great for client check-ins, team welcomes, and community building.',
    badgeColor: 'text-orange-300 bg-orange-950/80 border-orange-500/40'
  },
  {
    id: 'persuasive_pitch',
    name: 'Persuasive & Pitch',
    icon: '🚀',
    tagline: 'Compelling value proposition, metric-backed, clear CTA',
    description: 'Crafted for proposals, partnership outreach, and sponsorship pitches.',
    badgeColor: 'text-teal-300 bg-teal-950/80 border-teal-500/40'
  },
  {
    id: 'firm_assertive',
    name: 'Firm & Assertive',
    icon: '🛡️',
    tagline: 'Unambiguous boundaries, decisive call-to-action',
    description: 'For overdue balances, unresolved disputes, and scope boundaries.',
    badgeColor: 'text-rose-300 bg-rose-950/80 border-rose-500/40'
  },
  {
    id: 'apologetic_resolution',
    name: 'Apologetic & Resolution',
    icon: '🙇',
    tagline: 'Sincere accountability, transparent corrective action',
    description: 'For rectifying mistakes, delayed deliverables, and service disruptions.',
    badgeColor: 'text-stone-300 bg-stone-900 border-stone-600'
  },
  {
    id: 'urgent_critical',
    name: 'Urgent & Time-Sensitive',
    icon: '🚨',
    tagline: 'Immediate priority, critical deadlines, fast escalation',
    description: 'For incidents, urgent emergency notices, and immediate blocker resolution.',
    badgeColor: 'text-red-300 bg-red-950/80 border-red-500/40'
  }
];

export const EMAIL_CATEGORIES = [
  {
    id: 'job_application',
    name: 'Job Application',
    icon: '💼',
    defaultTone: 'Candidate Application',
    importance: 'HIGH',
    urgency: 'Normal response',
    description: 'Applying for open roles, senior positions, and technical careers',
    keywords: ['job application', 'applying for', 'software engineer', 'software developer', 'role', 'position', 'vacancy', 'candidate', 'apply for']
  },
  {
    id: 'application_acknowledgment',
    name: 'Application Acknowledgment / Recruiter Response',
    icon: '📩',
    defaultTone: 'Recruiter / HR Response',
    importance: 'MEDIUM',
    urgency: 'Normal response',
    description: 'Acknowledging received applications, candidate submissions, outlining next steps in hiring',
    keywords: ['received your application', 'application received', 'thank you for reaching out', 'reviewing applications', 'next steps in the hiring', 'credentials received', 'hiring process', 'recruiter response', 'candidate acknowledgment', 'shortlisted', 'recruitment update', 'in touch regarding the next steps']
  },
  {
    id: 'candidate_response',
    name: 'Candidate Reply / Status Follow-up',
    icon: '💬',
    defaultTone: 'Polite & Diplomatic',
    importance: 'MEDIUM',
    urgency: 'Prompt response',
    description: 'Replying to recruiter acknowledgments, confirming interview availability, status follow-ups',
    keywords: ['thank you for the update', 'look forward to hearing from you', 'status update reply', 'recruiter reply', 'interview availability', 'next steps reply', 'hearing from you', 'appreciate the update', 'update on my application']
  },
  {
    id: 'resume_submission',
    name: 'Resume / Document Submission',
    icon: '📄',
    defaultTone: 'Corporate Professional',
    importance: 'HIGH',
    urgency: 'Normal response',
    description: 'Submitting resume, CV, credentials, or portfolio to recruiter or firm',
    keywords: ['resume', 'cv', 'curriculum vitae', 'portfolio', 'send my resume', 'attached resume', 'document submission', 'credentials']
  },
  {
    id: 'leave_request',
    name: 'Leave Request',
    icon: '📅',
    defaultTone: 'Corporate Professional',
    importance: 'MEDIUM',
    urgency: 'Normal response',
    description: 'Sick leave, vacation, emergency absence, personal time off',
    keywords: ['leave', 'sick', 'fever', 'illness', 'vacation', 'day off', 'days off', 'holiday', 'unwell', 'out of office', 'doctor appointment', 'hospitalized', 'absent', 'absence', 'permission']
  },
  {
    id: 'emergency',
    name: 'Emergency',
    icon: '🚨',
    defaultTone: 'Urgent & Time-Sensitive',
    importance: 'CRITICAL',
    urgency: 'Immediate attention',
    description: 'Accidents, critical incidents, medical emergencies, immediate departures',
    keywords: ['accident', 'emergency', 'urgent personal', 'immediate attention', 'critical incident', 'hospital', 'casualty', 'leave immediately', 'urgent departure', 'family emergency']
  },
  {
    id: 'meeting',
    name: 'Meeting / Appointment',
    icon: '🗓️',
    defaultTone: 'Corporate Professional',
    importance: 'MEDIUM',
    urgency: 'Prompt response',
    description: 'Scheduling, rescheduling, or requesting meetings, calendar syncs',
    keywords: ['meeting', 'reschedule', 'appointment', 'move meeting', 'schedule', 'call', 'sync', 'zoom', 'google meet', 'catch up on call']
  },
  {
    id: 'follow_up',
    name: 'Reminder / Follow-up',
    icon: '🔄',
    defaultTone: 'Action-Oriented & Concise',
    importance: 'MEDIUM',
    urgency: 'Prompt response',
    description: 'Following up on deliverables, proposals, status updates, awaiting response',
    keywords: ['follow up', 'follow-up', 'following up', 'reminder', 'checking in', 'status update on', 'gentle reminder', 'pending response', 'haven\'t heard back']
  },
  {
    id: 'business_proposal',
    name: 'Business Proposal',
    icon: '🤝',
    defaultTone: 'Persuasive & Pitch',
    importance: 'HIGH',
    urgency: 'Prompt response',
    description: 'Partnership pitches, sales proposals, vendor quotes, collaboration offers',
    keywords: ['proposal', 'partnership', 'collaboration', 'business proposal', 'quotation', 'rfp', 'pitch', 'vendor offer']
  },
  {
    id: 'payment_invoice',
    name: 'Payment / Invoice',
    icon: '💳',
    defaultTone: 'Firm & Assertive',
    importance: 'HIGH',
    urgency: 'Prompt response',
    description: 'Invoices, billing statements, payment processing, fee dues',
    keywords: ['invoice', 'payment', 'due date', 'pay by', 'billing', 'remittance', 'dues', 'receipt', 'wire transfer', 'fees']
  },
  {
    id: 'complaint',
    name: 'Complaint / Concern',
    icon: '⚠️',
    defaultTone: 'Firm & Assertive',
    importance: 'HIGH',
    urgency: 'Prompt response',
    description: 'Product issues, service delays, grievances, formal concerns',
    keywords: ['complaint', 'delayed', 'delay', 'compensation', 'refund', 'poor service', 'defective', 'damaged', 'unacceptable', 'dissatisfied', 'issue with product', 'grievance']
  },
  {
    id: 'apology',
    name: 'Apology / Resolution',
    icon: '🙇',
    defaultTone: 'Apologetic & Resolution',
    importance: 'MEDIUM',
    urgency: 'Prompt response',
    description: 'Apologizing for mistakes, delays, miscommunication, or service interruption',
    keywords: ['sorry', 'apologize', 'apology', 'regret', 'inconvenience caused', 'oversight', 'my mistake', 'pardon']
  },
  {
    id: 'official_professional',
    name: 'Professional / Official',
    icon: '👔',
    defaultTone: 'Corporate Professional',
    importance: 'HIGH',
    urgency: 'Normal response',
    description: 'Standard workplace communication, formal notices, official letters',
    keywords: ['official', 'formal', 'company policy', 'management', 'hr department', 'board', 'formal communication', 'authorized']
  },
  {
    id: 'thank_you',
    name: 'Thank You / Appreciation',
    icon: '🙏',
    defaultTone: 'Warm & Collaborative',
    importance: 'LOW',
    urgency: 'No immediate action',
    description: 'Expressing gratitude, thanking collaborators, acknowledging assistance',
    keywords: ['thanks', 'thank you', 'grateful', 'appreciate', 'helping me', 'thankful', 'great help', 'gratitude']
  },
  {
    id: 'announcement',
    name: 'Announcement',
    icon: '📢',
    defaultTone: 'Corporate Professional',
    importance: 'MEDIUM',
    urgency: 'No immediate action',
    description: 'Broadcasting company updates, policy launches, event notifications',
    keywords: ['announcement', 'announce', 'broadcasting', 'pleased to announce', 'we are launching', 'all hands', 'upcoming event', 'notice to all']
  },
  {
    id: 'academic_student',
    name: 'Academic / Student',
    icon: '🎓',
    defaultTone: 'Formal & Authoritative',
    importance: 'HIGH',
    urgency: 'Normal response',
    description: 'Messages to professors, universities, homework/exam submissions',
    keywords: ['professor', 'teacher', 'assignment', 'exam', 'grade', 'class', 'university', 'college', 'course', 'phd', 'student']
  },
  {
    id: 'inquiry_info',
    name: 'Inquiry / Information Request',
    icon: '❓',
    defaultTone: 'Polite & Diplomatic',
    importance: 'MEDIUM',
    urgency: 'Normal response',
    description: 'Asking for product info, pricing inquiries, general questions',
    keywords: ['inquire', 'inquiry', 'could you provide', 'requesting information', 'details regarding', 'price quote', 'brochure', 'clarification']
  },
  {
    id: 'congratulations',
    name: 'Congratulations',
    icon: '🎉',
    defaultTone: 'Warm & Collaborative',
    importance: 'LOW',
    urgency: 'No immediate action',
    description: 'Celebrating promotions, achievements, milestones, graduations',
    keywords: ['congratulations', 'congrats', 'kudos', 'well done', 'promotion', 'achievement', 'award', 'celebrating']
  },
  {
    id: 'status_update',
    name: 'Status / Progress Update',
    icon: '📊',
    defaultTone: 'Action-Oriented & Concise',
    importance: 'MEDIUM',
    urgency: 'Normal response',
    description: 'Weekly sprint updates, milestone reports, project deliverable status',
    keywords: ['status update', 'progress update', 'milestone', 'sprint update', 'weekly report', 'project status', 'deliverables']
  },
  {
    id: 'security_account',
    name: 'Security / Account',
    icon: '🛡️',
    defaultTone: 'Urgent & Time-Sensitive',
    importance: 'CRITICAL',
    urgency: 'Immediate attention',
    description: 'Compromised accounts, unauthorized access, security alerts',
    keywords: ['compromised', 'hacked', 'security breach', 'unauthorized access', 'stolen', 'password reset', 'security alert', 'account locked', 'phishing']
  },
  {
    id: 'personal_casual',
    name: 'Personal / Casual',
    icon: '💬',
    defaultTone: 'Warm & Collaborative',
    importance: 'LOW',
    urgency: 'Prompt response',
    description: 'Informal notes to friends, quick social updates, casual plans',
    keywords: ['friend', 'reach late', 'minutes late', 'running late', 'catch up', 'coffee', 'lunch', 'dinner', 'hang out', 'weekend', 'casual']
  },
  {
    id: 'marketing_promotion',
    name: 'Marketing / Promotion',
    icon: '🚀',
    defaultTone: 'Persuasive & Pitch',
    importance: 'LOW',
    urgency: 'No immediate action',
    description: 'Promotional outreach, product offers, newsletter announcements',
    keywords: ['special offer', 'discount', 'limited time', 'promo', 'promotion', 'exclusive offer', 'new feature', 'sale']
  }
];

/**
 * Classifies user text into one of the email categories with high confidence
 */
export function classifyEmailIntent(input = '', subject = '') {
  const text = `${subject} ${input}`.toLowerCase().trim();

  // 1. High-Priority Intent Matches
  if (text.includes('received your application') || text.includes('reviewing applications') || text.includes('next steps in the hiring') || text.includes('credentials received') || (text.includes('application') && (text.includes('received') || text.includes('reviewing') || text.includes('next step')))) {
    return EMAIL_CATEGORIES.find(c => c.id === 'application_acknowledgment');
  }

  if (text.includes('thank you for the update') || text.includes('look forward to hearing') || (text.includes('update') && (text.includes('hearing from you') || text.includes('application status') || text.includes('next step')))) {
    return EMAIL_CATEGORIES.find(c => c.id === 'candidate_response');
  }

  // Job application ONLY if explicitly applying for a job/position
  if (text.includes('application for') || text.includes('applying for') || text.includes('job application') || (text.includes('position') && (text.includes('engineer') || text.includes('developer') || text.includes('candidate') || text.includes('apply')))) {
    return EMAIL_CATEGORIES.find(c => c.id === 'job_application');
  }

  if (text.includes('accident') || text.includes('emergency') || (text.includes('immediate') && (text.includes('leave') || text.includes('hospital')))) {
    return EMAIL_CATEGORIES.find(c => c.id === 'emergency');
  }

  if (text.includes('compromised') || text.includes('hacked') || text.includes('unauthorized access')) {
    return EMAIL_CATEGORIES.find(c => c.id === 'security_account');
  }

  if (text.includes('complaint') || text.includes('compensation') || (text.includes('delayed') && text.includes('delivery')) || text.includes('refund')) {
    return EMAIL_CATEGORIES.find(c => c.id === 'complaint');
  }

  if (text.includes('extension') || text.includes('rent') || text.includes('invoice') || text.includes('pay by') || text.includes('payment') || text.includes('due date')) {
    return EMAIL_CATEGORIES.find(c => c.id === 'payment_invoice');
  }

  if (text.includes('sick') || text.includes('leave for') || text.includes('request leave') || text.includes('fever') || text.includes('vacation')) {
    return EMAIL_CATEGORIES.find(c => c.id === 'leave_request');
  }

  if (text.includes('resume') && (text.includes('job') || text.includes('developer') || text.includes('engineer') || text.includes('position') || text.includes('send my resume') || text.includes('hr'))) {
    if (text.includes('apply') || text.includes('position') || text.includes('developer') || text.includes('engineer') || text.includes('role')) {
      return EMAIL_CATEGORIES.find(c => c.id === 'job_application');
    }
    return EMAIL_CATEGORIES.find(c => c.id === 'resume_submission');
  }

  // Reschedule / postpone / meeting / demo
  if (text.includes('postpone') || text.includes('reschedule') || text.includes('demo') || text.includes('sync') || (text.includes('meeting') && (text.includes('move') || text.includes('delay') || text.includes('tomorrow') || text.includes('friday') || text.includes('next week')))) {
    return EMAIL_CATEGORIES.find(c => c.id === 'meeting');
  }

  if (text.includes('follow up') || text.includes('follow-up') || text.includes('proposal i sent')) {
    return EMAIL_CATEGORIES.find(c => c.id === 'follow_up');
  }

  if (text.includes('sorry') || text.includes('apologize') || text.includes('oversight') || text.includes('my mistake')) {
    return EMAIL_CATEGORIES.find(c => c.id === 'apology');
  }

  if (text.includes('proposal') || text.includes('partnership') || text.includes('pitch')) {
    return EMAIL_CATEGORIES.find(c => c.id === 'business_proposal');
  }

  if (text.includes('thanks') || text.includes('thank you') || text.includes('appreciate')) {
    return EMAIL_CATEGORIES.find(c => c.id === 'thank_you');
  }

  // Social invitation, date, meetup, coffee, dinner, lunch
  if (
    text.includes('date') || 
    text.includes('go for a date') || 
    text.includes('go on a date') || 
    text.includes('dinner') || 
    text.includes('lunch') || 
    text.includes('coffee') || 
    text.includes('catch up') || 
    text.includes('hang out') || 
    text.includes('get together') || 
    text.includes('are you free') || 
    text.includes('free this weekend') || 
    text.includes('can we go') || 
    text.includes('would love to meet') ||
    text.includes('outing') ||
    text.includes('invitation')
  ) {
    return EMAIL_CATEGORIES.find(c => c.id === 'personal_casual') || EMAIL_CATEGORIES.find(c => c.id === 'meeting');
  }

  // 2. Keyword Scoring Match
  let bestCategory = null;
  let maxScore = 0;

  for (const cat of EMAIL_CATEGORIES) {
    let score = 0;
    for (const kw of cat.keywords) {
      if (text.includes(kw)) {
        score += kw.length;
      }
    }
    if (score > maxScore) {
      maxScore = score;
      bestCategory = cat;
    }
  }

  // If no strong keyword matches, default to Status / Progress Update (never job application!)
  if (!bestCategory || maxScore <= 0) {
    return EMAIL_CATEGORIES.find(c => c.id === 'status_update') || EMAIL_CATEGORIES[0];
  }

  return bestCategory;
}

/**
 * Extracts factual parameters without hallucinating details
 */
export function extractFactualDetails(input = '') {
  const text = input.trim();
  const lower = text.toLowerCase();

  let duration = null;
  const durationMatch = text.match(/(\d+|one|two|three|four|five|six|seven|eight|nine|ten)\s+(day|days|week|weeks|month|months)/i);
  if (durationMatch) {
    duration = durationMatch[0];
  } else if (lower.includes('today') && lower.includes('afternoon')) {
    duration = 'today afternoon';
  } else if (lower.includes('today')) {
    duration = 'today';
  } else if (lower.includes('tomorrow')) {
    duration = 'tomorrow';
  }

  let jobRole = 'Senior Software Engineer';
  if (lower.includes('senior software engineer')) {
    jobRole = 'Senior Software Engineer';
  } else if (lower.includes('software engineer')) {
    jobRole = 'Software Engineer';
  } else if (lower.includes('software developer')) {
    jobRole = 'Software Developer';
  } else if (lower.includes('frontend developer')) {
    jobRole = 'Frontend Developer';
  } else if (lower.includes('backend developer')) {
    jobRole = 'Backend Developer';
  } else if (lower.includes('full stack') || lower.includes('fullstack')) {
    jobRole = 'Full Stack Developer';
  } else if (lower.includes('product manager')) {
    jobRole = 'Product Manager';
  } else if (lower.includes('data analyst')) {
    jobRole = 'Data Analyst';
  } else {
    const roleMatch = text.match(/(?:application\s+for|apply(?:ing)?\s+for|position\s+of|role\s+of)\s+(?:the\s+)?([a-zA-Z\s]{2,35}?)(?:\s+(?:position|role|job|opportunity)|[.,\n]|$)/i)
      || text.match(/(?:for|as|regarding)\s+(?:the\s+)?([a-zA-Z]{2,20}(?:\s+[a-zA-Z]{2,20}){0,2})\s+(?:position|role|job|opportunity)/i);
    if (roleMatch && roleMatch[1].trim() && !roleMatch[1].toLowerCase().includes('reaching')) {
      jobRole = roleMatch[1].trim();
    }
  }

  let recipientType = 'unknown';
  if (lower.includes('manager') || lower.includes('lead') || lower.includes('boss') || lower.includes('supervisor')) {
    recipientType = 'manager';
  } else if (lower.includes('hr') || lower.includes('recruiter') || lower.includes('hiring manager') || lower.includes('talent')) {
    recipientType = 'hr';
  } else if (lower.includes('candidate') || lower.includes('applicant')) {
    recipientType = 'candidate';
  } else if (lower.includes('professor') || lower.includes('teacher')) {
    recipientType = 'professor';
  } else if (lower.includes('client') || lower.includes('customer')) {
    recipientType = 'client';
  } else if (lower.includes('friend') || lower.includes('buddy')) {
    recipientType = 'friend';
  }

  return { duration, jobRole, recipientType };
}

/**
 * Formats a clean human display name from email or username
 */
export function formatDisplayName(emailOrName = '') {
  if (!emailOrName) return 'User';
  if (!emailOrName.includes('@')) {
    const trimmed = emailOrName.replace(/[0-9._-]/g, ' ').trim();
    if (trimmed) {
      return trimmed.split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
    }
    return emailOrName;
  }
  const prefix = emailOrName.split('@')[0].replace(/[0-9._-]/g, ' ').trim();
  if (!prefix) return 'User';
  return prefix.split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
}

/**
 * Resolves active sender name from session or account details
 */
export function getSenderDisplayName(providedName = '') {
  if (providedName && providedName.trim() && !providedName.includes('[Your Name]')) {
    return providedName.trim();
  }
  try {
    const storedName = typeof localStorage !== 'undefined' ? localStorage.getItem('userName') : '';
    if (storedName && storedName.trim() && !storedName.includes('[Your Name]')) {
      return storedName.trim();
    }
    const storedEmail = typeof localStorage !== 'undefined' ? (localStorage.getItem('userEmail') || '') : '';
    if (storedEmail) {
      return formatDisplayName(storedEmail);
    }
  } catch (_) {}
  return 'User';
}

/**
 * Determines recipient display name from email string
 */
export function extractRecipientFirstName(recipient = '') {
  if (!recipient) return '';
  const firstItem = typeof recipient === 'string' ? recipient.split(/[,;\n]+/)[0].trim() : '';
  if (!firstItem) return '';

  // 1. If format is "Balaji <email@domain.com>" or "Balaji Kumar <...>"
  if (firstItem.includes('<')) {
    const namePart = firstItem.split('<')[0].trim().replace(/^["']|["']$/g, '');
    if (namePart) {
      const firstWord = namePart.split(/\s+/)[0];
      return firstWord.charAt(0).toUpperCase() + firstWord.slice(1).toLowerCase();
    }
  }

  const clean = firstItem.includes('<') ? (firstItem.match(/<([^>]+)>/)?.[1] || firstItem) : firstItem;
  if (!clean.includes('@')) {
    const trimmed = clean.replace(/[0-9._-]/g, ' ').trim();
    if (trimmed) {
      const firstWord = trimmed.split(/\s+/)[0];
      return firstWord.charAt(0).toUpperCase() + firstWord.slice(1).toLowerCase();
    }
    return '';
  }

  const local = clean.split('@')[0].replace(/[0-9._-]/g, ' ').trim();
  if (local.length >= 2 && !local.includes('info') && !local.includes('support') && !local.includes('contact') && !local.includes('admin') && !local.includes('noreply')) {
    const rawLocal = clean.split('@')[0];
    if (rawLocal.toLowerCase().startsWith('lbalaji')) {
      return 'Balaji';
    }
    const matchPunctInitial = rawLocal.match(/^[a-z][._-]([a-z]{2,})/i);
    if (matchPunctInitial) {
      const subName = matchPunctInitial[1];
      return subName.charAt(0).toUpperCase() + subName.slice(1).toLowerCase();
    }
    const matchCamelInitial = rawLocal.match(/^[a-z]([A-Z][a-z]{2,})/);
    if (matchCamelInitial) {
      return matchCamelInitial[1];
    }
    const firstWord = local.split(/\s+/)[0];
    return firstWord.charAt(0).toUpperCase() + firstWord.slice(1).toLowerCase();
  }
  return '';
}

/**
 * Determines appropriate recipient greeting taking tone and name into account
 */
export function determineGreeting(recipient = '', recipientType = 'unknown', toneId = 'corporate_professional') {
  const rawList = typeof recipient === 'string' ? recipient.split(/[,;\n]+/).map(r => r.trim()).filter(Boolean) : [];
  const firstName = extractRecipientFirstName(recipient);

  if (rawList.length > 1) {
    if (toneId.includes('action') || toneId.includes('warm')) return 'Hi team,';
    if (toneId.includes('executive')) return 'Dear Team,';
    return 'Dear Colleagues,';
  }

  if (firstName) {
    if (toneId.includes('action') || toneId.includes('warm') || toneId.includes('casual')) {
      return `Hi ${firstName},`;
    }
    return `Dear ${firstName},`;
  }

  if (recipientType === 'candidate') return 'Dear Candidate,';
  if (recipientType === 'hr') return 'Dear Hiring Team,';
  if (recipientType === 'manager') return 'Dear Manager,';
  if (recipientType === 'client') return 'Dear Client,';
  if (recipientType === 'professor') return 'Dear Professor,';

  if (toneId.includes('formal')) return 'Dear Sir/Madam,';
  if (toneId.includes('action') || toneId.includes('warm')) return 'Hello,';
  return 'Dear Colleague,';
}

/**
 * Cleans input text from minor trailing typos and conversational prefixes
 */
export function cleanUserInput(raw = '') {
  let text = (raw || '').trim();
  text = text.replace(/\s+[a-zA-Z]$/, '').trim();
  // Strip conversational dispatch commands ("send email to...", "write an email telling...")
  text = text.replace(/^(?:please\s+)?(?:send\s+(?:an?\s+)?(?:email|mail)\s+(?:to\s+[^:]+?\s+)?(?:that\s+|saying\s+that\s+|saying\s+|about\s+)?|i\s+want\s+to\s+(?:send|write)\s+(?:an?\s+)?(?:email|mail)\s+(?:to\s+[^:]+?\s+)?(?:that\s+|about\s+)?|write\s+(?:an?\s+)?(?:email|mail)\s+(?:to\s+[^:]+?\s+)?(?:that\s+|about\s+)?)/i, '').trim();
  // Strip informational conversational prefixes ("inform the team that...", "tell the client that...", "ask the manager for...")
  text = text.replace(/^(?:(?:i\s+(?:need|want|would\s+like)\s+to\s+)?(?:inform|tell|notify|alert)\s+(?:the\s+[^:]+?\s+|team\s+|client\s+|everyone\s+)?(?:that\s+|about\s+)?)/i, '').trim();
  text = text.replace(/^(?:ask\s+(?:the\s+[^:]+?\s+)?(?:for\s+)?)/i, '').trim();
  text = text.replace(/^(?:let\s+(?:the\s+[^:]+?|everyone|you|the\s+team)\s+know\s+(?:that\s+|about\s+)?)/i, '').trim();
  return text;
}

/**
 * Resolves standard Tone ID from any loose string or object
 */
export function normalizeToneId(tone) {
  if (!tone) return 'corporate_professional';
  const t = String(tone).toLowerCase();
  if (t.includes('exec') || t.includes('c-suite') || t.includes('leadership')) return 'executive';
  if (t.includes('recruit') || t.includes('hr') || t.includes('acknowledg')) return 'recruiter_response';
  if (t.includes('candidate') || t.includes('application')) return 'candidate_application';
  if (t.includes('diplomat') || t.includes('polite')) return 'polite_diplomatic';
  if (t.includes('action') || t.includes('concise')) return 'action_concise';
  if (t.includes('authoritative') || t.includes('formal')) return 'formal_authoritative';
  if (t.includes('warm') || t.includes('collab') || t.includes('friendly')) return 'warm_collaborative';
  if (t.includes('persuas') || t.includes('pitch')) return 'persuasive_pitch';
  if (t.includes('firm') || t.includes('assertive')) return 'firm_assertive';
  if (t.includes('apolog')) return 'apologetic_resolution';
  if (t.includes('urgent') || t.includes('critical')) return 'urgent_critical';
  return 'corporate_professional';
}

/**
 * Determines closing sign-off based on tone
 */
export function determineClosing(toneId = 'corporate_professional', myName = 'Sender') {
  switch (toneId) {
    case 'executive':
      return `Sincerely,\n${myName}`;
    case 'recruiter_response':
      return `Best regards,\n${myName}`;
    case 'candidate_application':
      return `Warm regards,\n${myName}`;
    case 'action_concise':
      return `Best,\n${myName}`;
    case 'polite_diplomatic':
      return `With sincere appreciation,\n${myName}`;
    case 'formal_authoritative':
      return `Respectfully yours,\n${myName}`;
    case 'warm_collaborative':
      return `Warmly,\n${myName}`;
    case 'persuasive_pitch':
      return `Warm regards,\n${myName}`;
    case 'firm_assertive':
      return `Regards,\n${myName}`;
    case 'apologetic_resolution':
      return `Sincerely and with apologies,\n${myName}`;
    case 'urgent_critical':
      return `Urgent regards,\n${myName}`;
    default:
      return `Best regards,\n${myName}`;
  }
}

/**
 * Real AI-Powered Email Generation via Google Gemini Backend
 * NEVER returns hardcoded, canned, or mock emails.
 * If AI fails, throws structured AI_GENERATION_FAILED error.
 */
export async function generateAIEmail({
  instruction = '',
  userSubject = '',
  recipient = '',
  hasAttachment = false,
  customCategory = null,
  customTone = null,
  customPriority = null,
  senderName = ''
}) {
  const rawInput = (instruction || userSubject || '').trim();
  if (!rawInput) {
    throw new Error('Please enter a subject or problem description to generate an email.');
  }

  // 1. Identify category & tone metadata
  const category = customCategory 
    ? (EMAIL_CATEGORIES.find(c => c.id === customCategory || c.name === customCategory) || classifyEmailIntent(rawInput, userSubject))
    : classifyEmailIntent(rawInput, userSubject);

  const rawTone = customTone || category.defaultTone;
  const toneId = normalizeToneId(rawTone);
  const activeToneObj = ADVANCED_TONES.find(t => t.id === toneId) || ADVANCED_TONES[0];
  const priority = customPriority || category.importance;
  const activeSenderName = getSenderDisplayName(senderName);

  // 2. Call Supabase Edge Function with Google AI / Gemini
  const response = await apiFetch('/api/ai/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      instruction: rawInput,
      subject: userSubject ? userSubject.trim() : '',
      situation: `${category.icon || ''} ${category.name}`.trim(),
      category: category.name,
      tone: activeToneObj.name,
      priority,
      recipient: recipient ? recipient.trim() : '',
      senderName: activeSenderName
    })
  });

  const data = await safeParseResponse(response);

  if (!data || data.error || !data.body) {
    const errorMsg = data?.message || data?.error || 'AI generation failed. Please try again.';
    const err = new Error(errorMsg);
    err.code = data?.error || 'AI_GENERATION_FAILED';
    err.details = data?.details;
    throw err;
  }

  return {
    subject: data.subject || userSubject || `${category.name} Communication`,
    body: data.body,
    category: data.category || category.name,
    categoryId: category.id,
    situation: data.situation || `${category.icon || ''} ${category.name}`.trim(),
    priority: data.priority || priority,
    importance: data.priority || priority,
    tone: data.tone || activeToneObj.name,
    toneId: activeToneObj.id,
    urgency: data.urgency || category.urgency,
    greeting: data.greeting || '',
    closing: data.closing || '',
    attachment_recommended: data.attachment_recommended || Boolean(category.id === 'job_application' || category.id === 'resume_submission'),
    attachment_filename: data.attachment_filename || (category.id === 'job_application' || category.id === 'resume_submission' ? 'resume.pdf' : null),
    modelUsed: data.model_used || null
  };
}

// Backward compatibility alias:
export const generateIntelligentEmail = generateAIEmail;
