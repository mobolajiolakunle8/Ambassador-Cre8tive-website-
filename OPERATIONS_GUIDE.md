# Ambassador Cre8tive — Growth, safety, and operations guide

This site keeps public portfolio content and private lead data in Firebase project `website-f3cc6`. It does not claim client proof, performance results, or testimonials unless the administrator adds verified material.

## Before production launch

1. **Firebase authentication**
   - In Firebase Console → Authentication → Sign-in method, enable **Email/Password**.
   - Open `/admin.html`, create the approved account for `mobolajiolakunle8@gmail.com`, and verify its email.
   - Deploy the rules in this folder before accepting real submissions:
     ```bash
     npm ci
     npx firebase-tools@13.18.0 deploy --only firestore:rules,database --project website-f3cc6
     ```
   - Firestore rules allow only that verified email to read enquiry and newsletter data. If older published Firebase Storage image links must remain available, deploy its read-only compatibility rule separately with `npx firebase-tools@13.18.0 deploy --only storage --project website-f3cc6`.

2. **Firestore and public image links**
   - Create Firestore in production mode. The portfolio does not upload images to Cloud Storage; its narrow read-only rule is only for older published Firebase Storage image links, if any.
   - The dashboard holds leads in `enquiries`, newsletter consents in `subscribers`, and case studies in `projects`.
   - For each project image, use a durable public `https://` image URL; the dashboard previews and validates it before saving. Existing starter `assets/...` paths remain valid.
   - The site does not require Realtime Database. Its rules deliberately deny every read and write.

3. **App Check**
   - Register the production domain in Firebase App Check using reCAPTCHA v3 or Enterprise.
   - Put the public site key in `FIREBASE_APP_CHECK_SITE_KEY` in Vercel and deploy.
   - Test authentication, portfolio reads, forms, and public image links first. Enforce App Check for Firestore after those tests pass.

4. **Vercel environment values**
   - Add every value from `.env.production` to Vercel Project Settings → Environment Variables.
   - `FIREBASE_*`, `BOOKING_URL`, `WHATSAPP_NUMBER`, `PUBLIC_SITE_URL`, Google verification, App Check site key, analytics flag, and `WEB3FORMS_ACCESS_KEY` are public build-time values. The Web3Forms value is a browser-visible form identifier by design; never substitute a private Web3Forms dashboard API key.
   - Never enter `FIREBASE_SERVICE_ACCOUNT_JSON`, `RESEND_API_KEY`, `CRON_SECRET`, or `NEWSLETTER_UNSUBSCRIBE_SECRET` into browser JavaScript, Git, or public static output.
   - `.vercelignore` blocks all `.env` files from deployment upload; Vercel’s encrypted environment settings are the production source for secrets.
   - Create a least-privilege Firebase service account only for the Vercel server functions, place its one-line JSON in `FIREBASE_SERVICE_ACCOUNT_JSON`, and rotate it if it is ever exposed. Never add this JSON to any downloadable public site asset.

5. **Local search**
   - Set `PUBLIC_SITE_URL` to the final canonical HTTPS domain. The Vercel build will add canonical tags and a sitemap.
   - Add `GOOGLE_SITE_VERIFICATION` after Search Console gives you the verification token.
   - Create or claim a Google Business Profile only using the real service details and address/service-area policy. Then set `GOOGLE_BUSINESS_PROFILE_URL`.
   - Submit `/sitemap.xml` in Search Console. Do not publish fake reviews, ratings, locations, awards, client logos, or results.

## Lead workflow

- A project brief is delivered directly to the Ambassador Cre8tive inbox through Web3Forms. After a successful delivery, the browser also attempts to keep a private CRM copy in Firestore as `enquiries/{id}`.
- The public website can create an enquiry but cannot read it. The verified admin dashboard can move a saved CRM copy through **New → Contacted → Proposal → Won / Closed** and store private internal notes.
- A hidden honeypot filters simple automated form submissions. It is not a replacement for monitoring, App Check, or provider-side anti-abuse controls.
- The user gets an email-client fallback if Web3Forms is unavailable or has not been configured.

### Web3Forms form delivery

Set `WEB3FORMS_ACCESS_KEY` in the Vercel environment for each deployed environment. The build writes it to `web3forms-config.js`, because Web3Forms access keys are public form identifiers intended to run in the browser. Do not place a private Web3Forms dashboard API key in that variable.

In the Web3Forms dashboard, verify the destination inbox, configure any available production-domain restriction and spam protection, and send a real test brief. The contact form sets a useful subject and reply-to address while retaining only the fields the visitor submitted. Web3Forms receives the individual contact brief and creative-notes request; it is not granted access to Firebase or dashboard data.

## Booking and WhatsApp

- Set `BOOKING_URL` to a real calendar booking page to reveal direct booking links.
- `WHATSAPP_NUMBER` is configured as the Nigerian international business number `2349030192034`. A WhatsApp action appears only while a number is configured and uses WhatsApp’s official `https://api.whatsapp.com/send` Click to Chat destination with URL-encoded prefilled copy.
- These actions are tracked as conversion events but remain optional visitor choices.

## Analytics and conversion measurement

Firebase Analytics initializes without blocking the website. The site logs:

- `generate_lead` after a private Firestore enquiry copy is saved;
- `newsletter_request_sent` after a creative-notes request is sent through Web3Forms and a pending record is captured;
- `sign_up` only when the optional signed newsletter-confirmation workflow is enabled and a recipient confirms consent;
- `contact` for email, phone, and WhatsApp actions;
- `schedule` for booking-link actions.

When `VERCEL_ANALYTICS_ENABLED=true`, the public integration bootstrap also loads Vercel’s Web Analytics endpoint and mirrors the non-sensitive conversion events to Vercel’s event queue. Enable Web Analytics in the Vercel project dashboard before relying on that data. Firebase Analytics remains the active event channel outside Vercel. Review privacy requirements, consent obligations, and cookie disclosures applicable to your audience before enabling tracking.

## Creative-notes requests and optional newsletter delivery

- The public creative-notes form sends a **notification request** to the Ambassador Cre8tive inbox through Web3Forms. It also makes a best-effort private `pending` record in `subscribers` for the verified administrator.
- A Web3Forms notification request is **not** a deliverable newsletter subscription. Do not add an address to a campaign solely because it arrived through the public form. Follow up and obtain the appropriate consent before any marketing delivery.
- The Audience workspace separates pending newsletter requests from verified subscribers. Pending requests are not included in campaign delivery.
- The existing signed opt-in and delivery routes remain available only for a later, separately configured consent-based workflow: `api/newsletter-confirmation.js` sends a signed confirmation link, `api/confirm-subscription.js` changes a verified record to `subscribed`, and `api/newsletter.js` sends a Resend campaign in batches with signed unsubscribe handling.
- Before enabling that optional campaign workflow, set `RESEND_API_KEY`, `CONTACT_FROM_EMAIL`, `FIREBASE_SERVICE_ACCOUNT_JSON`, `PUBLIC_SITE_URL`, and a unique `NEWSLETTER_UNSUBSCRIBE_SECRET` of at least 32 random characters. Set `CRON_SECRET` as well if a server-side scheduled task will continue an existing campaign.
- Do not send campaigns until you have a privacy notice, a lawful consent basis, a tested unsubscribe route, and a sender domain verified in the delivery provider. Send a real test campaign to a consenting internal address first.

## Testimonials and client proof

Only add a testimonial to a project when you have the exact client-approved quote and attribution. Leave those fields blank otherwise; public testimonial components remain hidden. For client logos, project outcomes, metrics, awards, or named case studies, obtain written permission and record the source/approval date in your internal workflow.

## Backups and recovery

1. Enable billing if needed for scheduled Firestore export functionality.
2. Schedule periodic Firestore exports to a private Cloud Storage backup bucket using Firebase/Google Cloud documented export tooling.
3. Keep at least one tested restore procedure. An export is not a recovery plan until it has been restored in a non-production project.
4. Maintain a separate approved original-asset archive and record the source/rights status of each externally hosted project image.
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

- submit a real test brief and creative-notes request; confirm each reaches the Web3Forms inbox and that any Firebase CRM/request copies remain visible only to the administrator;
- verify published projects are public while drafts remain private;
- verify an anonymous visitor cannot read `/enquiries` or `/subscribers`;
- save and preview a public HTTPS project-image link as the verified administrator;
- test the Resend notification if enabled;
- test the canonical URL, sitemap, robots file, Search Console verification, WhatsApp, and booking links;
- re-check App Check before enforcing it.
