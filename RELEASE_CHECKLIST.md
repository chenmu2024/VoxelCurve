# VoxelCurve Release Checklist

This checklist is intentionally short. VoxelCurve is designed to be finished, deployed and then monitored at low frequency rather than continuously redesigned.

## 1. Automated gates

A release is not ready unless GitHub Actions is green.

CI currently runs:

- production dependency security audit;
- geometry regression tests;
- Astro production build;
- production site audit;
- Title / Meta Description uniqueness;
- exactly one H1 per page;
- canonical host validation;
- internal-link validation;
- local-asset validation;
- exact Sitemap URL validation;
- 404 noindex validation;
- Cloudflare `_headers` / `_redirects` validation;
- Open Graph PNG validation;
- JS/CSS performance budgets.

## 2. Core product pages

Verify these URLs on the production domain:

- [ ] `/`
- [ ] `/minecraft-circle-chart`
- [ ] `/how-to-make-a-circle-in-minecraft`
- [ ] `/minecraft-dome-generator`
- [ ] `/minecraft-oval-generator`
- [ ] `/about`
- [ ] `/contact`
- [ ] `/privacy`
- [ ] `/terms`
- [ ] `/disclaimer`

## 3. Circle generator

Test:

- [ ] odd diameter, e.g. 21;
- [ ] even diameter, e.g. 20;
- [ ] Thin;
- [ ] Thick;
- [ ] Filled;
- [ ] common preset buttons;
- [ ] Center instructions;
- [ ] Edge instructions;
- [ ] optional world coordinates for odd dimensions;
- [ ] optional world coordinates for even dimensions using .5 centers;
- [ ] world coordinates are absent from shared URLs;
- [ ] progress save after refresh;
- [ ] Complete Segment;
- [ ] Complete Row;
- [ ] Undo;
- [ ] Reset progress;
- [ ] Fit / zoom;
- [ ] Copy link;
- [ ] Send to phone QR;
- [ ] PNG;
- [ ] SVG;
- [ ] Print;
- [ ] TXT;
- [ ] Litematic.

Golden counts:

- 11×11 Thin = 28 blocks
- 21×21 Thin = 56 blocks
- 31×31 Thin = 84 blocks

## 4. Oval generator

Test:

- [ ] odd/odd dimensions;
- [ ] even/odd dimensions;
- [ ] extreme wide oval;
- [ ] extreme tall oval;
- [ ] Thin / Thick / Filled;
- [ ] guided rows;
- [ ] exports;
- [ ] share state.

## 5. Dome generator

Test:

- [ ] hemisphere shortcut;
- [ ] low dome;
- [ ] tall dome;
- [ ] Thin shell;
- [ ] Thick shell;
- [ ] Filled;
- [ ] layer count;
- [ ] layer block count;
- [ ] Previous / Next layer;
- [ ] direct Layer N jump;
- [ ] Ghost Layer;
- [ ] row boundary delta;
- [ ] Complete Segment;
- [ ] Complete Row;
- [ ] Complete Layer;
- [ ] local progress restore;
- [ ] PNG exports current layer;
- [ ] SVG exports current layer;
- [ ] Print includes blueprint + full plan;
- [ ] TXT includes Layer / Row / Segment instructions;
- [ ] TXT includes world X/Y/Z when enabled;
- [ ] Litematic.

## 6. Litematic manual import gate

Automated tests validate NBT metadata and occupied palette counts, but **do not claim full real-world compatibility until these files have been imported into a supported Litematica workflow**.

Manual gate:

- [ ] Circle odd
- [ ] Circle even
- [ ] Oval
- [ ] Dome hollow
- [ ] Dome filled
- [ ] Stone Bricks palette
- [ ] fallback Stone palette
- [ ] imported block count equals VoxelCurve block count
- [ ] origin and orientation are correct

Record the Minecraft / Litematica versions used for validation.

## 7. Mobile

Check at approximately 375px width on:

- [ ] iOS Safari
- [ ] Android Chrome

Verify:

- [ ] Blueprint appears before settings;
- [ ] Build controls remain usable;
- [ ] Shape settings collapse;
- [ ] mobile navigation opens and closes;
- [ ] pinch zoom works;
- [ ] dragging pans without marking progress;
- [ ] no horizontal page overflow;
- [ ] 44px touch targets;
- [ ] QR dialog fits;
- [ ] Keep screen awake appears only on supported browsers;
- [ ] Wake Lock releases/reacquires correctly when switching apps;
- [ ] large Dome layer controls remain usable.

## 8. Desktop browser smoke test

Check:

- [ ] Chrome
- [ ] Firefox
- [ ] Edge
- [ ] Safari when available

## 9. Cloudflare / domain

- [ ] `https://voxelcurve.com` loads over HTTPS
- [ ] `https://www.voxelcurve.com/*` redirects to apex
- [ ] `https://voxelcurve.pages.dev/*` redirects to apex
- [ ] Preview Pages hosts are noindex
- [ ] CSP does not block the tool
- [ ] QR dynamic import works under CSP
- [ ] Litematic dynamic import works under CSP
- [ ] static hashed assets receive immutable cache headers

## 10. Search

- [ ] `https://voxelcurve.com/sitemap.xml` returns 200
- [ ] `https://voxelcurve.com/robots.txt` returns 200
- [ ] Submit Sitemap to Google Search Console
- [ ] Submit Sitemap to Bing Webmaster Tools
- [ ] Inspect homepage
- [ ] Inspect Circle Chart
- [ ] Inspect Circle Guide
- [ ] Inspect Dome
- [ ] Inspect Oval

Do not submit fragment states as URLs.

## 11. Social sharing

- [ ] `og.png` is 1200×630
- [ ] shared homepage shows VoxelCurve preview
- [ ] Copy Link always uses `voxelcurve.com`
- [ ] QR always encodes `voxelcurve.com`

## 12. Performance

Automated bundle budgets are only a guardrail.

After production deployment, run Lighthouse / PageSpeed on:

- [ ] homepage desktop
- [ ] homepage mobile
- [ ] Dome mobile

Target lab scores:

- Performance ≥ 95
- Accessibility ≥ 95
- Best Practices ≥ 95
- SEO ≥ 95

Treat field Core Web Vitals as the real long-term signal.

## 13. Monitoring cadence

After the release is stable:

### Week 2

Check:

- indexing;
- Sitemap;
- crawl errors;
- 404;
- Core Web Vitals;
- initial queries.

### Week 6

Check:

- impressions;
- query distribution;
- CTR;
- Circle vs Chart vs Guide vs Dome/Oval visibility.

### Week 12

Decide:

- leave stable;
- make small evidence-based fixes;
- invest further only if search data justifies it.

Avoid redesigning VoxelCurve without evidence after release.
