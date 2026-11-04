'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const inlineScript=(html.match(/<script>([\s\S]*?)<\/script>/)||[])[1];
assert(inlineScript,'inline script exists');
assert.doesNotThrow(()=>new vm.Script(inlineScript),'inline JavaScript parses');
function extractBody(name){
 const start=inlineScript.indexOf('function '+name+'(');assert(start>=0,'function exists: '+name);
 const open=inlineScript.indexOf('{',start);let depth=0,quote='',escape=false,lineComment=false,blockComment=false;
 for(let i=open;i<inlineScript.length;i++){const ch=inlineScript[i],next=inlineScript[i+1];
  if(lineComment){if(ch==='\n')lineComment=false;continue;}
  if(blockComment){if(ch==='*'&&next==='/'){blockComment=false;i++;}continue;}
  if(quote){if(escape){escape=false;continue;}if(ch==='\\'){escape=true;continue;}if(ch===quote)quote='';continue;}
  if(ch==='/'&&next==='/'){lineComment=true;i++;continue;}if(ch==='/'&&next==='*'){blockComment=true;i++;continue;}
  if(ch==="'"||ch==='"'||ch==='`'){quote=ch;continue;}
  if(ch==='{')depth++;if(ch==='}'&&--depth===0)return inlineScript.slice(open+1,i);
 }
 throw new Error('Unclosed function body: '+name);
}
function harness(state,weatherPenalty=()=>0){
 const logs=[];let draws=0;const gainFury=(n,r)=>{state.fury=(state.fury||0)+n;logs.push(r)},draw=n=>{draws+=n},log=m=>logs.push(m);
 const track=new Function('state','selected','gainFury','draw','log','return function(before,after){'+extractBody('trackCipherFury')+'}')(state,'mechanic',gainFury,draw,log);
 const activate=new Function('state','log','return function(){'+extractBody('activateGatePhase')+'}')(state,log);
 const use=new Function('state','selected','weatherDecodePenalty','trackCipherFury','log','activateGatePhase','render','return function(){'+extractBody('useSkill')+'}')(state,'mechanic',weatherPenalty,track,log,activate,()=>{});
 return {use,draws:()=>draws};
}
function fresh(overrides={}){return Object.assign({over:false,round:1,mechanicUses:2,energy:4,skillPoints:3,decodeActions:0,decodePenalty:0,decodePenaltyRound:0,gatePhase:false,fury:0,nextCipherFuryMilestone:25,nextEnergyMilestone:50,pendingDecodeEnergy:0,ciphers:Array.from({length:5},(_,i)=>({id:i+1,progress:0}))},overrides);}
{
 const s=fresh(),h=harness(s);h.use();h.use();
 assert.equal(s.mechanicUses,0);assert.equal(s.ciphers[0].progress,40);assert.equal(s.energy,4);assert.equal(s.decodeActions,0);
 h.use();assert.equal(s.ciphers[0].progress,40);
}
{
 const s=fresh({ciphers:[{id:1,progress:30},{id:2,progress:0},{id:3,progress:0},{id:4,progress:0},{id:5,progress:0}],nextCipherFuryMilestone:50,nextEnergyMilestone:50});
 harness(s).use();assert.equal(s.ciphers[0].progress,50);assert.equal(s.fury,1);assert.equal(s.pendingDecodeEnergy,1);
}
{
 const s=fresh({decodePenalty:5,decodePenaltyRound:1});harness(s,()=>5).use();assert.equal(s.ciphers[0].progress,10);
}
{
 const s=fresh({ciphers:[{id:1,progress:80},{id:2,progress:100},{id:3,progress:100},{id:4,progress:100},{id:5,progress:100}],nextCipherFuryMilestone:1000,nextEnergyMilestone:1000});
 const h=harness(s);h.use();assert.equal(s.ciphers[0].progress,100);assert.equal(h.draws(),1);assert.equal(s.gatePhase,true);assert.equal(s.mechanicUses,1);
}
{
 const s=fresh({controlTurns:1});harness(s).use();assert.equal(s.ciphers[0].progress,20);
}
console.log('Mechanic puppet lifecycle: 13 assertions PASS');
