'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const extract=(startMarker,endMarker)=>{
 const a=html.indexOf(startMarker),b=html.indexOf(endMarker,a);
 assert(a>=0&&b>a,'source function '+startMarker+' exists');
 return html.slice(a,b);
};
const useSkill=extract('function useSkill(){','\nfunction damageHunter');
const enemyTurn=extract('function enemyTurn(){','\nfunction decodeGate');
function makeState(overrides={}){
 return Object.assign({
  over:false,round:1,difficulty:{damage:2,roundDamage:0,gateBonus:0,interference:0,gateLoss:0},
  controlTurns:0,hunterReductionTurns:0,fury:0,gatePhase:false,gates:[{progress:0},{progress:0}],
  ciphers:Array.from({length:5},(_,i)=>({id:i+1,progress:0})),weather:'sun',energy:4,
  skillPoints:3,hunterSkillPoints:3,pendingDecodeEnergy:0,decodeActions:0,eventsTriggered:0,
  hp:18,shield:0,hero:{hp:24},hunterSkipAttack:0,playerGuardHits:0,hunterDamageBonus:0,
  hunterNextAttackReduction:0,weaken:0,markedWeakenHits:0,markedWeakenAmount:0,
  mercenaryGuardRound:0,hunterShieldPierce:0,doctorCooldown:0,doctorCooldownSetRound:0,
  weatherHunterFirstAttackRound:0,weatherDefenseUsedRound:0,weatherAttackUsedRound:0,
  weatherAttackResourceUsedRound:0,weatherDefenseResourceUsedRound:0,seerHitCount:0,
  perfumerArmed:false,perfumerUsed:false,mechanicUses:2,damageDealt:0,enemyHp:50,
  nextCipherFuryMilestone:25,decodePenalty:0,decodePenaltyRound:0
 },overrides);
}
function runtime(selected,state){
 const logs=[];
 const box={
  state,selected,logs,
  gainFury(){},chooseHunterSkill(){},weatherHunterDamageBonus(){return 0;},
  getExtraAttackChance(){return 0;},log(message){logs.push(message);},check(){},
  weatherTier(){return state.gatePhase?2:1;},triggerRandomEvent(){},draw(){},render(){},
  damageHunter(amount){state.damageDealt+=amount;state.enemyHp-=amount;return amount;},
  grantWeatherShield(amount){state.shield+=amount;},weatherDecodePenalty(){return 0;},
  trackCipherFury(){},activateGatePhase(){}
 };
 const context=vm.createContext(box);
 vm.runInContext('Math.random=()=>0.99;',context);
 vm.runInContext(useSkill,context);
 vm.runInContext(enemyTurn,context);
 return {context,box,logs};
}

// Seer: shield is awarded after every two received attacks, including hits
// that are fully absorbed by shield.
{
 const state=makeState({hp:20,shield:5});
 const r=runtime('seer',state);
 vm.runInContext('enemyTurn();',r.context);
 assert.equal(state.seerHitCount,1,'first hit increments seer counter');
 assert.equal(state.shield,3,'first hit consumes shield without health loss');
 // Reset the next-round state to isolate the second passive trigger.
 state.round=2;state.energy=4;state.skillPoints=3;state.hunterSkillPoints=3;
 vm.runInContext('enemyTurn();',r.context);
 assert.equal(state.seerHitCount,0,'counter resets after second hit');
 assert.equal(state.shield,4,'second hit consumes two shield, then the bird grants three more');
 assert(r.logs.some(x=>x.includes('役鸟守护')),'seer trigger is logged');
}

// Mercenary: the first attack each round is reduced by three, but a second
// fury attack in that same round is not reduced again.
{
 const state=makeState({hp:30,shield:0,fury:6,difficulty:{damage:6,roundDamage:0,gateBonus:0,interference:0,gateLoss:0}});
 const r=runtime('mercenary',state);
 vm.runInContext('enemyTurn();',r.context);
 assert.equal(state.hp,21,'first attack deals 3 and second attack deals full 6');
 assert.equal(state.mercenaryGuardRound,1,'guard is marked for the current round');
}

// Perfumer: rewind triggers only after health damage, restores up to four,
// and cannot be armed again after its one-time use.
{
 const state=makeState({hp:18,perfumerArmed:true});
 const r=runtime('perfumer',state);
 vm.runInContext('enemyTurn();',r.context);
 assert.equal(state.hp,20,'perfumer rewinds four of the two damage points');
 assert.equal(state.perfumerArmed,false,'armed fragrance is consumed');
 assert.equal(state.perfumerUsed,true,'one-time fragrance is recorded as used');
}

// Doctor: active heal is capped by max health and starts a two-full-round cooldown.
{
 const state=makeState({hp:21,doctorCooldown:0});
 const r=runtime('doctor',state);
 vm.runInContext('useSkill();',r.context);
 assert.equal(state.hp,24,'doctor heals only the missing three health');
 assert.equal(state.doctorCooldown,2,'doctor receives two full rounds of cooldown');
 assert.equal(state.doctorCooldownSetRound,1,'cooldown records the activation round');
 vm.runInContext('useSkill();',r.context);
 assert.equal(state.hp,24,'doctor cannot heal again while cooling down');
}

// Mechanic: puppet advances independently of energy and ordinary decode limit,
// and spends one of two match uses only when progress is actually made.
{
 const state=makeState({mechanicUses:2,energy:0,decodeActions:3,decodePenalty:20,decodePenaltyRound:1});
 const r=runtime('mechanic',state);
 vm.runInContext('useSkill();',r.context);
 assert.equal(state.ciphers[0].progress,0,'fully blocked puppet makes no progress');
 assert.equal(state.mechanicUses,2,'blocked puppet does not consume a use');
 state.decodePenalty=0;
 vm.runInContext('useSkill();',r.context);
 assert.equal(state.ciphers[0].progress,20,'puppet makes its full independent progress');
 assert.equal(state.mechanicUses,1,'successful puppet use consumes one match use');
 assert.equal(state.energy,0,'puppet does not consume survivor energy');
 assert.equal(state.decodeActions,3,'puppet does not consume ordinary decode actions');
}
console.log('Survivor passive runtime integration: Seer, Mercenary, Perfumer, Doctor and Mechanic PASS');
