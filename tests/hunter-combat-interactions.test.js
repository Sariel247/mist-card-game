'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=(html.match(/<script>([\\s\\S]*?)<\\/script>/)||[])[1];
assert(script,'live page script exists');

const has=(snippet,label)=>assert(html.includes(snippet),label);
has("case'queenMirror':state.hunterDamageBonus+=3;break;","queen bonus");
has("case'jackFogblade':state.hunterShieldPierce+=3;break;","jack pierce");
has("if(state.weather==='wind')state.hunterDamageBonus+=weatherTier();","wind bonus");
has("if(state.weather==='rain'||state.weather==='thunder')return weatherTier();","rain/thunder bonus");
has("const pierced=Math.min(pierceBudget,state.shield,dmg);","bounded pierce");
has("const blocked=Math.min(state.shield,remainingDamage);state.shield-=blocked;","shield consumption");
has("function damageHunter(amount){const reduced=state.hunterReductionTurns>0?Math.round(amount*0.7):amount;","shared damage reduction");
has("const reflectWeather=state.weather==='thunder'?weatherTier():0;const dealt=damageHunter(reflected+reflectWeather);","thunder retaliation");
has("const counterWeather=state.weather==='thunder'?weatherTier():0;const dealt=damageHunter(counter+counterWeather);","thunder mirror");
has("if(blocked>0&&state.shieldCounterDamage>0)","mirror trigger");
has("if(state.reflectDamage>0){const insight=state.attackBonus||0;const resonance=state.reflectBonus||0;","retaliation stacking");
has("if(state.hunterSkipAttack>0){state.hunterSkipAttack--;","trap before one-shot consume");
function hit({damage,shield,pierce=0}){const pierced=Math.min(pierce,shield,damage);const remaining=damage-pierced;const blocked=Math.min(shield,remaining);return{pierced,blocked,shieldLeft:shield-blocked,hpLoss:pierced+remaining-blocked};}
assert.deepEqual(hit({damage:8,shield:5,pierce:3}),{pierced:3,blocked:5,shieldLeft:0,hpLoss:3});
assert.deepEqual(hit({damage:8,shield:2,pierce:3}),{pierced:2,blocked:2,shieldLeft:0,hpLoss:6});
assert.deepEqual(hit({damage:2,shield:5,pierce:3}),{pierced:2,blocked:0,shieldLeft:5,hpLoss:2});
assert.deepEqual(hit({damage:4,shield:5}),{pierced:0,blocked:4,shieldLeft:1,hpLoss:0});
const reduced=(n,barrier)=>barrier?Math.round(n*.7):n;
assert.equal(reduced(10,true),7);assert.equal(reduced(5,true),4);assert.equal(reduced(3,false),3);

function extractFunction(name){
 const start=script.indexOf('function '+name+'(');assert(start>=0,'live function exists: '+name);
 const open=script.indexOf('{',start);let depth=0,quote='',escape=false,line=false,block=false;
 for(let i=open;i<script.length;i++){const ch=script[i],next=script[i+1];
  if(line){if(ch==='\\n')line=false;continue;}
  if(block){if(ch==='*'&&next==='/'){block=false;i++;}continue;}
  if(quote){if(escape){escape=false;continue;}if(ch==='\\\\'){escape=true;continue;}if(ch===quote)quote='';continue;}
  if(ch==='/'&&next==='/'){line=true;i++;continue;}if(ch==='/'&&next==='*'){block=true;i++;continue;}
  if(ch==="'"||ch==='"'||ch==='`'){quote=ch;continue;}
  if(ch==='{')depth++;if(ch==='}'&&--depth===0)return script.slice(start,i+1);
 }
 throw new Error('Unclosed function '+name);
}
{
 const state={over:false,hunterSkillPoints:6,hunterSkillCooldowns:{},hunterSkillUsedRound:0,round:4,
  hunterRoleSkill:null,hunterBaseSkill:null,hunterSpecialSkill:null,hunterDamageBonus:0,
  decodePenalty:0,decodePenaltyRound:0,hunterShieldPierce:0,controlTurns:0,hunterReductionTurns:0,
  fury:0,weather:'sun',gatePhase:false,difficulty:{enemyHp:50},enemyHp:50,damageDealt:0};
 const skillDefs={
  queenMirror:{id:'queenMirror',name:'镜像追击',desc:'强化下一次攻击',cost:2,cooldown:3},
  jackFogblade:{id:'jackFogblade',name:'雾刃',desc:'穿透护盾',cost:2,cooldown:3},
  barrier:{id:'barrier',name:'坚壁',desc:'降低受到的伤害',cost:3,cooldown:4}
 };
 const logs=[];
 const ready=skill=>!!skill&&state.hunterSkillPoints>=skill.cost&&(state.hunterSkillCooldowns[skill.id]||0)<=state.round&&state.hunterSkillUsedRound!==state.round;
 const get=id=>skillDefs[id]||null;
 const use=new Function('state','getHunterSkill','hunterSkillReady','log','render',
  extractFunction('useHunterSkill')+';return useHunterSkill;')(state,get,ready,x=>logs.push(x),()=>{});
 const damage=new Function('state','log',extractFunction('damageHunter')+';return damageHunter;')(state,x=>logs.push(x));
 assert.equal(use('queenMirror'),true,'actual hunter skill function activates queen attack bonus');
 assert.equal(state.hunterDamageBonus,3);
 assert.equal(state.hunterSkillPoints,4);
 assert.equal(use('barrier'),false,'only one hunter skill may be used per round');
 state.round=5;state.hunterSkillUsedRound=4;
 assert.equal(use('barrier'),true,'actual barrier skill activates on next round');
 assert.equal(state.hunterReductionTurns,2);
 assert.equal(damage(10),7,'actual damage function applies 30% barrier reduction');
 assert.equal(state.damageDealt,7,'damage statistics record reduced damage');
 assert.equal(state.enemyHp,43,'hunter HP receives reduced damage');
 state.round=6;state.hunterSkillUsedRound=5;
 assert.equal(use('jackFogblade'),true,'actual Jack skill activates after its own cooldown/round gate');
 assert.equal(state.hunterShieldPierce,3);
 assert(logs.some(x=>x.includes('监管者减伤 30%')),'actual damage function logs the barrier reduction');
}

console.log('Hunter combat interaction audit: source guards, arithmetic, and actual hunter-skill/damage runtime PASS');
