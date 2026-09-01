import nodemailer from 'nodemailer';
import { prisma } from './db.js';

/**
 * Creates an SMTP transport for transactional security mailings
 */
function createTransporter() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;

  if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
    return nodemailer.createTransport({
      host: SMTP_HOST,
      port: parseInt(SMTP_PORT || '587', 10),
      secure: parseInt(SMTP_PORT || '587', 10) === 465,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS
      }
    });
  }

  // Fallback test transport
  return nodemailer.createTransport({
    jsonTransport: true
  });
}

/**
 * Sends a Login Security Notification email & creates an in-app Security Alert record
 */
export async function sendLoginSecurityAlert({ user, req }) {
  if (!user || !user.email) return;

  const timestamp = new Date().toLocaleString('en-US', {
    dateStyle: 'full',
    timeStyle: 'medium'
  });

  const rawUserAgent = req.headers['user-agent'] || 'Unknown Browser/Device';
  
  // Extract simple browser name
  let browserName = 'Web Browser';
  if (rawUserAgent.includes('Chrome')) browserName = 'Chrome Browser';
  else if (rawUserAgent.includes('Firefox')) browserName = 'Firefox Browser';
  else if (rawUserAgent.includes('Safari')) browserName = 'Safari Browser';
  else if (rawUserAgent.includes('Edge')) browserName = 'Microsoft Edge';

  const ipAddress = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1';

  // 1. Create In-App Notification record in SQLite
  try {
    await prisma.notification.create({
      data: {
        userId: user.id,
        notificationType: 'Security Alert',
        message: `🔒 Security Alert: New login detected on ${timestamp} from ${browserName} (${ipAddress}). If this was not you, please secure your account immediately.`,
        read: false,
        isTrashed: false
      }
    });
    console.log(`[Security Alert] Created in-app notification for ${user.email}`);
  } catch (err) {
    console.error('Failed to create in-app security notification record:', err.message);
  }

  // 2. Send Transactional Security Alert Email via Server Mailer
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"AI Smart Sender Security" <${process.env.SMTP_FROM || 'security@aismartsender.com'}>`,
      to: user.email,
      subject: 'New Login to Your AI Smart Sender Account',
      html: `
        <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0b0f19; color: #f1f5f9; padding: 32px; border-radius: 16px; max-width: 600px; margin: 0 auto; border: 1px solid #334155;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #6366f1; margin: 0; font-size: 24px; font-weight: 800;">AI Smart Sender</h1>
            <p style="color: #94a3b8; font-size: 12px; margin-top: 4px;">Transactional Security Notice</p>
          </div>

          <div style="background-color: #1e293b; padding: 20px; border-radius: 12px; border: 1px solid #475569; margin-bottom: 24px;">
            <h2 style="color: #38bdf8; font-size: 16px; margin-top: 0; margin-bottom: 12px; font-weight: 700;">
              🔒 Successful Login Confirmation
            </h2>
            <p style="margin: 0 0 16px 0; font-size: 14px; color: #e2e8f0; line-height: 1.5;">
              A new sign-in was just recorded for your <strong>AI Smart Sender</strong> account.
            </p>

            <table style="width: 100%; border-collapse: collapse; font-size: 13px; color: #cbd5e1;">
              <tr>
                <td style="padding: 6px 0; color: #94a3b8; width: 130px;">Account Email:</td>
                <td style="padding: 6px 0; font-weight: 600; color: #ffffff;">${user.email}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #94a3b8;">Login Time:</td>
                <td style="padding: 6px 0; font-weight: 600; color: #ffffff;">${timestamp}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #94a3b8;">Device / Browser:</td>
                <td style="padding: 6px 0; font-weight: 600; color: #ffffff;">${browserName}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #94a3b8;">IP Address:</td>
                <td style="padding: 6px 0; font-family: monospace; color: #a5b4fc;">${ipAddress}</td>
              </tr>
            </table>
          </div>

          <div style="background-color: #450a0a; border: 1px solid #991b1b; padding: 16px; border-radius: 10px; margin-bottom: 24px;">
            <p style="margin: 0; color: #fca5a5; font-size: 13px; font-weight: 600; line-height: 1.5;">
              ⚠️ Did not perform this login?
            </p>
            <p style="margin: 4px 0 0 0; color: #fecaca; font-size: 12px; line-height: 1.4;">
              If you did not authorize this access, please immediately log in and update your account password to protect your credentials.
            </p>
          </div>

          <div style="border-t: 1px solid #334155; pt: 16px; text-align: center; font-size: 11px; color: #64748b;">
            This is an automated transactional security alert sent to ${user.email}. Passwords are never included in security alerts.
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[Security Alert Email] Transmitted to ${user.email}:`, info.messageId || 'Delivered');
  } catch (err) {
    // Non-blocking: failure to send security email does NOT prevent user login
    console.warn('[Security Alert Email Warning] Transactional email send attempted:', err.message);
  }
}
