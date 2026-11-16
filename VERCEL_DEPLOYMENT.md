# Ambassador Cre8tive — Vercel deployment

This package supports Vercel static deployment while Firebase continues to provide Authentication, Firestore, Storage, and Analytics.

## What Vercel serves

Vercel runs `npm run build:vercel` and deploys the generated `vercel-static/` directory only. The build copies public website files and assets, then generates `firebase-config.js` from environment variables.

The Python preview server, local JSON data, local uploads, Firebase rules, and environment files are not included in the public Vercel output.

## Configure Vercel environment variables

In **Vercel → Project → Settings → Environment Variables**, add these values for **Production**, **Preview**, and **Development** as appropriate:

| Variable | Value |
| --- | --- |
| `FIREBASE_API_KEY` | `AIzaSyANr_6DPADypenvccMG3Fl9i1WSl4SqyTs` |
| `FIREBASE_AUTH_DOMAIN` | `website-f3cc6.firebaseapp.com` |
| `FIREBASE_PROJECT_ID` | `website-f3cc6` |
| `FIREBASE_STORAGE_BUCKET` | `website-f3cc6.firebasestorage.app` |
| `FIREBASE_MESSAGING_SENDER_ID` | `701579929185` |
| `FIREBASE_APP_ID` | `1:701579929185:web:3fa00922c71235b1f0ac20` |
| `FIREBASE_MEASUREMENT_ID` | `G-8DZ648WY2L` |
| `FIREBASE_ADMIN_EMAIL` | `mobolajiolakunle8@gmail.com` |

These are Firebase **web configuration values**, not a Firebase service-account credential. Do not add private keys, an admin password, or a service-account JSON file to Vercel.

## Deploy with Vercel

### Option 1 — Vercel dashboard

1. Extract the deployment ZIP.
2. Upload or import the extracted folder into a new Vercel project.
3. Add the environment variables above.
4. Vercel detects `vercel.json` automatically.
5. Deploy.

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
npx firebase deploy --only firestore:rules,storage,database
```

Then enable Email/Password Authentication, Cloud Firestore, and Cloud Storage in Firebase Console. After Vercel deploys, visit `/admin`, create the approved administrator account, verify the email, and import the starter portfolio.
