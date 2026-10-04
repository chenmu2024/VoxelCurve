import { describe, expect, it } from 'vitest';
import { anchorIsBlockAligned, axisIsBlockAligned, formatWorldSegment, gridCoordinate, worldSegment } from '../src/lib/world';

describe('world coordinate mapping',()=>{
  it('maps odd-size center block to the entered center coordinate',()=>{
    expect(gridCoordinate(100,15,31)).toBe(100);
    expect(axisIsBlockAligned(100,31)).toBe(true);
  });

  it('requires a half-coordinate center for even block dimensions',()=>{
    expect(gridCoordinate(100.5,9,20)).toBe(100);
    expect(gridCoordinate(100.5,10,20)).toBe(101);
    expect(axisIsBlockAligned(100.5,20)).toBe(true);
    expect(axisIsBlockAligned(100,20)).toBe(false);
  });

  it('maps a segment into X/Y/Z using +X right, +Z rows and +Y layers',()=>{
    const segment=worldSegment(
      {centerX:100,baseY:64,centerZ:-30},
      {start:12,end:18},
      10,
      31,
      31,
      4
    );
    expect(segment).toEqual({xStart:97,xEnd:103,y:68,z:-35,aligned:true});
    expect(formatWorldSegment(segment)).toBe('World · X 97–103 · Y 68 · Z -35');
  });

  it('detects misaligned anchors across axes',()=>{
    expect(anchorIsBlockAligned({centerX:0,baseY:64,centerZ:0},20,20)).toBe(false);
    expect(anchorIsBlockAligned({centerX:.5,baseY:64,centerZ:.5},20,20)).toBe(true);
    expect(anchorIsBlockAligned({centerX:.5,baseY:64.5,centerZ:.5},20,20)).toBe(false);
  });
});
