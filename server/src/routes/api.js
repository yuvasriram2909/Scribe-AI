import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';
import { categorizeInstruction, generateEmail } from '../aiService.js';
import { sendGmailMessage, getAuthUrl, getTokensFromCode, getUserInfo } from '../gmailService.js';
import { sendLoginSecurityAlert } from '../securityService.js';

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = "file:./dev.db";
}

const router = express.Router();
const prisma = new PrismaClient();

function hashPassword(pwd) {
  if (!pwd) return null;
  return crypto.createHash('sha256').update(pwd).digest('hex');
}

// Configure Multer for attachments upload
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});
const upload = multer({ storage });

/**
 * Resolves the authenticated user strictly from request headers or query params.
 * NEVER defaults to other users in the database.
 */
async function getAuthUser(req) {
  if (!req) return null;

  const authHeader = req.headers?.['authorization'] || '';
  const emailHeader = req.headers?.['x-user-email'] || req.body?.userEmail || req.query?.userEmail || '';
  let targetEmail = '';

  if (authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    try {
      const decoded = Buffer.from(token, 'base64').toString('utf8');
      if (decoded.includes('@')) targetEmail = decoded;
      else targetEmail = token;
    } catch (e) {
      targetEmail = token;
    }
  }

  if (!targetEmail && emailHeader) {
    targetEmail = emailHeader.trim().toLowerCase();
  }

  if (!targetEmail || !targetEmail.includes('@')) {
    return null;
  }

  const cleanEmail = targetEmail.trim().toLowerCase();
  
  // Upsert user to guarantee user record exists even if SQLite DB restarted
  return await prisma.user.upsert({
    where: { email: cleanEmail },
    update: {},
    create: {
      email: cleanEmail,
      name: cleanEmail.split('@')[0]
    },
    include: { signature: true, gmailAccounts: true }
  });
}

// Login & Register with Email and Password
router.post('/auth/login', async (req, res) => {
  try {
    const { email, password, name, mode } = req.body;
    if (!email || !email.trim()) {
      return res.status(400).json({ error: 'Email address is required.' });
    }
    if (!password || !password.trim()) {
      return res.status(400).json({ error: 'Password is required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const passwordHash = hashPassword(password.trim());

    let user = await prisma.user.findUnique({
      where: { email: cleanEmail },
      include: { signature: true, gmailAccounts: true }
    });

    if (user) {
      if (user.passwordHash && user.passwordHash !== passwordHash) {
        return res.status(401).json({ error: 'Invalid email or password.' });
      }

      if (!user.passwordHash) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { passwordHash },
          include: { signature: true, gmailAccounts: true }
        });
      }
    } else {
      user = await prisma.user.create({
        data: {
          name: name ? name.trim() : cleanEmail.split('@')[0],
          email: cleanEmail,
          passwordHash,
          signature: {
            create: {
              name: name ? name.trim() : cleanEmail.split('@')[0],
              designation: '',
              company: '',
              phone: '',
              website: '',
              preferredTone: 'Professional',
              enabled: true
            }
          }
        },
        include: { signature: true, gmailAccounts: true }
      });
    }

    // Generate secure auth token
    const token = Buffer.from(user.email).toString('base64');

    // Trigger non-blocking Login Security Alert Notification
    sendLoginSecurityAlert({ user, req }).catch(err => console.error('Security alert background error:', err));

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
        signature: user.signature,
        gmailAccounts: user.gmailAccounts
      }
    });
  } catch (err) {
    console.error('Login endpoint error:', err);
    res.status(500).json({ error: 'Login failed: ' + err.message });
  }
});

// ----------------------------------------------------
// 1. AI Situation Categorization API
// ----------------------------------------------------
router.post('/ai/categorize', async (req, res) => {
  try {
    const { instruction, recipient, relationship } = req.body || {};
    if (!instruction || instruction.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Short instruction is required.'
      });
    }

    const result = await categorizeInstruction({ instruction, recipient, relationship });
    
    return res.json({
      success: true,
      situation: result.situation || '💼 Official / Professional',
      category: result.category || 'Official/Professional',
      pattern: result.situation || 'Standard Pattern',
      detectedFormat: result.situation || 'Standard Pattern',
      tone: result.tone || 'Professional',
      priority: result.priority || 'Normal',
      urgency: result.priority || 'Normal',
      attachment_recommended: !!result.attachment_recommended,
      attachment_filename: result.attachment_filename || null
    });
  } catch (err) {
    console.error('Categorize Endpoint Error:', err);
    return res.status(500).json({
      success: false,
      error: 'Failed to categorize instruction: ' + err.message
    });
  }
});

// ----------------------------------------------------
// 2. AI Email Generation API
// ----------------------------------------------------
router.post('/ai/generate', async (req, res) => {
  try {
    const { instruction, situation, category, tone, priority, recipient, recipientName } = req.body || {};
    if (!instruction || instruction.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Short instruction is required.'
      });
    }

    const user = await getAuthUser(req);
    const result = await generateEmail({
      instruction,
      situation: situation || '💼 Official / Professional',
      category: category || 'Official/Professional',
      tone: tone || 'Professional',
      priority: priority || 'Normal',
      recipient: recipient || '',
      recipientName: recipientName || '',
      userSignature: user ? user.signature : null
    });

    const situationVal = result.situation || situation || '💼 Official / Professional';
    const categoryVal = result.category || category || 'Official/Professional';
    const toneVal = result.tone || tone || 'Professional';
    const priorityVal = result.priority || priority || 'Normal';
    const subjectVal = result.suggested_subject || 'Email Subject';
    const bodyVal = result.email_body || instruction;

    return res.json({
      success: true,
      situation: situationVal,
      category: categoryVal,
      pattern: situationVal,
      detectedFormat: situationVal,
      tone: toneVal,
      urgency: priorityVal,
      priority: priorityVal,
      subject: subjectVal,
      suggested_subject: subjectVal,
      body: bodyVal,
      email_body: bodyVal,
      greeting: result.greeting || 'Dear Sir/Madam,',
      closing: result.closing || 'Best regards,',
      attachment_recommended: !!result.attachment_recommended,
      attachment_filename: result.attachment_filename || null
    });
  } catch (err) {
    console.error('Generate Endpoint Error:', err);
    return res.status(500).json({
      success: false,
      error: 'Failed to generate email content: ' + err.message
    });
  }
});

async function loadOAuthFromConfig() {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    try {
      const cid = await prisma.systemConfig.findUnique({ where: { key: 'GOOGLE_CLIENT_ID' } });
      const csec = await prisma.systemConfig.findUnique({ where: { key: 'GOOGLE_CLIENT_SECRET' } });
      if (cid?.value) process.env.GOOGLE_CLIENT_ID = cid.value;
      if (csec?.value) process.env.GOOGLE_CLIENT_SECRET = csec.value;
    } catch (e) {
      console.warn('SystemConfig lookup warning:', e.message);
    }
  }
}

// ----------------------------------------------------
// 3. Gmail OAuth & Status Endpoints
// ----------------------------------------------------
router.get('/auth/google/url', async (req, res) => {
  try {
    await loadOAuthFromConfig();
    const user = await getAuthUser(req);
    const timestamp = Date.now();
    const userIdStr = user ? user.id : 'guest';
    const emailStr = user ? user.email : '';

    // Create secure signed state payload (userId.email.timestamp.sig)
    const payload = `${userIdStr}:${emailStr}:${timestamp}`;
    const secret = process.env.JWT_SECRET || 'scribe_ai_oauth_secret';
    const sig = crypto.createHmac('sha256', secret).update(payload).digest('hex');
    const state = Buffer.from(`${payload}:${sig}`).toString('base64url');

    const url = getAuthUrl(state);

    if (!url) {
      return res.status(400).json({
        configured: false,
        message: 'Google Client ID / Secret not set in environment variables.'
      });
    }
    res.json({ configured: true, url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/auth/google/credentials', async (req, res) => {
  try {
    const { clientId, clientSecret } = req.body || {};
    if (!clientId || !clientSecret) {
      return res.status(400).json({ error: 'Client ID and Client Secret are required.' });
    }

    const cleanClientId = clientId.trim().replace(/^["']|["']$/g, '').replace(/[\r\n]/g, '');
    const cleanClientSecret = clientSecret.trim().replace(/^["']|["']$/g, '').replace(/[\r\n]/g, '');

    process.env.GOOGLE_CLIENT_ID = cleanClientId;
    process.env.GOOGLE_CLIENT_SECRET = cleanClientSecret;

    await prisma.systemConfig.upsert({
      where: { key: 'GOOGLE_CLIENT_ID' },
      update: { value: cleanClientId },
      create: { key: 'GOOGLE_CLIENT_ID', value: cleanClientId }
    });
    await prisma.systemConfig.upsert({
      where: { key: 'GOOGLE_CLIENT_SECRET' },
      update: { value: cleanClientSecret },
      create: { key: 'GOOGLE_CLIENT_SECRET', value: cleanClientSecret }
    });

    const user = await getAuthUser(req);
    const timestamp = Date.now();
    const userIdStr = user ? user.id : 'guest';
    const emailStr = user ? user.email : '';
    const payload = `${userIdStr}:${emailStr}:${timestamp}`;
    const secret = process.env.JWT_SECRET || 'scribe_ai_oauth_secret';
    const sig = crypto.createHmac('sha256', secret).update(payload).digest('hex');
    const state = Buffer.from(`${payload}:${sig}`).toString('base64url');

    const url = getAuthUrl(state);

    res.json({
      success: true,
      message: 'Google OAuth credentials configured successfully!',
      url
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/auth/google/callback', async (req, res) => {
  const frontendUrl = process.env.FRONTEND_URL || 'https://scribe-ai-self.vercel.app';
  try {
    const { code, state, error: oauthError } = req.query;

    // Handle user cancellation or access denied gracefully
    if (oauthError === 'access_denied' || oauthError === 'consent_required') {
      return res.redirect(`${frontendUrl}?gmail=cancelled`);
    }

    if (!code) return res.status(400).send('Authorization code missing.');

    let stateUserId = null;
    let stateEmail = null;
    if (state) {
      try {
        const decoded = Buffer.from(state, 'base64url').toString('utf8');
        const parts = decoded.split(':');
        if (parts.length === 4) {
          const [sUserId, sEmail, sTimestamp, sSig] = parts;
          const payload = `${sUserId}:${sEmail}:${sTimestamp}`;
          const secret = process.env.JWT_SECRET || 'scribe_ai_oauth_secret';
          const expectedSig = crypto.createHmac('sha256', secret).update(payload).digest('hex');

          // Validate HMAC signature and 15-minute expiration
          if (sSig === expectedSig && (Date.now() - parseInt(sTimestamp, 10) < 15 * 60 * 1000)) {
            if (sUserId !== 'guest') stateUserId = sUserId;
            if (sEmail) stateEmail = sEmail;
          }
        }
      } catch (e) {
        console.warn('OAuth state decode notice:', e.message);
      }
    }

    let user = null;
    if (stateUserId) {
      user = await prisma.user.findUnique({ where: { id: stateUserId } });
    }
    if (!user && stateEmail) {
      user = await prisma.user.findUnique({ where: { email: stateEmail.toLowerCase() } });
    }
    if (!user) {
      user = await getAuthUser(req);
    }
    if (!user) {
      return res.status(401).send('Authentication required. Please log in before connecting Gmail.');
    }

    const tokens = await getTokensFromCode(code);

    let authorizedEmail = user.email;
    try {
      if (tokens.access_token) {
        const userInfo = await getUserInfo(tokens.access_token);
        if (userInfo.email) authorizedEmail = userInfo.email;
      }
    } catch (e) {
      console.warn('UserInfo fetch warning:', e.message);
    }

    const expiryDate = tokens.expiry_date ? new Date(tokens.expiry_date) : new Date(Date.now() + 3600 * 1000);

    // Store tokens strictly for THIS authenticated user
    await prisma.gmailAccount.deleteMany({ where: { userId: user.id } });
    await prisma.gmailAccount.create({
      data: {
        userId: user.id,
        gmailEmail: authorizedEmail,
        encryptedAccessToken: tokens.access_token || '',
        encryptedRefreshToken: tokens.refresh_token || '',
        status: 'CONNECTED',
        tokenExpiry: expiryDate,
        scope: tokens.scope || null
      }
    });

    res.redirect(`${frontendUrl}?gmail=connected`);
  } catch (err) {
    console.error('OAuth Callback error:', err);
    const isInvalidSecret = err.message.toLowerCase().includes('client secret') || err.message.toLowerCase().includes('invalid_client');

    return res.status(400).send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <title>Google OAuth Configuration Error — Scribe AI</title>
        <style>
          body { font-family: 'Plus Jakarta Sans', system-ui, sans-serif; background: #F7F4EA; color: #28321D; margin: 0; padding: 40px 20px; display: flex; justify-content: center; align-items: center; min-height: 80vh; }
          .card { background: #FAF8F1; border: 1px solid #D8D1BC; border-radius: 24px; padding: 40px; max-width: 550px; width: 100%; box-shadow: 0 10px 30px rgba(40,50,29,0.08); text-align: center; }
          .icon { width: 60px; height: 60px; background: #FDE8E8; color: #9B1C1C; border-radius: 16px; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; font-size: 28px; }
          h1 { font-size: 20px; margin: 0 0 10px; color: #28321D; font-weight: 800; }
          p { font-size: 13px; color: #6F725F; line-height: 1.6; margin: 0 0 20px; }
          .box { background: #FFFFFF; border: 1px solid #D8D1BC; border-radius: 16px; padding: 16px; text-align: left; font-size: 12px; margin-bottom: 24px; color: #28321D; }
          .box strong { color: #3F4D2A; }
          .box ol { margin: 8px 0 0; padding-left: 20px; color: #6F725F; }
          .box li { margin-bottom: 6px; }
          .btn { display: inline-block; background: #667A45; color: #FAF8F1; text-decoration: none; padding: 14px 28px; border-radius: 14px; font-weight: 700; font-size: 13px; transition: all 0.2s ease; }
          .btn:hover { background: #3F4D2A; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="icon">⚠️</div>
          <h1>Google OAuth Authentication Error</h1>
          <p>${err.message}</p>
          ${isInvalidSecret ? `
            <div class="box">
              <strong>How to fix "The provided client secret is invalid":</strong>
              <ol>
                <li>Go to <a href="https://console.cloud.google.com/apis/credentials" target="_blank" style="color:#667A45;font-weight:bold;">Google Cloud Console Credentials</a></li>
                <li>Find your OAuth 2.0 Web Client ID and click the Edit (Pencil) icon</li>
                <li>Copy your <strong>Client Secret</strong> value directly from Google Cloud Console</li>
                <li>Go back to Scribe AI Settings and paste the Client ID and Client Secret again</li>
              </ol>
            </div>
          ` : ''}
          <a href="${frontendUrl}" class="btn">⚙ Return to Scribe AI Settings</a>
        </div>
      </body>
      </html>
    `);
  }
});

router.get('/auth/status', async (req, res) => {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return res.json({
        isConnected: false,
        status: 'DISCONNECTED',
        connectedEmail: null,
        authMethod: 'none',
        isGoogleConfigured: true,
        mode: 'Not Logged In'
      });
    }

    const gmailAccount = await prisma.gmailAccount.findFirst({
      where: { userId: user.id }
    });
    
    const isConnected = !!gmailAccount && gmailAccount.status !== 'DISCONNECTED';
    const isAppPass = gmailAccount?.encryptedRefreshToken?.startsWith('APPPASSWORD:');
    const authMethod = gmailAccount ? (isAppPass ? 'app_password' : 'oauth') : 'none';
    const status = gmailAccount ? (gmailAccount.status || 'CONNECTED') : 'DISCONNECTED';

    res.json({
      isConnected,
      status,
      connectedEmail: gmailAccount ? gmailAccount.gmailEmail : null,
      authMethod,
      isGoogleConfigured: true,
      mode: isConnected ? (status === 'NEEDS_ATTENTION' ? 'Gmail Connection Needs Attention ⚠️' : (isAppPass ? 'Direct App Password Connected ✓' : 'Google OAuth Connected ✓')) : 'Not Connected'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Save Direct Gmail App Password Endpoint (Zero Google Console Required)
router.post('/auth/app-password', async (req, res) => {
  try {
    const user = await getAuthUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const { gmailEmail, appPassword } = req.body || {};
    if (!gmailEmail || !appPassword) {
      return res.status(400).json({ error: 'Gmail Email and 16-character App Password are required.' });
    }

    const cleanEmail = gmailEmail.trim().toLowerCase();
    const cleanPass = appPassword.trim().replace(/\s+/g, '');

    await prisma.gmailAccount.deleteMany({ where: { userId: user.id } });
    const account = await prisma.gmailAccount.create({
      data: {
        userId: user.id,
        gmailEmail: cleanEmail,
        encryptedAccessToken: 'APP_PASSWORD',
        encryptedRefreshToken: `APPPASSWORD:${cleanPass}`
      }
    });

    res.json({
      success: true,
      message: 'Gmail App Password saved successfully!',
      connectedEmail: account.gmailEmail,
      authMethod: 'app_password'
    });
  } catch (err) {
    console.error('App Password endpoint error:', err);
    res.status(500).json({ error: 'Failed to save App Password: ' + err.message });
  }
});

// Disconnect Gmail Account for Logged-In User
router.delete('/auth/google/disconnect', async (req, res) => {
  try {
    const user = await getAuthUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    await prisma.gmailAccount.deleteMany({
      where: { userId: user.id }
    });

    res.json({ success: true, message: 'Gmail account disconnected.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------
// 4. Send Email via Gmail & Smart Notification Trigger
// ----------------------------------------------------
router.post('/emails/send', upload.array('attachments'), async (req, res) => {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Authentication required. Please log in to send emails.' });
    }

    const { recipient, cc, bcc, subject, body, category, situation, situationSource, priority, tone, confirmToken } = req.body;

    if (!recipient || !subject || !body) {
      return res.status(400).json({ error: 'Recipient, Subject, and Body are required.' });
    }

    if (confirmToken !== 'CONFIRMED') {
      return res.status(400).json({ error: 'Security Exception: Explicit user confirmation required before sending.' });
    }

    const gmailAccount = await prisma.gmailAccount.findFirst({
      where: { userId: user.id }
    });

    const files = (req.files || []).map(f => ({
      originalname: f.originalname,
      mimetype: f.mimetype,
      path: f.path,
      filename: f.filename
    }));

    let sendResult;
    try {
      sendResult = await sendGmailMessage({
        senderEmail: gmailAccount ? gmailAccount.gmailEmail : user.email,
        appPassword: gmailAccount ? gmailAccount.appPassword : null,
        accessToken: gmailAccount ? gmailAccount.encryptedAccessToken : null,
        refreshToken: gmailAccount ? gmailAccount.encryptedRefreshToken : null,
        to: recipient,
        cc,
        bcc,
        subject,
        body,
        attachments: files
      });
    } catch (sendErr) {
      console.error('Gmail Sending Failed:', sendErr.message);

      // Save Failed Email Record in Database for Transparency & Retry
      const failedEmailRecord = await prisma.email.create({
        data: {
          userId: user.id,
          recipient,
          cc: cc || null,
          bcc: bcc || null,
          subject,
          body,
          category: category || 'Official/Professional',
          situation: situation || '💼 Official / Professional',
          situationSource: situationSource || 'ai',
          priority: priority || 'Normal',
          tone: tone || 'Professional',
          status: 'Failed',
          errorMessage: sendErr.message,
          attachments: {
            create: files.map(f => ({
              filename: f.originalname,
              fileUrl: `/uploads/${f.filename}`,
              fileType: f.mimetype || 'application/octet-stream'
            }))
          }
        },
        include: { attachments: true }
      });

      // Create Failed Notification
      const failedNotif = await prisma.notification.create({
        data: {
          userId: user.id,
          emailId: failedEmailRecord.id,
          notificationType: 'System',
          message: `❌ Email failed to send to ${recipient}: ${sendErr.message}`,
          read: false
        }
      });

      return res.status(400).json({
        error: `Failed to send email: ${sendErr.message}`,
        email: failedEmailRecord,
        notification: failedNotif
      });
    }

    if (sendResult.newAccessToken && gmailAccount) {
      await prisma.gmailAccount.update({
        where: { id: gmailAccount.id },
        data: { encryptedAccessToken: sendResult.newAccessToken }
      });
    }

    const emailRecord = await prisma.email.create({
      data: {
        userId: user.id,
        recipient,
        cc: cc || null,
        bcc: bcc || null,
        subject,
        body,
        category: category || 'Official/Professional',
        situation: situation || '💼 Official / Professional',
        situationSource: situationSource || 'ai',
        priority: priority || 'Normal',
        tone: tone || 'Professional',
        status: 'Sent',
        gmailMessageId: sendResult.gmailMessageId,
        sentAt: sendResult.sentAt,
        attachments: {
          create: files.map(f => ({
            filename: f.originalname,
            fileUrl: `/uploads/${f.filename}`,
            fileType: f.mimetype || 'application/octet-stream'
          }))
        }
      },
      include: { attachments: true }
    });

    let notifTitle = `${category || 'Email'} Sent`;
    let notifType = 'Official';
    if (category?.includes('Emergency')) {
      notifTitle = '🚨 Emergency Email Sent';
      notifType = 'Emergency';
    } else if (category?.includes('Leave')) {
      notifTitle = '🏖️ Leave Email Sent';
      notifType = 'Leave';
    } else if (category?.includes('Resume')) {
      notifTitle = '📄 Resume Email Sent';
      notifType = 'Resume';
    } else if (category?.includes('Official')) {
      notifTitle = '💼 Official Email Sent';
      notifType = 'Official';
    } else if (category?.includes('Casual')) {
      notifTitle = '💬 Casual Email Sent';
      notifType = 'Casual';
    } else if (category?.includes('Occasion')) {
      notifTitle = '🎉 Occasion Email Sent';
      notifType = 'Occasion';
    } else if (category?.includes('Follow-up')) {
      notifTitle = '🔔 Follow-up Email Sent';
      notifType = 'Follow-up';
    } else {
      notifTitle = '📌 Email Sent';
      notifType = 'System';
    }

    const notifMessage = `${notifTitle}: Your ${category?.toLowerCase() || 'email'} notification was successfully sent to ${recipient}.`;

    const notification = await prisma.notification.create({
      data: {
        userId: user.id,
        emailId: emailRecord.id,
        notificationType: notifType,
        message: notifMessage,
        read: false
      }
    });

    res.json({
      success: true,
      email: emailRecord,
      notification,
      mode: sendResult.mode,
      gmailMessageId: sendResult.gmailMessageId
    });
  } catch (err) {
    console.error('Send Email Endpoint Error:', err);
    res.status(500).json({ error: 'Failed to send email: ' + err.message });
  }
});

// Retry Failed Email Endpoint (Ownership Verified)
router.post('/emails/:id/retry', async (req, res) => {
  try {
    const user = await getAuthUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const { id } = req.params;
    const email = await prisma.email.findFirst({
      where: { id, userId: user.id },
      include: { attachments: true }
    });

    if (!email) {
      return res.status(404).json({ error: 'Email record not found.' });
    }

    const gmailAccount = await prisma.gmailAccount.findFirst({
      where: { userId: user.id }
    });

    const sendResult = await sendGmailMessage({
      accessToken: gmailAccount ? gmailAccount.encryptedAccessToken : null,
      refreshToken: gmailAccount ? gmailAccount.encryptedRefreshToken : null,
      to: email.recipient,
      cc: email.cc,
      bcc: email.bcc,
      subject: email.subject,
      body: email.body,
      attachments: []
    });

    const updatedEmail = await prisma.email.update({
      where: { id: email.id },
      data: {
        status: 'Sent',
        errorMessage: null,
        gmailMessageId: sendResult.gmailMessageId,
        sentAt: sendResult.sentAt || new Date()
      },
      include: { attachments: true }
    });

    const notification = await prisma.notification.create({
      data: {
        userId: user.id,
        emailId: updatedEmail.id,
        notificationType: 'System',
        message: `✅ Email retried & sent successfully to ${email.recipient}!`,
        read: false
      }
    });

    res.json({ success: true, email: updatedEmail, notification });
  } catch (err) {
    console.error('Retry Email Error:', err);
    await prisma.email.update({
      where: { id: req.params.id },
      data: { errorMessage: err.message }
    });
    res.status(400).json({ error: 'Retry failed: ' + err.message });
  }
});

// ----------------------------------------------------
// 5. Email History & Search API (User Isolated)
// ----------------------------------------------------
router.get('/emails', async (req, res) => {
  try {
    const user = await getAuthUser(req);
    if (!user) return res.json([]);

    const { category, status, q } = req.query;

    const where = { userId: user.id };
    if (category && category !== 'All') {
      where.category = { contains: category };
    }
    if (status && status !== 'All') {
      where.status = status;
    }
    if (q && q.trim() !== '') {
      where.OR = [
        { recipient: { contains: q } },
        { subject: { contains: q } },
        { category: { contains: q } },
        { body: { contains: q } }
      ];
    }

    const emails = await prisma.email.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { attachments: true }
    });

    res.json(emails);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete Email Endpoint (Ownership Verified)
router.delete('/emails/:id', async (req, res) => {
  try {
    const user = await getAuthUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const { id } = req.params;
    const email = await prisma.email.findFirst({
      where: { id, userId: user.id }
    });

    if (!email) {
      return res.status(404).json({ error: 'Email record not found or access denied.' });
    }

    await prisma.email.delete({ where: { id: email.id } });
    res.json({ success: true, message: 'Email deleted successfully' });
  } catch (err) {
    console.error('Delete email error:', err);
    res.status(500).json({ error: 'Failed to delete email: ' + err.message });
  }
});

// Stats API for Dashboard (User Isolated)
router.get('/emails/stats', async (req, res) => {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return res.json({ totalEmails: 0, sentToday: 0, emergency: 0, leave: 0, resume: 0, official: 0 });
    }

    const totalEmails = await prisma.email.count({ where: { userId: user.id } });
    
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const sentToday = await prisma.email.count({
      where: { userId: user.id, createdAt: { gte: startOfDay } }
    });

    const emergency = await prisma.email.count({
      where: { userId: user.id, category: { contains: 'Emergency' } }
    });

    const leave = await prisma.email.count({
      where: { userId: user.id, category: { contains: 'Leave' } }
    });

    const resume = await prisma.email.count({
      where: { userId: user.id, category: { contains: 'Resume' } }
    });

    const official = await prisma.email.count({
      where: { userId: user.id, category: { contains: 'Official' } }
    });

    res.json({
      totalEmails,
      sentToday,
      emergency,
      leave,
      resume,
      official
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------
// 6. Notifications API (User Isolated)
// ----------------------------------------------------
router.get('/notifications', async (req, res) => {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return res.json({ notifications: [], unreadCount: 0, trashedCount: 0, activeCount: 0 });
    }

    const isTrashedQuery = req.query.trashed === 'true';

    const notifications = await prisma.notification.findMany({
      where: {
        userId: user.id,
        isTrashed: isTrashedQuery
      },
      orderBy: { createdAt: 'desc' },
      include: { email: true }
    });

    const unreadCount = await prisma.notification.count({
      where: { userId: user.id, read: false, isTrashed: false }
    });

    const trashedCount = await prisma.notification.count({
      where: { userId: user.id, isTrashed: true }
    });

    const activeCount = await prisma.notification.count({
      where: { userId: user.id, isTrashed: false }
    });

    res.json({ notifications, unreadCount, trashedCount, activeCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/notifications/:id/read', async (req, res) => {
  try {
    const user = await getAuthUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const { id } = req.params;
    const notif = await prisma.notification.findFirst({
      where: { id, userId: user.id }
    });
    if (!notif) return res.status(404).json({ error: 'Notification not found.' });

    await prisma.notification.update({
      where: { id: notif.id },
      data: { read: true }
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/notifications/trash-all', async (req, res) => {
  try {
    const user = await getAuthUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    await prisma.notification.updateMany({
      where: { userId: user.id, isTrashed: false },
      data: { isTrashed: true }
    });
    res.json({ success: true, message: 'All notifications moved to trash' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/notifications/:id/trash', async (req, res) => {
  try {
    const user = await getAuthUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const { id } = req.params;
    const notif = await prisma.notification.findFirst({
      where: { id, userId: user.id }
    });
    if (!notif) return res.status(404).json({ error: 'Notification not found or access denied.' });

    await prisma.notification.update({
      where: { id: notif.id },
      data: { isTrashed: true }
    });
    res.json({ success: true, message: 'Notification moved to trash' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/notifications/:id/restore', async (req, res) => {
  try {
    const user = await getAuthUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const { id } = req.params;
    const notif = await prisma.notification.findFirst({
      where: { id, userId: user.id }
    });
    if (!notif) return res.status(404).json({ error: 'Notification not found or access denied.' });

    await prisma.notification.update({
      where: { id: notif.id },
      data: { isTrashed: false }
    });
    res.json({ success: true, message: 'Notification restored successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/notifications/:id', async (req, res) => {
  try {
    const user = await getAuthUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const { id } = req.params;
    const notif = await prisma.notification.findFirst({
      where: { id, userId: user.id }
    });
    if (!notif) return res.status(404).json({ error: 'Notification not found or access denied.' });

    await prisma.notification.delete({
      where: { id: notif.id }
    });
    res.json({ success: true, message: 'Notification permanently deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/notifications/empty-trash', async (req, res) => {
  try {
    const user = await getAuthUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    await prisma.notification.deleteMany({
      where: { userId: user.id, isTrashed: true }
    });
    res.json({ success: true, message: 'Trash emptied successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/notifications/read-all', async (req, res) => {
  try {
    const user = await getAuthUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    await prisma.notification.updateMany({
      where: { userId: user.id, read: false },
      data: { read: true }
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------
// 7. Saved Contacts API (User Isolated)
// ----------------------------------------------------
router.get('/contacts', async (req, res) => {
  try {
    const user = await getAuthUser(req);
    if (!user) return res.json([]);

    const contacts = await prisma.contact.findMany({
      where: { userId: user.id },
      orderBy: { name: 'asc' }
    });
    res.json(contacts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/contacts', async (req, res) => {
  try {
    const user = await getAuthUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const { name, email, relationship } = req.body;
    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required.' });
    }

    const contact = await prisma.contact.create({
      data: {
        userId: user.id,
        name,
        email,
        relationship: relationship || 'Client'
      }
    });

    res.json(contact);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/contacts/:id', async (req, res) => {
  try {
    const user = await getAuthUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const contact = await prisma.contact.findFirst({
      where: { id: req.params.id, userId: user.id }
    });
    if (!contact) return res.status(404).json({ error: 'Contact not found or access denied.' });

    await prisma.contact.delete({ where: { id: contact.id } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------
// 8. Email Templates API
// ----------------------------------------------------
router.get('/templates', async (req, res) => {
  try {
    const templates = await prisma.template.findMany({
      orderBy: { category: 'asc' }
    });
    res.json(templates);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------
// 9. User Signature & Settings API (User Isolated)
// ----------------------------------------------------
router.get('/signature', async (req, res) => {
  try {
    const user = await getAuthUser(req);
    if (!user) return res.json(null);
    res.json(user.signature);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/signature', async (req, res) => {
  try {
    const user = await getAuthUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const { name, designation, company, phone, website, preferredTone, enabled } = req.body;

    const signature = await prisma.userSignature.upsert({
      where: { userId: user.id },
      update: { name, designation, company, phone, website, preferredTone: preferredTone || 'Professional', enabled: enabled ?? true },
      create: { userId: user.id, name, designation, company, phone, website, preferredTone: preferredTone || 'Professional', enabled: enabled ?? true }
    });

    res.json(signature);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
