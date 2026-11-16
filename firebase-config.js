// Firebase client configuration for Ambassador Cre8tive.
// Firebase web configuration values are identifiers, not private server credentials.
import { initializeApp, getApps, getApp } from 'https://www.gstatic.com/firebasejs/12.8.0/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/12.8.0/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js';
import { getStorage } from 'https://www.gstatic.com/firebasejs/12.8.0/firebase-storage.js';

export const firebaseConfig = {
  apiKey: 'AIzaSyANr_6DPADypenvccMG3Fl9i1WSl4SqyTs',
  authDomain: 'website-f3cc6.firebaseapp.com',
  projectId: 'website-f3cc6',
  storageBucket: 'website-f3cc6.firebasestorage.app',
  messagingSenderId: '701579929185',
  appId: '1:701579929185:web:3fa00922c71235b1f0ac20',
  measurementId: 'G-8DZ648WY2L',
};

export const ADMIN_EMAIL = 'mobolajiolakunle8@gmail.com';
export const BOOKING_URL = '';
export const WHATSAPP_NUMBER = '2349030192034';
export const PUBLIC_SITE_URL = '';
export const GOOGLE_BUSINESS_PROFILE_URL = '';
export const GOOGLE_SITE_VERIFICATION = '';
export const APP_CHECK_SITE_KEY = '';
// Firebase Hosting/local fallback does not provide Vercel's insights endpoint. The Vercel
// build injects its own value from VERCEL_ANALYTICS_ENABLED in Vercel Project Settings.
export const VERCEL_ANALYTICS_ENABLED = false;

export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Analytics is optional and loaded separately so privacy tools never block authentication,
// Firestore, Storage, or the public portfolio.
export let analytics = null;
let logAnalyticsEvent = null;
if (typeof window !== 'undefined') {
  import('https://www.gstatic.com/firebasejs/12.8.0/firebase-analytics.js')
    .then(({ getAnalytics, isSupported, logEvent }) => isSupported().then((supported) => {
      if (supported) {
        analytics = getAnalytics(app);
        logAnalyticsEvent = logEvent;
      }
    }))
    .catch(() => {});
}

export const trackEvent = (name, parameters = {}) => {
  try {
    if (analytics && logAnalyticsEvent) logAnalyticsEvent(analytics, name, parameters);
    // Vercel Web Analytics uses a queued global in a plain HTML site. Never send visitor
    // names, email addresses, project messages, or other identifying values in this data.
    if (VERCEL_ANALYTICS_ENABLED && typeof window !== 'undefined' && typeof window.va === 'function') {
      const data = Object.fromEntries(Object.entries(parameters)
        .filter(([, value]) => ['string', 'number', 'boolean'].includes(typeof value))
        .slice(0, 8));
      window.va('event', { name: String(name).slice(0, 80), data });
    }
  } catch {
    // Analytics must never interrupt a visitor action.
  }
};

// App Check is optional until a reCAPTCHA v3 site key is registered in Firebase Console.
// Once configured, Firebase can enforce App Check for Firestore and Storage requests.
if (APP_CHECK_SITE_KEY && typeof window !== 'undefined') {
  import('https://www.gstatic.com/firebasejs/12.8.0/firebase-app-check.js')
    .then(({ initializeAppCheck, ReCaptchaV3Provider }) => initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(APP_CHECK_SITE_KEY),
      isTokenAutoRefreshEnabled: true,
    }))
    .catch(() => {});
}

export const isApprovedAdmin = (user) => Boolean(
  user
  && user.email
  && user.email.toLowerCase() === ADMIN_EMAIL
  && user.emailVerified
);
