import { FieldValue } from 'firebase-admin/firestore';
import { ConfigurationError, firebaseAdmin, safeSiteUrl } from '../lib/firebase-admin.js';
import { newsletterActionToken } from '../lib/newsletter-links.js';

const clean = (value, maximum = 1000) => String(value || '').trim().slice(0, maximum);
const isEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const parseBody = (request) => {
  if (request.body && typeof request.body === 'object') return request.body;
  if (!request.body) return {};
  try { return JSON.parse(request.body); } catch { return {}; }
};
const sentRecently = (timestamp) => {
  const date = timestamp?.toDate?.();
  return date && (Date.now() - date.getTime()) < 5 * 60 * 1000;
};

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return response.status(405).json({ error: 'Method not allowed' });
  }
  const email = clean(parseBody(request).email, 254).toLowerCase();
  if (!isEmail(email)) return response.status(400).json({ error: 'A valid email address is required.' });

  try {
    const apiKey = clean(process.env.RESEND_API_KEY, 300);
    const from = clean(process.env.CONTACT_FROM_EMAIL, 254).replace(/[\r\n]+/g, ' ');
    const siteUrl = safeSiteUrl();
    if (!apiKey || !from) throw new ConfigurationError('Confirmation email is not configured.');
    const { db } = firebaseAdmin();
    const reference = db.collection('subscribers').doc(email);
    const snapshot = await reference.get();
    if (!snapshot.exists) return response.status(202).json({ confirmationSent: false, unavailable: true });
    const subscriber = snapshot.data() || {};
    if (subscriber.status === 'subscribed') return response.status(200).json({ alreadyConfirmed: true });
    if (subscriber.status !== 'pending') return response.status(202).json({ confirmationSent: false, unavailable: true });
    if (sentRecently(subscriber.confirmationSentAt)) return response.status(202).json({ confirmationSent: true, cooldown: true });

    const token = newsletterActionToken('confirm', email);
    const confirmationUrl = `${siteUrl}/confirm-subscription.html?email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}`;
    const resend = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from,
        to: [email],
        subject: 'Confirm your Ambassador Cre8tive creative notes subscription',
        html: `<div style="font-family:Arial,sans-serif;color:#10171e;line-height:1.55"><h1>One quick confirmation</h1><p>You asked to receive occasional creative notes from Ambassador Cre8tive.</p><p><a href="${confirmationUrl}" style="display:inline-block;padding:12px 18px;background:#c9f31d;color:#10171e;font-weight:700;text-decoration:none">Confirm subscription</a></p><p style="font-size:12px;color:#596166">If you did not make this request, you can ignore this email.</p></div>`,
        text: `You asked to receive occasional creative notes from Ambassador Cre8tive. Confirm your subscription: ${confirmationUrl}\n\nIf you did not make this request, ignore this email.`,
      }),
    });
    if (!resend.ok) throw new Error(`Resend returned ${resend.status}`);
    await reference.set({ confirmationSentAt: FieldValue.serverTimestamp() }, { merge: true });
    return response.status(200).json({ confirmationSent: true });
  } catch (error) {
    if (error instanceof ConfigurationError) return response.status(503).json({ error: 'Newsletter confirmation is not configured.' });
    return response.status(502).json({ error: 'We could not send the confirmation email. Please try again shortly.' });
  }
}
