import { test, expect, type Page } from '@playwright/test';
import fs from 'node:fs/promises';

let errors:string[]=[];
test.beforeEach(({page})=>{errors=[];page.on('pageerror',error=>errors.push(error.message))});
test.afterEach(()=>expect(errors).toEqual([]));

async function openTool(page:Page,url='/'){
  await page.goto(url);
  await expect(page.locator('[data-progress-label]')).toContainText('segments');
}

test('circle dimensions, row navigation, progress, undo and resume',async({page})=>{
  await openTool(page,'/#c-31-thin-1');
  await expect(page.locator('[data-blocks]')).toHaveText('84');
  await page.locator('[data-complete]').click();
  const progress=await page.locator('[data-progress-label]').textContent();
  await page.reload();
  await expect(page.locator('[data-progress-label]')).toHaveText(progress!);
  await page.locator('[data-undo]').click();
  await expect(page.locator('[data-progress-label]')).toContainText('0%');
  await page.locator('[data-row-next]').click();
  await expect(page.locator('[data-instruction-title]')).toContainText('Row 2 / 31');
  await page.locator('[data-complete-row]').click();
  await page.locator('[data-undo]').click();
  await expect(page.locator('[data-progress-label]')).toContainText('0%');
  await expect(page.locator('[data-instruction-title]')).toContainText('Row 2 / 31');
  if(!await page.locator('#diameter').isVisible())await page.locator('[data-settings-toggle]').click();
  await page.locator('#diameter').fill('20');await page.locator('#diameter').blur();
  await expect(page.locator('[data-blueprint-title]')).toHaveText('20×20 Circle');
  await expect(page.locator('[data-progress-label]')).toContainText('0%');
  await expect(page.locator('[data-instruction-body]')).toContainText('center gap');
  await page.locator('[data-style="filled"]').click();
  await expect(page.locator('[data-blocks]')).toHaveText('316');
});

test('shape changes and geometry versions isolate stored progress',async({page})=>{
  await openTool(page,'/#c-21-thin-1');await page.locator('[data-complete]').click();
  await openTool(page,'/#c-31-thin-1');
  await expect(page.locator('[data-progress-label]')).toContainText('0%');
  await page.evaluate(()=>{
    for(const key of Object.keys(localStorage))if(key.startsWith('vc-progress-v3'))localStorage.setItem(key.replace('v3','v2'),localStorage.getItem(key)!);
    for(const key of Object.keys(localStorage))if(key.startsWith('vc-progress-v3'))localStorage.removeItem(key);
  });
  await openTool(page,'/#c-21-thin-1');await expect(page.locator('[data-progress-label]')).toContainText('0%');
  await openTool(page,'/minecraft-oval-generator#o-21-11-thick-2');
  await expect(page.locator('[data-blueprint-title]')).toHaveText('21×11 Oval');
  await expect(page.locator('[data-progress-label]')).toContainText('0%');
});

test('dome layer completion is undone as one action and survives reload',async({page})=>{
  await openTool(page,'/minecraft-dome-generator#d-31-31-16-thin-1');
  await expect(page.locator('[data-blocks]')).toHaveText('1,353');
  await page.locator('[data-complete-layer]').click();
  await expect(page.locator('[data-layer]')).toHaveText('2/16');
  await page.locator('[data-undo]').click();
  await expect(page.locator('[data-layer]')).toHaveText('1/16');
  await expect(page.locator('[data-progress-label]')).toContainText('0%');
  await page.locator('[data-layer-jump-input]').fill('7');await page.locator('[data-layer-jump-input]').blur();
  await expect(page.locator('[data-layer]')).toHaveText('7/16');
  await page.reload();await expect(page.locator('[data-layer]')).toHaveText('7/16');
  await page.locator('[data-layer-next]').click();await expect(page.locator('[data-layer]')).toHaveText('8/16');
});

test('share, QR, PNG layouts, TXT and Litematic work',async({page})=>{
  await page.addInitScript(()=>{
    Object.defineProperty(navigator,'clipboard',{value:{writeText:(value:string)=>{(window as any).copiedLink=value;return Promise.resolve()}}});
  });
  await openTool(page,'/minecraft-oval-generator#o-20-40-thin-1');
  await page.locator('[data-share]').click();
  expect(await page.evaluate(()=>(window as any).copiedLink)).toBe('https://voxelcurve.com/minecraft-oval-generator#o-20-40-thin-1');
  await page.locator('[data-qr]').click();await expect(page.locator('[data-qr-dialog]')).toBeVisible();
  await expect(page.locator('[data-qr-dialog]')).toContainText('Build progress stays on this device');
  expect(await page.locator('[data-qr-canvas]').evaluate((canvas:HTMLCanvasElement)=>canvas.width)).toBe(240);
  await page.locator('[data-qr-close]').click();
  for(const mode of ['plain','grid','rows']){
    await page.locator('[data-png-options]').selectOption(mode);
    const downloading=page.waitForEvent('download');await page.locator('[data-png]').click();
    const download=await downloading;expect(download.suggestedFilename()).toBe('voxelcurve-oval-20x40-thin.png');
    const bytes=await fs.readFile((await download.path())!);expect(bytes.subarray(0,8).toString('hex')).toBe('89504e470d0a1a0a');
    expect(bytes.readUInt32BE(16)).toBeGreaterThan(20);
  }
  for(const [button,extension] of [['txt','.txt'],['litematic','.litematic']]){
    const downloading=page.waitForEvent('download');await page.locator(`[data-${button}]`).click();
    const download=await downloading;expect(download.suggestedFilename()).toContain(extension);
    const bytes=await fs.readFile((await download.path())!);
    if(button==='txt')expect(bytes.toString()).toContain(`Total Blocks: ${await page.locator('[data-blocks]').textContent()}`);
    else expect(bytes.subarray(0,2).toString('hex')).toBe('1f8b');
  }
});

test('print includes dimensions, materials, blueprint and complete instructions',async({page})=>{
  await page.addInitScript(()=>{window.print=()=>{(window as any).printed=true}});
  await openTool(page,'/minecraft-dome-generator');
  await page.locator('[data-print]').click();
  await expect(page.locator('[data-print-image]')).toHaveAttribute('src',/^data:image\/png/);
  await expect(page.locator('[data-print-plan]')).toContainText('Layer 16');
  await expect(page.locator('[data-print-sheet-meta]')).toContainText('Stone Bricks');
  await expect(page.locator('[data-print-sheet-title]')).toHaveText('31×31×16 Dome');
  await page.evaluate(()=>window.dispatchEvent(new Event('afterprint')));
});

test('mobile layout and build mode expose usable controls without overflow',async({page})=>{
  await page.setViewportSize({width:375,height:667});await openTool(page);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  const canvas=await page.locator('[data-canvas]').boundingBox();expect(canvas!.width).toBeGreaterThan(330);
  await page.locator('[data-settings-toggle]').click();
  expect(await page.locator('.tool-shell button,.tool-shell select,.tool-shell input:not([type=hidden])').evaluateAll(elements=>elements.filter(el=>el.getClientRects().length).every(el=>el.getBoundingClientRect().height>=44&&el.getBoundingClientRect().width>=44))).toBe(true);
  await page.locator('[data-settings-toggle]').click();
  await page.locator('[data-build-mode]').click();
  await expect(page.locator('[data-complete]')).toBeVisible();
  await expect(page.locator('[data-build-mode]')).toHaveText('Exit build mode');
  expect(await page.locator('[data-build-mode]').evaluate(el=>el.getBoundingClientRect().height)).toBeGreaterThanOrEqual(44);
  await page.locator('[data-complete]').click();
  await expect(page.locator('[data-progress-label]')).not.toContainText('0% complete');
  await page.locator('[data-build-mode]').click();
  await expect(page.locator('[data-build-mode]')).toHaveText('Build mode');
});

test('tap selects a segment while dragging and pinching preserve progress',async({page})=>{
  await openTool(page);
  // Synthetic pointer IDs cannot be captured by a native browser. Disable only
  // capture for this input sequence; actual clicks are covered by other tests.
  await page.locator('[data-canvas-wrap]').evaluate((el:HTMLElement)=>{el.setPointerCapture=()=>{}});
  const canvas=page.locator('[data-canvas]');
  const progress=await page.locator('[data-progress-label]').textContent();
  const box=(await canvas.boundingBox())!;
  await canvas.dispatchEvent('pointerdown',{pointerId:1,pointerType:'touch',clientX:box.x+80,clientY:box.y+80});
  await canvas.dispatchEvent('pointermove',{pointerId:1,pointerType:'touch',clientX:box.x+160,clientY:box.y+160});
  await canvas.dispatchEvent('pointerup',{pointerId:1,pointerType:'touch',clientX:box.x+160,clientY:box.y+160});
  await expect(page.locator('[data-progress-label]')).toHaveText(progress!);
  await page.locator('[data-fit]').click();
  const cell=Math.min((box.width-42)/31,(box.height-42)/31);
  const x=box.x+(box.width-31*cell)/2+15.5*cell;
  const y=box.y+(box.height-31*cell)/2+30.5*cell;
  await canvas.dispatchEvent('pointerdown',{pointerId:2,pointerType:'touch',clientX:x,clientY:y});
  await canvas.dispatchEvent('pointerup',{pointerId:2,pointerType:'touch',clientX:x,clientY:y});
  await expect(page.locator('[data-instruction-title]')).toContainText('Row 31 / 31');
  await expect(page.locator('[data-progress-label]')).toHaveText(progress!);
  await canvas.dispatchEvent('pointerdown',{pointerId:3,pointerType:'touch',clientX:x-20,clientY:y});
  await canvas.dispatchEvent('pointerdown',{pointerId:4,pointerType:'touch',clientX:x+20,clientY:y});
  await canvas.dispatchEvent('pointermove',{pointerId:4,pointerType:'touch',clientX:x+60,clientY:y});
  await canvas.dispatchEvent('pointerup',{pointerId:4,pointerType:'touch',clientX:x+60,clientY:y});
  await canvas.dispatchEvent('pointerup',{pointerId:3,pointerType:'touch',clientX:x-20,clientY:y});
  await expect(page.locator('[data-instruction-title]')).toContainText('Row 31 / 31');
  await expect(page.locator('[data-progress-label]')).toHaveText(progress!);
});

test('maximum circle and missing browser storage remain usable',async({page})=>{
  await page.addInitScript(()=>{Object.defineProperty(window,'localStorage',{get(){throw new Error('Storage unavailable')}})});
  await openTool(page,'/#c-512-thin-1');
  await expect(page.locator('[data-blueprint-title]')).toHaveText('512×512 Circle');
  await page.locator('[data-fit]').click();await page.locator('[data-complete]').click();
  await expect(page.locator('[data-progress-label]')).toContainText('1/');
  await page.locator('[data-undo]').click();await expect(page.locator('[data-progress-label]')).toContainText('0%');
});

test('all content pages are readable on mobile and the chart has real HTML data',async({page})=>{
  await page.setViewportSize({width:375,height:812});
  for(const path of ['/minecraft-circle-chart','/how-to-make-a-circle-in-minecraft','/about','/contact','/privacy','/terms','/disclaimer','/404']){
    await page.goto(path);
    await expect(page.locator('h1')).toHaveCount(1);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    if(path==='/minecraft-circle-chart')await expect(page.locator('tbody tr')).toHaveCount(12);
    if(path==='/contact')await expect(page.locator('a[href="mailto:contact@voxelcurve.com"]')).toHaveCount(2);
    if(path==='/404')await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content','noindex,follow');
  }
});


test('fragment normalization, page anchors, QR Escape and double-click Fit preserve behavior',async({page})=>{
  await openTool(page,'/#c-21-thick-1');
  await expect(page).toHaveURL(/#c-21-thick-2$/);
  await page.locator('[data-complete]').click();
  const progress=await page.locator('[data-progress-label]').textContent();
  await page.evaluate(()=>{location.hash='main-content'});
  await expect(page.locator('[data-progress-label]')).toHaveText(progress!);
  await page.locator('[data-qr]').click();
  await expect(page.locator('[data-qr-link]')).toHaveAttribute('href','https://voxelcurve.com/#c-21-thick-2');
  await page.keyboard.press('Escape');
  await expect(page.locator('[data-qr-dialog]')).not.toBeVisible();
  await expect(page.locator('[data-build-mode]')).toHaveText('Build mode');
  await page.locator('[data-build-mode]').click();
  await page.keyboard.press('Escape');
  await expect(page.locator('[data-build-mode]')).toHaveText('Build mode');
  await page.locator('[data-fit]').click();
  await page.locator('[data-zoom-in]').click();
  const zoomed=await page.locator('[data-canvas]').evaluate((canvas:HTMLCanvasElement)=>canvas.toDataURL());
  await page.locator('[data-canvas]').dblclick({position:{x:20,y:20}});
  const fitted=await page.locator('[data-canvas]').evaluate((canvas:HTMLCanvasElement)=>canvas.toDataURL());
  expect(fitted===zoomed).toBe(false);
  await page.locator('[data-fit]').click();
  expect(await page.locator('[data-canvas]').evaluate((canvas:HTMLCanvasElement,expected:string)=>canvas.toDataURL()===expected,fitted)).toBe(true);
});
