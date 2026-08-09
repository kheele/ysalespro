import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import type { App } from 'firebase-admin/app';

let app: App | null = null;

function ensureFirebaseInitialized() {
  if (app) return;

  if (getApps().length) {
    app = getApps()[0];
  } else {
    const serviceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID!,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n")!,
    };

    app = initializeApp({
      credential: cert(serviceAccount),
    });
  }
}

const adminAuth = () => { ensureFirebaseInitialized(); return getAuth(app!); }

export { adminAuth };