import type { ShapeResult, RowPlan, Span } from './geometry';

export function spanInstruction(span: Span, width: number) {
  const cx = (width - 1) / 2;
  const len = span.end - span.start + 1;
  const center = (span.start + span.end) / 2;
  const offset = center - cx;
  const side = Math.abs(offset) < 0.001 ? 'center' : offset < 0 ? 'left' : 'right';
  const distance = Math.round(Math.abs(offset));
  return {
    edge: `Columns ${span.start + 1}–${span.end + 1}`,
    center: side === 'center' ? `Center · place ${len}` : `${distance} ${side} of center · place ${len}`,
    len,
    side,
    distance
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
