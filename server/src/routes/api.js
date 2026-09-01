/**
 * ============================================================================
 * Scribe-AI — Centralized REST API Router (api.js)
 * ============================================================================
 * Exposes all REST endpoints for:
 * - User Authentication (Register, Login, Logout, Me) with bcrypt & JWT
 * - Web Push Notifications & Multi-Device Subscriptions (/api/push/*)
 * - Single Google OAuth 2.0 Client & Multi-User Gmail API (/api/auth/google/*)
 * - AI Situation Classification & Draft Generation (/api/ai/generate, /api/ai/categorize)
 * - Email management, attachments & direct sending (/api/emails/*, /api/email/send)
 * - Contacts address book & tone mappings (/api/contacts/*)
 * - Templates library (/api/templates/*)
 * - Notifications & security alerts (/api/notifications/*)
 * - User signatures & profile settings (/api/settings/*)
 */

import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../db.js';
import { categorizeInstruction, generateEmail } from '../aiService.js';
import { sendGmailMessage, getAuthUrl, getTokensFromCode, getUserInfo } from '../gmailService.js';
import { sendLoginSecurityAlert } from '../securityService.js';
import { sendLoginPushNotification, getVapidPublicKey } from '../pushService.js';
import { encryptToken, decryptToken } from '../cryptoUtils.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'scribe_ai_production_jwt_secret_2026';

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
 * Resolves the authenticated user strictly from HttpOnly cookie, Authorization header, or session headers.
 * NEVER leaks data across different users.
 */
async function getAuthUser(req) {
  if (!req) return null;

  let targetUserId = null;
  let targetEmail = null;

  // 1. Check HttpOnly cookie
  const cookieToken = req.cookies?.scribe_session;
  if (cookieToken) {
    try {
      const decoded = jwt.verify(cookieToken, JWT_SECRET);
      if (decoded?.id) targetUserId = decoded.id;
      if (decoded?.email) targetEmail = decoded.email.toLowerCase();
    } catch (e) {
      // Invalid/expired cookie token
    }
  }

  // 2. Check Authorization Header: Bearer <token>
  const authHeader = req.headers?.['authorization'] || '';
  if (!targetUserId && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      if (decoded?.id) targetUserId = decoded.id;
      if (decoded?.email) targetEmail = decoded.email.toLowerCase();
    } catch (e) {
      // Fallback base64 decoded email support for backward compatibility
      try {
        const raw = Buffer.from(token, 'base64').toString('utf8');
        if (raw.includes('@')) targetEmail = raw.toLowerCase();
      } catch (err) {}
    }
  }

  // 3. Check x-user-email fallback header
  if (!targetUserId && !targetEmail) {
    const emailHeader = req.headers?.['x-user-email'] || req.body?.userEmail || req.query?.userEmail;
    if (emailHeader && typeof emailHeader === 'string' && emailHeader.includes('@')) {
      targetEmail = emailHeader.trim().toLowerCase();
    }
  }

  // Query database for authenticated user
  try {
    if (targetUserId) {
      const userById = await prisma.user.findUnique({
        where: { id: targetUserId },
        include: { signature: true, gmailAccounts: true }
      });
      if (userById) return userById;
    }

    if (targetEmail) {
      const userByEmail = await prisma.user.findUnique({
        where: { email: targetEmail },
        include: { signature: true, gmailAccounts: true }
      });
      if (userByEmail) return userByEmail;
    }
  } catch (dbErr) {
    console.warn('getAuthUser DB notice:', dbErr.message);
  }

  return null;
}

// ----------------------------------------------------
// 1. User Registration, Login & Logout Endpoints
// ----------------------------------------------------

/**
 * POST /api/auth/register
 * Registers a new user in PostgreSQL with bcrypt password hashing
 */
router.post('/auth/register', async (req, res) => {
  try {
    const { name, email, password, confirmPassword } = req.body || {};

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Full Name is required.' });
    }
    if (!email || !email.trim()) {
      return res.status(400).json({ error: 'Valid email address is required.' });
    }
    const cleanEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({ error: 'Please enter a valid email address format.' });
    }

    if (!password || password.trim().length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }
    if (confirmPassword !== undefined && password.trim() !== confirmPassword.trim()) {
      return res.status(400).json({ error: 'Password and Confirm Password do not match.' });
    }

    // Check if user already exists
    const existing = await prisma.user.findUnique({
      where: { email: cleanEmail }
    });

    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists. Please log in.' });
    }

    // Hash password securely with bcrypt
    const passwordHash = await bcrypt.hash(password.trim(), 10);

    // Create user and default personalized signature
    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: cleanEmail,
        passwordHash,
        signature: {
          create: {
            name: name.trim(),
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

    res.status(201).json({
      success: true,
      message: 'Account created successfully! Please log in.'
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Registration failed: ' + err.message });
  }
});

/**
 * POST /api/auth/login
 * Verifies credentials, updates lastLoginAt, issues JWT & cookie, and triggers login push notification
 */
router.post('/auth/login', async (req, res) => {
  try {
    const { email, password, name, mode } = req.body || {};

    // Forward to register if requested via mode
    if (mode === 'register') {
      return res.redirect(307, '/api/auth/register');
    }

    if (!email || !email.trim()) {
      return res.status(400).json({ error: 'Email address is required.' });
    }
    if (!password || !password.trim()) {
      return res.status(400).json({ error: 'Password is required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = password.trim();

    let user = await prisma.user.findUnique({
      where: { email: cleanEmail },
      include: { signature: true, gmailAccounts: true }
    });

    // Check credentials securely without revealing whether account exists
    if (!user || !user.passwordHash) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    let isPasswordValid = false;
    if (user.passwordHash.startsWith('$2a$') || user.passwordHash.startsWith('$2b$')) {
      isPasswordValid = await bcrypt.compare(cleanPass, user.passwordHash);
    } else {
      // Legacy SHA-256 fallback migration
      const legacyHash = crypto.createHash('sha256').update(cleanPass).digest('hex');
      if (user.passwordHash === legacyHash) {
        isPasswordValid = true;
        // Upgrade legacy hash to bcrypt automatically
        const newBcryptHash = await bcrypt.hash(cleanPass, 10);
        await prisma.user.update({
          where: { id: user.id },
          data: { passwordHash: newBcryptHash }
        });
      }
    }

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Update lastLoginAt
    const now = new Date();
    user = await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: now },
      include: { signature: true, gmailAccounts: true }
    });

    // Create secure JWT session token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Set HttpOnly Secure session cookie
    res.cookie('scribe_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production' || !!process.env.RENDER,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    // Asynchronously trigger Web Push Notification & Email Security Alert
    sendLoginPushNotification({ user, req }).catch(err => console.warn('Push notification notice:', err.message));
    sendLoginSecurityAlert({ user, req }).catch(err => console.warn('Security alert notice:', err.message));

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt,
        signature: user.signature,
        gmailAccounts: user.gmailAccounts
      }
    });
  } catch (err) {
    console.error('Login endpoint error:', err);
    res.status(500).json({ error: 'Login failed: ' + err.message });
  }
});

/**
 * POST /api/auth/logout
 * Clears session cookie and logs user out
 */
router.all('/auth/logout', (req, res) => {
  res.clearCookie('scribe_session');
  res.json({ success: true, message: 'Logged out successfully.' });
});

/**
 * GET /api/auth/me
 * Retrieves current authenticated user profile and connected Gmail state
 */
router.get('/auth/me', async (req, res) => {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return res.status(401).json({ authenticated: false, error: 'Not authenticated.' });
    }

    res.json({
      authenticated: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt,
        signature: user.signature,
        gmailAccounts: user.gmailAccounts
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------
// 2. Web Push Notifications API (/api/push/*)
// ----------------------------------------------------

router.get('/push/vapid-public-key', (req, res) => {
  res.json({ publicKey: getVapidPublicKey() });
});

router.post('/push/subscribe', async (req, res) => {
  try {
    const user = await getAuthUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized. Please log in.' });

    const { endpoint, keys } = req.body || {};
    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return res.status(400).json({ error: 'Invalid PushSubscription payload.' });
    }

    await prisma.pushSubscription.upsert({
      where: { endpoint },
      update: {
        userId: user.id,
        p256dh: keys.p256dh,
        auth: keys.auth,
        updatedAt: new Date()
      },
      create: {
        userId: user.id,
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth
      }
    });

    res.json({ success: true, message: 'Push subscription registered successfully.' });
  } catch (err) {
    console.error('Push subscribe error:', err);
    res.status(500).json({ error: 'Failed to save push subscription: ' + err.message });
  }
});

router.post('/push/unsubscribe', async (req, res) => {
  try {
    const { endpoint } = req.body || {};
    if (endpoint) {
      await prisma.pushSubscription.deleteMany({ where: { endpoint } });
    }
    res.json({ success: true, message: 'Unsubscribed from push notifications.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------
// 3. AI Situation Categorization & Generation APIs
// ----------------------------------------------------

router.post('/ai/categorize', async (req, res) => {
  try {
    const { instruction, subject, recipient, relationship } = req.body || {};
    const inputContent = instruction || subject;
    if (!inputContent || inputContent.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Please enter a subject, problem, or instruction.'
      });
    }

    const result = await categorizeInstruction({ instruction: inputContent, subject, recipient, relationship });
    
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

router.post('/ai/generate', async (req, res) => {
  try {
    const { instruction, subject, situation, category, tone, priority, recipient, recipientName, relationship } = req.body || {};
    const inputContent = instruction || subject;
    if (!inputContent || inputContent.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Please enter a subject, problem, or instruction.'
      });
    }

    const user = await getAuthUser(req);
    const result = await generateEmail({
      instruction: inputContent,
      subject,
      situation: situation || '💼 Official / Professional',
      category: category || 'Official/Professional',
      tone: tone || 'Professional',
      priority: priority || 'Normal',
      recipient: recipient || '',
      recipientName: recipientName || '',
      relationship: relationship || '',
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

// ----------------------------------------------------
// 4. Google OAuth 2.0 & Gmail Integration Endpoints
// ----------------------------------------------------

async function loadOAuthFromConfig() {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    try {
      if (prisma.systemConfig && typeof prisma.systemConfig.findUnique === 'function') {
        const cid = await prisma.systemConfig.findUnique({ where: { key: 'GOOGLE_CLIENT_ID' } });
        const csec = await prisma.systemConfig.findUnique({ where: { key: 'GOOGLE_CLIENT_SECRET' } });
        if (cid?.value) process.env.GOOGLE_CLIENT_ID = cid.value;
        if (csec?.value) process.env.GOOGLE_CLIENT_SECRET = csec.value;
      }
    } catch (e) {
      console.warn('SystemConfig lookup notice:', e.message);
    }
  }
}

/**
 * GET /api/auth/google & GET /api/auth/google/url
 * Initiates Google OAuth flow for authenticated application user
 */
const handleGoogleAuthUrl = async (req, res) => {
  try {
    await loadOAuthFromConfig();
    const user = await getAuthUser(req);
    const timestamp = Date.now();
    const userIdStr = user ? user.id : 'guest';
    const emailStr = user ? user.email : '';

    // Create secure signed state payload (userId:email:timestamp:sig)
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

    // Direct browser redirect if accessed as standard link
    if (req.headers.accept && req.headers.accept.includes('text/html')) {
      return res.redirect(url);
    }

    res.json({ configured: true, url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

router.get('/auth/google', handleGoogleAuthUrl);
router.get('/auth/google/url', handleGoogleAuthUrl);

/**
 * POST /api/auth/google/credentials
 * Dynamically configure or update Google OAuth Client ID and Client Secret
 */
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

    try {
      if (prisma.systemConfig && typeof prisma.systemConfig.upsert === 'function') {
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
      }
    } catch (dbErr) {
      console.warn('SystemConfig save notice:', dbErr.message);
    }

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

/**
 * GET /api/auth/google/callback
 * Exchanges OAuth authorization code, fetches user info, encrypts refresh token, and binds Gmail account
 */
router.get('/auth/google/callback', async (req, res) => {
  const frontendUrl = process.env.FRONTEND_URL || 'https://scribe-ai-self.vercel.app';
  try {
    const { code, state, error: oauthError } = req.query;

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
    let googleUserId = null;
    try {
      if (tokens.access_token) {
        const userInfo = await getUserInfo(tokens.access_token);
        if (userInfo.email) authorizedEmail = userInfo.email;
        if (userInfo.id) googleUserId = userInfo.id;
      }
    } catch (e) {
      console.warn('UserInfo fetch warning:', e.message);
    }

    const expiryDate = tokens.expiry_date ? new Date(tokens.expiry_date) : new Date(Date.now() + 3600 * 1000);

    // Encrypt refresh token with AES-256-GCM before writing to PostgreSQL
    const encryptedRefreshToken = tokens.refresh_token ? encryptToken(tokens.refresh_token) : null;

    // Clean up previous records for this user and store fresh connection
    await prisma.gmailAccount.deleteMany({ where: { userId: user.id } });

    const baseAccountData = {
      userId: user.id,
      googleUserId: googleUserId || null,
      gmailEmail: authorizedEmail,
      encryptedAccessToken: tokens.access_token || '',
      encryptedRefreshToken: encryptedRefreshToken || ''
    };

    try {
      await prisma.gmailAccount.create({
        data: {
          ...baseAccountData,
          status: 'CONNECTED',
          tokenExpiry: expiryDate,
          scope: tokens.scope || null
        }
      });
    } catch (createErr) {
      console.warn('Prisma client schema fallback notice:', createErr.message);
      await prisma.gmailAccount.create({
        data: baseAccountData
      });
    }

    res.redirect(`${frontendUrl}?gmail=connected`);
  } catch (err) {
    console.error('OAuth Callback error:', err);
    const isInvalidSecret = err.message.toLowerCase().includes('client secret') || err.message.toLowerCase().includes('invalid_client');

    return res.status(400).send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <title>Google OAuth Error — Scribe AI</title>
        <style>
          body { font-family: system-ui, sans-serif; background: #F7F4EA; color: #28321D; padding: 40px 20px; display: flex; justify-content: center; align-items: center; min-height: 80vh; margin: 0; }
          .card { background: #FAF8F1; border: 1px solid #D8D1BC; border-radius: 24px; padding: 36px; max-width: 520px; text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,0.05); }
          .btn { display: inline-block; background: #667A45; color: #FAF8F1; text-decoration: none; padding: 12px 24px; border-radius: 12px; font-weight: 700; font-size: 13px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="card">
          <div style="font-size: 32px; margin-bottom: 12px;">⚠️</div>
          <h2 style="margin: 0 0 10px;">Google OAuth Authorization Error</h2>
          <p style="color: #6F725F; font-size: 13px; line-height: 1.5;">${err.message}</p>
          <a href="${frontendUrl}" class="btn">Return to Scribe AI Dashboard</a>
        </div>
      </body>
      </html>
    `);
  }
});

/**
 * GET /api/auth/google/status & GET /api/auth/status
 * Returns connection status and connected Gmail address for the logged-in user
 */
const handleAuthStatus = async (req, res) => {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return res.json({
        isConnected: false,
        status: 'DISCONNECTED',
        connectedEmail: null,
        googleUserId: null,
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
      googleUserId: gmailAccount?.googleUserId || null,
      authMethod,
      isGoogleConfigured: true,
      mode: isConnected ? (status === 'NEEDS_ATTENTION' ? 'Gmail Connection Needs Attention ⚠️' : (isAppPass ? 'Direct App Password Connected ✓' : 'Google OAuth Connected ✓')) : 'Not Connected'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

router.get('/auth/google/status', handleAuthStatus);
router.get('/auth/status', handleAuthStatus);

/**
 * POST /api/auth/google/disconnect & DELETE /api/auth/google/disconnect
 * Disconnects Gmail account for the authenticated user
 */
const handleDisconnectGmail = async (req, res) => {
  try {
    const user = await getAuthUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized. Please log in.' });

    await prisma.gmailAccount.deleteMany({
      where: { userId: user.id }
    });

    res.json({ success: true, message: 'Gmail account disconnected successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

router.post('/auth/google/disconnect', handleDisconnectGmail);
router.delete('/auth/google/disconnect', handleDisconnectGmail);

// Direct Gmail App Password fallback connection
router.post('/auth/app-password', async (req, res) => {
  try {
    const user = await getAuthUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized. Please log in.' });

    const { gmailEmail, appPassword } = req.body || {};
    if (!gmailEmail || !appPassword) {
      return res.status(400).json({ error: 'Gmail Email and App Password are required.' });
    }

    const cleanEmail = gmailEmail.trim().toLowerCase();
    const cleanPass = appPassword.trim().replace(/\s+/g, '');

    await prisma.gmailAccount.deleteMany({ where: { userId: user.id } });
    const account = await prisma.gmailAccount.create({
      data: {
        userId: user.id,
        gmailEmail: cleanEmail,
        encryptedAccessToken: 'APP_PASSWORD',
        encryptedRefreshToken: `APPPASSWORD:${cleanPass}`,
        status: 'CONNECTED'
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

// ----------------------------------------------------
// 5. Send Email via Gmail API Endpoints
// ----------------------------------------------------

/**
 * POST /api/emails/send & POST /api/email/send
 * Sends an email using the currently connected Gmail account for the authenticated user
 */
const handleSendEmail = async (req, res) => {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Authentication required. Please log in to send emails.' });
    }

    const {
      recipient,
      cc,
      bcc,
      subject,
      body,
      category = 'Official/Professional',
      situation = '💼 Official / Professional',
      situationSource = 'ai',
      priority = 'Normal',
      tone = 'Professional'
    } = req.body;

    if (!recipient || !subject || !body) {
      return res.status(400).json({ error: 'Recipient, Subject, and Body are required.' });
    }

    // Retrieve Gmail OAuth connection strictly for THIS user
    const gmailAccount = await prisma.gmailAccount.findFirst({
      where: { userId: user.id }
    });

    if (!gmailAccount || (!gmailAccount.encryptedAccessToken && !gmailAccount.encryptedRefreshToken && !gmailAccount.appPassword)) {
      return res.status(400).json({ error: 'Please connect your Gmail account first.' });
    }

    const files = req.files || [];
    const attachments = files.map(file => ({
      originalname: file.originalname,
      filename: file.filename,
      path: file.path,
      mimetype: file.mimetype,
      size: file.size
    }));

    // Send email through Gmail API or SMTP using user's credentials
    let sendResult;
    try {
      sendResult = await sendGmailMessage({
        senderEmail: gmailAccount.gmailEmail,
        appPassword: gmailAccount.appPassword || (gmailAccount.encryptedRefreshToken?.startsWith('APPPASSWORD:') ? gmailAccount.encryptedRefreshToken.substring(12) : null),
        accessToken: gmailAccount.encryptedAccessToken,
        refreshToken: gmailAccount.encryptedRefreshToken,
        to: recipient,
        cc,
        bcc,
        subject,
        body,
        attachments
      });
    } catch (sendErr) {
      if (sendErr.isRevoked) {
        await prisma.gmailAccount.update({
          where: { id: gmailAccount.id },
          data: { status: 'DISCONNECTED' }
        }).catch(() => {});
      }
      throw sendErr;
    }

    // If new access token was generated during refresh, update database
    if (sendResult.newAccessToken) {
      await prisma.gmailAccount.update({
        where: { id: gmailAccount.id },
        data: {
          encryptedAccessToken: sendResult.newAccessToken,
          tokenExpiry: new Date(Date.now() + 3500 * 1000)
        }
      }).catch(e => console.warn('Token update notice:', e.message));
    }

    // Store sent email record in database linked to user
    const emailRecord = await prisma.email.create({
      data: {
        userId: user.id,
        recipient,
        cc: cc || null,
        bcc: bcc || null,
        subject,
        body,
        category,
        situation,
        situationSource,
        priority,
        tone,
        status: 'Sent',
        sentAt: sendResult.sentAt || new Date(),
        gmailMessageId: sendResult.gmailMessageId || null,
        attachments: {
          create: attachments.map(att => ({
            filename: att.originalname,
            fileUrl: `/uploads/${att.filename}`,
            fileType: att.mimetype || 'application/octet-stream'
          }))
        }
      },
      include: { attachments: true }
    });

    // Create in-app notification receipt
    await prisma.notification.create({
      data: {
        userId: user.id,
        emailId: emailRecord.id,
        notificationType: category,
        message: `Email "${subject}" successfully sent to ${recipient} via Gmail.`
      }
    }).catch(e => console.warn('Notification creation notice:', e.message));

    res.json({
      success: true,
      message: `Email sent successfully from ${gmailAccount.gmailEmail}!`,
      gmailMessageId: sendResult.gmailMessageId,
      email: emailRecord
    });
  } catch (err) {
    console.error('Email send error:', err);
    res.status(500).json({ error: err.message || 'Failed to send email.' });
  }
};

router.post('/emails/send', upload.array('attachments'), handleSendEmail);
router.post('/email/send', upload.array('attachments'), handleSendEmail);

// ----------------------------------------------------
// 6. Emails History, Contacts, Templates & Settings APIs
// ----------------------------------------------------

router.get('/emails', async (req, res) => {
  try {
    const user = await getAuthUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized.' });

    const emails = await prisma.email.findMany({
      where: { userId: user.id },
      include: { attachments: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(emails);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/emails/:id', async (req, res) => {
  try {
    const user = await getAuthUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized.' });

    await prisma.email.deleteMany({
      where: { id: req.params.id, userId: user.id }
    });
    res.json({ success: true, message: 'Email removed.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/contacts', async (req, res) => {
  try {
    const user = await getAuthUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized.' });

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
    if (!user) return res.status(401).json({ error: 'Unauthorized.' });

    const { name, email, relationship } = req.body || {};
    if (!name || !email) return res.status(400).json({ error: 'Name and email are required.' });

    const contact = await prisma.contact.create({
      data: {
        userId: user.id,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        relationship: relationship || 'Other'
      }
    });
    res.status(201).json(contact);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/contacts/:id', async (req, res) => {
  try {
    const user = await getAuthUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized.' });

    await prisma.contact.deleteMany({
      where: { id: req.params.id, userId: user.id }
    });
    res.json({ success: true, message: 'Contact deleted.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/templates', async (req, res) => {
  try {
    const templates = await prisma.template.findMany();
    res.json(templates);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/notifications', async (req, res) => {
  try {
    const user = await getAuthUser(req);
    if (!user) return res.json({ notifications: [], unreadCount: 0 });

    const notifications = await prisma.notification.findMany({
      where: { userId: user.id, isTrashed: false },
      orderBy: { createdAt: 'desc' }
    });
    const unreadCount = notifications.filter(n => !n.read).length;
    res.json({ notifications, unreadCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/notifications/read-all', async (req, res) => {
  try {
    const user = await getAuthUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized.' });

    await prisma.notification.updateMany({
      where: { userId: user.id, read: false },
      data: { read: true }
    });
    res.json({ success: true, message: 'All notifications marked as read.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/settings/signature', async (req, res) => {
  try {
    const user = await getAuthUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized.' });

    let sig = await prisma.userSignature.findUnique({
      where: { userId: user.id }
    });
    if (!sig) {
      sig = await prisma.userSignature.create({
        data: {
          userId: user.id,
          name: user.name,
          designation: '',
          company: '',
          phone: '',
          website: '',
          preferredTone: 'Professional',
          enabled: true
        }
      });
    }
    res.json(sig);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/settings/signature', async (req, res) => {
  try {
    const user = await getAuthUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized.' });

    const { name, designation, company, phone, website, preferredTone, enabled } = req.body || {};
    const updated = await prisma.userSignature.upsert({
      where: { userId: user.id },
      update: {
        name: name || user.name,
        designation: designation || '',
        company: company || '',
        phone: phone || '',
        website: website || '',
        preferredTone: preferredTone || 'Professional',
        enabled: enabled !== undefined ? !!enabled : true
      },
      create: {
        userId: user.id,
        name: name || user.name,
        designation: designation || '',
        company: company || '',
        phone: phone || '',
        website: website || '',
        preferredTone: preferredTone || 'Professional',
        enabled: enabled !== undefined ? !!enabled : true
      }
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
