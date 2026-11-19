# Third-party notices

## Firebase JavaScript SDK

The following browser modules are vendored locally to let the public website and Firebase administrator dashboard load in restricted previews without depending on third-party module imports at page load:

- `firebase-app.js`
- `firebase-auth.js`
- `firebase-firestore.js`
- `firebase-analytics.js`
- `firebase-app-check.js`

They are the Firebase JavaScript SDK version 12.8.0, distributed by Google under the Apache License, Version 2.0. Their original license headers are retained in the files.

Firebase service requests still occur only when a feature requires them. The local copies remove the external SDK-module loading dependency; they do not change Firebase Authentication, Firestore rules, or the approved-administrator model.
