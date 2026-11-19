# Ambassador Cre8tive Firebase setup

> For the complete enquiry CRM, newsletter-consent, App Check, backup, multi-admin, Resend, booking, analytics, and local-search runbook, see [`OPERATIONS_GUIDE.md`](OPERATIONS_GUIDE.md).

The public site and admin dashboard are configured to use Firebase in production once deployed. The browser Firebase SDK modules are served from the site itself, rather than loaded as third-party CDN modules, so the dashboard can also initialise in restricted previews.

The configuration includes:

- **Firebase Authentication** — password sign-in for `mobolajiolakunle8@gmail.com`
- **Cloud Firestore** — published projects, private drafts, case-study details, client-approved testimonials, editable journal notes, homepage presentation settings, private project briefs, and newsletter consents
- **Cloud Storage** — read-only compatibility for previously published Firebase Storage image links; new portfolio projects use public image links instead of uploads
- **Firebase Hosting** — static public site and admin dashboard
- **Realtime Database** — intentionally locked because this site does not use it

## One-time Firebase Console steps

1. Open the Firebase project **website-f3cc6** in Firebase Console.
2. In **Authentication → Sign-in method**, enable **Email/Password**.
3. In **Authentication → Templates**, configure the email-verification sender name and template for Ambassador Cre8tive.
4. Create a **Cloud Firestore** database. Choose the production mode and a region carefully — the database location cannot be changed later.
5. Cloud Storage is optional for new work. Enable it if you need existing published Firebase Storage image links to remain available; its included rule keeps the former project path read-only. New portfolio images are public links.
6. If the Firebase project has no Realtime Database instance yet, create one only if you want to deploy the included locked Realtime Database rule. The website itself does not use Realtime Database; Firestore provides the live project updates.
7. Optionally enable Google Analytics for the project; the site detects unsupported environments gracefully.

## Local install and deployment

From this folder:

```bash
npm install
npx firebase login
npx firebase deploy --only hosting,firestore:rules,database
```

The repository is already linked to `website-f3cc6` through `.firebaserc`, so `firebase init` is not required again. If you need legacy Firebase Storage image links to remain public, deploy the included read-only compatibility rule separately with `npx firebase deploy --only storage`; do not use Cloud Storage for new portfolio uploads. Firebase deployment does not need a local Java runtime; if you use the optional Firestore emulator command, the current Firebase CLI requires JDK 21 or newer.

## First administrator setup

1. Visit `/admin` on the deployed Firebase Hosting URL.
2. Choose **Set up first access** and create a password for `mobolajiolakunle8@gmail.com`.
3. Open the verification email sent by Firebase and verify the address.
4. Return to `/admin`, sign in, and use **I have verified my email** if prompted.
5. Add only completed, client-approved projects from the Portfolio workspace when they are ready to publish.

Only that verified email can read drafts or create, edit, publish, and delete projects, testimonials, and journal notes. Each project or journal image is supplied as a public HTTPS image link (local `assets/...` paths remain supported where appropriate); the dashboard validates project links before publishing. Ordinary content changes auto-save after a short pause and Firestore listeners synchronise them across signed-in browsers. It can also read private project briefs, pending creative-notes requests, and any separately verified newsletter-consent records in the dashboard. Public creative-notes requests are delivered to the studio through Web3Forms and stored only as pending records; they do not become campaign recipients automatically. The optional Vercel signed-confirmation route remains available only if a consent-based newsletter delivery service is later configured. The Firestore rules enforce this on the server; client-side checks are only convenience features.

## Homepage content controls

The **Website copy** workspace in `/admin` stores presentation-only homepage content in the single Firestore document `siteSettings/public`. It controls the homepage hero, calls to action, studio introduction, social-proof heading, availability invitation, process section, footer invitation, and public email/phone details. It never stores credentials, private lead data, or arbitrary HTML. Changes auto-save and open homepage tabs receive the live update through Firestore; built-in source copy remains visible until this document is first saved.

## Deployment notes

- `server.py` and `data/` are excluded from Firebase Hosting. They remain useful only for the local Arena preview/fallback development server.
- The Realtime Database rules deny all reads and writes. The Storage rule permits only public reads of the former `/projects/{userId}/{fileName}` path so older public image links keep working; it denies all Storage writes. Do not loosen either rule without a separately reviewed feature.
- Add genuine client quotes in the **Social proof** workspace only with permission. Homepage testimonial cards appear automatically once a testimonial is explicitly published. Journal notes are likewise private drafts until explicitly published.
