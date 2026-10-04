import fs from 'node:fs';
import path from 'node:path';
import { gzipSync } from 'node:zlib';

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
const descriptions = new Map();
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

  const description = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)/i)?.[1]?.trim()
    ?? html.match(/<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["']/i)?.[1]?.trim();
  if (!description) errors.push(`Missing meta description in ${rel}`);
  else {
    if (descriptions.has(description)) errors.push(`Duplicate meta description in ${rel} and ${descriptions.get(description)}`);
    descriptions.set(description, rel);
  }

  const h1Count = (html.match(/<h1\b/gi) || []).length;
  if (h1Count !== 1) errors.push(`Expected exactly one H1 in ${rel}, found ${h1Count}`);

  const canonical = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)/i)?.[1]
    ?? html.match(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["']canonical["']/i)?.[1];
  if (!canonical) errors.push(`Missing canonical in ${rel}`);
  else if (!canonical.startsWith('https://voxelcurve.com/')) errors.push(`Canonical uses unexpected host in ${rel}: ${canonical}`);
  else if (!rel.startsWith('404')) {
    if (canonicals.has(canonical)) errors.push(`Duplicate canonical in ${rel} and ${canonicals.get(canonical)}: ${canonical}`);
    canonicals.set(canonical, rel);
  }

  for (const match of html.matchAll(/src=["']([^"']+)["']/gi)) {
    const src = match[1];
    if (!src.startsWith('/') || src.startsWith('//') || src.startsWith('/_astro/')) continue;
    const local = path.join(dist, src.replace(/^\//, ''));
    if (!exists(local)) errors.push(`Missing local asset in ${rel}: ${src}`);
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
const sitemapUrls = new Set();
for (const name of sitemapFiles) {
  const xml = fs.readFileSync(path.join(dist, name), 'utf8');
  if (xml.includes('/404')) errors.push(`404 URL found in ${name}`);
  for (const match of xml.matchAll(/<loc>(.*?)<\/loc>/g)) sitemapUrls.add(match[1].trim());
}
const expectedSitemapUrls = new Set(required.map(url => `https://voxelcurve.com${url === '/' ? '/' : url}`));
for (const url of expectedSitemapUrls) {
  if (!sitemapUrls.has(url)) errors.push(`Missing URL from sitemap: ${url}`);
}
for (const url of sitemapUrls) {
  if (!expectedSitemapUrls.has(url)) errors.push(`Unexpected URL in sitemap: ${url}`);
}

const robots = path.join(dist, 'robots.txt');
if (!exists(robots)) errors.push('Missing robots.txt');
else {
  const text = fs.readFileSync(robots, 'utf8');
  if (!/Sitemap:\s*https:\/\/voxelcurve\.com\//i.test(text)) errors.push('robots.txt missing production sitemap URL');
}

const redirectsFile=path.join(dist,'_redirects');
if(!exists(redirectsFile)) errors.push('Missing Cloudflare _redirects');
else {
  const redirects=fs.readFileSync(redirectsFile,'utf8');
  if(!redirects.includes('https://voxelcurve.pages.dev/* https://voxelcurve.com/:splat 301')) errors.push('Missing pages.dev canonical host redirect');
  if(!redirects.includes('https://www.voxelcurve.com/* https://voxelcurve.com/:splat 301')) errors.push('Missing www canonical host redirect');
}

const headersFile=path.join(dist,'_headers');
if(!exists(headersFile)) errors.push('Missing Cloudflare _headers');
else {
  const headers=fs.readFileSync(headersFile,'utf8');
  if(!headers.includes('Content-Security-Policy:')) errors.push('Missing Content-Security-Policy header');
  if(!headers.includes('Strict-Transport-Security:')) errors.push('Missing HSTS header');
  if(!headers.includes('X-Robots-Tag: noindex')) errors.push('Missing pages.dev noindex header');
}

const ogFile=path.join(dist,'og.png');
if(!exists(ogFile)) errors.push('Missing generated og.png');
else {
  const png=fs.readFileSync(ogFile);
  const signature='89504e470d0a1a0a';
  if(png.subarray(0,8).toString('hex')!==signature) errors.push('og.png is not a valid PNG');
  else {
    const width=png.readUInt32BE(16),height=png.readUInt32BE(20);
    if(width!==1200||height!==630) errors.push(`og.png must be 1200x630, got ${width}x${height}`);
    if(png.length>300*1024) errors.push(`og.png exceeds 300KB: ${Math.round(png.length/1024)}KB`);
  }
}

const assetDir = path.join(dist, '_astro');
let totalJsGzip = 0;
let totalCssGzip = 0;
if (exists(assetDir)) {
  for (const name of fs.readdirSync(assetDir)) {
    const full = path.join(assetDir, name);
    if (!fs.statSync(full).isFile()) continue;
    const bytes = fs.readFileSync(full);
    const gz = gzipSync(bytes).byteLength;
    if (name.endsWith('.js')) {
      totalJsGzip += gz;
      if (gz > 150 * 1024) errors.push(`JS chunk exceeds 150KB gzip: ${name} (${Math.round(gz/1024)}KB)`);
    }
    if (name.endsWith('.css')) totalCssGzip += gz;
  }
}
if (totalJsGzip > 300 * 1024) errors.push(`Total built JavaScript exceeds 300KB gzip: ${Math.round(totalJsGzip/1024)}KB`);
if (totalCssGzip > 100 * 1024) errors.push(`Total built CSS exceeds 100KB gzip: ${Math.round(totalCssGzip/1024)}KB`);

if (errors.length) {
  console.error('\nVoxelCurve site audit failed:\n');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`VoxelCurve audit passed: ${htmlFiles.length} HTML pages, ${titles.size} unique titles, ${descriptions.size} unique descriptions, ${canonicals.size} unique canonicals.`);
console.log(`Asset budget: ${Math.round(totalJsGzip/1024)}KB total JS gzip, ${Math.round(totalCssGzip/1024)}KB total CSS gzip.`);
