import { describe, expect, it } from 'vitest';
import { decodeProgress, encodeProgress } from '../src/lib/progress';

const steps=(n:number)=>Array.from({length:n},(_,i)=>({key:`S${i}`}));

describe('build progress storage',()=>{
  it('round-trips compact bitset progress',()=>{
    const list=steps(10000);
    const done=new Set(['S0','S1','S77','S9999']);
    const raw=encodeProgress(done,list,77);
    const decoded=decodeProgress(raw,list);
    expect([...decoded.completed]).toEqual(['S0','S1','S77','S9999']);
    expect(decoded.stepIndex).toBe(77);
    expect(raw.length).toBeLessThan(2500);
  });

  it('migrates legacy completed-key arrays safely',()=>{
    const list=steps(5);
    const raw=JSON.stringify({completed:['S0','S4','STALE'],stepIndex:99});
    const decoded=decodeProgress(raw,list);
    expect([...decoded.completed]).toEqual(['S0','S4']);
    expect(decoded.stepIndex).toBe(4);
  });

  it('ignores malformed saved progress',()=>{
    const list=steps(3);
    expect(decodeProgress('not-json',list).completed.size).toBe(0);
    expect(decodeProgress(JSON.stringify({v:2,bits:'!!!',stepIndex:2}),list).completed.size).toBe(0);
  });

  it('never restores bits beyond current steps',()=>{
    const original=steps(16);
    const raw=encodeProgress(new Set(original.map(s=>s.key)),original,15);
    const shorter=steps(3);
    const decoded=decodeProgress(raw,shorter);
    expect(decoded.completed.size).toBe(3);
    expect(decoded.stepIndex).toBe(2);
  });
});
