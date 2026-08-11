/**
 * Utility helper to perform authenticated API calls with multi-user isolation headers
 * and configurable VITE_API_BASE_URL support.
 */
export async function apiFetch(url, options = {}) {
  const userEmail = localStorage.getItem('userEmail') || '';
  const authToken = localStorage.getItem('authToken') || (userEmail ? btoa(userEmail) : '');

  const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
  const targetUrl = (url.startsWith('/') && baseUrl) ? `${baseUrl}${url}` : url;

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
  const contentType = res.headers.get('content-type') || '';
  const status = res.status;

  const text = await res.text();
  
  if (!text || text.trim() === '') {
    if (!res.ok) {
      throw new Error(`Server returned HTTP ${status} with empty response.`);
    }
    return { success: true };
  }

  if (contentType.includes('application/json') || text.trim().startsWith('{') || text.trim().startsWith('[')) {
    try {
      const data = JSON.parse(text);
      if (!res.ok && data && data.error) {
        throw new Error(data.error);
      }
      return data;
    } catch (e) {
      if (!res.ok) throw new Error(`HTTP ${status}: ${text}`);
      throw new Error(`Invalid JSON format: ${e.message}`);
    }
  }

  if (!res.ok) {
    throw new Error(`Server Error (HTTP ${status}): ${text.slice(0, 150)}`);
  }

  return { success: true, text };
}
