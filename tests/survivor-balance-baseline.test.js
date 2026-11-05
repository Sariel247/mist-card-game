'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const LucaMechanics=require('../luca-mechanics.js');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
function extract(startMarker,endMarker){
 const start=html.indexOf(startMarker),end=html.indexOf(endMarker,start);
 assert(start>=0&&end>start,'live source boundary: '+startMarker);
 return html.slice(start,end);
}
const decodeSource=extract('function decode(){','\nfunction enemyTurn');
const lucaProgressSource=extract('function applyLucaCipherProgress(','\nfunction applyLucaGateProgress');
function runDecode(selected){
 const state={over:false,round:1,controlTurns:0,energy:4,decodeActions:0,decodePenalty:0,
  decodePenaltyRound:0,weather:'sun',ciphers:[{id:1,progress:0},{id:2,progress:0},{id:3,progress:0},{id:4,progress:0},{id:5,progress:0}],
  gates:[{progress:0},{progress:0}],gatePhase:false,nextCipherFuryMilestone:25,nextEnergyMilestone:50,
  pendingDecodeEnergy:0,damageDealt:0,lucaLink:selected==='luca'?LucaMechanics.createLink([{id:1,progress:0},{id:2,progress:0},{id:3,progress:0},{id:4,progress:0},{id:5,progress:0}]):null};
 const logs=[],fury=[];
 const trackCipherFury=(before,after)=>fury.push([before,after]);
 const applyLucaCipherProgress=new Function('state','selected','LucaMechanics','trackCipherFury','log',
  lucaProgressSource+'\nreturn applyLucaCipherProgress;')(state,selected,LucaMechanics,trackCipherFury,m=>logs.push(m));
 const activateGatePhase=()=>{if(state.ciphers.every(x=>x.progress>=100))state.gatePhase=true};
 const decode=new Function('state','selected','weatherDecodePenalty','applyLucaCipherProgress','trackCipherFury','log','activateGatePhase','render',
  decodeSource+'\nreturn decode;')(state,selected,()=>0,applyLucaCipherProgress,trackCipherFury,m=>logs.push(m),activateGatePhase,()=>{});
 decode();
 return {state,logs,fury};
}

// Identical first action, same weather and no penalties: the Thief gains five
// additional percentage points from the actual live decode function.
{
 const ordinary=runDecode('seer');
 const thief=runDecode('thief');
 assert.equal(ordinary.state.ciphers[0].progress,20);
 assert.equal(thief.state.ciphers[0].progress,25);
 assert.equal(ordinary.state.energy,3);
 assert.equal(thief.state.energy,3);
 assert.equal(ordinary.state.decodeActions,1);
 assert.equal(thief.state.decodeActions,1);
}

// Luca's first 20-point decode transfers 25% of actual progress to the linked
// peer and grants the first round charge. This is a separate benefit, not
// another 25 points on the source machine.
{
 const luca=runDecode('luca');
 assert.equal(luca.state.ciphers[0].progress,20);
 assert.equal(luca.state.ciphers[1].progress,5);
 assert.equal(luca.state.lucaLink.transferredThisRound,5);
 assert.equal(luca.state.lucaLink.charge,1);
 assert.equal(luca.state.energy,3);
}

// Mechanic's two puppet uses are covered by the existing live lifecycle suite;
// lock the balance baseline to the actual skill implementation as a guard
// against accidental changes to its per-use progress and resource costs.
{
 const source=extract('function useSkill(){','\nfunction damageHunter');
 assert.match(source,/state\.mechanicUses--/);
 assert.match(source,/const gain=Math\.max\(0,20-statuePenalty-coldPenalty\)/);
 assert.match(source,/state\.energy/);
 assert.match(source,/state\.decodeActions/);
 assert.match(source,/activateGatePhase\(\)/);
}
console.log('Survivor balance baseline: ordinary decode, Thief bonus, Luca transfer and Mechanic skill wiring PASS');
