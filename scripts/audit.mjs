import fs from 'node:fs';
import path from 'node:path';

const dist = path.resolve('dist');
const required = [
  '/',
  '/minecraft-circle-chart',
  '/how-to-make-a-circle-in-minecraft',
  '/minecraft-dome-generator',
  '/minecraft-oval-generator',
  '/about',
  '/contact',
  '/privacy',
  '/terms',
  '/disclaimer'
];

const exists = p => fs.existsSync(p);
const pageFile = url => {
  if (url === '/') return path.join(dist, 'index.html');
  const clean = url.replace(/^\//, '');
  const options = [
    path.join(dist, clean, 'index.html'),
    path.join(dist, `${clean}.html`)
  ];
  return options.find(exists);
};

const htmlFiles = [];
function walk(dir) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) walk(full);
    else if (name.endsWith('.html')) htmlFiles.push(full);
  }
}
walk(dist);

const errors = [];
for (const url of required) {
  if (!pageFile(url)) errors.push(`Missing required page: ${url}`);
}

const titles = new Map();
const canonicals = new Map();
for (const file of htmlFiles) {
  const html = fs.readFileSync(file, 'utf8');
  const rel = path.relative(dist, file);

  if (/TODO|COMING SOON|Lorem ipsum|localhost:/i.test(html)) {
    errors.push(`Placeholder/development text found in ${rel}`);
  }

  const title = html.match(/<title>(.*?)<\/title>/is)?.[1]?.trim();
  if (!title) errors.push(`Missing title in ${rel}`);
  else {
    if (titles.has(title)) errors.push(`Duplicate title in ${rel} and ${titles.get(title)}: ${title}`);
    titles.set(title, rel);
  }

  const canonical = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)/i)?.[1]
    ?? html.match(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["']canonical["']/i)?.[1];
  if (!canonical) errors.push(`Missing canonical in ${rel}`);
  else if (!rel.startsWith('404')) {
    if (canonicals.has(canonical)) errors.push(`Duplicate canonical in ${rel} and ${canonicals.get(canonical)}: ${canonical}`);
    canonicals.set(canonical, rel);
  }

  for (const match of html.matchAll(/href=["']([^"']+)["']/gi)) {
    const href = match[1];
    if (!href.startsWith('/') || href.startsWith('//')) continue;
    const pathname = href.split('#')[0].split('?')[0] || '/';
    if (pathname.startsWith('/_astro/') || pathname.endsWith('.svg') || pathname.endsWith('.xml') || pathname.endsWith('.txt')) continue;
    if (!pageFile(pathname)) errors.push(`Broken internal link in ${rel}: ${href}`);
  }
}

const notFound = path.join(dist, '404.html');
if (exists(notFound)) {
  const html = fs.readFileSync(notFound, 'utf8');
  if (!/name=["']robots["'][^>]+noindex/i.test(html) && !/noindex[^>]+name=["']robots["']/i.test(html)) {
    errors.push('404 page is missing noindex');
  }
} else {
  errors.push('Missing 404.html');
}

const sitemapFiles = fs.readdirSync(dist).filter(name => /^sitemap.*\.xml$/.test(name));
if (!sitemapFiles.length) errors.push('No sitemap XML generated');
for (const name of sitemapFiles) {
  const xml = fs.readFileSync(path.join(dist, name), 'utf8');
  if (xml.includes('/404')) errors.push(`404 URL found in ${name}`);
}

const robots = path.join(dist, 'robots.txt');
if (!exists(robots)) errors.push('Missing robots.txt');
else {
  const text = fs.readFileSync(robots, 'utf8');
  if (!/Sitemap:\s*https:\/\/voxelcurve\.com\//i.test(text)) errors.push('robots.txt missing production sitemap URL');
}

if (errors.length) {
  console.error('\nVoxelCurve site audit failed:\n');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`VoxelCurve audit passed: ${htmlFiles.length} HTML pages, ${titles.size} unique titles, ${canonicals.size} unique canonicals.`);
