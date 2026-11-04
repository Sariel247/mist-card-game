'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
assert(html.includes('const reductionWasActive=state.hunterReductionTurns>0;'),
  'enemy turn must snapshot whether barrier was active before the hunter chooses a new skill');
assert(html.includes('if(reductionWasActive&&state.hunterReductionTurns>0)state.hunterReductionTurns--;'),
  'barrier duration must decrement only after a previously active survivor turn');

function enemyTurnEnd(state,reductionWasActive) {
  if(reductionWasActive&&state.hunterReductionTurns>0) state.hunterReductionTurns--;
}
const state={hunterReductionTurns:0};
// Barrier is activated during this enemy turn. It must not lose a turn immediately.
state.hunterReductionTurns=2;
enemyTurnEnd(state,false);
assert.equal(state.hunterReductionTurns,2);
// First protected survivor turn ends.
enemyTurnEnd(state,true);
assert.equal(state.hunterReductionTurns,1);
// Second protected survivor turn ends.
enemyTurnEnd(state,true);
assert.equal(state.hunterReductionTurns,0);
console.log('Hunter barrier duration: source guards + 3 lifecycle assertions PASS');
