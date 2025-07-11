function quantumRandom() {
  return Math.random() < 0.5 ? 0 : 1;
}

function entangleQubits() {
  const q = quantumRandom();
  return [q, q];
}

function quantumDice() {
  // returns an integer between 1 and 6 inclusive
  return Math.floor(Math.random() * 6) + 1;
}

function applyHadamard(bit) {
  // simple demonstration of a Hadamard gate measurement
  // ignores the input bit and returns 0 or 1 with equal probability
  return quantumRandom();
}

function secretSauceBonus() {
  // returns 0 or 1 using an "entangled" random process
  return entangleQubits()[0];
}

if (typeof module !== 'undefined') {
  module.exports = {
    quantumRandom,
    entangleQubits,
    quantumDice,
    applyHadamard,
    secretSauceBonus
  };
}
