# Ambassador Cre8tive — Vercel deployment

This package supports Vercel static deployment and small same-origin Vercel API routes while Firebase provides Authentication, Firestore, and Firebase Analytics. Project images use public HTTPS links rather than Firebase Storage uploads.

## What Vercel serves

Vercel installs production dependencies only, runs `npm run build:vercel`, and deploys the generated `vercel-static/` directory as public pages. The build copies public website files and assets, then generates `firebase-config.js` and the browser-visible `web3forms-config.js` from environment variables. Web3Forms handles individual contact-form and creative-notes request notifications directly from the browser. Vercel also deploys the root `api/` directory as server-side functions for optional signed newsletter confirmation, consent-based campaign delivery, and unsubscribe handling.

The Python preview server, local JSON data, Firebase rules, and environment files are not included in the public Vercel output. The Firebase browser SDK modules are vendored as same-origin public assets, so the admin dashboard does not depend on third-party CDN module imports at page load. The API source is server-side and its private credentials remain Vercel environment variables.

## Configure Vercel environment variables

In **Vercel → Project → Settings → Environment Variables**, add these values for **Production**, **Preview**, and **Development** as appropriate:

| Variable | Value |
| --- | --- |
| `FIREBASE_API_KEY` | `AIzaSyANr_6DPADypenvccMG3Fl9i1WSl4SqyTs` |
| `FIREBASE_AUTH_DOMAIN` | `website-f3cc6.firebaseapp.com` |
| `FIREBASE_PROJECT_ID` | `website-f3cc6` |
| `FIREBASE_STORAGE_BUCKET` | `website-f3cc6.firebasestorage.app` — retained Firebase web config; the portfolio does not upload to it |
| `FIREBASE_MESSAGING_SENDER_ID` | `701579929185` |
| `FIREBASE_APP_ID` | `1:701579929185:web:3fa00922c71235b1f0ac20` |
| `FIREBASE_MEASUREMENT_ID` | `G-8DZ648WY2L` |
| `FIREBASE_ADMIN_EMAIL` | `mobolajiolakunle8@gmail.com` |
| `BOOKING_URL` | Optional public calendar booking URL |
| `WHATSAPP_NUMBER` | Public business number in international digits, e.g. `2349030192034`; it generates official WhatsApp Click to Chat links |
| `PUBLIC_SITE_URL` | Final canonical HTTPS website URL |
| `GOOGLE_BUSINESS_PROFILE_URL` | Optional real Google Business Profile URL |
| `GOOGLE_SITE_VERIFICATION` | Optional Search Console meta-verification token |
| `FIREBASE_APP_CHECK_SITE_KEY` | Optional public reCAPTCHA App Check site key |
| `VERCEL_ANALYTICS_ENABLED` | `true` to load Vercel Web Analytics and mirror non-sensitive conversion events |
| `WEB3FORMS_ACCESS_KEY` | Web3Forms **public form access key** for contact and creative-notes request notifications; it is emitted into browser JavaScript at build time, so never use a private Web3Forms dashboard API key here |
| `RESEND_API_KEY` | **Private** server-side Resend key only if you later enable signed newsletter confirmation or consent-based campaign delivery |
| `CONTACT_NOTIFICATION_EMAIL` | **Private** notification recipient |
| `CONTACT_FROM_EMAIL` | **Private** Resend-verified sender address |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | **Private** Firebase Admin service-account JSON for notification and newsletter functions — never browser code |
| `CRON_SECRET` | **Private** secret protecting scheduled newsletter-batch tasks |
| `NEWSLETTER_UNSUBSCRIBE_SECRET` | **Private** 32+ character signing secret for newsletter confirmation and unsubscribe links |

The `FIREBASE_*` web values marked above as public are Firebase **web configuration values**, not a Firebase service-account credential. `WEB3FORMS_ACCESS_KEY` is also intentionally browser-visible because Web3Forms uses it as a public form identifier; add the supplied Web3Forms access key to Vercel for the environments you deploy, and configure any available Web3Forms domain restriction or spam protection in its dashboard. Add actual private values only in Vercel’s encrypted environment settings. Do not add private dashboard API keys, an admin password, or a service-account JSON file to browser code or Git.

For the rollout and safety checklist, see [`OPERATIONS_GUIDE.md`](OPERATIONS_GUIDE.md). For the Web3Forms environment setup and notification-only creative-notes workflow, see [`WEB3FORMS_SETUP.md`](WEB3FORMS_SETUP.md).

## Deploy with Vercel

### Option 1 — Vercel dashboard

1. Extract the deployment ZIP.
2. Upload or import the extracted folder into a new Vercel project.
3. Add the environment variables above.
4. Vercel detects `vercel.json` automatically.
5. Deploy.
6. In Vercel → Analytics, enable Web Analytics if `VERCEL_ANALYTICS_ENABLED=true`.
7. Submit a real contact brief and a creative-notes request; verify each arrives in the configured Web3Forms inbox, then check `/admin`, booking, WhatsApp, and the private Firebase records. Only test the optional signed confirmation/unsubscribe routes if you later enable the consent-based newsletter delivery service.

### Option 2 — Vercel CLI

```bash
npm install
npx vercel login
npx vercel --prod
```

Before using the CLI, configure the variables in Vercel Project Settings. The included `.vercelignore` deliberately prevents `.env` files from being uploaded.

## Firebase setup remains required

Before the Vercel website can use the portfolio dashboard, deploy the Firebase rules and enable Firebase services:

```bash
npx firebase login
npx firebase deploy --only firestore:rules,database
```

Then enable Email/Password Authentication and Cloud Firestore in Firebase Console. Cloud Storage remains optional; if existing published Firebase Storage image links need compatibility support, deploy its included read-only rule separately with `npx firebase deploy --only storage`. The current portfolio uses public HTTPS image links and makes no Storage uploads. After Vercel deploys, visit `/admin`, create the approved administrator account, verify the email, and add only approved portfolio projects.
