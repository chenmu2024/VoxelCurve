export type ShapeType = 'circle' | 'oval' | 'dome';
export type BuildStyle = 'thin' | 'thick' | 'filled';

export interface Span { start: number; end: number; }
export interface RowPlan { y: number; spans: Span[]; count: number; }
export interface LayerPlan { index: number; rows: RowPlan[]; count: number; }
export interface ShapeResult {
  type: ShapeType;
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

export const GEOMETRY_VERSION = 1;

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
  const t = clampInt(thickness, 1, maxT);
  const outer = disk(w, h, 0, 0);
  let grid: boolean[][];
  if (style === 'filled' || t >= maxT) {
    grid = outer;
  } else {
    const inner = disk(w, h, t, t);
    grid = enforceSymmetry(subtract(outer, inner));
  }
  const rows = gridToRows(grid);
  const blockCount = rows.reduce((n, r) => n + r.count, 0);
  return { type, width: w, height: h, depth: 1, style, thickness: t, rows, layers: [], blockCount, geometryVersion: GEOMETRY_VERSION };
}

export function generateCircle(diameter: number, style: BuildStyle='thin', thickness=1) {
  return generate2D('circle', diameter, diameter, style, thickness);
}

export function generateOval(width: number, height: number, style: BuildStyle='thin', thickness=1) {
  return generate2D('oval', width, height, style, thickness);
}

function layerMask(width: number, depth: number, height: number, layer: number, shell: BuildStyle, thickness: number): boolean[][] {
  const w = clampInt(width, 3, 256);
  const d = clampInt(depth, 3, 256);
  const h = clampInt(height, 2, 256);
  const y = clampInt(layer, 0, h - 1);
  const cx = (w - 1) / 2;
  const cz = (d - 1) / 2;
  const rx = w / 2;
  const rz = d / 2;
  const ry = Math.max(1, h - 0.5);
  const yPos = y;
  const outer = Array.from({ length: d }, () => Array<boolean>(w).fill(false));
  const inner = Array.from({ length: d }, () => Array<boolean>(w).fill(false));
  const innerRx = Math.max(0.0001, rx - thickness);
  const innerRz = Math.max(0.0001, rz - thickness);
  const innerRy = Math.max(0.0001, ry - thickness);
  for (let z = 0; z < d; z++) {
    for (let x = 0; x < w; x++) {
      const ox = (x - cx) / rx;
      const oz = (z - cz) / rz;
      const oy = yPos / ry;
      const o = ox * ox + oz * oz + oy * oy <= 1 + 1e-9;
      outer[z][x] = o;
      if (shell !== 'filled') {
        const ix = (x - cx) / innerRx;
        const iz = (z - cz) / innerRz;
        // Keep the inner ellipsoid on the same base plane as the outer dome.
        // Reducing Ry naturally creates a solid cap near the top instead of
        // shifting the cavity upward and hollowing out the pole.
        const iy = yPos / innerRy;
        inner[z][x] = ix * ix + iz * iz + iy * iy <= 1 + 1e-9;
      }
    }
  }
  return shell === 'filled' ? outer : subtract(outer, inner);
}

export function generateDome(width: number, depth: number, height: number, style: BuildStyle='thin', thickness=1): ShapeResult {
  const w = clampInt(width, 3, 256);
  const d = clampInt(depth, 3, 256);
  const h = clampInt(height, 2, 256);
  const t = clampInt(thickness, 1, Math.max(1, Math.floor(Math.min(w, d, h) / 2)));
  const layers: LayerPlan[] = [];
  let total = 0;
  for (let y = 0; y < h; y++) {
    const grid = enforceSymmetry(layerMask(w, d, h, y, style, t));
    const rows = gridToRows(grid);
    const count = rows.reduce((n, r) => n + r.count, 0);
    if (count === 0) continue;
    layers.push({ index: y, rows, count });
    total += count;
  }
  return { type: 'dome', width: w, height: h, depth: d, style, thickness: t, rows: [], layers, blockCount: total, geometryVersion: GEOMETRY_VERSION };
}

export function resultToCells(result: ShapeResult): Array<{x:number;y:number;z:number}> {
  const cells: Array<{x:number;y:number;z:number}> = [];
  if (result.type === 'dome') {
    for (const layer of result.layers) {
      for (const row of layer.rows) {
        for (const s of row.spans) for (let x=s.start; x<=s.end; x++) cells.push({x, y: layer.index, z: row.y});
      }
    }
  } else {
    for (const row of result.rows) {
      for (const s of row.spans) for (let x=s.start; x<=s.end; x++) cells.push({x, y:0, z:row.y});
    }
  }
  return cells;
}
