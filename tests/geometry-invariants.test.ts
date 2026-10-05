import { describe, expect, it } from 'vitest';
import { generateCircle, generateOval, generateDome, type ShapeResult, type BuildStyle } from '../src/core/geometry';

function checkRows(result:ShapeResult){
  const layers=result.type==='dome'?result.layers:[{index:0,rows:result.rows,count:result.blockCount}];
  let total=0;
  for(const layer of layers){
    const depth=result.type==='dome'?result.depth:result.height;
    expect(layer.rows).toHaveLength(depth);
    let count=0;
    for(const row of layer.rows){
      let end=-1,rowCount=0;
      for(const span of row.spans){
        expect(span.start).toBeGreaterThan(end);
        expect(span.start).toBeGreaterThanOrEqual(0);
        expect(span.end).toBeLessThan(result.width);
        expect(span.end).toBeGreaterThanOrEqual(span.start);
        rowCount+=span.end-span.start+1;end=span.end;
      }
      expect(rowCount).toBe(row.count);count+=rowCount;
      expect(row.spans.map(span=>({start:result.width-1-span.end,end:result.width-1-span.start})).reverse()).toEqual(row.spans);
      expect(layer.rows[depth-1-row.y].spans).toEqual(row.spans);
    }
    expect(count).toBe(layer.count);total+=count;
  }
  expect(total).toBe(result.blockCount);
}

function connectedCircle(result:ShapeResult){
  const cells=new Set<string>();
  for(const row of result.rows)for(const span of row.spans)for(let x=span.start;x<=span.end;x++)cells.add(`${x},${row.y}`);
  const pending=[cells.values().next().value!],seen=new Set(pending);
  while(pending.length){
    const [x,y]=pending.pop()!.split(',').map(Number);
    // Diagonal adjacency is intentional in conventional voxel circle outlines.
    for(let dx=-1;dx<=1;dx++)for(let dy=-1;dy<=1;dy++){
      const key=`${x+dx},${y+dy}`;
      if(cells.has(key)&&!seen.has(key)){seen.add(key);pending.push(key)}
    }
  }
  expect(seen.size).toBe(cells.size);
}

function connectedDome(result:ShapeResult){
  const cells=new Set<string>();
  for(const layer of result.layers)for(const row of layer.rows)for(const span of row.spans)for(let x=span.start;x<=span.end;x++)cells.add(`${x},${layer.index},${row.y}`);
  const pending=[cells.values().next().value!],seen=new Set(pending);
  while(pending.length){
    const [x,y,z]=pending.pop()!.split(',').map(Number);
    for(let dx=-1;dx<=1;dx++)for(let dy=-1;dy<=1;dy++)for(let dz=-1;dz<=1;dz++){
      const key=`${x+dx},${y+dy},${z+dz}`;
      if(cells.has(key)&&!seen.has(key)){seen.add(key);pending.push(key)}
    }
  }
  expect(seen.size).toBe(cells.size);
  // Checking only counts of retained layers would miss gaps filtered out by
  // the engine. Occupied layers must start at zero and remain consecutive.
  expect(result.layers.map(layer=>layer.index)).toEqual(Array.from({length:result.layers.length},(_,i)=>i));
}

describe('planned geometry QA matrix',()=>{
  for(const diameter of [5,7,9,11,15,21,31,41,51,64])it(`golden outline ${diameter}`,()=>{
    expect(generateCircle(diameter).rows.map(row=>row.spans)).toMatchSnapshot();
  });
  for(const diameter of [3,4,5,7,9,11,15,20,21,31,41,51,64,100,512]){
    for(const style of ['thin','thick','filled'] as BuildStyle[])it(`Circle ${diameter} ${style}: sums, bounds, symmetry, continuity`,()=>{
      const result=generateCircle(diameter,style,2);checkRows(result);connectedCircle(result);
    });
  }
  for(const [w,h] of [[11,21],[21,11],[20,40],[31,15],[100,20],[20,100],[31,3],[3,31],[512,3],[3,512]]){
    for(const style of ['thin','thick','filled'] as BuildStyle[])it(`Oval ${w}x${h} ${style}`,()=>{
      const result=generateOval(w,h,style,2);checkRows(result);connectedCircle(result);
    });
  }
  for(const [w,d,h] of [[3,3,16],[3,3,256],[3,31,16],[31,3,16],[4,4,64],[11,11,64]]){
    for(const style of ['thin','thick','filled'] as BuildStyle[])it(`Dome ${w}x${d}x${h} ${style}: no floating components or missing middle layers`,()=>{
      const result=generateDome(w,d,h,style,2);checkRows(result);connectedDome(result);
    });
  }
  for(const [w,d,h] of [[11,11,6],[20,20,10],[31,31,16],[31,31,10],[31,31,24]]){
    for(const style of ['thin','thick','filled'] as BuildStyle[])it(`Dome ${w}x${d}x${h} ${style}`,()=>checkRows(generateDome(w,d,h,style,2)));
  }
  it('keeps the center empty for the smallest thin outline',()=>{
    const result=generateCircle(3,'thin');expect(result.blockCount).toBe(8);
    expect(result.rows[1].spans).toEqual([{start:0,end:0},{start:2,end:2}]);
  });
  it('normalizes invalid numeric inputs without leaking NaN into spans',()=>{
    checkRows(generateCircle(NaN));checkRows(generateOval(Infinity,-5));checkRows(generateDome(-1,NaN,Infinity));
  });
});
