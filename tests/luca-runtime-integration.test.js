'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const Luca = require('../luca-mechanics.js');

function extractFunction(name) {
  const marker = 'function ' + name + '(';
  const start = html.indexOf(marker);
  assert(start >= 0, name + ' exists in the live page');
  const next = html.indexOf('\nfunction ', start + marker.length);
  const end = next < 0 ? html.indexOf('\n}', start) + 2 : html.lastIndexOf('\n}', next) + 2;
  assert(end > start, name + ' function boundary found');
  return html.slice(start, end);
}
function buildProgressFunction(name, state, selected, events) {
  const source = extractFunction(name);
  return new Function('state', 'selected', 'LucaMechanics', 'trackCipherFury', 'log',
    source + '\nreturn ' + name + ';'
  )(state, selected, Luca, (before, after) => events.fury.push([before, after]), message => events.logs.push(message));
}

{
  const state = {
    round: 1,
    ciphers: [{id:1,progress:20},{id:2,progress:0},{id:3,progress:0},{id:4,progress:0},{id:5,progress:0}],
    lucaLink: Luca.createLink([{id:1,progress:20},{id:2,progress:0},{id:3,progress:0},{id:4,progress:0},{id:5,progress:0}])
  };
  const events = {fury:[],logs:[]};
  const apply = buildProgressFunction('applyLucaCipherProgress', state, 'luca', events);
  const result = apply(state.ciphers[1], 20);
  assert.equal(result.after, 20);
  assert.equal(state.ciphers[2].progress, 5, '20% source gain transfers 5% to the lowest-progress linked peer');
  assert.equal(state.lucaLink.transferredThisRound, 5);
  assert.equal(state.lucaLink.charge, 1);
  assert.equal(events.fury.length, 2, 'source and transferred progress both update cipher fury milestones');
  assert.equal(events.logs.length, 1);
  apply(state.ciphers[1], 20);
  assert.equal(state.lucaLink.charge, 1, 'multiple transfers in one round grant only one charge');
  assert.equal(state.lucaLink.transferredThisRound, 10);
}
{
  const state = {
    round: 2,
    ciphers: [{id:1,progress:95},{id:2,progress:80},{id:3,progress:0},{id:4,progress:0},{id:5,progress:0}],
    lucaLink: {a:1,b:2,gateMode:false,transferredThisRound:0,charge:2,chargedRound:1,reconnectPending:false}
  };
  const events = {fury:[],logs:[]};
  const apply = buildProgressFunction('applyLucaCipherProgress', state, 'luca', events);
  apply(state.ciphers[1], 20);
  assert.equal(state.ciphers[1].progress, 100);
  assert.equal(state.ciphers[0].progress, 100, 'peer transfer is capped at 100%');
  assert.equal(state.lucaLink.reconnectPending, true, 'completing either endpoint schedules next-round reconnect');
}
{
  const state = {
    round: 3,
    gates: [{progress:0},{progress:90}],
    lucaLink: {a:0,b:1,gateMode:true,transferredThisRound:0,charge:0,chargedRound:0,reconnectPending:false}
  };
  const events = {fury:[],logs:[]};
  const apply = buildProgressFunction('applyLucaGateProgress', state, 'luca', events);
  apply(state.gates[0], 40);
  assert.equal(state.gates[0].progress, 40);
  assert.equal(state.gates[1].progress, 100, 'gate transfer is capped at the remaining 10%');
  assert.equal(state.lucaLink.transferredThisRound, 10);
  assert.equal(state.lucaLink.charge, 1);
  assert.equal(state.lucaLink.reconnectPending, true);
}
{
  const page = extractFunction('useSkill');
  assert.match(page, /transferredThisRound>=.*gateMode/);
  assert(page.includes('damageHunter(5+bonus)'));
  assert(page.includes('hunterNextAttackReduction=2'));
  assert(html.includes("selected==='luca'?applyLucaCipherProgress"));
  assert(html.includes("if(selected==='luca')applyLucaGateProgress"));
  assert(html.includes('id="lucaPanel"'));
}
console.log('Luca live-runtime integration: cipher transfer, gate transfer, charge limits, completion reconnect, and Strong Current wiring PASS.');
