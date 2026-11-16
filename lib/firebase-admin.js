import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const clean = (value = '') => String(value).trim();

export class ConfigurationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ConfigurationError';
  }
}

const readServiceAccount = () => {
  const raw = clean(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
  if (!raw) throw new ConfigurationError('Firebase Admin credentials are not configured.');
  try {
    const account = JSON.parse(raw);
    if (!account.project_id || !account.client_email || !account.private_key) {
      throw new Error('Required service account fields are missing.');
    }
    // Vercel environment fields sometimes contain literal backslash-n characters.
    account.private_key = account.private_key.replace(/\\n/g, '\n');
    return account;
  } catch {
    throw new ConfigurationError('FIREBASE_SERVICE_ACCOUNT_JSON is not valid service-account JSON.');
  }
};

export const firebaseAdmin = () => {
  const app = getApps()[0] || initializeApp({ credential: cert(readServiceAccount()) });
  return { app, auth: getAuth(app), db: getFirestore(app) };
};

export const bearerToken = (request) => {
  const header = String(request.headers?.authorization || '');
  return header.match(/^Bearer\s+(.+)$/i)?.[1]?.trim() || '';
};

export const requireApprovedAdmin = async (request) => {
  const token = bearerToken(request);
  if (!token) {
    const error = new Error('Authentication is required.');
    error.statusCode = 401;
    throw error;
  }
  const { auth, db } = firebaseAdmin();
  try {
    const decoded = await auth.verifyIdToken(token);
    const approvedEmail = clean(process.env.FIREBASE_ADMIN_EMAIL).toLowerCase();
    if (!approvedEmail || decoded.email?.toLowerCase() !== approvedEmail || decoded.email_verified !== true) {
      const error = new Error('This account is not approved for this action.');
      error.statusCode = 403;
      throw error;
    }
    return { decoded, db, auth };
  } catch (error) {
    if (error.statusCode) throw error;
    const forbidden = new Error('Authentication could not be verified.');
    forbidden.statusCode = 401;
    throw forbidden;
  }
};

export const safeSiteUrl = () => {
  const raw = clean(process.env.PUBLIC_SITE_URL);
  if (!raw) throw new ConfigurationError('PUBLIC_SITE_URL is required for this email action.');
  try {
    const url = new URL(raw);
    if (!['https:', 'http:'].includes(url.protocol)) throw new Error('Unsupported URL protocol.');
    return url.toString().replace(/\/$/, '');
  } catch {
    throw new ConfigurationError('PUBLIC_SITE_URL must be an absolute HTTP(S) URL.');
  }
};
