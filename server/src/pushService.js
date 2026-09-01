import webpush from 'web-push';
import { prisma } from './db.js';

// Fallback VAPID keys if not specified in environment
const DEFAULT_VAPID_PUBLIC = process.env.VAPID_PUBLIC_KEY || 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U';
const DEFAULT_VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY || 'UUxI4OOTgR2vG7A_pD_pP86W4G3n2zD5bN9mU8aV6wI';
const DEFAULT_VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:support@scribe-ai.com';

try {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || DEFAULT_VAPID_SUBJECT,
    process.env.VAPID_PUBLIC_KEY || DEFAULT_VAPID_PUBLIC,
    process.env.VAPID_PRIVATE_KEY || DEFAULT_VAPID_PRIVATE
  );
} catch (vapidErr) {
  console.warn('⚠️ WebPush VAPID initialization notice:', vapidErr.message);
}

/**
 * Returns the active VAPID public key for frontend subscription
 */
export function getVapidPublicKey() {
  return process.env.VAPID_PUBLIC_KEY || DEFAULT_VAPID_PUBLIC;
}

/**
 * Dispatches a Web Push Notification to all registered devices for a user upon login
 */
export async function sendLoginPushNotification({ user, req }) {
  if (!user || !user.id) return;

  try {
    const subscriptions = await prisma.pushSubscription.findMany({
      where: { userId: user.id }
    });

    if (!subscriptions || subscriptions.length === 0) {
      return;
    }

    const payload = JSON.stringify({
      title: 'Scribe AI',
      body: 'New login detected. You have successfully logged in to Scribe AI.',
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      url: '/app',
      timestamp: Date.now()
    });

    const sendPromises = subscriptions.map(async (sub) => {
      try {
        const pushConfig = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth
          }
        };
        await webpush.sendNotification(pushConfig, payload);
      } catch (err) {
        // Clean up expired or unregistered subscriptions
        if (err.statusCode === 404 || err.statusCode === 410) {
          console.log(`[Push Notification] Removing expired push subscription: ${sub.id}`);
          await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
        } else {
          console.warn(`[Push Notification] Delivery notice for sub ${sub.id}:`, err.message);
        }
      }
    });

    await Promise.allSettled(sendPromises);
  } catch (err) {
    console.error('Failed to send login push notification:', err.message);
  }
}
