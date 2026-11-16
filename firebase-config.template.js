// Generated at Vercel build time from Firebase environment variables.
import { initializeApp, getApps, getApp } from 'https://www.gstatic.com/firebasejs/12.8.0/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/12.8.0/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js';
import { getStorage } from 'https://www.gstatic.com/firebasejs/12.8.0/firebase-storage.js';

export const firebaseConfig = {
  apiKey: __FIREBASE_API_KEY__,
  authDomain: __FIREBASE_AUTH_DOMAIN__,
  projectId: __FIREBASE_PROJECT_ID__,
  storageBucket: __FIREBASE_STORAGE_BUCKET__,
  messagingSenderId: __FIREBASE_MESSAGING_SENDER_ID__,
  appId: __FIREBASE_APP_ID__,
  measurementId: __FIREBASE_MEASUREMENT_ID__,
};

export const ADMIN_EMAIL = __FIREBASE_ADMIN_EMAIL__;
export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Analytics is optional and loaded separately so privacy tools never block authentication,
// Firestore, Storage, or the public portfolio.
export let analytics = null;
if (typeof window !== 'undefined') {
  import('https://www.gstatic.com/firebasejs/12.8.0/firebase-analytics.js')
    .then(({ getAnalytics, isSupported }) => isSupported().then((supported) => {
      if (supported) analytics = getAnalytics(app);
    }))
    .catch(() => {});
}

export const isApprovedAdmin = (user) => Boolean(
  user
  && user.email
  && user.email.toLowerCase() === ADMIN_EMAIL
  && user.emailVerified
);
