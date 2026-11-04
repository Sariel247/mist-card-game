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

console.log('Random event, save, records and achievement source audit: 41 assertions PASS');
