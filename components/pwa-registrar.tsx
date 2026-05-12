"use client"

import { useEffect } from "react"
import { savePushSubscription } from "@/app/(dashboard)/push/actions"

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function PwaRegistrar() {
  useEffect(() => {
    async function registerPWA() {
      if (!('serviceWorker' in navigator)) return;

      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        
        // Wait for service worker to be ready
        await navigator.serviceWorker.ready;

        // Check if push is supported
        if (!('PushManager' in window)) return;

        const publicVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        if (!publicVapidKey) return;

        // Request notification permission
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') return;

        // Subscribe to push notifications
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
        });

        // Save subscription to the database
        await savePushSubscription(subscription.toJSON());
        
      } catch (error) {
        console.error('PWA Registration/Subscription failed:', error);
      }
    }

    registerPWA();
  }, [])

  return null
}
