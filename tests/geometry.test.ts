import { describe,it,expect } from 'vitest';
import { generateCircle,generateOval,generateDome } from '../src/lib/geometry';
import { exportLitematic } from '../src/lib/litematic';
import { buildTextPlan, spanInstruction } from '../src/lib/buildPlan';
import { gunzipSync } from 'fflate';

function cells2d(r:any){const s=new Set<string>();for(const row of r.rows)for(const span of row.spans)for(let x=span.start;x<=span.end;x++)s.add(`${x},${row.y}`);return s}

describe('geometry',()=>{
  it('locks common community-compatible circle counts',()=>{
    expect(generateCircle(11,'thin',1).blockCount).toBe(28);
    expect(generateCircle(21,'thin',1).blockCount).toBe(56);
    expect(generateCircle(31,'thin',1).blockCount).toBe(84);
  });
  it('locks 21x21 top row fixture',()=>{
    const r=generateCircle(21,'thin',1);
    expect(r.rows[0].spans).toEqual([{start:7,end:13}]);
    expect(r.rows[20].spans).toEqual([{start:7,end:13}]);
  });
  for(const n of [3,4,5,7,9,11,15,20,21,31,41,51,64,100]) it(`circle ${n} is symmetric and bounded`,()=>{const r=generateCircle(n,'thin',1);const s=cells2d(r);expect(r.blockCount).toBe(s.size);for(const k of s){const [x,y]=k.split(',').map(Number);expect(s.has(`${n-1-x},${y}`)).toBe(true);expect(s.has(`${x},${n-1-y}`)).toBe(true);expect(x).toBeGreaterThanOrEqual(0);expect(x).toBeLessThan(n)}});
  it('filled circle has more blocks than thin',()=>{expect(generateCircle(31,'filled').blockCount).toBeGreaterThan(generateCircle(31,'thin').blockCount)});
  it('oval stays in bounds',()=>{const r=generateOval(31,15,'thin',1);expect(r.rows).toHaveLength(15);expect(r.blockCount).toBeGreaterThan(0)});
  it('dome layer sums equal total',()=>{const r=generateDome(31,31,16,'thin',1);expect(r.layers.reduce((n,l)=>n+l.count,0)).toBe(r.blockCount);expect(r.blockCount).toBeGreaterThan(0)});
  it('filled dome has more blocks than hollow',()=>{expect(generateDome(21,21,11,'filled').blockCount).toBeGreaterThan(generateDome(21,21,11,'thin').blockCount)});
  it('locks common 31x31x16 hollow dome count',()=>{
    expect(generateDome(31,31,16,'thin',1).blockCount).toBe(1353);
  });
  it('hollow dome keeps a solid top cap and no empty layers',()=>{
    const hollow=generateDome(31,31,16,'thin',1);
    expect(hollow.layers.every(layer=>layer.count>0)).toBe(true);
    const top=hollow.layers[hollow.layers.length-1];
    expect(top.index).toBe(15);
    expect(top.count).toBeGreaterThan(0);
    for (const layer of hollow.layers) {
      for (const row of layer.rows) {
        for (const span of row.spans) {
          const mirrorStart=hollow.width-1-span.end;
          const mirrorEnd=hollow.width-1-span.start;
          expect(row.spans.some(s=>s.start===mirrorStart&&s.end===mirrorEnd)).toBe(true);
        }
      }
    }
  });
  it('center instructions use the segment start, not segment midpoint',()=>{
    expect(spanInstruction({start:9,end:11},31).center).toBe('Start 6 blocks left of center · place 3 right');
    expect(spanInstruction({start:19,end:21},31).center).toBe('Start 4 blocks right of center · place 3 right');
    expect(spanInstruction({start:8,end:11},20).center).toContain('center gap');
  });
  it('text plan uses the same total block count as geometry',()=>{
    const r=generateDome(21,21,11,'thin',1);
    const plan=buildTextPlan(r,'Stone Bricks');
    expect(plan).toContain(`Total Blocks: ${r.blockCount}`);
    expect(plan).toContain('Layer 1');
  });
  it('litematic export is gzipped NBT with expected metadata',()=>{
    const bytes=exportLitematic(generateCircle(11,'thin',1),'VoxelCurve Test','minecraft:stone');
    expect(bytes[0]).toBe(0x1f);
    expect(bytes[1]).toBe(0x8b);
    const raw=gunzipSync(bytes);
    const text=new TextDecoder().decode(raw);
    expect(text).toContain('VoxelCurve Test');
    expect(text).toContain('TotalBlocks');
    expect(text).toContain('minecraft:stone');
  });
});
