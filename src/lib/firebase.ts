// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { Auth, getAuth } from "firebase/auth";
import { getStorage, FirebaseStorage } from "firebase/storage";
import { getMessaging, Messaging } from "firebase/messaging";

import { storage } from "./firebase_from_yeylowmart";

let _app: FirebaseApp | undefined;
let _auth: Auth;
let _storage: FirebaseStorage;
let _messaging: Messaging | null;
console.log("Firebase config", process.env.NEXT_PUBLIC_FIREBASE_API_KEY);

function ensureFirebaseInitialized() {
  // 👇 CRITICAL: Completely halt client-side SDK initialization on the server
  if (typeof window === 'undefined') return;

  if (_app) return;

  if (
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN &&
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID &&
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET &&
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID &&
    process.env.NEXT_PUBLIC_FIREBASE_APP_ID
  ) {
    // Your web app's Firebase configuration
    const firebaseConfig = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
    };

    // Initialize Firebase
    _app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    _auth = getAuth(_app);
    _storage = getStorage(_app);
    _messaging = getMessaging(_app);
  }
}

// Return safe empty object fallbacks during SSR pre-rendering to prevent "property of undefined" app crashes
const app = () => { ensureFirebaseInitialized(); return _app; };
const auth = () => { ensureFirebaseInitialized(); return _auth || ({} as Auth); };
// const storage = () => { ensureFirebaseInitialized(); return _storage || ({} as FirebaseStorage); };
const messaging = () => { ensureFirebaseInitialized(); return _messaging; };

export { app, auth, storage, messaging };
// export * from './firebase-provider';
