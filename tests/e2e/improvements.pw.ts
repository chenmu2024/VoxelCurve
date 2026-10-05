import { test, expect, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import { gunzipSync } from 'node:zlib';

async function setup(page:Page,url='/'){
  await page.goto(url);
  await expect(page.locator('[data-progress-label]')).toContainText('segments');
}

test('material mapping, explicit fallback and import help agree with downloads',async({page})=>{
  await setup(page);
  if(!await page.locator('#material').isVisible())await page.locator('[data-settings-toggle]').click();
  await page.locator('#material').fill('minecraft:glass');
  await expect(page.locator('[data-material-note]')).toContainText('minecraft:glass');
  const downloading=page.waitForEvent('download');await page.locator('[data-litematic]').click();
  const file=await downloading;
  const nbt=gunzipSync(await fs.readFile((await file.path())!)).toString();
  expect(nbt).toContain('minecraft:glass');expect(nbt).not.toContain('minecraft:stone_bricks');
  await page.locator('#material').fill('My roof blocks');
  await expect(page.locator('[data-material-note]')).toContainText('will ask');
  let downloads=0;page.on('download',()=>downloads++);
  page.once('dialog',async dialog=>{expect(dialog.message()).toContain('Stone instead');await dialog.dismiss()});
  await page.locator('[data-litematic]').click();
  await expect(page.locator('[data-action-status]')).toContainText('cancelled');expect(downloads).toBe(0);
  page.once('dialog',dialog=>dialog.accept());
  const fallback=page.waitForEvent('download');await page.locator('[data-litematic]').click();
  const stone=await fallback;
  expect(gunzipSync(await fs.readFile((await stone.path())!)).toString()).toContain('minecraft:stone');
  const text=page.waitForEvent('download');await page.locator('[data-txt]').click();
  expect(await fs.readFile((await (await text).path())!,'utf8')).toContain('My roof blocks');
  await page.locator('.export-help summary').click();
  await expect(page.locator('.export-help')).toContainText('create a placement');
  await expect(page.locator('.export-help')).toContainText('real import test');
});

test('row jumps, empty rows, unfinished wrapping and completed plans are safe',async({page})=>{
  await setup(page,'/#c-3-filled-1');
  await page.locator('[data-row-jump-input]').fill('3');await page.locator('[data-row-jump-input]').blur();
  await expect(page.locator('[data-instruction-title]')).toContainText('Row 3 / 3');
  await page.locator('[data-unfinished]').click();await expect(page.locator('[data-instruction-title]')).toContainText('Row 1 / 3');
  for(let i=0;i<3;i++)await page.locator('[data-complete]').click();
  await expect(page.locator('[data-unfinished]')).toBeDisabled();
  await page.locator('[data-undo]').click();await expect(page.locator('[data-unfinished]')).toBeEnabled();
  await page.locator('[data-row-jump-input]').fill('99');await page.locator('[data-row-jump-input]').blur();
  await expect(page.locator('[data-action-status]')).toContainText('Choose a row from 1 to 3');
  await setup(page,'/minecraft-dome-generator#d-31-31-16-thin-1');
  await page.locator('[data-layer-jump-input]').fill('16');await page.locator('[data-layer-jump-input]').blur();
  const previous=await page.locator('[data-instruction-title]').textContent();
  await page.locator('[data-row-jump-input]').fill('1');await page.locator('[data-row-jump-input]').blur();
  await expect(page.locator('[data-action-status]')).toContainText('has no blocks');
  await expect(page.locator('[data-instruction-title]')).toHaveText(previous!);
});

test('write failures keep restored progress and a persistent unsaved warning',async({page})=>{
  await setup(page);await page.locator('[data-complete]').click();
  const progress=await page.locator('[data-progress-label]').textContent();
  await page.addInitScript(()=>{Storage.prototype.setItem=()=>{throw new DOMException('Full','QuotaExceededError')}});
  await page.reload();
  await expect(page.locator('[data-progress-label]')).toHaveText(progress!);
  await expect(page.locator('[data-save-status]')).toContainText('Not saved');
  await page.locator('[data-next]').click();
  await expect(page.locator('[data-save-status]')).toContainText('Keep this page open');
  const downloading=page.waitForEvent('download');await page.locator('[data-txt]').click();await downloading;
  // An unrelated action's status must not replace the storage warning.
  await expect(page.locator('[data-save-status]')).toContainText('Not saved');
});

test('background export can be cancelled without blocking navigation, then retried',async({page})=>{
  await setup(page);
  let release:()=>void=()=>{};
  const held=new Promise<void>(resolve=>{release=resolve});
  await page.route('**/*litematic.worker*.js',async route=>{await held;await route.continue().catch(()=>{})});
  await page.locator('[data-litematic]').click();
  await expect(page.locator('[data-cancel-export]')).toBeVisible();
  await page.locator('[data-next]').click();
  await expect(page.locator('[data-instruction-title]')).toContainText('Row 2');
  await page.locator('[data-cancel-export]').click();
  await expect(page.locator('[data-action-status]')).toContainText('cancelled');
  await expect(page.locator('[data-litematic]')).toBeEnabled();
  release();await page.unroute('**/*litematic.worker*.js');
  const downloading=page.waitForEvent('download');await page.locator('[data-litematic]').click();
  expect((await downloading).suggestedFilename()).toBe('voxelcurve-circle-31-thin.litematic');
});

test('an export keeps its original dimensions and material while settings change',async({page})=>{
  await setup(page);
  let release:()=>void=()=>{};
  const held=new Promise<void>(resolve=>{release=resolve});
  await page.route('**/*litematic.worker*.js',async route=>{await held;await route.continue()});
  const downloading=page.waitForEvent('download');
  await page.locator('[data-litematic]').click();
  if(!await page.locator('#diameter').isVisible())await page.locator('[data-settings-toggle]').click();
  await page.locator('#diameter').fill('20');await page.locator('#diameter').blur();
  await page.locator('#material').fill('Glass');
  await expect(page.locator('[data-litematic]')).toBeDisabled();
  release();
  const download=await downloading;
  expect(download.suggestedFilename()).toBe('voxelcurve-circle-31-thin.litematic');
  const nbt=gunzipSync(await fs.readFile((await download.path())!));
  expect(nbt.toString()).toContain('minecraft:stone_bricks');
  expect(nbt.readInt32BE(nbt.indexOf('TotalBlocks')+'TotalBlocks'.length)).toBe(84);
  await expect(page.locator('[data-blueprint-title]')).toHaveText('20×20 Circle');
  await expect(page.locator('[data-litematic]')).toBeEnabled();
});

test('short portrait and landscape keep instructions above completion controls',async({page})=>{
  for(const viewport of [{width:320,height:568},{width:667,height:375}]){
    await page.setViewportSize(viewport);
    await setup(page,'/minecraft-dome-generator');
    await page.locator('[data-build-mode]').click();
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    const instruction=(await page.locator('.instruction').boundingBox())!;
    const action=(await page.locator('[data-complete-row]').boundingBox())!;
    expect(instruction.y+instruction.height).toBeLessThanOrEqual(action.y);
    expect(action.y+action.height).toBeLessThanOrEqual(viewport.height);
    await page.locator('[data-complete-row]').click();
    await expect(page.locator('[data-progress-label]')).not.toContainText('0%');
  }
});

test('narrow dome layer labels, progress and PNG names use physical layer numbers',async({page})=>{
  await setup(page,'/minecraft-dome-generator#d-3-3-16-thin-1');
  await expect(page.locator('[data-blocks]')).toHaveText('76');
  await page.locator('[data-layer-jump-input]').fill('13');await page.locator('[data-layer-jump-input]').blur();
  await expect(page.locator('[data-instruction-title]')).toContainText('Layer 13 / 16');
  await expect(page.locator('[data-layer]')).toHaveText('13/16');
  await page.locator('[data-layer-jump-input]').fill('16');await page.locator('[data-layer-jump-input]').blur();
  await expect(page.locator('[data-instruction-title]')).toContainText('Layer 16 / 16');
  await expect(page.locator('[data-layer]')).toHaveText('16/16');
  await expect(page.locator('[data-layer-progress]')).toContainText('Layer 16:');
  const downloading=page.waitForEvent('download');await page.locator('[data-png]').click();
  expect((await downloading).suggestedFilename()).toBe('voxelcurve-dome-3x3x16-thin-layer-16.png');
  await setup(page,'/minecraft-dome-generator#d-4-4-64-thin-1');
  const previous=await page.locator('[data-instruction-title]').textContent();
  await page.locator('[data-layer-jump-input]').fill('64');await page.locator('[data-layer-jump-input]').blur();
  await expect(page.locator('[data-action-status]')).toContainText('Layer 64 has no blocks');
  await expect(page.locator('[data-instruction-title]')).toHaveText(previous!);
});

test('guide example tables have named focus regions and support keyboard scrolling',async({page})=>{
  await page.setViewportSize({width:375,height:812});
  await page.goto('/how-to-make-a-circle-in-minecraft');
  for(const size of [11,21,31]){
    const table=page.getByRole('region',{name:`${size}×${size} circle row instructions`,exact:true});
    await expect(table).toHaveAttribute('tabindex','0');
    await table.focus();await expect(table).toBeFocused();
    await table.press('ArrowRight');
    await expect.poll(()=>table.evaluate(element=>element.scrollLeft)).toBeGreaterThan(0);
    expect(await table.evaluate(element=>getComputedStyle(element).outlineStyle)).not.toBe('none');
  }
});
