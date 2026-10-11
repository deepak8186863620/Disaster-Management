import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile 
} from "firebase/auth";
import { 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager,
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  serverTimestamp 
} from "firebase/firestore";
import { getMessaging, isSupported } from "firebase/messaging";

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyFakeKeyForDemonstrationEnvironment999",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "disastershield-demo.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "disastershield-demo",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "disastershield-demo.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "102938475610",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:102938475610:web:abcdef1234567890",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-DEMO12345"
};

// Check if valid Firebase credentials are provided or if running in demo fallback mode
export const isLiveFirebaseConfigured = Boolean(
  import.meta.env.VITE_FIREBASE_API_KEY &&
  !import.meta.env.VITE_FIREBASE_API_KEY.includes("FakeKey") &&
  import.meta.env.VITE_FIREBASE_PROJECT_ID
);

let app = null;
let auth = null;
let db = null;
let messaging = null;

try {
  app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  auth = getAuth(app);
  
  // Initialize Firestore with persistent multi-tab offline cache
  try {
    db = initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager()
      })
    });
  } catch (cacheErr) {
    console.warn("Firestore offline cache initialization notice:", cacheErr.message);
    db = initializeFirestore(app, {});
  }

  // Safe FCM initialization
  if (typeof window !== "undefined") {
    isSupported().then((supported) => {
      if (supported && isLiveFirebaseConfigured) {
        messaging = getMessaging(app);
      }
    }).catch(() => {
      // FCM not supported or blocked in insecure context
    });
  }
} catch (error) {
  console.warn("Firebase initialization in simulated mode:", error.message);
}

export { 
  app, 
  auth, 
  db, 
  messaging,
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  serverTimestamp,
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile
};
