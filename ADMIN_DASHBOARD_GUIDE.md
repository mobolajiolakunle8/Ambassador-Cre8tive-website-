# Ambassador Cre8tive Admin Dashboard

Open `/admin` and sign in with the approved, verified Firebase administrator account.

## How live editing works

The dashboard saves ordinary content edits automatically after a short pause. Firestore listeners keep the project lists, testimonials, journal notes, homepage settings, and lead workflow synchronised across signed-in browsers. If two browsers change the same field at the same time, the most recently saved version wins; review live content carefully before publishing.

Deleting content and sending a newsletter always require a deliberate click and confirmation. Newsletter delivery is never automatic.

## Workspaces

- **Overview** — live counts for published work, testimonials, journal notes, new project briefs, creative-notes requests, and confirmed newsletter contacts.
- **Portfolio** — add, edit, publish, feature, or remove client-approved projects. New work begins as a private auto-saved draft; a title and public image link are required before it can be published. Images remain link-only: use an appropriate local `assets/...` path or a public HTTPS image URL. If an older placeholder import exists, the dashboard offers a deliberate legacy-record cleanup action.
- **Social proof** — write, order, feature, publish, edit, or remove client-approved testimonials. Quotes are not visible publicly until **Show this quote publicly** is selected.
- **Journal** — write plain-text studio notes, choose a topic, add an approved cover-image link, feature a note on the homepage, and publish when ready. A blank line starts a new paragraph; a line beginning with `## ` becomes a simple article heading. Drafts are private.
- **Website copy** — manage homepage hero copy, calls to action, social-proof heading, availability invitation, four-step process section, footer invitation, and public contact details. These values are stored in `siteSettings/public` and update open homepage tabs through Firestore.
- **Lead inbox** — read private project briefs, move them through New, Contacted, Proposal, Won, and Closed, and add private follow-up notes. Workflow changes auto-save.
- **Audience** — review pending creative-notes requests that are also delivered to the Web3Forms inbox, separately from confirmed newsletter contacts. Pending requests are not campaign recipients; the secure campaign route remains for a later consent-verified mailing workflow.

## Safeguards

- Only `mobolajiolakunle8@gmail.com` with a verified Firebase email can access management data.
- The public `siteSettings/public` document contains only presentation text and public contact details; it cannot contain credentials, private leads, or arbitrary HTML.
- Public visitors can read only published projects, testimonials, and journal notes. Drafts remain administrator-only.
- Existing project-image compatibility remains unchanged: `storagePath` stays exactly empty, local assets remain supported, and new Firebase Storage uploads are not used.
- Use only client-approved names, images, facts, and quotes. Do not publish fabricated social proof or confidential project material.

## Release checklist

1. Deploy the updated Firestore rules with the website source before using the new auto-save content collections.
2. Verify Firebase Authentication Email/Password is enabled and the administrator email is verified.
3. Sign in at `/admin`, add content as private drafts, then turn on public publishing only after review.
4. Open the public homepage, portfolio, and journal in a separate browser tab and confirm that each approved change appears before announcing it.
