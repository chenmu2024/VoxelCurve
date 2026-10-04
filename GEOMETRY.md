# VoxelCurve Geometry Specification

Version: **Geometry v1**

This document is normative. The generator, chart, material counts, guided build instructions, TXT output, PNG output and Litematic export must all consume the same geometry result and must not implement independent shape formulas.

## 1. Coordinate model

VoxelCurve uses integer grid indices internally.

For a width `W`:

- block index: `x = 0 ... W - 1`
- block center in continuous space: `x + 0.5`
- geometric center: `W / 2`
- therefore the normalized offset is equivalent to:
  `dx = x - (W - 1) / 2`

The same convention is used for 2D Y rows and Dome Z rows.

### Odd dimensions

For an odd width such as 21:

- center index = 10
- the geometric center passes through one block center.

### Even dimensions

For an even width such as 20:

- the geometric center lies between indices 9 and 10
- the shape is symmetric around the center gap.

## 2. Result representation

All generators return one compact `ShapeResult`:

```
ShapeResult
├── type
├── dimensions
├── style
├── thickness
├── rows
│   └── spans
├── layers
│   └── rows
│       └── spans
├── blockCount
└── geometryVersion
```

A span is inclusive:

```
{ start: 7, end: 13 }
```

represents seven blocks.

Block count must always equal the sum of all span lengths.

## 3. Circle

For diameter `N`:

```
cx = (N - 1) / 2
cy = (N - 1) / 2
R  = N / 2
```

A block belongs to the outer filled disk when:

```
((x - cx) / R)^2 + ((y - cy) / R)^2 <= 1
```

with a small floating-point tolerance.

This is equivalent to testing block centers against a mathematical disk centered at `N / 2` in continuous cell coordinates.

### Circle fixtures

These counts are locked by tests:

| Diameter | Thin outline blocks |
|---:|---:|
| 11 | 28 |
| 21 | 56 |
| 31 | 84 |

For 21×21, the first and last rows contain one span:

```
x = 7..13
```

These fixtures must not change accidentally.

## 4. Oval

For width `W` and height `H`:

```
cx = (W - 1) / 2
cy = (H - 1) / 2
Rx = W / 2
Ry = H / 2
```

A block belongs to the outer filled ellipse when:

```
((x - cx) / Rx)^2 + ((y - cy) / Ry)^2 <= 1
```

The result must remain horizontally and vertically symmetric.

## 5. Build styles

VoxelCurve has exactly three geometry styles.

### Thin

```
thickness = 1
```

Thin always means a one-block shell. Passing a larger thickness value must not change Thin geometry.

### Thick

```
thickness >= 2
```

If the requested value is below 2, the engine normalizes it to 2.

Thickness grows inward. The outside bounding box never grows.

### Filled

Filled contains the entire outer disk / ellipse / dome volume.

Thickness is not meaningful for Filled and is normalized to 1 in metadata.

## 6. 2D shell construction

Thin and Thick use:

```
Outer Shape - Inner Shape
```

For a 2D ellipse/circle with thickness `T`:

```
Inner Rx = Outer Rx - T
Inner Ry = Outer Ry - T
```

If thickness reaches the center, the result naturally degrades toward a filled shape.

The engine then converts occupied cells to deterministic row spans.

## 7. Dome

A Dome is the upper half of an ellipsoid, sampled one horizontal layer at a time.

Inputs:

```
Width
Depth
Height
```

Internal axes:

- X = width
- Y = vertical layer
- Z = depth / row

For outer dimensions:

```
cx = (Width - 1) / 2
cz = (Depth - 1) / 2
Rx = Width / 2
Rz = Depth / 2
Ry = Height - 0.5
```

For a layer `y` and row `z`, solve the ellipsoid equation for the valid X interval:

```
((x - cx) / Rx)^2
+ ((z - cz) / Rz)^2
+ (y / Ry)^2
<= 1
```

The engine calculates the X extent directly and stores it as row spans. It does not allocate a full 3D voxel object graph.

### Hemisphere shortcut

For common circular domes:

```
Width = Depth
Height = ceil(Width / 2)
```

This is the UI's hemisphere-style shortcut.

## 8. Hollow Dome

A hollow Dome is a true 3D shell:

```
Outer Ellipsoid - Inner Ellipsoid
```

For shell thickness `T`:

```
Inner Rx = Outer Rx - T
Inner Rz = Outer Rz - T
Inner Ry = Outer Ry - T
```

The inner ellipsoid uses the **same base plane** as the outer ellipsoid.

It must not be shifted upward.

This creates a naturally solid cap near the pole instead of incorrectly carving a hole through the top.

Empty layers are not stored.

## 9. Symmetry

2D Circle and Oval results must be symmetric across both axes.

Dome rows must be symmetric across X for every layer/row.

Regression tests enforce symmetry.

## 10. Guided Build coordinates

Internal coordinates are zero-based.

Human-facing Edge Mode is one-based:

```
internal x = 12..18
display    = Columns 13–19
```

Center Mode describes the **start of the segment**, not the segment midpoint.

Example for a 31-wide shape:

```
Start 6 blocks left of center · place 3 right
```

Even-width shapes use the phrase `center gap` to avoid implying that one center block exists.

## 11. Litematic coordinate mapping

VoxelCurve exports one region named `Main`.

Current file compatibility target:

```
Litematic Version: 6
SubVersion: 1
MinecraftDataVersion: 3700 (Java 1.20.4)
```

This intentionally follows Litematica's V6 compatibility writer path. Do not pair V6 with a post-1.20.4 DataVersion without revisiting the format version.

### Circle / Oval

```
X = grid column
Y = 0
Z = grid row
```

### Dome

```
X = grid column
Y = dome layer
Z = row within the layer
```

Origin:

```
0, 0, 0
```

The web block count, TXT plan block count and occupied Litematic palette count must match.

## 12. World-coordinate helper

World coordinates are a **display and instruction transform only**. They do not change occupied blocks in the `ShapeResult`.

Optional anchor inputs:

```
Center X
Base Y
Center Z
```

Mapping:

```
worldX = centerX + gridX - (Width - 1) / 2
worldZ = centerZ + gridRow - (Depth - 1) / 2
worldY = baseY + layer
```

For 2D Circle/Oval plans, `Depth` means the 2D blueprint row count (`height`).

Axes:

- blueprint right = +X
- blueprint rows downward = +Z
- Dome layers upward = +Y

Block-aligned center rule:

- odd dimensions use whole-number center coordinates;
- even dimensions use centers ending in `.5`;
- Base Y is a whole block Y coordinate.

World coordinates are not included in share URL fragments or local completion progress. They do not change the Litematic region origin.

## 13. Safe limits

Current UI limits:

| Shape | Limit |
|---|---:|
| Circle | 3–512 diameter |
| Oval | 3–512 width/height |
| Dome | 3–256 width/depth, 2–256 height |

Litematic export rejects structures above 20,000,000 bounding-volume cells or above 5,000,000 occupied blocks.

These limits are engineering limits, not SEO content claims, and may only be raised after performance testing.

## 14. Geometry version

Current:

```
GEOMETRY_VERSION = 2
```

Saved progress includes the geometry version.

Any change that can alter generated occupied blocks for the same parameters must increment the version so old progress cannot be applied to a new blueprint.

## 15. Non-negotiable invariants

For every shape:

1. all occupied cells stay inside declared bounds;
2. spans never overlap within one row;
3. no duplicate blocks exist;
4. row span sums equal row counts;
5. row sums equal layer counts;
6. layer sums equal total block count;
7. PNG, TXT, materials and Litematic derive from the same `ShapeResult`;
8. UI labels must reflect normalized geometry inputs;
9. geometry output is deterministic.

If a future implementation violates one of these invariants, it is not compatible with VoxelCurve Geometry v1.
