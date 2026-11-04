const fs = require('fs');
const path = require('path');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const names = ['seer', 'doctor', 'thief', 'mercenary', 'mechanic', 'perfumer', 'queen', 'sculptor', 'jack'];
for (const name of names) {
  const asset = path.join(__dirname, '..', 'assets', 'characters', name + '.png');
  if (!fs.existsSync(asset)) throw new Error('Missing character portrait: ' + name);
  const bytes = fs.readFileSync(asset);
  if (bytes.length < 16 || bytes.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a') {
    throw new Error('Invalid PNG portrait: ' + name);
  }
  if (!html.includes('assets/characters/' + name + '.png')) {
    throw new Error('index.html does not reference local portrait: ' + name);
  }
}
if (/https:\/\/patchwiki\.biligame\.com\/images\/dwrg/.test(html)) {
  throw new Error('Remote BWIKI portrait URL remains in index.html');
}
console.log('Character portrait assets: 9 local PNGs verified.');
