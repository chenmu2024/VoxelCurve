import { gzipSync } from 'fflate';
import type { ShapeResult } from './geometry';

class NbtWriter {
  chunks: Uint8Array[] = [];
  push(bytes: Uint8Array) { this.chunks.push(bytes); }
  u8(v:number){ this.push(Uint8Array.of(v & 255)); }
  i32(v:number){ const b=new Uint8Array(4); new DataView(b.buffer).setInt32(0,v,false); this.push(b); }
  i64(v:bigint){ const b=new Uint8Array(8); new DataView(b.buffer).setBigInt64(0,BigInt.asIntN(64,v),false); this.push(b); }
  str(v:string){ const e=new TextEncoder().encode(v); const b=new Uint8Array(2); new DataView(b.buffer).setUint16(0,e.length,false); this.push(b); this.push(e); }
  tag(type:number,name:string,payload:()=>void){ this.u8(type); this.str(name); payload(); }
  tagInt(name:string,v:number){ this.tag(3,name,()=>this.i32(v)); }
  tagLong(name:string,v:bigint){ this.tag(4,name,()=>this.i64(v)); }
  tagString(name:string,v:string){ this.tag(8,name,()=>this.str(v)); }
  tagCompound(name:string,fn:()=>void){ this.tag(10,name,()=>{ fn(); this.u8(0); }); }
  tagList(name:string,childType:number,length:number,write:()=>void){ this.tag(9,name,()=>{ this.u8(childType); this.i32(length); write(); }); }
  tagLongArray(name:string,values:bigint[]){ this.tag(12,name,()=>{ this.i32(values.length); for(const v of values)this.i64(v); }); }
  bytes(){ const n=this.chunks.reduce((s,c)=>s+c.length,0); const out=new Uint8Array(n); let o=0; for(const c of this.chunks){out.set(c,o);o+=c.length;} return out; }
}

function packResultPalette(result: ShapeResult, bitsPerEntry=2): bigint[] {
  const sx=result.width;
  const sy=result.type==='dome'?result.height:1;
  const sz=result.type==='dome'?result.depth:result.height;
  const volume=sx*sy*sz;

  if(volume>20_000_000) {
    throw new Error('Structure is too large for browser export. Reduce its dimensions.');
  }

  const totalBits=volume*bitsPerEntry;
  const longs=Array<bigint>(Math.ceil(totalBits/64)).fill(0n);
  const value=1n; // palette index 1 = selected block; 0 remains air

  const setIndex=(index:number)=>{
    const bitIndex=index*bitsPerEntry;
    const li=Math.floor(bitIndex/64);
    const offset=bitIndex%64;
    longs[li] |= value << BigInt(offset);
    if(offset+bitsPerEntry>64) {
      longs[li+1] |= value >> BigInt(64-offset);
    }
  };

  if(result.type==='dome'){
    for(const layer of result.layers){
      for(const row of layer.rows){
        for(const span of row.spans){
          const base=row.y*sx + layer.index*sx*sz;
          for(let x=span.start;x<=span.end;x++) setIndex(base+x);
        }
      }
    }
  } else {
    for(const row of result.rows){
      for(const span of row.spans){
        const base=row.y*sx;
        for(let x=span.start;x<=span.end;x++) setIndex(base+x);
      }
    }
  }

  return longs.map(v=>BigInt.asIntN(64,v));
}

export function exportLitematic(result: ShapeResult, name='VoxelCurve Build', blockName='minecraft:stone'): Uint8Array {
  const sx=result.width, sy=result.type==='dome'?result.height:1, sz=result.type==='dome'?result.depth:result.height;
  const packed=packResultPalette(result,2);
  const now=BigInt(Date.now());
  const w=new NbtWriter();
  w.u8(10); w.str('');
  w.tagInt('Version',6);
  w.tagInt('SubVersion',1);
  w.tagInt('MinecraftDataVersion',3953);
  w.tagCompound('Metadata',()=>{
    w.tagString('Name',name);
    w.tagString('Author','VoxelCurve');
    w.tagString('Description','Generated at voxelcurve.com');
    w.tagInt('RegionCount',1);
    w.tagLong('TimeCreated',now);
    w.tagLong('TimeModified',now);
    w.tagInt('TotalBlocks',result.blockCount);
    w.tagLong('TotalVolume',BigInt(sx*sy*sz));
    w.tagCompound('EnclosingSize',()=>{w.tagInt('x',sx);w.tagInt('y',sy);w.tagInt('z',sz);});
  });
  w.tagCompound('Regions',()=>{
    w.tagCompound('Main',()=>{
      w.tagCompound('Position',()=>{w.tagInt('x',0);w.tagInt('y',0);w.tagInt('z',0);});
      w.tagCompound('Size',()=>{w.tagInt('x',sx);w.tagInt('y',sy);w.tagInt('z',sz);});
      w.tagList('BlockStatePalette',10,2,()=>{
        w.tagString('Name','minecraft:air'); w.u8(0);
        w.tagString('Name',blockName.startsWith('minecraft:')?blockName:`minecraft:${blockName}`); w.u8(0);
      });
      w.tagLongArray('BlockStates',packed);
      w.tagList('Entities',10,0,()=>{});
      w.tagList('TileEntities',10,0,()=>{});
      w.tagList('PendingBlockTicks',10,0,()=>{});
      w.tagList('PendingFluidTicks',10,0,()=>{});
    });
  });
  w.u8(0);
  return gzipSync(w.bytes(), { level: 6 });
}
