export const materials = [
  ['Stone Bricks','stone_bricks'], ['Stone','stone'], ['Glass','glass'],
  ['Quartz','quartz_block'], ['Cobblestone','cobblestone'], ['Deepslate','deepslate'],
  ['Smooth Stone','smooth_stone'], ['Oak Planks','oak_planks'],
  ['Spruce Planks','spruce_planks'], ['Birch Planks','birch_planks'],
  ['White Concrete','white_concrete'], ['Black Concrete','black_concrete'],
  ['Gray Concrete','gray_concrete'], ['Light Gray Concrete','light_gray_concrete']
] as const;

export function resolveMaterial(label:string):string|null {
  const value=label.trim().toLowerCase().replace(/^minecraft:/,'');
  if(!value)return 'minecraft:stone';
  if(value==='stone brick')return 'minecraft:stone_bricks';
  const match=materials.find(([name,id])=>name.toLowerCase()===value||id===value||id===value.replace(/\s+/g,'_'));
  return match?`minecraft:${match[1]}`:null;
}
