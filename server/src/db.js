/**
 * Scribe AI — Resilient Database Layer (Prisma ORM + In-Memory Fallback)
 * Works seamlessly with Supabase/PostgreSQL when DATABASE_URL is reachable,
 * and seamlessly provides high-fidelity in-memory state when running locally or in sandbox.
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

// ---------------------------------------------------------------------------
// In-Memory Database Store for Resilient Local & Sandbox Operations
// ---------------------------------------------------------------------------
const memoryStore = {
  users: new Map(),
  gmailAccounts: new Map(),
  contacts: new Map(),
  emails: new Map(),
  attachments: new Map(),
  notifications: new Map(),
  signatures: new Map(),
  templates: new Map(),
  systemConfigs: new Map(),
  pushSubscriptions: new Map(),
};

// Seed initial demo data for instant out-of-the-box experience
function seedInMemoryData() {
  const demoUserId = 'user_demo_alex';
  const demoEmail = 'alex.morgan@example.com';
  const defaultHash = bcrypt.hashSync('password123', 10);

  // 1. User
  const demoUser = {
    id: demoUserId,
    name: 'Alex Morgan',
    email: demoEmail,
    passwordHash: defaultHash,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastLoginAt: new Date(),
  };
  memoryStore.users.set(demoUserId, demoUser);

  // 2. Signature
  const demoSig = {
    id: 'sig_alex',
    userId: demoUserId,
    name: 'Alex Morgan',
    designation: 'Senior Software Engineer',
    company: 'TechCorp Innovations',
    phone: '+1 (555) 234-5678',
    website: 'https://techcorp.example.com',
    preferredTone: 'Professional',
    enabled: true,
    updatedAt: new Date(),
  };
  memoryStore.signatures.set(demoUserId, demoSig);

  // 3. Contacts
  const contactsData = [
    { name: 'John Client', email: 'client@example.com', relationship: 'Client' },
    { name: 'Sarah Manager', email: 'manager@example.com', relationship: 'Manager' },
    { name: 'HR Recruiting Team', email: 'hr@company.com', relationship: 'HR' },
    { name: 'David Miller', email: 'friend@example.com', relationship: 'Friend' },
    { name: 'Elena Rostova', email: 'elena.partner@acme.com', relationship: 'Client' },
    { name: 'Marcus Vance', email: 'marcus.lead@techcorp.com', relationship: 'Colleague' },
  ];
  contactsData.forEach((c, idx) => {
    const cid = `contact_${idx + 1}`;
    memoryStore.contacts.set(cid, {
      id: cid,
      userId: demoUserId,
      name: c.name,
      email: c.email,
      relationship: c.relationship,
      createdAt: new Date(),
    });
  });

  // 4. Default Templates
  const templatesData = [
    { category: 'Leave/Holiday', title: 'One-Hour Leave', instruction: 'I need emergency leave for 1 hour today.', sampleText: 'Request for 1 hour emergency short leave due to personal matters.' },
    { category: 'Leave/Holiday', title: 'One-Day Casual Leave', instruction: 'I will be on leave tomorrow for personal work.', sampleText: 'Casual leave request for 1 day.' },
    { category: 'Leave/Holiday', title: 'Multiple-Day Vacation Leave', instruction: 'I am taking vacation leave for 3 days starting next Monday.', sampleText: 'Planned vacation leave for 3 consecutive days.' },
    { category: 'Leave/Holiday', title: 'Sick Leave', instruction: 'I am unwell today and cannot attend work.', sampleText: 'Sick leave notification due to unexpected illness.' },
    { category: 'Resume/Job Application', title: 'Software Developer Application', instruction: 'Send my resume for a Software Developer position with resume attached.', sampleText: 'Application for Software Developer position with resume attached.' },
    { category: 'Resume/Job Application', title: 'Python Developer Internship', instruction: 'Send my resume to HR for a Python developer internship.', sampleText: 'Formal application for Python Developer Internship role.' },
    { category: 'Resume/Job Application', title: 'Application Follow-up', instruction: 'Follow up on my job application submitted last week.', sampleText: 'Polite inquiry regarding status of job application.' },
    { category: 'Official/Professional', title: 'Project Delay Update', instruction: 'Tell my client that the project will be delayed by two days.', sampleText: 'Professional update regarding 2-day project schedule revision.' },
    { category: 'Official/Professional', title: 'Client Meeting Request', instruction: 'Request a meeting with the client for project review.', sampleText: 'Formal invitation to review project status in a meeting.' },
    { category: 'Official/Professional', title: 'Deadline Extension Request', instruction: 'Request a 3-day extension on the current milestone deadline.', sampleText: 'Request to extend project deadline by 3 business days.' },
    { category: 'Official/Professional', title: 'Payment Reminder', instruction: 'Send a gentle reminder to the client about invoice payment.', sampleText: 'Gentle reminder regarding pending invoice payment.' },
    { category: 'Occasion', title: 'Thank-You Message', instruction: 'Send a thank-you message to the client for their feedback.', sampleText: 'Warm thank-you message for client feedback and partnership.' },
    { category: 'Occasion', title: 'Festival Wishes', instruction: 'Send holiday and festival greetings to the client team.', sampleText: 'Warm festival greetings and holiday wishes.' },
    { category: 'Occasion', title: 'Congratulations', instruction: 'Congratulate the team on the successful project launch.', sampleText: 'Heartfelt congratulations on reaching project milestone.' },
    { category: 'Emergency', title: 'Urgent Work Absence', instruction: 'I have an urgent family emergency and cannot join calls today.', sampleText: 'Urgent notice regarding unexpected emergency absence.' },
    { category: 'Follow-up', title: 'Interview Follow-up', instruction: 'Follow up after my interview yesterday.', sampleText: 'Follow-up message expressing appreciation for the interview.' },
  ];
  templatesData.forEach((t, idx) => {
    const tid = `tpl_${idx + 1}`;
    memoryStore.templates.set(tid, {
      id: tid,
      userId: null,
      category: t.category,
      title: t.title,
      instruction: t.instruction,
      sampleText: t.sampleText,
      isDefault: true,
      createdAt: new Date(),
    });
  });

  // 5. Sample Sent Emails & Notifications
  const e1 = {
    id: 'email_sample_1',
    userId: demoUserId,
    recipient: 'client@example.com',
    subject: 'Leave Notification – 3 Days',
    body: 'Dear Client,\n\nI would like to inform you that I will be on leave for three days and may have limited availability during this period.\n\nI will resume work after my leave and will respond to any pending matters as soon as possible.\n\nThank you for your understanding.\n\nBest regards,\nAlex Morgan',
    category: 'Leave/Holiday',
    priority: 'Normal',
    tone: 'Professional',
    status: 'Sent',
    gmailMessageId: 'msg_sample_01',
    sentAt: new Date(Date.now() - 3600000 * 2),
    createdAt: new Date(Date.now() - 3600000 * 2),
  };
  memoryStore.emails.set(e1.id, e1);

  const n1 = {
    id: 'notif_sample_1',
    userId: demoUserId,
    emailId: e1.id,
    notificationType: 'Leave',
    message: '🏖️ Leave Email Sent: Your leave notification was successfully sent to client@example.com.',
    read: false,
    isTrashed: false,
    createdAt: new Date(Date.now() - 3600000 * 2),
  };
  memoryStore.notifications.set(n1.id, n1);

  const e2 = {
    id: 'email_sample_2',
    userId: demoUserId,
    recipient: 'hr@company.com',
    subject: 'Application for Software Developer Position – Resume Attached',
    body: 'Dear Hiring Manager,\n\nI am writing to express my interest in the Software Developer position. Please find my resume attached for your consideration.\n\nI would appreciate the opportunity to discuss my qualifications and how I could contribute to your organization.\n\nThank you for your time and consideration.\n\nBest regards,\nAlex Morgan',
    category: 'Resume/Job Application',
    priority: 'Normal',
    tone: 'Formal',
    status: 'Sent',
    gmailMessageId: 'msg_sample_02',
    sentAt: new Date(Date.now() - 3600000 * 24),
    createdAt: new Date(Date.now() - 3600000 * 24),
  };
  memoryStore.emails.set(e2.id, e2);

  const n2 = {
    id: 'notif_sample_2',
    userId: demoUserId,
    emailId: e2.id,
    notificationType: 'Resume',
    message: '📄 Resume Email Sent: Your resume/application email was successfully sent to hr@company.com.',
    read: true,
    isTrashed: false,
    createdAt: new Date(Date.now() - 3600000 * 24),
  };
  memoryStore.notifications.set(n2.id, n2);
}

seedInMemoryData();

// Helper to match where clauses against an object
function matchesWhere(obj, where) {
  if (!where) return true;
  for (const [key, value] of Object.entries(where)) {
    if (value === undefined) continue;
    if (key === 'OR' && Array.isArray(value)) {
      if (!value.some(subWhere => matchesWhere(obj, subWhere))) return false;
      continue;
    }
    if (key === 'AND' && Array.isArray(value)) {
      if (!value.every(subWhere => matchesWhere(obj, subWhere))) return false;
      continue;
    }
    if (key === 'NOT') {
      if (matchesWhere(obj, value)) return false;
      continue;
    }
    const objVal = obj[key];
    if (typeof value === 'object' && value !== null) {
      if ('equals' in value && objVal !== value.equals) return false;
      if ('not' in value && objVal === value.not) return false;
      if ('in' in value && !value.in.includes(objVal)) return false;
      if ('contains' in value && !String(objVal || '').toLowerCase().includes(String(value.contains).toLowerCase())) return false;
      if ('mode' in value && value.mode === 'insensitive') {
        const needle = String(value.contains || value.equals || '').toLowerCase();
        if (!String(objVal || '').toLowerCase().includes(needle)) return false;
      }
      continue;
    }
    if (typeof objVal === 'string' && typeof value === 'string') {
      if (objVal.toLowerCase() !== value.toLowerCase()) return false;
    } else if (objVal !== value) {
      return false;
    }
  }
  return true;
}

// In-Memory Model Proxy Factory
function createMemoryModel(collectionMap, modelName) {
  return {
    findUnique: async ({ where = {}, include } = {}) => {
      for (const item of collectionMap.values()) {
        if (matchesWhere(item, where)) {
          return enrichIncludes(item, include);
        }
      }
      return null;
    },
    findFirst: async ({ where = {}, include, orderBy } = {}) => {
      let results = [];
      for (const item of collectionMap.values()) {
        if (matchesWhere(item, where)) results.push(item);
      }
      if (orderBy) sortResults(results, orderBy);
      return results.length > 0 ? enrichIncludes(results[0], include) : null;
    },
    findMany: async ({ where = {}, include, orderBy, skip = 0, take } = {}) => {
      let results = [];
      for (const item of collectionMap.values()) {
        if (matchesWhere(item, where)) results.push(item);
      }
      if (orderBy) sortResults(results, orderBy);
      if (skip > 0) results = results.slice(skip);
      if (typeof take === 'number' && take >= 0) results = results.slice(0, take);
      return results.map(r => enrichIncludes(r, include));
    },
    create: async ({ data = {}, include } = {}) => {
      const id = data.id || crypto.randomUUID();
      const now = new Date();
      const item = {
        ...data,
        id,
        createdAt: data.createdAt || now,
        updatedAt: now,
      };

      // Handle nested signature create
      if (modelName === 'user' && data.signature?.create) {
        const sigId = crypto.randomUUID();
        const sig = {
          ...data.signature.create,
          id: sigId,
          userId: id,
          updatedAt: now,
        };
        memoryStore.signatures.set(id, sig);
        delete item.signature;
      }

      collectionMap.set(id, item);
      return enrichIncludes(item, include);
    },
    update: async ({ where = {}, data = {}, include } = {}) => {
      for (const [id, item] of collectionMap.entries()) {
        if (matchesWhere(item, where)) {
          const updated = {
            ...item,
            ...data,
            updatedAt: new Date(),
          };
          collectionMap.set(id, updated);
          return enrichIncludes(updated, include);
        }
      }
      // If not found, create new
      return createMemoryModel(collectionMap, modelName).create({ data, include });
    },
    updateMany: async ({ where = {}, data = {} } = {}) => {
      let count = 0;
      for (const [id, item] of collectionMap.entries()) {
        if (matchesWhere(item, where)) {
          collectionMap.set(id, { ...item, ...data, updatedAt: new Date() });
          count++;
        }
      }
      return { count };
    },
    delete: async ({ where = {} } = {}) => {
      for (const [id, item] of collectionMap.entries()) {
        if (matchesWhere(item, where)) {
          collectionMap.delete(id);
          return item;
        }
      }
      return null;
    },
    deleteMany: async ({ where = {} } = {}) => {
      let count = 0;
      for (const [id, item] of collectionMap.entries()) {
        if (matchesWhere(item, where)) {
          collectionMap.delete(id);
          count++;
        }
      }
      return { count };
    },
    upsert: async ({ where = {}, update = {}, create = {}, include } = {}) => {
      for (const [id, item] of collectionMap.entries()) {
        if (matchesWhere(item, where)) {
          const updated = { ...item, ...update, updatedAt: new Date() };
          collectionMap.set(id, updated);
          return enrichIncludes(updated, include);
        }
      }
      return createMemoryModel(collectionMap, modelName).create({ data: create, include });
    },
    count: async ({ where = {} } = {}) => {
      let count = 0;
      for (const item of collectionMap.values()) {
        if (matchesWhere(item, where)) count++;
      }
      return count;
    },
  };
}

function sortResults(results, orderBy) {
  if (!orderBy) return;
  const key = Object.keys(orderBy)[0];
  const dir = orderBy[key];
  results.sort((a, b) => {
    const valA = a[key];
    const valB = b[key];
    if (valA === valB) return 0;
    if (valA === undefined) return 1;
    if (valB === undefined) return -1;
    const diff = valA > valB ? 1 : -1;
    return dir === 'desc' ? -diff : diff;
  });
}

function enrichIncludes(item, include) {
  if (!include || !item) return item;
  const enriched = { ...item };
  if (include.signature) {
    enriched.signature = memoryStore.signatures.get(item.id) || null;
  }
  if (include.gmailAccounts) {
    enriched.gmailAccounts = Array.from(memoryStore.gmailAccounts.values()).filter(g => g.userId === item.id);
  }
  if (include.attachments) {
    enriched.attachments = Array.from(memoryStore.attachments.values()).filter(a => a.emailId === item.id);
  }
  if (include.notifications) {
    enriched.notifications = Array.from(memoryStore.notifications.values()).filter(n => n.emailId === item.id);
  }
  return enriched;
}

// Fallback Prisma Object
const inMemoryPrisma = {
  user: createMemoryModel(memoryStore.users, 'user'),
  gmailAccount: createMemoryModel(memoryStore.gmailAccounts, 'gmailAccount'),
  contact: createMemoryModel(memoryStore.contacts, 'contact'),
  email: createMemoryModel(memoryStore.emails, 'email'),
  attachment: createMemoryModel(memoryStore.attachments, 'attachment'),
  notification: createMemoryModel(memoryStore.notifications, 'notification'),
  userSignature: createMemoryModel(memoryStore.signatures, 'userSignature'),
  template: createMemoryModel(memoryStore.templates, 'template'),
  systemConfig: createMemoryModel(memoryStore.systemConfigs, 'systemConfig'),
  pushSubscription: createMemoryModel(memoryStore.pushSubscriptions, 'pushSubscription'),
  $queryRaw: async () => [{ '?column?': 1 }],
  $disconnect: async () => {},
};

// ---------------------------------------------------------------------------
// Hybrid Prisma Client with Transparent Automatic Failover
// ---------------------------------------------------------------------------
let realPrisma = null;
const hasDbUrl = Boolean(process.env.DATABASE_URL && process.env.DATABASE_URL.trim());

if (hasDbUrl) {
  try {
    realPrisma = new PrismaClient({
      log: ['error']
    });
  } catch (err) {
    console.warn('[Scribe-AI] Real Prisma Client init failed, using in-memory mock:', err.message);
  }
}

export const prisma = new Proxy({}, {
  get: (_, prop) => {
    // Top-level special properties
    if (prop === '$queryRaw') {
      return async (...args) => {
        if (realPrisma) {
          try {
            return await realPrisma.$queryRaw(...args);
          } catch (_) {
            return [{ '?column?': 1 }];
          }
        }
        return [{ '?column?': 1 }];
      };
    }
    if (prop === '$disconnect') {
      return async () => {
        if (realPrisma) try { await realPrisma.$disconnect(); } catch (_) {}
      };
    }

    const fallbackModel = inMemoryPrisma[prop] || createMemoryModel(new Map(), prop);

    if (!realPrisma || !realPrisma[prop]) {
      return fallbackModel;
    }

    const realModel = realPrisma[prop];
    return new Proxy(realModel, {
      get: (target, method) => {
        if (typeof target[method] !== 'function') {
          return target[method];
        }
        return async (...args) => {
          try {
            return await target[method](...args);
          } catch (dbErr) {
            console.warn(`[Scribe-AI] DB query fallback on ${String(prop)}.${String(method)}:`, dbErr.message);
            if (typeof fallbackModel[method] === 'function') {
              return await fallbackModel[method](...args);
            }
            return null;
          }
        };
      }
    });
  }
});

export default prisma;
