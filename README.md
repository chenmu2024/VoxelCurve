# VoxelCurve

VoxelCurve is a static, browser-based Minecraft building geometry utility focused on circle, oval and dome blueprints with guided row/segment/layer construction.

## Stack

- Astro + TypeScript
- Client-side geometry engine
- Canvas blueprint renderer
- Browser-local progress storage
- PNG, TXT and `.litematic` export
- No database or paid API

## Local development

```bash
npm install
npm run dev
```

## Production build

```bash
npm run build
```

Output directory: `dist`

## Cloudflare Pages

- Production branch: `main`
- Build command: `npm run build`
- Build output directory: `dist`
- Root directory: `/`
- Node.js: current supported LTS / 22 compatible

Canonical production URL: `https://voxelcurve.com`

## Trademark

NOT AN OFFICIAL MINECRAFT PRODUCT. NOT APPROVED BY OR ASSOCIATED WITH MOJANG OR MICROSOFT. Minecraft is a trademark of Microsoft Corporation.
