import { describe, expect, it } from 'vitest';
import { canonicalBlueprintUrl, parseBlueprintFragment, serializeBlueprintState } from '../src/lib/state';

describe('blueprint URL state',()=>{
  it('round-trips circle state',()=>{
    const state={shape:'circle' as const,diameter:31,style:'thin' as const,thickness:1};
    const fragment=serializeBlueprintState(state);
    expect(fragment).toBe('c-31-thin-1');
    expect(parseBlueprintFragment(fragment)).toEqual(state);
  });

  it('round-trips oval state',()=>{
    const state={shape:'oval' as const,width:31,height:21,style:'thick' as const,thickness:3};
    expect(parseBlueprintFragment(serializeBlueprintState(state))).toEqual(state);
  });

  it('round-trips dome state',()=>{
    const state={shape:'dome' as const,width:31,depth:31,height:16,style:'filled' as const,thickness:1};
    expect(parseBlueprintFragment('#'+serializeBlueprintState(state))).toEqual(state);
  });

  it('rejects malformed or unsupported fragments',()=>{
    expect(parseBlueprintFragment('')).toBeNull();
    expect(parseBlueprintFragment('c-31-weird-1')).toBeNull();
    expect(parseBlueprintFragment('c-nope-thin-1')).toBeNull();
    expect(parseBlueprintFragment('o-31-21-thin')).toBeNull();
    expect(parseBlueprintFragment('d-31-31-16-thin-1-extra')).toBeNull();
  });

  it('always creates production-domain share URLs',()=>{
    const state={shape:'circle' as const,diameter:21,style:'thin' as const,thickness:1};
    expect(canonicalBlueprintUrl('/',state)).toBe('https://voxelcurve.com/#c-21-thin-1');
    expect(canonicalBlueprintUrl('/minecraft-dome-generator',state))
      .toBe('https://voxelcurve.com/minecraft-dome-generator#c-21-thin-1');
  });
  it('rejects out-of-range, fractional and nondecimal shared inputs',()=>{
    for(const fragment of ['c-2-thin-1','c-513-thin-1','c-31-thick-0','c-31-thick-33','c-3.5-thin-1','c-0x20-thin-1','c-1e2-thin-1','o-512-513-thin-1','d-257-31-16-thin-1','d-31-31-1-thin-1'])expect(parseBlueprintFragment(fragment)).toBeNull();
  });
});
