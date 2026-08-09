
// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getStorage, FirebaseStorage } from "firebase/storage";

let _app: FirebaseApp | undefined;
let _storage: FirebaseStorage;

function ensureFirebaseInitialized() {
  // 👇 CRITICAL: Completely halt client-side SDK initialization on the server
  if (typeof window === 'undefined') return;

  if (_app) return;

  if (
    process.env.NEXT_PUBLIC_FROM_YEYLOWMART_FIREBASE_API_KEY &&
    process.env.NEXT_PUBLIC_FROM_YEYLOWMART_FIREBASE_PROJECT_ID &&
    process.env.NEXT_PUBLIC_FROM_YEYLOWMART_FIREBASE_STORAGE_BUCKET &&
    process.env.NEXT_PUBLIC_FROM_YEYLOWMART_FIREBASE_MESSAGING_SENDER_ID &&
    process.env.NEXT_PUBLIC_FROM_YEYLOWMART_FIREBASE_APP_ID
  ) {
    // Your web app's Firebase configuration
    const firebaseConfig = {
      apiKey: process.env.NEXT_PUBLIC_FROM_YEYLOWMART_FIREBASE_API_KEY,
      projectId: process.env.NEXT_PUBLIC_FROM_YEYLOWMART_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FROM_YEYLOWMART_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FROM_YEYLOWMART_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FROM_YEYLOWMART_FIREBASE_APP_ID
    };

    // Initialize Firebase
    const appName = "FROM_YEYLOWMART";

    _app = getApps().some(a => a.name === appName)
      ? getApp(appName)
      : initializeApp(firebaseConfig, appName);
    _storage = getStorage(_app);
  }
}

// Return safe empty object fallbacks during SSR pre-rendering to prevent "property of undefined" app crashes
const storage = () => { ensureFirebaseInitialized(); return _storage || ({} as FirebaseStorage); };

export { storage };
// export * from './firebase-provider';
