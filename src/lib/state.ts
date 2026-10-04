export type BuildStyleState = 'thin' | 'thick' | 'filled';

export type BlueprintState =
  | { shape:'circle'; diameter:number; style:BuildStyleState; thickness:number }
  | { shape:'oval'; width:number; height:number; style:BuildStyleState; thickness:number }
  | { shape:'dome'; width:number; depth:number; height:number; style:BuildStyleState; thickness:number };

const STYLES = new Set<BuildStyleState>(['thin','thick','filled']);

function finiteInt(value:string | undefined): number | null {
  if (value === undefined || value.trim() === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? Math.round(n) : null;
}

function style(value:string | undefined): BuildStyleState | null {
  return value && STYLES.has(value as BuildStyleState) ? value as BuildStyleState : null;
}

export function serializeBlueprintState(state:BlueprintState): string {
  if (state.shape === 'circle') {
    return `c-${state.diameter}-${state.style}-${state.thickness}`;
  }
  if (state.shape === 'oval') {
    return `o-${state.width}-${state.height}-${state.style}-${state.thickness}`;
  }
  return `d-${state.width}-${state.depth}-${state.height}-${state.style}-${state.thickness}`;
}

export function parseBlueprintFragment(fragment:string): BlueprintState | null {
  const raw = fragment.trim().replace(/^#/, '');
  if (!raw) return null;
  const parts = raw.split('-');

  if (parts[0] === 'c' && parts.length === 4) {
    const diameter=finiteInt(parts[1]);
    const buildStyle=style(parts[2]);
    const thickness=finiteInt(parts[3]);
    if (diameter === null || buildStyle === null || thickness === null) return null;
    return {shape:'circle',diameter,style:buildStyle,thickness};
  }

  if (parts[0] === 'o' && parts.length === 5) {
    const width=finiteInt(parts[1]);
    const height=finiteInt(parts[2]);
    const buildStyle=style(parts[3]);
    const thickness=finiteInt(parts[4]);
    if (width === null || height === null || buildStyle === null || thickness === null) return null;
    return {shape:'oval',width,height,style:buildStyle,thickness};
  }

  if (parts[0] === 'd' && parts.length === 6) {
    const width=finiteInt(parts[1]);
    const depth=finiteInt(parts[2]);
    const height=finiteInt(parts[3]);
    const buildStyle=style(parts[4]);
    const thickness=finiteInt(parts[5]);
    if (width === null || depth === null || height === null || buildStyle === null || thickness === null) return null;
    return {shape:'dome',width,depth,height,style:buildStyle,thickness};
  }

  return null;
}

export function canonicalBlueprintUrl(pathname:string,state:BlueprintState): string {
  const path = pathname.startsWith('/') ? pathname : `/${pathname}`;
  return `https://voxelcurve.com${path}#${serializeBlueprintState(state)}`;
}
