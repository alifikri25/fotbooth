import fs from 'node:fs/promises';
import { chromium, webkit } from '@playwright/test';

const evidence = [];
for (const [engine, type] of [['chromium', chromium], ['webkit', webkit]]) {
  const browser = await type.launch();
  try {
    const page = await browser.newPage();
    await page.goto('http://127.0.0.1:5173/tests/harness.html');
    const result = await page.evaluate(async () => {
      const { definitions } = await import('/src/frames/definitions.ts');
      const { PhotoRegistry } = await import('/src/core/resources.ts');
      const { ingestPhoto } = await import('/src/core/ingest.ts');
      const { createSession, addPhoto } = await import('/src/core/session.ts');
      const { ExportManager } = await import('/src/core/export.ts');
      const { renderComposition } = await import('/src/core/renderer.ts');
      const { ensureFonts } = await import('/src/core/text.ts');
      await ensureFonts();
      const original=document.createElement('canvas');original.width=4031;original.height=3023;const ctx=original.getContext('2d');
      ctx.fillStyle='#bcd2ad';ctx.fillRect(0,0,4031,3023);for(let x=0;x<4031;x+=100){ctx.fillStyle=x%200?'#e5aa94':'#556ee0';ctx.fillRect(x,0,30,3023);}
      const blob=await new Promise(resolve=>original.toBlob(resolve,'image/png'));original.width=1;original.height=1;
      const registry=new PhotoRegistry(),frame=definitions[7];let session=createSession(frame);
      for(let i=0;i<4;i++){const asset=await ingestPhoto(blob);registry.add(asset);session=addPhoto(session,asset.id);}
      const preview=document.createElement('canvas');await renderComposition(preview,frame,session,registry.preview,400,600);
      const times=[];for(let i=0;i<40;i++){const next={...session,placements:session.placements.map((p,index)=>index? p:{...p,zoom:1.5,centerX:.45+i*.002})};const start=performance.now();await renderComposition(preview,frame,next,registry.preview,400,600);times.push(performance.now()-start);}
      const manager=new ExportManager(),exports=[];
      for(const format of ['png','jpg']){const durations=[];let valid=0;for(let i=0;i<20;i++){const start=performance.now();const output=await manager.run(session,frame,registry,format,'standard');durations.push(performance.now()-start);const bitmap=await createImageBitmap(output);if(bitmap.width===1800&&bitmap.height===2700&&output.size>0)valid++;bitmap.close();}
        durations.sort((a,b)=>a-b);exports.push({format,valid,attempts:20,p95Ms:Math.round(durations[18]),maxMs:Math.round(durations[19])});}
      registry.clear();times.sort((a,b)=>a-b);return {inputPixels:4031*3023,photos:4,previewRenderP95Ms:Math.round(times[37]*10)/10,exports,resourcesAfterClear:registry.size};
    });
    evidence.push({engine,version:browser.version(),...result});
    console.log(`${engine}: 40 standard exports checked; resources after clear=${result.resourcesAfterClear}.`);
  } finally {await browser.close();}
}
await fs.writeFile('docs/qa/performance.json',JSON.stringify({date:'2026-10-06',environment:'Windows 11 Pro 10.0.26200, ~16 GB RAM; automation host, not PRD reference phones',evidence},null,2)+'\n');
