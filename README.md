# VoxelCurve

**VoxelCurve** is a static, browser-based Minecraft building geometry utility that turns circles, ovals and domes into exact construction plans.

Production: **https://voxelcurve.com**

## Product scope

VoxelCurve intentionally stays narrow.

Core tools:

- Minecraft Circle Generator
- Minecraft Oval Generator
- Minecraft Dome Generator
- Minecraft Circle Chart
- How to Make a Circle in Minecraft guide
- Guided row / segment / layer building
- immersive Build Mode for focused desktop/mobile construction
- Browser-local build progress
- Material and stack counts
- Share URL + QR
- PNG export
- Printable build plan
- TXT guided build plan
- `.litematic` export

Explicitly out of scope unless future search data justifies a new decision:

- Sphere
- generic Minecraft wiki/news content
- skins, seeds, mobs, recipes, servers and mods
- accounts or cloud sync
- database
- paid APIs
- AI features
- PWA
- 3D preview
- World coordinates
- Wake Lock
- SVG export
- `.schem`, `.mcstructure`, `.mcfunction`

## Source-of-truth documents

`FINAL_STANDARD.txt` is the user's locked final product and acceptance standard. Earlier plans, recommendations and implemented features do not override it. The documents below describe its implementation and must remain consistent with it. Only an explicit user decision can change scope. The user has temporarily deferred analytics; no analytics provider should be enabled until requested.

Before changing product behavior or UI, read:

- `DESIGN.md` — VoxelCurve visual system and responsive rules
- `GEOMETRY.md` — normative geometry conventions and invariants
- `SEO.md` — canonical keyword clusters and page ownership
- `RELEASE_CHECKLIST.md` — production and post-launch verification gates
- `SECURITY.md` — security reporting rules

Do not introduce a new geometry convention, design language or synonym landing page without explicitly revising the corresponding source-of-truth document.

## Stack

- Astro 7.2.8
- TypeScript 5.9.3
- static output
- client-side geometry engine
- Canvas blueprint renderer
- lightweight QR generation
- `fflate` for browser-side Litematic compression
- localStorage for compact build progress
- Cloudflare Pages
- GitHub Actions
- npm 11.21.0 + committed package-lock

No database, server API or paid runtime service is required.

## Architecture

```
src/
├── components/
│   ├── BrandMark.astro
│   ├── CircleMiniPreview.astro
│   ├── Footer.astro
│   ├── Header.astro
│   └── ToolApp.astro
├── layouts/
│   └── BaseLayout.astro
├── core/geometry/
│   └── index.ts
├── lib/
│   ├── buildPlan.ts
│   ├── litematic.ts
│   ├── progress.ts
│   ├── schema.ts
│   ├── state.ts
├── pages/
└── styles/
```

Geometry is generated once as compact row/layer spans.

Canvas, material counts, PNG output, TXT plans, print output and Litematic export must consume the same `ShapeResult`.

## Development

Use Node.js 22 with npm 11.21.0.

```bash
npm ci
npm run dev
```

## Tests

```bash
npm test
```

Current regression coverage includes:

- common Circle golden fixtures
- odd/even symmetry
- bounds and uniqueness
- Thin / Thick semantics
- Oval bounds
- Dome layer sums
- hollow Dome cap behavior
- Dome symmetry
- guided center instructions
- TXT block-count consistency
- Litematic NBT smoke validation
- Litematic occupied-palette count vs geometry
- oversized Litematic safety guards
- blueprint URL fragment round-trips and malformed-state rejection
- canonical production share URLs
- compact progress bitset round-trips
- legacy progress migration and stale-key filtering

## Production build

```bash
npm run security:audit
npm test
npm run build
npm run audit
```

After deploying the release to the custom domain, run `npm run release:check` to verify production HTTPS, canonical URLs, indexability, geometry version, Sitemap, robots, 404 and host redirects. This read-only check fails when production still serves an older geometry version or a required domain is unavailable. It does not replace real-device/game tests, search-platform submissions or launch distribution.

Production dependency security is a release gate: `npm audit --omit=dev --audit-level=moderate` must pass before deployment.

The production audit fails CI if it detects problems such as:

- missing required pages
- duplicate titles
- duplicate meta descriptions
- missing or multiple H1 problems
- missing / invalid canonical URLs
- broken internal links
- missing local assets
- 404 accidentally indexed
- unexpected Sitemap URLs
- placeholder/development content
- oversized JS/CSS bundles

## Cloudflare Pages

Production configuration:

```
Project: voxelcurve
Production branch: main
Build command: npm run build
Output directory: dist
Root directory: repository root
NODE_VERSION: 22
```

GitHub `main` deploys automatically through Cloudflare Pages.

Canonical host is:

```
https://voxelcurve.com
```

**Important:** Cloudflare Pages `_redirects` does not support domain-level redirects. Configure the `pages.dev` and `www` host redirects with **Cloudflare Bulk Redirects**. See `CLOUDFLARE.md`.

The repository keeps `X-Robots-Tag: noindex` on the `pages.dev` production and preview hosts as a search-indexing fallback.

## Canonical SEO pages

```
/
├── /minecraft-circle-chart
├── /how-to-make-a-circle-in-minecraft
├── /minecraft-dome-generator
├── /minecraft-oval-generator
├── /about
├── /contact
├── /privacy
├── /terms
└── /disclaimer
```

Canonical Sitemap:

```
https://voxelcurve.com/sitemap.xml
```

Blueprint parameters stay in URL fragments and are not separate crawlable pages.

## Geometry versioning

Current geometry version:

```
GEOMETRY_VERSION = 3
```

If a geometry change alters occupied blocks for the same inputs, increment the geometry version so saved progress cannot be incorrectly applied to a new blueprint.

See `GEOMETRY.md`.

## Performance policy

Keep the site static-first and dependency-light.

Current CI budgets:

- no individual JS chunk above 150 KB gzip
- total built JS below 150 KB gzip
- total built CSS below 100 KB gzip

Do not add a large UI framework, animation framework or 3D engine without an explicit product reason.

## Litematic safety

The exporter currently targets **Litematic format V6 / Minecraft Java 1.20.4 DataVersion (3700)**, matching Litematica's own V6 compatibility writer path. Real-world import remains a manual release gate.

The exporter uses a two-entry palette:

- air
- one selected block

Unknown custom material labels fall back to `minecraft:stone`.

Browser export rejects structures above:

- 20,000,000 bounding-volume cells
- 5,000,000 occupied blocks

This protects the main thread and memory on large filled structures.

## Trademark

NOT AN OFFICIAL MINECRAFT PRODUCT. NOT APPROVED BY OR ASSOCIATED WITH MOJANG OR MICROSOFT.

Minecraft is a trademark of Microsoft Corporation. VoxelCurve is an independent fan-made building utility.

## Verification and usage events

Run `npm run check`, `npm test`, `npm run build`, `npm run audit` and `npm run security:audit`. For browser checks, install the Playwright browsers with `npx playwright install chromium firefox webkit`, then run `npm run test:browser`. Build before running the browser suite. CI runs the same gates.

The geometry tests cover bounds, symmetry, row/layer sums, continuity, extreme aspect ratios, maximum sizes and golden row fixtures. The export tests independently decode NBT and compare every occupied cell with the geometry engine. Browser tests cover progress, undo, sharing, downloads, printing and narrow-screen layouts in Chromium, Firefox and WebKit. Emulation does not replace physical-device testing or a Minecraft/Litematica import.

The page emits `voxelcurve:usage` CustomEvents with action names and shape only. No analytics service is configured and no event data is transmitted. A deployment may connect an approved analytics provider to this hook.

Material suggestions match the Litematic block palette. Custom TXT/print labels are allowed, but an unsupported Litematic label requires explicit confirmation before exporting Stone. Progress has a persistent saved/restored/unavailable status. Row/layer jumps and next-unfinished navigation never mark blocks complete.

Litematic generation runs in a cancellable Web Worker using a snapshot of the blueprint and material at export start. Navigation and subsequent input changes do not change that file. Limits remain 20,000,000 bounding cells and 5,000,000 occupied blocks. The download panel includes placement steps and axes; real-device and in-game validation are still required.

Geometry v3 fixes the 3×3 thin outline center. Earlier-version saved progress is intentionally not reused.
