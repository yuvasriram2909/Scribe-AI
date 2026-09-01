import { prisma } from './db.js';

async function seed() {
  console.log('Seeding initial database content...');

  // 1. Create or update Default User
  const user = await prisma.user.upsert({
    where: { email: 'alex.morgan@example.com' },
    update: {},
    create: {
      name: 'Alex Morgan',
      email: 'alex.morgan@example.com'
    }
  });

  // 2. Create User Signature
  await prisma.userSignature.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      name: 'Alex Morgan',
      designation: 'Senior Software Engineer',
      company: 'TechCorp Innovations',
      phone: '+1 (555) 234-5678',
      website: 'https://techcorp.example.com',
      enabled: true
    }
  });

  // 3. Create Default Contacts
  const contactsData = [
    { name: 'John Client', email: 'client@example.com', relationship: 'Client' },
    { name: 'Sarah Manager', email: 'manager@example.com', relationship: 'Manager' },
    { name: 'HR Recruiting Team', email: 'hr@company.com', relationship: 'HR' },
    { name: 'David Miller', email: 'friend@example.com', relationship: 'Friend' },
    { name: 'Elena Rostova', email: 'elena.partner@acme.com', relationship: 'Client' },
    { name: 'Marcus Vance', email: 'marcus.lead@techcorp.com', relationship: 'Colleague' }
  ];

  for (const c of contactsData) {
    const existing = await prisma.contact.findFirst({
      where: { userId: user.id, email: c.email }
    });
    if (!existing) {
      await prisma.contact.create({
        data: {
          userId: user.id,
          name: c.name,
          email: c.email,
          relationship: c.relationship
        }
      });
    }
  }

  // 4. Create Predefined Email Templates
  const templatesData = [
    // Leave
    { category: 'Leave/Holiday', title: 'One-Hour Leave', instruction: 'I need emergency leave for 1 hour today.', sampleText: 'Request for 1 hour emergency short leave due to personal matters.' },
    { category: 'Leave/Holiday', title: 'One-Day Casual Leave', instruction: 'I will be on leave tomorrow for personal work.', sampleText: 'Casual leave request for 1 day.' },
    { category: 'Leave/Holiday', title: 'Multiple-Day Vacation Leave', instruction: 'I am taking vacation leave for 3 days starting next Monday.', sampleText: 'Planned vacation leave for 3 consecutive days.' },
    { category: 'Leave/Holiday', title: 'Sick Leave', instruction: 'I am unwell today and cannot attend work.', sampleText: 'Sick leave notification due to unexpected illness.' },
    
    // Resume
    { category: 'Resume/Job Application', title: 'Software Developer Application', instruction: 'Send my resume for a Software Developer position with resume attached.', sampleText: 'Application for Software Developer position with resume attached.' },
    { category: 'Resume/Job Application', title: 'Python Developer Internship', instruction: 'Send my resume to HR for a Python developer internship.', sampleText: 'Formal application for Python Developer Internship role.' },
    { category: 'Resume/Job Application', title: 'Application Follow-up', instruction: 'Follow up on my job application submitted last week.', sampleText: 'Polite inquiry regarding status of job application.' },

    // Official
    { category: 'Official/Professional', title: 'Project Delay Update', instruction: 'Tell my client that the project will be delayed by two days.', sampleText: 'Professional update regarding 2-day project schedule revision.' },
    { category: 'Official/Professional', title: 'Client Meeting Request', instruction: 'Request a meeting with the client for project review.', sampleText: 'Formal invitation to review project status in a meeting.' },
    { category: 'Official/Professional', title: 'Deadline Extension Request', instruction: 'Request a 3-day extension on the current milestone deadline.', sampleText: 'Request to extend project deadline by 3 business days.' },
    { category: 'Official/Professional', title: 'Payment Reminder', instruction: 'Send a gentle reminder to the client about invoice payment.', sampleText: 'Gentle reminder regarding pending invoice payment.' },

    // Occasion
    { category: 'Occasion', title: 'Thank-You Message', instruction: 'Send a thank-you message to the client for their feedback.', sampleText: 'Warm thank-you message for client feedback and partnership.' },
    { category: 'Occasion', title: 'Festival Wishes', instruction: 'Send holiday and festival greetings to the client team.', sampleText: 'Warm festival greetings and holiday wishes.' },
    { category: 'Occasion', title: 'Congratulations', instruction: 'Congratulate the team on the successful project launch.', sampleText: 'Heartfelt congratulations on reaching project milestone.' },

    // Emergency
    { category: 'Emergency', title: 'Urgent Work Absence', instruction: 'I have an urgent family emergency and cannot join calls today.', sampleText: 'Urgent notice regarding unexpected emergency absence.' },

    // Follow-up
    { category: 'Follow-up', title: 'Interview Follow-up', instruction: 'Follow up after my interview yesterday.', sampleText: 'Follow-up message expressing appreciation for the interview.' }
  ];

  await prisma.template.deleteMany({ where: { isDefault: true } });
  for (const t of templatesData) {
    await prisma.template.create({
      data: {
        category: t.category,
        title: t.title,
        instruction: t.instruction,
        sampleText: t.sampleText,
        isDefault: true
      }
    });
  }

  // 5. Seed some sample historical emails & notifications so history looks awesome right away!
  const countEmails = await prisma.email.count({ where: { userId: user.id } });
  if (countEmails === 0) {
    const email1 = await prisma.email.create({
      data: {
        userId: user.id,
        recipient: 'client@example.com',
        subject: 'Leave Notification – 3 Days',
        body: 'Dear Client,\n\nI would like to inform you that I will be on leave for three days and may have limited availability during this period.\n\nI will resume work after my leave and will respond to any pending matters as soon as possible.\n\nThank you for your understanding.\n\nBest regards,\nAlex Morgan',
        category: 'Leave/Holiday',
        priority: 'Normal',
        tone: 'Professional',
        status: 'Sent',
        gmailMessageId: 'msg_sample_01',
        sentAt: new Date(Date.now() - 3600000 * 2)
      }
    });

    await prisma.notification.create({
      data: {
        userId: user.id,
        emailId: email1.id,
        notificationType: 'Leave',
        message: '🏖️ Leave Email Sent: Your leave notification was successfully sent to client@example.com.',
        read: false
      }
    });

    const email2 = await prisma.email.create({
      data: {
        userId: user.id,
        recipient: 'hr@company.com',
        subject: 'Application for Software Developer Position – Resume Attached',
        body: 'Dear Hiring Manager,\n\nI am writing to express my interest in the Software Developer position. Please find my resume attached for your consideration.\n\nI would appreciate the opportunity to discuss my qualifications and how I could contribute to your organization.\n\nThank you for your time and consideration.\n\nBest regards,\nAlex Morgan',
        category: 'Resume/Job Application',
        priority: 'Normal',
        tone: 'Formal',
        status: 'Sent',
        gmailMessageId: 'msg_sample_02',
        sentAt: new Date(Date.now() - 3600000 * 24)
      }
    });

    await prisma.notification.create({
      data: {
        userId: user.id,
        emailId: email2.id,
        notificationType: 'Resume',
        message: '📄 Resume Email Sent: Your resume/application email was successfully sent to hr@company.com.',
        read: true
      }
    });

    const email3 = await prisma.email.create({
      data: {
        userId: user.id,
        recipient: 'manager@example.com',
        subject: 'Urgent: Emergency Leave Request – 1 Hour',
        body: 'Dear Sarah,\n\nI am writing to request an urgent 1-hour emergency leave today due to an unexpected personal situation.\n\nI will return as soon as possible and handle remaining priorities.\n\nThank you for your understanding.\n\nSincerely,\nAlex Morgan',
        category: 'Emergency',
        priority: 'High',
        tone: 'Urgent + Professional',
        status: 'Sent',
        gmailMessageId: 'msg_sample_03',
        sentAt: new Date(Date.now() - 3600000 * 48)
      }
    });

    await prisma.notification.create({
      data: {
        userId: user.id,
        emailId: email3.id,
        notificationType: 'Emergency',
        message: '🚨 Emergency Email Sent: Your emergency email was successfully sent to manager@example.com.',
        read: true
      }
    });
  }

  console.log('Database seeding complete successfully!');
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
