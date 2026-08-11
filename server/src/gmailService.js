import { google } from 'googleapis';
import dotenv from 'dotenv';
import fs from 'fs';
import https from 'https';
import querystring from 'querystring';

dotenv.config();

export function getOAuth2Client() {
  const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
  const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
  const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;

  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    return null;
  }
  return new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI || 'http://localhost:5000/api/auth/google/callback'
  );
}

export function getAuthUrl(state = '') {
  const oauth2Client = getOAuth2Client();
  if (!oauth2Client) {
    return null;
  }
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
export function getTokensFromCode(code) {
  return new Promise((resolve, reject) => {
    const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
    const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
    const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/api/auth/google/callback';

    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
      return reject(new Error('Google OAuth credentials not configured in environment variables.'));
    }

    const postData = querystring.stringify({
      code,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri: GOOGLE_REDIRECT_URI,
      grant_type: 'authorization_code'
    });

    const options = {
      hostname: 'oauth2.googleapis.com',
      port: 443,
      path: '/token',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData),
        'Connection': 'close' // Avoid socket premature close issue
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          if (res.statusCode >= 400 || parsed.error) {
            return reject(new Error(parsed.error_description || parsed.error || `OAuth error HTTP ${res.statusCode}`));
          }
          resolve(parsed);
        } catch (e) {
          reject(new Error('Failed to parse Google OAuth token response: ' + e.message));
        }
      });
    });

    req.on('error', (err) => {
      reject(new Error('Network error connecting to Google OAuth token endpoint: ' + err.message));
    });

    req.write(postData);
    req.end();
  });
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

    const postData = querystring.stringify({
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      refresh_token: refreshToken,
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
            return reject(new Error(parsed.error_description || parsed.error || `Token refresh failed HTTP ${res.statusCode}`));
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
 * Fetches authorized user email from Google UserInfo endpoint
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
          resolve(parsed);
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
  messageParts.push(`Subject: ${subject}`);
  messageParts.push('MIME-Version: 1.0');

  if (attachments && attachments.length > 0) {
    const boundary = `====_Boundary_${Date.now()}_====`;
    messageParts.push(`Content-Type: multipart/mixed; boundary="${boundary}"`);
    messageParts.push('');
    messageParts.push(`--${boundary}`);
    messageParts.push('Content-Type: text/plain; charset="UTF-8"');
    messageParts.push('Content-Transfer-Encoding: 7bit');
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
    messageParts.push('Content-Transfer-Encoding: 7bit');
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
 * Sends email using official Gmail API with server-side OAuth tokens & automatic token refresh
 */
export async function sendGmailMessage({ accessToken, refreshToken, to, cc, bcc, subject, body, attachments = [] }) {
  if (!accessToken && !refreshToken) {
    throw new Error('Gmail account not connected. Please connect your Gmail account via Google OAuth in Settings before sending.');
  }

  const raw = createRawMessage({ to, cc, bcc, subject, body, attachments });

  let currentToken = accessToken;

  // If initial access token missing but refresh token exists, perform initial refresh
  if (!currentToken && refreshToken) {
    const refreshed = await refreshAccessToken(refreshToken);
    currentToken = refreshed.access_token;
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
    if ((err.statusCode === 401 || err.message?.includes('Invalid Credentials') || err.message?.includes('UNAUTHENTICATED')) && refreshToken) {
      console.log('Access token expired. Refreshing access token via Google OAuth token endpoint...');
      const refreshed = await refreshAccessToken(refreshToken);
      const newAccessToken = refreshed.access_token;
      
      const retryRes = await postGmailRawMessage({ accessToken: newAccessToken, raw });
      return {
        success: true,
        gmailMessageId: retryRes.id,
        mode: 'Official Gmail API',
        newAccessToken,
        sentAt: new Date()
      };
    }

    console.error('Gmail API send error:', err.message);
    throw new Error('Gmail API error: ' + err.message);
  }
}
