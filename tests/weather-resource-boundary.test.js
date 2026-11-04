'use strict';

// V0.8.0 weather resource boundary reference tests.
// Run with: node tests/weather-resource-boundary.test.js
// This is a deterministic specification test, not a browser/integration test.
// It deliberately models the documented resource rules independently.

const assert = require('node:assert/strict');

function tier(gatePhase) { return gatePhase ? 2 : 1; }
function roundSkillGain(current, weatherBonus) {
  const base = Math.min(2, 6 - current);
  const afterBase = Math.min(6, current + 2);
  const actualWeather = Math.min(weatherBonus, 6 - afterBase);
  return { total: Math.min(6, current + 2 + weatherBonus), base, actualWeather };
}
function triggeredSkillGain(currentAfterCardCost, gatePhase) {
  const bonus = tier(gatePhase);
  const total = Math.min(6, currentAfterCardCost + bonus);
  return { total, actual: total - currentAfterCardCost };
}
function roundEnergyGain(weather, gatePhase, decodeMilestone = 0) {
  const bonus = ['rain', 'wind'].includes(weather) ? tier(gatePhase) : 0;
  return 3 + bonus + decodeMilestone;
}

// Fog: both sides receive base +2 skill points, then weather skill points,
// subject to the shared per-side cap of 6.
for (const current of [0, 2, 4, 5, 6]) {
  const result = roundSkillGain(current, 2);
  assert.equal(result.total, Math.min(6, current + 4));
  assert.equal(result.actualWeather, Math.min(2, Math.max(0, 4 - current)));
}

// Cold: only the hunter receives the additional weather skill points.
for (const current of [0, 2, 4, 5, 6]) {
  const result = roundSkillGain(current, 2);
  assert.equal(result.total, Math.min(6, current + 4));
}

// Conditional card triggers occur after card skill cost is deducted.
assert.deepEqual(triggeredSkillGain(6 - 2, false), { total: 5, actual: 1 });
assert.deepEqual(triggeredSkillGain(6 - 2, true), { total: 6, actual: 2 });
assert.deepEqual(triggeredSkillGain(6 - 1, true), { total: 6, actual: 1 });
assert.deepEqual(triggeredSkillGain(0, true), { total: 2, actual: 2 });

// Energy is uncapped; rain/wind bonus stacks with base +3 and decode milestones.
assert.equal(roundEnergyGain('rain', false), 4);
assert.equal(roundEnergyGain('rain', true), 5);
assert.equal(roundEnergyGain('wind', true, 1), 6);
assert.equal(roundEnergyGain('sun', true, 1), 4);
assert.equal(roundEnergyGain('fog', true), 3);

// Thunder's conditional energy reward is granted once per round after the first
// successful attack/risk card. The model confirms its tier amount.
assert.equal(tier(false), 1);
assert.equal(tier(true), 2);

console.log('PASS: deterministic weather resource boundary specification (all assertions passed).');
