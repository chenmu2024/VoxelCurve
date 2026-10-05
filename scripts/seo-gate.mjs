import fs from 'node:fs';
import {createHash} from 'node:crypto';

const origin='https://voxelcurve.com';
const lock=JSON.parse(fs.readFileSync('SEO_KEYWORDS.json','utf8'));
const lockHash=createHash('sha256').update(JSON.stringify(lock.keywords)).digest('hex');
if(lockHash!=='d6168850a1136ffbc115299a2b8a8d45c62fa8e7d89cc0ea27bd9328aacacc9f')throw new Error('Owner-approved keywords or page destinations changed');
const pages=[...Object.keys(lock.keywords),'/about','/contact','/privacy','/terms','/disclaimer'];
const errors=[];
const text=html=>html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,'').replace(/<[^>]*>/g,' ').replace(/&nbsp;|&#160;/g,' ').replace(/\s+/g,' ').trim();
const entries=[];
for(const pathname of pages){
 const html=fs.readFileSync(`dist/${pathname==='/'?'index':pathname.slice(1)}.html`,'utf8');
 const main=html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1]||'';
 const body=text(main);
 const check=(valid,message)=>{if(!valid)errors.push(pathname+': '+message)};
 check(/<meta\b[^>]*name="robots"[^>]*content="index,follow,max-image-preview:large"/i.test(html),'missing explicit indexable raw robots');
 check(/<html\b[^>]*lang="en"/i.test(html),'unexpected document language');
 check(!/hreflang=/i.test(html),'unvalidated multilingual alternates');
 check(/<meta\b[^>]*name="twitter:image:alt"/i.test(html),'missing social image description');
 const headings=[...main.matchAll(/<h([1-6])\b[^>]*>(.*?)<\/h\1>/gis)].map(m=>({level:Number(m[1]),text:text(m[2])}));
 for(let i=1;i<headings.length;i++)check(headings[i].level<=headings[i-1].level+1,'heading level skipped at '+headings[i].text);
 for(const keyword of lock.keywords[pathname]||[]){const escaped=keyword.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');check(new RegExp('\\b'+escaped+'\\b','i').test(body),'approved keyword missing from raw main: '+keyword);}
 const schemas=[...html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>(.*?)<\/script>/gis)].map(m=>JSON.parse(m[1]));
 const ids=new Set(schemas.map(s=>s['@id']).filter(Boolean));
 check(ids.size===schemas.filter(s=>s['@id']).length,'duplicate schema @id');
 for(const schema of schemas){
  check(schema['@context']==='https://schema.org','schema context');
  for(const property of ['publisher','author','isPartOf','mainEntity','mainEntityOfPage']){
   const ref=schema[property]?.['@id'];if(ref)check(ids.has(ref),'unresolved '+property+' entity '+ref);
  }
  check(!schema.aggregateRating&&!schema.review,'unapproved rating or review');
 }
 const webpage=schemas.find(s=>s['@type']==='WebPage');
 check(webpage?.['@id']===origin+pathname+'#webpage'&&webpage?.url===origin+pathname,'WebPage identity');
 const organization=schemas.find(s=>s['@type']==='Organization');
 check(organization?.sameAs?.includes('https://github.com/chenmu2024/VoxelCurve')&&organization?.email==='contact@VoxelCurve.com','project identity');
 const breadcrumbs=schemas.find(s=>s['@type']==='BreadcrumbList');
 if(pathname==='/')check(!breadcrumbs,'homepage must not emit a one-item breadcrumb');
 else{
  const items=breadcrumbs?.itemListElement||[];
  check(items.length===2,'breadcrumb requires actual two-level hierarchy');
  check(/aria-label="Breadcrumb"/.test(main),'breadcrumb is not visible');
  check(items[0]?.item===origin+'/'&&items[1]?.item===origin+pathname,'breadcrumb destinations');
  items.forEach((item,index)=>check(item.position===index+1&&item['@type']==='ListItem'&&body.includes(item.name),'breadcrumb content or position'));
 }
 if(['/', '/minecraft-dome-generator','/minecraft-oval-generator'].includes(pathname)){
  const software=schemas.find(s=>s['@type']==='SoftwareApplication');
  check(software?.offers?.price==='0'&&software?.isAccessibleForFree===true,'truthful free software offer');
  check(/id="geometry-notes"/.test(main)&&body.includes('Geometry V4')&&body.includes('Computed examples in blocks'),'missing crawlable tool method/examples');
  check(body.includes('2026-10-05')||main.includes('datetime="2026-10-05"'),'visible method review date');
 }
 if(pathname==='/how-to-make-a-circle-in-minecraft'){
  const article=schemas.find(s=>s['@type']==='Article');
  check(article?.dateModified==='2026-10-05'&&main.includes('datetime="2026-10-05"'),'article date differs from visible review');
  check(article?.author?.['@id']===origin+'/#organization','article author identity');
 }
 if(pathname==='/about')check(!/PNG and SVG creation/.test(body),'removed export feature still advertised');
 if(pathname==='/contact')check((html.match(/<!--email_off-->/g)||[]).length===2&&(html.match(/<!--\/email_off-->/g)||[]).length===2,'public email requires raw-HTML protection exception');
 entries.push({path:pathname,links:[...html.matchAll(/<a\b[^>]*href="([^"]+)"/gi)].map(m=>new URL(m[1],origin+pathname).pathname)});
}
for(const page of entries)if(!entries.some(other=>other.path!==page.path&&other.links.includes(page.path)))errors.push(page.path+': orphan in crawlable links');
if(errors.length)throw new Error('SEO/GEO gate failed:\n'+errors.join('\n'));
console.log(`SEO/GEO gate passed: ${pages.length} raw HTML pages, 52 locked keywords, entity references, headings, visible breadcrumbs, methods and review dates.`);
