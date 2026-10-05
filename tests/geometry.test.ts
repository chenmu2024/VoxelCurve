import { describe,it,expect } from 'vitest';
import { generateCircle,generateOval,generateDome } from '../src/core/geometry';
import { exportLitematic, LITEMATIC_FORMAT_VERSION, LITEMATIC_SUB_VERSION, LITEMATIC_MINECRAFT_DATA_VERSION } from '../src/lib/litematic';
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

function readNamedIntTag(raw:Uint8Array,name:string){
  const encoded=new TextEncoder().encode(name);
  for(let i=3;i<=raw.length-encoded.length-4;i++){
    if(raw[i-3]!==3)continue; // TAG_Int
    const nameLength=(raw[i-2]<<8)|raw[i-1];
    if(nameLength!==encoded.length)continue;
    let match=true;
    for(let j=0;j<encoded.length;j++) if(raw[i+j]!==encoded[j]){match=false;break}
    if(!match)continue;
    const view=new DataView(raw.buffer,raw.byteOffset,raw.byteLength);
    return {type:raw[i-3],value:view.getInt32(i+encoded.length,false)};
  }
  throw new Error(`TAG_Int ${name} not found`);
}

function findNamedTagType(raw:Uint8Array,name:string){
  const encoded=new TextEncoder().encode(name);
  for(let i=3;i<=raw.length-encoded.length;i++){
    const nameLength=(raw[i-2]<<8)|raw[i-1];
    if(nameLength!==encoded.length)continue;
    let match=true;
    for(let j=0;j<encoded.length;j++) if(raw[i+j]!==encoded[j]){match=false;break}
    if(match)return raw[i-3];
  }
  throw new Error(`Tag ${name} not found`);
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
  it('geometry version is pinned after outline and shell continuity corrections',()=>{
    expect(generateCircle(21,'thin').geometryVersion).toBe(4);
    expect(generateOval(31,21,'thin').geometryVersion).toBe(4);
    expect(generateDome(31,31,16,'thin').geometryVersion).toBe(4);
  });
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
  it('handles extreme oval ratios',()=>{
    const wide=generateOval(100,3,'thin',1);
    const tall=generateOval(3,100,'thin',1);
    expect(wide.width).toBe(100); expect(wide.height).toBe(3); expect(wide.blockCount).toBeGreaterThan(0);
    expect(tall.width).toBe(3); expect(tall.height).toBe(100); expect(tall.blockCount).toBeGreaterThan(0);
  });
  it('thickness reaching the center degrades to filled',()=>{
    expect(generateCircle(11,'thick',99).blockCount).toBe(generateCircle(11,'filled').blockCount);
    expect(generateOval(15,9,'thick',99).blockCount).toBe(generateOval(15,9,'filled').blockCount);
  });
  it('supports minimum and maximum 2D bounds',()=>{
    expect(generateCircle(3,'thin').blockCount).toBeGreaterThan(0);
    const max=generateCircle(512,'thin');
    expect(max.width).toBe(512);
    expect(max.rows).toHaveLength(512);
    expect(max.blockCount).toBeGreaterThan(0);
  });
  it('dome layer sums equal total',()=>{const r=generateDome(31,31,16,'thin',1);expect(r.layers.reduce((n,l)=>n+l.count,0)).toBe(r.blockCount);expect(r.blockCount).toBeGreaterThan(0)});
  it('supports low, tall and maximum dome bounds',()=>{
    const low=generateDome(11,11,2,'thin',1);
    const tall=generateDome(11,11,64,'thin',1);
    const max=generateDome(256,256,256,'thin',1);
    expect(low.blockCount).toBeGreaterThan(0);
    expect(tall.layers.length).toBeGreaterThan(2);
    expect(max.width).toBe(256);
    expect(max.depth).toBe(256);
    expect(max.height).toBe(256);
    expect(max.blockCount).toBeGreaterThan(0);
  });
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
    expect(readNamedIntTag(raw,'Version').value).toBe(LITEMATIC_FORMAT_VERSION);
    expect(readNamedIntTag(raw,'SubVersion').value).toBe(LITEMATIC_SUB_VERSION);
    expect(readNamedIntTag(raw,'MinecraftDataVersion').value).toBe(LITEMATIC_MINECRAFT_DATA_VERSION);
    expect(LITEMATIC_FORMAT_VERSION).toBe(6);
    expect(LITEMATIC_MINECRAFT_DATA_VERSION).toBe(3700);
    expect(findNamedTagType(raw,'TotalVolume')).toBe(3);
    expect(readNamedIntTag(raw,'TotalVolume').value).toBe(circle.width*circle.height);
    const states=readBlockStates(raw);
    expect(countPaletteIndexOne(states,circle.width*circle.height)).toBe(circle.blockCount);
  });
  it('rejects impractically large filled litematic exports before packing',()=>{
    const huge=generateDome(256,256,256,'filled',1);
    expect(huge.blockCount).toBeGreaterThan(5_000_000);
    expect(()=>exportLitematic(huge,'Huge Test','minecraft:stone')).toThrow(/5,000,000 blocks/);
  });
  it('dome litematic palette count matches geometry block count',()=>{
    const dome=generateDome(21,21,11,'thin',1);
    const raw=gunzipSync(exportLitematic(dome,'VoxelCurve Dome Test','minecraft:stone'));
    const states=readBlockStates(raw);
    expect(countPaletteIndexOne(states,dome.width*dome.depth*dome.height)).toBe(dome.blockCount);
  });
});
