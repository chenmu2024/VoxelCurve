import fs from 'node:fs';

const origin='https://voxelcurve.com';
const geometrySource=fs.readFileSync(new URL('../src/core/geometry/index.ts',import.meta.url),'utf8');
const version=geometrySource.match(/GEOMETRY_VERSION\s*=\s*(\d+)/)?.[1];
if(!version) throw new Error('Cannot determine the candidate geometry version');
const pages=['/','/minecraft-circle-chart','/how-to-make-a-circle-in-minecraft','/minecraft-dome-generator','/minecraft-oval-generator','/about','/contact','/privacy','/terms','/disclaimer'];
const failures=[];

async function check(url,validate){
  try {
    const response=await fetch(url,{redirect:'manual',signal:AbortSignal.timeout(15000)});
    const body=await response.text();
    const issues=validate(response,body);
    if(issues.length) failures.push(`${url}: ${issues.join('; ')}`);
    else console.log(`PASS ${url}`);
  } catch(error) {
    failures.push(`${url}: ${error.cause?.code ?? error.code ?? error.message}`);
  }
}

await Promise.all(pages.map(page=>check(origin+page,(response,html)=>{
  const issues=[];
  if(response.status!==200) issues.push(`expected 200, got ${response.status}`);
  if(/noindex|none/i.test(response.headers.get('x-robots-tag')??'')) issues.push('production response is noindex');
  if(/<meta\b[^>]*name=["']robots["'][^>]*content=["'][^"']*\b(?:noindex|none)\b/i.test(html)) issues.push('production HTML is noindex');
  const canonical=html.match(/<link\b[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)/i)?.[1];
  if(canonical!==origin+page) issues.push(`canonical mismatch: ${canonical??'missing'}`);
  if(['/', '/minecraft-dome-generator','/minecraft-oval-generator'].includes(page)&&!html.includes(`GEOMETRY V${version}`)) issues.push(`expected geometry V${version}`);
  return issues;
})));

await Promise.all([
  check(`${origin}/robots.txt`,(response,text)=>{
    const issues=[];
    if(response.status!==200) issues.push(`expected 200, got ${response.status}`);
    if(!/^Sitemap:\s*https:\/\/voxelcurve\.com\/sitemap\.xml\s*$/mi.test(text)) issues.push('missing production Sitemap');
    if(/^Disallow:\s*\/\s*$/mi.test(text)) issues.push('sitewide crawl disallow');
    return issues;
  }),
  check(`${origin}/sitemap.xml`,(response,xml)=>{
    const issues=[];
    if(response.status!==200) issues.push(`expected 200, got ${response.status}`);
    const urls=[...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map(match=>match[1].trim());
    if(urls.length!==pages.length||new Set(urls).size!==pages.length||pages.some(page=>!urls.includes(origin+page))) issues.push('Sitemap does not contain exactly the production pages');
    return issues;
  }),
  check(`${origin}/voxelcurve-release-check-missing`,(response,html)=>{
    const issues=[];
    if(response.status!==404) issues.push(`expected 404, got ${response.status}`);
    if(!/noindex/i.test(response.headers.get('x-robots-tag')??'')&&!/<meta\b[^>]*name=["']robots["'][^>]*content=["'][^"']*\bnoindex\b/i.test(html)) issues.push('404 is missing noindex');
    return issues;
  })
]);

for(const host of ['www.voxelcurve.com','voxelcurve.pages.dev']){
  for(const path of ['/','/minecraft-oval-generator?release_check=1']){
    await check(`https://${host}${path}`,(response)=>{
      const issues=[];
      if(response.status!==301) issues.push(`expected 301, got ${response.status}`);
      const location=response.headers.get('location');
      if(!location||new URL(location,`https://${host}`).href!==origin+path) issues.push('redirect must preserve the path and query and target the production host');
      return issues;
    });
  }
}

if(failures.length){
  console.error(`\nProduction verification failed (${failures.length} checks):\n${failures.map(issue=>`- ${issue}`).join('\n')}`);
  process.exitCode=1;
} else console.log('\nProduction HTTP checks passed. Manual device/game, GSC/Bing and launch gates still require recorded results.');
