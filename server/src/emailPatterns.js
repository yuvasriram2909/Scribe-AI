/**
 * Professional Email Situation & Pattern Library
 * Provides rich situation detection, natural subject formatting, and problem-tailored email body generation.
 */

export const SUPPORTED_SITUATIONS = [
  {
    id: '🚨 Emergency',
    name: '🚨 Emergency',
    category: 'Emergency',
    priority: 'High',
    tone: 'Urgent',
    badgeClass: 'bg-red-500/20 text-red-300 border-red-500/40',
    keywords: ['emergency', 'medical emergency', 'hospital', 'hospitalized', "doctor's appointment", 'doctor appointment', 'accident', 'urgent personal', 'unexpected absence', 'urgent situation', 'doctor']
  },
  {
    id: '⚠️ Important / Necessary',
    name: '⚠️ Important / Necessary',
    category: 'Important',
    priority: 'High',
    tone: 'Professional',
    badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    keywords: ['important', 'required action', 'deadline', 'time-sensitive', 'important request', 'required approval', 'critical', 'urgent']
  },
  {
    id: '💼 Official / Professional',
    name: '💼 Official / Professional',
    category: 'Official/Professional',
    priority: 'Normal',
    tone: 'Professional',
    badgeClass: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
    keywords: ['project update', 'meeting request', 'client communication', 'business communication', 'work update', 'status report', 'formal request', 'complaint', 'apology', 'professional notification', 'delay', 'delayed', 'work from home', 'wfh', 'salary', 'extension']
  },
  {
    id: '📅 Leave / Holiday',
    name: '📅 Leave / Holiday',
    category: 'Leave/Holiday',
    priority: 'Normal',
    tone: 'Professional',
    badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    keywords: ['leave', 'vacation', 'holiday', 'sick leave', 'casual leave', 'day off', 'permission', 'out of office', 'family function', 'sick', 'illness']
  },
  {
    id: '📄 Resume / Job Application',
    name: '📄 Resume / Job Application',
    category: 'Resume/Job Application',
    priority: 'Normal',
    tone: 'Formal',
    badgeClass: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
    keywords: ['resume', 'cv', 'job application', 'applying for', 'position', 'role', 'internship', 'software developer position']
  },
  {
    id: '🔄 Follow-up',
    name: '🔄 Follow-up',
    category: 'Follow-up',
    priority: 'Normal',
    tone: 'Professional',
    badgeClass: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    keywords: ['follow-up', 'follow up', 'payment follow-up', 'checking in', 'reminder', 'interview follow-up', 'pending payment', 'payment update']
  },
  {
    id: '💬 Casual',
    name: '💬 Casual',
    category: 'Casual',
    priority: 'Normal',
    tone: 'Friendly',
    badgeClass: 'bg-pink-500/20 text-pink-300 border-pink-500/40',
    keywords: ['casual', 'hey', 'friendly', 'catch up', 'informal', 'coffee', 'lunch']
  },
  {
    id: '🎉 Celebration / Occasion',
    name: '🎉 Celebration / Occasion',
    category: 'Occasion',
    priority: 'Normal',
    tone: 'Warm',
    badgeClass: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40',
    keywords: ['birthday', 'congratulat', 'anniversary', 'festival', 'greeting', 'farewell', 'welcome', 'thank you']
  }
];

export function detectSituation(instruction) {
  if (!instruction || typeof instruction !== 'string') {
    return SUPPORTED_SITUATIONS[2]; // Default to Official / Professional
  }

  const lower = instruction.toLowerCase().trim();

  // 1. Emergency Detection
  if (
    lower.includes('emergency') || 
    lower.includes('hospital') || 
    lower.includes("doctor's appointment") || 
    lower.includes('doctor appointment') || 
    lower.includes('accident') || 
    lower.includes('urgent personal') || 
    lower.includes('unexpected absence') || 
    lower.includes('urgent situation')
  ) {
    return SUPPORTED_SITUATIONS[0]; // 🚨 Emergency
  }

  // 2. Resume / Job Application
  if (
    lower.includes('resume') || 
    lower.includes('cv') || 
    lower.includes('job application') || 
    lower.includes('applying for') || 
    lower.includes('internship') || 
    lower.includes('position') ||
    lower.includes('job vacancy')
  ) {
    return SUPPORTED_SITUATIONS[4]; // 📄 Resume / Job Application
  }

  // 3. Follow-up / Reminders / Payment
  if (
    lower.includes('follow-up') || 
    lower.includes('follow up') || 
    lower.includes('checking in') || 
    lower.includes('reminder') ||
    lower.includes('payment')
  ) {
    return SUPPORTED_SITUATIONS[5]; // 🔄 Follow-up
  }

  // 4. Celebration / Occasion
  if (
    lower.includes('birthday') || 
    lower.includes('congratulat') || 
    lower.includes('anniversary') || 
    lower.includes('festival') || 
    lower.includes('farewell') || 
    lower.includes('welcome')
  ) {
    return SUPPORTED_SITUATIONS[7]; // 🎉 Celebration / Occasion
  }

  // 5. Leave / Holiday (Non-emergency leave)
  if (
    lower.includes('leave') || 
    lower.includes('vacation') || 
    lower.includes('holiday') || 
    lower.includes('sick') || 
    lower.includes('illness') ||
    lower.includes('day off') || 
    lower.includes('family function') ||
    lower.includes('wedding')
  ) {
    return SUPPORTED_SITUATIONS[3]; // 📅 Leave / Holiday
  }

  // 6. Casual
  if (
    lower.includes('casual') || 
    lower.includes('hey') || 
    lower.includes('friendly') || 
    lower.includes('catch up') || 
    lower.includes('informal')
  ) {
    return SUPPORTED_SITUATIONS[6]; // 💬 Casual
  }

  // 7. Important / Urgent Action
  if (
    lower.includes('important') || 
    lower.includes('required action') || 
    lower.includes('time-sensitive') || 
    lower.includes('required approval')
  ) {
    return SUPPORTED_SITUATIONS[1]; // ⚠️ Important / Necessary
  }

  // 8. Official / Professional (Default)
  return SUPPORTED_SITUATIONS[2]; // 💼 Official / Professional
}

export function formatNaturalSubject(instruction, situationObj, providedSubject = '') {
  if (providedSubject && providedSubject.trim()) {
    return providedSubject.trim();
  }

  if (!instruction || typeof instruction !== 'string') {
    return 'Official Professional Communication';
  }

  const lower = instruction.toLowerCase().trim();

  // Work from Home
  if (lower.includes('work from home') || lower.includes('wfh')) {
    if (lower.includes('tomorrow')) return 'Request to Work from Home Tomorrow';
    if (lower.includes('today')) return 'Request to Work from Home Today';
    return 'Request to Work from Home';
  }

  // Leave Requests
  if (lower.includes('leave')) {
    if (lower.includes('illness') || lower.includes('sick')) {
      const matchDays = instruction.match(/(\d+)\s*days?/i);
      const daysStr = matchDays ? `${matchDays[1]} Days ` : '';
      return `Request for ${daysStr}Leave Due to Illness`;
    }
    if (lower.includes('family function')) return 'Leave Request – Family Function';
    if (lower.includes('wedding')) return 'Leave Application – Attending Family Wedding';
    if (lower.includes('tomorrow')) return 'Leave Application for Tomorrow';
    const matchDays = instruction.match(/(\d+)\s*days?/i);
    if (matchDays) return `Request for ${matchDays[1]} Days Leave`;
    return 'Formal Leave Request';
  }

  // Complaint / Delayed Delivery
  if (lower.includes('complaint') || lower.includes('delayed delivery') || lower.includes('delayed order')) {
    return 'Complaint Regarding Delayed Order Delivery';
  }

  // Payment Follow-Up
  if (lower.includes('payment') || lower.includes('invoice')) {
    return 'Follow-Up on Pending Payment and Invoice Status';
  }

  // Deadline Extension
  if (lower.includes('extension') || lower.includes('deadline')) {
    return 'Request for Project Deadline Extension';
  }

  // Meeting Request
  if (lower.includes('meeting')) {
    if (lower.includes('project manager')) return 'Request for Meeting with Project Manager';
    return 'Request for Discussion Meeting';
  }

  // Salary Revision
  if (lower.includes('salary') || lower.includes('compensation')) {
    return 'Request for Discussion Regarding Salary Revision';
  }

  // Job Application
  if (lower.includes('resume') || lower.includes('job application') || lower.includes('position') || lower.includes('applying for')) {
    if (lower.includes('software developer')) return 'Application for Software Developer Position – Resume Attached';
    return 'Job Application & Resume Submission';
  }

  // Emergency
  if (lower.includes('emergency')) {
    if (lower.includes('afternoon')) return 'Emergency Leave Request for This Afternoon';
    if (lower.includes('medical') || lower.includes('doctor')) return 'Emergency Medical Leave Request';
    return 'Emergency Leave Notification';
  }

  // Default clean subject
  const cleanFirstSentence = instruction.split(/[.!?\n]/)[0].trim();
  if (cleanFirstSentence.length > 5 && cleanFirstSentence.length < 60) {
    return cleanFirstSentence.charAt(0).toUpperCase() + cleanFirstSentence.slice(1);
  }

  return 'Official Project & Work Update';
}

/**
 * Builds a natural, problem-specific email body without generic filler
 */
export function buildNaturalBody({ instruction, situationObj, recipientName, userSignature }) {
  const sitName = situationObj?.name || situationObj || '';
  const lower = (instruction || '').toLowerCase().trim();

  let greeting = 'Dear Sir/Madam,';
  if (recipientName && recipientName.trim()) {
    greeting = `Dear ${recipientName.trim()},`;
  } else if (sitName.includes('Casual')) {
    greeting = 'Hi there,';
  } else if (sitName.includes('Resume')) {
    greeting = 'Dear Hiring Manager,';
  } else if (lower.includes('manager')) {
    greeting = 'Dear Manager,';
  } else if (lower.includes('client')) {
    greeting = 'Dear Client,';
  } else if (lower.includes('hr')) {
    greeting = 'Dear HR Team,';
  }

  let closing = 'Best regards,';
  if (sitName.includes('Emergency') || sitName.includes('Resume')) {
    closing = 'Sincerely,';
  } else if (sitName.includes('Casual')) {
    closing = 'Warm regards,';
  }

  let paragraphs = [];

  // Scenario A: Work from home
  if (lower.includes('work from home') || lower.includes('wfh')) {
    const when = lower.includes('tomorrow') ? 'tomorrow' : (lower.includes('today') ? 'today' : '[date]');
    let reasonText = 'due to personal circumstances';
    if (lower.includes('not feeling well') || lower.includes('sick') || lower.includes('illness')) {
      reasonText = 'as I am not feeling well';
    } else if (lower.includes('appointment')) {
      reasonText = 'due to a personal appointment';
    } else if (lower.includes('internet installation')) {
      reasonText = 'because an internet installation is scheduled at my residence';
    } else if (lower.includes('family')) {
      reasonText = 'due to family commitments at home';
    }

    paragraphs.push(`I am writing to politely request permission to work from home ${when} ${reasonText}.`);
    paragraphs.push(`I will ensure that all my daily deliverables and responsibilities are handled seamlessly. I will be fully reachable via email, chat, and phone throughout working hours to participate in meetings and assist team members.`);
    paragraphs.push(`I kindly request your approval for working remotely for the specified time.`);
    paragraphs.push(`Thank you for your consideration and understanding.`);
  }

  // Scenario B: Leave Request
  else if (lower.includes('leave') || lower.includes('vacation') || lower.includes('sick') || lower.includes('illness')) {
    const matchDays = instruction.match(/(\d+)\s*days?/i);
    const durationText = matchDays ? `for ${matchDays[1]} days` : 'for the required period';
    
    let reasonText = '';
    if (lower.includes('illness') || lower.includes('sick') || lower.includes('fever') || lower.includes('unwell')) {
      reasonText = ' due to illness';
    } else if (lower.includes('family function')) {
      reasonText = ' to attend a family function';
    } else if (lower.includes('wedding')) {
      reasonText = " to attend my sister's wedding";
    } else if (lower.includes('doctor') || lower.includes('medical')) {
      reasonText = ' due to a scheduled medical appointment';
    }

    paragraphs.push(`I am writing to formally request leave ${durationText}${reasonText}. I would like to avail this leave from [Start Date] to [End Date].`);
    paragraphs.push(`I have organized my current tasks to ensure no disruption to ongoing workflows. Important pending items have been completed or delegated to team members, and I will remain accessible for urgent queries if needed.`);
    paragraphs.push(`I kindly request you to approve my leave application for the aforementioned duration.`);
    paragraphs.push(`Thank you for your support and understanding.`);
  }

  // Scenario C: Complaint about delayed order / delivery
  else if (lower.includes('complaint') || lower.includes('delayed delivery') || lower.includes('delayed order') || lower.includes('delay in delivery')) {
    paragraphs.push(`I am writing to express my concern regarding the delayed delivery of my order [Order Number / Reference].`);
    paragraphs.push(`The delivery is past the promised estimated timeframe, and I have not received an updated status or tracking information regarding the shipment.`);
    paragraphs.push(`I kindly request you to investigate this matter promptly and provide an update on the current whereabouts of the order and the revised delivery timeline.`);
    paragraphs.push(`Thank you for your prompt attention to resolving this issue.`);
  }

  // Scenario D: Pending payment / Invoice follow-up
  else if (lower.includes('payment') || lower.includes('invoice')) {
    paragraphs.push(`I hope this email finds you well. I am writing to follow up regarding the pending payment for invoice [Invoice Number] amounting to [Amount, if applicable].`);
    paragraphs.push(`According to our records, the payment was scheduled for settlement recently. Could you please check with your accounts department and provide an update on the status of this transaction?`);
    paragraphs.push(`If you require a copy of the invoice or any additional documentation, please let me know and I will gladly provide it.`);
    paragraphs.push(`Thank you for your time and cooperation.`);
  }

  // Scenario E: Deadline extension
  else if (lower.includes('extension') || (lower.includes('deadline') && lower.includes('delay'))) {
    let reasonClause = 'due to unforeseen dependencies';
    if (lower.includes('api access')) {
      reasonClause = 'because of delays in receiving required API access credentials';
    } else if (lower.includes('dependency') || lower.includes('blocker')) {
      reasonClause = 'due to critical external dependencies';
    }

    paragraphs.push(`I am writing to formally request an extension for the [Project Name] project deadline ${reasonClause}.`);
    paragraphs.push(`While our team has completed the prerequisite milestones, this dependency has impacted our testing and final deployment schedule. Extending the deadline to [Proposed New Deadline Date] will allow us to ensure thorough quality assurance and a stable delivery.`);
    paragraphs.push(`I appreciate your understanding and would be happy to discuss this in detail if required.`);
    paragraphs.push(`Thank you for your consideration.`);
  }

  // Scenario F: Meeting request
  else if (lower.includes('meeting')) {
    let person = 'the project manager';
    if (lower.includes('project manager')) person = 'the Project Manager';
    else if (lower.includes('team')) person = 'the team';
    else if (lower.includes('client')) person = 'you';

    paragraphs.push(`I hope you are having a productive week. I would like to request a brief meeting with ${person} to discuss [Topic / Agenda Items].`);
    paragraphs.push(`The objective of this discussion is to align on current priorities, review open action items, and address any questions moving forward.`);
    paragraphs.push(`Please let me know your availability for a 15–30 minute session during [Proposed Date / Time Range], and I will send a calendar invite accordingly.`);
    paragraphs.push(`Thank you for your time, and I look forward to connecting.`);
  }

  // Scenario G: Salary revision
  else if (lower.includes('salary') || lower.includes('compensation') || lower.includes('appraisal')) {
    paragraphs.push(`I am writing to formally request a meeting to discuss a review of my current compensation and salary.`);
    paragraphs.push(`Over my tenure, I have consistently contributed to key milestones and expanded my responsibilities across our core projects. I would appreciate the opportunity to discuss how my performance aligns with the company's growth and compensation structure.`);
    paragraphs.push(`Please let me know a suitable time when we can have a brief discussion regarding this.`);
    paragraphs.push(`Thank you for your time, guidance, and consideration.`);
  }

  // Scenario H: Resume / Job Application
  else if (sitName.includes('Resume') || lower.includes('resume') || lower.includes('job application')) {
    paragraphs.push(`I am writing to express my strong interest in applying for the [Job Title / Position] role at [Company Name].`);
    paragraphs.push(`With relevant experience in software development and project execution, I have developed technical skills and practical expertise that align with your team's objectives. I have attached my updated resume for your review.`);
    paragraphs.push(`I would welcome the opportunity to discuss my qualifications in an interview. Thank you for your time and consideration.`);
  }

  // Scenario I: General Problem Input
  else {
    const cleanProblem = instruction ? instruction.replace(/^(please\s+|i\s+want\s+to\s+|kindly\s+|write\s+an?\s+email\s+to\s+)/i, '').trim() : 'our upcoming project deliverables';
    paragraphs.push(`I am writing to bring the following matter to your attention regarding ${cleanProblem}.`);
    paragraphs.push(`I wanted to provide clear context on this situation so that we can coordinate effectively and take the appropriate next steps.`);
    paragraphs.push(`Please review these details and let me know if you need any additional information from my side.`);
    paragraphs.push(`Thank you for your time and support.`);
  }

  let fullBodyLines = [greeting, ''];
  for (const para of paragraphs) {
    fullBodyLines.push(para);
    fullBodyLines.push('');
  }
  fullBodyLines.push(closing);

  if (userSignature && userSignature.enabled && userSignature.name) {
    fullBodyLines.push(userSignature.name);
    if (userSignature.designation) fullBodyLines.push(userSignature.designation);
    if (userSignature.company) fullBodyLines.push(userSignature.company);
    if (userSignature.phone) fullBodyLines.push(`Phone: ${userSignature.phone}`);
    if (userSignature.website) fullBodyLines.push(userSignature.website);
  }

  return {
    greeting,
    closing,
    body: fullBodyLines.join('\n')
  };
}
