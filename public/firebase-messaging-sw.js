// Firebase Cloud Messaging Service Worker for DisasterShield
// Handles background emergency broadcasts, evacuation sirens, and weather bulletins.

importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

// Initialize Firebase in Service Worker
firebase.initializeApp({
  apiKey: "AIzaSyFakeKeyForDemonstrationEnvironment999",
  authDomain: "disastershield-demo.firebaseapp.com",
  projectId: "disastershield-demo",
  storageBucket: "disastershield-demo.appspot.com",
  messagingSenderId: "102938475610",
  appId: "1:102938475610:web:abcdef1234567890"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background emergency broadcast:', payload);
  
  const notificationTitle = payload.notification?.title || '🚨 EMERGENCY ALERT - DisasterShield';
  const notificationOptions = {
    body: payload.notification?.body || 'New high-risk disaster event reported in your vicinity.',
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    vibrate: [200, 100, 200, 100, 400],
    requireInteraction: true,
    data: payload.data
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
