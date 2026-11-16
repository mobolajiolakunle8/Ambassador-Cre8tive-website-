import { FieldValue } from 'firebase-admin/firestore';
import { ConfigurationError, firebaseAdmin } from '../lib/firebase-admin.js';
import { newsletterActionTokenMatches } from '../lib/newsletter-links.js';

const clean = (value, maximum = 1000) => String(value || '').trim().slice(0, maximum);
const isEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const parseBody = (request) => {
  if (request.body && typeof request.body === 'object') return request.body;
  if (!request.body) return {};
  try { return JSON.parse(request.body); } catch { return {}; }
};

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return response.status(405).json({ error: 'Method not allowed' });
  }
  const body = parseBody(request);
  const email = clean(request.query?.email || body.email, 254).toLowerCase();
  const token = clean(request.query?.token || body.token, 512);
  let validToken = false;
  try { validToken = isEmail(email) && Boolean(token) && newsletterActionTokenMatches('confirm', email, token); }
  catch (error) {
    if (error instanceof ConfigurationError) return response.status(503).json({ error: 'Subscription confirmation is not configured.' });
  }
  if (!validToken) return response.status(400).json({ error: 'This confirmation link is invalid or has expired.' });

  try {
    const { db } = firebaseAdmin();
    const reference = db.collection('subscribers').doc(email);
    const snapshot = await reference.get();
    if (!snapshot.exists) return response.status(404).json({ error: 'This subscription request was not found.' });
    const subscriber = snapshot.data() || {};
    if (subscriber.status === 'unsubscribed') return response.status(409).json({ error: 'This address is currently unsubscribed.' });
    if (subscriber.status !== 'subscribed') {
      await reference.set({
        status: 'subscribed',
        confirmedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });
    }
    return response.status(200).json({ subscribed: true });
  } catch (error) {
    if (error instanceof ConfigurationError) return response.status(503).json({ error: 'Subscription confirmation is not configured.' });
    return response.status(503).json({ error: 'We could not confirm your subscription. Please try again shortly.' });
  }
}
