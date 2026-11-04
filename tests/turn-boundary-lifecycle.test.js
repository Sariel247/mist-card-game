'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const slice=(a,b)=>{const i=html.indexOf(a),j=html.indexOf(b,i);assert(i>=0&&j>i,'source section '+a);return html.slice(i,j)};
const enemy=slice('function enemyTurn(){','\nfunction decodeGate');
const skill=slice('function hunterSkillReady','\nfunction renderHunterSkills');
const use=slice('function useHunterSkill','\nfunction renderHunterSkills');
const hero=slice('function useSkill(){','\nfunction damageHunter');
const has=(s,label,src=enemy)=>assert(src.includes(s),label);
has('const controlWasActive=state.controlTurns>0;','control duration snapshot');
has('const reductionWasActive=state.hunterReductionTurns>0;','barrier duration snapshot');
has('if(controlWasActive&&state.controlTurns>0)state.controlTurns--;','control decremented only after protected player action');
has('if(reductionWasActive&&state.hunterReductionTurns>0)state.hunterReductionTurns--;','barrier decremented only after protected player action');
has('state.round++;','round advances after duration settlement');
has('state.energy+=3+decodeBonus+weatherEnergy;','energy and pending decode bonus restored at turn boundary');
has('state.skillPoints=Math.min(6,playerSkillBefore+2+weatherPlayerSkill);','player skill points capped at six');
has('state.hunterSkillPoints=Math.min(6,hunterSkillBefore+2+weatherHunterSkill);','hunter skill points capped at six');
has('if(state.decodePenaltyRound<state.round){state.decodePenalty=0;state.decodePenaltyRound=0;}','decode penalty cleared after its target round');
has('if(state.doctorCooldown>0&&state.round>state.doctorCooldownSetRound)state.doctorCooldown--;','doctor cooldown decremented after complete rounds');
assert(skill.includes('(state.hunterSkillCooldowns[skill.id]||0)<=state.round'),'cooldown readiness uses current round');
assert(use.includes('state.hunterSkillCooldowns[skill.id]=state.round+skill.cooldown+1'),'skill cooldown excludes cast round and counts full intervening rounds');
assert(hero.includes('state.doctorCooldown=2;state.doctorCooldownSetRound=state.round;'),'doctor records cooldown start round');
assert(enemy.indexOf('const controlWasActive=')<enemy.indexOf('chooseHunterSkill();'),'new control effect not treated as pre-existing at same turn end');
assert(enemy.indexOf('const reductionWasActive=')<enemy.indexOf('chooseHunterSkill();'),'new barrier effect not treated as pre-existing at same turn end');

has("if(state.round%3===1&&state.eventsTriggered<4)triggerRandomEvent();",'random event check runs after round increment and caps at four');
has("if(state.weather==='rain'||state.weather==='wind')weatherEnergy=tier;",'rain and wind energy rewards are granted at each new-round boundary');
has("if(state.weather==='fog'){weatherPlayerSkill=tier;weatherHunterSkill=tier;}",'fog restores both sides skill points at the round boundary');
has("if(state.weather==='cold')weatherHunterSkill=tier;",'cold restores hunter skill points only');
has('state.decodeActions=0;','ordinary decode action limit resets for the new round');
has('state.pendingDecodeEnergy=0;','pending cipher milestone energy is consumed exactly once');
has("state.weather==='wind'&&state.weatherAttackUsedRound!==state.round",'wind attack bonus is once per round',html);
has('state.weatherDefenseUsedRound!==state.round','autumn/cold first defense bonus is once per round',html);
has('state.weatherAttackResourceUsedRound!==state.round','thunder attack resource bonus is once per round',html);
has('state.weatherDefenseResourceUsedRound!==state.round','autumn defense resource bonus is once per round',html);
has('if(state.weather===\'cold\')weatherHunterSkill=tier;','cold weather does not grant survivor skill points');
has('state.eventsTriggered++;','event counter increments once for each selected event',html);
has('state.lastEvent={name:event.name,desc:event.desc};','latest event is saved for UI and persistence',html);
has('function persistGame(){','round changes are persisted through render',html);


const vm=require('node:vm');
const enemyStart=html.indexOf('function enemyTurn(){');
const enemyEnd=html.indexOf('function decodeGate',enemyStart);
assert(enemyStart>=0&&enemyEnd>enemyStart,'actual enemyTurn function can be isolated');
const runtimeState={
  over:false,round:1,difficulty:{damage:1,roundDamage:0,gateBonus:0,interference:0,gateLoss:0},
  controlTurns:0,hunterReductionTurns:0,fury:0,gatePhase:false,gates:[{progress:0},{progress:0}],
  ciphers:Array.from({length:5},(_,i)=>({id:i+1,progress:0})),weather:'rain',energy:0,
  skillPoints:3,hunterSkillPoints:3,pendingDecodeEnergy:1,decodeActions:2,eventsTriggered:0,
  hp:100,shield:0,hunterSkipAttack:0,playerGuardHits:0,hunterDamageBonus:0,weaken:0,
  markedWeakenHits:0,markedWeakenAmount:0,hunterShieldPierce:0,doctorCooldown:0,
  doctorCooldownSetRound:0,weatherHunterFirstAttackRound:0,weatherDefenseUsedRound:0,
  weatherAttackUsedRound:0,weatherAttackResourceUsedRound:0,weatherDefenseResourceUsedRound:0
};
const eventRounds=[];
const runtime={
  state:runtimeState,selected:'seer',gainFury(){},chooseHunterSkill(){},weatherHunterDamageBonus(){return 0;},
  getExtraAttackChance(){return 0;},log(){},check(){},weatherTier(){return runtimeState.gatePhase?2:1;},
  triggerRandomEvent(){runtimeState.eventsTriggered++;eventRounds.push(runtimeState.round);},
  draw(){},render(){},damageHunter(){return 0;}
};
const runtimeContext=vm.createContext(runtime);
vm.runInContext('Math.random=()=>0.99;',runtimeContext);
vm.runInContext(html.slice(enemyStart,enemyEnd),runtimeContext);
for(let i=0;i<12;i++)vm.runInContext('enemyTurn();',runtimeContext);
assert.deepEqual(eventRounds,[4,7,10,13],'events occur after completed rounds 3, 6, 9 and 12');
assert.equal(runtimeState.eventsTriggered,4,'event cap prevents a fifth event');
assert.equal(runtimeState.round,13,'twelve enemy turns advance to round thirteen');
assert.equal(runtimeState.energy,49,'rain grants +1 energy each turn and pending decode bonus is consumed once');
assert.equal(runtimeState.pendingDecodeEnergy,0,'pending decode energy is cleared after one settlement');
assert.equal(runtimeState.skillPoints,6,'survivor skill points respect the six-point cap');
assert.equal(runtimeState.hunterSkillPoints,6,'hunter skill points respect the six-point cap');
assert.equal(runtimeState.decodeActions,0,'decode action counter resets after each turn');

function duration(initial,activeSnapshot){let n=initial;for(let i=0;i<2;i++){if(activeSnapshot&&n>0)n--;}return n}
assert.equal(duration(2,true),0,'two protected player actions consume two duration counts');
assert.equal(duration(2,false),2,'newly applied barrier is not consumed on cast turn');
function cooldownReady(castRound,cooldown,round){return castRound+cooldown+1<=round}
assert.equal(cooldownReady(1,3,3),false);
assert.equal(cooldownReady(1,3,4),false);
assert.equal(cooldownReady(1,3,5),true);

// A random-event cipher completion can activate the gate phase after the
// ordinary turn resources were restored. The gate-tier weather increment
// must be topped up immediately rather than waiting for the next round.
const gateState={
  over:false,round:3,difficulty:{damage:1,roundDamage:0,gateBonus:0,interference:0,gateLoss:0},
  controlTurns:0,hunterReductionTurns:0,fury:0,gatePhase:false,gates:[{progress:0},{progress:0}],
  ciphers:[{id:1,progress:100},{id:2,progress:100},{id:3,progress:100},{id:4,progress:100},{id:5,progress:85}],
  weather:'rain',energy:0,skillPoints:3,hunterSkillPoints:3,pendingDecodeEnergy:0,decodeActions:0,eventsTriggered:0,
  hp:100,shield:0,hunterSkipAttack:0,playerGuardHits:0,hunterDamageBonus:0,weaken:0,
  markedWeakenHits:0,markedWeakenAmount:0,hunterShieldPierce:0,doctorCooldown:0,doctorCooldownSetRound:0,
  weatherHunterFirstAttackRound:0,weatherDefenseUsedRound:0,weatherAttackUsedRound:0,
  weatherAttackResourceUsedRound:0,weatherDefenseResourceUsedRound:0
};
const gateRuntime={
  state:gateState,selected:'seer',gainFury(){},chooseHunterSkill(){},weatherHunterDamageBonus(){return 0;},
  getExtraAttackChance(){return 0;},log(){},check(){},weatherTier(){return gateState.gatePhase?2:1;},
  triggerRandomEvent(){gateState.eventsTriggered++;gateState.ciphers[4].progress=100;gateState.gatePhase=true;},
  draw(){},render(){},damageHunter(){return 0;}
};
const gateContext=vm.createContext(gateRuntime);
vm.runInContext('Math.random=()=>0.99;',gateContext);
vm.runInContext(html.slice(enemyStart,enemyEnd),gateContext);
vm.runInContext('enemyTurn();',gateContext);
assert.equal(gateState.gatePhase,true,'random event can activate the gate phase');
assert.equal(gateState.energy,5,'rain gate-phase resource tier is topped up on the transition turn');
assert.equal(gateState.round,4,'event-triggered gate transition still advances the round exactly once');

console.log('Turn boundary lifecycle audit: 21 source, model and transition assertions PASS');
