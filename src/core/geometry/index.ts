export type ShapeType = 'circle' | 'oval' | 'dome';
export type BuildStyle = 'thin' | 'thick' | 'filled';

export interface Span { start: number; end: number; }
export interface RowPlan { y: number; spans: Span[]; count: number; }
export interface LayerPlan { index: number; rows: RowPlan[]; count: number; }
export interface ShapeResult {
  type: ShapeType;
  dimensions:{width:number;height:number;depth:number};
  bounds:{minX:number;maxX:number;minY:number;maxY:number;minZ:number;maxZ:number};
  width: number;
  height: number;
  depth: number;
  style: BuildStyle;
  thickness: number;
  rows: RowPlan[];
  layers: LayerPlan[];
  blockCount: number;
  geometryVersion: number;
}

export const GEOMETRY_VERSION = 4;

const clampInt = (n: number, min: number, max: number) => Math.max(min, Math.min(max, Math.round(Number.isFinite(n) ? n : min)));

function disk(width: number, height: number, rxAdjust = 0, ryAdjust = 0): boolean[][] {
  const w = clampInt(width, 1, 512);
  const h = clampInt(height, 1, 512);
  const cx = (w - 1) / 2;
  const cy = (h - 1) / 2;
  const rx = Math.max(0.0001, w / 2 - rxAdjust);
  const ry = Math.max(0.0001, h / 2 - ryAdjust);
  const out = Array.from({ length: h }, () => Array<boolean>(w).fill(false));
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const dx = (x - cx) / rx;
      const dy = (y - cy) / ry;
      out[y][x] = dx * dx + dy * dy <= 1 + 1e-9;
    }
  }
  return out;
}

function subtract(a: boolean[][], b: boolean[][]): boolean[][] {
  return a.map((row, y) => row.map((v, x) => v && !b[y]?.[x]));
}

function enforceSymmetry(grid: boolean[][]): boolean[][] {
  const h = grid.length;
  const w = grid[0]?.length ?? 0;
  const out = grid.map(r => [...r]);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (!grid[y][x]) continue;
      out[y][w - 1 - x] = true;
      out[h - 1 - y][x] = true;
      out[h - 1 - y][w - 1 - x] = true;
    }
  }
  return out;
}

function gridToRows(grid: boolean[][]): RowPlan[] {
  return grid.map((row, y) => {
    const spans: Span[] = [];
    let start = -1;
    for (let x = 0; x <= row.length; x++) {
      const on = x < row.length ? row[x] : false;
      if (on && start === -1) start = x;
      if (!on && start !== -1) {
        spans.push({ start, end: x - 1 });
        start = -1;
      }
    }
    const count = spans.reduce((n, s) => n + s.end - s.start + 1, 0);
    return { y, spans, count };
  });
}

export function generate2D(type: 'circle'|'oval', width: number, height: number, style: BuildStyle='thin', thickness=1): ShapeResult {
  const w = clampInt(width, 3, 512);
  const h = clampInt(height, 3, 512);
  const maxT = Math.max(1, Math.floor(Math.min(w, h) / 2));
  const requestedT = clampInt(thickness, 1, maxT);
  const t = style === 'thin' || style === 'filled' ? 1 : Math.min(maxT, Math.max(2, requestedT));
  const outer = disk(w, h, 0, 0);
  let grid: boolean[][];
  if (style === 'filled' || (style === 'thick' && t >= maxT)) {
    grid = outer;
  } else {
    const inner = disk(w, h, t, t);
    // Keep the digital outer boundary even where an eccentric inner ellipse
    // reaches it. A center-sampled annulus alone can leave disconnected runs.
    for(let y=0;y<h;y++)for(let x=0;x<w;x++){
      if(inner[y][x]&&(!outer[y][x-1]||!outer[y][x+1]||!outer[y-1]?.[x]||!outer[y+1]?.[x]))inner[y][x]=false;
    }
    grid = enforceSymmetry(subtract(outer, inner));
  }
  const rows = gridToRows(grid);
  const blockCount = rows.reduce((n, r) => n + r.count, 0);
  return { type, dimensions:{width:w,height:h,depth:1}, bounds:{minX:0,maxX:w-1,minY:0,maxY:0,minZ:0,maxZ:h-1}, width: w, height: h, depth: 1, style, thickness: t, rows, layers: [], blockCount, geometryVersion: GEOMETRY_VERSION };
}

export function generateCircle(diameter: number, style: BuildStyle='thin', thickness=1) {
  return generate2D('circle', diameter, diameter, style, thickness);
}

export function generateOval(width: number, height: number, style: BuildStyle='thin', thickness=1) {
  return generate2D('oval', width, height, style, thickness);
}

function rowSpanForEllipsoid(
  width: number,
  depth: number,
  height: number,
  y: number,
  z: number,
  inset: number
): Span | null {
  const cx = (width - 1) / 2;
  const cz = (depth - 1) / 2;
  const rx = width / 2 - inset;
  const rz = depth / 2 - inset;
  const ry = Math.max(0.0001, height - 0.5 - inset);

  if (rx <= 0 || rz <= 0 || ry <= 0) return null;

  const nz = (z - cz) / rz;
  const ny = y / ry;
  const remaining = 1 - nz * nz - ny * ny;
  if (remaining < -1e-9) return null;

  const extent = rx * Math.sqrt(Math.max(0, remaining));
  const minX = Math.max(0, Math.ceil(cx - extent - 1e-9));
  const maxX = Math.min(width - 1, Math.floor(cx + extent + 1e-9));
  if (minX > maxX) return null;
  return { start: minX, end: maxX };
}

function subtractSpan(outer: Span | null, inner: Span | null): Span[] {
  if (!outer) return [];
  if (!inner) return [outer];

  const spans: Span[] = [];
  if (inner.start > outer.start) spans.push({ start: outer.start, end: Math.min(outer.end, inner.start - 1) });
  if (inner.end < outer.end) spans.push({ start: Math.max(outer.start, inner.end + 1), end: outer.end });
  return spans.filter(span => span.start <= span.end);
}

export function generateDome(width: number, depth: number, height: number, style: BuildStyle='thin', thickness=1): ShapeResult {
  const w = clampInt(width, 3, 256);
  const d = clampInt(depth, 3, 256);
  const h = clampInt(height, 2, 256);
  const maxT = Math.max(1, Math.floor(Math.min(w, d, h) / 2));
  const requestedT = clampInt(thickness, 1, maxT);
  const t = style === 'thin' || style === 'filled' ? 1 : Math.min(maxT, Math.max(2, requestedT));
  const layers: LayerPlan[] = [];
  let total = 0;

  for (let y = 0; y < h; y++) {
    const rows: RowPlan[] = [];
    let layerCount = 0;

    for (let z = 0; z < d; z++) {
      const outer = rowSpanForEllipsoid(w, d, h, y, z, 0);
      let inner = style === 'filled' ? null : rowSpanForEllipsoid(w, d, h, y, z, t);
      if(inner&&outer){
        // Intersect the inner ellipsoid with the outer solid's digital interior.
        // Preserve its side/top surface; the base intentionally remains open.
        const limits=[
          {start:outer.start+1,end:outer.end-1},
          rowSpanForEllipsoid(w,d,h,y,z-1,0),
          rowSpanForEllipsoid(w,d,h,y,z+1,0),
          rowSpanForEllipsoid(w,d,h,y+1,z,0)
        ];
        if(y>0)limits.push(rowSpanForEllipsoid(w,d,h,y-1,z,0));
        for(const limit of limits){
          if(!limit){inner=null;break;}
          inner={start:Math.max(inner.start,limit.start),end:Math.min(inner.end,limit.end)};
          if(inner.start>inner.end){inner=null;break;}
        }
      }
      const spans = style === 'filled' ? (outer ? [outer] : []) : subtractSpan(outer, inner);
      const count = spans.reduce((sum, span) => sum + span.end - span.start + 1, 0);
      rows.push({ y: z, spans, count });
      layerCount += count;
    }

    if (layerCount === 0) continue;
    layers.push({ index: y, rows, count: layerCount });
    total += layerCount;
  }

  return {
    type: 'dome',
    dimensions:{width:w,height:h,depth:d},
    bounds:{minX:0,maxX:w-1,minY:0,maxY:h-1,minZ:0,maxZ:d-1},
    width: w,
    height: h,
    depth: d,
    style,
    thickness: t,
    rows: [],
    layers,
    blockCount: total,
    geometryVersion: GEOMETRY_VERSION
  };
}
