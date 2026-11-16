import { createHmac, timingSafeEqual } from 'node:crypto';
import { ConfigurationError } from './firebase-admin.js';

const clean = (value = '') => String(value).trim();

const signingSecret = () => {
  const secret = clean(process.env.NEWSLETTER_UNSUBSCRIBE_SECRET);
  if (secret.length < 32) throw new ConfigurationError('NEWSLETTER_UNSUBSCRIBE_SECRET must be at least 32 characters.');
  return secret;
};

export const newsletterActionToken = (action, email) => createHmac('sha256', signingSecret())
  .update(`${String(action).toLowerCase()}:${String(email).toLowerCase()}`)
  .digest('base64url');

export const newsletterActionTokenMatches = (action, email, receivedToken) => {
  const expected = Buffer.from(newsletterActionToken(action, email));
  const received = Buffer.from(String(receivedToken || ''));
  return received.length === expected.length && timingSafeEqual(received, expected);
};
