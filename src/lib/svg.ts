import type { RowPlan } from './geometry';

export interface SvgBlueprintOptions {
  rows:RowPlan[];
  width:number;
  height:number;
  title:string;
  showGrid?:boolean;
  showCenter?:boolean;
  showLabels?:boolean;
}

function esc(value:string):string {
  return value.replace(/[&<>"']/g,char=>({
    '&':'&amp;',
    '<':'&lt;',
    '>':'&gt;',
    '"':'&quot;',
    "'":'&apos;'
  }[char] || char));
}

export function buildBlueprintSvg(options:SvgBlueprintOptions):string {
  const {
    rows,
    width,
    height,
    title,
    showGrid=true,
    showCenter=true,
    showLabels=true
  }=options;

  const cell=16;
  const padding=showLabels?38:20;
  const canvasWidth=width*cell+padding*2;
  const canvasHeight=height*cell+padding*2;
  const parts:string[]=[];

  parts.push(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${canvasWidth} ${canvasHeight}" width="${canvasWidth}" height="${canvasHeight}" role="img" aria-label="${esc(title)}">`,
    `<title>${esc(title)}</title>`,
    `<rect width="${canvasWidth}" height="${canvasHeight}" fill="#ffffff"/>`
  );

  for(const row of rows){
    for(const span of row.spans){
      const x=padding+span.start*cell;
      const y=padding+row.y*cell;
      const w=(span.end-span.start+1)*cell;
      parts.push(`<rect x="${x}" y="${y}" width="${w}" height="${cell}" fill="#34d399"/>`);
    }
  }

  if(showGrid && width<=256 && height<=256){
    parts.push(`<g stroke="#e9ecea" stroke-width="1" fill="none" shape-rendering="crispEdges">`);
    for(let x=0;x<=width;x++){
      const px=padding+x*cell;
      parts.push(`<path d="M${px} ${padding}V${padding+height*cell}"/>`);
    }
    for(let y=0;y<=height;y++){
      const py=padding+y*cell;
      parts.push(`<path d="M${padding} ${py}H${padding+width*cell}"/>`);
    }
    parts.push('</g>');
  }

  if(showCenter){
    const cx=padding+width*cell/2;
    const cy=padding+height*cell/2;
    parts.push(
      `<g stroke="#f59e0b" stroke-width="1.5" stroke-dasharray="6 6" fill="none">`,
      `<path d="M${cx} ${padding}V${padding+height*cell}"/>`,
      `<path d="M${padding} ${cy}H${padding+width*cell}"/>`,
      '</g>'
    );
  }

  if(showLabels && height<=256){
    parts.push(`<g fill="#737a75" font-family="ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="9" text-anchor="end">`);
    for(const row of rows){
      if(!row.count) continue;
      const y=padding+(row.y+.66)*cell;
      parts.push(`<text x="${padding-6}" y="${y}">${row.y+1}</text>`);
    }
    parts.push('</g>');
  }

  parts.push('</svg>');
  return parts.join('');
}
