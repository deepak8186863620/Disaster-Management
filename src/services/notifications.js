import { messaging, isLiveFirebaseConfigured } from "./firebase";
import { getToken, onMessage } from "firebase/messaging";

export const requestNotificationPermission = async () => {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return { status: "unsupported" };
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      let fcmToken = null;
      if (isLiveFirebaseConfigured && messaging) {
        try {
          fcmToken = await getToken(messaging, {
            vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY || "BIaVapidKeyDemo12345"
          });
        } catch (tokenErr) {
          console.warn("FCM Token retrieval notice:", tokenErr.message);
        }
      }
      return { status: "granted", token: fcmToken };
    }
    return { status: permission };
  } catch (error) {
    console.error("Error requesting notification permission:", error);
    return { status: "error", error: error.message };
  }
};

export const onForegroundMessageListener = (callback) => {
  if (isLiveFirebaseConfigured && messaging) {
    return onMessage(messaging, (payload) => {
      callback(payload);
    });
  }
  return () => {};
};
