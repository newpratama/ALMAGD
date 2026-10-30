import fs from 'fs';
import path from 'path';

const distDir = path.resolve('dist');

console.log('--- Starting ALMAGD Website Verification Audit ---');

let errors = [];
let warnings = [];

// 1. Verify Cloudflare and SEO config files
const requiredRootFiles = [
  'robots.txt',
  'sitemap.xml',
  '_redirects',
  '_headers',
  'favicon.svg',
];

for (const file of requiredRootFiles) {
  const filePath = path.join(distDir, file);
  if (!fs.existsSync(filePath)) {
    errors.push(`Missing required file in dist: ${file}`);
  } else {
    console.log(`✓ Found ${file}`);
  }
}

// 2. Scan all HTML files in dist
function getAllHtmlFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getAllHtmlFiles(fullPath));
    } else if (file.endsWith('.html')) {
      results.push(fullPath);
    }
  }
  return results;
}

const htmlFiles = getAllHtmlFiles(distDir);
console.log(`Scanning ${htmlFiles.length} generated HTML pages...`);

const VERIFIED_WA_NUMBERS = ['6285117588248', '6281333035141', '6281116618075'];

for (const htmlFile of htmlFiles) {
  const content = fs.readFileSync(htmlFile, 'utf8');
  const relPath = path.relative(distDir, htmlFile);

  // Check 1: Check for unescaped PLACEHOLDER tokens
  if (content.includes('PLACEHOLDER') && !content.includes('placeholder-indicator')) {
    errors.push(`[${relPath}] Contains raw 'PLACEHOLDER' string`);
  }

  const isRedirect = content.includes('http-equiv="refresh"') || content.includes('Astro.redirect');
  if (isRedirect) {
    continue;
  }

  // Check 2: Check for html lang and dir
  if (!content.includes('<html')) {
    errors.push(`[${relPath}] Missing <html> tag`);
  } else {
    if (relPath.startsWith('ar/') || relPath.endsWith('ar.html')) {
      if (!content.includes('dir="rtl"')) {
        errors.push(`[${relPath}] Arabic page missing dir="rtl"`);
      }
      if (!content.includes('lang="ar"')) {
        errors.push(`[${relPath}] Arabic page missing lang="ar"`);
      }
    } else if (relPath.startsWith('en/') || relPath.endsWith('en.html')) {
      if (!content.includes('lang="en"')) {
        errors.push(`[${relPath}] English page missing lang="en"`);
      }
    } else if (!relPath.includes('404')) {
      if (!content.includes('lang="id"')) {
        errors.push(`[${relPath}] Default page missing lang="id"`);
      }
    }
  }

  // Check 3: Check title and description
  if (!content.includes('<title>') || content.includes('<title></title>')) {
      errors.push(`[${relPath}] Missing or empty <title> tag`);
    }
    if (!content.includes('name="description"') && !relPath.includes('404')) {
      errors.push(`[${relPath}] Missing description meta tag`);
    }
    if (!content.includes('rel="canonical"') && !relPath.includes('404')) {
      errors.push(`[${relPath}] Missing canonical tag`);
    }

  // Check 4: Check for suspicious room price claims
  if (relPath.includes('properties/')) {
    const lower = content.toLowerCase();
    // Ensure no room price starting from in rooms section
    if (lower.includes('mulai dari rp') || lower.includes('starting from idr') || lower.includes('ابتداءً من')) {
      errors.push(`[${relPath}] Detected unverified starting price claim in properties!`);
    }
    if (lower.includes('784 m²') || lower.includes('784m2') || lower.includes('784 m2')) {
      errors.push(`[${relPath}] Detected suspicious 784 m² room dimension!`);
    }
  }

  // Check 5: Check WhatsApp links integrity
  const waMatches = content.match(/href="https:\/\/wa\.me\/([0-9]+)[^"]*"/g) || [];
  for (const match of waMatches) {
    const num = match.match(/wa\.me\/([0-9]+)/)?.[1];
    if (num && !VERIFIED_WA_NUMBERS.includes(num)) {
      errors.push(`[${relPath}] Contains unverified WhatsApp number: ${num}`);
    }
  }
}

// Summary
console.log('\n--- Audit Results ---');
if (warnings.length > 0) {
  console.log(`Warnings (${warnings.length}):`);
  warnings.forEach((w) => console.log(`  ⚠ ${w}`));
}

if (errors.length > 0) {
  console.error(`Errors (${errors.length}):`);
  errors.forEach((e) => console.error(`  ✖ ${e}`));
  process.exit(1);
} else {
  console.log(`✔ All checks passed successfully! 0 errors, 0 warnings.`);
}
