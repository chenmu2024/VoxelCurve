import { describe,it,expect } from 'vitest';
import { generateCircle,generateOval,generateDome } from '../src/lib/geometry';
import { exportLitematic } from '../src/lib/litematic';
import { buildTextPlan, spanInstruction } from '../src/lib/buildPlan';
import { gunzipSync } from 'fflate';

function cells2d(r:any){const s=new Set<string>();for(const row of r.rows)for(const span of row.spans)for(let x=span.start;x<=span.end;x++)s.add(`${x},${row.y}`);return s}

function readBlockStates(raw:Uint8Array){
  const needle=new TextEncoder().encode('BlockStates');
  let offset=-1;
  outer: for(let i=0;i<=raw.length-needle.length;i++){
    for(let j=0;j<needle.length;j++) if(raw[i+j]!==needle[j]) continue outer;
    offset=i+needle.length;break;
  }
  if(offset<0) throw new Error('BlockStates not found');
  const view=new DataView(raw.buffer,raw.byteOffset,raw.byteLength);
  const len=view.getInt32(offset,false);
  const longs:bigint[]=[];
  let p=offset+4;
  for(let i=0;i<len;i++,p+=8) longs.push(view.getBigInt64(p,false));
  return longs;
}

function countPaletteIndexOne(longs:bigint[], volume:number, bitsPerEntry=2){
  let count=0;
  for(let index=0;index<volume;index++){
    const bitIndex=index*bitsPerEntry;
    const li=Math.floor(bitIndex/64);
    const shift=BigInt(bitIndex%64);
    const value=(BigInt.asUintN(64,longs[li])>>shift)&3n;
    if(value===1n) count++;
  }
  return count;
}

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
  it('thin is always one block and thick is at least two',()=>{
    const thin=generateCircle(31,'thin',5);
    const thinDefault=generateCircle(31,'thin',1);
    const thick=generateCircle(31,'thick',1);
    expect(thin.blockCount).toBe(thinDefault.blockCount);
    expect(thin.thickness).toBe(1);
    expect(thick.thickness).toBe(2);
    expect(thick.blockCount).toBeGreaterThan(thin.blockCount);
  });
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
    expect(plan).toContain('Segment 1:');
    expect(plan).toContain('Columns ');
    expect(plan).toContain('Instruction key:');
  });
  it('litematic export is gzipped NBT with expected metadata',()=>{
    const circle=generateCircle(11,'thin',1);
    const bytes=exportLitematic(circle,'VoxelCurve Test','minecraft:stone');
    expect(bytes[0]).toBe(0x1f);
    expect(bytes[1]).toBe(0x8b);
    const raw=gunzipSync(bytes);
    const text=new TextDecoder().decode(raw);
    expect(text).toContain('VoxelCurve Test');
    expect(text).toContain('TotalBlocks');
    expect(text).toContain('minecraft:stone');
    const states=readBlockStates(raw);
    expect(countPaletteIndexOne(states,circle.width*circle.height)).toBe(circle.blockCount);
  });
  it('dome litematic palette count matches geometry block count',()=>{
    const dome=generateDome(21,21,11,'thin',1);
    const raw=gunzipSync(exportLitematic(dome,'VoxelCurve Dome Test','minecraft:stone'));
    const states=readBlockStates(raw);
    expect(countPaletteIndexOne(states,dome.width*dome.depth*dome.height)).toBe(dome.blockCount);
  });
});
