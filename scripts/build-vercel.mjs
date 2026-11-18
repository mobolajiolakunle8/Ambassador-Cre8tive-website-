import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const output = path.join(root, 'vercel-static');
const envFiles = ['.env', '.env.production'];
const required = [
  'FIREBASE_API_KEY',
  'FIREBASE_AUTH_DOMAIN',
  'FIREBASE_PROJECT_ID',
  'FIREBASE_STORAGE_BUCKET',
  'FIREBASE_MESSAGING_SENDER_ID',
  'FIREBASE_APP_ID',
  'FIREBASE_MEASUREMENT_ID',
  'FIREBASE_ADMIN_EMAIL',
];
const optionalPublic = [
  'BOOKING_URL',
  'WHATSAPP_NUMBER',
  'PUBLIC_SITE_URL',
  'GOOGLE_BUSINESS_PROFILE_URL',
  'GOOGLE_SITE_VERIFICATION',
  'FIREBASE_APP_CHECK_SITE_KEY',
  'VERCEL_ANALYTICS_ENABLED',
];
const htmlFiles = [
  'index.html', 'about.html', 'services.html', 'portfolio.html', 'project.html',
  'blog.html', 'post.html', 'contact.html', 'search.html', 'privacy.html', 'admin.html', 'unsubscribe.html', 'confirm-subscription.html',
];
const publicFiles = [
  ...htmlFiles,
  'styles.css', 'admin.css',
  'app.js', 'posts.js', 'projects.js', 'project.js', 'admin.js', 'contact.js', 'newsletter.js', 'integrations.js', 'site-content.js', 'unsubscribe.js', 'confirm-subscription.js',
  'robots.txt',
];

const parseEnv = (source) => source.split(/\r?\n/).reduce((values, rawLine) => {
  const line = rawLine.trim();
  if (!line || line.startsWith('#')) return values;
  const normalized = line.startsWith('export ') ? line.slice(7) : line;
  const separator = normalized.indexOf('=');
  if (separator < 1) return values;
  const key = normalized.slice(0, separator).trim();
  let value = normalized.slice(separator + 1).trim();
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
  values[key] = value;
  return values;
}, {});

const fileEnv = {};
for (const filename of envFiles) {
  try {
    Object.assign(fileEnv, parseEnv(await readFile(path.join(root, filename), 'utf8')));
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
}
const env = { ...fileEnv, ...process.env };
const missing = required.filter((key) => !env[key]);
if (missing.length) throw new Error(`Missing Firebase environment variables: ${missing.join(', ')}`);
for (const key of optionalPublic) env[key] ??= '';

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
await Promise.all(publicFiles.map((filename) => cp(path.join(root, filename), path.join(output, filename))));
await cp(path.join(root, 'assets'), path.join(output, 'assets'), { recursive: true });

let firebaseConfig = await readFile(path.join(root, 'firebase-config.template.js'), 'utf8');
for (const key of [...required, ...optionalPublic]) {
  const token = `__${key}__`;
  const value = key === 'VERCEL_ANALYTICS_ENABLED'
    ? String(env[key]).toLowerCase() !== 'false'
    : env[key];
  firebaseConfig = firebaseConfig.replaceAll(token, JSON.stringify(value));
}
await writeFile(path.join(output, 'firebase-config.js'), firebaseConfig, 'utf8');

const siteUrl = String(env.PUBLIC_SITE_URL || '').trim().replace(/\/$/, '');
const verification = String(env.GOOGLE_SITE_VERIFICATION || '').trim();
const pageUrl = (filename) => {
  if (!siteUrl) return '';
  return filename === 'index.html' ? `${siteUrl}/` : `${siteUrl}/${filename.replace(/\.html$/, '')}`;
};
for (const filename of htmlFiles) {
  const destination = path.join(output, filename);
  let html = await readFile(destination, 'utf8');
  const extras = [
    verification && `<meta name="google-site-verification" content="${verification.replaceAll('"', '&quot;')}" />`,
    pageUrl(filename) && `<link rel="canonical" href="${pageUrl(filename)}" />`,
  ].filter(Boolean).join('\n  ');
  if (extras) html = html.replace('</head>', `  ${extras}\n</head>`);
  await writeFile(destination, html, 'utf8');
}

if (siteUrl) {
  const routes = [
    '/', '/about', '/services', '/portfolio', '/blog', '/contact', '/privacy', '/search',
    '/post?slug=brand-foundations-nigeria', '/post?slug=brand-viewpoint', '/post?slug=design-systems',
    '/post?slug=first-impression', '/post?slug=brand-refresh', '/post?slug=social-templates', '/post?slug=campaign-clarity',
  ];
  const today = new Date().toISOString().slice(0, 10);
  const urls = routes.map((route) => `  <url><loc>${siteUrl}${route}</loc><lastmod>${today}</lastmod></url>`).join('\n');
  await writeFile(path.join(output, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`, 'utf8');
  const robots = await readFile(path.join(output, 'robots.txt'), 'utf8');
  await writeFile(path.join(output, 'robots.txt'), `${robots.trim()}\n\nSitemap: ${siteUrl}/sitemap.xml\n`, 'utf8');
}

console.log(`Created secure Vercel static output in ${path.relative(root, output)}/`);
