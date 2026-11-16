import { FieldValue } from 'firebase-admin/firestore';
import { ConfigurationError, firebaseAdmin } from '../lib/firebase-admin.js';
import { newsletterActionTokenMatches } from '../lib/newsletter-links.js';

const clean = (value, maximum = 1000) => String(value || '').trim().slice(0, maximum);
const isEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const parseBody = (request) => {
  if (request.body && typeof request.body === 'object') return request.body;
  if (!request.body) return {};
  try { return JSON.parse(request.body); }
  catch { return Object.fromEntries(new URLSearchParams(String(request.body))); }
};

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return response.status(405).json({ error: 'Method not allowed' });
  }

  const body = parseBody(request);
  const email = clean(request.query?.email || body.email, 254).toLowerCase();
  const token = clean(request.query?.token || body.token, 512);
  const oneClick = String(body['List-Unsubscribe'] || body.listUnsubscribe || '').toLowerCase() === 'one-click';
  let validToken = false;
  try { validToken = isEmail(email) && Boolean(token) && newsletterActionTokenMatches('unsubscribe', email, token); }
  catch (error) {
    if (error instanceof ConfigurationError) return response.status(503).json({ error: 'Unsubscribe service is not configured.' });
  }
  if (!validToken) return response.status(400).json({ error: 'This unsubscribe link is invalid or has expired.' });

  try {
    const { db } = firebaseAdmin();
    await db.collection('subscribers').doc(email).set({
      email,
      status: 'unsubscribed',
      unsubscribedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
    if (oneClick) return response.status(204).end();
    return response.status(200).json({ unsubscribed: true });
  } catch (error) {
    if (error instanceof ConfigurationError) return response.status(503).json({ error: 'Unsubscribe service is not configured.' });
    return response.status(503).json({ error: 'We could not update this subscription. Please try again shortly.' });
  }
}
