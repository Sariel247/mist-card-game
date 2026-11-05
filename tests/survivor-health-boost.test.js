'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const match=html.match(/const characters=\{([\s\S]*?)\n\};/);
assert(match,'live survivor character definitions exist');
const source=match[1];
const expected={seer:40,doctor:40,thief:40,mercenary:40,mechanic:36,luca:40,perfumer:40};
for(const [id,hp] of Object.entries(expected)){
 const entry=source.match(new RegExp(id+":\\{name:'[^']+',hp:(\\d+)"));
 assert(entry,id+' has a configured health cap');
 assert.equal(Number(entry[1]),hp,id+' health cap matches V0.8.17');
}
const previous={seer:32,doctor:36,thief:32,mercenary:36,mechanic:34,luca:30,perfumer:32};
for(const [id,oldHp] of Object.entries(previous)) assert(expected[id]>oldHp,id+' health cap increased again');
assert.match(html,/机械师 · 特蕾西<\/h3><p>生命上限 36 点/,'Mechanic selection card reflects the new health cap');
console.log('Survivor health boost II: six survivors at 40 HP, Mechanic at 36 HP, UI copy matches PASS');
