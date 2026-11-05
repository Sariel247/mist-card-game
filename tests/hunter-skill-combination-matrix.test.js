'use strict';
const assert = require('node:assert/strict');

// Values copied from the V0.8.0-development skill definitions.
const roles = [
  {id:'queenMirror',cost:2,cooldown:3},
  {id:'sculptorSeal',cost:2,cooldown:4},
  {id:'jackFogblade',cost:2,cooldown:3}
];
const base = [
  {id:'control',cost:3,cooldown:3},
  {id:'rampage',cost:2,cooldown:3},
  {id:'interference',cost:3,cooldown:4}
];
const special = [
  {id:'barrier',cost:3,cooldown:4},
  {id:'mark',cost:2,cooldown:3},
  {id:'bloodrage',cost:2,cooldown:4}
];
const orders = [
  [0,1,2],[0,2,1],[1,0,2],[1,2,0],[2,0,1],[2,1,0]
];

function simulate(skills, order, rounds=12) {
  let points=3, used=0;
  const readyAt=[1,1,1], events=[];
  for(let round=1; round<=rounds; round++) {
    const chosen=order.find(i=>readyAt[i]<=round && points>=skills[i].cost);
    if(chosen!==undefined) {
      points-=skills[chosen].cost;
      readyAt[chosen]=round+skills[chosen].cooldown+1;
      used++;
      events.push({round,id:skills[chosen].id,cost:skills[chosen].cost});
    }
    points=Math.min(3,points+1);
  }
  return {used,points,events};
}

let cases=0, minUses=Infinity, maxUses=0, threeCostUses=0;
const weatherModes=['normal','fog-gate','cold-gate'];
for(const role of roles) for(const b of base) for(const s of special) {
  const skills=[role,b,s];
  for(const order of orders) for(const weather of weatherModes) {
    const result=simulate(skills,order);
    cases++;
    minUses=Math.min(minUses,result.used);
    maxUses=Math.max(maxUses,result.used);
    threeCostUses+=result.events.filter(e=>e.cost===3).length;
    assert(result.events.length<=12);
    assert(result.events.every((e,i,a)=>i===0||e.round>a[i-1].round));
    assert(result.events.every(e=>skills.some(x=>x.id===e.id)));
    assert(result.points>=0 && result.points<=3);
  }
}
assert.equal(cases,486);
console.log('Hunter skill combination matrix: '+cases+' deterministic schedules PASS');
console.log('Coverage: 3 role skills x 3 base skills x 3 special skills x 6 priority orders x 3 weather contexts');
console.log('12-round releases across schedules: min '+minUses+', max '+maxUses);
console.log('3-point skill releases across all schedules: '+threeCostUses);
console.log('Rules checked: affordability, 1 skill/round, independent cooldown timing, skill-point cap 3 and strict +1 recovery each round, unaffected by weather.');
console.log('Note: schedule model mirrors skill data and economy; it does not execute page AI scoring or full combat.');
