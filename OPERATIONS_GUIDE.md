# Ambassador Cre8tive — Growth, safety, and operations guide

This site keeps public portfolio content and private lead data in Firebase project `website-f3cc6`. It does not claim client proof, performance results, or testimonials unless the administrator adds verified material.

## Before production launch

1. **Firebase authentication**
   - In Firebase Console → Authentication → Sign-in method, enable **Email/Password**.
   - Open `/admin.html`, create the approved account for `mobolajiolakunle8@gmail.com`, and verify its email.
   - Deploy the rules in this folder before accepting real submissions:
     ```bash
     npm ci
     npx firebase-tools@13.18.0 deploy --only firestore:rules,storage,database --project website-f3cc6
     ```
   - Firestore rules allow only that verified email to read enquiry and newsletter data.

2. **Firestore and Storage**
   - Create Firestore in production mode and provision Storage in Firebase Console.
   - The dashboard holds leads in `enquiries`, newsletter consents in `subscribers`, and case studies in `projects`.
   - The site does not require Realtime Database. Its rules deliberately deny every read and write.

3. **App Check**
   - Register the production domain in Firebase App Check using reCAPTCHA v3 or Enterprise.
   - Put the public site key in `FIREBASE_APP_CHECK_SITE_KEY` in Vercel and deploy.
   - Test authentication, portfolio reads, forms, and uploads first. Enforce App Check for Firestore and Storage only after those tests pass.

4. **Vercel environment values**
   - Add every value from `.env.production` to Vercel Project Settings → Environment Variables.
   - `FIREBASE_*`, `BOOKING_URL`, `WHATSAPP_NUMBER`, `PUBLIC_SITE_URL`, Google verification, App Check site key, and analytics flag are public build-time values.
   - Never enter `FIREBASE_SERVICE_ACCOUNT_JSON`, `RESEND_API_KEY`, `CRON_SECRET`, or `NEWSLETTER_UNSUBSCRIBE_SECRET` into browser JavaScript, Git, or public static output.
   - `.vercelignore` blocks all `.env` files from deployment upload; Vercel’s encrypted environment settings are the production source for secrets.
   - Create a least-privilege Firebase service account only for the Vercel server functions, place its one-line JSON in `FIREBASE_SERVICE_ACCOUNT_JSON`, and rotate it if it is ever exposed. Never add this JSON to any downloadable public site asset.

5. **Local search**
   - Set `PUBLIC_SITE_URL` to the final canonical HTTPS domain. The Vercel build will add canonical tags and a sitemap.
   - Add `GOOGLE_SITE_VERIFICATION` after Search Console gives you the verification token.
   - Create or claim a Google Business Profile only using the real service details and address/service-area policy. Then set `GOOGLE_BUSINESS_PROFILE_URL`.
   - Submit `/sitemap.xml` in Search Console. Do not publish fake reviews, ratings, locations, awards, client logos, or results.

## Lead workflow

- A project brief is written directly to Firestore as `enquiries/{id}`.
- The public website can create an enquiry but cannot read it. The verified admin dashboard can move it through **New → Contacted → Proposal → Won / Closed** and store private internal notes.
- A hidden honeypot filters simple automated form submissions. It is not a replacement for monitoring, App Check, or server-side anti-abuse controls.
- The user gets an email-client fallback if Firestore is temporarily unavailable.

### Optional email notification

The Vercel `/api/enquiry` route sends a notification only after these Vercel secrets are set:

- `RESEND_API_KEY`
- `CONTACT_NOTIFICATION_EMAIL` (typically `mobolajiolakunle8@gmail.com`)
- `CONTACT_FROM_EMAIL` (a domain/address verified in Resend)
- `FIREBASE_SERVICE_ACCOUNT_JSON` (server-only Firebase Admin service account)

The route fetches the saved Firestore record by ID before emailing it and marks a successful notification, so a caller cannot supply arbitrary email content or repeat a completed notification. The Firestore record remains the source of truth if delivery fails. Test with a genuine sample lead after configuring Resend.

## Booking and WhatsApp

- Set `BOOKING_URL` to a real calendar booking page to reveal direct booking links.
- `WHATSAPP_NUMBER` is already formatted as a Nigerian international number. A WhatsApp action appears only while a number is configured.
- These actions are tracked as conversion events but remain optional visitor choices.

## Analytics and conversion measurement

Firebase Analytics initializes without blocking the website. The site logs:

- `generate_lead` after a Firestore enquiry is saved;
- `newsletter_opt_in_request` after a newsletter confirmation request is saved;
- `sign_up` after a recipient confirms newsletter consent;
- `contact` for email, phone, and WhatsApp actions;
- `schedule` for booking-link actions.

When `VERCEL_ANALYTICS_ENABLED=true`, the public integration bootstrap also loads Vercel’s Web Analytics endpoint and mirrors the non-sensitive conversion events to Vercel’s event queue. Enable Web Analytics in the Vercel project dashboard before relying on that data. Firebase Analytics remains the active event channel outside Vercel. Review privacy requirements, consent obligations, and cookie disclosures applicable to your audience before enabling tracking.

## Newsletter consent and delivery

- Website newsletter forms save only a **pending** email, source, and timestamp in private `subscribers` documents. A subscriber becomes deliverable only after confirming the email link sent by the server; this prevents a public form from adding an unverified address to a campaign.
- `api/newsletter-confirmation.js` sends a signed confirmation link, and `api/confirm-subscription.js` changes that pending record to `subscribed` after the recipient confirms it.
- The administrator dashboard has a deliberate send screen. It verifies the Firebase administrator’s ID token on the server, uses Firebase Admin only server-side, and sends through Resend in batches of up to 100 recipients.
- `api/newsletter.js` creates a server-side campaign record, supports batch continuation after an interruption, and adds a visible signed unsubscribe link plus `List-Unsubscribe` and one-click unsubscribe headers to every message.
- `api/unsubscribe.js` validates the signed token and marks the recipient as `unsubscribed`; unsubscribed records are excluded from subsequent campaign batches.
- Before the first campaign, set `RESEND_API_KEY`, `CONTACT_FROM_EMAIL`, `FIREBASE_SERVICE_ACCOUNT_JSON`, `PUBLIC_SITE_URL`, and a unique `NEWSLETTER_UNSUBSCRIBE_SECRET` of at least 32 random characters. This server-only secret signs both confirmation and unsubscribe links. Set `CRON_SECRET` as well if a server-side scheduled task will continue an existing campaign.
- Do not send campaigns until you have a privacy notice, a lawful consent basis, a tested unsubscribe route, and a sender domain verified in Resend. Send a real test campaign to a consenting internal address first.

## Testimonials and client proof

Only add a testimonial to a project when you have the exact client-approved quote and attribution. Leave those fields blank otherwise; public testimonial components remain hidden. For client logos, project outcomes, metrics, awards, or named case studies, obtain written permission and record the source/approval date in your internal workflow.

## Backups and recovery

1. Enable billing if needed for scheduled Firestore export functionality.
2. Schedule periodic Firestore exports to a private Cloud Storage backup bucket using Firebase/Google Cloud documented export tooling.
3. Keep at least one tested restore procedure. An export is not a recovery plan until it has been restored in a non-production project.
4. Export Storage assets or maintain a separate approved original-asset archive.
5. Record deployments, rule changes, and administrator changes in an operations log.

## Multi-admin readiness

The current Firestore rules intentionally permit only the approved verified email. Before adding another person:

1. Create and verify their Firebase Authentication account.
2. Move authorization from a hard-coded email rule to Firebase custom claims set only by a secured Admin SDK workflow.
3. Test least-privilege roles in a staging project before deploying rules.
4. Keep an owner account separate from daily editorial accounts, enable MFA where available, and remove access promptly when roles change.

Do not simply loosen the current Firestore rules to allow every signed-in user.

## Deployment checks

```bash
npm ci
npm run build:vercel
# Inspect only vercel-static/ before deploying; it must not contain .env files or private keys.
```

After deploying:

- submit a real test brief and confirm it appears only in the admin dashboard;
- verify published projects are public while drafts remain private;
- verify an anonymous visitor cannot read `/enquiries` or `/subscribers`;
- test Storage upload as the verified administrator;
- test the Resend notification if enabled;
- test the canonical URL, sitemap, robots file, Search Console verification, WhatsApp, and booking links;
- re-check App Check before enforcing it.
