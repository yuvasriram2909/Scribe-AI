/**
 * Utility helper to perform authenticated API calls with multi-user isolation headers
 * and configurable VITE_API_BASE_URL support without duplicate /api/api pathing.
 */
export async function apiFetch(url, options = {}) {
  const userEmail = localStorage.getItem('userEmail') || '';
  const authToken = localStorage.getItem('authToken') || (userEmail ? btoa(userEmail) : '');

  // Default fallback URL points directly to your live Render backend
  const DEFAULT_BACKEND_URL = 'https://scribe-ai-1-5nqu.onrender.com/api';
  const rawBase = (import.meta.env.VITE_API_BASE_URL || DEFAULT_BACKEND_URL).replace(/\/+$/, '');
  
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
    'Authorization': `Bearer ${authToken}`,
    ...customHeaders
  };

  return fetch(targetUrl, {
    ...options,
    headers
  });
}

/**
 * Safely parses API responses, handling empty inputs, non-JSON text, and HTTP errors
 * without throwing "Unexpected end of JSON input".
 */
export async function safeParseResponse(res) {
  const status = res.status;

  if (status === 503) {
    throw new Error('Backend service suspended on Render. Please open Render Dashboard (dashboard.render.com) and click Resume Service.');
  }

  const contentType = res.headers.get('content-type') || '';
  const text = await res.text();
  
  if (!text || text.trim() === '') {
    if (!res.ok) {
      throw new Error(`Server returned HTTP ${status} with empty response.`);
    }
    return { success: true };
  }

  if (text.includes('Service Suspended') || text.includes('suspended by its owner')) {
    throw new Error('Render backend suspended. Please resume service in Render Dashboard (dashboard.render.com).');
  }

  if (contentType.includes('application/json') || text.trim().startsWith('{') || text.trim().startsWith('[')) {
    try {
      const data = JSON.parse(text);
      if (!res.ok && data && data.error) {
        throw new Error(data.error);
      }
      return data;
    } catch (e) {
      if (!res.ok) throw new Error(e.message);
    }
  }

  if (!res.ok) {
    throw new Error(`Server returned HTTP ${status}: ${text.substring(0, 100)}`);
  }

  return { success: true, message: text };
}
