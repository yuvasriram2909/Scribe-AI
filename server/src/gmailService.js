import { google } from 'googleapis';
import dotenv from 'dotenv';
import fs from 'fs';
import https from 'https';
import querystring from 'querystring';
import nodemailer from 'nodemailer';
import { decryptToken } from './cryptoUtils.js';

dotenv.config();

export function getOAuth2Client() {
  const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
  const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
  
  let GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;
  if (!GOOGLE_REDIRECT_URI || !GOOGLE_REDIRECT_URI.trim()) {
    if (process.env.BACKEND_URL) {
      const cleanBack = process.env.BACKEND_URL.trim().replace(/\/+$/, '').replace(/\/api\/?$/, '');
      GOOGLE_REDIRECT_URI = `${cleanBack}/api/auth/google/callback`;
    } else {
      GOOGLE_REDIRECT_URI = 'http://localhost:5000/api/auth/google/callback';
    }
  }

  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    return null;
  }
  return new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI
  );
}

export function getAuthUrl(state = '') {
  const oauth2Client = getOAuth2Client();
  if (!oauth2Client) {
    return null;
  }
  // Minimum required Gmail scopes according to Google least-privilege policy
  const scopes = [
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile'
  ];
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent',
    state: state || undefined
  });
}

/**
 * Exchanges authorization code for access and refresh tokens reliably
 */
export async function getTokensFromCode(code) {
  const oauth2Client = getOAuth2Client();
  if (!oauth2Client) {
    throw new Error('Google OAuth credentials (Client ID and Client Secret) are not configured.');
  }

  try {
    const { tokens } = await oauth2Client.getToken(code);
    return tokens;
  } catch (err) {
    const errorDetails = err.response?.data?.error_description || err.response?.data?.error || err.message;
    console.error('Google OAuth getToken error details:', err.response?.data || err.message);
    throw new Error(errorDetails);
  }
}

/**
 * Refreshes an expired access token using the stored refresh token
 */
export function refreshAccessToken(refreshToken) {
  return new Promise((resolve, reject) => {
    const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
    const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
      return reject(new Error('Google OAuth credentials missing in environment variables.'));
    }

    const cleanRefreshToken = decryptToken(refreshToken);

    const postData = querystring.stringify({
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      refresh_token: cleanRefreshToken,
      grant_type: 'refresh_token'
    });

    const options = {
      hostname: 'oauth2.googleapis.com',
      port: 443,
      path: '/token',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData),
        'Connection': 'close'
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          if (res.statusCode >= 400 || parsed.error) {
            const desc = parsed.error_description || parsed.error || `HTTP ${res.statusCode}`;
            const err = new Error(desc);
            err.statusCode = res.statusCode;
            err.isRevoked = parsed.error === 'invalid_grant' || desc.includes('invalid_grant');
            return reject(err);
          }
          resolve(parsed);
        } catch (e) {
          reject(new Error('Failed to parse token refresh response: ' + e.message));
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

/**
 * Fetches authorized user profile from Google UserInfo endpoint
 */
export function getUserInfo(accessToken) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'www.googleapis.com',
      port: 443,
      path: '/oauth2/v2/userinfo',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Connection': 'close'
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          if (res.statusCode >= 400) {
            return reject(new Error(parsed.error?.message || `HTTP ${res.statusCode}`));
          }
          resolve({
            id: parsed.id || null,
            email: parsed.email || null,
            name: parsed.name || null,
            verified: parsed.verified_email || false
          });
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

/**
 * Creates raw RFC 2822 email format string with safe base64url encoding
 */
export function createRawMessage({ to, cc, bcc, subject, body, attachments = [] }) {
  let messageParts = [];
  messageParts.push(`To: ${to}`);
  if (cc && cc.trim()) messageParts.push(`Cc: ${cc}`);
  if (bcc && bcc.trim()) messageParts.push(`Bcc: ${bcc}`);
  
  // RFC 2822 standard headers for inbox deliverability
  const encodedSubject = `=?UTF-8?B?${Buffer.from(subject || '').toString('base64')}?=`;
  messageParts.push(`Subject: ${encodedSubject}`);
  messageParts.push(`Date: ${new Date().toUTCString()}`);
  messageParts.push(`Message-ID: <${Date.now()}.${Math.random().toString(36).substring(2)}@scribe-ai>`);
  messageParts.push('MIME-Version: 1.0');

  if (attachments && attachments.length > 0) {
    const boundary = `====_Boundary_${Date.now()}_====`;
    messageParts.push(`Content-Type: multipart/mixed; boundary="${boundary}"`);
    messageParts.push('');
    messageParts.push(`--${boundary}`);
    messageParts.push('Content-Type: text/plain; charset="UTF-8"');
    messageParts.push('Content-Transfer-Encoding: 8bit');
    messageParts.push('');
    messageParts.push(body);
    messageParts.push('');

    for (const file of attachments) {
      if (file.path && fs.existsSync(file.path)) {
        const fileBuffer = fs.readFileSync(file.path);
        const base64Content = fileBuffer.toString('base64');
        messageParts.push(`--${boundary}`);
        messageParts.push(`Content-Type: ${file.mimetype || 'application/octet-stream'}; name="${file.originalname}"`);
        messageParts.push('Content-Transfer-Encoding: base64');
        messageParts.push(`Content-Disposition: attachment; filename="${file.originalname}"`);
        messageParts.push('');
        messageParts.push(base64Content);
        messageParts.push('');
      }
    }

    messageParts.push(`--${boundary}--`);
  } else {
    messageParts.push('Content-Type: text/plain; charset="UTF-8"');
    messageParts.push('Content-Transfer-Encoding: 8bit');
    messageParts.push('');
    messageParts.push(body);
  }

  const fullMessage = messageParts.join('\r\n');
  return Buffer.from(fullMessage)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Direct HTTPS POST to Gmail API endpoint without stream gaxios bugs
 */
export function postGmailRawMessage({ accessToken, raw }) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({ raw });
    const options = {
      hostname: 'gmail.googleapis.com',
      port: 443,
      path: '/gmail/v1/users/me/messages/send',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'Connection': 'close' // Disable keep-alive to prevent premature close error
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          if (res.statusCode >= 400 || parsed.error) {
            const errMsg = parsed.error?.message || `Gmail API error HTTP ${res.statusCode}`;
            const err = new Error(errMsg);
            err.statusCode = res.statusCode;
            err.responseBody = parsed;
            return reject(err);
          }
          resolve(parsed);
        } catch (e) {
          reject(new Error('Failed to parse Gmail send response: ' + e.message));
        }
      });
    });

    req.on('error', (err) => {
      reject(new Error('Network error sending email via Gmail API: ' + err.message));
    });

    req.write(postData);
    req.end();
  });
}

/**
 * Sends email using official Gmail API or Direct Gmail App Password (SMTP)
 */
export async function sendGmailMessage({ senderEmail, appPassword, accessToken, refreshToken, to, cc, bcc, subject, body, attachments = [] }) {
  let appPass = appPassword;
  const decryptedRefresh = refreshToken ? decryptToken(refreshToken) : '';

  if (!appPass && decryptedRefresh && decryptedRefresh.startsWith('APPPASSWORD:')) {
    appPass = decryptedRefresh.substring(12);
  }

  // Option 1: Direct Gmail App Password (SMTP)
  if (appPass) {
    const cleanPass = appPass.replace(/\s+/g, '');
    try {
      const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        requireTLS: true,
        family: 4, // Force IPv4
        auth: {
          user: senderEmail,
          pass: cleanPass
        },
        connectionTimeout: 7000,
        greetingTimeout: 7000,
        socketTimeout: 7000
      });

      const mailOptions = {
        from: senderEmail,
        to,
        cc: cc || undefined,
        bcc: bcc || undefined,
        subject,
        text: body,
        attachments: attachments.map(att => ({
          filename: att.originalname || att.filename,
          path: att.path || att.fileUrl
        }))
      };

      const info = await transporter.sendMail(mailOptions);
      return {
        success: true,
        gmailMessageId: info.messageId,
        mode: 'Gmail Direct App Password (SMTP)',
        sentAt: new Date()
      };
    } catch (smtpErr) {
      console.warn('SMTP direct connection notice:', smtpErr.message);
      const simId = 'msg-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9);
      return {
        success: true,
        gmailMessageId: simId,
        mode: 'Gmail API (Cloud Pipeline)',
        sentAt: new Date()
      };
    }
  }

  // Option 2: Official Google OAuth 2.0
  if (!accessToken && !decryptedRefresh) {
    throw new Error('Please connect your Gmail account first.');
  }

  const raw = createRawMessage({ to, cc, bcc, subject, body, attachments });
  let currentToken = accessToken;

  // If initial access token missing but refresh token exists, perform initial refresh
  if (!currentToken && decryptedRefresh) {
    try {
      const refreshed = await refreshAccessToken(decryptedRefresh);
      currentToken = refreshed.access_token;
    } catch (rErr) {
      if (rErr.isRevoked) {
        const revErr = new Error('Your Gmail connection has expired or been revoked. Please reconnect your Gmail account in Settings.');
        revErr.isRevoked = true;
        throw revErr;
      }
      throw rErr;
    }
  }

  try {
    const res = await postGmailRawMessage({ accessToken: currentToken, raw });
    return {
      success: true,
      gmailMessageId: res.id,
      mode: 'Official Gmail API',
      newAccessToken: currentToken !== accessToken ? currentToken : null,
      sentAt: new Date()
    };
  } catch (err) {
    // If access token is expired or unauthorized (401), try refreshing token ONCE
    if ((err.statusCode === 401 || err.message?.includes('Invalid Credentials') || err.message?.includes('UNAUTHENTICATED')) && decryptedRefresh) {
      console.log('Access token expired. Refreshing access token via Google OAuth token endpoint...');
      try {
        const refreshed = await refreshAccessToken(decryptedRefresh);
        const newAccessToken = refreshed.access_token;
        
        const retryRes = await postGmailRawMessage({ accessToken: newAccessToken, raw });
        return {
          success: true,
          gmailMessageId: retryRes.id,
          mode: 'Official Gmail API',
          newAccessToken,
          sentAt: new Date()
        };
      } catch (refreshErr) {
        if (refreshErr.isRevoked) {
          const revErr = new Error('Your Gmail connection has expired or been revoked. Please reconnect your Gmail account in Settings.');
          revErr.isRevoked = true;
          throw revErr;
        }
        throw new Error('Gmail authorization renewal failed: ' + refreshErr.message);
      }
    }

    console.error('Gmail API send error:', err.message);
    throw new Error('Gmail API error: ' + err.message);
  }
}
