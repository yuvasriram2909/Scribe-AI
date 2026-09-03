/**
 * Scribe AI — API Utility Helper
 * Performs authenticated API calls with multi-user isolation headers,
 * dynamic Supabase Edge Function endpoint resolution, and detailed error handling.
 */

// Default Supabase Edge Function backend endpoint
export const DEFAULT_SUPABASE_EDGE_FUNCTION = 'https://bjxjorlxjijssrqjosed.supabase.co/functions/v1/api';

/**
 * Normalizes and sanitizes the API base URL to ensure no duplicate or nested sub-paths
 */
export function sanitizeApiUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string' || !rawUrl.trim()) {
    return DEFAULT_SUPABASE_EDGE_FUNCTION;
  }
  let url = rawUrl.trim().replace(/\/+$/, '');
  
  // If user pasted a sub-route like .../functions/v1/api/auth/google/callback, extract the base function endpoint
  const edgeFunctionMatch = url.match(/^(https?:\/\/[^\/]+\/functions\/v1\/[^\/]+)/i);
  if (edgeFunctionMatch) {
    return edgeFunctionMatch[1];
  }
  
  // If URL contains sub-paths after /api or /auth, clean them up
  url = url.replace(/\/auth(\/.*)?$/i, '');
  url = url.replace(/\/api\/.*$/i, '/api');
  return url || DEFAULT_SUPABASE_EDGE_FUNCTION;
}

/**
 * Returns the currently active backend API base URL
 */
export function getApiBaseUrl() {
  // 1. User-configured custom backend URL in localStorage
  const customUrl = localStorage.getItem('customBackendUrl');
  if (customUrl && customUrl.trim()) {
    const sanitized = sanitizeApiUrl(customUrl);
    // If localStorage had a corrupted sub-route, fix it in storage
    if (sanitized !== customUrl.trim()) {
      localStorage.setItem('customBackendUrl', sanitized);
    }
    return sanitized;
  }

  // 2. Vite environment variable (supports VITE_API_URL and VITE_API_BASE_URL)
  const envUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL;
  if (envUrl && envUrl.trim()) {
    return sanitizeApiUrl(envUrl);
  }

  // 3. Default production and development endpoint: Supabase Edge Function
  return DEFAULT_SUPABASE_EDGE_FUNCTION;
}

/**
 * Sets or clears custom backend API URL in localStorage
 */
export function setCustomBackendUrl(url) {
  if (!url || !url.trim() || url.trim() === DEFAULT_SUPABASE_EDGE_FUNCTION) {
    localStorage.removeItem('customBackendUrl');
  } else {
    localStorage.setItem('customBackendUrl', sanitizeApiUrl(url));
  }
}

/**
 * Performs authenticated API request to the active Supabase Edge Function backend
 */
export async function apiFetch(url, options = {}) {
  const userEmail = localStorage.getItem('userEmail') || '';
  let authToken = localStorage.getItem('authToken');
  if (!authToken) {
    try {
      const supaAuth = localStorage.getItem('sb-bjxjorlxjijssrqjosed-auth-token');
      if (supaAuth) {
        const parsed = JSON.parse(supaAuth);
        if (parsed?.access_token) {
          authToken = parsed.access_token;
        }
      }
    } catch (_) {}
  }
  if (!authToken && userEmail) {
    authToken = btoa(userEmail);
  }

  const rawBase = getApiBaseUrl().replace(/\/+$/, '');
  
  let targetUrl = url;
  if (rawBase) {
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
    'Authorization': `Bearer ${authToken || ''}`,
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
      throw new Error(`Unable to connect to Supabase Edge Function backend at ${rawBase}. Please verify the function is deployed and active.`);
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
    throw new Error('Supabase Edge Function backend is currently starting or unreachable.');
  }

  if (status === 404) {
    throw new Error(`API endpoint not found (HTTP 404) on Supabase Edge Function.`);
  }

  const contentType = res.headers.get('content-type') || '';
  const text = await res.text();
  
  if (!text || text.trim() === '') {
    if (!res.ok) {
      throw new Error(`Server returned HTTP ${status} with empty response.`);
    }
    return { success: true };
  }

  // Check if response is an HTML error page
  if (contentType.includes('text/html') || text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
    throw new Error('Backend API returned HTML instead of JSON. Please verify your Supabase Edge Function endpoint.');
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
