import { describe,it,expect } from 'vitest';
import { generateCircle,generateOval,generateDome } from '../src/lib/geometry';

function cells2d(r:any){const s=new Set<string>();for(const row of r.rows)for(const span of row.spans)for(let x=span.start;x<=span.end;x++)s.add(`${x},${row.y}`);return s}

describe('geometry',()=>{
  for(const n of [3,4,5,7,9,11,15,20,21,31,41,51,64,100]) it(`circle ${n} is symmetric and bounded`,()=>{const r=generateCircle(n,'thin',1);const s=cells2d(r);expect(r.blockCount).toBe(s.size);for(const k of s){const [x,y]=k.split(',').map(Number);expect(s.has(`${n-1-x},${y}`)).toBe(true);expect(s.has(`${x},${n-1-y}`)).toBe(true);expect(x).toBeGreaterThanOrEqual(0);expect(x).toBeLessThan(n)}});
  it('filled circle has more blocks than thin',()=>{expect(generateCircle(31,'filled').blockCount).toBeGreaterThan(generateCircle(31,'thin').blockCount)});
  it('oval stays in bounds',()=>{const r=generateOval(31,15,'thin',1);expect(r.rows).toHaveLength(15);expect(r.blockCount).toBeGreaterThan(0)});
  it('dome layer sums equal total',()=>{const r=generateDome(31,31,16,'thin',1);expect(r.layers.reduce((n,l)=>n+l.count,0)).toBe(r.blockCount);expect(r.blockCount).toBeGreaterThan(0)});
  it('filled dome has more blocks than hollow',()=>{expect(generateDome(21,21,11,'filled').blockCount).toBeGreaterThan(generateDome(21,21,11,'thin').blockCount)});
});
