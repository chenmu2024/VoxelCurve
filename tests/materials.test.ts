import { describe, it, expect } from 'vitest';
import { materials, resolveMaterial } from '../src/lib/materials';

describe('material labels match the Litematic palette',()=>{
  for(const [label,id] of materials)it(label,()=>{
    expect(resolveMaterial(label)).toBe(`minecraft:${id}`);
    expect(resolveMaterial(` minecraft:${id} `)).toBe(`minecraft:${id}`);
    expect(resolveMaterial(id)).toBe(`minecraft:${id}`);
  });
  it('accepts case, spacing and the existing stone brick alias',()=>{
    expect(resolveMaterial('STONE BRICK')).toBe('minecraft:stone_bricks');
    expect(resolveMaterial('light   gray concrete')).toBe('minecraft:light_gray_concrete');
    expect(resolveMaterial('')).toBe('minecraft:stone');
  });
  it('requires explicit handling of unsupported labels instead of silently replacing them',()=>{
    for(const label of ['My custom roof','minecraft:diamond_block','<script>','other:stone'])expect(resolveMaterial(label)).toBeNull();
  });
});
