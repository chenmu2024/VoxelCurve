# VoxelCurve SEO Map

Reviewed: 2026-10-04

Source note: search-volume and KD values below come from the keyword export supplied for this project. They are planning inputs, not traffic forecasts.

## 1. SEO architecture rule

VoxelCurve uses **one page per search intent cluster**, not one page per keyword.

Synonyms that describe the same job belong on the same canonical page.

Do not create thin synonym pages merely to place an exact-match phrase in a URL.

## 2. Canonical indexable pages

| URL | Primary intent |
|---|---|
| `/` | Minecraft circle generator / maker / calculator |
| `/minecraft-circle-chart` | Circle chart / diagram / template / grid |
| `/how-to-make-a-circle-in-minecraft` | How to build a Minecraft circle |
| `/minecraft-dome-generator` | Minecraft dome generator / maker / creator |
| `/minecraft-oval-generator` | Minecraft oval generator |
| `/about` | Brand/about |
| `/contact` | Contact |
| `/privacy` | Privacy |
| `/terms` | Terms |
| `/disclaimer` | Trademark disclaimer |

Parameter / blueprint state belongs in the URL fragment and must not create a separate indexable URL.

## 3. Homepage: Circle Generator cluster

Canonical:

```
https://voxelcurve.com/
```

Primary:

| Keyword | Volume | KD |
|---|---:|---:|
| minecraft circle generator | 33,100 | 33 |

Supporting same-intent terms:

| Keyword | Volume | KD |
|---|---:|---:|
| mc circle generator | 12,100 | 25 |
| minecraft circle | 12,100 | 47 |
| circle maker minecraft | 9,900 | 34 |
| circle generator minecraft | 9,900 | 26 |
| minecraft circles | 9,900 | 47 |
| pixel circle generator | 6,600 | 29 |
| mc circle maker | 4,400 | 41 |
| minecraft circle gen | 3,600 | 36 |
| pixel circle maker | 3,600 | 30 |
| pixel circle | 3,600 | 24 |
| circle minecraft generator | 1,600 | 38 |
| minecraft circle maker | 1,300 | 39 |
| minecraft circle calculator | 1,000 | 25 |
| minecraft circle calc | 1,000 | 24 |
| minecraft pixel circle generator | 1,000 | 27 |
| minecraft circle schematic maker | 480 | 31 |
| circle builder minecraft | 170 | 19 |

Do **not** create:

```
/mc-circle-generator
/pixel-circle-generator
/minecraft-circle-maker
/minecraft-circle-calculator
/circle-generator-minecraft
```

These remain homepage synonyms.

## 4. Circle Chart cluster

Canonical:

```
/minecraft-circle-chart
```

Primary:

| Keyword | Volume | KD |
|---|---:|---:|
| minecraft circle chart | 6,600 | 32 |

Supporting terms:

| Keyword | Volume | KD |
|---|---:|---:|
| minecraft circle diagram | 2,900 | 57 |
| circle chart minecraft | 1,600 | 29 |
| minecraft circle template | 1,000 | 38 |
| minecraft circles chart | 880 | 39 |
| minecraft circle graph | 720 | 54 |
| circle template minecraft | 480 | 36 |
| circle chart for minecraft | 390 | 37 |
| minecraft circle grid | 210 | 25 |

The page must keep real crawlable preset data and static previews, not Canvas-only output.

## 5. Circle Guide cluster

Canonical:

```
/how-to-make-a-circle-in-minecraft
```

Primary:

| Keyword | Volume | KD |
|---|---:|---:|
| how to make a circle in minecraft | 4,400 | 30 |

Supporting terms:

| Keyword | Volume | KD |
|---|---:|---:|
| how to make a minecraft circle | 1,000 | 36 |
| how to make circle in minecraft | 880 | 38 |
| how to build a circle in minecraft | 720 | 24 |
| minecraft how to make a circle | 590 | 24 |
| how to create a circle in minecraft | 480 | 29 |
| how to make a large circle in minecraft | 210 | 33 |
| make minecraft circle | 210 | 20 |

This page teaches construction. It must not become a duplicate copy of the homepage generator description.

## 6. Dome cluster

Canonical:

```
/minecraft-dome-generator
```

Primary:

| Keyword | Volume | KD |
|---|---:|---:|
| minecraft dome generator | 1,900 | 16 |

Supporting terms:

| Keyword | Volume | KD |
|---|---:|---:|
| minecraft dome | 1,900 | 34 |
| minecraft dome maker | 880 | 10 |
| dome generator minecraft | 720 | 12 |
| minecraft how to build a dome | 720 | 32 |
| mc dome | 720 | 27 |
| minecraft dome creator | 590 | 9 |
| minecraft dome guide | 320 | 14 |

The Dome page owns layer-by-layer dome construction intent.

## 7. Oval cluster

Canonical:

```
/minecraft-oval-generator
```

Primary:

| Keyword | Volume | KD |
|---|---:|---:|
| minecraft oval generator | 480 | 18 |

Supporting terms:

| Keyword | Volume | KD |
|---|---:|---:|
| oval generator minecraft | 390 | 28 |
| oval minecraft | 320 | 13 |
| minecraft oval | 320 | 19 |

Do not create separate low-value synonym pages.

## 8. Sphere

No dedicated Sphere page exists.

Reason: the project does not yet have keyword data of the same confidence as Circle / Dome / Oval, while Sphere would materially increase geometry, testing and maintenance scope.

Do not add `/minecraft-sphere-generator` unless new opportunity-radar evidence justifies it.

## 9. Terms intentionally excluded

Do not expand this site around unrelated Minecraft traffic merely because a term has volume.

Examples:

- minecraft heart
- creaking minecraft
- mobs
- skins
- seeds
- servers
- recipes
- mods
- news

VoxelCurve's topical boundary is Minecraft building geometry.

## 10. On-page rules

Every indexable page must have:

- one unique Title;
- one H1;
- one unique Meta Description;
- self-referencing canonical;
- distinct search intent;
- crawlable HTML text;
- internal links;
- no placeholder content.

The CI site audit enforces the technical subset of these rules.

## 11. AI search / GEO

VoxelCurve does not use a separate "AI SEO" system.

Use standard search fundamentals:

- direct answers;
- real generated data;
- static tables/previews where useful;
- semantic headings;
- structured data only when accurate;
- explicit terminology;
- strong internal linking;
- fast, accessible pages.

## 12. Cannibalization rule

Supporting keywords may appear naturally on related pages.

Cannibalization is managed through:

- one primary intent per canonical URL;
- unique Title/H1/content;
- clear internal-link roles;
- no duplicate synonym landing pages.

Actual query overlap should be judged later using Search Console data, not by banning a term from appearing on more than one page.
