const assert = require('assert');
const {
  quantumRandom,
  entangleQubits,
  quantumDice,
  applyHadamard,
  secretSauceBonus
} = require('./utils.js');

for (let i = 0; i < 100; i++) {
  const v = quantumRandom();
  assert(v === 0 || v === 1, 'quantumRandom should return 0 or 1');
}

for (let i = 0; i < 100; i++) {
  const pair = entangleQubits();
  assert(Array.isArray(pair), 'entangleQubits should return an array');
  assert(pair.length === 2, 'entangleQubits should return length 2');
  assert(pair[0] === pair[1], 'entangleQubits should return identical states');
  assert(pair[0] === 0 || pair[0] === 1, 'entangleQubits values must be 0 or 1');
}

for (let i = 0; i < 100; i++) {
  const roll = quantumDice();
  assert(Number.isInteger(roll), 'quantumDice should return an integer');
  assert(roll >= 1 && roll <= 6, 'quantumDice returns 1-6');
}

for (let i = 0; i < 100; i++) {
  const m = applyHadamard(0);
  assert(m === 0 || m === 1, 'applyHadamard should return 0 or 1');
}

for (let i = 0; i < 100; i++) {
  const b = secretSauceBonus();
  assert(b === 0 || b === 1, 'secretSauceBonus returns 0 or 1');
}

console.log('All tests passed');

