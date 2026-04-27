(function () {
  "use strict";

  const WORDS = window.SPELLING_WORDS || [];

  const STORAGE_KEY = "dino-speller-state-v6";
  const LEGACY_STORAGE_KEYS = [
    "dino-speller-state-v5",
    "dino-speller-state-v4",
    "dino-speller-state-v3",
    "dino-speller-state-v2",
    "dino-speller-state-v1"
  ];

  const MASTERY_STREAK = 3;
  const CARD_COST = 30;
  const INITIAL_SHOP_SIZE = 10;
  const SHOP_BATCH_SIZE = 10;
  const SHOP_REMAINING_TRIGGER = 5;
  const ACTIVE_WORD_TARGET = 5;
  const FIRST_CORRECT_REVIEW_GAP = 4;
  const SECOND_CORRECT_REVIEW_GAP = 8;
  const WRONG_REVIEW_GAP = 2;
  const AUTO_ADVANCE_MS = 1500;

  const CREATURE_CARD_TEMPLATES = Object.freeze([
    { name: "Velociraptor", slug: "velociraptor", type: "Dinosaur", rarity: "Uncommon", attack: 48, power: 44, tagline: "Temple stalker", description: "Small, fast, and ferocious — a clever pack hunter that strikes like lightning." },
    { name: "King Cobra", slug: "king-cobra", type: "Dangerous Animal", rarity: "Common", attack: 42, power: 37, tagline: "Venom strike", description: "Hood flared and fangs ready, this jungle predator is pure menace." },
    { name: "Komodo Dragon", slug: "komodo-dragon", type: "Dangerous Animal", rarity: "Uncommon", attack: 51, power: 56, tagline: "Island terror", description: "Heavy, ancient, and relentless — a real-life dragon from volcanic shores." },
    { name: "Dilophosaurus", slug: "dilophosaurus", type: "Dinosaur", rarity: "Uncommon", attack: 45, power: 43, tagline: "Frill of fear", description: "A dramatic forest ambusher with a snarling face and a fan-like frill." },
    { name: "Giant Scorpion", slug: "giant-scorpion", type: "Prehistoric Beast", rarity: "Rare", attack: 58, power: 49, tagline: "Desert stinger", description: "An armoured nightmare from the sands, with crushing claws and a deadly tail." },
    { name: "Dire Wolf", slug: "dire-wolf", type: "Prehistoric Beast", rarity: "Uncommon", attack: 47, power: 50, tagline: "Moon howler", description: "A savage ice-age hunter with glowing eyes and a pack leader's fury." },
    { name: "Piranha Swarm", slug: "piranha-swarm", type: "Dangerous Animal", rarity: "Common", attack: 39, power: 34, tagline: "River frenzy", description: "Tiny fish, huge terror — a flashing red wave of teeth and panic." },
    { name: "Basilisk", slug: "basilisk", type: "Mythic Monster", rarity: "Epic", attack: 63, power: 68, tagline: "Gaze of doom", description: "A legendary serpent-monster from ruined temples and ancient fear." },
    { name: "Carnotaurus", slug: "carnotaurus", type: "Dinosaur", rarity: "Rare", attack: 61, power: 57, tagline: "Horned charger", description: "Fast, horned, and vicious — a storming predator built for chaos." },
    { name: "Giant Squid", slug: "giant-squid", type: "Sea Beast", rarity: "Rare", attack: 60, power: 62, tagline: "Abyss grabber", description: "A deep-sea terror with huge eyes and tentacles from the dark." },
    { name: "Allosaurus", slug: "allosaurus", type: "Dinosaur", rarity: "Rare", attack: 66, power: 61, tagline: "Jurassic ripper", description: "A muscular killer from the Jurassic, roaring across a rocky wasteland." },
    { name: "Smilodon", slug: "smilodon", type: "Prehistoric Beast", rarity: "Rare", attack: 59, power: 55, tagline: "Sabre ambush", description: "A sabre-toothed hunter exploding through snow with giant fangs first." },
    { name: "Saltwater Crocodile", slug: "saltwater-crocodile", type: "Dangerous Animal", rarity: "Rare", attack: 64, power: 60, tagline: "River ambusher", description: "Silent, ancient, and brutal — the king of muddy waters." },
    { name: "Manticore", slug: "manticore", type: "Mythic Monster", rarity: "Epic", attack: 71, power: 73, tagline: "Tail of ruin", description: "A fire-lit beast with lion claws, bat wings, and pure monster energy." },
    { name: "Baryonyx", slug: "baryonyx", type: "Dinosaur", rarity: "Rare", attack: 65, power: 63, tagline: "Marsh reaper", description: "A hooked-claw predator charging through swamp water on the hunt." },
    { name: "Great White Shark", slug: "great-white-shark", type: "Dangerous Animal", rarity: "Rare", attack: 68, power: 64, tagline: "Jaws of the deep", description: "The classic ocean nightmare, bursting upward with rows of teeth." },
    { name: "Terror Bird", slug: "terror-bird", type: "Prehistoric Beast", rarity: "Rare", attack: 62, power: 58, tagline: "Skyless slayer", description: "It cannot fly, but it can sprint down prey with a savage beak." },
    { name: "Minotaur", slug: "minotaur", type: "Mythic Monster", rarity: "Epic", attack: 74, power: 76, tagline: "Labyrinth crusher", description: "A towering bull-headed brute charging through torch-lit ruins." },
    { name: "Therizinosaurus", slug: "therizinosaurus", type: "Dinosaur", rarity: "Epic", attack: 72, power: 70, tagline: "Claw hurricane", description: "A bizarre giant with absurd scythe-like claws and a very bad attitude." },
    { name: "Anaconda", slug: "anaconda", type: "Dangerous Animal", rarity: "Uncommon", attack: 54, power: 58, tagline: "Jungle constrictor", description: "A thick, crushing snake coiled deep in the rainforest." },
    { name: "Quetzalcoatlus", slug: "quetzalcoatlus", type: "Flying Beast", rarity: "Epic", attack: 67, power: 78, tagline: "Sky titan", description: "A giant pterosaur gliding above ruined cliffs and storm clouds." },
    { name: "Polar Bear", slug: "polar-bear", type: "Dangerous Animal", rarity: "Rare", attack: 61, power: 67, tagline: "Icebreaker", description: "A hulking white predator that owns the frozen edge of the world." },
    { name: "Cerberus", slug: "cerberus", type: "Mythic Monster", rarity: "Epic", attack: 79, power: 80, tagline: "Triple-fanged guard", description: "Three snarling heads and not a hint of mercy." },
    { name: "Spinosaurus", slug: "spinosaurus", type: "Dinosaur", rarity: "Epic", attack: 80, power: 82, tagline: "Marsh titan", description: "A sail-backed river monster thundering through storm-soaked wetlands." },
    { name: "Orca", slug: "orca", type: "Dangerous Animal", rarity: "Epic", attack: 66, power: 74, tagline: "Blackwater strategist", description: "Beautiful, clever, and terrifying — a hunter that rules cold seas." },
    { name: "Titanoboa", slug: "titanoboa", type: "Prehistoric Beast", rarity: "Epic", attack: 77, power: 81, tagline: "Swamp colossus", description: "A prehistoric snake so huge it feels like the jungle itself is moving." },
    { name: "Chimera", slug: "chimera", type: "Mythic Monster", rarity: "Legendary", attack: 82, power: 84, tagline: "Three-beast nightmare", description: "A fire-breathing mash-up of monsters with zero interest in fairness." },
    { name: "Tyrannosaurus Rex", slug: "tyrannosaurus-rex", type: "Dinosaur", rarity: "Legendary", attack: 88, power: 87, tagline: "King of teeth", description: "The classic boss monster — thunderous steps, huge jaws, endless roar." },
    { name: "Sarcosuchus", slug: "sarcosuchus", type: "Prehistoric Beast", rarity: "Legendary", attack: 84, power: 83, tagline: "Super-croc", description: "A gigantic prehistoric crocodile crashing through ruined riverbanks." },
    { name: "Kraken", slug: "kraken", type: "Sea Monster", rarity: "Legendary", attack: 86, power: 88, tagline: "Deep-sea boss", description: "Tentacles rise around a doomed ship as the sea turns into chaos." },
    { name: "Ankylosaurus", slug: "ankylosaurus", type: "Dinosaur", rarity: "Epic", attack: 69, power: 79, tagline: "Club-tail tank", description: "A walking fortress packed with armour and a wrecking-ball tail." },
    { name: "Griffin", slug: "griffin", type: "Mythic Beast", rarity: "Legendary", attack: 78, power: 82, tagline: "Sky guardian", description: "An eagle-lion hybrid swooping over a golden ruined kingdom." },
    { name: "Giganotosaurus", slug: "giganotosaurus", type: "Dinosaur", rarity: "Legendary", attack: 90, power: 89, tagline: "Titan slayer", description: "A colossal apex predator roaring under a blood-red storm." },
    { name: "Megalodon", slug: "megalodon", type: "Sea Beast", rarity: "Legendary", attack: 89, power: 90, tagline: "Mega bite", description: "An absurdly huge shark launching out of a storm-tossed sea." },
    { name: "Hydra", slug: "hydra", type: "Mythic Monster", rarity: "Legendary", attack: 87, power: 92, tagline: "Heads of havoc", description: "A many-headed swamp terror that only gets worse the more you fight it." },
    { name: "Mosasaurus", slug: "mosasaurus", type: "Sea Beast", rarity: "Legendary", attack: 91, power: 93, tagline: "Ocean devourer", description: "A giant marine predator bursting from the surf with jaws wide open." },
    { name: "Yeti", slug: "yeti", type: "Monster", rarity: "Epic", attack: 73, power: 77, tagline: "Mountain phantom", description: "A hulking beast of ice and rage charging through an avalanche." },
    { name: "Triceratops", slug: "triceratops", type: "Dinosaur", rarity: "Epic", attack: 71, power: 81, tagline: "Horned guardian", description: "A massive three-horned powerhouse built to charge and smash." },
    { name: "Sea Serpent", slug: "sea-serpent", type: "Sea Monster", rarity: "Legendary", attack: 85, power: 86, tagline: "Storm coil", description: "A legendary serpent twisting through black waves and lightning." },
    { name: "Dragon", slug: "dragon", type: "Mythic Monster", rarity: "Mythic", attack: 95, power: 96, tagline: "Firestorm lord", description: "Wings wide, jaws blazing — the ultimate fire-breathing nightmare." },
    { name: "Indominus Rex", slug: "indominus-rex", type: "Hybrid Boss", rarity: "Mythic", attack: 99, power: 99, tagline: "Final boss hybrid", description: "The biggest, baddest fictional predator in the whole deck." }
  ].map((template) => ({
    ...template,
    art: `src/card-art/${template.slug}.webp`
  })));

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
    shopOpenTotal: document.querySelector("#shopOpenTotal"),
    nextShopText: document.querySelector("#nextShopText"),
    shopProgress: document.querySelector("#shopProgress"),
    shopStatusBadge: document.querySelector("#shopStatusBadge"),
    shopMessage: document.querySelector("#shopMessage"),
    shopFlash: document.querySelector("#shopFlash"),
    shopGrid: document.querySelector("#shopGrid"),
    collectionBadge: document.querySelector("#collectionBadge"),
    collectionGrid: document.querySelector("#collectionGrid"),
    shopCardTemplate: document.querySelector("#shopCardTemplate"),
    collectionCardTemplate: document.querySelector("#collectionCardTemplate")
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
    elements.refreshButton.addEventListener("click", selectNextWord);
    elements.shopGrid.addEventListener("click", handleShopClick);

    selectNextWord();
    renderStats();
    renderShop();
    renderCollection();
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
      version: 6,
      points: 0,
      lifetimePoints: 0,
      ownedCards: [],
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
    const legacyRaw = LEGACY_STORAGE_KEYS.map((key) => window.localStorage.getItem(key)).find(Boolean);
    const raw = currentRaw || legacyRaw;

    if (!raw) {
      return fallback;
    }

    try {
      const parsed = JSON.parse(raw);
      const loaded = {
        version: 6,
        points: Number.isFinite(parsed.points) ? Math.max(0, parsed.points) : 0,
        lifetimePoints: Number.isFinite(parsed.lifetimePoints) ? Math.max(0, parsed.lifetimePoints) : 0,
        ownedCards: Array.isArray(parsed.ownedCards) ? parsed.ownedCards : [],
        queue: Array.isArray(parsed.queue) ? parsed.queue : [],
        turn: Number.isFinite(parsed.turn) ? parsed.turn : 0,
        progress: parsed.progress && typeof parsed.progress === "object" ? parsed.progress : {}
      };

      const allowedWords = new Set(WORDS);
      Object.keys(loaded.progress).forEach((word) => {
        if (!allowedWords.has(word)) {
          delete loaded.progress[word];
        }
      });

      WORDS.forEach((word, index) => {
        const savedProgress = loaded.progress[word] || {};
        loaded.progress[word] = {
          ...makeBlankProgress(word),
          ...savedProgress,
          word,
          introduced: Boolean(savedProgress.introduced || savedProgress.mastered || Number(savedProgress.attempts || 0) > 0 || index < ACTIVE_WORD_TARGET),
          mastered: Boolean(savedProgress.mastered)
        };
      });

      loaded.ownedCards = sanitiseOwnedCards(loaded.ownedCards);
      loaded.lifetimePoints = Math.max(loaded.lifetimePoints, calculateEarnedPoints(loaded));
      cleanQueue(loaded);
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
    if (!window.confirm("Reset all spelling progress, points, and card purchases?")) {
      return;
    }

    state = makeInitialState();
    currentWord = null;
    clearAutoAdvance();
    clearFeedback();
    clearShopFlash();
    saveState();
    selectNextWord();
    renderStats();
    renderShop();
    renderCollection();
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

  function renderCurrentWord() {
    const points = scoreWord(currentWord);
    const progress = state.progress[currentWord];
    elements.wordLength.textContent = `Word length: ${currentWord.length} letters · worth ${points} ${pluralise(points, "point")}`;
    elements.contextClue.textContent = CONTEXT_CLUES[currentWord] || "";
    renderStreak(progress.correctStreak || 0);
  }

  function renderStreak(streak) {
    elements.streakEggs.innerHTML = "";
    for (let index = 1; index <= MASTERY_STREAK; index += 1) {
      const egg = document.createElement("span");
      egg.className = index <= streak ? "egg is-filled" : "egg";
      elements.streakEggs.appendChild(egg);
    }
  }

  function skipCurrentWord() {
    if (!currentWord) return;
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
      if (!progress || progress.mastered || seen.has(word)) return false;
      seen.add(word);
      progress.introduced = true;
      return true;
    });
  }

  function fillQueueToSize(targetState, targetSize) {
    cleanQueue(targetState);
    while (targetState.queue.length < targetSize) {
      const introducedWord = introduceNextWord(targetState);
      if (!introducedWord) break;
      targetState.queue.push(introducedWord);
    }
  }

  function introduceNextWord(targetState) {
    for (const word of WORDS) {
      const progress = targetState.progress[word];
      if (!progress || progress.mastered || progress.introduced) continue;
      progress.introduced = true;
      return word;
    }
    return null;
  }

  function removeWordFromQueue(word) {
    const index = state.queue.indexOf(word);
    if (index >= 0) state.queue.splice(index, 1);
  }

  function insertWordAfterGap(word, wordGap) {
    state.queue = state.queue.filter((queuedWord) => queuedWord !== word);
    fillQueueToSize(state, wordGap);
    const insertionIndex = Math.min(wordGap, state.queue.length);
    state.queue.splice(insertionIndex, 0, word);
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (!currentWord) return;

    const answer = normaliseAnswer(elements.answerInput.value);
    const progress = state.progress[currentWord];
    removeWordFromQueue(currentWord);
    progress.attempts += 1;
    progress.lastAttemptAt = Date.now();
    state.turn += 1;

    if (answer === currentWord) {
      handleCorrectAnswer(progress);
    } else {
      handleIncorrectAnswer(progress, answer);
    }

    fillQueueToSize(state, ACTIVE_WORD_TARGET);
    saveState();
    renderStats();
    renderShop();
    renderCollection();
    lockPracticeControls();
    autoAdvanceTimer = window.setTimeout(selectNextWord, AUTO_ADVANCE_MS);
  }

  function handleCorrectAnswer(progress) {
    const earnedPoints = scoreWord(progress.word);
    progress.correctAttempts += 1;
    progress.correctStreak = Math.min(MASTERY_STREAK, Number(progress.correctStreak || 0) + 1);
    state.points += earnedPoints;
    state.lifetimePoints += earnedPoints;

    if (progress.correctStreak >= MASTERY_STREAK && !progress.mastered) {
      progress.mastered = true;
      progress.masteredAt = Date.now();
      setFeedback(`Correct! +${earnedPoints} ${pluralise(earnedPoints, "point")}. You mastered “${progress.word}”.`, "success");
      return;
    }

    const wordGap = progress.correctStreak === 1 ? FIRST_CORRECT_REVIEW_GAP : SECOND_CORRECT_REVIEW_GAP;
    insertWordAfterGap(progress.word, wordGap);
    setFeedback(`Correct! +${earnedPoints} ${pluralise(earnedPoints, "point")}. “${progress.word}” is now on a ${progress.correctStreak}/${MASTERY_STREAK} streak.`, "success");
  }

  function handleIncorrectAnswer(progress, answer) {
    progress.correctStreak = 0;
    insertWordAfterGap(progress.word, WRONG_REVIEW_GAP);
    setFeedback(`Not quite. ${answer ? `You typed “${answer}”. ` : ""}The word was “${progress.word}”. It will come back soon.`, "error");
  }

  function renderStats() {
    const masteredCount = WORDS.filter((word) => state.progress[word].mastered).length;
    const ownedCount = state.ownedCards.length;
    const availableCount = getAvailableCardCount();
    const nextExpansionTarget = getNextShopExpansionTarget();

    elements.pointsTotal.textContent = state.points;
    elements.masteredTotal.textContent = masteredCount;
    elements.cardsTotal.textContent = ownedCount;
    elements.shopOpenTotal.textContent = `${availableCount}/${CREATURE_CARD_TEMPLATES.length}`;

    if (nextExpansionTarget === null) {
      elements.nextShopText.textContent = "All cards released";
      elements.shopProgress.style.width = "100%";
    } else {
      const progress = clamp(state.ownedCards.length, 0, nextExpansionTarget);
      elements.nextShopText.textContent = `${progress} / ${nextExpansionTarget} owned`;
      elements.shopProgress.style.width = `${(progress / nextExpansionTarget) * 100}%`;
    }

    renderDueBadge();
  }

  function renderDueBadge() {
    elements.dueCount.textContent = `${state.queue.length} queued`;
  }

  function renderShop() {
    const availableCount = getAvailableCardCount();
    const nextExpansionTarget = getNextShopExpansionTarget();
    const ownedSet = new Set(state.ownedCards.map((card) => card.index));

    elements.shopGrid.innerHTML = "";
    elements.shopStatusBadge.textContent = `${availableCount} available now`;

    if (nextExpansionTarget === null) {
      elements.shopMessage.textContent = `All ${CREATURE_CARD_TEMPLATES.length} cards are open in the shop.`;
    } else {
      const needed = Math.max(0, nextExpansionTarget - state.ownedCards.length);
      elements.shopMessage.textContent = needed === 1
        ? "Buy 1 more card and the next wave will unlock."
        : `Buy ${needed} more cards and the next wave will unlock.`;
    }

    CREATURE_CARD_TEMPLATES.forEach((template, index) => {
      const released = index < availableCount;
      const owned = ownedSet.has(index);
      const affordable = state.points >= CARD_COST;
      const node = elements.shopCardTemplate.content.cloneNode(true);
      const article = node.querySelector(".monster-card");
      const button = node.querySelector("button");

      if (released) {
        populateCardNode(node, template, `Card ${index + 1} of ${CREATURE_CARD_TEMPLATES.length}`);
        button.dataset.cardIndex = String(index);

        if (owned) {
          article.classList.add("is-owned");
          button.textContent = "Owned";
          button.disabled = true;
        } else if (!affordable) {
          article.classList.add("is-unaffordable");
          button.textContent = `Need ${CARD_COST}`;
          button.disabled = true;
        } else {
          button.textContent = `Buy for ${CARD_COST}`;
          button.disabled = false;
        }
      } else {
        article.classList.add("is-locked");
        article.querySelector(".monster-card__image").removeAttribute("src");
        article.querySelector(".monster-card__image").alt = "";
        article.querySelector(".monster-card__art-badge").textContent = "Locked";
        article.querySelector(".monster-card__tagline").textContent = "Future creature";
        article.querySelector(".monster-card__type").textContent = "Locked";
        article.querySelector(".monster-card__rarity-pill").textContent = "???";
        article.querySelector(".monster-card__title").textContent = "???";
        article.querySelector(".monster-card__description").textContent = "Buy more cards to reveal the next wave of terrifying creatures.";
        article.querySelector(".monster-card__attack").textContent = "—";
        article.querySelector(".monster-card__power").textContent = "—";
        article.querySelector(".monster-card__rarity-short").textContent = "—";
        article.querySelector(".monster-card__meta").textContent = "Locked";
        article.querySelector(".monster-card__cost").textContent = "—";
        button.textContent = "Locked";
        button.disabled = true;
      }

      elements.shopGrid.appendChild(node);
    });
  }

  function renderCollection() {
    elements.collectionGrid.innerHTML = "";

    if (state.ownedCards.length === 0) {
      const empty = document.createElement("p");
      empty.className = "empty-album";
      empty.textContent = "No cards bought yet. Keep spelling words correctly and spend your points in the shop.";
      elements.collectionGrid.appendChild(empty);
      elements.collectionBadge.textContent = "No cards yet";
      return;
    }

    const latestTemplate = CREATURE_CARD_TEMPLATES[state.ownedCards[state.ownedCards.length - 1].index];
    elements.collectionBadge.textContent = `Latest: ${latestTemplate.name}`;

    state.ownedCards.slice().sort((a, b) => b.purchasedAt - a.purchasedAt).forEach((ownedCard) => {
      const template = CREATURE_CARD_TEMPLATES[ownedCard.index];
      const node = elements.collectionCardTemplate.content.cloneNode(true);
      populateCardNode(node, template, `Owned · Card ${ownedCard.index + 1}`);
      node.querySelector(".monster-card__cost").textContent = "Owned";
      elements.collectionGrid.appendChild(node);
    });
  }

  function populateCardNode(node, template, metaText) {
    const image = node.querySelector(".monster-card__image");
    image.src = template.art;
    image.alt = `${template.name} card artwork`;
    image.loading = "lazy";

    node.querySelector(".monster-card__art-badge").textContent = template.rarity;
    node.querySelector(".monster-card__tagline").textContent = template.tagline;
    node.querySelector(".monster-card__type").textContent = template.type;
    node.querySelector(".monster-card__rarity-pill").textContent = template.rarity;
    node.querySelector(".monster-card__title").textContent = template.name;
    node.querySelector(".monster-card__description").textContent = template.description;
    node.querySelector(".monster-card__attack").textContent = template.attack;
    node.querySelector(".monster-card__power").textContent = template.power;
    node.querySelector(".monster-card__rarity-short").textContent = shortRarity(template.rarity);
    node.querySelector(".monster-card__meta").textContent = metaText;
    node.querySelector(".monster-card__cost").textContent = `${CARD_COST} pts`;
  }

  function handleShopClick(event) {
    const button = event.target.closest("button[data-card-index]");
    if (!button) return;
    buyCard(Number(button.dataset.cardIndex));
  }

  function buyCard(cardIndex) {
    const availableCount = getAvailableCardCount();
    const ownedSet = new Set(state.ownedCards.map((card) => card.index));

    if (!Number.isInteger(cardIndex) || cardIndex < 0 || cardIndex >= availableCount) {
      setShopFlash("That card is not available yet.", "error");
      return;
    }
    if (ownedSet.has(cardIndex)) {
      setShopFlash("You already own that card.", "info");
      return;
    }
    if (state.points < CARD_COST) {
      const missing = CARD_COST - state.points;
      setShopFlash(`You need ${missing} more ${pluralise(missing, "point")} to buy that card.`, "error");
      return;
    }

    const before = availableCount;
    state.points -= CARD_COST;
    state.ownedCards.push({ index: cardIndex, purchasedAt: Date.now() });

    const after = getAvailableCardCount();
    const unlockedMore = after > before;
    saveState();
    renderStats();
    renderShop();
    renderCollection();

    const template = CREATURE_CARD_TEMPLATES[cardIndex];
    setShopFlash(`Bought ${template.name} for ${CARD_COST} points.${unlockedMore ? " Ten more cards just unlocked!" : ""}`, "success");
  }

  function getAvailableCardCount() {
    const totalCards = CREATURE_CARD_TEMPLATES.length;
    const ownedCount = state.ownedCards.length;
    const wavesOpen = Math.floor((ownedCount + SHOP_REMAINING_TRIGGER) / SHOP_BATCH_SIZE) + 1;
    return clamp(INITIAL_SHOP_SIZE + (wavesOpen - 1) * SHOP_BATCH_SIZE, INITIAL_SHOP_SIZE, totalCards);
  }

  function getNextShopExpansionTarget() {
    const availableCount = getAvailableCardCount();
    if (availableCount >= CREATURE_CARD_TEMPLATES.length) return null;
    return availableCount - SHOP_REMAINING_TRIGGER;
  }

  function sanitiseOwnedCards(cards) {
    const seen = new Set();
    return cards
      .filter((card) => card && typeof card === "object")
      .map((card) => ({ index: Number(card.index), purchasedAt: Number(card.purchasedAt) || Date.now() }))
      .filter((card) => Number.isInteger(card.index) && card.index >= 0 && card.index < CREATURE_CARD_TEMPLATES.length && !seen.has(card.index) && seen.add(card.index))
      .sort((a, b) => a.purchasedAt - b.purchasedAt);
  }

  function scoreWord(word) {
    return Math.max(1, word.length - 2);
  }

  function calculateEarnedPoints(targetState) {
    return WORDS.reduce((total, word) => {
      const progress = targetState.progress[word];
      const correctAttempts = Number(progress && progress.correctAttempts ? progress.correctAttempts : 0);
      return total + Math.max(0, correctAttempts) * scoreWord(word);
    }, 0);
  }

  function showHint() {
    if (!currentWord) return;
    const progress = state.progress[currentWord];
    const pattern = currentWord.split("").map((letter, index) => {
      if (index === 0) return letter;
      if (progress.correctStreak >= 2 && index === currentWord.length - 1) return letter;
      return "·";
    }).join(" ");
    elements.hintText.textContent = `Hint: starts with “${currentWord.charAt(0)}”. Pattern: ${pattern}`;
  }

  function speakCurrentWord() {
    if (!currentWord) return;
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

  function renderRestingState() {
    elements.practicePanel.hidden = true;
    elements.restingPanel.hidden = false;
    elements.nextDueText.textContent = "You mastered every word in the deck. Great work! You can still spend your points in the shop.";
  }

  function normaliseAnswer(value) {
    return value.trim().toLowerCase().replace(/[^a-z]/g, "");
  }

  function shortRarity(rarity) {
    return ({ Common: "C", Uncommon: "UC", Rare: "R", Epic: "EP", Legendary: "LG", Mythic: "MY" }[rarity] || rarity.slice(0, 2).toUpperCase());
  }

  function pluralise(count, singular) {
    return `${singular}${count === 1 ? "" : "s"}`;
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function setFeedback(message, type) {
    elements.feedback.textContent = message;
    elements.feedback.className = `feedback is-${type}`;
  }

  function clearFeedback() {
    elements.feedback.textContent = "";
    elements.feedback.className = "feedback";
  }

  function setShopFlash(message, type) {
    elements.shopFlash.textContent = message;
    elements.shopFlash.className = `feedback is-${type}`;
  }

  function clearShopFlash() {
    elements.shopFlash.textContent = "";
    elements.shopFlash.className = "feedback";
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
}());
