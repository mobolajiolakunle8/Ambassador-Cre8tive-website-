# Ambassador Cre8tive Admin Dashboard

Open `/admin` and sign in with the approved, verified Firebase administrator account.

## Workspaces

- **Overview** — live counts for published work, new project briefs, pending creative-notes requests, confirmed newsletter contacts, and the most recent activity.
- **Portfolio** — import the starter work once; add, edit, publish, feature, or remove projects. Images remain link-only: use `assets/...` starter paths or public HTTPS image URLs.
- **Website copy** — manage the homepage hero, main call to action, studio introduction, footer invitation, public email, and public phone number. These values are stored in `siteSettings/public` and shown on the homepage after a refresh.
- **Lead inbox** — read private project briefs, move them through New, Contacted, Proposal, Won, and Closed, and add private follow-up notes.
- **Audience** — review pending creative-notes requests that are also delivered to the Web3Forms inbox, separately from confirmed newsletter contacts. Pending requests are not campaign recipients; the secure campaign route remains for a later consent-verified mailing workflow.

## Safeguards

- Only `mobolajiolakunle8@gmail.com` with a verified Firebase email can access management data.
- The public `siteSettings/public` document contains only presentation text and public contact details; it cannot contain credentials, private leads, or arbitrary HTML.
- Existing project-image compatibility remains unchanged: `storagePath` stays exactly empty, starter assets remain supported, and new Firebase Storage uploads are not used.
- The public website retains built-in copy until the Website copy workspace is saved for the first time.

## Release checklist

1. Deploy the updated Firestore rules with the website source.
2. Verify Firebase Authentication Email/Password is enabled and the administrator email is verified.
3. Sign in at `/admin`, review the Overview workspace, then save homepage content only when ready to publish it.
4. Open the public homepage in a fresh browser tab and check the hero, call to action, footer details, and a published project before announcing changes.
