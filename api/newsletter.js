import { createHash, timingSafeEqual } from 'node:crypto';
import { FieldPath, FieldValue } from 'firebase-admin/firestore';
import { ConfigurationError, bearerToken, firebaseAdmin, requireApprovedAdmin, safeSiteUrl } from '../lib/firebase-admin.js';
import { newsletterActionToken } from '../lib/newsletter-links.js';

const BATCH_SIZE = 100;
const clean = (value, maximum = 1000) => String(value || '').trim().slice(0, maximum);
const oneLine = (value, maximum = 180) => clean(value, maximum).replace(/[\r\n]+/g, ' ');
const isEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const parseBody = (request) => {
  if (request.body && typeof request.body === 'object') return request.body;
  if (!request.body) return {};
  try { return JSON.parse(request.body); } catch { return {}; }
};

const unsubscribeApiUrl = (siteUrl, email) => `${siteUrl}/api/unsubscribe?email=${encodeURIComponent(email)}&token=${encodeURIComponent(newsletterActionToken('unsubscribe', email))}`;
const unsubscribePageUrl = (siteUrl, email) => `${siteUrl}/unsubscribe.html?email=${encodeURIComponent(email)}&token=${encodeURIComponent(newsletterActionToken('unsubscribe', email))}`;

const safeEquals = (first, second) => {
  const a = Buffer.from(String(first));
  const b = Buffer.from(String(second));
  return a.length === b.length && timingSafeEqual(a, b);
};

const newsletterOperator = async (request) => {
  const cronSecret = clean(process.env.CRON_SECRET, 1000);
  const token = bearerToken(request);
  if (cronSecret && token && safeEquals(token, cronSecret)) {
    return { db: firebaseAdmin().db, requestedBy: 'scheduled-task', scheduled: true };
  }
  const { db, decoded } = await requireApprovedAdmin(request);
  return { db, requestedBy: decoded.email, scheduled: false };
};

const campaignData = (body) => ({
  subject: oneLine(body.subject, 180),
  previewText: oneLine(body.previewText, 260),
  html: clean(body.html, 60000),
});

const sendBatch = async ({ campaign, campaignId, db }) => {
  const apiKey = clean(process.env.RESEND_API_KEY, 300);
  const from = oneLine(process.env.CONTACT_FROM_EMAIL, 254);
  const siteUrl = safeSiteUrl();
  if (!apiKey || !from) throw new ConfigurationError('Resend server credentials are not configured.');

  let query = db.collection('subscribers')
    .where('status', '==', 'subscribed')
    .orderBy(FieldPath.documentId())
    .limit(BATCH_SIZE + 1);
  if (campaign.cursor) query = query.startAfter(campaign.cursor);
  const snapshot = await query.get();
  const docs = snapshot.docs.slice(0, BATCH_SIZE);
  const hasMore = snapshot.docs.length > BATCH_SIZE;
  if (!docs.length) {
    await db.collection('newsletterCampaigns').doc(campaignId).set({
      status: 'completed',
      completedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
    return { sentCount: 0, hasMore: false, completed: true };
  }

  const recipients = docs.map((document) => clean(document.data().email || document.id, 254).toLowerCase()).filter(isEmail);
  if (!recipients.length) throw new Error('No valid subscribed recipient addresses were found.');
  const batchCursor = docs[docs.length - 1].id;
  const chunkKey = createHash('sha256').update(`${campaignId}:${campaign.cursor || 'start'}:${batchCursor}`).digest('hex').slice(0, 48);
  const messages = recipients.map((email) => {
    const apiUrl = unsubscribeApiUrl(siteUrl, email);
    const pageUrl = unsubscribePageUrl(siteUrl, email);
    const footer = `<hr style="border:0;border-top:1px solid #e2e5df;margin:28px 0 16px" /><p style="font-family:Arial,sans-serif;color:#596166;font-size:12px;line-height:1.5">You are receiving this because you subscribed to Ambassador Cre8tive creative notes. <a href="${pageUrl}" style="color:#536700">Unsubscribe</a>.</p>`;
    return {
      from,
      to: [email],
      subject: campaign.subject,
      html: `${campaign.html}${footer}`,
      text: `${campaign.previewText || campaign.subject}\n\nTo unsubscribe: ${pageUrl}`,
      headers: {
        'List-Unsubscribe': `<${apiUrl}>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      },
    };
  });

  const resend = await fetch('https://api.resend.com/emails/batch', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Idempotency-Key': `ambassador-newsletter-${chunkKey}`,
    },
    body: JSON.stringify(messages),
  });
  if (!resend.ok) throw new Error(`Resend returned ${resend.status}`);

  await db.collection('newsletterCampaigns').doc(campaignId).set({
    cursor: batchCursor,
    status: hasMore ? 'sending' : 'completed',
    recipientCount: FieldValue.increment(recipients.length),
    lastBatchSentAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    ...(hasMore ? {} : { completedAt: FieldValue.serverTimestamp() }),
  }, { merge: true });
  return { sentCount: recipients.length, hasMore, completed: !hasMore };
};

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return response.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = parseBody(request);
    const operator = await newsletterOperator(request);
    const campaignId = clean(body.campaignId, 160);
    let campaign;
    let activeCampaignId = campaignId;

    if (campaignId) {
      const existing = await operator.db.collection('newsletterCampaigns').doc(campaignId).get();
      if (!existing.exists) return response.status(404).json({ error: 'Newsletter campaign not found.' });
      campaign = existing.data() || {};
      if (!campaign.subject || !campaign.html || campaign.status === 'completed') {
        return response.status(409).json({ error: 'This newsletter campaign is already complete or invalid.' });
      }
    } else {
      if (operator.scheduled) return response.status(400).json({ error: 'A scheduled task may only continue an existing campaign.' });
      campaign = campaignData(body);
      if (!campaign.subject || !campaign.html) return response.status(400).json({ error: 'A subject and email content are required.' });
      const created = operator.db.collection('newsletterCampaigns').doc();
      activeCampaignId = created.id;
      await created.set({
        ...campaign,
        cursor: '',
        status: 'sending',
        recipientCount: 0,
        requestedBy: operator.requestedBy,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    }

    const result = await sendBatch({ campaign, campaignId: activeCampaignId, db: operator.db });
    return response.status(200).json({ campaignId: activeCampaignId, ...result });
  } catch (error) {
    const status = error.statusCode || (error instanceof ConfigurationError ? 503 : 502);
    return response.status(status).json({
      error: status === 401 || status === 403
        ? error.message
        : 'Newsletter delivery could not be completed. Check the secure server configuration and try again.',
    });
  }
}
