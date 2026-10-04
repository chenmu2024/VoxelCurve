import type { ShapeResult, RowPlan, Span } from './geometry';

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

export function buildTextPlan(result: ShapeResult, material='Blocks') {
  const lines = [
    'VoxelCurve Build Plan',
    '',
    `Shape: ${result.type[0].toUpperCase()+result.type.slice(1)}`,
    `Dimensions: ${result.width}${result.type==='dome' ? ` × ${result.depth} × ${result.height}` : ` × ${result.height}`}`,
    `Style: ${result.style}`,
    `Thickness: ${result.thickness}`,
    `Material: ${material}`,
    `Total Blocks: ${result.blockCount}`,
    `Geometry Version: ${result.geometryVersion}`,
    ''
  ];
  if (result.type === 'dome') {
    for (const layer of result.layers) {
      lines.push(`Layer ${layer.index + 1} — ${layer.count} blocks`);
      for (const row of layer.rows.filter(r => r.count)) {
        lines.push(`  Row ${row.y + 1}: ${row.spans.map(s => `${s.start+1}-${s.end+1} (${s.end-s.start+1})`).join(' · ')}`);
      }
      lines.push('');
    }
  } else {
    for (const row of result.rows.filter(r => r.count)) {
      lines.push(`Row ${row.y + 1}: ${row.spans.map(s => `${s.start+1}-${s.end+1} (${s.end-s.start+1})`).join(' · ')}`);
    }
  }
  return lines.join('\n');
}
