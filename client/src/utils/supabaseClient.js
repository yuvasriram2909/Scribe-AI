/**
 * Scribe AI — Direct Supabase Client & Realtime Manager
 * Provides direct connection to Supabase PostgreSQL, Authentication, and Realtime streams.
 */

import { createClient } from '@supabase/supabase-js';

// Project Reference: bjxjorlxjijssrqjosed
export const SUPABASE_URL = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) || 'https://bjxjorlxjijssrqjosed.supabase.co';

// Default Supabase Anon / Public Key
export const SUPABASE_ANON_KEY = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJqeGpvcmx4amlqc3NycWpvc2VkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDk4NTYwMDAsImV4cCI6MjAyNTQzMjAwMH0.placeholder';

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
 * Subscribe to real-time changes on the Email table for a specific user
 */
export function subscribeToEmailChanges(userId, onEmailEvent) {
  if (!supabase || !onEmailEvent) return () => {};

  try {
    const channelName = `realtime:emails:${userId || 'global'}`;
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
          ...(userId ? { filter: `user_id=eq.${userId}` } : {}),
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
    const channel = supabase
      .channel(`realtime:drafts:${userId || 'global'}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'drafts',
          ...(userId ? { filter: `user_id=eq.${userId}` } : {}),
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
    const channelName = `realtime:notifications:${userId || 'global'}`;
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
