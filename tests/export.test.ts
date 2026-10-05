import { describe, expect, it } from 'vitest';
import { gunzipSync } from 'fflate';
import { generateCircle, generateOval, generateDome, type ShapeResult, type BuildStyle } from '../src/core/geometry';
import { buildTextPlan } from '../src/lib/buildPlan';
import { exportLitematic } from '../src/lib/litematic';

// Read the NBT tree independently of the writer; check every palette position,
// including air, rather than only searching for metadata names in the bytes.
function readNbt(bytes:Uint8Array):Record<string, any> {
  const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
  let offset=0;
  const string=()=>{
    const length=view.getUint16(offset);offset+=2;
    const value=new TextDecoder().decode(bytes.subarray(offset,offset+length));offset+=length;
    return value;
  };
  const int=()=>{const value=view.getInt32(offset);offset+=4;return value};
  const payload=(type:number):any=>{
    if(type===3)return int();
    if(type===4){const value=view.getBigInt64(offset);offset+=8;return value}
    if(type===8)return string();
    if(type===9){const child=bytes[offset++],length=int();return Array.from({length},()=>payload(child))}
    if(type===10){
      const compound:Record<string,any>={};
      while(true){const child=bytes[offset++];if(child===0)break;const name=string();compound[name]=payload(child)}
      return compound;
    }
    if(type===12){const length=int();return Array.from({length},()=>{const value=view.getBigUint64(offset);offset+=8;return value})}
    throw new Error(`Unsupported NBT tag ${type}`);
  };
  expect(bytes[offset++]).toBe(10);string();
  const tree=payload(10);
  expect(offset).toBe(bytes.length);
  return tree;
}

function occupied(result:ShapeResult):Set<number> {
  const positions=new Set<number>();
  const depth=result.type==='dome'?result.depth:result.height;
  const layers=result.type==='dome'?result.layers:[{index:0,rows:result.rows}];
  for(const layer of layers)for(const row of layer.rows)for(const span of row.spans){
    for(let x=span.start;x<=span.end;x++)positions.add(x+row.y*result.width+layer.index*result.width*depth);
  }
  return positions;
}

const cases:[string,ShapeResult][]=[];
for(const diameter of [11,20,31])for(const style of ['thin','thick','filled'] as BuildStyle[]){
  cases.push([`Circle ${diameter} ${style}`,generateCircle(diameter,style,3)]);
}
for(const [width,height] of [[11,21],[21,11],[20,40],[31,15],[100,20],[512,3],[3,512]]){
  cases.push([`Oval ${width}x${height}`,generateOval(width,height)]);
}
for(const [width,depth,height] of [[11,11,6],[20,20,10],[31,31,16],[31,31,10],[31,31,24],[3,3,16],[3,3,256],[3,31,16]]){
  for(const style of ['thin','thick','filled'] as BuildStyle[])cases.push([`Dome ${width}x${depth}x${height} ${style}`,generateDome(width,depth,height,style,2)]);
}

describe('geometry, TXT and Litematic agreement',()=>{
  for(const [name,result] of cases)it(name,()=>{
    const nbt=readNbt(gunzipSync(exportLitematic(result,name,'minecraft:glass')));
    const region=nbt.Regions.Main;
    const height=result.type==='dome'?result.height:1;
    const depth=result.type==='dome'?result.depth:result.height;
    expect(region.Size).toEqual({x:result.width,y:height,z:depth});
    expect(region.Position).toEqual({x:0,y:0,z:0});
    expect(region.BlockStatePalette).toEqual([{Name:'minecraft:air'},{Name:'minecraft:glass'}]);
    expect(nbt.Metadata.TotalBlocks).toBe(result.blockCount);
    const cells=occupied(result);
    expect(cells.size).toBe(result.blockCount);
    let mismatch=0,count=0;
    for(let index=0;index<result.width*height*depth;index++){
      const actual=Number((region.BlockStates[Math.floor(index/32)]>>BigInt((index%32)*2))&3n);
      if(actual!==Number(cells.has(index)))mismatch++;
      if(actual===1)count++;
    }
    expect(mismatch).toBe(0);
    expect(count).toBe(result.blockCount);
    const plan=buildTextPlan(result,'Glass');
    const rows=[...plan.matchAll(/Row \d+ — (\d+) block/g)].reduce((total,match)=>total+Number(match[1]),0);
    expect(rows).toBe(result.blockCount);
    expect(plan).toContain(`Total Blocks: ${count}`);
  });
});
