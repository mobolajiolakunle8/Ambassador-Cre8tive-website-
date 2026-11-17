// Generated at Vercel build time from Firebase environment variables.
import { initializeApp, getApps, getApp } from 'https://www.gstatic.com/firebasejs/12.8.0/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/12.8.0/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js';

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
export const BOOKING_URL = __BOOKING_URL__;
export const WHATSAPP_NUMBER = __WHATSAPP_NUMBER__;
export const PUBLIC_SITE_URL = __PUBLIC_SITE_URL__;
export const GOOGLE_BUSINESS_PROFILE_URL = __GOOGLE_BUSINESS_PROFILE_URL__;
export const GOOGLE_SITE_VERIFICATION = __GOOGLE_SITE_VERIFICATION__;
export const APP_CHECK_SITE_KEY = __FIREBASE_APP_CHECK_SITE_KEY__;
export const VERCEL_ANALYTICS_ENABLED = __VERCEL_ANALYTICS_ENABLED__;

export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Analytics is optional and loaded separately so privacy tools never block authentication,
// Firestore, or the public portfolio.
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
// Once configured, Firebase can enforce App Check for Firestore requests.
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
