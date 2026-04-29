# Dino Speller

A dependency-free web app that uses spaced repetition to help children practise spelling common English words.

The word bank uses only the 3-letter-and-longer words from the two word-frequency lists in the chat. There are 171 unique words.
 
## Features

- Spaced repetition review schedule based on intervening words, not clock time:
  - The app starts with 5 words in circulation.
  - Correct once: word returns after 4 other words.
  - Correct twice in a row: word returns after 8 other words.
  - Correct three times in a row: word is mastered.
  - Incorrect answer: streak resets and the word returns after 2 other words.
  - New words are introduced as needed so longer gaps can be preserved.
- Points are awarded every time a word is spelt correctly.
- Points awarded = word length minus 2, so a 3-letter word gives 1 point, a 4-letter word gives 2 points, and so on.
- Every 30-point threshold crossed awards a creature card from the Danger Deck.
- Progress is saved in `localStorage`.
- No build step and no external dependencies.

## Run locally

Open `index.html` in a browser, or run the tiny Node static server:

```bash
npm start
```

Then open the local URL printed by the server.

## Test

```bash
npm test
```

The test checks that the word bank contains only unique words with at least three letters.

## Deploy on GitHub Pages

1. Create a new GitHub repository.
2. Commit these files.
3. In GitHub, go to **Settings → Pages**.
4. Choose **Deploy from a branch**.
5. Select your main branch and the repository root.
6. Save.

## Customising creature cards

The first 41 rewards use the Danger Deck list discussed in the chat, ending with Indominus Rex. Edit `CREATURE_CARD_TEMPLATES` in `src/app.js` to replace names, icons, descriptions, or to add artwork references later.

With perfect spelling, the 171-word deck produces 1,254 points: 41 cards at 30-point intervals, plus 24 points toward the next card. If a child earns extra points through repeated practice after mistakes, the app continues awarding Edition 2 variants so every 30-point threshold still gives a reward.

## Customising the spaced-repetition gaps

Edit these constants in `src/app.js`:

```js
const ACTIVE_WORD_TARGET = 5;
const FIRST_CORRECT_REVIEW_GAP = 4;
const SECOND_CORRECT_REVIEW_GAP = 8;
const WRONG_REVIEW_GAP = 2;
```

The gap numbers mean “how many other words should appear before this word comes back.” For example, a gap of `4` creates a five-word opening loop.
