const fs = require('node:fs');
const assert = require('node:assert/strict');

const html = fs.readFileSync('index.html', 'utf8');
const readme = fs.readFileSync('README.md', 'utf8');
const design = fs.readFileSync('character-design-v0.8.3-luca.md', 'utf8');

assert.match(html, /<title>迷雾牌局 · 第五人格同人卡牌游戏<\/title>/);
assert.match(html, /第五人格 · 非官方同人卡牌游戏/);
assert.match(html, /IDENTITY V · FAN-MADE CARD GAME/);
assert.match(readme, /^# 迷雾牌局 \| 第五人格同人卡牌游戏/m);
assert.match(readme, /### V0\.8\.1 修复内容\n-/);
assert.doesNotMatch(readme, /\\n/);
assert.match(design, /线路共振/);
assert.match(design, /强电流/);
assert.match(design, /同步传输的进度不再次触发传输/);

console.log('Fan-game identity, README formatting, and Luca design checks passed.');
