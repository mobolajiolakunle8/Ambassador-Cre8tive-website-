import { FieldValue } from 'firebase-admin/firestore';
import { ConfigurationError, firebaseAdmin } from '../lib/firebase-admin.js';

const clean = (value, maximum = 1000) => String(value || '').trim().slice(0, maximum);
const oneLine = (value, maximum = 180) => clean(value, maximum).replace(/[\r\n]+/g, ' ');
const escapeHtml = (value) => clean(value, 5000)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');
const isEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const recordIdIsSafe = (value) => /^[A-Za-z0-9_-]{1,160}$/.test(value);

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

  const { enquiryId } = parseBody(request);
  if (!recordIdIsSafe(enquiryId)) return response.status(400).json({ error: 'A valid enquiry record is required.' });

  // Do nothing until all notification credentials are configured. The browser has already
  // captured the lead directly in Firestore, which remains the system of record.
  const apiKey = clean(process.env.RESEND_API_KEY, 300);
  const destination = clean(process.env.CONTACT_NOTIFICATION_EMAIL, 254);
  const from = oneLine(process.env.CONTACT_FROM_EMAIL, 254);
  if (!apiKey || !isEmail(destination) || !from) {
    return response.status(202).json({ queued: false, reason: 'Email notifications are not configured.' });
  }

  try {
    const { db } = firebaseAdmin();
    const reference = db.collection('enquiries').doc(enquiryId);
    const snapshot = await reference.get();
    if (!snapshot.exists) return response.status(404).json({ error: 'Enquiry record not found.' });
    const enquiry = snapshot.data() || {};

    // A caller cannot invent arbitrary notification content: only the stored Firestore brief
    // is emailed. This also stops repeated client retries after a successful send.
    if (enquiry.notificationSentAt) return response.status(200).json({ queued: true, duplicate: true });
    if (!isEmail(enquiry.email) || !clean(enquiry.name, 120) || !clean(enquiry.message, 3000)) {
      return response.status(422).json({ error: 'The saved enquiry is incomplete.' });
    }

    const rows = [
      ['Name', enquiry.name], ['Email', enquiry.email], ['Business', enquiry.business],
      ['Business type', enquiry.businessType], ['Service', enquiry.service], ['Timeline', enquiry.timeline],
      ['Budget', enquiry.budget], ['Website / reference', enquiry.website], ['Related project', enquiry.project],
      ['Firestore record', enquiryId],
    ].filter(([, value]) => clean(value)).map(([label, value]) => (
      `<tr><th align="left" style="padding:4px 14px 4px 0">${escapeHtml(label)}</th><td style="padding:4px 0">${escapeHtml(value)}</td></tr>`
    )).join('');

    const resend = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from,
        to: [destination],
        reply_to: [clean(enquiry.email, 254)],
        subject: `New Ambassador Cre8tive enquiry — ${oneLine(enquiry.name, 120)}`,
        html: `<div style="font-family:Arial,sans-serif;color:#10171e"><h1>New project brief</h1><table>${rows}</table><h2>Project details</h2><p style="white-space:pre-wrap">${escapeHtml(enquiry.message)}</p></div>`,
      }),
    });
    if (!resend.ok) throw new Error(`Resend returned ${resend.status}`);
    await reference.set({ notificationSentAt: FieldValue.serverTimestamp() }, { merge: true });
    return response.status(200).json({ queued: true });
  } catch (error) {
    if (error instanceof ConfigurationError) return response.status(503).json({ error: 'Email notifications need secure server configuration.' });
    // Do not reveal provider or database details to a public caller. The Firestore lead remains saved.
    return response.status(202).json({ queued: false });
  }
}
