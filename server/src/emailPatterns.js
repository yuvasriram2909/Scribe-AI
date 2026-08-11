/**
 * Professional Email Situation & Pattern Library
 * Supports 8 Exact Situations with Automatic Priority, Tone, Subject, and Natural Prose Body Generation.
 */

export const SUPPORTED_SITUATIONS = [
  {
    id: '🚨 Emergency',
    name: '🚨 Emergency',
    category: 'Emergency',
    priority: 'High',
    tone: 'Urgent',
    badgeClass: 'bg-red-500/20 text-red-300 border-red-500/40',
    keywords: ['emergency', 'medical emergency', 'hospital', 'hospitalized', 'doctor\'s appointment', 'doctor appointment', 'accident', 'urgent personal', 'unexpected absence', 'urgent situation', 'doctor']
  },
  {
    id: '⚠️ Important / Necessary',
    name: '⚠️ Important / Necessary',
    category: 'Important',
    priority: 'High',
    tone: 'Professional',
    badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    keywords: ['important', 'required action', 'deadline', 'time-sensitive', 'important request', 'required approval', 'critical']
  },
  {
    id: '💼 Official / Professional',
    name: '💼 Official / Professional',
    category: 'Official/Professional',
    priority: 'Normal',
    tone: 'Professional',
    badgeClass: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
    keywords: ['project update', 'meeting request', 'client communication', 'business communication', 'work update', 'status report', 'formal request', 'complaint', 'apology', 'professional notification', 'delay', 'delayed']
  },
  {
    id: '📅 Leave / Holiday',
    name: '📅 Leave / Holiday',
    category: 'Leave/Holiday',
    priority: 'Normal',
    tone: 'Professional',
    badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    keywords: ['leave', 'vacation', 'holiday', 'sick leave', 'casual leave', 'day off', 'permission', 'out of office', 'family function']
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
    keywords: ['follow-up', 'follow up', 'payment follow-up', 'checking in', 'reminder', 'interview follow-up']
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

  // 1. Emergency Detection (High priority context)
  if (
    lower.includes('emergency') || 
    lower.includes('hospital') || 
    lower.includes('doctor\'s appointment') || 
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
    lower.includes('software developer position')
  ) {
    return SUPPORTED_SITUATIONS[4]; // 📄 Resume / Job Application
  }

  // 3. Follow-up
  if (
    lower.includes('follow-up') || 
    lower.includes('follow up') || 
    lower.includes('checking in') || 
    lower.includes('reminder')
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
    lower.includes('day off') || 
    lower.includes('family function')
  ) {
    return SUPPORTED_SITUATIONS[3]; // 📅 Leave / Holiday
  }

  // 6. Important / Necessary
  if (
    lower.includes('important') || 
    lower.includes('required action') || 
    lower.includes('deadline') || 
    lower.includes('time-sensitive') || 
    lower.includes('required approval')
  ) {
    return SUPPORTED_SITUATIONS[1]; // ⚠️ Important / Necessary
  }

  // 7. Casual
  if (
    lower.includes('casual') || 
    lower.includes('hey') || 
    lower.includes('friendly') || 
    lower.includes('catch up') || 
    lower.includes('informal')
  ) {
    return SUPPORTED_SITUATIONS[6]; // 💬 Casual
  }

  // 8. Default: Official / Professional
  return SUPPORTED_SITUATIONS[2]; // 💼 Official / Professional
}

export function formatNaturalSubject(instruction, situationObj) {
  if (!instruction || typeof instruction !== 'string') {
    return 'Official Professional Communication Notice';
  }

  const lower = instruction.toLowerCase().trim();
  const situation = situationObj?.name || situationObj || '';

  if (situation.includes('Emergency') || lower.includes('emergency')) {
    if (lower.includes('afternoon')) return 'Emergency Leave Request for This Afternoon';
    if (lower.includes('medical') || lower.includes('doctor')) return 'Emergency Medical Leave Request';
    if (lower.includes('family')) return 'Urgent Family Emergency Leave Request';
    return 'Emergency Leave Request';
  }

  if (situation.includes('Leave') || lower.includes('leave')) {
    if (lower.includes('family function')) return 'Planned Leave Request – Family Function';
    if (lower.includes('sick')) return 'Sick Leave Notification';
    if (lower.includes('tomorrow')) return 'Leave Application for Tomorrow';
    return 'Planned Leave Request';
  }

  if (situation.includes('Resume') || lower.includes('resume')) {
    if (lower.includes('software developer')) return 'Application for Software Developer Position – Resume Attached';
    return 'Job Application & Resume Submission';
  }

  if (situation.includes('Follow-up') || lower.includes('follow up')) {
    if (lower.includes('interview')) return 'Interview Follow-Up Regarding Software Developer Position';
    if (lower.includes('payment')) return 'Follow-Up Regarding Pending Payment';
    return 'Request for Project Status Update';
  }

  if (situation.includes('Celebration') || lower.includes('birthday')) {
    if (lower.includes('birthday')) return 'Warm Birthday Wishes to You';
    return 'Warm Wishes & Celebratory Greetings';
  }

  if (situation.includes('Official') || lower.includes('delay') || lower.includes('project')) {
    if (lower.includes('delay')) return 'Project Delivery Update – Two-Day Delay';
    return 'Official Project Progress Update';
  }

  if (situation.includes('Casual')) {
    return 'Quick Note & Catch-Up';
  }

  return 'Important Action & Updates Notification';
}

export function buildNaturalBody({ instruction, situationObj, recipientName, userSignature }) {
  const sitName = situationObj?.name || situationObj || '';
  const cleanIns = instruction ? instruction.replace(/\.+$/, '') : 'our current communication';

  let greeting = 'Dear Sir/Madam,';
  if (sitName.includes('Casual')) greeting = recipientName ? `Hi ${recipientName},` : 'Hi there,';
  else if (sitName.includes('Celebration')) greeting = recipientName ? `Dear ${recipientName},` : 'Dear Colleague,';
  else if (sitName.includes('Resume')) greeting = recipientName ? `Dear ${recipientName},` : 'Dear Hiring Manager,';
  else if (recipientName) greeting = `Dear ${recipientName},`;

  let closing = 'Best regards,';
  if (sitName.includes('Emergency')) closing = 'Sincerely,';
  else if (sitName.includes('Resume')) closing = 'Sincerely,';
  else if (sitName.includes('Casual')) closing = 'Cheers,';
  else if (sitName.includes('Celebration')) closing = 'Warm regards,';

  let lines = [];
  lines.push(greeting);
  lines.push('');

  if (sitName.includes('Emergency')) {
    lines.push(`I am writing to formally request emergency leave due to an unexpected situation requiring my immediate personal attention.`);
    lines.push(``);
    lines.push(`Regarding my current schedule: ${cleanIns}. Due to the unforeseen nature of this matter, I am unable to attend to my regular duties during this specified time frame.`);
    lines.push(``);
    lines.push(`To minimize any potential impact on our ongoing workflow, I have organized my current pending tasks and informed team members so urgent items can be managed in my absence.`);
    lines.push(``);
    lines.push(`I will monitor my email periodically for any critical emergencies and remain reachable via phone for urgent escalation matters. I will keep you updated regarding my status and return to full duty as soon as possible.`);
    lines.push(``);
    lines.push(`Thank you for your prompt understanding, support, and approval of this emergency leave.`);
  } else if (sitName.includes('Leave')) {
    lines.push(`I am writing to formally submit a request for planned leave as outlined in my upcoming schedule.`);
    lines.push(``);
    lines.push(`Specifically, ${cleanIns}. I have planned this absence in advance to ensure that all ongoing projects and daily operational tasks continue seamlessly without interruption.`);
    lines.push(``);
    lines.push(`Prior to my departure, I will complete all high-priority deliverables and delegate urgent pending responsibilities to team members to maintain continuous workflow support.`);
    lines.push(``);
    lines.push(`During my leave period, I will have periodic access to email for urgent inquiries and will respond to all pending requests immediately upon my return.`);
    lines.push(``);
    lines.push(`Thank you for your consideration, understanding, and approval of this leave request.`);
  } else if (sitName.includes('Resume')) {
    lines.push(`I am writing to formally express my strong interest in applying for an open position with your organization.`);
    lines.push(``);
    lines.push(`Regarding this application: ${cleanIns}. I possess relevant experience and technical skills that align closely with the key requirements of this role.`);
    lines.push(``);
    lines.push(`I have attached my updated resume for your detailed review. My background demonstrates a solid track record of technical competence, team collaboration, and consistent project delivery.`);
    lines.push(``);
    lines.push(`I would welcome the opportunity to connect for an interview to discuss how my experience can contribute value to your team.`);
    lines.push(``);
    lines.push(`Thank you for your time, consideration, and review of my application.`);
  } else if (sitName.includes('Follow-up')) {
    lines.push(`I hope this email finds you well. I am following up on our previous communication regarding pending action items.`);
    lines.push(``);
    lines.push(`In reference to our current status: ${cleanIns}. I wanted to check in to see if any updates or decisions have been finalized.`);
    lines.push(``);
    lines.push(`Please let me know if you need any additional information or documentation from my end to move this forward.`);
    lines.push(``);
    lines.push(`Thank you for your time, and I look forward to hearing from you soon.`);
  } else if (sitName.includes('Celebration')) {
    lines.push(`I am delighted to reach out and send my warmest personal congratulations and heartfelt wishes on this special occasion.`);
    lines.push(``);
    lines.push(`${cleanIns}. Your dedication, achievements, and positive impact are truly appreciated by everyone.`);
    lines.push(``);
    lines.push(`Wishing you continued success, happiness, and great moments of celebration ahead.`);
    lines.push(``);
    lines.push(`Best wishes for the future!`);
  } else if (sitName.includes('Casual')) {
    lines.push(`Hope you are having a fantastic week!`);
    lines.push(``);
    lines.push(`I am reaching out regarding: ${cleanIns}. Just wanted to check in and see when you might be free.`);
    lines.push(``);
    lines.push(`Let me know your availability whenever you get a chance.`);
    lines.push(``);
    lines.push(`Talk soon!`);
  } else if (sitName.includes('Important')) {
    lines.push(`I am writing to bring an important time-sensitive request to your immediate attention.`);
    lines.push(``);
    lines.push(`Specifically: ${cleanIns}. Due to upcoming operational timelines, your review and approval on this matter are required as soon as possible.`);
    lines.push(``);
    lines.push(`Please review the details and let me know if any further clarification or action is required from my side.`);
    lines.push(``);
    lines.push(`Thank you for your prompt attention and assistance.`);
  } else {
    lines.push(`I am writing to provide an official status update regarding our active work deliverables and project timeline.`);
    lines.push(``);
    lines.push(`Regarding our current progress: ${cleanIns}. Our team has conducted a comprehensive review of current operational requirements to ensure high quality standards.`);
    lines.push(``);
    lines.push(`We are executing all necessary measures to manage deliverables effectively and keep key stakeholders informed of all milestone achievements.`);
    lines.push(``);
    lines.push(`Please let me know if you require any additional documentation or further clarification regarding this update.`);
    lines.push(``);
    lines.push(`Thank you for your continued partnership and collaboration.`);
  }

  lines.push(``);
  lines.push(closing);

  if (userSignature && userSignature.enabled && userSignature.name) {
    lines.push(userSignature.name);
    if (userSignature.designation) lines.push(userSignature.designation);
    if (userSignature.company) lines.push(userSignature.company);
    if (userSignature.phone) lines.push(`Phone: ${userSignature.phone}`);
    if (userSignature.website) lines.push(userSignature.website);
  }

  return {
    greeting,
    closing,
    body: lines.join('\n')
  };
}
