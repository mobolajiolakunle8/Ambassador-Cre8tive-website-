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
const publicFiles = [
  'index.html', 'about.html', 'services.html', 'portfolio.html', 'project.html',
  'blog.html', 'post.html', 'contact.html', 'search.html', 'admin.html',
  'styles.css', 'admin.css',
  'app.js', 'posts.js', 'projects.js', 'project.js', 'admin.js',
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

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
await Promise.all(publicFiles.map((filename) => cp(path.join(root, filename), path.join(output, filename))));
await cp(path.join(root, 'assets'), path.join(output, 'assets'), { recursive: true });

let firebaseConfig = await readFile(path.join(root, 'firebase-config.template.js'), 'utf8');
for (const key of required) firebaseConfig = firebaseConfig.replaceAll(`__${key}__`, JSON.stringify(env[key]));
await writeFile(path.join(output, 'firebase-config.js'), firebaseConfig, 'utf8');

console.log(`Created secure Vercel static output in ${path.relative(root, output)}/`);
