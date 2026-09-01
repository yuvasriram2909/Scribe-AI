import crypto from 'crypto';

/**
 * Derives a 32-byte encryption key from environment variable or fallback secret
 */
function getEncryptionKey() {
  const secret = process.env.ENCRYPTION_KEY || process.env.JWT_SECRET || 'scribe-ai-oauth-secret-key-32-chars!!';
  return crypto.createHash('sha256').update(secret).digest();
}

/**
 * Encrypts sensitive token using AES-256-GCM
 * Output format: ivHex:authTagHex:encryptedHex
 */
export function encryptToken(text) {
  if (!text) return '';
  try {
    const iv = crypto.randomBytes(16);
    const key = getEncryptionKey();
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');
    
    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
  } catch (err) {
    console.error('Token encryption warning:', err.message);
    return text;
  }
}

/**
 * Decrypts AES-256-GCM encrypted token
 * Gracefully handles unencrypted strings or app passwords
 */
export function decryptToken(cipherText) {
  if (!cipherText) return '';
  // Check for app password prefix or unencrypted legacy token
  if (cipherText.startsWith('APPPASSWORD:') || !cipherText.includes(':')) {
    return cipherText;
  }

  const parts = cipherText.split(':');
  if (parts.length !== 3) {
    return cipherText;
  }

  const [ivHex, authTagHex, encryptedHex] = parts;
  try {
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const key = getEncryptionKey();
    
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    console.warn('Token decryption notice (using raw value):', err.message);
    return cipherText;
  }
}
