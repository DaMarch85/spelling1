(function () {
  "use strict";

  const WORDS = window.SPELLING_WORDS || [];

  const STORAGE_KEY = "dino-speller-state-v3";
  const LEGACY_STORAGE_KEYS = ["dino-speller-state-v2", "dino-speller-state-v1"];
  const MASTERY_STREAK = 3;
  const CARD_POINT_STEP = 30;
  const ACTIVE_WORD_TARGET = 5;
  const FIRST_CORRECT_REVIEW_GAP = 4;
  const SECOND_CORRECT_REVIEW_GAP = 8;
  const WRONG_REVIEW_GAP = 2;
  const AUTO_ADVANCE_MS = 1500;

  const CREATURE_CARD_TEMPLATES = Object.freeze([
    {
      name: "Velociraptor",
      icon: "🦖",
      description: "Small, fast, and clever enough to stalk tricky words."
    },
    {
      name: "King Cobra",
      icon: "🐍",
      description: "A venomous strike card for sharp spelling."
    },
    {
      name: "Komodo Dragon",
      icon: "🦎",
      description: "A real-life dragon with a dangerous bite."
    },
    {
      name: "Dilophosaurus",
      icon: "🌿",
      description: "A flashy forest ambusher with a scary surprise."
    },
    {
      name: "Giant Scorpion",
      icon: "🦂",
      description: "A creepy desert stinger from the danger deck."
    },
    {
      name: "Dire Wolf",
      icon: "🐺",
      description: "A pack hunter that rewards steady practice."
    },
    {
      name: "Piranha Swarm",
      icon: "🐟",
      description: "Tiny teeth, big trouble, and lots of energy."
    },
    {
      name: "Basilisk",
      icon: "👁️",
      description: "A mythical monster with the stare of doom."
    },
    {
      name: "Carnotaurus",
      icon: "🐂",
      description: "A charging horned predator with speedy feet."
    },
    {
      name: "Giant Squid",
      icon: "🦑",
      description: "A deep-sea tentacle beast for brave spellers."
    },
    {
      name: "Allosaurus",
      icon: "🦴",
      description: "A classic Jurassic hunter with powerful jaws."
    },
    {
      name: "Smilodon",
      icon: "🐯",
      description: "A sabre-toothed stalker with fearless focus."
    },
    {
      name: "Saltwater Crocodile",
      icon: "🐊",
      description: "A river ambush king that waits for its moment."
    },
    {
      name: "Manticore",
      icon: "🦁",
      description: "Lion body, scorpion tail, and monster attitude."
    },
    {
      name: "Baryonyx",
      icon: "🎣",
      description: "A fish-snatching predator with a mighty claw."
    },
    {
      name: "Great White Shark",
      icon: "🦈",
      description: "An ocean hunter that slices through hard words."
    },
    {
      name: "Terror Bird",
      icon: "🐦",
      description: "A giant running nightmare from prehistoric times."
    },
    {
      name: "Minotaur",
      icon: "🐂",
      description: "A labyrinth bruiser with boss-level power."
    },
    {
      name: "Therizinosaurus",
      icon: "🦥",
      description: "A giant-clawed weirdo with terrifying reach."
    },
    {
      name: "Anaconda",
      icon: "🐍",
      description: "A crushing jungle serpent for fearless practice."
    },
    {
      name: "Quetzalcoatlus",
      icon: "🪽",
      description: "A giant sky beast that soars above the deck."
    },
    {
      name: "Polar Bear",
      icon: "🐻‍❄️",
      description: "An ice-world powerhouse with unstoppable strength."
    },
    {
      name: "Cerberus",
      icon: "🐕",
      description: "A three-headed guard dog for three-in-a-row mastery."
    },
    {
      name: "Spinosaurus",
      icon: "🌊",
      description: "A river monster with a sail and serious bite."
    },
    {
      name: "Orca",
      icon: "🐋",
      description: "An ocean strategy master with teamwork power."
    },
    {
      name: "Titanoboa",
      icon: "🌀",
      description: "A giant prehistoric snake with crushing coils."
    },
    {
      name: "Chimera",
      icon: "🔥",
      description: "A three-beast nightmare from myth and legend."
    },
    {
      name: "Tyrannosaurus Rex",
      icon: "👑",
      description: "The legendary king of roaring spelling wins."
    },
    {
      name: "Sarcosuchus",
      icon: "🐊",
      description: "A super-croc from the deep prehistoric rivers."
    },
    {
      name: "Kraken",
      icon: "🐙",
      description: "A tentacled sea boss that rises from the depths."
    },
    {
      name: "Ankylosaurus",
      icon: "🪨",
      description: "An armoured war tank with a club-tail defence."
    },
    {
      name: "Griffin",
      icon: "🦅",
      description: "An eagle-lion sky guardian for high flyers."
    },
    {
      name: "Giganotosaurus",
      icon: "⚔️",
      description: "A huge apex predator with gigantic confidence."
    },
    {
      name: "Megalodon",
      icon: "🦈",
      description: "A monster shark with a legendary bite."
    },
    {
      name: "Hydra",
      icon: "🐉",
      description: "A many-headed terror that keeps coming back."
    },
    {
      name: "Mosasaurus",
      icon: "🌊",
      description: "An ocean super-predator with gigantic jaws."
    },
    {
      name: "Yeti",
      icon: "❄️",
      description: "A snowy mountain mystery with hidden power."
    },
    {
      name: "Triceratops",
      icon: "🛡️",
      description: "A horned battle guardian that never backs down."
    },
    {
      name: "Sea Serpent",
      icon: "🌫️",
      description: "A coiling ocean legend from stormy waters."
    },
    {
      name: "Dragon",
      icon: "🐲",
      description: "A fire-breathing boss with blazing spelling power."
    },
    {
      name: "Indominus Rex",
      icon: "💀",
      description: "The fictional hybrid final boss of the first danger deck."
    }
  ]);

  const CONTEXT_CLUES = Object.freeze({
    there: "Clue: The toy is over ___.",
    their: "Clue: The children packed ___ bags.",
    one: "Clue: I have ___ apple.",
    two: "Clue: I have ___ shoes.",
    would: "Clue: I ___ like to play.",
    see: "Clue: I can ___ the moon.",
    right: "Clue: This answer is ___.",
    which: "Clue: ___ book should we read?",
    know: "Clue: I ___ the answer.",
    some: "Clue: Please take ___ paper.",
    our: "Clue: This is ___ classroom.",
    hour: "Clue: The lesson lasts one ___.",
    week: "Clue: There are seven days in a ___.",
    eye: "Clue: I wink with one ___.",
    new: "Clue: These shoes are ___.",
    for: "Clue: This present is ___ you.",
    than: "Clue: A whale is bigger ___ a fish.",
    then: "Clue: First wash hands, ___ eat.",
    its: "Clue: The dog wagged ___ tail."
  });

  const elements = {
    resetButton: document.querySelector("#resetButton"),
    refreshButton: document.querySelector("#refreshButton"),
    restingPanel: document.querySelector("#restingPanel"),
    practicePanel: document.querySelector("#practicePanel"),
    nextDueText: document.querySelector("#nextDueText"),
    dueCount: document.querySelector("#dueCount"),
    wordLength: document.querySelector("#wordLength"),
    contextClue: document.querySelector("#contextClue"),
    streakEggs: document.querySelector("#streakEggs"),
    speakButton: document.querySelector("#speakButton"),
    hintButton: document.querySelector("#hintButton"),
    skipButton: document.querySelector("#skipButton"),
    hintText: document.querySelector("#hintText"),
    form: document.querySelector("#spellForm"),
    answerInput: document.querySelector("#answerInput"),
    feedback: document.querySelector("#feedback"),
    pointsTotal: document.querySelector("#pointsTotal"),
    masteredTotal: document.querySelector("#masteredTotal"),
    cardsTotal: document.querySelector("#cardsTotal"),
    wordsTotal: document.querySelector("#wordsTotal"),
    nextCardText: document.querySelector("#nextCardText"),
    cardProgress: document.querySelector("#cardProgress"),
    latestCardBadge: document.querySelector("#latestCardBadge"),
    cardAlbum: document.querySelector("#cardAlbum"),
    dinoCardTemplate: document.querySelector("#dinoCardTemplate")
  };

  let state = loadState();
  let currentWord = null;
  let autoAdvanceTimer = null;

  initialise();

  function initialise() {
    elements.form.addEventListener("submit", handleSubmit);
    elements.speakButton.addEventListener("click", speakCurrentWord);
    elements.hintButton.addEventListener("click", showHint);
    elements.skipButton.addEventListener("click", skipCurrentWord);
    elements.resetButton.addEventListener("click", resetProgress);
    elements.refreshButton.addEventListener("click", () => selectNextWord());

    selectNextWord();
    renderStats();
    renderAlbum();

    renderDueBadge();
  }

  function makeBlankProgress(word) {
    return {
      word,
      attempts: 0,
      correctAttempts: 0,
      correctStreak: 0,
      introduced: false,
      mastered: false,
      masteredAt: null,
      lastAttemptAt: null
    };
  }

  function makeInitialState() {
    const initialState = {
      version: 3,
      points: 0,
      cards: [],
      queue: [],
      turn: 0,
      progress: WORDS.reduce((acc, word) => {
        acc[word] = makeBlankProgress(word);
        return acc;
      }, {})
    };

    fillQueueToSize(initialState, ACTIVE_WORD_TARGET);
    return initialState;
  }

  function loadState() {
    const fallback = makeInitialState();
    const currentRaw = window.localStorage.getItem(STORAGE_KEY);
    const legacyRaw = LEGACY_STORAGE_KEYS
      .map((key) => window.localStorage.getItem(key))
      .find((value) => Boolean(value));
    const raw = currentRaw || legacyRaw;
    const isLegacyState = !currentRaw && Boolean(legacyRaw);

    if (!raw) {
      return fallback;
    }

    try {
      const parsed = JSON.parse(raw);
      const loaded = {
        version: 3,
        points: Number.isFinite(parsed.points) ? parsed.points : 0,
        cards: Array.isArray(parsed.cards) ? parsed.cards : [],
        queue: Array.isArray(parsed.queue) ? parsed.queue : [],
        turn: Number.isFinite(parsed.turn) ? parsed.turn : 0,
        progress: parsed.progress && typeof parsed.progress === "object" ? parsed.progress : {}
      };

      const allowedWords = new Set(WORDS);
      for (const word of Object.keys(loaded.progress)) {
        if (!allowedWords.has(word)) {
          delete loaded.progress[word];
        }
      }

      for (const [index, word] of WORDS.entries()) {
        const savedProgress = loaded.progress[word] || {};
        const restored = {
          ...makeBlankProgress(word),
          ...savedProgress,
          word
        };

        restored.mastered = Boolean(restored.mastered);
        restored.introduced = Boolean(
          restored.introduced ||
          restored.mastered ||
          Number(restored.attempts || 0) > 0 ||
          index < ACTIVE_WORD_TARGET
        );

        loaded.progress[word] = restored;
      }

      cleanQueue(loaded);

      if (loaded.queue.length === 0) {
        for (const word of WORDS) {
          const progress = loaded.progress[word];
          if (progress.introduced && !progress.mastered) {
            loaded.queue.push(word);
          }
        }
      }

      if (isLegacyState || Number(parsed.version || 0) < 3) {
        loaded.points = calculateEarnedPoints(loaded);
        loaded.cards = buildCardsForPointTotal(loaded.points);
      } else {
        loaded.cards = sanitiseSavedCards(loaded.cards);
      }

      fillQueueToSize(loaded, ACTIVE_WORD_TARGET);
      return loaded;
    } catch (error) {
      console.warn("Could not read saved progress. Starting fresh.", error);
      return fallback;
    }
  }

  function saveState() {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function resetProgress() {
    const confirmed = window.confirm("Reset all spelling progress and creature cards?");
    if (!confirmed) {
      return;
    }

    state = makeInitialState();
    currentWord = null;
    clearAutoAdvance();
    saveState();
    selectNextWord();
    renderStats();
    renderAlbum();
  }

  function selectNextWord() {
    clearAutoAdvance();
    cleanQueue(state);
    fillQueueToSize(state, ACTIVE_WORD_TARGET);

    currentWord = state.queue[0] || null;

    if (!currentWord) {
      renderRestingState();
      return;
    }

    elements.restingPanel.hidden = true;
    elements.practicePanel.hidden = false;
    elements.answerInput.disabled = false;
    elements.speakButton.disabled = false;
    elements.hintButton.disabled = false;
    elements.skipButton.disabled = false;
    elements.answerInput.value = "";
    elements.hintText.textContent = "";
    clearFeedback();
    renderCurrentWord();
    renderDueBadge();
    elements.answerInput.focus();
  }

  function skipCurrentWord() {
    if (!currentWord) {
      return;
    }

    removeWordFromQueue(currentWord);
    insertWordAfterGap(currentWord, WRONG_REVIEW_GAP);
    fillQueueToSize(state, ACTIVE_WORD_TARGET);
    saveState();
    selectNextWord();
  }

  function cleanQueue(targetState) {
    const seen = new Set();
    targetState.queue = targetState.queue.filter((word) => {
      const progress = targetState.progress[word];
      if (!progress || progress.mastered || seen.has(word)) {
        return false;
      }

      seen.add(word);
      progress.introduced = true;
      return true;
    });
  }

  function fillQueueToSize(targetState, targetSize) {
    cleanQueue(targetState);

    while (targetState.queue.length < targetSize) {
      const introducedWord = introduceNextWord(targetState);
      if (!introducedWord) {
        break;
      }

      targetState.queue.push(introducedWord);
    }
  }

  function introduceNextWord(targetState) {
    for (const word of WORDS) {
      const progress = targetState.progress[word];
      if (!progress || progress.mastered || progress.introduced) {
        continue;
      }

      progress.introduced = true;
      return word;
    }

    return null;
  }

  function removeWordFromQueue(word) {
    const index = state.queue.indexOf(word);
    if (index >= 0) {
      state.queue.splice(index, 1);
    }
  }

  function insertWordAfterGap(word, wordGap) {
    state.queue = state.queue.filter((queuedWord) => queuedWord !== word);
    fillQueueToSize(state, wordGap);

    const insertionIndex = Math.min(wordGap, state.queue.length);
    state.queue.splice(insertionIndex, 0, word);
  }

  function renderCurrentWord() {
    const progress = state.progress[currentWord];
    const points = scoreWord(currentWord);
    elements.wordLength.textContent = `Word length: ${currentWord.length} ${currentWord.length === 1 ? "letter" : "letters"} · Worth ${points} ${pluralise(points, "point")}`;
    elements.contextClue.textContent = CONTEXT_CLUES[currentWord] || "";
    renderStreak(progress.correctStreak || 0);
  }

  function renderStreak(streak) {
    elements.streakEggs.innerHTML = "";

    for (let index = 1; index <= MASTERY_STREAK; index += 1) {
      const egg = document.createElement("span");
      egg.className = index <= streak ? "egg is-filled" : "egg";
      egg.title = index <= streak ? "Correct" : "Needed";
      elements.streakEggs.appendChild(egg);
    }
  }

  function renderStats() {
    const masteredCount = WORDS.filter((word) => state.progress[word].mastered).length;
    const progressIntoNextCard = state.points % CARD_POINT_STEP;

    elements.pointsTotal.textContent = state.points;
    elements.masteredTotal.textContent = masteredCount;
    elements.cardsTotal.textContent = state.cards.length;
    elements.wordsTotal.textContent = WORDS.length;
    elements.nextCardText.textContent = `${progressIntoNextCard} / ${CARD_POINT_STEP}`;
    elements.cardProgress.style.width = `${(progressIntoNextCard / CARD_POINT_STEP) * 100}%`;
    renderDueBadge();
  }

  function renderDueBadge() {
    const queuedCount = state.queue.length;
    elements.dueCount.textContent = `${queuedCount} queued`;
  }

  function renderAlbum() {
    elements.cardAlbum.innerHTML = "";

    if (state.cards.length === 0) {
      const empty = document.createElement("p");
      empty.className = "empty-album";
      empty.textContent = "Earn your first card by reaching 30 points.";
      elements.cardAlbum.appendChild(empty);
      elements.latestCardBadge.textContent = "None yet";
      return;
    }

    const latestCard = state.cards[state.cards.length - 1];
    elements.latestCardBadge.textContent = `Latest: ${latestCard.name}`;

    for (const card of state.cards.slice().reverse()) {
      const node = elements.dinoCardTemplate.content.cloneNode(true);
      node.querySelector(".dino-card__icon").textContent = card.icon;
      node.querySelector("h3").textContent = card.name;
      node.querySelector("p").textContent = card.description;
      node.querySelector("span").textContent = `Unlocked at ${card.threshold} points`;
      elements.cardAlbum.appendChild(node);
    }
  }

  function renderRestingState() {
    elements.practicePanel.hidden = true;
    elements.restingPanel.hidden = false;

    elements.nextDueText.textContent = "You mastered every word in the deck. Great work!";
  }

  function handleSubmit(event) {
    event.preventDefault();

    if (!currentWord) {
      return;
    }

    const answer = normaliseAnswer(elements.answerInput.value);
    const progress = state.progress[currentWord];
    removeWordFromQueue(currentWord);
    progress.attempts += 1;
    progress.lastAttemptAt = Date.now();
    state.turn = Number(state.turn || 0) + 1;

    if (answer === currentWord) {
      handleCorrectAnswer(progress);
    } else {
      handleIncorrectAnswer(progress, answer);
    }

    fillQueueToSize(state, ACTIVE_WORD_TARGET);
    saveState();
    renderStats();
    renderAlbum();
    lockPracticeControls();
    autoAdvanceTimer = window.setTimeout(() => selectNextWord(), AUTO_ADVANCE_MS);
  }

  function handleCorrectAnswer(progress) {
    const oldPoints = state.points;
    const earnedPoints = scoreWord(progress.word);

    progress.correctAttempts += 1;
    progress.correctStreak = Math.min(MASTERY_STREAK, Number(progress.correctStreak || 0) + 1);
    state.points += earnedPoints;

    const newCards = awardCardsForThresholds(oldPoints, state.points);
    const cardText = formatNewCardText(newCards);

    if (progress.correctStreak >= MASTERY_STREAK && !progress.mastered) {
      masterWord(progress, earnedPoints, cardText);
      return;
    }

    const wordGap = progress.correctStreak === 1 ? FIRST_CORRECT_REVIEW_GAP : SECOND_CORRECT_REVIEW_GAP;
    insertWordAfterGap(progress.word, wordGap);

    setFeedback(
      `Correct! +${earnedPoints} ${pluralise(earnedPoints, "point")}. “${progress.word}” has a streak of ${progress.correctStreak}/${MASTERY_STREAK}. It will come back after ${formatWordGap(wordGap)}.${cardText}`,
      "success"
    );
  }

  function handleIncorrectAnswer(progress, answer) {
    progress.correctStreak = 0;
    insertWordAfterGap(progress.word, WRONG_REVIEW_GAP);

    const answerText = answer ? `You typed “${answer}”. ` : "";
    setFeedback(
      `Not quite. ${answerText}The word was “${progress.word}”. It will come back after ${formatWordGap(WRONG_REVIEW_GAP)}.`,
      "error"
    );
  }

  function masterWord(progress, earnedPoints, cardText) {
    progress.mastered = true;
    progress.masteredAt = Date.now();

    setFeedback(
      `Correct! +${earnedPoints} ${pluralise(earnedPoints, "point")}. Mastered “${progress.word}”!${cardText}`,
      "success"
    );
  }

  function scoreWord(word) {
    return Math.max(1, word.length - 2);
  }

  function calculateEarnedPoints(targetState) {
    return WORDS.reduce((total, word) => {
      const progress = targetState.progress[word];
      const correctAttempts = Number(progress && progress.correctAttempts ? progress.correctAttempts : 0);
      const safeCorrectAttempts = Number.isFinite(correctAttempts) ? correctAttempts : 0;
      return total + safeCorrectAttempts * scoreWord(word);
    }, 0);
  }

  function buildCardsForPointTotal(points) {
    const cardCount = Math.floor(points / CARD_POINT_STEP);
    return Array.from({ length: cardCount }, (_, index) => {
      const threshold = (index + 1) * CARD_POINT_STEP;
      return buildCreatureCard(index, threshold, Date.now());
    });
  }

  function sanitiseSavedCards(cards) {
    return cards
      .filter((card) => card && typeof card === "object")
      .map((card, index) => ({
        ...buildCreatureCard(index, Number(card.threshold) || (index + 1) * CARD_POINT_STEP, Number(card.earnedAt) || Date.now()),
        ...card
      }));
  }

  function awardCardsForThresholds(oldPoints, newPoints) {
    const oldThresholdLevel = Math.floor(oldPoints / CARD_POINT_STEP);
    const newThresholdLevel = Math.floor(newPoints / CARD_POINT_STEP);
    const newCards = [];

    for (let level = oldThresholdLevel + 1; level <= newThresholdLevel; level += 1) {
      const threshold = level * CARD_POINT_STEP;
      const card = createCreatureCard(threshold);
      state.cards.push(card);
      newCards.push(card);
    }

    return newCards;
  }

  function createCreatureCard(threshold) {
    return buildCreatureCard(state.cards.length, threshold, Date.now());
  }

  function buildCreatureCard(cardIndex, threshold, earnedAt) {
    const template = CREATURE_CARD_TEMPLATES[cardIndex % CREATURE_CARD_TEMPLATES.length];
    const edition = Math.floor(cardIndex / CREATURE_CARD_TEMPLATES.length) + 1;
    const suffix = edition > 1 ? `, Edition ${edition}` : "";

    return {
      id: makeId(),
      threshold,
      earnedAt,
      name: `${template.name}${suffix}`,
      icon: template.icon,
      description: template.description
    };
  }

  function formatNewCardText(newCards) {
    if (newCards.length === 0) {
      return "";
    }

    if (newCards.length === 1) {
      return ` You earned a creature card: ${newCards[0].name}!`;
    }

    return ` You earned ${newCards.length} creature cards!`;
  }

  function pluralise(count, singular) {
    return `${singular}${count === 1 ? "" : "s"}`;
  }

  function makeId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      return window.crypto.randomUUID();
    }

    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function showHint() {
    if (!currentWord) {
      return;
    }

    const firstLetter = currentWord.charAt(0);
    const lastLetter = currentWord.charAt(currentWord.length - 1);
    const progress = state.progress[currentWord];
    const pattern = currentWord
      .split("")
      .map((letter, index) => {
        if (index === 0) {
          return letter;
        }

        if (progress.correctStreak >= 2 && index === currentWord.length - 1) {
          return lastLetter;
        }

        return "·";
      })
      .join(" ");

    elements.hintText.textContent = `Hint: starts with “${firstLetter}”. Pattern: ${pattern}`;
  }

  function speakCurrentWord() {
    if (!currentWord) {
      return;
    }

    if (!("speechSynthesis" in window)) {
      elements.hintText.textContent = `Speech is not available in this browser. Ask a grown-up to read: ${currentWord}`;
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(currentWord);
    utterance.lang = "en-GB";
    utterance.rate = 0.82;
    utterance.pitch = 1.08;
    window.speechSynthesis.speak(utterance);
  }

  function normaliseAnswer(value) {
    return value
      .trim()
      .toLowerCase()
      .replace(/[^a-z]/g, "");
  }

  function setFeedback(message, type) {
    elements.feedback.textContent = message;
    elements.feedback.className = `feedback is-${type}`;
  }

  function clearFeedback() {
    elements.feedback.textContent = "";
    elements.feedback.className = "feedback";
  }

  function lockPracticeControls() {
    elements.answerInput.disabled = true;
    elements.speakButton.disabled = true;
    elements.hintButton.disabled = true;
    elements.skipButton.disabled = true;
  }

  function clearAutoAdvance() {
    if (autoAdvanceTimer) {
      window.clearTimeout(autoAdvanceTimer);
      autoAdvanceTimer = null;
    }
  }

  function formatWordGap(wordGap) {
    return `${wordGap} other word${wordGap === 1 ? "" : "s"}`;
  }
}());
