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
- Browser-local build progress
- Material and stack counts
- Share URL + QR
- progressive screen Wake Lock during build mode
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
- `.schem`, `.mcstructure`, `.mcfunction`

## Source-of-truth documents

Before changing product behavior or UI, read:

- `DESIGN.md` — VoxelCurve visual system and responsive rules
- `GEOMETRY.md` — normative geometry conventions and invariants
- `SEO.md` — canonical keyword clusters and page ownership
- `RELEASE_CHECKLIST.md` — production and post-launch verification gates
- `SECURITY.md` — security reporting rules

Do not introduce a new geometry convention, design language or synonym landing page without explicitly revising the corresponding source-of-truth document.

## Stack

- Astro
- TypeScript
- static output
- client-side geometry engine
- Canvas blueprint renderer
- lightweight QR generation
- `fflate` for browser-side Litematic compression
- localStorage for compact build progress
- Cloudflare Pages
- GitHub Actions

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
├── lib/
│   ├── buildPlan.ts
│   ├── geometry.ts
│   ├── litematic.ts
│   ├── progress.ts
│   ├── schema.ts
│   └── state.ts
├── pages/
└── styles/
```

Geometry is generated once as compact row/layer spans.

Canvas, material counts, TXT plans, print output and Litematic export must consume the same `ShapeResult`.

## Development

Use Node.js 22.

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

The Pages hostname and `www` hostname redirect to:

```
https://voxelcurve.com
```

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
GEOMETRY_VERSION = 2
```

If a geometry change alters occupied blocks for the same inputs, increment the geometry version so saved progress cannot be incorrectly applied to a new blueprint.

See `GEOMETRY.md`.

## Performance policy

Keep the site static-first and dependency-light.

Current CI budgets:

- no individual JS chunk above 150 KB gzip
- total built JS below 300 KB gzip
- total built CSS below 100 KB gzip

Do not add a large UI framework, animation framework or 3D engine without an explicit product reason.

## Litematic safety

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
