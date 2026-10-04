# VoxelCurve DESIGN.md

## 1. Brand Principle

VoxelCurve is a **Precision Voxel Workspace** for Minecraft builders.

It must feel like a professional construction instrument, not a fan site, not a generic SaaS landing page, and not a gaming dashboard.

Core visual ideas:
- Precision
- Geometry
- Blueprint
- Grid
- Progress
- Construction
- Restraint

Reference influences:
- Vercel: precision, monochrome chrome, spatial restraint
- Linear: product-workspace density, hairline hierarchy, state clarity
- PlayStation: scene-based page rhythm, touch ergonomics, game-adjacent confidence
- VoxelCurve: voxel grid, blueprint blocks, guided build states, emerald signal color

Do not copy any source literally. VoxelCurve must remain visually distinct.

---

## 2. Visual Atmosphere

Default mode:
- White canvas
- Neutral greys
- Near-black text
- One emerald signal color
- Minimal shadow
- Hairline borders
- Tight radii
- Large blueprint surface

The product UI is the visual hero.

Do not add:
- Minecraft textures
- grass blocks
- Creepers
- pixel-font body copy
- gaming neon
- decorative gradients
- glassmorphism
- excessive card nesting

---

## 3. Color Tokens

```css
--vc-canvas: #ffffff;
--vc-canvas-soft: #fafafa;
--vc-surface: #ffffff;
--vc-surface-subtle: #f7f7f7;
--vc-surface-muted: #f2f3f3;

--vc-ink: #171717;
--vc-ink-secondary: #454545;
--vc-muted: #626262;
--vc-faint: #6b6b6b;

--vc-line: #e7e7e7;
--vc-line-strong: #d4d4d4;

--vc-emerald: #34d399;
--vc-emerald-deep: #10b981;
--vc-emerald-text: #047857;
--vc-emerald-soft: #ecfdf5;

--vc-blueprint-current: #171717;
--vc-blueprint-block: #34d399;
--vc-blueprint-complete: #a7f3d0;
--vc-axis: #f59e0b;

--vc-night: #171717;
--vc-night-raised: #202020;
--vc-on-night: #f7f7f7;
```

Rules:
- Emerald is a signal, not a wallpaper.
- Use emerald for primary action, active state, focus, progress, blueprint blocks, and small brand details.
- Keep all other chrome monochrome.
- Warm orange is reserved for blueprint center/axis guidance only.

---

## 4. Typography

Primary:
```
Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif
```

Technical / blueprint:
```
ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace
```

Hierarchy:

| Role | Size | Weight | Tracking |
|---|---:|---:|---:|
| Hero | 56px desktop / 36px mobile | 600 | -0.045em |
| H2 | 36px | 550-600 | -0.035em |
| H3 | 22px | 600 | -0.02em |
| Body | 15-16px | 400 | normal |
| UI label | 12-13px | 600 | +0.04em when uppercase |
| Button | 14px | 550-600 | normal |
| Metric | 22px | 600 | -0.02em |
| Blueprint meta | 12-13px | 500 | mono |

Rules:
- Never use 700/800 everywhere.
- Strong hierarchy must come from size, whitespace and contrast before weight.
- Use monospace only for geometry, coordinates, layer/row/segment metadata and code.

---

## 5. Spacing

Base rhythm: 4px, primary rhythm: 8px.

Tokens:
```
4, 8, 12, 16, 24, 32, 48, 64, 96
```

Desktop section spacing:
- 72-96px major content sections
- 32px between section title and content
- 16-24px inside workspace regions

Mobile:
- 48-64px major sections
- 16px outer page gutters
- 12-16px internal utility spacing

---

## 6. Radius

Use a strict scale:

```
4px  tiny utility
6px  buttons / inputs
8px  internal surfaces
12px workspace / cards
16px modal only
999px badges only
```

Never introduce arbitrary 10 / 14 / 18 / 20 / 24px radii.

---

## 7. Elevation

VoxelCurve is primarily flat.

```
Level 0: none
Level 1: 0 1px 2px rgba(0,0,0,.04)
Level 2: 0 8px 24px rgba(0,0,0,.08)
```

Usage:
- Workspace: Level 0
- Small floating utility: Level 1
- Modal / QR dialog: Level 2

Do not use large resting shadows on cards.

---

## 8. Workspace Layout

Desktop:
```
┌──────────────────────────────────────────────────────────────┐
│ CONTROLS      │              BLUEPRINT        │ BUILD        │
│ 248-264px     │              flexible         │ 280-304px    │
└──────────────────────────────────────────────────────────────┘
```

This is **one workspace**, not three floating cards.

Rules:
- One outer border
- 12px outer radius
- No panel shadows
- Hairline vertical separators
- Blueprint receives the largest area
- Toolbar belongs to blueprint surface

Tablet:
- Controls above blueprint
- Build panel below / beside depending on width

Mobile Build Mode priority:
1. Blueprint
2. Current Step
3. Complete / Previous / Next
4. Progress
5. Controls
6. Materials / Export

The mobile experience must optimize for someone building in-game while holding a phone.

---

## 9. Blueprint Language

Blueprint is VoxelCurve's equivalent of product photography.

Canvas:
- white / soft white
- very light neutral grid
- emerald blocks
- black current segment
- mint completed blocks
- orange center axes

Recommended:
```
Grid: #eeeeee
Block: #34d399
Completed: #a7f3d0
Current: #171717
Axis: #f59e0b
```

Avoid decorative images around the blueprint.

---

## 10. Voxel Motif

Voxel identity must be subtle.

Allowed:
- small 1px grid motifs
- square status markers
- segmented progress
- tiny block clusters in logo / eyebrow / technical metadata

Not allowed:
- grass textures
- dirt textures
- Creeper graphics
- pixel-font paragraphs
- blocky borders around everything

---

## 11. Controls

Controls must feel like a compact engineering utility.

Inputs:
- 6px radius
- 40-44px height
- 1px hairline
- strong focus state with emerald border/focus ring

Prefer segmented controls for small option sets:
```
Thin | Thick | Filled
```

Preset chips may use pill shape, but only because they are filters/presets.

Do not make every setting a large card.

---

## 12. Build Navigator

Information order:
1. Metrics
2. Current step
3. Progress
4. Build controls
5. Export

Only one high-intensity primary action per viewport:
- Complete = emerald
- Other actions = neutral outline / monochrome

Current step format:
```
ROW 01 · SEGMENT 01
Center · place 7
Columns 13–19
```

Use monospace for row/layer/segment identifiers.

---

## 13. Buttons

Primary:
- emerald
- dark text
- 6px radius
- 40-44px minimum touch height

Secondary:
- white
- 1px hairline-strong
- near-black text

Toolbar icon/compact:
- white / transparent
- 1px hairline
- 36-40px target

Do not use pill CTAs except tags/presets.

---

## 14. Cards

Cards are not the default layout mechanism.

Use cards only when content genuinely groups into a separate object.

Default card:
- white
- 1px hairline
- 12px radius
- no resting shadow
- 24-32px padding

Avoid nested card-in-card UI.

---

## 15. Content Pages

Tool pages:
- product first
- content second

Guide / Chart:
- reading width 720-820px where appropriate
- 16px body
- 1.6-1.7 line-height
- clear H2 rhythm
- minimal callouts
- tables use hairline rows, not heavy card chrome

SEO content must look editorial, not like filler cards.

---

## 16. Dark Band

One dark technical band may appear per long page.

Purpose:
- product philosophy
- trust / technical statement
- visual rhythm

Example:
```
BUILT FOR BUILDERS

No account.
No server.
No counting every block.
Your plan stays in your browser.
```

Rules:
- near-black background
- white / muted text
- one emerald signal
- no gradient
- no extra imagery

---

## 17. Header

Desktop height: 60px.

Brand:
- compact 30px mark
- medium display weight
- no oversized logo

Navigation:
- simple text links
- no pill backgrounds
- active state by text contrast / subtle underline

Mobile:
- compact navigation strategy
- do not let navigation push the tool below the fold unnecessarily

---

## 18. Footer

Footer should be quiet.

Preferred:
- near-black or white depending on page rhythm
- small type
- low-contrast legal text
- clear Tool / Site / Legal groups
- no oversized CTA

---

## 19. Accessibility

- Minimum mobile interactive target: 44×44px
- Visible keyboard focus
- Do not encode current/completed state by color alone
- Maintain WCAG AA contrast. On light surfaces, use #047857 for small green text; on dark tool surfaces, use #9ca39e or lighter for secondary labels.
- Preserve semantic labels and form labels
- Canvas must be accompanied by readable build instructions

---

## 20. Responsive Rules

Breakpoints:
- Wide: >= 1440
- Desktop: 1024-1439
- Tablet: 768-1023
- Mobile: < 768
- Narrow mobile: < 480

Key behavior:
- Workspace 3-column → stacked/simplified
- Mobile blueprint first
- Export can move lower
- Touch targets expand
- Hero 56 → 44 → 36
- Section padding 80 → 64 → 48

---

## 21. Do

- Make the blueprint the visual protagonist.
- Use one workspace instead of three floating cards.
- Use emerald sparingly.
- Use hairlines for hierarchy.
- Use monospace for geometric metadata.
- Keep button/input radii tight.
- Prioritize mobile building workflow.
- Keep content editorial and readable.
- Prefer function-driven visuals over decorative imagery.

---

## 22. Don't

- Don't imitate Minecraft branding.
- Don't introduce gaming neon.
- Don't use large soft shadows.
- Don't use green as a large background.
- Don't make every section a three-card grid.
- Don't use excessive 700/800 typography.
- Don't mix arbitrary radius values.
- Don't add gradients for decoration.
- Don't move critical tool actions below SEO content.
- Don't change the design system ad hoc.

---

## 23. Agent Rule

Any future UI change must preserve this DESIGN.md unless the DESIGN.md itself is explicitly revised.

When adding or changing UI:
1. Choose existing tokens first.
2. Keep the blueprint dominant.
3. Keep emerald scarce.
4. Keep controls compact.
5. Keep workspace borders flat.
6. Verify mobile Build Mode before considering the change complete.
