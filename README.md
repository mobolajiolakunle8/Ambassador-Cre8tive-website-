# Ambassador Cre8tive — GitHub-ready Bethel integration package

This is a clean source package for a GitHub repository and Vercel deployment. It includes the Ambassador Cre8tive website, Firebase portfolio/admin system, official WhatsApp Click-to-Chat flow, and a safe Bethel app link adapter.

## What is ready

- Firebase Authentication, Firestore portfolio/admin, enquiry CRM, and newsletter source
- Official WhatsApp Click-to-Chat integration for `2349030192034`
- Vercel build and serverless API source
- Bethel app link adapter controlled by the public `BETHEL_APP_URL` environment variable
- No local `.env` files or private credentials are included in this GitHub package

## Publish to GitHub

1. Extract this package.
2. Create a **private** GitHub repository.
3. In the extracted folder, run:

   ```bash
   git init
   git add .
   git commit -m "Initial Ambassador Cre8tive Bethel-ready site"
   git branch -M main
   git remote add origin https://github.com/YOUR-ACCOUNT/YOUR-REPOSITORY.git
   git push -u origin main
   ```

4. Import that repository into Vercel.
5. In Vercel Project Settings → Environment Variables, add the values from `.env.example`. Do not commit a real `.env` file.
6. Deploy. Vercel runs `npm run build:vercel` and publishes `vercel-static/`.

## Connect a public Bethel app link

Set this public Vercel variable to Bethel's documented HTTPS web or universal-link URL:

```text
BETHEL_APP_URL=https://example.com/open-bethel
```

The integration script only activates links carrying `data-bethel-app-link`. Add the attribute to an approved call-to-action, for example:

```html
<a data-bethel-app-link hidden>Open Bethel app ↗</a>
```

When `BETHEL_APP_URL` is valid, the link becomes visible, opens safely in a new tab, and records a non-identifying `select_content` event. See `BETHEL_APP_INTEGRATION.md` for the exact contract.

## Important security boundary

No Bethel API endpoint, API key, account sharing, or SSO flow is assumed in this package. If Bethel needs data exchange or shared login, provide its official API/SSO documentation and place any private credential only in Vercel encrypted environment variables. Do not place secrets in `BETHEL_APP_URL`, browser JavaScript, GitHub, or a public repository.

## Deployment references

- `VERCEL_DEPLOYMENT.md` — Vercel configuration and deployment
- `FIREBASE_SETUP.md` — Firebase setup and rules
- `OPERATIONS_GUIDE.md` — operations, privacy, backups, consent, and safety
- `BETHEL_APP_INTEGRATION.md` — Bethel link adapter details
