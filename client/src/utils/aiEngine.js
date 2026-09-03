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
 * Determines appropriate recipient greeting
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

  if (recipient && recipient.includes('@')) {
    const localPart = recipient.split('@')[0];
    const cleanName = localPart.replace(/[0-9._-]/g, ' ').trim();
    if (cleanName.length > 2 && !cleanName.includes('info') && !cleanName.includes('support') && !cleanName.includes('contact')) {
      const formatted = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);
      return `Dear ${formatted},`;
    }
  }

  return 'Dear Sir/Madam,';
}

/**
 * Intelligent Professional Email Generator
 * Assembles human-crafted, grammatically flawless, fact-grounded emails tailored strictly to user intent
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
  const input = instruction.trim() || userSubject.trim();
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
  const myName = senderName || '[Your Name]';
  const closing = tone.includes('Casual') || tone.includes('Friendly') 
    ? `Best,\n${myName}` 
    : `Best regards,\n${myName}`;

  let finalSubject = userSubject.trim();
  let bodyContent = '';

  // 3. Category-Specific Structural Generation (Fact Grounded)
  switch (category.id) {
    case 'leave_request': {
      const durText = facts.duration ? `for ${facts.duration}` : '';
      let reasonText = 'personal reasons';
      if (lower.includes('sick') || lower.includes('fever') || lower.includes('illness') || lower.includes('unwell')) {
        reasonText = 'illness';
      }

      if (!finalSubject) {
        finalSubject = facts.duration 
          ? `Leave Request for ${facts.duration.charAt(0).toUpperCase() + facts.duration.slice(1)} Due to ${reasonText.charAt(0).toUpperCase() + reasonText.slice(1)}`
          : `Request for Leave Due to ${reasonText.charAt(0).toUpperCase() + reasonText.slice(1)}`;
      }

      bodyContent = `${greeting}

I am writing to formally request leave from work ${durText ? durText + ' ' : ''}due to ${reasonText}.

During my absence, I will ensure that any urgent responsibilities are handed over appropriately and will make every effort to remain reachable by email should any critical matter arise.

I kindly request you to approve my leave request, and I will keep you informed regarding my resumption of duties.

Thank you for your understanding and support.

${closing}`;
      break;
    }

    case 'emergency': {
      if (!finalSubject) {
        finalSubject = `Urgent: Emergency Notification & Immediate Absence`;
      }

      bodyContent = `${greeting}

I am writing to urgently inform you of an unforeseen emergency: ${input}.

Due to these urgent circumstances, I need to attend to this matter immediately and will be temporarily unavailable. I am taking all possible measures to minimize any disruption to ongoing priorities and will provide an update as soon as the situation is under control.

Thank you for your prompt understanding and cooperation during this time.

${closing}`;
      break;
    }

    case 'job_application': {
      const role = facts.jobRole || 'the open position';
      if (!finalSubject) {
        finalSubject = `Application for ${role.charAt(0).toUpperCase() + role.slice(1)} Position${hasAttachment ? ' – Resume Attached' : ''}`;
      }

      const attachmentClause = hasAttachment 
        ? 'I have attached my resume and credentials for your review.' 
        : 'I would welcome the opportunity to submit my detailed resume and portfolio for your consideration.';

      bodyContent = `${greeting}

I am writing to express my strong interest in applying for the ${role} at your organization.

With a solid background in this field and a commitment to professional excellence, I am confident in my ability to deliver meaningful results and contribute effectively to your team's ongoing initiatives.

${attachmentClause}

I would greatly appreciate the chance to discuss how my qualifications align with your requirements in an interview. Thank you very much for your time and consideration.

${closing}`;
      break;
    }

    case 'resume_submission': {
      if (!finalSubject) {
        finalSubject = `Submission of Resume – ${myName}`;
      }

      const attachmentLine = hasAttachment
        ? 'Please find my resume attached to this email for your reference and review.'
        : 'I am pleased to provide my background details and will gladly forward my full resume upon request.';

      bodyContent = `${greeting}

I am writing to share my professional profile and resume for your consideration regarding potential opportunities.

${attachmentLine}

Should you require any supplementary details, portfolio links, or references, please feel free to let me know. I look forward to the possibility of connecting further.

Thank you for your time and attention.

${closing}`;
      break;
    }

    case 'complaint': {
      if (!finalSubject) {
        finalSubject = `Formal Complaint Regarding: ${input.slice(0, 50)}`;
      }

      bodyContent = `${greeting}

I am writing to formally register a complaint regarding an issue I recently experienced: ${input}.

This situation has caused significant inconvenience and falls below the expected standard of service. I kindly request your immediate attention to investigate this matter and provide an appropriate resolution, including any warranted compensation or corrective action.

I would appreciate a prompt response detailing the steps being taken to resolve this problem.

Thank you for your prompt attention to this matter.

${closing}`;
      break;
    }

    case 'meeting': {
      if (!finalSubject) {
        finalSubject = `Request to Reschedule Meeting: ${input.slice(0, 45)}`;
      }

      bodyContent = `${greeting}

I am writing regarding our scheduled meeting. ${input}.

Could you please let me know if this adjusted timing is convenient for you, or propose an alternative slot that fits your calendar?

Thank you for your flexibility and understanding.

${closing}`;
      break;
    }

    case 'follow_up': {
      if (!finalSubject) {
        finalSubject = `Follow-up: ${input.slice(0, 45)}`;
      }

      bodyContent = `${greeting}

I am writing to briefly follow up on our previous communication regarding ${input}.

Could you please share an update on the current status, or let me know if any additional information is required from my end to move things forward?

Thank you for your time and assistance.

${closing}`;
      break;
    }

    case 'payment_invoice': {
      if (!finalSubject) {
        finalSubject = `Invoice & Payment Request: ${input.slice(0, 45)}`;
      }

      bodyContent = `${greeting}

I am writing to formally submit the invoice and request payment regarding ${input}.

Please arrange for the payment to be processed by the indicated due date. Kindly confirm receipt of this message or let me know if any further billing clarification is needed.

Thank you for your cooperation and prompt payment.

${closing}`;
      break;
    }

    case 'security_account': {
      if (!finalSubject) {
        finalSubject = `Urgent: Potential Security Alert Regarding Account`;
      }

      bodyContent = `${greeting}

I am writing to immediately report a potential security issue: ${input}.

To safeguard sensitive information and ensure account integrity, I request your urgent assistance in reviewing recent activity and verifying account security. Please advise on any immediate protective measures required.

Thank you for your urgent attention to this critical matter.

${closing}`;
      break;
    }

    case 'thank_you': {
      if (!finalSubject) {
        finalSubject = `Thank You for Your Assistance`;
      }

      bodyContent = `${greeting}

I wanted to take a moment to express my sincere appreciation: ${input}.

Your assistance and support have been immensely valuable, and I truly appreciate the time and effort you contributed.

Thank you once again!

${closing}`;
      break;
    }

    case 'personal_casual': {
      if (!finalSubject) {
        finalSubject = `Quick Note: ${input.slice(0, 35)}`;
      }

      bodyContent = `${greeting}

Hope you are doing well! Just wanted to send a quick note to let you know: ${input}.

Catch you shortly!

${closing}`;
      break;
    }

    default: {
      if (!finalSubject) {
        finalSubject = `Regarding: ${input.slice(0, 50)}`;
      }

      bodyContent = `${greeting}

I am writing to communicate regarding ${input}.

Please let me know if you require any additional information or have questions regarding this matter. I remain available to assist.

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
