import type { Span } from './geometry';

export interface WorldAnchor {
  centerX:number;
  baseY:number;
  centerZ:number;
}

export interface WorldSegment {
  xStart:number;
  xEnd:number;
  y:number;
  z:number;
  aligned:boolean;
}

const EPS=1e-9;

export function gridCoordinate(center:number,index:number,size:number):number {
  return center + index - (size - 1) / 2;
}

export function axisIsBlockAligned(center:number,size:number):boolean {
  const first=gridCoordinate(center,0,size);
  return Math.abs(first-Math.round(first))<EPS;
}

export function anchorIsBlockAligned(anchor:WorldAnchor,width:number,depth:number):boolean {
  return axisIsBlockAligned(anchor.centerX,width)
    && axisIsBlockAligned(anchor.centerZ,depth)
    && Math.abs(anchor.baseY-Math.round(anchor.baseY))<EPS;
}

export function worldSegment(
  anchor:WorldAnchor,
  span:Span,
  row:number,
  width:number,
  depth:number,
  layer=0
):WorldSegment {
  return {
    xStart:gridCoordinate(anchor.centerX,span.start,width),
    xEnd:gridCoordinate(anchor.centerX,span.end,width),
    y:anchor.baseY+layer,
    z:gridCoordinate(anchor.centerZ,row,depth),
    aligned:anchorIsBlockAligned(anchor,width,depth)
  };
}

export function formatWorldNumber(value:number):string {
  if(Math.abs(value-Math.round(value))<EPS) return String(Math.round(value));
  return String(Math.round(value*2)/2);
}

export function formatWorldSegment(segment:WorldSegment):string {
  const start=formatWorldNumber(segment.xStart);
  const end=formatWorldNumber(segment.xEnd);
  const x=start===end?start:`${start}–${end}`;
  return `World · X ${x} · Y ${formatWorldNumber(segment.y)} · Z ${formatWorldNumber(segment.z)}`;
}
