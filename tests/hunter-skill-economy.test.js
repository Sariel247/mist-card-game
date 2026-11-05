'use strict';
const assert = require('node:assert/strict');

// Mirrors V0.8.20: initial 3 points, +1 each round, cap 3,
// no hunter skill-point weather bonuses, and at most one skill per round.
function run({rounds=12,costs=[2,2,3],cooldowns=[3,3,4]}={}) {
  let points=3,uses=0;
  const readyAt=[1,1,1],rows=[];
  for(let round=1;round<=rounds;round++) {
    const chosen=[0,1,2].find(i=>readyAt[i]<=round&&points>=costs[i]);
    if(chosen!==undefined) {
      points-=costs[chosen];
      readyAt[chosen]=round+cooldowns[chosen]+1;
      uses++;
    }
    const before=points;
    points=Math.min(3,points+1);
    rows.push({round,used:chosen===undefined?'-':String(chosen+1),spent:chosen===undefined?0:costs[chosen],beforeRegen:before,afterRegen:points});
  }
  return {uses,rows};
}
const base=run();
assert.equal(base.uses,6);
assert(base.rows.every(r=>r.afterRegen<=3));
assert(base.rows.every(r=>r.afterRegen-r.beforeRegen<=1));
console.log('Hunter skill cadence (12 rounds; costs 2/2/3, cooldowns 3/3/4)');
console.log(base.uses+' skill releases; final points '+base.rows.at(-1).afterRegen);
console.log(base.rows.map(r=>'R'+r.round+': '+r.used+' (-'+r.spent+') '+r.beforeRegen+'->'+r.afterRegen).join(' | '));
console.log('PASS: 3-point cap and strict +1-per-round recovery.');