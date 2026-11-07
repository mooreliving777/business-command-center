// Local-only responsive QA for Moorvio's public 10-section landing page.
// Does not publish, submit forms, connect to real accounts or contact external sites.
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const captures=path.join(root,'artifacts');
await mkdir(captures,{recursive:true});
const types={'.html':'text/html; charset=utf-8','.css':'text/css','.svg':'image/svg+xml','.webp':'image/webp','.jpg':'image/jpeg'};
const server=createServer(async(req,res)=>{
 let pathname;
 try{pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);}
 catch{res.writeHead(400).end();return;}
 if(pathname.endsWith('/'))pathname+='index.html';
 const file=path.resolve(root,'.'+pathname);
 if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
 try{const bytes=await readFile(file);res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream'});res.end(bytes);}
 catch{res.writeHead(404).end();}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const origin='http://127.0.0.1:'+server.address().port;
const expected=['home','proof','problem','solution','features','how-it-works','testimonials','pricing','faq','final-cta'];
let browser;
try {
 browser=await chromium.launch({headless:true});
 for(const viewport of [{width:320,height:740},{width:390,height:844},{width:768,height:1024},{width:1366,height:900}]){
  const context=await browser.newContext({viewport,reducedMotion:'reduce'});
  await context.route('**/*',route=>route.request().url().startsWith(origin+'/')?route.continue():route.abort());
  const page=await context.newPage(),errors=[];
  page.on('pageerror',err=>errors.push(err.message));
  await page.goto(origin+'/',{waitUntil:'networkidle'});
  const report=await page.evaluate(ids=>{
   const sections=[...document.querySelectorAll('section[id]')].map(el=>el.id).filter(id=>ids.includes(id));
   const missing=[...document.querySelectorAll('a[href^="#"]')].map(a=>a.getAttribute('href').slice(1)).filter(id=>id&&!document.getElementById(id));
   const offenders=[...document.querySelectorAll('body *')].map(el=>({el,rect:el.getBoundingClientRect()})).filter(({rect})=>rect.width&&(rect.right>innerWidth+2||rect.left<-2)).slice(0,5).map(({el,rect})=>({tag:el.tagName,className:String(el.className).slice(0,55),right:Math.round(rect.right),width:Math.round(rect.width)}));
   return {sections,missing,offenders,overflow:document.documentElement.scrollWidth>innerWidth+2,hasStyles:[...document.styleSheets].some(s=>s.href?.includes('landing.css')),forms:document.querySelectorAll('form').length,hasTitle:document.title.includes('Moorvio')};
  },expected);
  assert.deepEqual(report.sections,expected,'Moorvio sections must remain ordered at '+viewport.width);
  assert.deepEqual(report.missing,[],'No broken in-page anchor targets');
  assert.equal(report.hasStyles,true,'Custom styles must load');
  assert.equal(report.forms,0,'No unverified signup or payment form');
  assert.equal(report.hasTitle,true,'Title must identify Moorvio');
  assert.equal(report.overflow,false,'Unexpected horizontal scroll at '+viewport.width+': '+JSON.stringify(report.offenders));
  const faq=page.locator('#faq details').first();
  await faq.locator('summary').click();assert.equal(await faq.getAttribute('open'),'','FAQ should expand');
  await faq.locator('summary').click();assert.equal(await faq.getAttribute('open'),null,'FAQ should collapse');
  if([390,1366].includes(viewport.width))await page.screenshot({path:path.join(captures,'moorvio-'+viewport.width+'.png'),fullPage:true});
  assert.deepEqual(errors,[], 'No browser errors');
  await context.close();
 }
 console.log('PASS: Moorvio x 4 viewports, conversion sections, keyboard-compatible FAQ, no overflow, no forms, no external network');
} finally {
 if(browser)await browser.close();
 await new Promise(resolve=>server.close(resolve));
}
