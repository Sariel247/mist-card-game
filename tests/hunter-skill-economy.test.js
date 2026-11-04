'use strict';
const assert = require('node:assert/strict');

// Deterministic upper-bound / cadence model for the hunter skill economy.
// Mirrors: initial 3 points, +2 each round, cap 6, one skill per round,
// cooldown ready when cooldownUntil <= current round.
function run({weatherBonus=0, rounds=12, costs=[2,2,3], cooldowns=[3,3,4]}) {
  let points=3, uses=0;
  const readyAt=[1,1,1], rows=[];
  for(let round=1; round<=rounds; round++) {
    const chosen=[0,1,2].find(i=>readyAt[i]<=round && points>=costs[i]);
    if(chosen!==undefined) {
      points-=costs[chosen];
      readyAt[chosen]=round+cooldowns[chosen]+1;
      uses++;
    }
    const before=points;
    points=Math.min(6,points+2+weatherBonus);
    rows.push({round,used:chosen===undefined?'-':String(chosen+1),spent:chosen===undefined?0:costs[chosen],beforeRegen:before,afterRegen:points});
  }
  return {uses,rows};
}
const base=run();
const fogGate=run({weatherBonus:2});
const coldGate=run({weatherBonus:2});
assert.equal(base.uses,8); // cooldowns, not resource income, limit this 12-round schedule
assert.equal(fogGate.uses,8);
assert.equal(coldGate.uses,8);
assert(base.rows.every(r=>r.afterRegen<=6));
assert(fogGate.rows.every(r=>r.afterRegen<=6));
assert(coldGate.rows.every(r=>r.afterRegen<=6));
console.log('Hunter skill cadence (12 rounds; costs 2/2/3, cooldowns 3/3/4)');
for(const [name,result] of [['normal',base],['fog gate',fogGate],['cold gate',coldGate]]) {
  console.log(name+': '+result.uses+' skill releases; final points '+result.rows.at(-1).afterRegen);
  console.log(result.rows.map(r=>'R'+r.round+': '+r.used+' (-'+r.spent+') '+r.beforeRegen+'->'+r.afterRegen).join(' | '));
}
console.log('PASS: deterministic hunter skill cadence assertions.');
