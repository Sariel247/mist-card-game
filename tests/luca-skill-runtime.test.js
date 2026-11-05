'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const skillStart = html.indexOf('function useSkill()');
const skillEnd = html.indexOf('function damageHunter(', skillStart);
assert(skillStart >= 0 && skillEnd > skillStart, 'live useSkill function boundaries found');
const source = html.slice(skillStart, skillEnd);
function invoke(state) {
  const logs = [];
  let renders = 0;
  const damageHunter = amount => { state.enemyHp -= amount; return amount; };
  const run = new Function('state','selected','damageHunter','log','render', source + '\nreturn useSkill;')
    (state,'luca',damageHunter,message=>logs.push(message),()=>renders++);
  run();
  return {logs,renders};
}
const ready = {round:4,controlTurns:0,lucaLink:{charge:3,skillUsedRound:0,transferredThisRound:15,gateMode:false},enemyHp:30,hunterNextAttackReduction:0};
const used = invoke(ready);
assert.equal(ready.enemyHp,22,'Strong Current deals 8 damage after reaching the cipher transfer threshold');
assert.equal(ready.lucaLink.charge,0,'Strong Current spends exactly 3 stored charge');
assert.equal(ready.lucaLink.skillUsedRound,4,'Strong Current records the current round');
assert.equal(ready.hunterNextAttackReduction,2,'Strong Current weakens the next hunter attack by 2');
assert.equal(used.renders,1);
const afterUse = invoke(ready);
assert.equal(ready.enemyHp,22,'Strong Current cannot be used twice in one round');
assert.equal(afterUse.renders,0);
const controlled = {round:5,controlTurns:1,lucaLink:{charge:3,skillUsedRound:0,transferredThisRound:20,gateMode:false},enemyHp:30,hunterNextAttackReduction:0};
invoke(controlled);
assert.equal(controlled.lucaLink.charge,3,'control prevents Strong Current without spending charge');
assert.equal(controlled.enemyHp,30);
const gate = {round:6,controlTurns:0,lucaLink:{charge:3,skillUsedRound:0,transferredThisRound:10,gateMode:true},enemyHp:30,hunterNextAttackReduction:0};
invoke(gate);
assert.equal(gate.enemyHp,22,'gate-phase threshold uses 10% transfer and grants the 3 damage bonus');
console.log('Luca Strong Current live runtime: threshold bonus, charge payment, once-per-round limit, control lock, and gate threshold PASS.');
