'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const match=html.match(/const characters=\{([\s\S]*?)\n\};/);
assert(match,'live survivor character definitions exist');
const source=match[1];
const expected={seer:38,doctor:42,thief:36,mercenary:44,mechanic:36,luca:38,perfumer:40};
for(const [id,hp] of Object.entries(expected)){
 const entry=source.match(new RegExp(id+":\\{name:'[^']+',hp:(\\d+)"));
 assert(entry,id+' has a configured health cap');
 assert.equal(Number(entry[1]),hp,id+' health cap matches V0.8.18');
}
assert.equal(new Set(Object.values(expected)).size,5,'survivor health caps use a differentiated range');
assert.match(html,/V0.8.18 · 求生者差异化生命/,'version label updated');
console.log('Survivor differentiated health: Seer 38, Doctor 42, Thief 36, Mercenary 44, Mechanic 36, Luca 38, Perfumer 40 PASS');
