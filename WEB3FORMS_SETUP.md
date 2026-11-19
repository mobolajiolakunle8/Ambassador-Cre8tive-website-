# Web3Forms setup — Ambassador Cre8tive

The public contact form and every footer **Creative notes** form now send individual notifications through Web3Forms.

## What the website does

- **Project brief:** sends the submitted project details to the Web3Forms destination inbox, with the visitor email set as reply-to. After a successful send, the website also tries to keep a private Firestore CRM copy for the verified administrator.
- **Creative-notes request:** sends a notification to the same Web3Forms inbox and tries to keep a private Firestore record with `status: pending`.
- A creative-notes request is **not** treated as a deliverable subscriber or added to a campaign automatically. Follow up and obtain the appropriate consent before marketing delivery.

## Configure on Vercel

Before deploying, add this variable in **Vercel → Project → Settings → Environment Variables** for every environment you intend to deploy:

| Variable | Value | Type |
| --- | --- | --- |
| `WEB3FORMS_ACCESS_KEY` | The Web3Forms access key already supplied for this website | Plain / public build value |

The build injects that value into the deployed `web3forms-config.js` file. This is intentional: a Web3Forms access key is a public browser form identifier, not a private dashboard API credential. Do **not** use a private Web3Forms dashboard API key in this variable.

## Web3Forms dashboard checklist

1. Confirm the destination inbox in Web3Forms.
2. Add the production domain to any available Web3Forms domain restriction or allowlist.
3. Enable the provider’s recommended spam protection for the plan in use.
4. After deployment, submit one real test project brief and one real creative-notes request.
5. Confirm that both notifications arrive, replies go to the visitor’s address, and any Firebase records stay visible only to the administrator.

## Newsletter campaigns

The existing secure campaign tooling stays disabled for public Web3Forms requests: only records explicitly verified as `subscribed` are eligible. If a consent-based campaign workflow is enabled later, configure its separate server-side delivery credentials and test signed unsubscribe handling before sending.

## Local release note

This release leaves `web3forms-config.js` blank in source control. That prevents the supplied form identifier from being copied into a downloadable source archive by default. The Vercel build populates it when the environment variable above is configured.
