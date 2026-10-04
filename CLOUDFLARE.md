# VoxelCurve Cloudflare Production Setup

VoxelCurve is a static Astro site deployed from GitHub `main` to Cloudflare Pages.

## Pages project

Use:

```
Production branch: main
Build command: npm run build
Output directory: dist
Root directory: repository root
NODE_VERSION: 22
```

Attach this custom domain in **Workers & Pages → voxelcurve → Custom domains**:

```
voxelcurve.com
```

## Canonical host redirects

Cloudflare Pages `_redirects` does **not** support domain-level redirects. Configure these at the account level with **Bulk Redirects**.

### 1. pages.dev → production domain

Source:

```
voxelcurve.pages.dev
```

Target:

```
https://voxelcurve.com
```

Status: **301**

Enable:

- Preserve query string
- Subpath matching
- Preserve path suffix
- Include subdomains: **disabled**

This sends `voxelcurve.pages.dev/foo` to `https://voxelcurve.com/foo`. Keep Include subdomains disabled so commit and branch preview hosts remain available for verifying changes before release. Preview hosts retain `X-Robots-Tag: noindex`. Cloudflare's [parameter reference](https://developers.cloudflare.com/rules/url-forwarding/bulk-redirects/reference/parameters/) confirms that enabling this option also matches subdomains.

### 2. www → apex

Source:

```
www.voxelcurve.com
```

Target:

```
https://voxelcurve.com
```

Status: **301**

Enable:

- Preserve query string
- Subpath matching
- Preserve path suffix
- Include subdomains: **disabled**

Ensure `www` has a proxied Cloudflare DNS record so the redirect rule can execute.

## Search fallback

`public/_headers` sends:

```
X-Robots-Tag: noindex
```

on the `voxelcurve.pages.dev` host and Pages preview subdomains. This is a fallback against accidental duplicate indexing; it does not replace the canonical-host redirects.

## Production verification

After propagation, verify:

```
https://voxelcurve.com/
https://www.voxelcurve.com/
https://voxelcurve.pages.dev/
https://voxelcurve.com/robots.txt
https://voxelcurve.com/sitemap.xml
```

Expected:

- apex returns the production site over HTTPS;
- `www` returns 301 to apex;
- `pages.dev` returns 301 to apex;
- sitemap and robots return 200;
- fragment blueprint URLs remain client-side state and are never listed in Sitemap.

Run `npm run release:check` after deployment. Its nonzero exit status means a production gate failed; an unreachable custom domain must not be counted as successful merely because a Pages preview works. The command makes no account changes and does not submit URLs to search engines.
