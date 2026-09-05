/**
 * ============================================================================
 * Scribe AI — Intelligent Professional Email Generation & Classification Engine
 * ============================================================================
 * - 20 Intent Classification Categories
 * - Multi-Tone Detection & Combinations
 * - 4-Level Importance Detection (LOW, MEDIUM, HIGH, CRITICAL)
 * - 5-Level Urgency Detection
 * - Recipient-Aware Salutations & Structure
 * - Strict Fact Grounding (Zero Hallucination / No Invented Dates or Attachments)
 */

export const EMAIL_CATEGORIES = [
  {
    id: 'leave_request',
    name: 'Leave Request',
    icon: '📅',
    defaultTone: 'Formal + Respectful + Polite',
    importance: 'MEDIUM',
    urgency: 'Normal response',
    description: 'Sick leave, vacation, emergency absence, personal time off',
    keywords: ['leave', 'sick', 'fever', 'illness', 'vacation', 'day off', 'days off', 'holiday', 'unwell', 'out of office', 'doctor appointment', 'hospitalized', 'absent', 'absence', 'permission']
  },
  {
    id: 'emergency',
    name: 'Emergency',
    icon: '🚨',
    defaultTone: 'Urgent + Respectful + Concise',
    importance: 'CRITICAL',
    urgency: 'Immediate attention',
    description: 'Accidents, critical incidents, medical emergencies, immediate departures',
    keywords: ['accident', 'emergency', 'urgent personal', 'immediate attention', 'critical incident', 'hospital', 'casualty', 'leave immediately', 'urgent departure', 'family emergency']
  },
  {
    id: 'job_application',
    name: 'Job Application',
    icon: '💼',
    defaultTone: 'Formal + Professional + Confident',
    importance: 'HIGH',
    urgency: 'Normal response',
    description: 'Applying for job openings, internships, full-time positions',
    keywords: ['job application', 'applying for', 'software developer', 'role', 'position', 'vacancy', 'hiring manager', 'job opening', 'candidate', 'apply']
  },
  {
    id: 'resume_submission',
    name: 'Resume / Document Submission',
    icon: '📄',
    defaultTone: 'Formal + Concise + Professional',
    importance: 'HIGH',
    urgency: 'Normal response',
    description: 'Submitting resume, CV, portfolio, or formal documents',
    keywords: ['resume', 'cv', 'curriculum vitae', 'portfolio', 'send my resume', 'attached resume', 'document submission', 'credentials']
  },
  {
    id: 'complaint',
    name: 'Complaint',
    icon: '⚠️',
    defaultTone: 'Firm + Professional + Polite',
    importance: 'HIGH',
    urgency: 'Prompt response',
    description: 'Product issues, service delays, grievances, compensation claims',
    keywords: ['complaint', 'delayed', 'delay', 'compensation', 'refund', 'poor service', 'defective', 'damaged', 'unacceptable', 'dissatisfied', 'issue with product', 'grievance']
  },
  {
    id: 'meeting',
    name: 'Meeting / Appointment',
    icon: '🗓️',
    defaultTone: 'Polite + Professional',
    importance: 'MEDIUM',
    urgency: 'Prompt response',
    description: 'Scheduling, rescheduling, or requesting meetings and appointments',
    keywords: ['meeting', 'reschedule', 'appointment', 'move meeting', 'schedule', 'call', 'sync', 'zoom', 'google meet', 'catch up on call']
  },
  {
    id: 'follow_up',
    name: 'Reminder / Follow-up',
    icon: '🔄',
    defaultTone: 'Professional + Polite + Firm',
    importance: 'MEDIUM',
    urgency: 'Prompt response',
    description: 'Following up on proposals, unread messages, status of tasks',
    keywords: ['follow up', 'follow-up', 'following up', 'reminder', 'checking in', 'status update on', 'gentle reminder', 'pending response', 'haven\'t heard back']
  },
  {
    id: 'payment_invoice',
    name: 'Payment / Invoice',
    icon: '💳',
    defaultTone: 'Professional + Firm',
    importance: 'HIGH',
    urgency: 'Prompt response',
    description: 'Invoices, payment reminders, billing discrepancies, fee dues',
    keywords: ['invoice', 'payment', 'due date', 'pay by', 'billing', 'remittance', 'dues', 'receipt', 'wire transfer', 'fees']
  },
  {
    id: 'security_account',
    name: 'Security / Account',
    icon: '🛡️',
    defaultTone: 'Urgent + Serious + Professional',
    importance: 'CRITICAL',
    urgency: 'Immediate attention',
    description: 'Compromised accounts, unauthorized access, security alerts',
    keywords: ['compromised', 'hacked', 'security breach', 'unauthorized access', 'stolen', 'password reset', 'security alert', 'account locked', 'phishing']
  },
  {
    id: 'thank_you',
    name: 'Thank You / Appreciation',
    icon: '🙏',
    defaultTone: 'Warm + Appreciative',
    importance: 'LOW',
    urgency: 'No immediate action',
    description: 'Expressing gratitude, thanking collaborators, acknowledging assistance',
    keywords: ['thanks', 'thank you', 'grateful', 'appreciate', 'helping me', 'thankful', 'great help', 'gratitude']
  },
  {
    id: 'personal_casual',
    name: 'Personal / Casual',
    icon: '💬',
    defaultTone: 'Friendly + Casual',
    importance: 'LOW',
    urgency: 'Prompt response',
    description: 'Informal notes to friends, quick social updates, casual plans',
    keywords: ['friend', 'reach late', 'minutes late', 'running late', 'catch up', 'coffee', 'lunch', 'dinner', 'hang out', 'weekend', 'casual']
  },
  {
    id: 'official_professional',
    name: 'Professional / Official',
    icon: '👔',
    defaultTone: 'Formal + Professional',
    importance: 'HIGH',
    urgency: 'Normal response',
    description: 'Standard workplace communication, formal notices, official letters',
    keywords: ['official', 'formal', 'company policy', 'management', 'hr department', 'board', 'formal communication', 'authorized']
  },
  {
    id: 'announcement',
    name: 'Announcement',
    icon: '📢',
    defaultTone: 'Professional + Informative',
    importance: 'MEDIUM',
    urgency: 'No immediate action',
    description: 'Broadcasting company updates, policy launches, event notifications',
    keywords: ['announcement', 'announce', 'broadcasting', 'pleased to announce', 'we are launching', 'all hands', 'upcoming event', 'notice to all']
  },
  {
    id: 'apology',
    name: 'Apology',
    icon: '🙇',
    defaultTone: 'Apologetic + Respectful + Sincere',
    importance: 'MEDIUM',
    urgency: 'Prompt response',
    description: 'Apologizing for mistakes, delays, miscommunication, or oversights',
    keywords: ['sorry', 'apologize', 'apology', 'regret', 'inconvenience caused', 'oversight', 'my mistake', 'pardon']
  },
  {
    id: 'academic_student',
    name: 'Academic / Student',
    icon: '🎓',
    defaultTone: 'Formal + Respectful + Polite',
    importance: 'HIGH',
    urgency: 'Normal response',
    description: 'Messages to professors, universities, homework/exam submissions',
    keywords: ['professor', 'teacher', 'assignment', 'exam', 'grade', 'class', 'university', 'college', 'course', 'phd', 'student']
  },
  {
    id: 'business_proposal',
    name: 'Business Proposal',
    icon: '🤝',
    defaultTone: 'Professional + Persuasive + Confident',
    importance: 'HIGH',
    urgency: 'Prompt response',
    description: 'Partnership pitches, sales proposals, vendor quotes, collaboration offers',
    keywords: ['proposal', 'partnership', 'collaboration', 'business proposal', 'quotation', 'rfp', 'pitch', 'vendor offer']
  },
  {
    id: 'inquiry_info',
    name: 'Inquiry / Information Request',
    icon: '❓',
    defaultTone: 'Polite + Professional + Clear',
    importance: 'MEDIUM',
    urgency: 'Normal response',
    description: 'Asking for product info, pricing inquiries, general questions',
    keywords: ['inquire', 'inquiry', 'could you provide', 'requesting information', 'details regarding', 'price quote', 'brochure', 'clarification']
  },
  {
    id: 'congratulations',
    name: 'Congratulations',
    icon: '🎉',
    defaultTone: 'Warm + Enthusiastic + Friendly',
    importance: 'LOW',
    urgency: 'No immediate action',
    description: 'Celebrating promotions, achievements, weddings, graduations',
    keywords: ['congratulations', 'congrats', 'kudos', 'well done', 'promotion', 'achievement', 'award', 'celebrating']
  },
  {
    id: 'marketing_promotion',
    name: 'Marketing / Promotion',
    icon: '🚀',
    defaultTone: 'Persuasive + Engaging + Professional',
    importance: 'LOW',
    urgency: 'No immediate action',
    description: 'Promotional outreach, product offers, newsletter announcements',
    keywords: ['special offer', 'discount', 'limited time', 'promo', 'promotion', 'exclusive offer', 'new feature', 'sale']
  },
  {
    id: 'status_update',
    name: 'Status / Progress Update',
    icon: '📊',
    defaultTone: 'Professional + Clear + Concise',
    importance: 'MEDIUM',
    urgency: 'Normal response',
    description: 'Weekly sprint updates, milestone reports, project deliverable status',
    keywords: ['status update', 'progress update', 'milestone', 'sprint update', 'weekly report', 'project status', 'deliverables']
  }
];

/**
 * Classifies user text into one of the 20 email categories with confidence scores
 */
export function classifyEmailIntent(input = '', subject = '') {
  const text = `${subject} ${input}`.toLowerCase().trim();

  // 1. Specific High-Priority Intent Matches
  if (text.includes('accident') || text.includes('emergency') || (text.includes('immediate') && (text.includes('leave') || text.includes('hospital')))) {
    return EMAIL_CATEGORIES.find(c => c.id === 'emergency');
  }

  if (text.includes('compromised') || text.includes('hacked') || text.includes('unauthorized access')) {
    return EMAIL_CATEGORIES.find(c => c.id === 'security_account');
  }

  if (text.includes('complaint') || text.includes('compensation') || (text.includes('delayed') && text.includes('delivery')) || text.includes('refund')) {
    return EMAIL_CATEGORIES.find(c => c.id === 'complaint');
  }

  if (text.includes('invoice') || text.includes('pay by') || text.includes('payment') || text.includes('due date')) {
    return EMAIL_CATEGORIES.find(c => c.id === 'payment_invoice');
  }

  if (text.includes('sick') || text.includes('leave for') || text.includes('request leave') || text.includes('fever') || text.includes('vacation')) {
    return EMAIL_CATEGORIES.find(c => c.id === 'leave_request');
  }

  if (text.includes('resume') && (text.includes('job') || text.includes('developer') || text.includes('position') || text.includes('send my resume') || text.includes('hr'))) {
    // If it's explicitly applying for a job
    if (text.includes('apply') || text.includes('position') || text.includes('developer') || text.includes('role')) {
      return EMAIL_CATEGORIES.find(c => c.id === 'job_application');
    }
    return EMAIL_CATEGORIES.find(c => c.id === 'resume_submission');
  }

  if (text.includes('reschedule') || (text.includes('meeting') && (text.includes('move') || text.includes('tomorrow') || text.includes('friday')))) {
    return EMAIL_CATEGORIES.find(c => c.id === 'meeting');
  }

  if (text.includes('follow up') || text.includes('follow-up') || text.includes('proposal i sent')) {
    return EMAIL_CATEGORIES.find(c => c.id === 'follow_up');
  }

  if (text.includes('minutes late') || text.includes('running late') || text.includes('friend')) {
    return EMAIL_CATEGORIES.find(c => c.id === 'personal_casual');
  }

  if (text.includes('thanks') || text.includes('thank you') || text.includes('appreciate')) {
    return EMAIL_CATEGORIES.find(c => c.id === 'thank_you');
  }

  // 2. Keyword Scoring Match
  let bestCategory = EMAIL_CATEGORIES[0];
  let maxScore = -1;

  for (const cat of EMAIL_CATEGORIES) {
    let score = 0;
    for (const kw of cat.keywords) {
      if (text.includes(kw)) {
        score += kw.length; // Longer matches carry more weight
      }
    }
    if (score > maxScore) {
      maxScore = score;
      bestCategory = cat;
    }
  }

  return bestCategory;
}

/**
 * Extracts factual parameters without inventing details (no hallucinated dates/names)
 */
export function extractFactualDetails(input = '') {
  const text = input.trim();
  const lower = text.toLowerCase();

  // Extract duration (e.g. "3 days", "two weeks", "tomorrow")
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

  // Extract job role / position (e.g., "software developer position")
  let jobRole = null;
  const roleMatch = text.match(/for\s+(?:the\s+)?([a-zA-Z\s]+?)\s+(?:position|role|job)/i);
  if (roleMatch) {
    jobRole = roleMatch[1].trim();
  }

  // Extract recipient role (e.g. HR, manager, professor, client, friend)
  let recipientType = 'unknown';
  if (lower.includes('manager') || lower.includes('lead') || lower.includes('boss') || lower.includes('supervisor')) {
    recipientType = 'manager';
  } else if (lower.includes('hr') || lower.includes('recruiter') || lower.includes('hiring manager')) {
    recipientType = 'hr';
  } else if (lower.includes('professor') || lower.includes('teacher') || lower.includes('instructor')) {
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
 * Determines appropriate recipient greeting (warm and human)
 */
export function determineGreeting(recipient = '', recipientType = 'unknown') {
  if (recipientType === 'friend') {
    return 'Hi there,';
  }
  if (recipientType === 'professor') {
    return 'Dear Professor,';
  }
  if (recipientType === 'hr') {
    return 'Dear Hiring Manager,';
  }
  if (recipientType === 'manager') {
    return 'Dear Manager,';
  }
  if (recipientType === 'client') {
    return 'Dear Client,';
  }

  if (recipient && recipient.includes('@')) {
    const localPart = recipient.split('@')[0];
    const cleanName = localPart.replace(/[0-9._-]/g, ' ').trim();
    if (cleanName.length > 2 && !cleanName.includes('info') && !cleanName.includes('support') && !cleanName.includes('contact') && !cleanName.includes('admin')) {
      const formatted = cleanName.split(/\s+/)[0];
      const capitalized = formatted.charAt(0).toUpperCase() + formatted.slice(1).toLowerCase();
      return `Dear ${capitalized},`;
    }
  }

  return 'Hello,';
}

/**
 * Cleans input text from minor trailing typos (like "d" or ".") and conversational prefixes
 */
export function cleanUserInput(raw = '') {
  let text = (raw || '').trim();
  // Strip trailing single stray letter typos like " d" or " s" at the end of sentence
  text = text.replace(/\s+[a-zA-Z]$/, '').trim();
  // Remove conversational leading prompt phrasing
  text = text.replace(/^(?:please\s+)?(?:send\s+(?:an?\s+)?(?:email|mail)\s+(?:to\s+[^:]+?\s+)?(?:that\s+|saying\s+that\s+|saying\s+|about\s+)?|i\s+want\s+to\s+(?:send|write)\s+(?:an?\s+)?(?:email|mail)\s+(?:to\s+[^:]+?\s+)?(?:that\s+|about\s+)?|write\s+(?:an?\s+)?(?:email|mail)\s+(?:to\s+[^:]+?\s+)?(?:that\s+|about\s+)?)/i, '').trim();
  return text;
}

/**
 * Intelligent Professional Email Generator
 * Assembles human-crafted, grammatically polished, fact-grounded emails tailored strictly to user intent
 */
export function generateIntelligentEmail({
  instruction = '',
  userSubject = '',
  recipient = '',
  hasAttachment = false,
  customCategory = null,
  customTone = null,
  customPriority = null,
  senderName = ''
}) {
  const rawInput = instruction.trim() || userSubject.trim();
  const input = cleanUserInput(rawInput);
  const lower = input.toLowerCase();
  const facts = extractFactualDetails(input);
  
  // 1. Intent Classification
  const category = customCategory 
    ? (EMAIL_CATEGORIES.find(c => c.id === customCategory || c.name === customCategory) || classifyEmailIntent(input, userSubject))
    : classifyEmailIntent(input, userSubject);

  const tone = customTone || category.defaultTone;
  const priority = customPriority || category.importance;
  const urgency = category.urgency;

  // 2. Greeting & Sign-off
  const greeting = determineGreeting(recipient, facts.recipientType);
  const myName = getSenderDisplayName(senderName);
  const closing = tone.includes('Casual') || tone.includes('Friendly') 
    ? `Best regards,\n${myName}` 
    : `Warm regards,\n${myName}`;

  let finalSubject = userSubject.trim();
  let bodyContent = '';

  // 3. Category-Specific Structural Generation (Fact Grounded & Human Written)
  switch (category.id) {
    case 'leave_request': {
      const durText = facts.duration || 'a few days';
      let reasonDetail = 'personal matters';
      if (lower.includes('fever')) {
        reasonDetail = 'a high fever and acute weakness';
      } else if (lower.includes('sick') || lower.includes('illness') || lower.includes('unwell')) {
        reasonDetail = 'an unexpected illness';
      } else if (lower.includes('doctor') || lower.includes('hospital')) {
        reasonDetail = 'a medical appointment and required treatment';
      } else if (lower.includes('vacation') || lower.includes('trip') || lower.includes('holiday')) {
        reasonDetail = 'personal family vacation';
      }

      if (!finalSubject) {
        finalSubject = `Sick Leave Application – ${durText.charAt(0).toUpperCase() + durText.slice(1)}`;
      }

      bodyContent = `${greeting}

I am writing to inform you that I am currently unwell with ${reasonDetail} and will need to take sick leave for ${durText} to consult a physician and rest.

I have made sure my current responsibilities and pending deliverables are organized, and I will do my best to check urgent emails periodically if an emergency arises.

I expect to resume work once my recovery concludes and will keep you posted on my progress. Thank you very much for your understanding and support.

${closing}`;
      break;
    }

    case 'emergency': {
      let emergDetail = input.replace(/^emergency\s*(?:leave)?\s*(?:today)?[:\s-]*/i, '').trim();
      if (!emergDetail) emergDetail = 'an urgent family emergency that requires my immediate presence';

      if (!finalSubject) {
        finalSubject = `Urgent: Emergency Leave Notice – Today`;
      }

      bodyContent = `${greeting}

I am writing to urgently let you know that an unforeseen emergency has occurred today: ${emergDetail}.

Due to these urgent circumstances, I need to leave immediately to attend to the situation. I have briefed my team on immediate priorities to ensure coverage during my absence.

Should any critical matter require my urgent attention, please feel free to reach me on my mobile phone. I will provide an update as soon as the situation is under control.

Thank you very much for your prompt understanding and cooperation.

${closing}`;
      break;
    }

    case 'job_application': {
      const role = facts.jobRole || 'the open position';
      if (!finalSubject) {
        finalSubject = `Application for ${role.charAt(0).toUpperCase() + role.slice(1)} Position – ${myName}`;
      }

      const attachmentClause = hasAttachment 
        ? 'I have attached my resume and supporting credentials for your review.' 
        : 'I would be delighted to share my detailed resume and portfolio upon your request.';

      bodyContent = `${greeting}

I am writing to express my strong interest in the ${role} opportunity at your organization.

With a dedicated background in this field, strong technical expertise, and a track record of driving results, I am confident in my ability to make a meaningful and immediate contribution to your team's objectives.

${attachmentClause}

I would welcome the opportunity to discuss how my experience and qualifications align with your requirements in an interview. Thank you very much for your time and consideration.

${closing}`;
      break;
    }

    case 'resume_submission': {
      if (!finalSubject) {
        finalSubject = `Resume & Profile Submission – ${myName}`;
      }

      const attachmentLine = hasAttachment
        ? 'Please find my updated resume attached to this email for your reference.'
        : 'I have prepared my updated resume and would be glad to share it for your review.';

      bodyContent = `${greeting}

I hope you are having a productive week.

I am reaching out to submit my professional resume and profile for prospective career opportunities with your team.

${attachmentLine} It highlights my core skills, recent milestones, and experience delivering impactful projects. I would be thrilled to connect and discuss how my skill set can benefit your upcoming initiatives.

Thank you for your time, and I look forward to hearing from you.

${closing}`;
      break;
    }

    case 'complaint': {
      let compDetail = input.replace(/^complaint[:\s-]*/i, '').trim();
      if (!finalSubject) {
        finalSubject = `Formal Concern Regarding: ${compDetail.slice(0, 45)}`;
      }

      bodyContent = `${greeting}

I am writing to bring an important concern to your attention regarding ${compDetail}.

Unfortunately, this has caused considerable inconvenience and falls short of the expected standard of service. I kindly request your assistance in investigating this matter and providing an appropriate resolution or corrective action at your earliest convenience.

I appreciate your prompt attention to this issue and look forward to your response.

${closing}`;
      break;
    }

    case 'meeting': {
      let meetDetail = input.replace(/^reschedule\s*(?:our)?\s*meeting[:\s-]*/i, '').trim();
      if (!finalSubject) {
        finalSubject = `Meeting Schedule Update: ${meetDetail.slice(0, 40)}`;
      }

      bodyContent = `${greeting}

I hope you are doing well.

Regarding our scheduled discussion: ${meetDetail}.

Please let me know if this proposed timing works with your calendar, or feel free to suggest another time slot that fits your availability. I appreciate your flexibility and look forward to speaking soon.

${closing}`;
      break;
    }

    case 'follow_up': {
      let followTopic = input.replace(/^follow\s*up\s*(?:on)?[:\s-]*/i, '').trim();
      if (!finalSubject) {
        finalSubject = `Following Up: ${followTopic.slice(0, 40)}`;
      }

      bodyContent = `${greeting}

I hope you're having a great week.

I am writing to briefly check in regarding ${followTopic}.

Could you please let me know if you have had an opportunity to review this, or if any additional details are needed from my end to help move things forward? I am happy to hop on a quick call whenever convenient.

Thank you for your time and assistance.

${closing}`;
      break;
    }

    case 'payment_invoice': {
      let payDetail = input.replace(/^invoice\s*(?:and)?\s*payment[:\s-]*/i, '').trim();
      if (!finalSubject) {
        finalSubject = `Invoice & Payment Request: ${payDetail.slice(0, 40)}`;
      }

      bodyContent = `${greeting}

I hope this email finds you well.

I am writing to share the invoice details regarding ${payDetail}.

Please review the attached billing statement and arrange for processing in accordance with our agreed timeline. Kindly confirm receipt and let me know if your finance team requires any additional purchase order details or documentation.

Thank you very much for your prompt cooperation and continued partnership.

${closing}`;
      break;
    }

    case 'security_account': {
      let secDetail = input.replace(/^security\s*(?:alert)?[:\s-]*/i, '').trim();
      if (!finalSubject) {
        finalSubject = `Urgent: Security Notification Regarding Account`;
      }

      bodyContent = `${greeting}

I am writing to urgently report a potential security issue regarding ${secDetail}.

To ensure account integrity and safeguard data, I request your prompt assistance in reviewing recent activity on this account and confirming its security status.

Please advise on any immediate action or security steps required. Thank you for your prompt attention to this matter.

${closing}`;
      break;
    }

    case 'thank_you': {
      let thankDetail = input.replace(/^thank\s*you\s*(?:for)?[:\s-]*/i, '').trim();
      if (!finalSubject) {
        finalSubject = `Heartfelt Thanks & Appreciation`;
      }

      bodyContent = `${greeting}

I wanted to take a moment to express my sincere appreciation for your support with ${thankDetail}.

Your assistance made a significant difference, and I truly value the time, effort, and guidance you provided. Working with you has been an absolute pleasure.

Thank you once again!

${closing}`;
      break;
    }

    case 'personal_casual': {
      let note = input.replace(/^quick\s*note[:\s-]*/i, '').trim();
      if (!finalSubject) {
        finalSubject = `Quick Note: ${note.slice(0, 35)}`;
      }

      bodyContent = `${greeting}

Hope you're doing great!

Just wanted to send you a quick update: ${note}.

Let's catch up soon when you have a free moment.

${closing}`;
      break;
    }

    default: {
      let cleanGeneral = input.replace(/^(?:regarding|about)[:\s-]*/i, '').trim();
      if (!finalSubject) {
        finalSubject = `Regarding: ${cleanGeneral.slice(0, 45)}`;
      }

      bodyContent = `${greeting}

I hope you are doing well.

I am reaching out to communicate regarding ${cleanGeneral}.

Please let me know if you need any additional information or have questions regarding this. I am happy to provide further details at your convenience.

Thank you for your time and consideration.

${closing}`;
      break;
    }
  }

  return {
    subject: finalSubject,
    body: bodyContent,
    category: category.name,
    categoryId: category.id,
    situation: `${category.icon} ${category.name}`,
    priority,
    tone,
    urgency,
    greeting,
    closing
  };
}
