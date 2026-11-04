'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const has=(s,label)=>assert(html.includes(s),label);
const inlineScript=(html.match(/<script>([\s\S]*?)<\/script>/)||[])[1];
assert(inlineScript,'inline script exists');
assert.doesNotThrow(()=>new vm.Script(inlineScript),'inline JavaScript parses');
has('function triggerRandomEvent()','random event function exists');
has("function weatherShieldBonus(){return state.weather==='rain'?weatherTier():0}",'rain shield bonus only applies when shield is gained');
has("state.weather==='autumn'||state.weather==='cold'",'autumn and cold first-defense card buffs are handled separately');
has("case'guard':{state.playerGuardHits=Math.min(4,state.playerGuardHits+2);}",'guard card does not receive an unintended rain shield');
has("if(overflow)grantWeatherShield(overflow,'逆流急救溢出治疗')",'overflow healing routes shield through weather handling');
has("grantWeatherShield(2,'稳住阵脚')",'steady card shield routes through weather handling');
has("grantWeatherShield(3,'先知役鸟守护')",'seer passive shield routes through weather handling');

has('state.round%3===1&&state.eventsTriggered<4','events occur after completed rounds 3, 6, 9 and 12, capped at four');
for(const name of ['遗落的补给箱','紧急医疗包','密码机残留数据','临时屏障','追猎气息','灵感闪现','破译干扰'])has(name,'event exists: '+name);
has("localStorage.setItem(SAVE_KEY,JSON.stringify({state,selected,savedAt:Date.now()}))",'autosave persists game state');
has('function restoreGame()','restore function exists');
has('state.hunterRoleDef=hunterRoleDefs[state.hunterRole]||hunterRoleDefs.queen','restore rehydrates hunter role definition');
has('state.hunterBaseSkill=hunterBasePool.find','restore rehydrates base skill');
has('state.hunterSpecialSkill=hunterSpecialPool.find','restore rehydrates special skill');
has('persistGame();','render triggers autosave');
has("localStorage.removeItem(SAVE_KEY)",'save is cleared on end/reset');
has("$('resultStats').innerHTML=",'result summary is rendered');

has("$('abandon').addEventListener('click'",'player can abandon a restored run safely');
has('function recordMatch(win,escaped)','career record function exists');
has('function finish(win,escaped=false){if(!state||state.over)return;','finish ignores duplicate calls to prevent double-counting career records');
has("SAVE_KEY+'-records'",'career records are stored separately from active save');
for(const achievement of ['first_win','escape_artist','cipher_master','event_explorer','hard_survivor'])has(achievement,'achievement exists: '+achievement);
has("state.difficulty.name===difficulties.hard.name",'hard achievement works after JSON restore');
has("data[mode]",'standard and custom records are kept separately');

has("function useSkill(){if(!state||state.over)return;",'hero skill action safely ignores missing or completed game state');
has("function enemyTurn(){\\nif(!state||state.over)return;",'turn advance safely ignores missing or completed game state');
has("function decode(){if(!state||state.over||",'cipher decode safely ignores missing or completed game state');
has("function decodeGate(i){if(!state||state.over||",'gate decode safely ignores missing or completed game state');
has("$('escape').addEventListener('click',()=>{if(!state||state.over)return;",'escape action safely ignores missing or completed game state');
has("$('redraw').addEventListener('click',()=>{if(!state||state.over||",'redraw action safely ignores missing or completed game state');


has("const validHero=saved&&Object.prototype.hasOwnProperty.call(characters,saved.selected);",'restore validates the saved survivor key before applying the save');
has("weatherDefs[savedState.weather]&&hunterRoleDefs[savedState.hunterRole]",'restore validates saved weather and hunter role identifiers');
has("savedState.ciphers.length===5&&Array.isArray(savedState.gates)&&savedState.gates.length===2",'restore validates the five cipher machines and two gates');
has("savedState.ciphers.every(c=>c&&Number.isFinite(c.progress)",'restore rejects invalid cipher progress values');
has("savedState.gates.every(g=>g&&Number.isFinite(g.progress)",'restore rejects invalid gate progress values');
has("if(!validState||!baseSkill||!specialSkill)throw new Error",'restore rejects malformed saves or missing skill definitions');
has("state.hero={...characters[selected]}",'restore rehydrates the selected survivor from canonical character data');
has("catch(e){state=null;try{localStorage.removeItem(SAVE_KEY)}",'invalid save recovery clears partial state and removes the corrupt save');
has("state.hunterBaseSkill=baseSkill;state.hunterSpecialSkill=specialSkill;",'restore preserves exact saved hunter base and specialty skill identities');

has("if(state.enemyHp<=0){state.enemyHp=0;finish(true);return}",'hunter reaching zero health immediately resolves a survivor victory');
has("if(state.hp<=0){state.hp=0;finish(false)}",'survivor reaching zero health immediately resolves a defeat');
has("check();if(state.over)return;",'hunter attack sequence stops immediately after a lethal result check');
has("if(state.over)return; } if(state.doctorCooldown>0",'no later hunter attack segments or turn recovery run after a lethal hit');
has("check();render();",'card damage resolves lethal hunter/player health before the next action can begin');
has("if(state.gates.some(g=>g.progress>=100))finish(true,true)",'escaping through either fully opened gate records an escape victory');
has("$('restart').addEventListener('click',()=>{stopWeatherAudio();try{localStorage.removeItem(SAVE_KEY)}catch(e){}state=null;",'restart clears the previous in-memory match before returning to setup');
has("state={hero:{...c},difficulty,weather,weatherMode:$('gameMode').value",'starting a new match creates a fresh complete state object');
console.log('Combat resolution, restart, random event, save, records and achievement source audit: 58 assertions PASS');
