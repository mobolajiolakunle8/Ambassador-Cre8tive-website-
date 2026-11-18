# Bethel app integration adapter

## Current safe connection

The package contains a **link-only** Bethel adapter. It avoids inventing an API, deep-link scheme, account flow, or credential before Bethel supplies documented integration details.

At Vercel build time, set the public variable:

```text
BETHEL_APP_URL=https://bethel.example/open
```

Only absolute `http` or `https` URLs are accepted by the browser adapter. Use Bethel's documented HTTPS web URL, Universal Link, or Android App Link. Do not use a private API URL or secret-bearing URL.

## Activate a page link

Place this on a deliberate, approved CTA in any public HTML page:

```html
<a data-bethel-app-link hidden>Open Bethel app <span aria-hidden="true">↗</span></a>
```

`integrations.js` then:

1. checks `BETHEL_APP_URL` is a safe HTTP(S) URL;
2. assigns it to every `[data-bethel-app-link]` element;
3. opens it in a new tab with `rel="noopener"`;
4. reveals the element only when a valid URL exists; and
5. sends a non-identifying analytics event (`select_content`, `partner_app`, `bethel`).

## For API, SSO, or data synchronisation

Do not reuse this client-side adapter for credentials or visitor data. First obtain Bethel's official API/SSO documentation, callback URLs, scope requirements, privacy basis, and server-to-server authentication method. Then implement the integration through a Vercel server-side route with encrypted Vercel environment variables.

Required information before that implementation can be completed:

- public Bethel application URL or API base URL;
- approved callback/deep-link URLs;
- API or OAuth documentation;
- requested data fields and consent requirements; and
- a server-side credential delivery method.
