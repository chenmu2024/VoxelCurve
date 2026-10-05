# VoxelCurve SEO / GEO release gate

Reviewed 2026-10-05 against [Website-Starter-Standard / SEO-GEO-QUALITY-GATE.md](https://github.com/chenmu2024/Website-Starter-Standard/blob/main/SEO-GEO-QUALITY-GATE.md), file SHA `a433154917576785bbf2292a225bf674952fbd23`.

## Architecture and immutable inputs

`FINAL_STANDARD.txt` remains the product scope. `SEO_KEYWORDS.json` locks all 52 owner-approved phrases and their canonical destinations; no keyword metrics are invented or refreshed. The original volume/KD tables in SEO.md are historical supplied planning data, not current estimates. The CSV delivered with the previously approved keyword plan is the source of the lock.

| Canonical path | Page type | Primary intent | Internal links |
|---|---|---|---|
| `/` | Homepage / circle tool | minecraft circle generator | Hub for all four resources and tools |
| `/minecraft-circle-chart` | Reference chart | minecraft circle chart | Circle tool presets, guide, dome |
| `/how-to-make-a-circle-in-minecraft` | Guide | how to make a circle in minecraft | Circle tool examples, chart, dome |
| `/minecraft-dome-generator` | Generator | minecraft dome generator | Circle, oval, guide |
| `/minecraft-oval-generator` | Generator | minecraft oval generator | Circle, dome, chart |
| `/about`, `/contact` | Identity / support | Project and maintenance information | All important destinations via navigation |
| `/privacy`, `/terms`, `/disclaimer` | Legal | Policies and independent-project disclosure | All important destinations via navigation |

All ten canonical pages are indexable with self-referencing canonicals. `/404` is noindex and missing URLs must return HTTP 404. Child URLs have no trailing slash. Settings use fragments; query parameters do not create new intent destinations. www and the default Pages hostname redirect to the canonical host, retaining paths and query strings. Preview deployments remain noindex. No new synonym URLs are permitted. The site is English-only: no unvalidated translations, hreflang or x-default are emitted.

`public/sitemap.xml` owns the ten intended indexable URLs. It is checked against built routes; there is no fabricated automatic lastmod. Site-wide Organization and WebSite identities use stable @id values. WebPage, tool SoftwareApplication, guide Article and non-home BreadcrumbList must match visible content. No ratings/reviews, credentials, traffic numbers or FAQ rich-result promises may be fabricated.

## Implemented content policy

- Keep utility visible at the start and public content in static initial HTML.
- Explain outside dimensions in blocks, center sampling, hollow/filled behavior, exact output counts and practical limitations using the actual geometry implementation.
- Generate example counts at build time from the same geometry source as the tools.
- Link the implementation and upstream Litematica project where users need to check methods or compatibility.
- Identify VoxelCurve as the project maintaining the tool; do not invent a personal expert author. Use fixed visible reviewed dates only for substantively reviewed content.
- Preserve all approved keyword strings while adding explanatory prose; no AI keyword pages, paid services, tracking or new product features.

## Evidence classes and primary references

**Official requirements:** canonical/indexable content and technical eligibility, truthful structured data, required breadcrumb properties. [Google AI features](https://developers.google.com/search/docs/appearance/ai-features), [breadcrumb](https://developers.google.com/search/docs/appearance/structured-data/breadcrumb), [software app](https://developers.google.com/search/docs/appearance/structured-data/software-app).

**Documented best practices:** helpful original content, early direct answers, internal links, explicit methods, performance. [Google generative AI guide](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide), [web.dev vitals](https://web.dev/articles/vitals), [Schema.org](https://schema.org/).

Google's software-app rich results require a genuine rating or review; the truthful software entity is retained without adding a fabricated rating or claiming eligibility. [Google documentation updates](https://developers.google.com/search/updates) record FAQ rich-result removal in 2026; useful FAQ text is retained without deprecated rich-result tactics. llms.txt is optional and not required for Google AI Search; this release does not add it. Search-crawler permission and model-training permission are separate; existing robots rules are preserved rather than silently changing the owner's training policy.

**Third-party evidence:** none used for ranking or keyword metrics in this release.

**Internal heuristics:** keyword coverage, uniqueness/count checks, fingerprints, orphan checks and build budgets are engineering regression checks, not Google ranking rules. This is five distinct core pages, not a large-scale programmatic expansion. The shared tool shell is expected; original chart data, guide instructions and geometry-specific methods provide distinct value. Legal/support pages are not padded to a word threshold.

## Verification and post-launch baseline

L1: type check, unit/export tests, built-HTML SEO audit, exact keywords, headings, robots, canonical, schema references, sitemap, links/assets and status checks.

L2: complete browser regression, raw-versus-rendered primary content, mobile/tablet/desktop layout and visual checks, axe scan, production crawl/redirects, source/content review, schema eligibility review, Lighthouse lab LCP/CLS/TBT and reproducible interaction measurements. TBT and click timings must not be mislabeled as field INP.

Capture before/after production baselines outside the published site: title/description/H1/headings, robots, canonical, schema, hreflang absence, content fingerprints and counts, links/assets, sitemap membership, final status/URL and available lab metrics. Future audits compare these values instead of producing an unexplained score.

L3 remains unmeasured until GSC/Bing verification and field data are available. Analytics is explicitly deferred. No claim of indexed status, actual query positions, traffic, backlinks, CrUX p75 INP or AI citation visibility is permitted without data. Real devices, game import and actual mailbox receipt remain separate practical acceptance tasks.
