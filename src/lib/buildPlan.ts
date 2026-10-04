import type { ShapeResult, RowPlan, Span } from './geometry';
import type { WorldAnchor } from './world';
import { formatWorldNumber, formatWorldSegment, worldSegment } from './world';

export function spanInstruction(span: Span, width: number) {
  const len = span.end - span.start + 1;
  const odd = width % 2 === 1;

  let center: string;
  if (odd) {
    const centerIndex = Math.floor(width / 2);
    if (span.start <= centerIndex && span.end >= centerIndex) {
      center = `Across center · place ${len}`;
    } else if (span.end < centerIndex) {
      const distance = centerIndex - span.start;
      center = `Start ${distance} block${distance === 1 ? '' : 's'} left of center · place ${len} right`;
    } else {
      const distance = span.start - centerIndex;
      center = `Start ${distance} block${distance === 1 ? '' : 's'} right of center · place ${len} right`;
    }
  } else {
    const rightOfGap = width / 2;
    const leftOfGap = rightOfGap - 1;
    if (span.start <= leftOfGap && span.end >= rightOfGap) {
      center = `Across center gap · place ${len}`;
    } else if (span.end <= leftOfGap) {
      const distance = rightOfGap - span.start;
      center = `Start ${distance} block${distance === 1 ? '' : 's'} left of center gap · place ${len} right`;
    } else {
      const distance = span.start - rightOfGap + 1;
      center = `Start ${distance} block${distance === 1 ? '' : 's'} right of center gap · place ${len} right`;
    }
  }

  return {
    edge: `Columns ${span.start + 1}–${span.end + 1} · place ${len}`,
    center,
    len
  };
}

export function rowInstruction(row: RowPlan, width: number) {
  return row.spans.map((span, i) => ({ index: i, ...spanInstruction(span, width), span }));
}

export function buildTextPlan(result: ShapeResult, material='Blocks', world:WorldAnchor|null=null) {
  const lines = [
    'VoxelCurve Build Plan',
    'https://voxelcurve.com',
    '',
    `Shape: ${result.type[0].toUpperCase()+result.type.slice(1)}`,
    `Dimensions: ${result.width}${result.type==='dome' ? ` × ${result.depth} × ${result.height}` : ` × ${result.height}`}`,
    `Style: ${result.style}`,
    `Thickness: ${result.thickness}`,
    `Material: ${material}`,
    `Total Blocks: ${result.blockCount}`,
    `Stacks: ${Math.floor(result.blockCount/64)}${result.blockCount%64 ? ` + ${result.blockCount%64} loose` : ''}`,
    `Geometry Version: ${result.geometryVersion}`,
    ...(world ? [
      `World Anchor: Center X ${formatWorldNumber(world.centerX)} · Base Y ${formatWorldNumber(world.baseY)} · Center Z ${formatWorldNumber(world.centerZ)}`,
      'World Axes: +X = blueprint right · +Z = blueprint rows downward · +Y = dome layers upward'
    ] : []),
    '',
    'Instruction key:',
    '- Center instruction = where to start relative to the shape center.',
    '- Edge instruction = exact 1-based grid columns.',
    ''
  ];

  const depth=result.type==='dome'?result.depth:result.height;

  const appendRow = (row: RowPlan, indent='', layer=0) => {
    if (!row.count) return;
    const instructions=rowInstruction(row,result.width);
    lines.push(`${indent}Row ${row.y + 1} — ${row.count} block${row.count===1?'':'s'}`);
    instructions.forEach((instruction,index)=>{
      lines.push(`${indent}  Segment ${index+1}: ${instruction.center}`);
      lines.push(`${indent}             ${instruction.edge}`);
      if(world){
        const mapped=worldSegment(world,instruction.span,row.y,result.width,depth,layer);
        lines.push(`${indent}             ${formatWorldSegment(mapped)}${mapped.aligned?'':' · WARNING: anchor is between block coordinates'}`);
      }
      const next=row.spans[index+1];
      if(next){
        const gap=next.start-instruction.span.end-1;
        if(gap>0) lines.push(`${indent}             Gap to next segment: ${gap} empty block${gap===1?'':'s'}`);
      }
    });
  };

  if (result.type === 'dome') {
    for (const layer of result.layers) {
      lines.push(`Layer ${layer.index + 1} — ${layer.count} blocks`);
      for (const row of layer.rows) appendRow(row,'  ',layer.index);
      lines.push('');
    }
  } else {
    for (const row of result.rows) appendRow(row);
  }

  return lines.join('\n');
}

