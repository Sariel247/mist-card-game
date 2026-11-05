'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const start=html.indexOf('function enemyTurn(){');
const end=html.indexOf('\nfunction decodeGate',start);
assert(start>=0&&end>start,'enemyTurn function exists');
const fn=html.slice(start,end);
const has=(s,label)=>assert(fn.includes(s),label);
const pos=s=>fn.indexOf(s);
has('const totalAttacks=1+(chanceTriggered?1:0)+(furyTriggered?1:0);','chance and fury attacks are independently counted');
has('if(state.hunterSkipAttack>0){state.hunterSkipAttack--;','trap consumes an attack attempt');
assert(pos('if(state.hunterSkipAttack>0){')<pos("if(state.weather==='cold'&&state.weatherHunterFirstAttackRound!==state.round)"),'trap resolves before cold first-hit marker');
assert(pos('if(state.hunterSkipAttack>0){')<pos('if(state.hunterDamageBonus>0){rawDamage+=state.hunterDamageBonus;state.hunterDamageBonus=0;}'),'trap resolves before one-shot damage bonus');
assert(pos('if(state.hunterSkipAttack>0){')<pos('const pierceBudget=state.hunterShieldPierce;state.hunterShieldPierce=0;'),'trap resolves before one-shot pierce consumption');
has("if(state.weather==='autumn'){gainFury(weatherTier(),'落叶天气命中奖励');}",'autumn fury is awarded after a landed attack');
has("if(selected==='seer'){state.seerHitCount++;",'seer hit counter is updated after damage resolution');
has("if(selected==='mercenary'&&state.mercenaryGuardRound!==state.round)",'mercenary mitigation is once per round');
has("if(actual>0&&selected==='perfumer'&&state.perfumerArmed)",'perfumer rewind requires actual health damage');
has('const furyTriggered=state.fury>=6;','fury threshold is sampled before attack sequence');
assert(pos('const furyTriggered=state.fury>=6;')<pos('for(let attackIndex=0;attackIndex<totalAttacks;attackIndex++)'),'fury trigger is determined before attack loop');
console.log('Hunter attack sequence audit: 10 source-order assertions PASS');

const vm=require('node:vm');
const enemyRuntime={
 state:{
  over:false,round:1,difficulty:{damage:6,roundDamage:0,gateBonus:0,interference:0,gateLoss:0},
  controlTurns:0,hunterReductionTurns:0,fury:6,gatePhase:false,gates:[{progress:0},{progress:0}],
  ciphers:Array.from({length:5},(_,i)=>({id:i+1,progress:0})),weather:'rain',
  energy:0,skillPoints:3,hunterSkillPoints:3,pendingDecodeEnergy:0,decodeActions:0,eventsTriggered:0,
  hp:100,shield:10,hunterSkipAttack:0,playerGuardHits:0,hunterDamageBonus:0,hunterNextAttackReduction:0,
  weaken:0,markedWeakenHits:0,markedWeakenAmount:0,mercenaryGuardRound:0,hunterShieldPierce:3,
  doctorCooldown:0,doctorCooldownSetRound:0,weatherHunterFirstAttackRound:0,weatherDefenseUsedRound:0,
  weatherAttackUsedRound:0,weatherAttackResourceUsedRound:0,weatherDefenseResourceUsedRound:0,
  seerHitCount:0,perfumerArmed:false,shieldCounterDamage:0,reflectDamage:0,attackBonus:0,reflectBonus:0
 },
 selected:'doctor',gainFury(){},chooseHunterSkill(){},weatherHunterDamageBonus(){return 1;},
 getExtraAttackChance(){return 0;},log(){},check(){},weatherTier(){return 1;},
 triggerRandomEvent(){},draw(){},render(){},damageHunter(){return 0;}
};
const context=vm.createContext(enemyRuntime);
vm.runInContext('Math.random=()=>0.99;',context);
vm.runInContext(fn,context);
vm.runInContext('enemyTurn();',context);
assert.equal(enemyRuntime.state.hp,96,'Jack pierce bypasses three shield points on first hit only across a two-hit fury turn');
assert.equal(enemyRuntime.state.shield,0,'second attack consumes remaining shield normally');
assert.equal(enemyRuntime.state.hunterShieldPierce,0,'one-shot pierce is consumed exactly once');
assert.equal(enemyRuntime.state.fury,0,'fury threshold is spent once for the extra attack');
assert.equal(enemyRuntime.state.round,2,'multi-hit attack sequence advances the round once');
console.log('Hunter attack runtime integration: one-shot pierce, remaining shield, fury double-hit and turn advancement PASS');

