/**
 * Scribe AI — API Utility Helper
 * Performs authenticated API calls with multi-user isolation headers,
 * dynamic backend endpoint resolution, and detailed error handling.
 */

/**
 * Returns the currently active backend API base URL
 */
export function getApiBaseUrl() {
  // 1. User-configured custom backend URL in localStorage
  const customUrl = localStorage.getItem('customBackendUrl');
  if (customUrl && customUrl.trim()) {
    const clean = customUrl.trim().replace(/\/+$/, '');
    return clean.endsWith('/api') ? clean : `${clean}/api`;
  }

  // 2. Vite environment variable
  const envUrl = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL;
  if (envUrl && envUrl.trim()) {
    const clean = envUrl.trim().replace(/\/+$/, '');
    return clean.endsWith('/api') ? clean : `${clean}/api`;
  }

  // 3. If running in local development
  if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    return 'http://localhost:5000/api';
  }

  // 4. Default production fallback (relative /api on same origin)
  return '/api';
}

/**
 * Sets or clears custom backend API URL in localStorage
 */
export function setCustomBackendUrl(url) {
  if (!url || !url.trim()) {
    localStorage.removeItem('customBackendUrl');
  } else {
    localStorage.setItem('customBackendUrl', url.trim());
  }
}

/**
 * Performs authenticated API request to active backend
 */
export async function apiFetch(url, options = {}) {
  const userEmail = localStorage.getItem('userEmail') || '';
  const authToken = localStorage.getItem('authToken') || (userEmail ? btoa(userEmail) : '');

  const rawBase = getApiBaseUrl().replace(/\/+$/, '');
  
  let targetUrl = url;
  if (rawBase && rawBase !== '/api') {
    if (rawBase.endsWith('/api') && url.startsWith('/api/')) {
      targetUrl = `${rawBase}${url.slice(4)}`;
    } else if (url.startsWith('/')) {
      targetUrl = `${rawBase}${url}`;
    } else {
      targetUrl = `${rawBase}/${url}`;
    }
  }

  const customHeaders = options.headers || {};

  const headers = {
    'x-user-email': userEmail,
    'Authorization': `Bearer ${authToken}`,
    ...customHeaders
  };

  try {
    const res = await fetch(targetUrl, {
      ...options,
      headers
    });
    return res;
  } catch (fetchErr) {
    console.error(`[API Network Error] Failed to fetch from: ${targetUrl}`, fetchErr);
    if (fetchErr.message?.includes('Failed to fetch') || fetchErr.name === 'TypeError') {
      throw new Error(`Unable to connect to backend server at ${rawBase || targetUrl}. Please verify your backend service is running and DATABASE_URL is set.`);
    }
    throw fetchErr;
  }
}

/**
 * Safely parses API responses, handling HTML error pages, empty inputs, non-JSON text, and HTTP errors
 */
export async function safeParseResponse(res) {
  const status = res.status;

  if (status === 503 || status === 502) {
    throw new Error('Backend server is currently starting or unreachable. Please verify your backend service is running.');
  }

  if (status === 404) {
    throw new Error(`API endpoint not found (HTTP 404). Please ensure the backend API is deployed and accessible.`);
  }

  const contentType = res.headers.get('content-type') || '';
  const text = await res.text();
  
  if (!text || text.trim() === '') {
    if (!res.ok) {
      throw new Error(`Server returned HTTP ${status} with empty response.`);
    }
    return { success: true };
  }

  // Check if response is an HTML page (e.g. Vite SPA index.html fallback)
  if (contentType.includes('text/html') || text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
    throw new Error('Backend API returned HTML instead of JSON. The backend server might be offline or VITE_API_BASE_URL is not set.');
  }

  if (contentType.includes('application/json') || text.trim().startsWith('{') || text.trim().startsWith('[')) {
    try {
      const data = JSON.parse(text);
      if (!res.ok) {
        throw new Error(data.error || `Server returned HTTP ${status}`);
      }
      return data;
    } catch (e) {
      if (!res.ok) throw new Error(e.message || `Server error (HTTP ${status})`);
      throw e;
    }
  }

  if (!res.ok) {
    throw new Error(`Server returned HTTP ${status}: ${text.substring(0, 120)}`);
  }

  return { success: true, message: text };
}
