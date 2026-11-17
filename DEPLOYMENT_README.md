# Ambassador Cre8tive — Firebase deployment package

This package is the production-ready Ambassador Cre8tive website with Firebase services. For the Vercel deployment path, use `VERCEL_DEPLOYMENT.md`; Firebase Hosting instructions remain included as an alternative.

## Included

- Public responsive website pages, local fonts, and Africa-centred imagery
- Firebase portfolio dashboard at `/admin`
- Firebase Authentication integration for `mobolajiolakunle8@gmail.com`
- Cloud Firestore project and case-study integration, private enquiry CRM, and newsletter-consent records
- Public HTTPS project-image link integration (with local starter-image support)
- Firestore, Storage, and Realtime Database security rules
- Firebase Hosting configuration, `.firebaserc`, `package.json`, and lockfile

## Before you deploy

In Firebase Console for project `website-f3cc6`, enable:

1. **Authentication → Email/Password**
2. **Cloud Firestore**
3. **Realtime Database** only if you want to deploy its included locked rule
4. **Cloud Storage** only if existing published Firebase Storage image links need compatibility support or a separately reviewed future feature needs it; the current portfolio uses public HTTPS image links

## Deploy

Open a terminal inside this folder and run:

```bash
npm install
npx firebase login
npx firebase deploy --only hosting,firestore:rules,database
```

If you have not created Realtime Database, use:

```bash
npx firebase deploy --only hosting,firestore:rules
```

If existing Firebase Storage project-image links need to stay public, deploy the included read-only compatibility rule separately with `npx firebase deploy --only storage`. Do not reopen it for portfolio uploads: new project images are public HTTPS links.

## First administrator setup

1. Open `/admin` on the deployed Firebase Hosting URL.
2. Select **Set up first access**.
3. Create a password for `mobolajiolakunle8@gmail.com`.
4. Verify the Firebase email.
5. Sign in and select **Import starter portfolio** once.

## Security notes

- Public visitors can only read Firestore projects marked `published: true`.
- Only the verified `mobolajiolakunle8@gmail.com` Firebase account can manage drafts, public project-image links, projects, private briefs, and newsletter contacts.
- Realtime Database is locked by default. Cloud Storage denies writes and permits only the former public project-object path for compatibility with older image links; new portfolio images are externally linked.
- The local Python preview server, local JSON data, Vercel API source, and environment files are intentionally excluded from Firebase Hosting output.
- Firebase Hosting retains Firestore lead capture and the dashboard. Use the Vercel package for Resend notifications, signed newsletter delivery/unsubscribe routes, and Vercel Web Analytics.
