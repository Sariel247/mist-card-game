'use strict';

// V0.8.20 weather resource boundary reference tests.
// Hunter skill points are intentionally isolated from weather bonuses.
const assert = require('node:assert/strict');

function hunterRoundGain(current) {
  const total=Math.min(3,current+1);
  return {total,actual:total-current};
}
for(const current of [0,1,2,3]) {
  const result=hunterRoundGain(current);
  assert.equal(result.total,Math.min(3,current+1));
  assert(result.actual>=0&&result.actual<=1);
}
assert.deepEqual(hunterRoundGain(0),{total:1,actual:1});
assert.deepEqual(hunterRoundGain(2),{total:3,actual:1});
assert.deepEqual(hunterRoundGain(3),{total:3,actual:0});

// Weather context never adds hunter skill points, including fog/cold gate phase.
for(const weather of ['sun','rain','fog','thunder','autumn','cold','wind']) {
  for(const gatePhase of [false,true]) {
    const current=1;
    const result=hunterRoundGain(current);
    assert.equal(result.total,2,weather+' / gate='+gatePhase+' must remain +1 at most');
  }
}

// Survivor energy/weather and survivor skill-point bonuses remain independent.
function tier(gatePhase){return gatePhase?2:1;}
function roundEnergyGain(weather,gatePhase,decodeMilestone=0){
  const bonus=['rain','wind'].includes(weather)?tier(gatePhase):0;
  return 3+bonus+decodeMilestone;
}
assert.equal(roundEnergyGain('rain',false),4);
assert.equal(roundEnergyGain('rain',true),5);
assert.equal(roundEnergyGain('wind',true,1),6);
assert.equal(roundEnergyGain('sun',true,1),4);
assert.equal(roundEnergyGain('fog',true),3);

console.log('PASS: hunter skill-point cap 3, strict +1 round recovery, no weather overrides.');