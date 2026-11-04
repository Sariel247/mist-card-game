'use strict';
const assert = require('node:assert/strict');

// Boundary model mirrors the hunter AI score guards in index.html.
function sculptorSealScore(gatePhase,ciphers) {
  return gatePhase ? 0 : ciphers.some(c=>c.progress>=50&&c.progress<100) ? 9 : 5;
}
function interferenceScore(ciphers) {
  return ciphers.some(c=>c.progress>=35&&c.progress<100) ? 9 : 3;
}
const allDone=[0,1,2,3,4].map(()=>({progress:100}));
const early=[{progress:20},{progress:0},{progress:0},{progress:0},{progress:0}];
const target35=[{progress:35},{progress:0},{progress:0},{progress:0},{progress:0}];
const target50=[{progress:50},{progress:0},{progress:0},{progress:0},{progress:0}];
const nearDone=[{progress:95},{progress:0},{progress:0},{progress:0},{progress:0}];

assert.equal(sculptorSealScore(true,allDone),0,'sculptor seal must not be selected after gate phase begins');
assert.equal(interferenceScore(allDone),3,'interference must not target an all-completed cipher set');
assert.equal(sculptorSealScore(false,early),5,'sculptor seal remains a low-priority usable option before gate phase');
assert.equal(sculptorSealScore(false,target50),9,'sculptor seal prioritizes a meaningful unfinished cipher window');
assert.equal(interferenceScore(target35),9,'interference prioritizes an unfinished cipher at/above 35%');
assert.equal(interferenceScore(nearDone),9,'interference can target a nearly completed but unfinished cipher');
assert.equal(interferenceScore([{progress:100},{progress:34},{progress:0},{progress:0},{progress:0}]),3);
console.log('Hunter AI score boundary checks: 7 assertions PASS');
