# Ambassador Cre8tive — Firebase deployment package

This package is the production-ready Ambassador Cre8tive website with Firebase services. For the Vercel deployment path, use `VERCEL_DEPLOYMENT.md`; Firebase Hosting instructions remain included as an alternative.

## Included

- Public responsive website pages, local fonts, and Africa-centred imagery
- Firebase portfolio dashboard at `/admin`
- Firebase Authentication integration for `mobolajiolakunle8@gmail.com`
- Cloud Firestore project and case-study integration, private enquiry CRM, and newsletter-consent records
- Firebase Storage image-upload integration
- Firestore, Storage, and Realtime Database security rules
- Firebase Hosting configuration, `.firebaserc`, `package.json`, and lockfile

## Before you deploy

In Firebase Console for project `website-f3cc6`, enable:

1. **Authentication → Email/Password**
2. **Cloud Firestore**
3. **Cloud Storage**
4. **Realtime Database** only if you want to deploy its included locked rule

## Deploy

Open a terminal inside this folder and run:

```bash
npm install
npx firebase login
npx firebase deploy --only hosting,firestore:rules,storage,database
```

If you have not created Realtime Database, use:

```bash
npx firebase deploy --only hosting,firestore:rules,storage
```

## First administrator setup

1. Open `/admin` on the deployed Firebase Hosting URL.
2. Select **Set up first access**.
3. Create a password for `mobolajiolakunle8@gmail.com`.
4. Verify the Firebase email.
5. Sign in and select **Import starter portfolio** once.

## Security notes

- Public visitors can only read Firestore projects marked `published: true`.
- Only the verified `mobolajiolakunle8@gmail.com` Firebase account can manage drafts, uploads, projects, private briefs, and newsletter contacts.
- Realtime Database is locked by default because the site uses Firestore real-time updates instead.
- The local Python preview server, local JSON data, local uploads, Vercel API source, and environment files are intentionally excluded from Firebase Hosting output.
- Firebase Hosting retains Firestore lead capture and the dashboard. Use the Vercel package for Resend notifications, signed newsletter delivery/unsubscribe routes, and Vercel Web Analytics.
