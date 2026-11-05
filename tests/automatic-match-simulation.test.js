'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const LucaMechanics = require('../luca-mechanics.js');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const scriptStart = html.indexOf('<script>', html.indexOf('<script src='));
const scriptEnd = html.indexOf('</script>', scriptStart);
assert(scriptStart >= 0 && scriptEnd > scriptStart, 'live game script exists');
const liveScript = html.slice(scriptStart + '<script>'.length, scriptEnd);

function makeElement() {
  const element = {
    value: '',
    style: {},
    dataset: {},
    classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
    addEventListener() {},
    removeEventListener() {},
    append() {},
    prepend() {},
    querySelectorAll() { return []; },
    setAttribute() {},
    removeAttribute() {},
    focus() {},
    click() {},
    pause() {},
    play() { return Promise.resolve(); },
    textContent: '',
    innerHTML: '',
    disabled: false
  };
  return new Proxy(element, {
    get(target, key) {
      if (key in target) return target[key];
      return undefined;
    },
    set(target, key, value) {
      target[key] = value;
      return true;
    }
  });
}

const elements = new Map();
const document = {
  getElementById(id) {
    if (!elements.has(id)) elements.set(id, makeElement());
    return elements.get(id);
  },
  querySelectorAll() { return []; },
  createElement() { return makeElement(); },
  body: makeElement()
};
const storage = new Map();
const localStorage = {
  getItem(key) { return storage.has(key) ? storage.get(key) : null; },
  setItem(key, value) { storage.set(key, String(value)); },
  removeItem(key) { storage.delete(key); }
};
const context = vm.createContext({
  document,
  window: {},
  localStorage,
  LucaMechanics,
  console,
  setInterval,
  clearInterval,
  confirm() { return false; }
});
vm.runInContext(liveScript, context, { timeout: 20000 });

const harness = String.raw\`
render = () => {};
log = () => {};
stopWeatherAudio = () => {};
$('gameMode').value = 'standard';
$('difficulty').value = 'normal';
$('weatherChoice').value = 'sun';

function seedRandom(seed) {
  let value = seed >>> 0;
  Math.random = () => {
    value = (1664525 * value + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

function cardScore(card) {
  const missing = state.hero.hp - state.hp;
  const lowHealth = state.hp <= Math.max(10, state.hero.hp * 0.55);
  const hasCipher = state.ciphers.some(c => c.progress < 100);
  const hasGate = state.gatePhase && state.gates.some(g => g.progress < 100);
  switch (card.type) {
    case 'decode': return hasCipher ? 12 + card.value / 20 : -100;
    case 'gate': return hasGate ? 15 : -100;
    case 'control': return state.hunterSkipAttack < 2 ? 10 : -100;
    case 'guard': return state.playerGuardHits < 2 && (lowHealth || state.shield < 3) ? 9 : -100;
    case 'heal': return missing >= 5 ? 9 + Math.min(3, missing / 8) : -100;
    case 'resolve': return missing >= 2 || (lowHealth && state.shield < 5) ? 9 : -100;
    case 'steady': return missing >= 3 || (lowHealth && state.shield < 4) ? 8 : -100;
    case 'overflowHeal': return missing >= 2 ? 8 : -100;
    case 'shield': return lowHealth || state.shield < 2 ? 8 : -100;
    case 'tactical': return state.shield < 3 || state.weaken < 2 ? 8 : -100;
    case 'weaken': return state.weaken < card.value && (lowHealth || state.shield < 3) ? 8 : -100;
    case 'haze': return state.markedWeakenHits === 0 && (lowHealth || state.shield < 3) ? 8 : -100;
    case 'thorns': return state.reflectDamage < 8 && (lowHealth || state.shield < 4) ? 8 : -100;
    case 'thornEcho': return state.reflectDamage > 0 && state.reflectBonus < 3 ? 8 : -100;
    case 'mirror': return state.shieldCounterDamage === 0 && state.shield < 5 ? 7 : -100;
    case 'surge': return state.enemyHp <= 20 && state.attackBonus === 0 ? 7 : -100;
    case 'mark': return state.enemyHp <= 20 && state.markedAttackHits === 0 ? 7 : -100;
    case 'focus': return state.energy <= 2 ? 7 : -100;
    case 'overclock': return state.energy <= 2 ? 7 : -100;
    case 'attack': return state.enemyHp <= 18 ? 7 + (18 - state.enemyHp) / 5 : 2;
    case 'risk': return state.enemyHp <= 18 && state.hp > 5 ? 7 + (18 - state.enemyHp) / 5 : 1;
    default: return -100;
  }
}

function bestPlayableCard() {
  let best = null;
  for (let i = 0; i < state.hand.length; i++) {
    const card = state.hand[i];
    if (state.energy < card.cost || state.skillPoints < card.skillCost) continue;
    if (card.type === 'decode' && !state.ciphers.some(c => c.progress < 100)) continue;
    if (card.type === 'gate' && (!state.gatePhase || state.gates.every(g => g.progress >= 100))) continue;
    const score = cardScore(card);
    if (!best || score > best.score) best = { index: i, score, card };
  }
  return best;
}

function runPlayerTurn() {
  if (state.over) return;
  if (selected === 'mechanic' && state.mechanicUses > 0 && state.ciphers.some(c => c.progress < 100)) {
    useSkill();
    if (state.over) return;
  }
  if (selected === 'doctor' && state.doctorCooldown === 0 && state.hero.hp - state.hp >= 5) {
    useSkill();
    if (state.over) return;
  }
  if (selected === 'perfumer' && !state.perfumerUsed && !state.perfumerArmed && state.hero.hp - state.hp >= 3) {
    useSkill();
    if (state.over) return;
  }
  if (selected === 'luca' && state.lucaLink && state.lucaLink.charge >= 3 &&
      state.lucaLink.skillUsedRound !== state.round && state.controlTurns === 0) {
    useSkill();
    if (state.over) return;
  }

  for (let action = 0; action < 16 && !state.over; action++) {
    if (state.gatePhase && state.gates.some(g => g.progress >= 100)) {
      finish(true, true);
      return;
    }
    if (state.controlTurns > 0) break;

    const best = bestPlayableCard();
    if (best && best.score >= 8) {
      const beforeHand = state.hand.length;
      play(best.index);
      if (state.over) return;
      if (state.hand.length === beforeHand && best.card.type !== 'focus') break;
      continue;
    }

    if (!state.gatePhase && state.energy >= 1 && state.decodeActions < 3 &&
        state.ciphers.some(c => c.progress < 100)) {
      const before = state.energy;
      decode();
      if (state.over) return;
      if (state.energy < before) continue;
    }

    if (state.gatePhase && state.energy >= 1 && state.gates.some(g => g.progress < 100)) {
      const target = state.gates.findIndex(g => g.progress < 100);
      const before = state.energy;
      decodeGate(target);
      if (state.over) return;
      if (state.gates.some(g => g.progress >= 100)) {
        finish(true, true);
        return;
      }
      if (state.energy < before) continue;
    }

    if (best && best.score > 0) {
      const beforeHand = state.hand.length;
      play(best.index);
      if (state.over) return;
      if (state.hand.length === beforeHand && best.card.type !== 'focus') break;
      continue;
    }
    break;
  }
}

function playOneMatch(hero, seed) {
  seedRandom(seed);
  selected = hero;
  start();
  let safety = 0;
  while (!state.over && safety < 45) {
    runPlayerTurn();
    if (state.over) break;
    enemyTurn();
    safety++;
  }
  const escaped = !!(state.gates && state.gates.some(g => g.progress >= 100) && state.over && state.hp > 0);
  const hunterKilled = state.enemyHp <= 0;
  return {
    hero,
    win: state.over && (escaped || hunterKilled),
    escaped,
    hunterKilled,
    timeout: !state.over,
    rounds: state.round,
    weather: state.weather,
    hunter: state.hunterRole,
    gatePhase: state.gatePhase,
    hp: state.hp,
    hunterHp: state.enemyHp,
    ciphers: state.ciphers.filter(c => c.progress >= 100).length,
    damageDealt: state.damageDealt || 0
  };
}

function wilson(wins, total) {
  if (!total) return [0, 0];
  const z = 1.96, p = wins / total, d = 1 + z * z / total;
  const center = (p + z * z / (2 * total)) / d;
  const margin = z * Math.sqrt((p * (1 - p) + z * z / (4 * total)) / total) / d;
  return [Math.max(0, center - margin), Math.min(1, center + margin)];
}

const heroes = ['seer', 'doctor', 'thief', 'mercenary', 'mechanic', 'perfumer', 'luca'];
const batches = [];
const all = [];
for (let batch = 0; batch < 5; batch++) {
  const rows = [];
  for (let i = 0; i < 200; i++) {
    const globalIndex = batch * 200 + i;
    const hero = heroes[globalIndex % heroes.length];
    const result = playOneMatch(hero, 20261105 + globalIndex * 7919);
    rows.push(result);
    all.push(result);
  }
  const wins = rows.filter(x => x.win).length;
  batches.push({
    batch: batch + 1,
    games: rows.length,
    wins,
    winRate: Number((wins / rows.length * 100).toFixed(1))
  });
}

const summary = heroes.map(hero => {
  const rows = all.filter(x => x.hero === hero);
  const wins = rows.filter(x => x.win).length;
  const escaped = rows.filter(x => x.escaped).length;
  const killed = rows.filter(x => x.hunterKilled).length;
  const ci = wilson(wins, rows.length).map(x => Number((x * 100).toFixed(1)));
  return {
    hero,
    games: rows.length,
    wins,
    winRate: Number((wins / rows.length * 100).toFixed(1)),
    ci95: ci,
    escapes: escaped,
    hunterKills: killed,
    avgRounds: Number((rows.reduce((n, x) => n + x.rounds, 0) / rows.length).toFixed(2)),
    avgCipherCompletions: Number((rows.reduce((n, x) => n + x.ciphers, 0) / rows.length).toFixed(2))
  };
});
const overallWins = all.filter(x => x.win).length;
const weatherSummary = Object.keys(weatherDefs).map(weather => {
  const rows = all.filter(x => x.weather === weather);
  return { weather, games: rows.length, wins: rows.filter(x => x.win).length,
    winRate: rows.length ? Number((rows.filter(x => x.win).length / rows.length * 100).toFixed(1)) : null };
});
const hunterSummary = ['queen', 'sculptor', 'jack'].map(hunter => {
  const rows = all.filter(x => x.hunter === hunter);
  return { hunter, games: rows.length, wins: rows.filter(x => x.win).length,
    winRate: rows.length ? Number((rows.filter(x => x.win).length / rows.length * 100).toFixed(1)) : null };
});
globalThis.__simulationResults = {
  totalGames: all.length,
  overallWins,
  overallWinRate: Number((overallWins / all.length * 100).toFixed(1)),
  batches,
  heroes: summary,
  weather: weatherSummary,
  hunters: hunterSummary,
  timeouts: all.filter(x => x.timeout).length
};
\`;
vm.runInContext(harness, context, { timeout: 120000 });
const results = context.__simulationResults;
assert.equal(results.totalGames, 1000, 'exactly 1,000 complete-match simulations are executed');
assert.equal(results.batches.length, 5, 'five batches of 200 matches are executed');
assert(results.batches.every(batch => batch.games === 200), 'each batch contains exactly 200 matches');
assert.equal(results.heroes.length, 7, 'all seven survivor characters are tested');
assert(results.heroes.every(hero => hero.games >= 142 && hero.games <= 143), 'match allocation is balanced across all seven survivors');
assert.equal(results.timeouts, 0, 'all matches terminate within the 45-round safety limit');

console.log('Automatic match simulation: 5 x 200 matches using live game functions PASS');
console.log(JSON.stringify(results, null, 2));
