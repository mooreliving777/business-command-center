/* Browser-only motion smoke test. Avoids external network and site deployment. */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const mime={'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.svg':'image/svg+xml','.webp':'image/webp','.jpg':'image/jpeg'};
const server=createServer(async(req,res)=>{
 let name;
 try{name=decodeURIComponent(new URL(req.url,'http://localhost').pathname)}catch{res.writeHead(400).end();return}
 if(name==='/')name='/index.html';
 const file=path.resolve(root,'.'+name);
 if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return}
 try{res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream'});res.end(await readFile(file))}
 catch{res.writeHead(404).end()}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const origin='http://127.0.0.1:'+server.address().port;
let browser;
try{
 browser=await chromium.launch({headless:true});
 for(const target of ['/','/resources.html']){
  for(const motion of ['reduce','no-preference']){
   for(const width of [390,1366]){
    const context=await browser.newContext({viewport:{width,height:844},reducedMotion:motion});
    await context.route('**/*',route=>route.request().url().startsWith(origin+'/')?route.continue():route.abort());
    const page=await context.newPage();const errors=[];
    page.on('pageerror',err=>errors.push(err.message));
    await page.goto(origin+target,{waitUntil:'networkidle'});
    await page.waitForTimeout(100);
    const report=await page.evaluate(()=>({
      active:document.body.classList.contains('motion-ready'),
      progress:!!document.querySelector('.mv-progress'),
      css:[...document.styleSheets].some(s=>s.href?.endsWith('/motion.css')),
      right:document.documentElement.scrollWidth,
      width:innerWidth,
      script:performance.getEntriesByType('resource').some(x=>x.name.endsWith('/motion.js')),
      heading:!!document.querySelector('main h1')
    }));
    assert.ok(report.css&&report.script&&report.heading,target+' assets');
    assert.equal(report.active,motion==='no-preference','motion should respect preference');
    assert.equal(report.progress,motion==='no-preference','progress respects preference');
    assert.ok(report.right<=report.width+2,target+' width '+width+' overflow '+report.right);
    assert.deepEqual(errors,[],'No script errors: '+target);
    await context.close();
   }
  }
 }
 console.log('PASS Moorvio motion: both pages, 2 widths, both motion preferences, no external scripts');
}finally{
 if(browser)await browser.close();
 await new Promise(resolve=>server.close(resolve));
}
