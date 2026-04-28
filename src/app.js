(function () {
  "use strict";

  const WORD_BANKS = {
    normal: window.SPELLING_WORDS || [],
    hard: window.HARD_SPELLING_WORDS || []
  };
  const MODE_STORAGE_KEY = "dino-speller-mode";
  const DEFAULT_MODE = "normal";
  let currentMode = getInitialMode();
  let WORDS = WORD_BANKS[currentMode] || WORD_BANKS.normal;

  const BASE_STORAGE_KEY = "dino-speller-state-v8";
  const VOICE_STORAGE_KEY = "dino-speller-preferred-voice";
  const LEGACY_STORAGE_KEYS = [
    "dino-speller-state-v6",
    "dino-speller-state-v5",
    "dino-speller-state-v4",
    "dino-speller-state-v3",
    "dino-speller-state-v2",
    "dino-speller-state-v1"
  ];

  const MASTERY_STREAK = 3;
  const CARD_PRICE_STEP = 5;
  const CARD_PRICE_GROUP_SIZE = 5;
  const INITIAL_SHOP_SIZE = 10;
  const SHOP_BATCH_SIZE = 10;
  const SHOP_REMAINING_TRIGGER = 5;
  const ACTIVE_WORD_TARGET = 5;
  const FIRST_CORRECT_REVIEW_GAP = 4;
  const SECOND_CORRECT_REVIEW_GAP = 8;
  const WRONG_REVIEW_GAP = 2;
  const AUTO_ADVANCE_MS = 1500;
  const WRONG_AUTO_ADVANCE_MS = 6500;

  const CREATURE_CARD_TEMPLATES = Object.freeze([
    {
        "name": "Velociraptor",
        "slug": "velociraptor",
        "type": "Dinosaur",
        "rarity": "Uncommon",
        "attack": 48,
        "power": 44,
        "tagline": "Temple stalker",
        "description": "Small, fast, and ferocious — a clever pack hunter that strikes like lightning.",
        "art": "src/card-art/velociraptor.webp"
    },
    {
        "name": "King Cobra",
        "slug": "king-cobra",
        "type": "Dangerous Animal",
        "rarity": "Common",
        "attack": 42,
        "power": 37,
        "tagline": "Venom strike",
        "description": "Hood flared and fangs ready, this jungle predator is pure menace.",
        "art": "src/card-art/king-cobra.webp"
    },
    {
        "name": "Komodo Dragon",
        "slug": "komodo-dragon",
        "type": "Dangerous Animal",
        "rarity": "Uncommon",
        "attack": 51,
        "power": 56,
        "tagline": "Island terror",
        "description": "Heavy, ancient, and relentless — a real-life dragon from volcanic shores.",
        "art": "src/card-art/komodo-dragon.webp"
    },
    {
        "name": "Dilophosaurus",
        "slug": "dilophosaurus",
        "type": "Dinosaur",
        "rarity": "Uncommon",
        "attack": 45,
        "power": 43,
        "tagline": "Frill of fear",
        "description": "A dramatic forest ambusher with a snarling face and a fan-like frill.",
        "art": "src/card-art/dilophosaurus.webp"
    },
    {
        "name": "Giant Scorpion",
        "slug": "giant-scorpion",
        "type": "Prehistoric Beast",
        "rarity": "Rare",
        "attack": 58,
        "power": 49,
        "tagline": "Desert stinger",
        "description": "An armoured nightmare from the sands, with crushing claws and a deadly tail.",
        "art": "src/card-art/giant-scorpion.webp"
    },
    {
        "name": "Dire Wolf",
        "slug": "dire-wolf",
        "type": "Prehistoric Beast",
        "rarity": "Uncommon",
        "attack": 47,
        "power": 50,
        "tagline": "Moon howler",
        "description": "A savage ice-age hunter with glowing eyes and a pack leader's fury.",
        "art": "src/card-art/dire-wolf.webp"
    },
    {
        "name": "Piranha Swarm",
        "slug": "piranha-swarm",
        "type": "Dangerous Animal",
        "rarity": "Common",
        "attack": 39,
        "power": 34,
        "tagline": "River frenzy",
        "description": "Tiny fish, huge terror — a flashing red wave of teeth and panic.",
        "art": "src/card-art/piranha-swarm.webp"
    },
    {
        "name": "Basilisk",
        "slug": "basilisk",
        "type": "Mythic Monster",
        "rarity": "Epic",
        "attack": 63,
        "power": 68,
        "tagline": "Gaze of doom",
        "description": "A legendary serpent-monster from ruined temples and ancient fear.",
        "art": "src/card-art/basilisk.webp"
    },
    {
        "name": "Carnotaurus",
        "slug": "carnotaurus",
        "type": "Dinosaur",
        "rarity": "Rare",
        "attack": 61,
        "power": 57,
        "tagline": "Horned charger",
        "description": "Fast, horned, and vicious — a storming predator built for chaos.",
        "art": "src/card-art/carnotaurus.webp"
    },
    {
        "name": "Giant Squid",
        "slug": "giant-squid",
        "type": "Sea Beast",
        "rarity": "Rare",
        "attack": 60,
        "power": 62,
        "tagline": "Abyss grabber",
        "description": "A deep-sea terror with huge eyes and tentacles from the dark.",
        "art": "src/card-art/giant-squid.webp"
    },
    {
        "name": "Allosaurus",
        "slug": "allosaurus",
        "type": "Dinosaur",
        "rarity": "Rare",
        "attack": 66,
        "power": 61,
        "tagline": "Jurassic ripper",
        "description": "A muscular killer from the Jurassic, roaring across a rocky wasteland.",
        "art": "src/card-art/allosaurus.webp"
    },
    {
        "name": "Smilodon",
        "slug": "smilodon",
        "type": "Prehistoric Beast",
        "rarity": "Rare",
        "attack": 59,
        "power": 55,
        "tagline": "Sabre ambush",
        "description": "A sabre-toothed hunter exploding through snow with giant fangs first.",
        "art": "src/card-art/smilodon.webp"
    },
    {
        "name": "Saltwater Crocodile",
        "slug": "saltwater-crocodile",
        "type": "Dangerous Animal",
        "rarity": "Rare",
        "attack": 64,
        "power": 60,
        "tagline": "River ambusher",
        "description": "Silent, ancient, and brutal — the king of muddy waters.",
        "art": "src/card-art/saltwater-crocodile.webp"
    },
    {
        "name": "Manticore",
        "slug": "manticore",
        "type": "Mythic Monster",
        "rarity": "Epic",
        "attack": 71,
        "power": 73,
        "tagline": "Tail of ruin",
        "description": "A fire-lit beast with lion claws, bat wings, and pure monster energy.",
        "art": "src/card-art/manticore.webp"
    },
    {
        "name": "Baryonyx",
        "slug": "baryonyx",
        "type": "Dinosaur",
        "rarity": "Rare",
        "attack": 65,
        "power": 63,
        "tagline": "Marsh reaper",
        "description": "A hooked-claw predator charging through swamp water on the hunt.",
        "art": "src/card-art/baryonyx.webp"
    },
    {
        "name": "Great White Shark",
        "slug": "great-white-shark",
        "type": "Dangerous Animal",
        "rarity": "Rare",
        "attack": 68,
        "power": 64,
        "tagline": "Jaws of the deep",
        "description": "The classic ocean nightmare, bursting upward with rows of teeth.",
        "art": "src/card-art/great-white-shark.webp"
    },
    {
        "name": "Terror Bird",
        "slug": "terror-bird",
        "type": "Prehistoric Beast",
        "rarity": "Rare",
        "attack": 62,
        "power": 58,
        "tagline": "Skyless slayer",
        "description": "It cannot fly, but it can sprint down prey with a savage beak.",
        "art": "src/card-art/terror-bird.webp"
    },
    {
        "name": "Minotaur",
        "slug": "minotaur",
        "type": "Mythic Monster",
        "rarity": "Epic",
        "attack": 74,
        "power": 76,
        "tagline": "Labyrinth crusher",
        "description": "A towering bull-headed brute charging through torch-lit ruins.",
        "art": "src/card-art/minotaur.webp"
    },
    {
        "name": "Therizinosaurus",
        "slug": "therizinosaurus",
        "type": "Dinosaur",
        "rarity": "Epic",
        "attack": 72,
        "power": 70,
        "tagline": "Claw hurricane",
        "description": "A bizarre giant with absurd scythe-like claws and a very bad attitude.",
        "art": "src/card-art/therizinosaurus.webp"
    },
    {
        "name": "Anaconda",
        "slug": "anaconda",
        "type": "Dangerous Animal",
        "rarity": "Uncommon",
        "attack": 54,
        "power": 58,
        "tagline": "Jungle constrictor",
        "description": "A thick, crushing snake coiled deep in the rainforest.",
        "art": "src/card-art/anaconda.webp"
    },
    {
        "name": "Quetzalcoatlus",
        "slug": "quetzalcoatlus",
        "type": "Flying Beast",
        "rarity": "Epic",
        "attack": 67,
        "power": 78,
        "tagline": "Sky titan",
        "description": "A giant pterosaur gliding above ruined cliffs and storm clouds.",
        "art": "src/card-art/quetzalcoatlus.webp"
    },
    {
        "name": "Polar Bear",
        "slug": "polar-bear",
        "type": "Dangerous Animal",
        "rarity": "Rare",
        "attack": 61,
        "power": 67,
        "tagline": "Icebreaker",
        "description": "A hulking white predator that owns the frozen edge of the world.",
        "art": "src/card-art/polar-bear.webp"
    },
    {
        "name": "Cerberus",
        "slug": "cerberus",
        "type": "Mythic Monster",
        "rarity": "Epic",
        "attack": 79,
        "power": 80,
        "tagline": "Triple-fanged guard",
        "description": "Three snarling heads and not a hint of mercy.",
        "art": "src/card-art/cerberus.webp"
    },
    {
        "name": "Spinosaurus",
        "slug": "spinosaurus",
        "type": "Dinosaur",
        "rarity": "Epic",
        "attack": 80,
        "power": 82,
        "tagline": "Marsh titan",
        "description": "A sail-backed river monster thundering through storm-soaked wetlands.",
        "art": "src/card-art/spinosaurus.webp"
    },
    {
        "name": "Orca",
        "slug": "orca",
        "type": "Dangerous Animal",
        "rarity": "Epic",
        "attack": 66,
        "power": 74,
        "tagline": "Blackwater strategist",
        "description": "Beautiful, clever, and terrifying — a hunter that rules cold seas.",
        "art": "src/card-art/orca.webp"
    },
    {
        "name": "Titanoboa",
        "slug": "titanoboa",
        "type": "Prehistoric Beast",
        "rarity": "Epic",
        "attack": 77,
        "power": 81,
        "tagline": "Swamp colossus",
        "description": "A prehistoric snake so huge it feels like the jungle itself is moving.",
        "art": "src/card-art/titanoboa.webp"
    },
    {
        "name": "Chimera",
        "slug": "chimera",
        "type": "Mythic Monster",
        "rarity": "Legendary",
        "attack": 82,
        "power": 84,
        "tagline": "Three-beast nightmare",
        "description": "A fire-breathing mash-up of monsters with zero interest in fairness.",
        "art": "src/card-art/chimera.webp"
    },
    {
        "name": "Tyrannosaurus Rex",
        "slug": "tyrannosaurus-rex",
        "type": "Dinosaur",
        "rarity": "Legendary",
        "attack": 88,
        "power": 87,
        "tagline": "King of teeth",
        "description": "The classic boss monster — thunderous steps, huge jaws, endless roar.",
        "art": "src/card-art/tyrannosaurus-rex.webp"
    },
    {
        "name": "Sarcosuchus",
        "slug": "sarcosuchus",
        "type": "Prehistoric Beast",
        "rarity": "Legendary",
        "attack": 84,
        "power": 83,
        "tagline": "Super-croc",
        "description": "A gigantic prehistoric crocodile crashing through ruined riverbanks.",
        "art": "src/card-art/sarcosuchus.webp"
    },
    {
        "name": "Kraken",
        "slug": "kraken",
        "type": "Sea Monster",
        "rarity": "Legendary",
        "attack": 86,
        "power": 88,
        "tagline": "Deep-sea boss",
        "description": "Tentacles rise around a doomed ship as the sea turns into chaos.",
        "art": "src/card-art/kraken.webp"
    },
    {
        "name": "Ankylosaurus",
        "slug": "ankylosaurus",
        "type": "Dinosaur",
        "rarity": "Epic",
        "attack": 69,
        "power": 79,
        "tagline": "Club-tail tank",
        "description": "A walking fortress packed with armour and a wrecking-ball tail.",
        "art": "src/card-art/ankylosaurus.webp"
    },
    {
        "name": "Griffin",
        "slug": "griffin",
        "type": "Mythic Beast",
        "rarity": "Legendary",
        "attack": 78,
        "power": 82,
        "tagline": "Sky guardian",
        "description": "An eagle-lion hybrid swooping over a golden ruined kingdom.",
        "art": "src/card-art/griffin.webp"
    },
    {
        "name": "Giganotosaurus",
        "slug": "giganotosaurus",
        "type": "Dinosaur",
        "rarity": "Legendary",
        "attack": 90,
        "power": 89,
        "tagline": "Titan slayer",
        "description": "A colossal apex predator roaring under a blood-red storm.",
        "art": "src/card-art/giganotosaurus.webp"
    },
    {
        "name": "Megalodon",
        "slug": "megalodon",
        "type": "Sea Beast",
        "rarity": "Legendary",
        "attack": 89,
        "power": 90,
        "tagline": "Mega bite",
        "description": "An absurdly huge shark launching out of a storm-tossed sea.",
        "art": "src/card-art/megalodon.webp"
    },
    {
        "name": "Hydra",
        "slug": "hydra",
        "type": "Mythic Monster",
        "rarity": "Legendary",
        "attack": 87,
        "power": 92,
        "tagline": "Heads of havoc",
        "description": "A many-headed swamp terror that only gets worse the more you fight it.",
        "art": "src/card-art/hydra.webp"
    },
    {
        "name": "Mosasaurus",
        "slug": "mosasaurus",
        "type": "Sea Beast",
        "rarity": "Legendary",
        "attack": 91,
        "power": 93,
        "tagline": "Ocean devourer",
        "description": "A giant marine predator bursting from the surf with jaws wide open.",
        "art": "src/card-art/mosasaurus.webp"
    },
    {
        "name": "Yeti",
        "slug": "yeti",
        "type": "Monster",
        "rarity": "Epic",
        "attack": 73,
        "power": 77,
        "tagline": "Mountain phantom",
        "description": "A hulking beast of ice and rage charging through an avalanche.",
        "art": "src/card-art/yeti.webp"
    },
    {
        "name": "Triceratops",
        "slug": "triceratops",
        "type": "Dinosaur",
        "rarity": "Epic",
        "attack": 71,
        "power": 81,
        "tagline": "Horned guardian",
        "description": "A massive three-horned powerhouse built to charge and smash.",
        "art": "src/card-art/triceratops.webp"
    },
    {
        "name": "Sea Serpent",
        "slug": "sea-serpent",
        "type": "Sea Monster",
        "rarity": "Legendary",
        "attack": 85,
        "power": 86,
        "tagline": "Storm coil",
        "description": "A legendary serpent twisting through black waves and lightning.",
        "art": "src/card-art/sea-serpent.webp"
    },
    {
        "name": "Dragon",
        "slug": "dragon",
        "type": "Mythic Monster",
        "rarity": "Mythic",
        "attack": 95,
        "power": 96,
        "tagline": "Firestorm lord",
        "description": "Wings wide, jaws blazing — the ultimate fire-breathing nightmare.",
        "art": "src/card-art/dragon.webp"
    },
    {
        "name": "Indominus Rex",
        "slug": "indominus-rex",
        "type": "Hybrid Boss",
        "rarity": "Mythic",
        "attack": 99,
        "power": 99,
        "tagline": "Final boss hybrid",
        "description": "The biggest, baddest fictional predator in the whole deck.",
        "art": "src/card-art/indominus-rex.webp"
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
    modeSelect: document.querySelector("#modeSelect"),
    modeWordTotal: document.querySelector("#modeWordTotal"),
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
    voiceControl: document.querySelector("#voiceControl"),
    voiceSelect: document.querySelector("#voiceSelect"),
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
  let availableVoices = [];
  let lastPurchasedIndex = null;

  initialise();

  function initialise() {
    elements.form.addEventListener("submit", handleSubmit);
    elements.speakButton.addEventListener("click", speakCurrentWord);
    elements.hintButton.addEventListener("click", showHint);
    elements.skipButton.addEventListener("click", skipCurrentWord);
    elements.resetButton.addEventListener("click", resetProgress);
    elements.refreshButton.addEventListener("click", selectNextWord);
    elements.shopGrid.addEventListener("click", handleShopClick);
    elements.modeSelect.addEventListener("change", handleModeChange);

    setupModeSelector();
    setupVoicePicker();
    selectNextWord();
    renderStats();
    renderShop();
    renderCollection();
    renderDueBadge();
  }

  function getInitialMode() {
    const savedMode = window.localStorage.getItem(MODE_STORAGE_KEY);
    return WORD_BANKS[savedMode] ? savedMode : DEFAULT_MODE;
  }

  function getStorageKey() {
    return `${BASE_STORAGE_KEY}-${currentMode}`;
  }

  function getModeLabel(mode) {
    return mode === "hard" ? "Hard mode" : "Normal mode";
  }

  function setupModeSelector() {
    elements.modeSelect.value = currentMode;
    elements.modeWordTotal.textContent = `${getModeLabel(currentMode)} · ${WORDS.length} words`;
  }

  function handleModeChange() {
    const nextMode = WORD_BANKS[elements.modeSelect.value] ? elements.modeSelect.value : DEFAULT_MODE;
    if (nextMode === currentMode) {
      return;
    }

    currentMode = nextMode;
    WORDS = WORD_BANKS[currentMode] || WORD_BANKS.normal;
    window.localStorage.setItem(MODE_STORAGE_KEY, currentMode);
    state = loadState();
    currentWord = null;
    lastPurchasedIndex = null;
    clearAutoAdvance();
    clearFeedback();
    clearShopFlash();
    selectNextWord();
    renderStats();
    renderShop();
    renderCollection();
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
      version: 7,
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
    const currentRaw = window.localStorage.getItem(getStorageKey());
    const legacyRaw = LEGACY_STORAGE_KEYS
      .map((key) => window.localStorage.getItem(key))
      .find((value) => Boolean(value));
    const raw = currentRaw || legacyRaw;

    if (!raw) {
      return fallback;
    }

    try {
      const parsed = JSON.parse(raw);
      const loaded = {
        version: 7,
        points: Number.isFinite(parsed.points) ? Math.max(0, parsed.points) : 0,
        lifetimePoints: Number.isFinite(parsed.lifetimePoints) ? Math.max(0, parsed.lifetimePoints) : 0,
        ownedCards: Array.isArray(parsed.ownedCards) ? parsed.ownedCards : [],
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

      WORDS.forEach((word, index) => {
        const savedProgress = loaded.progress[word] || {};
        loaded.progress[word] = {
          ...makeBlankProgress(word),
          ...savedProgress,
          word,
          introduced: Boolean(
            savedProgress.introduced ||
            savedProgress.mastered ||
            Number(savedProgress.attempts || 0) > 0 ||
            index < ACTIVE_WORD_TARGET
          ),
          mastered: Boolean(savedProgress.mastered)
        };
      });

      if (!Array.isArray(parsed.ownedCards) && Array.isArray(parsed.cards)) {
        const earnedPoints = calculateEarnedPoints(loaded) || Number(parsed.points) || 0;
        const safeLegacyCards = clamp(parsed.cards.length, 0, CREATURE_CARD_TEMPLATES.length);
        loaded.ownedCards = Array.from({ length: safeLegacyCards }, (_, index) => ({
          index,
          purchasedAt: Date.now() + index
        }));
        loaded.lifetimePoints = earnedPoints;
        loaded.points = Math.max(0, earnedPoints - calculateOwnedCardCost(safeLegacyCards));
      } else {
        loaded.ownedCards = sanitiseOwnedCards(loaded.ownedCards);
        loaded.lifetimePoints = Math.max(loaded.lifetimePoints, calculateEarnedPoints(loaded));
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

      fillQueueToSize(loaded, ACTIVE_WORD_TARGET);
      return loaded;
    } catch (error) {
      console.warn("Could not read saved progress. Starting fresh.", error);
      return fallback;
    }
  }

  function saveState() {
    window.localStorage.setItem(getStorageKey(), JSON.stringify(state));
  }

  function resetProgress() {
    if (!window.confirm(`Reset all ${getModeLabel(currentMode)} progress, points, and card purchases?`)) {
      return;
    }

    state = makeInitialState();
    currentWord = null;
    lastPurchasedIndex = null;
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
    state.turn += 1;

    const wasCorrect = answer === currentWord;
    if (wasCorrect) {
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
    autoAdvanceTimer = window.setTimeout(selectNextWord, wasCorrect ? AUTO_ADVANCE_MS : WRONG_AUTO_ADVANCE_MS);
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
    elements.modeWordTotal.textContent = `${getModeLabel(currentMode)} · ${WORDS.length} words`;

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
      const cardCost = getCardCost(index);
      const affordable = state.points >= cardCost;
      const node = elements.shopCardTemplate.content.cloneNode(true);
      const article = node.querySelector(".monster-card");
      const button = node.querySelector("button");

      if (released && owned) {
        populateRevealedCardNode(node, template, `Card ${index + 1} of ${CREATURE_CARD_TEMPLATES.length}`, getCardCost(index));
        article.classList.add("is-owned");
        if (index === lastPurchasedIndex) {
          article.classList.add("is-flipping");
          window.setTimeout(() => {
            lastPurchasedIndex = null;
          }, 950);
        }
        button.textContent = "Owned";
        button.disabled = true;
      } else if (released) {
        populateMysteryCardNode(node, template, `Card ${index + 1} of ${CREATURE_CARD_TEMPLATES.length}`, cardCost);
        article.classList.add("is-mystery");
        button.dataset.cardIndex = String(index);
        if (affordable) {
          button.textContent = `Buy for ${cardCost}`;
          button.disabled = false;
        } else {
          button.textContent = `Need ${cardCost}`;
          button.disabled = true;
          article.classList.add("is-unaffordable");
        }
      } else {
        populateLockedCardNode(node);
        article.classList.add("is-locked");
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

    state.ownedCards
      .slice()
      .sort((a, b) => b.purchasedAt - a.purchasedAt)
      .forEach((ownedCard) => {
        const template = CREATURE_CARD_TEMPLATES[ownedCard.index];
        const node = elements.collectionCardTemplate.content.cloneNode(true);
        populateRevealedCardNode(node, template, `Owned · Card ${ownedCard.index + 1}`, getCardCost(ownedCard.index));
        node.querySelector(".monster-card__cost").textContent = "Owned";
        elements.collectionGrid.appendChild(node);
      });
  }

  function populateRevealedCardNode(node, template, metaText, cardCost) {
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
    node.querySelector(".monster-card__cost").textContent = `${cardCost} pts`;
  }

  function populateMysteryCardNode(node, template, metaText, cardCost) {
    const image = node.querySelector(".monster-card__image");
    image.removeAttribute("src");
    image.alt = "";

    node.querySelector(".monster-card__art-badge").textContent = "?";
    node.querySelector(".monster-card__tagline").textContent = "Mystery card";
    node.querySelector(".monster-card__type").textContent = "Hidden";
    node.querySelector(".monster-card__rarity-pill").textContent = "???";
    node.querySelector(".monster-card__title").textContent = template.name;
    node.querySelector(".monster-card__description").textContent = "Buy this card to flip it over and reveal the artwork, rarity, ATK, and PWR.";
    node.querySelector(".monster-card__attack").textContent = "?";
    node.querySelector(".monster-card__power").textContent = "?";
    node.querySelector(".monster-card__rarity-short").textContent = "?";
    node.querySelector(".monster-card__meta").textContent = metaText;
    node.querySelector(".monster-card__cost").textContent = `${cardCost} pts`;
  }

  function populateLockedCardNode(node) {
    const image = node.querySelector(".monster-card__image");
    image.removeAttribute("src");
    image.alt = "";

    node.querySelector(".monster-card__art-badge").textContent = "Locked";
    node.querySelector(".monster-card__tagline").textContent = "Future creature";
    node.querySelector(".monster-card__type").textContent = "Locked";
    node.querySelector(".monster-card__rarity-pill").textContent = "???";
    node.querySelector(".monster-card__title").textContent = "???";
    node.querySelector(".monster-card__description").textContent = "Buy more cards to reveal the next wave of terrifying creatures.";
    node.querySelector(".monster-card__attack").textContent = "—";
    node.querySelector(".monster-card__power").textContent = "—";
    node.querySelector(".monster-card__rarity-short").textContent = "—";
    node.querySelector(".monster-card__meta").textContent = "Locked";
    node.querySelector(".monster-card__cost").textContent = "—";
  }

  function handleShopClick(event) {
    const button = event.target.closest("button[data-card-index]");
    if (!button) {
      return;
    }

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

    const cardCost = getCardCost(cardIndex);
    if (state.points < cardCost) {
      const missing = cardCost - state.points;
      setShopFlash(`You need ${missing} more ${pluralise(missing, "point")} to buy that card.`, "error");
      return;
    }

    const before = availableCount;
    state.points -= cardCost;
    state.ownedCards.push({ index: cardIndex, purchasedAt: Date.now() });
    lastPurchasedIndex = cardIndex;

    const after = getAvailableCardCount();
    const unlockedMore = after > before;
    saveState();
    renderStats();
    renderShop();
    renderCollection();

    const template = CREATURE_CARD_TEMPLATES[cardIndex];
    setShopFlash(`Bought ${template.name} for ${cardCost} ${pluralise(cardCost, "point")}.${unlockedMore ? " Ten more cards just unlocked!" : ""}`, "success");
  }

  function getCardCost(cardIndex) {
    return (Math.floor(cardIndex / CARD_PRICE_GROUP_SIZE) + 1) * CARD_PRICE_STEP;
  }

  function calculateOwnedCardCost(cardCount) {
    let total = 0;
    for (let index = 0; index < cardCount; index += 1) {
      total += getCardCost(index);
    }
    return total;
  }

  function getAvailableCardCount() {
    const totalCards = CREATURE_CARD_TEMPLATES.length;
    const ownedCount = state.ownedCards.length;
    const wavesOpen = Math.floor((ownedCount + SHOP_REMAINING_TRIGGER) / SHOP_BATCH_SIZE) + 1;
    return clamp(INITIAL_SHOP_SIZE + (wavesOpen - 1) * SHOP_BATCH_SIZE, INITIAL_SHOP_SIZE, totalCards);
  }

  function getNextShopExpansionTarget() {
    const availableCount = getAvailableCardCount();
    if (availableCount >= CREATURE_CARD_TEMPLATES.length) {
      return null;
    }
    return availableCount - SHOP_REMAINING_TRIGGER;
  }

  function sanitiseOwnedCards(cards) {
    const seen = new Set();
    return cards
      .filter((card) => card && typeof card === "object")
      .map((card) => ({ index: Number(card.index), purchasedAt: Number(card.purchasedAt) || Date.now() }))
      .filter((card) => {
        if (!Number.isInteger(card.index) || card.index < 0 || card.index >= CREATURE_CARD_TEMPLATES.length || seen.has(card.index)) {
          return false;
        }
        seen.add(card.index);
        return true;
      })
      .sort((a, b) => a.purchasedAt - b.purchasedAt);
  }

  function scoreWord(word) {
    return Math.max(1, word.length - 1);
  }

  function calculateEarnedPoints(targetState) {
    return WORDS.reduce((total, word) => {
      const progress = targetState.progress[word];
      const correctAttempts = Number(progress && progress.correctAttempts ? progress.correctAttempts : 0);
      return total + Math.max(0, correctAttempts) * scoreWord(word);
    }, 0);
  }

  function setupVoicePicker() {
    if (!("speechSynthesis" in window)) {
      elements.voiceControl.hidden = true;
      return;
    }

    elements.voiceControl.hidden = false;
    elements.voiceSelect.addEventListener("change", () => {
      window.localStorage.setItem(VOICE_STORAGE_KEY, elements.voiceSelect.value);
    });

    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      const englishVoices = voices
        .filter((voice) => /^en([-_]|$)/i.test(voice.lang || ""))
        .sort((a, b) => scoreVoice(b) - scoreVoice(a) || a.name.localeCompare(b.name));

      if (englishVoices.length === 0) {
        elements.voiceSelect.disabled = true;
        elements.voiceSelect.innerHTML = '<option value="">Browser default voice</option>';
        return;
      }

      availableVoices = englishVoices;
      const savedVoice = window.localStorage.getItem(VOICE_STORAGE_KEY);
      const selectedVoice = englishVoices.find((voice) => voice.name === savedVoice) || englishVoices[0];

      elements.voiceSelect.innerHTML = "";
      englishVoices.forEach((voice) => {
        const option = document.createElement("option");
        option.value = voice.name;
        option.textContent = `${voice.name} (${voice.lang})`;
        elements.voiceSelect.appendChild(option);
      });
      elements.voiceSelect.value = selectedVoice.name;
      elements.voiceSelect.disabled = false;
    };

    loadVoices();
    window.setTimeout(loadVoices, 300);
    window.setTimeout(loadVoices, 1000);

    if (typeof window.speechSynthesis.addEventListener === "function") {
      window.speechSynthesis.addEventListener("voiceschanged", loadVoices);
    } else {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }

  function scoreVoice(voice) {
    const name = voice.name.toLowerCase();
    const lang = (voice.lang || "").toLowerCase();
    let score = 0;

    if (lang.startsWith("en-gb")) score += 9;
    if (lang.startsWith("en-us")) score += 8;
    if (lang.startsWith("en-au")) score += 6;
    if (voice.localService) score += 1;
    if (name.includes("google")) score += 5;
    if (name.includes("microsoft")) score += 4;
    if (["samantha", "alex", "daniel", "serena", "sonia", "karen", "moira", "ava"].some((goodName) => name.includes(goodName))) score += 5;
    if (["compact", "novelty", "whisper", "bad news", "bells", "boing"].some((badName) => name.includes(badName))) score -= 8;

    return score;
  }

  function getSelectedVoice() {
    if (availableVoices.length === 0) {
      return null;
    }

    return availableVoices.find((voice) => voice.name === elements.voiceSelect.value) || availableVoices[0];
  }

  function showHint() {
    if (!currentWord) {
      return;
    }

    const progress = state.progress[currentWord];
    const pattern = currentWord
      .split("")
      .map((letter, index) => {
        if (index === 0) return letter;
        if (progress.correctStreak >= 2 && index === currentWord.length - 1) return letter;
        return "·";
      })
      .join(" ");

    elements.hintText.textContent = `Hint: starts with “${currentWord.charAt(0)}”. Pattern: ${pattern}`;
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

    const utterance = new SpeechSynthesisUtterance(`${currentWord}. ${currentWord}.`);
    const selectedVoice = getSelectedVoice();
    if (selectedVoice) {
      utterance.voice = selectedVoice;
      utterance.lang = selectedVoice.lang;
    } else {
      utterance.lang = "en-GB";
    }

    utterance.rate = 0.74;
    utterance.pitch = 0.95;
    utterance.volume = 1;
    window.speechSynthesis.speak(utterance);
  }

  function renderRestingState() {
    elements.practicePanel.hidden = true;
    elements.restingPanel.hidden = false;
    elements.nextDueText.textContent = `You mastered every word in ${getModeLabel(currentMode)}. Great work! You can still spend your points in the shop.`;
  }

  function normaliseAnswer(value) {
    return value.trim().toLowerCase().replace(/[^a-z]/g, "");
  }

  function shortRarity(rarity) {
    return ({
      Common: "C",
      Uncommon: "UC",
      Rare: "R",
      Epic: "EP",
      Legendary: "LG",
      Mythic: "MY"
    }[rarity] || rarity.slice(0, 2).toUpperCase());
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
