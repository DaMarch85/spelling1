const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const context = { window: {} };
vm.createContext(context);
vm.runInContext(
  fs.readFileSync(path.join(__dirname, "../src/graded-words.js"), "utf8"),
  context
);

const entries = context.window.GRADED_SPELLING_WORDS;

assert.equal(Array.isArray(entries), true, "graded word bank should be an array");
assert.equal(entries.length, 5000, "graded word bank should contain 5,000 words");
assert.equal(new Set(entries.map((entry) => entry.word)).size, entries.length, "word bank should not contain duplicate words");

const levels = new Map();

for (const entry of entries) {
  assert.match(entry.word, /^[a-z]+$/, `${entry.word} should contain only lowercase letters`);
  assert.ok(Number.isInteger(entry.level), `${entry.word} should have an integer level`);
  assert.ok(entry.level >= 1 && entry.level <= 20, `${entry.word} should have level 1–20`);
  assert.equal(typeof entry.sentence, "string", `${entry.word} should have a sentence`);
  assert.ok(entry.sentence.length > 0, `${entry.word} should have a non-empty sentence`);
  levels.set(entry.level, (levels.get(entry.level) || 0) + 1);
}

assert.equal(levels.size, 20, "there should be 20 levels");

for (let level = 1; level <= 20; level += 1) {
  assert.equal(levels.get(level), 250, `level ${level} should contain 250 words`);
}

console.log("OK: graded word bank has 5,000 unique words across 20 levels.");
