/**
 * Scribe AI — Zero-Dependency Secure HTML Sanitizer
 * Uses browser-native DOMParser to safely parse and sanitize rich HTML emails,
 * eliminating XSS attack vectors while preserving layout, fonts, colors, and links.
 */

const BLOCKED_TAGS = new Set([
  'script',
  'style',
  'iframe',
  'frame',
  'object',
  'embed',
  'applet',
  'form',
  'input',
  'button',
  'select',
  'textarea',
  'meta',
  'link',
  'base',
  'noscript'
]);

const DANGEROUS_URI_PREFIXES = [
  'javascript:',
  'vbscript:',
  'data:text/html',
  'data:application/'
];

/**
 * Sanitizes arbitrary HTML for safe in-app rendering
 * @param {string} dirtyHtml 
 * @returns {string} Clean, safe HTML string
 */
export function sanitizeHtml(dirtyHtml) {
  if (!dirtyHtml || typeof dirtyHtml !== 'string') return '';

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(dirtyHtml, 'text/html');

    // Remove blocked / dangerous tags recursively
    const removeBlockedNodes = (node) => {
      const children = Array.from(node.childNodes);
      for (const child of children) {
        if (child.nodeType === Node.ELEMENT_NODE) {
          const tagName = child.tagName.toLowerCase();
          if (BLOCKED_TAGS.has(tagName)) {
            child.remove();
            continue;
          }

          // Clean attributes
          const attributes = Array.from(child.attributes);
          for (const attr of attributes) {
            const attrName = attr.name.toLowerCase();
            const attrValue = attr.value.trim().toLowerCase();

            // 1. Strip all event handlers (onclick, onerror, onload, etc.)
            if (attrName.startsWith('on')) {
              child.removeAttribute(attr.name);
              continue;
            }

            // 2. Strip dangerous protocol schemes
            if (['href', 'src', 'action', 'formaction', 'data', 'xlink:href'].includes(attrName)) {
              if (DANGEROUS_URI_PREFIXES.some(prefix => attrValue.startsWith(prefix))) {
                child.removeAttribute(attr.name);
                continue;
              }
            }

            // 3. Strip CSS expression injections in style attributes
            if (attrName === 'style') {
              if (
                attrValue.includes('expression(') ||
                attrValue.includes('javascript:') ||
                attrValue.includes('behavior:')
              ) {
                child.removeAttribute(attr.name);
                continue;
              }
            }
          }

          // Ensure external links are secure and open in new tab
          if (tagName === 'a') {
            child.setAttribute('target', '_blank');
            child.setAttribute('rel', 'noopener noreferrer');
          }

          // Recursively sanitize children
          removeBlockedNodes(child);
        }
      }
    };

    removeBlockedNodes(doc.body);
    return doc.body.innerHTML;
  } catch (err) {
    console.warn('HTML Sanitization warning:', err);
    // Fallback: simple text content extraction
    const div = document.createElement('div');
    div.textContent = dirtyHtml;
    return div.innerHTML;
  }
}
