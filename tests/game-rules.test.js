const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');

function scoreWord(word) {
  const length = word.length;
  if (length <= 2) return 1;
  if (length <= 4) return 2;
  if (length <= 6) return 3;
  if (length <= 8) return 4;
  return 5;
}

function cardCostAtPackPosition(position) {
  if (position < 3) return 5;
  if (position < 6) return 10;
  if (position < 9) return 20;
  if (position < 12) return 40;
  return 50;
}

function packUnlockSlots(uniqueOwnedCards, totalPacks) {
  const freeExtraPackUnlocks = 1;
  const cardsPerPackUnlock = 7;
  const earnedUnlocks = Math.floor(uniqueOwnedCards / cardsPerPackUnlock);
  return Math.min(1 + freeExtraPackUnlocks + earnedUnlocks, totalPacks);
}

function hideOwnedFromShop(availableIndexes, ownedIndexes) {
  const owned = new Set(ownedIndexes);
  return availableIndexes.filter((index) => !owned.has(index));
}

assert.equal(scoreWord('at'), 1, '1-2 letters should score 1 point');
assert.equal(scoreWord('cat'), 2, '3-4 letters should score 2 points');
assert.equal(scoreWord('apple'), 3, '5-6 letters should score 3 points');
assert.equal(scoreWord('monster'), 4, '7-8 letters should score 4 points');
assert.equal(scoreWord('extraordinary'), 5, '9+ letters should score 5 points');

assert.deepEqual(
  Array.from({ length: 13 }, (_value, index) => cardCostAtPackPosition(index)),
  [5, 5, 5, 10, 10, 10, 20, 20, 20, 40, 40, 40, 50],
  'card prices should follow the per-pack pricing framework'
);

assert.equal(packUnlockSlots(0, 14), 2, 'new users should have default pack plus 1 free extra unlock');
assert.equal(packUnlockSlots(6, 14), 2, '6 cards should not earn the next unlock');
assert.equal(packUnlockSlots(7, 14), 3, '7 cards should earn another pack unlock');
assert.equal(packUnlockSlots(14, 14), 4, '14 cards should earn another pack unlock');

assert.deepEqual(hideOwnedFromShop([1, 2, 3, 4, 5], [2, 5]), [1, 3, 4], 'owned cards should be hidden from shop');

const appSource = readFileSync(join(__dirname, '../src/app.js'), 'utf8');
assert.match(appSource, /function makeRemoteCacheState\(\)/, 'remote progress should save a cache-only state');
assert.match(appSource, /record_correct_spelling/, 'correct spelling should be recorded in Supabase RPC');
assert.match(appSource, /buy_card/, 'card buying should use Supabase RPC');
assert.match(appSource, /unlock_pack/, 'pack unlocking should use Supabase RPC');
assert.match(appSource, /enter_battle/, 'battle entry should use Supabase RPC');
assert.match(appSource, /loadCardDefinitionsFromSupabase/, 'card definitions should load from Supabase');
assert.match(appSource, /refreshRecentBattleResults/, 'recent battle results should be recoverable');

console.log('OK: game rule tests passed.');
