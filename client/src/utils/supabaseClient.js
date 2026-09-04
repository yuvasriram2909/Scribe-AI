/**
 * Scribe AI — Direct Supabase Client & Realtime Manager
 * Provides direct connection to Supabase PostgreSQL, Authentication, and Realtime streams.
 */

import { createClient } from '@supabase/supabase-js';

// Project Reference: bjxjorlxjijssrqjosed
export const SUPABASE_URL = 
  (typeof import.meta !== 'undefined' && (import.meta.env?.VITE_SUPABASE_URL || import.meta.env?.NEXT_PUBLIC_SUPABASE_URL)) || 
  'https://bjxjorlxjijssrqjosed.supabase.co';

// Default Supabase Anon / Public Key
export const SUPABASE_ANON_KEY = 
  (typeof import.meta !== 'undefined' && (import.meta.env?.VITE_SUPABASE_ANON_KEY || import.meta.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY)) || 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJqeGpvcmx4amlqc3NycWpvc2VkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDk4NTYwMDAsImV4cCI6MjAyNTQzMjAwMH0.placeholder';

// Create Supabase Client instance
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

/**
 * Sign in / Register with Google OAuth directly through Supabase Auth
 */
export async function signInWithGoogle() {
  const redirectUri = window.location.origin;
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${redirectUri}?gmail=connected`,
      scopes: 'https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile',
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  });
  if (error) throw error;
  return data;
}

/**
 * Sign up with Email & Password via Supabase Auth
 */
export async function signUpWithPassword(email, password, fullName) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        name: fullName,
      },
    },
  });
  if (error) throw error;
  return data;
}

/**
 * Sign in with Email & Password via Supabase Auth
 */
export async function signInWithPassword(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
}

/**
 * Sign out of Supabase Auth
 */
export async function signOutUser() {
  try {
    await supabase.auth.signOut();
  } catch (_) {}
  localStorage.removeItem('userEmail');
  localStorage.removeItem('userName');
  localStorage.removeItem('authToken');
}

/**
 * Helper to test if a string is a valid UUID
 */
function isValidUuid(id) {
  return Boolean(id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id));
}

/**
 * Subscribe to real-time changes on the Email table for a specific user
 */
export function subscribeToEmailChanges(userId, onEmailEvent) {
  if (!supabase || !onEmailEvent) return () => {};

  try {
    const isUuid = isValidUuid(userId);
    const channelName = `rt_emails_${userId || 'all'}_${Math.random().toString(36).slice(2, 7)}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'Email',
          ...(userId ? { filter: `userId=eq.${userId}` } : {}),
        },
        (payload) => {
          onEmailEvent(payload);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'emails',
          ...(isUuid ? { filter: `user_id=eq.${userId}` } : {}),
        },
        (payload) => {
          onEmailEvent(payload);
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`[Supabase Realtime] Subscribed to Email changes for user: ${userId || 'all'}`);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  } catch (err) {
    console.warn('[Supabase Realtime] Failed to initialize Email channel:', err);
    return () => {};
  }
}

/**
 * Subscribe to real-time changes on the Drafts table
 */
export function subscribeToDraftChanges(userId, onDraftEvent) {
  if (!supabase || !onDraftEvent) return () => {};

  try {
    const isUuid = isValidUuid(userId);
    const channelName = `rt_drafts_${userId || 'all'}_${Math.random().toString(36).slice(2, 7)}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'drafts',
          ...(isUuid ? { filter: `user_id=eq.${userId}` } : {}),
        },
        (payload) => {
          onDraftEvent(payload);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  } catch (err) {
    console.warn('[Supabase Realtime] Failed to initialize Drafts channel:', err);
    return () => {};
  }
}

/**
 * Subscribe to real-time changes on the Notification table for a specific user
 */
export function subscribeToNotificationChanges(userId, onNotificationEvent) {
  if (!supabase || !onNotificationEvent) return () => {};

  try {
    const channelName = `rt_notifs_${userId || 'all'}_${Math.random().toString(36).slice(2, 7)}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'Notification',
          ...(userId ? { filter: `userId=eq.${userId}` } : {}),
        },
        (payload) => {
          onNotificationEvent(payload);
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`[Supabase Realtime] Subscribed to Notification changes for user: ${userId || 'all'}`);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  } catch (err) {
    console.warn('[Supabase Realtime] Failed to initialize Notification channel:', err);
    return () => {};
  }
}

/**
 * Get active Supabase Auth token if user signed in through Supabase Auth
 */
export async function getSupabaseAuthToken() {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
  } catch (_) {
    return null;
  }
}

/**
 * Subscribe to real-time changes on the email_events table
 */
export function subscribeToEmailEvents(userId, onEvent) {
  if (!supabase || !onEvent) return () => {};

  try {
    const isUuid = isValidUuid(userId);
    const channelName = `rt_events_${userId || 'all'}_${Math.random().toString(36).slice(2, 7)}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'email_events',
          ...(isUuid ? { filter: `user_id=eq.${userId}` } : {}),
        },
        (payload) => {
          onEvent(payload);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  } catch (err) {
    console.warn('[Supabase Realtime] Failed to initialize Email events channel:', err);
    return () => {};
  }
}
