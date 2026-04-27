const assert = require("node:assert/strict");
const { SPELLING_WORDS } = require("../src/words.js");

assert.equal(Array.isArray(SPELLING_WORDS), true, "word bank should be an array");
assert.equal(SPELLING_WORDS.length, new Set(SPELLING_WORDS).size, "word bank should not contain duplicates");

for (const word of SPELLING_WORDS) {
  assert.match(word, /^[a-z]+$/, `${word} should contain only lowercase letters`);
  assert.ok(word.length >= 3, `${word} should have at least three letters`);
}

const scoreForWord = (word) => Math.max(1, word.length - 1);
const totalMasteryPoints = SPELLING_WORDS.reduce((sum, word) => sum + scoreForWord(word), 0);
const perfectPlayPoints = totalMasteryPoints * 3;

assert.equal(totalMasteryPoints, 418, "one correct spelling of every word should total 418 points");
assert.equal(perfectPlayPoints, 1254, "three correct spellings of every word should total 1,254 points");
assert.equal(Math.floor(perfectPlayPoints / 30), 41, "perfect play should unlock 41 thirty-point cards");
assert.equal(perfectPlayPoints % 30, 24, "perfect play should leave 24 points toward the next card");

console.log(`OK: ${SPELLING_WORDS.length} unique words, all with 3+ letters. Perfect play earns ${perfectPlayPoints} points and 41 cards.`);
