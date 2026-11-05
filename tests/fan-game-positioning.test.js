const fs = require('node:fs');
const assert = require('node:assert/strict');

const html = fs.readFileSync('index.html', 'utf8');
const readme = fs.readFileSync('README.md', 'utf8');

assert.match(html, /<title>迷雾牌局 · 第五人格同人卡牌游戏<\/title>/);
assert.match(html, /第五人格 · 非官方同人卡牌游戏/);
assert.match(html, /以第五人格原作角色与庄园追逃设定为基础的非官方同人卡牌游戏/);
assert.match(readme, /^# 迷雾牌局 \| 第五人格同人卡牌游戏/m);
assert.match(readme, /不存在隶属、授权或合作关系/);

console.log('Identity V fan-game positioning checks passed.');
