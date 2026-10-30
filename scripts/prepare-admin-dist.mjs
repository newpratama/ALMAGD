// scripts/prepare-admin-dist.mjs
import fs from 'node:fs';
import path from 'node:path';

const distAdmin = path.resolve('dist/admin');
const adminIndex = path.join(distAdmin, 'index.html');

if (!fs.existsSync(adminIndex)) {
  console.error('Error: dist/admin/index.html does not exist!');
  process.exit(1);
}

const routes = [
  'login',
  'today',
  'bookings',
  'bookings/new',
  'calendar',
  'guests',
  'reports',
  'settings',
  '404',
];

for (const route of routes) {
  const dir = path.join(distAdmin, route);
  fs.mkdirSync(dir, { recursive: true });
  fs.copyFileSync(adminIndex, path.join(dir, 'index.html'));
  fs.copyFileSync(adminIndex, path.join(distAdmin, `${route.replace(/\//g, '-')}.html`));
  if (!route.includes('/')) {
    fs.copyFileSync(adminIndex, path.join(distAdmin, `${route}.html`));
  }
}

console.log('✓ Admin route fallbacks created for Cloudflare Pages static hosting.');
