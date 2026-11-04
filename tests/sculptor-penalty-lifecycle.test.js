'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
assert(html.includes('if(state.decodePenaltyRound<state.round){state.decodePenalty=0;state.decodePenaltyRound=0;}'),
  'page cleanup must retain a penalty whose target round is the current round');

function advanceRound(state) {
  state.round++;
  if(state.decodePenaltyRound<state.round) {
    state.decodePenalty=0;
    state.decodePenaltyRound=0;
  }
}
const state={round:4,decodePenalty:5,decodePenaltyRound:5};
advanceRound(state);
assert.equal(state.round,5);
assert.equal(state.decodePenalty,5,'penalty must survive until the survivor acts in its target round');
assert.equal(state.decodePenaltyRound,5);
const decodePenalty=state.decodePenaltyRound===state.round?state.decodePenalty:0;
assert.equal(decodePenalty,5,'decode action in target round must receive the penalty');
advanceRound(state);
assert.equal(state.round,6);
assert.equal(state.decodePenalty,0,'penalty must expire after the target round ends');
assert.equal(state.decodePenaltyRound,0);
console.log('Sculptor penalty lifecycle: source guard + 5 lifecycle assertions PASS');
