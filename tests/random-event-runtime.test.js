'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const scriptStart=html.indexOf('<script>')+'<script>'.length;
const scriptEnd=html.indexOf('</script>',scriptStart);
const script=html.slice(scriptStart,scriptEnd);
assert(script.length>0,'inline script exists');
assert.doesNotThrow(()=>new Function(script),'page inline JavaScript parses');
const start=script.indexOf('function triggerRandomEvent(){');
const end=script.indexOf('function persistGame(){',start);
assert(start>=0&&end>start,'random event function boundaries found');
const body=script.slice(start+'function triggerRandomEvent(){'.length,end).trim().replace(/\\}$/, '');
const create=new Function('state','log','trackCipherFury','activateGatePhase','grantWeatherShield','gainFury','return function(){'+body+'}');
const expected=['遗落的补给箱','紧急医疗包','密码机残留数据','临时屏障','追猎气息','灵感闪现','破译干扰'];
for(let i=0;i<expected.length;i++){
 const calls=[],sequence=[(i+.1)/expected.length,.1];
 const state={energy:5,hp:10,hero:{hp:24},skillPoints:4,shield:0,fury:0,eventsTriggered:0,lastEvent:null,ciphers:[{id:1,progress:20},{id:2,progress:100}]};
 const originalRandom=Math.random;
 Math.random=()=>sequence.length?sequence.shift():.1;
 try{
  create(state,x=>calls.push(x),(...args)=>calls.push(['furyTrack',...args]),()=>calls.push('gate'),n=>state.shield+=n,n=>state.fury+=n)();
 }finally{Math.random=originalRandom;}
 assert.equal(state.eventsTriggered,1,'event counter increments');
 assert.equal(state.lastEvent.name,expected[i],'event name matches pool order');
 if(i===0)assert.equal(state.energy,7,'supply grants 2 energy');
 if(i===1)assert.equal(state.hp,14,'medical kit restores 4 HP');
 if(i===2){assert.equal(state.ciphers[0].progress,35,'cipher data adds 15%');assert(calls.some(x=>Array.isArray(x)&&x[0]==='furyTrack'),'cipher data tracks fury milestones');}
 if(i===3)assert.equal(state.shield,4,'temporary barrier grants 4 shield');
 if(i===4)assert.equal(state.fury,2,'hunt pressure grants 2 hunter fury');
 if(i===5)assert.equal(state.skillPoints,6,'inspiration respects 6-point cap');
 if(i===6)assert.equal(state.ciphers[0].progress,10,'interference removes 10% progress');
}
console.log('PASS: 7 random event runtime branches');
