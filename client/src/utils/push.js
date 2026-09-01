import { apiFetch, safeParseResponse } from './api';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Registers the Service Worker in client/public/sw.js
 */
export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    return null;
  }
  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/'
    });
    return registration;
  } catch (err) {
    console.warn('Service worker registration failed:', err);
    return null;
  }
}

/**
 * Prompts user for notification permission and registers push subscription
 */
export async function subscribeUserToPush() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.log('Push notifications not supported on this device/browser.');
    return { success: false, reason: 'unsupported' };
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return { success: false, reason: 'denied' };
    }

    const registration = await navigator.serviceWorker.ready;

    // Fetch active VAPID public key from backend
    const keyRes = await apiFetch('/api/push/vapid-public-key');
    const keyData = await safeParseResponse(keyRes);
    const vapidPublicKey = keyData.publicKey;

    if (!vapidPublicKey) {
      throw new Error('VAPID public key missing from server.');
    }

    const convertedKey = urlBase64ToUint8Array(vapidPublicKey);

    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedKey
      });
    }

    // Save subscription to backend PostgreSQL
    const subJSON = subscription.toJSON();
    const saveRes = await apiFetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        endpoint: subJSON.endpoint,
        keys: subJSON.keys
      })
    });

    const saveData = await safeParseResponse(saveRes);
    return { success: true, data: saveData };
  } catch (err) {
    console.error('Failed to subscribe user to push notifications:', err);
    return { success: false, error: err.message };
  }
}
