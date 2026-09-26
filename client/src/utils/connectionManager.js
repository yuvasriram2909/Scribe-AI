/**
 * Scribe AI — Centralized Authentication & Gmail Connection Manager
 * Single authoritative source of truth for Gmail OAuth connection lifecycle.
 * Prevents race conditions, eliminates UI flickering during navigation,
 * deduplicates concurrent status checks, and handles temporary network resilience.
 */

import { apiFetch } from './api';
import { supabase } from './supabaseClient';

export const ConnectionStates = {
  INITIALIZING: 'INITIALIZING',
  CONNECTED: 'CONNECTED',
  REFRESHING: 'REFRESHING',
  NOT_CONNECTED: 'NOT_CONNECTED',
  REAUTH_REQUIRED: 'REAUTH_REQUIRED',
  SCOPE_MISSING: 'SCOPE_MISSING',
  TEMPORARY_ERROR: 'TEMPORARY_ERROR',
};

// Initial state cache hydration from localStorage for instantaneous 0ms rendering
const getInitialConnectionState = () => {
  try {
    const cachedConnected = localStorage.getItem('scribe_gmail_connected');
    const cachedEmail = localStorage.getItem('connectedEmail') || localStorage.getItem('userEmail');
    const isConn = cachedConnected === 'true';
    return {
      status: isConn ? ConnectionStates.CONNECTED : ConnectionStates.INITIALIZING,
      isConnected: isConn,
      needsReauth: false,
      connectedEmail: cachedEmail || null,
      mailboxEmail: cachedEmail || null,
      hasModifyScope: isConn,
      hasSendScope: isConn,
      scope: '',
      historyId: null,
      messagesTotal: 0,
      threadsTotal: 0,
      lastCheckedAt: null,
      errorMessage: null,
    };
  } catch (_) {
    return {
      status: ConnectionStates.INITIALIZING,
      isConnected: false,
      needsReauth: false,
      connectedEmail: null,
      mailboxEmail: null,
      hasModifyScope: false,
      hasSendScope: false,
      scope: '',
      historyId: null,
      messagesTotal: 0,
      threadsTotal: 0,
      lastCheckedAt: null,
      errorMessage: null,
    };
  }
};

class ConnectionManager {
  constructor() {
    this.state = getInitialConnectionState();
    this.listeners = new Set();
    this.inFlightPromise = null;
    this.lastCheckTimestamp = 0;
    this.minCheckIntervalMs = 5000; // Deduplicate calls within 5s unless forced
  }

  getState() {
    return { ...this.state };
  }

  subscribe(listener) {
    if (typeof listener === 'function') {
      this.listeners.add(listener);
      // Immediately notify listener of current state
      listener(this.getState());
    }
    return () => {
      this.listeners.delete(listener);
    };
  }

  notify() {
    const currentState = this.getState();
    this.listeners.forEach((listener) => {
      try {
        listener(currentState);
      } catch (err) {
        console.warn('ConnectionManager listener error:', err);
      }
    });

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('scribe-connection-changed', { detail: currentState })
      );
    }
  }

  updateState(partial) {
    this.state = {
      ...this.state,
      ...partial,
    };

    // Cache persistence
    try {
      localStorage.setItem('scribe_gmail_connected', String(Boolean(this.state.isConnected)));
      if (this.state.connectedEmail) {
        localStorage.setItem('connectedEmail', this.state.connectedEmail);
      }
    } catch (_) {}

    this.notify();
  }

  /**
   * Check and verify Gmail connection status against authoritative backend.
   * Deduplicates concurrent calls into a single in-flight Promise.
   */
  async checkConnection(force = false) {
    const now = Date.now();
    if (!force && this.inFlightPromise) {
      return this.inFlightPromise;
    }

    if (!force && now - this.lastCheckTimestamp < this.minCheckIntervalMs) {
      return this.getState();
    }

    this.lastCheckTimestamp = now;

    this.inFlightPromise = (async () => {
      try {
        // Retrieve active session to verify user is authenticated
        const { data: sessionData } = await supabase.auth.getSession().catch(() => ({ data: {} }));
        const hasSession = Boolean(sessionData?.session?.user || localStorage.getItem('authToken'));

        if (!hasSession) {
          this.updateState({
            status: ConnectionStates.NOT_CONNECTED,
            isConnected: false,
            needsReauth: false,
            connectedEmail: null,
            mailboxEmail: null,
            lastCheckedAt: new Date().toISOString(),
          });
          return this.getState();
        }

        const res = await apiFetch('/api/auth/status');
        if (res.ok) {
          const data = await res.json();
          const isConnected = Boolean(data.isConnected);
          const needsReauth = Boolean(data.needsReauth);
          const hasSendScope = Boolean(data.hasSendScope);
          const hasModifyScope = Boolean(data.hasModifyScope);

          let status = ConnectionStates.CONNECTED;
          if (!isConnected) {
            status = needsReauth ? ConnectionStates.REAUTH_REQUIRED : ConnectionStates.NOT_CONNECTED;
          } else if (needsReauth) {
            status = ConnectionStates.REAUTH_REQUIRED;
          } else if (!hasSendScope && !hasModifyScope) {
            status = ConnectionStates.SCOPE_MISSING;
          }

          this.updateState({
            status,
            isConnected,
            needsReauth,
            connectedEmail: data.connectedEmail || this.state.connectedEmail,
            mailboxEmail: data.mailboxEmail || data.connectedEmail || this.state.mailboxEmail,
            hasModifyScope,
            hasSendScope,
            scope: data.scopes ? (Array.isArray(data.scopes) ? data.scopes.join(' ') : String(data.scopes)) : '',
            historyId: data.historyId || null,
            messagesTotal: data.messagesTotal || 0,
            threadsTotal: data.threadsTotal || 0,
            lastCheckedAt: new Date().toISOString(),
            errorMessage: null,
          });
        } else if (res.status === 401) {
          // Explicit unauthorized response from backend
          this.updateState({
            status: ConnectionStates.NOT_CONNECTED,
            isConnected: false,
            needsReauth: false,
            lastCheckedAt: new Date().toISOString(),
          });
        } else {
          // Temporary server error (500, 502, 503, 504) -> Do NOT mark disconnected!
          console.warn('Temporary backend status check issue (HTTP ' + res.status + ') - preserving connection state');
          this.updateState({
            status: this.state.isConnected ? ConnectionStates.CONNECTED : ConnectionStates.TEMPORARY_ERROR,
            errorMessage: 'Temporary network fluctuation. Retrying in background...',
            lastCheckedAt: new Date().toISOString(),
          });
        }
      } catch (err) {
        // Network offline or client error -> Do NOT mark disconnected if previously connected!
        console.warn('Connection check network error notice:', err);
        this.updateState({
          status: this.state.isConnected ? ConnectionStates.CONNECTED : ConnectionStates.TEMPORARY_ERROR,
          errorMessage: 'Network connection issue.',
          lastCheckedAt: new Date().toISOString(),
        });
      } finally {
        this.inFlightPromise = null;
      }

      return this.getState();
    })();

    return this.inFlightPromise;
  }

  /**
   * Set connection status immediately after successful OAuth redirect or session sync
   */
  setConnected(details = {}) {
    this.updateState({
      status: ConnectionStates.CONNECTED,
      isConnected: true,
      needsReauth: false,
      connectedEmail: details.email || details.connectedEmail || this.state.connectedEmail,
      mailboxEmail: details.email || details.mailboxEmail || this.state.mailboxEmail,
      hasSendScope: true,
      hasModifyScope: true,
      lastCheckedAt: new Date().toISOString(),
      errorMessage: null,
    });
  }

  /**
   * Handle explicit user disconnection
   */
  async disconnect() {
    try {
      await apiFetch('/api/auth/google/disconnect', { method: 'POST' }).catch(() => {});
    } catch (_) {}

    this.updateState({
      status: ConnectionStates.NOT_CONNECTED,
      isConnected: false,
      needsReauth: false,
      connectedEmail: null,
      mailboxEmail: null,
      hasModifyScope: false,
      hasSendScope: false,
      scope: '',
      historyId: null,
      messagesTotal: 0,
      threadsTotal: 0,
      lastCheckedAt: new Date().toISOString(),
      errorMessage: null,
    });

    try {
      localStorage.removeItem('scribe_gmail_connected');
      localStorage.removeItem('connectedEmail');
    } catch (_) {}
  }

  /**
   * Clear local state on logout without deleting server credentials
   */
  resetOnLogout() {
    this.state = {
      status: ConnectionStates.NOT_CONNECTED,
      isConnected: false,
      needsReauth: false,
      connectedEmail: null,
      mailboxEmail: null,
      hasModifyScope: false,
      hasSendScope: false,
      scope: '',
      historyId: null,
      messagesTotal: 0,
      threadsTotal: 0,
      lastCheckedAt: null,
      errorMessage: null,
    };
    try {
      localStorage.removeItem('scribe_gmail_connected');
      localStorage.removeItem('connectedEmail');
    } catch (_) {}
    this.notify();
  }
}

// Global Singleton Instance
export const connectionManager = new ConnectionManager();
