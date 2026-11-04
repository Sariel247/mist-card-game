'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=(html.match(/<script>([\s\S]*?)<\/script>/)||[])[1];
assert(script,'inline script exists');
assert.doesNotThrow(()=>new vm.Script(script),'page inline JavaScript parses');
const deckSource=script.match(/const deck=(\[[\s\S]*?\]);\nconst difficulties=/);
assert(deckSource,'deck source found');
const deck=new Function('return '+deckSource[1])();
const playStart=script.indexOf('function play(i){');
const playEnd=script.indexOf('\nfunction triggerRandomEvent',playStart);
assert(playStart>=0&&playEnd>playStart,'play function boundaries found');
const playBody=script.slice(playStart+'function play(i){'.length,playEnd).replace(/\}\s*$/,'');
const supportedTypes=[...new Set([...playBody.matchAll(/case'([^']+)'/g)].map(m=>m[1]))];
const deckTypes=[...new Set(deck.map(c=>c.type))];
assert.deepEqual(deckTypes.sort(),supportedTypes.sort(),'every deck card type has exactly a play branch');
const makePlay=()=>new Function('state','selected','weatherDefs','weatherTier','weatherDecodePenalty','weatherPlayerAttackBonus','grantWeatherResource','grantWeatherShield','draw','damageHunter','log','trackCipherFury','activateGatePhase','check','render','return function(i){'+playBody+'}');
function fresh(card,overrides={}){
 return Object.assign({over:false,controlTurns:0,energy:20,skillPoints:20,hand:[{...card}],weather:'sun',round:1,hp:10,hero:{hp:24},shield:0,enemyHp:100,attackBonus:0,markedAttackHits:0,markedAttackBonus:0,markedWeakenHits:0,markedWeakenAmount:0,reflectDamage:0,reflectBonus:0,decodeBonus:0,shieldCounterDamage:0,weaken:0,playerGuardHits:0,hunterSkipAttack:0,decodePenalty:0,decodePenaltyRound:0,ciphers:Array.from({length:5},(_,i)=>({id:i+1,progress:0})),gates:[{progress:0},{progress:0}],gatePhase:card.type==='gate',weatherAttackResourceUsedRound:0,weatherDefenseResourceUsedRound:0,weatherDefenseUsedRound:0},overrides);
}
function run(state,index=0){
 const grantResource=(kind,n)=>{if(kind==='energy')state.energy+=n;else if(kind==='playerSkill')state.skillPoints=Math.min(6,state.skillPoints+n)};
 let draws=0;
 const fn=makePlay()(state,'seer',{autumn:{name:'落叶'},cold:{name:'寒潮'}},()=>1,()=>0,()=>0,grantResource,n=>state.shield+=n,n=>{draws+=n},n=>{state.enemyHp-=n;return n},()=>{},()=>{},()=>{},()=>{},()=>{});
 fn(index);return {draws:()=>draws};
}
let executed=0;
for(const card of deck){
 const state=fresh(card),result=run(state);
 assert.equal(state.hand.length,0,card.id+' is consumed on successful play');
 assert.equal(state.energy,20-card.cost+(['focus','overclock'].includes(card.type)?card.value:0),card.id+' energy accounting');
 assert.equal(state.skillPoints,20-card.skillCost,card.id+' skill-point accounting');
 executed++;
}
{
 const card=deck.find(c=>c.type==='attack'),state=fresh(card,{energy:0});
 run(state);assert.equal(state.hand.length,1);assert.equal(state.energy,0);
}
{
 const card=deck.find(c=>c.type==='attack'),state=fresh(card,{skillPoints:0});
 run(state);assert.equal(state.hand.length,1);assert.equal(state.skillPoints,0);
}
{
 const card=deck.find(c=>c.type==='attack'),state=fresh(card,{controlTurns:1});
 run(state);assert.equal(state.hand.length,1);assert.equal(state.energy,20);
}
{
 const card=deck.find(c=>c.type==='gate'),state=fresh(card,{gatePhase:false});
 run(state);assert.equal(state.hand.length,1);assert.equal(state.energy,20);
}
{
 const card=deck.find(c=>c.type==='gate'),state=fresh(card,{gatePhase:true,gates:[{progress:100},{progress:100}]});
 run(state);assert.equal(state.hand.length,1);assert.equal(state.energy,20);
}
{
 const card=deck.find(c=>c.type==='decode'),state=fresh(card,{ciphers:Array.from({length:5},()=>({progress:100}))});
 run(state);assert.equal(state.hand.length,1);assert.equal(state.energy,20);
}
{
 const state=fresh(deck[0]);run(state,99);assert.equal(state.hand.length,1);assert.equal(state.energy,20);
}
{
 const drawStart=script.indexOf('function draw(n=1){');
 const drawEnd=script.indexOf('\nfunction gainFury',drawStart);
 assert(drawStart>=0&&drawEnd>drawStart,'draw function boundaries found');
 const drawBody=script.slice(drawStart+'function draw(n=1){'.length,drawEnd).replace(/\}\s*$/,'');
 const state={deck:[],hand:[]};
 const drawCards=new Function('state','deck','shuffle','return function(n=1){'+drawBody+'}')(state,deck,items=>[...items]);
 drawCards(1);
 assert.equal(state.deck.length,47,'reshuffle restores 48 cards before drawing one');
 assert.equal(state.hand.length,1,'one requested card is drawn');
 const counts=new Map();
 [...state.deck,...state.hand].forEach(card=>counts.set(card.id,(counts.get(card.id)||0)+1));
 assert.equal(counts.size,24,'full reshuffled deck contains all 24 card types');
 assert([...counts.values()].every(count=>count===2),'full reshuffled deck preserves two copies of every card');
}
console.log('Card play transaction: '+executed+' card branches + 7 rejected-operation cases + 4 deck recycle assertions PASS');
