import { describe, expect, it } from 'vitest';
import { generateCircle } from '../src/lib/geometry';
import { buildBlueprintSvg } from '../src/lib/svg';

describe('SVG blueprint export',()=>{
  it('renders geometry spans and metadata',()=>{
    const result=generateCircle(11,'thin',1);
    const svg=buildBlueprintSvg({
      rows:result.rows,
      width:result.width,
      height:result.height,
      title:'11x11 Circle'
    });
    expect(svg).toContain('<svg');
    expect(svg).toContain('<title>11x11 Circle</title>');
    expect(svg).toContain('fill="#34d399"');
    expect(svg).toContain('stroke-dasharray="6 6"');
  });

  it('escapes titles safely',()=>{
    const result=generateCircle(5,'thin',1);
    const svg=buildBlueprintSvg({
      rows:result.rows,
      width:result.width,
      height:result.height,
      title:'A & <B> "C"'
    });
    expect(svg).toContain('A &amp; &lt;B&gt; &quot;C&quot;');
    expect(svg).not.toContain('<title>A & <B>');
  });

  it('keeps large filled circles compact by exporting spans, not cells',()=>{
    const result=generateCircle(512,'filled',1);
    const svg=buildBlueprintSvg({
      rows:result.rows,
      width:result.width,
      height:result.height,
      title:'512 Filled Circle',
      showGrid:false,
      showLabels:false
    });
    const rectCount=(svg.match(/<rect /g)||[]).length;
    expect(rectCount).toBeLessThan(600);
    expect(svg.length).toBeLessThan(100_000);
  });
});
