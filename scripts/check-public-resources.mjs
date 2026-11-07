import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = file => readFileSync(new URL('../'+file, import.meta.url),'utf8');
const home=read('index.html');
const html=read('resources.html');
const css=read('resources.css');
const js=read('resources.js');
const rows=[...html.matchAll(/<li class="resource-row" data-group="([^"]+)" data-recommended="(true|false)" data-search="[^"]+">/g)];
const websiteLinks=[...html.matchAll(/<a class="resource-visit" href="([^"]+)" target="_blank" rel="noopener noreferrer external"/g)];
const options=[...html.matchAll(/<option value="[^"]+">/g)];

assert.equal(rows.length,52,'Public catalog must include all 52 items');
assert.equal(rows.filter(row=>row[2]==='true').length,21,'Recommended count must stay curated');
assert.equal(new Set(rows.map(row=>row[1])).size,6,'All six public categories are required');
assert.equal(options.length,7,'Category filter needs six groups plus All');
assert.equal(websiteLinks.length,52,'Every resource must have an external site link');
assert.ok(websiteLinks.every(link=>/^https:\/\/[a-z0-9.-]+(?:\/|$)/i.test(link[1])),'Provider URLs must use HTTPS');
assert.match(html,/<link rel="stylesheet" href="resources.css">/);
assert.match(html,/<script src="resources.js" defer><\/script>/);
assert.match(home,/<a href="resources.html">AI Resources<\/a>/);
for(const id of ['resource-search','resource-group','resource-recommended','resource-count','resource-list','resource-more']){
  assert.ok(html.includes('id="'+id+'"'),'Required filter control missing: '+id);
}
assert.match(css,/@media\(max-width:520px\)/);
assert.match(css,/:focus-visible/);
assert.match(js,/const PAGE_SIZE=8/);
assert.match(js,/search\.addEventListener\('input'/);
assert.match(js,/more\.addEventListener\('click'/);
assert.doesNotMatch(js,/\b(fetch|XMLHttpRequest|localStorage|sessionStorage|sendBeacon)\b/);
assert.doesNotMatch(html,/<script[^>]*src="https?:/);
new Function(js); // syntax-only parse of our own static script, never run external code
console.log('PASS: 52 safe resource links, 21 picks, filters, responsive styling and syntax.');
