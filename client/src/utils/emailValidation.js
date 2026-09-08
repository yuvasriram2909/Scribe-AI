/**
 * Scribe AI — Email Parsing & Multi-Recipient Validation Utilities
 * Supports single and multiple email addresses separated by comma, semicolon, space, or newline.
 * Handles standard RFC-like formats such as "Name <email@domain.com>".
 */

/**
 * Standard RFC-compliant individual email address regex
 */
export const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

/**
 * Extracts raw email address from potential formatted string (e.g. "John Doe <john@example.com>")
 * @param {string} raw
 * @returns {string}
 */
export function extractEmailAddress(raw = '') {
  if (!raw || typeof raw !== 'string') return '';
  const match = raw.match(/<([^>]+)>/);
  if (match) return match[1].trim();
  return raw.trim();
}

/**
 * Extracts a friendly name from an email prefix or formatted string
 * e.g. "samsonlankapalli02@gmail.com" -> "Samson"
 * @param {string} emailOrRaw
 * @returns {string}
 */
export function extractRecipientFirstName(emailOrRaw = '') {
  if (!emailOrRaw) return '';
  // Check if there is a display name before <...>
  const nameMatch = emailOrRaw.match(/^([^<]+)<[^>]+>/);
  if (nameMatch) {
    const clean = nameMatch[1].replace(/["']/g, '').trim().split(/\s+/)[0];
    if (clean) return clean.charAt(0).toUpperCase() + clean.slice(1).toLowerCase();
  }
  const cleanEmail = extractEmailAddress(emailOrRaw);
  const localPart = cleanEmail.split('@')[0] || '';
  const lettersOnly = localPart.replace(/[0-9._-]/g, ' ').trim().split(/\s+/)[0] || '';
  if (lettersOnly.length >= 2) {
    return lettersOnly.charAt(0).toUpperCase() + lettersOnly.slice(1).toLowerCase();
  }
  return '';
}

/**
 * Parses raw input string or array into an array of distinct, trimmed email addresses
 * Splits on commas (,), semicolons (;), newlines (\n), or multiple spaces
 * @param {string|string[]} raw
 * @returns {string[]}
 */
export function parseEmailList(raw = '') {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw
      .map(extractEmailAddress)
      .filter(Boolean)
      .filter((item, index, self) => self.indexOf(item) === index);
  }
  if (typeof raw !== 'string') return [];

  // Split by comma, semicolon, newline, or carriage return
  const tokens = raw.split(/[,;\n\r]+/);
  const results = [];

  for (let token of tokens) {
    token = token.trim();
    if (!token) continue;

    // In case tokens were space-separated emails (e.g. "a@b.com c@d.com")
    if (token.includes(' ') && !token.includes('<') && !token.includes('>')) {
      const subTokens = token.split(/\s+/);
      for (const st of subTokens) {
        const cleanSub = extractEmailAddress(st);
        if (cleanSub && !results.includes(cleanSub)) {
          results.push(cleanSub);
        }
      }
    } else {
      const clean = extractEmailAddress(token);
      if (clean && !results.includes(clean)) {
        results.push(clean);
      }
    }
  }

  return results;
}

/**
 * Validates whether an individual string is a valid email address
 * @param {string} email
 * @returns {boolean}
 */
export function isValidEmail(email = '') {
  if (!email || typeof email !== 'string') return false;
  const clean = extractEmailAddress(email);
  return EMAIL_REGEX.test(clean);
}

/**
 * Validates a list of emails from raw input
 * @param {string|string[]} raw
 * @param {object} options
 * @param {string} options.fieldName
 * @param {boolean} options.allowEmpty
 * @returns {{
 *   isValid: boolean,
 *   validEmails: string[],
 *   invalidEmails: string[],
 *   formatted: string,
 *   count: number,
 *   error: string|null
 * }}
 */
export function validateEmailList(raw = '', { fieldName = 'Recipient email', allowEmpty = false } = {}) {
  const parsed = parseEmailList(raw);

  if (parsed.length === 0) {
    if (allowEmpty) {
      return {
        isValid: true,
        validEmails: [],
        invalidEmails: [],
        formatted: '',
        count: 0,
        error: null
      };
    }
    return {
      isValid: false,
      validEmails: [],
      invalidEmails: [],
      formatted: '',
      count: 0,
      error: `Please enter at least one ${fieldName.toLowerCase()} address.`
    };
  }

  const validEmails = [];
  const invalidEmails = [];

  for (const item of parsed) {
    if (isValidEmail(item)) {
      validEmails.push(item);
    } else {
      invalidEmails.push(item);
    }
  }

  if (invalidEmails.length > 0) {
    const errorPrefix = invalidEmails.length === 1
      ? `Invalid email address format: "${invalidEmails[0]}".`
      : `Invalid email addresses found: "${invalidEmails.slice(0, 2).join('", "')}".`;
    return {
      isValid: false,
      validEmails,
      invalidEmails,
      formatted: validEmails.join(', '),
      count: validEmails.length,
      error: `${errorPrefix} Please verify email addresses are separated by commas.`
    };
  }

  return {
    isValid: true,
    validEmails,
    invalidEmails: [],
    formatted: validEmails.join(', '),
    count: validEmails.length,
    error: null
  };
}

/**
 * Formats parsed email list into clean comma-separated string
 * @param {string[]} emails
 * @returns {string}
 */
export function formatEmailList(emails = []) {
  if (!Array.isArray(emails)) return '';
  return emails.filter(Boolean).join(', ');
}
