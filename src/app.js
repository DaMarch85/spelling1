(function () {
  "use strict";

  const MIN_LEVEL = 1;
  const MAX_LEVEL = 20;

  let WORD_ENTRIES = normaliseWordEntries(window.GRADED_SPELLING_WORDS || []);
  let WORD_ENTRIES_BY_LEVEL = groupWordEntriesByLevel(WORD_ENTRIES);
  let WORDS = [];

  const BASE_STORAGE_KEY = "spell-battle-cards-state-v13";
  const VOICE_STORAGE_KEY = "dino-speller-preferred-voice";
  const DEFAULT_VOICE_NAME = "Google UK English Male";
  const DEFAULT_VOICE_LANG = "en-GB";
  const LEGACY_STORAGE_KEYS = [
    "dino-speller-state-v10-normal",
    "dino-speller-state-v10-hard",
    "dino-speller-state-v9",
    "dino-speller-state-v8",
    "dino-speller-state-v7",
    "dino-speller-state-v6",
    "dino-speller-state-v5",
    "dino-speller-state-v4",
    "dino-speller-state-v3",
    "dino-speller-state-v2",
    "dino-speller-state-v1"
  ];

  const MASTERY_STREAK = 3;
  const BATTLE_POINT_EVERY = 10;
  const LEVEL_UNLOCK_REMAINING = 10;
  const CARD_PRICE_STEP = 5;
  const CARD_PRICE_GROUP_SIZE = 5;
  const INITIAL_UNLOCKED_PACK_ID = "prehistoric";
  const PACK_UNLOCK_REMAINING_TRIGGER = 5;
  const ACTIVE_WORD_TARGET = 5;
  const FIRST_CORRECT_REVIEW_GAP = 4;
  const SECOND_CORRECT_REVIEW_GAP = 8;
  const WRONG_REVIEW_GAP = 2;
  const AUTO_ADVANCE_MS = 1500;
  const WRONG_AUTO_ADVANCE_MS = 6500;
  const BATTLE_WAIT_TIMEOUT_MS = 120000;
  const BATTLE_HEARTBEAT_STALE_MS = 15000;
  const BATTLE_LOBBY_REFRESH_MS = 5000;


  const SIMPLE_SENTENCES = Object.freeze({
    there: "The toy is over there.",
    their: "The children packed their bags.",
    one: "I ate one apple.",
    two: "She has two shoes.",
    would: "I would like to play.",
    see: "I can see the moon.",
    right: "That answer is right.",
    which: "Which book should we read?",
    know: "I know the answer.",
    some: "Please take some paper.",
    our: "This is our classroom.",
    hour: "The lesson lasts one hour.",
    week: "There are seven days in a week.",
    eye: "I winked with one eye.",
    new: "These shoes are new.",
    for: "This present is for you.",
    than: "A whale is bigger than a fish.",
    then: "First wash your hands, then eat.",
    its: "The dog wagged its tail.",
    abrupt: "The story had an abrupt ending.",
    absorb: "The sponge can absorb water.",
    academy: "The academy teaches music and art.",
    algorithm: "The robot follows an algorithm.",
    ambiguous: "The clue was ambiguous.",
    analysis: "The scientist wrote an analysis.",
    architecture: "The city has beautiful architecture.",
    atmosphere: "The atmosphere felt calm.",
    beneficial: "Exercise is beneficial for your body.",
    bizarre: "The dream was bizarre.",
    chemistry: "Chemistry can explain reactions.",
    coincidence: "Meeting there was a coincidence.",
    consequence: "Every choice can have a consequence.",
    controversial: "The idea was controversial.",
    democracy: "In a democracy, people vote.",
    dictionary: "I checked the word in a dictionary.",
    discipline: "Practice takes discipline.",
    efficient: "The new plan was efficient.",
    environment: "We should protect the environment.",
    extraordinary: "The view was extraordinary.",
    frequently: "We frequently read together.",
    geography: "Geography helps us study places.",
    guarantee: "The ticket is a guarantee.",
    independent: "The kitten became independent.",
    ingredient: "Flour is an ingredient in bread.",
    intelligent: "The puzzle was solved by an intelligent child.",
    international: "The team played an international match.",
    knowledge: "Reading builds knowledge.",
    magnificent: "The mountain looked magnificent.",
    mathematics: "Mathematics helps us solve problems.",
    microscope: "We used a microscope in science.",
    mysterious: "The cave was mysterious.",
    necessary: "Sleep is necessary for health.",
    opportunity: "The race was an opportunity to try.",
    parallel: "The two lines are parallel.",
    permanent: "Marker ink can be permanent.",
    probability: "Probability helps us predict chance.",
    questionnaire: "The class filled in a questionnaire.",
    recommend: "I recommend this book.",
    restaurant: "We ate dinner at a restaurant.",
    rhythm: "The drummer kept the rhythm.",
    separate: "Please separate the red cards.",
    sufficient: "That is sufficient for today.",
    temperature: "The temperature dropped overnight.",
    thorough: "She did a thorough check.",
    traditional: "The dance was traditional.",
    vehicle: "A bus is a vehicle.",
    voluntary: "The club is voluntary."
  });

  const CARD_PACKS = Object.freeze([
    {
      id: "prehistoric",
      name: "Dinosaurs & Prehistoric Beasts",
      shortName: "Dinosaurs",
      description: "Dinosaurs, prehistoric hunters, and ancient giants.",
      unlockHint: "Unlocked at the start."
    },
    {
      id: "dangerous",
      name: "Dangerous Animals & Sea Beasts",
      shortName: "Dangerous Animals",
      description: "Real-world predators, ocean monsters, and fierce wild animals.",
      unlockHint: "Unlocks after you collect most of the Dinosaurs pack."
    },
    {
      id: "mythical",
      name: "Mythical Beasts & Monsters",
      shortName: "Mythical Beasts",
      description: "Dragons, hydras, griffins, unicorns, and legendary creatures.",
      unlockHint: "Unlocks after you collect most of the Dangerous Animals pack."
    },
    {
      id: "nature",
      name: "Nature Wonders",
      shortName: "Nature",
      description: "Flowers, gentle animals, weather, space, and beautiful natural things.",
      unlockHint: "Unlocks after you collect most of the Mythical Beasts pack."
    }
  ]);

  function getPackIdForCard(template) {
    if (template.packId) {
      return template.packId;
    }

    if (["Dinosaur", "Prehistoric Beast"].includes(template.type)) {
      return "prehistoric";
    }

    if (["Dangerous Animal", "Sea Beast", "Sea Monster", "Flying Beast"].includes(template.type)) {
      return "dangerous";
    }

    if (["Mythic Monster", "Mythic Beast", "Monster", "Hybrid Boss", "Mythic Nature"].includes(template.type)) {
      return "mythical";
    }

    return "nature";
  }

  function addPackToCard(template) {
    return {
      ...template,
      packId: getPackIdForCard(template)
    };
  }


  function makeNatureArtDataUri(title, emoji, backgroundStart, backgroundEnd) {
    const safeTitle = title.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 700 980">
        <defs>
          <radialGradient id="glow" cx="50%" cy="35%" r="65%">
            <stop offset="0%" stop-color="#ffffff" stop-opacity="0.58"/>
            <stop offset="42%" stop-color="${backgroundEnd}" stop-opacity="0.82"/>
            <stop offset="100%" stop-color="${backgroundStart}" stop-opacity="1"/>
          </radialGradient>
          <linearGradient id="edge" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#ffffff" stop-opacity="0.28"/>
            <stop offset="100%" stop-color="#000000" stop-opacity="0.22"/>
          </linearGradient>
        </defs>
        <rect width="700" height="980" fill="url(#glow)"/>
        <circle cx="120" cy="130" r="105" fill="#ffffff" opacity="0.16"/>
        <circle cx="590" cy="210" r="150" fill="#ffffff" opacity="0.12"/>
        <circle cx="350" cy="420" r="235" fill="#000000" opacity="0.10"/>
        <path d="M0 760 C150 680 260 850 420 760 C560 680 620 710 700 640 L700 980 L0 980 Z" fill="#000000" opacity="0.18"/>
        <text x="350" y="445" text-anchor="middle" dominant-baseline="middle" font-size="250">${emoji}</text>
        <rect x="42" y="770" width="616" height="116" rx="36" fill="#000000" opacity="0.38"/>
        <text x="350" y="840" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="52" font-weight="900" fill="#fff8e7">${safeTitle}</text>
        <rect x="10" y="10" width="680" height="960" rx="44" fill="none" stroke="url(#edge)" stroke-width="20"/>
      </svg>`;

    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
  }

  let CREATURE_CARD_TEMPLATES = Object.freeze([
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
    },
    {
        "name": "Rose",
        "slug": "rose",
        "type": "Flower",
        "rarity": "Common",
        "attack": 12,
        "power": 18,
        "tagline": "Velvet bloom",
        "description": "A bright, classic flower card with soft petals and quiet confidence.",
        "art": makeNatureArtDataUri("Rose", "\ud83c\udf39", "#7f1236", "#ff739a")
    },
    {
        "name": "Sunflower",
        "slug": "sunflower",
        "type": "Flower",
        "rarity": "Common",
        "attack": 14,
        "power": 22,
        "tagline": "Sun tracker",
        "description": "A cheerful golden giant that turns its face toward the light.",
        "art": makeNatureArtDataUri("Sunflower", "\ud83c\udf3b", "#8a5511", "#ffd15b")
    },
    {
        "name": "Bluebell",
        "slug": "bluebell",
        "type": "Flower",
        "rarity": "Common",
        "attack": 10,
        "power": 16,
        "tagline": "Woodland bell",
        "description": "A delicate spring flower from cool, shady woods.",
        "art": makeNatureArtDataUri("Bluebell", "\ud83e\udebb", "#27346b", "#9da7ff")
    },
    {
        "name": "Lotus",
        "slug": "lotus",
        "type": "Flower",
        "rarity": "Uncommon",
        "attack": 16,
        "power": 26,
        "tagline": "Still water bloom",
        "description": "A calm and beautiful flower rising from quiet water.",
        "art": makeNatureArtDataUri("Lotus", "\ud83e\udeb7", "#125a5a", "#ff9dcb")
    },
    {
        "name": "Cherry Blossom",
        "slug": "cherry-blossom",
        "type": "Flower",
        "rarity": "Uncommon",
        "attack": 13,
        "power": 24,
        "tagline": "Petal shower",
        "description": "A gentle pink blossom that turns the sky into confetti.",
        "art": makeNatureArtDataUri("Cherry Blossom", "\ud83c\udf38", "#7e335d", "#ffc1dc")
    },
    {
        "name": "Oak Tree",
        "slug": "oak-tree",
        "type": "Tree",
        "rarity": "Uncommon",
        "attack": 20,
        "power": 32,
        "tagline": "Ancient roots",
        "description": "A strong, patient tree with deep roots and wide branches.",
        "art": makeNatureArtDataUri("Oak Tree", "\ud83c\udf33", "#214425", "#8fcf75")
    },
    {
        "name": "Maple Leaf",
        "slug": "maple-leaf",
        "type": "Nature",
        "rarity": "Common",
        "attack": 15,
        "power": 20,
        "tagline": "Autumn spark",
        "description": "A blazing autumn leaf full of colour and movement.",
        "art": makeNatureArtDataUri("Maple Leaf", "\ud83c\udf41", "#7a2a11", "#ff9654")
    },
    {
        "name": "Fern",
        "slug": "fern",
        "type": "Plant",
        "rarity": "Common",
        "attack": 11,
        "power": 19,
        "tagline": "Forest curl",
        "description": "A curling green plant from damp and shadowy places.",
        "art": makeNatureArtDataUri("Fern", "\ud83c\udf3f", "#103b2a", "#61c985")
    },
    {
        "name": "Cactus",
        "slug": "cactus",
        "type": "Plant",
        "rarity": "Uncommon",
        "attack": 18,
        "power": 28,
        "tagline": "Desert survivor",
        "description": "A tough desert plant that stores water and wears spikes.",
        "art": makeNatureArtDataUri("Cactus", "\ud83c\udf35", "#21401f", "#9dd86c")
    },
    {
        "name": "Water Lily",
        "slug": "water-lily",
        "type": "Flower",
        "rarity": "Uncommon",
        "attack": 14,
        "power": 25,
        "tagline": "Pond jewel",
        "description": "A beautiful floating flower resting on still pond water.",
        "art": makeNatureArtDataUri("Water Lily", "\ud83e\udeb7", "#164168", "#79d4ff")
    },
    {
        "name": "Red Fox",
        "slug": "red-fox",
        "type": "Animal",
        "rarity": "Uncommon",
        "attack": 28,
        "power": 30,
        "tagline": "Clever paws",
        "description": "A quick, curious woodland animal with a fiery coat.",
        "art": makeNatureArtDataUri("Red Fox", "\ud83e\udd8a", "#6e2d10", "#ff934d")
    },
    {
        "name": "Snow Leopard",
        "slug": "snow-leopard",
        "type": "Animal",
        "rarity": "Rare",
        "attack": 36,
        "power": 42,
        "tagline": "Mountain ghost",
        "description": "A silent spotted cat from cold high mountains.",
        "art": makeNatureArtDataUri("Snow Leopard", "\ud83d\udc06", "#2f415b", "#dce8ff")
    },
    {
        "name": "Dolphin",
        "slug": "dolphin",
        "type": "Animal",
        "rarity": "Uncommon",
        "attack": 30,
        "power": 38,
        "tagline": "Wave dancer",
        "description": "A clever ocean mammal that leaps through blue water.",
        "art": makeNatureArtDataUri("Dolphin", "\ud83d\udc2c", "#124d78", "#77d8ff")
    },
    {
        "name": "Sea Turtle",
        "slug": "sea-turtle",
        "type": "Animal",
        "rarity": "Uncommon",
        "attack": 24,
        "power": 36,
        "tagline": "Ancient swimmer",
        "description": "A peaceful traveller crossing warm seas for many years.",
        "art": makeNatureArtDataUri("Sea Turtle", "\ud83d\udc22", "#12594f", "#8ee4bc")
    },
    {
        "name": "Peacock",
        "slug": "peacock",
        "type": "Bird",
        "rarity": "Rare",
        "attack": 28,
        "power": 39,
        "tagline": "Fan of colour",
        "description": "A dazzling bird with a spectacular tail display.",
        "art": makeNatureArtDataUri("Peacock", "\ud83e\udd9a", "#193b5d", "#7fe0d4")
    },
    {
        "name": "Hummingbird",
        "slug": "hummingbird",
        "type": "Bird",
        "rarity": "Rare",
        "attack": 26,
        "power": 34,
        "tagline": "Hover jewel",
        "description": "A tiny, brilliant bird that hovers like a living gem.",
        "art": makeNatureArtDataUri("Hummingbird", "\ud83d\udc26", "#14514a", "#88f0a6")
    },
    {
        "name": "Barn Owl",
        "slug": "barn-owl",
        "type": "Bird",
        "rarity": "Uncommon",
        "attack": 30,
        "power": 35,
        "tagline": "Silent wings",
        "description": "A pale night hunter that flies almost without sound.",
        "art": makeNatureArtDataUri("Barn Owl", "\ud83e\udd89", "#3c2b1f", "#e8cda2")
    },
    {
        "name": "Monarch Butterfly",
        "slug": "monarch-butterfly",
        "type": "Insect",
        "rarity": "Rare",
        "attack": 18,
        "power": 27,
        "tagline": "Orange wings",
        "description": "A delicate traveller with bold patterned wings.",
        "art": makeNatureArtDataUri("Monarch Butterfly", "\ud83e\udd8b", "#4d2147", "#ff9b54")
    },
    {
        "name": "Dragonfly",
        "slug": "dragonfly",
        "type": "Insect",
        "rarity": "Uncommon",
        "attack": 20,
        "power": 26,
        "tagline": "Glass wings",
        "description": "A fast pond-skimmer with shimmering transparent wings.",
        "art": makeNatureArtDataUri("Dragonfly", "\ud83e\udeb0", "#1f5872", "#93f1ff")
    },
    {
        "name": "Hedgehog",
        "slug": "hedgehog",
        "type": "Animal",
        "rarity": "Common",
        "attack": 20,
        "power": 29,
        "tagline": "Tiny wanderer",
        "description": "A small night-time snuffler with a coat of little spines.",
        "art": makeNatureArtDataUri("Hedgehog", "\ud83e\udd94", "#4b2d1e", "#d9a56d")
    },
    {
        "name": "Giant Panda",
        "slug": "giant-panda",
        "type": "Animal",
        "rarity": "Rare",
        "attack": 24,
        "power": 40,
        "tagline": "Bamboo guardian",
        "description": "A gentle black-and-white bear that loves bamboo.",
        "art": makeNatureArtDataUri("Giant Panda", "\ud83d\udc3c", "#222831", "#f3f4f0")
    },
    {
        "name": "Koala",
        "slug": "koala",
        "type": "Animal",
        "rarity": "Uncommon",
        "attack": 18,
        "power": 30,
        "tagline": "Eucalyptus napper",
        "description": "A sleepy tree-climbing animal with soft grey fur.",
        "art": makeNatureArtDataUri("Koala", "\ud83d\udc28", "#3d4653", "#c9d1dc")
    },
    {
        "name": "Red Squirrel",
        "slug": "red-squirrel",
        "type": "Animal",
        "rarity": "Common",
        "attack": 19,
        "power": 25,
        "tagline": "Treetop jumper",
        "description": "A lively little acrobat with a bushy tail.",
        "art": makeNatureArtDataUri("Red Squirrel", "\ud83d\udc3f\ufe0f", "#6d3516", "#e99555")
    },
    {
        "name": "Seahorse",
        "slug": "seahorse",
        "type": "Sea Animal",
        "rarity": "Uncommon",
        "attack": 18,
        "power": 28,
        "tagline": "Tiny sea knight",
        "description": "A strange and delicate sea creature with a curled tail.",
        "art": makeNatureArtDataUri("Seahorse", "\ud83d\udc20", "#14546c", "#8ee3ff")
    },
    {
        "name": "Starfish",
        "slug": "starfish",
        "type": "Sea Animal",
        "rarity": "Common",
        "attack": 14,
        "power": 23,
        "tagline": "Tidepool star",
        "description": "A bright sea star from shallow pools and sandy shores.",
        "art": makeNatureArtDataUri("Starfish", "\u2b50", "#8c4020", "#ffb36b")
    },
    {
        "name": "Clownfish",
        "slug": "clownfish",
        "type": "Sea Animal",
        "rarity": "Common",
        "attack": 18,
        "power": 25,
        "tagline": "Reef friend",
        "description": "A bright little fish that lives among waving anemones.",
        "art": makeNatureArtDataUri("Clownfish", "\ud83d\udc20", "#0d5766", "#ff9c43")
    },
    {
        "name": "Chameleon",
        "slug": "chameleon",
        "type": "Animal",
        "rarity": "Rare",
        "attack": 22,
        "power": 33,
        "tagline": "Colour shifter",
        "description": "A clever lizard with a curling tail and changing colours.",
        "art": makeNatureArtDataUri("Chameleon", "\ud83e\udd8e", "#245b2d", "#9fe36d")
    },
    {
        "name": "Axolotl",
        "slug": "axolotl",
        "type": "Animal",
        "rarity": "Rare",
        "attack": 18,
        "power": 31,
        "tagline": "Water sprite",
        "description": "A smiling amphibian with feathery gills and surprising charm.",
        "art": makeNatureArtDataUri("Axolotl", "\ud83e\udd8e", "#67416f", "#ffb6d8")
    },
    {
        "name": "Honeybee",
        "slug": "honeybee",
        "type": "Insect",
        "rarity": "Common",
        "attack": 15,
        "power": 24,
        "tagline": "Pollen helper",
        "description": "A tiny striped worker that helps flowers grow.",
        "art": makeNatureArtDataUri("Honeybee", "\ud83d\udc1d", "#5f4510", "#ffd766")
    },
    {
        "name": "Ladybird",
        "slug": "ladybird",
        "type": "Insect",
        "rarity": "Common",
        "attack": 12,
        "power": 20,
        "tagline": "Spotted luck",
        "description": "A small red beetle with black spots and garden charm.",
        "art": makeNatureArtDataUri("Ladybird", "\ud83d\udc1e", "#641818", "#ff6b6b")
    },
    {
        "name": "Coral Reef",
        "slug": "coral-reef",
        "type": "Nature",
        "rarity": "Rare",
        "attack": 24,
        "power": 42,
        "tagline": "Underwater city",
        "description": "A colourful living world filled with fish and hidden shapes.",
        "art": makeNatureArtDataUri("Coral Reef", "\ud83e\udeb8", "#174b6d", "#ff8fb3")
    },
    {
        "name": "Waterfall",
        "slug": "waterfall",
        "type": "Nature",
        "rarity": "Uncommon",
        "attack": 28,
        "power": 36,
        "tagline": "White water",
        "description": "A rushing curtain of water tumbling into mist.",
        "art": makeNatureArtDataUri("Waterfall", "\ud83d\udca7", "#16456c", "#8fdcff")
    },
    {
        "name": "Rainbow",
        "slug": "rainbow",
        "type": "Nature",
        "rarity": "Rare",
        "attack": 20,
        "power": 35,
        "tagline": "Sky bridge",
        "description": "A bright arc of colour after rain and sunlight meet.",
        "art": makeNatureArtDataUri("Rainbow", "\ud83c\udf08", "#47306d", "#ffd36b")
    },
    {
        "name": "Aurora",
        "slug": "aurora",
        "type": "Nature",
        "rarity": "Epic",
        "attack": 24,
        "power": 44,
        "tagline": "Dancing sky",
        "description": "Green and purple lights flowing across the polar night.",
        "art": makeNatureArtDataUri("Aurora", "\u2728", "#133458", "#88ffd8")
    },
    {
        "name": "Crystal Cave",
        "slug": "crystal-cave",
        "type": "Nature",
        "rarity": "Rare",
        "attack": 22,
        "power": 41,
        "tagline": "Hidden sparkle",
        "description": "A secret cave glittering with sharp blue crystals.",
        "art": makeNatureArtDataUri("Crystal Cave", "\ud83d\udc8e", "#243b6b", "#9fd6ff")
    },
    {
        "name": "Volcano",
        "slug": "volcano",
        "type": "Nature",
        "rarity": "Rare",
        "attack": 35,
        "power": 45,
        "tagline": "Earth fire",
        "description": "A powerful mountain glowing with heat and molten rock.",
        "art": makeNatureArtDataUri("Volcano", "\ud83c\udf0b", "#4a1814", "#ff8347")
    },
    {
        "name": "Snowflake",
        "slug": "snowflake",
        "type": "Nature",
        "rarity": "Common",
        "attack": 10,
        "power": 21,
        "tagline": "Winter pattern",
        "description": "A tiny frozen star with perfect icy branches.",
        "art": makeNatureArtDataUri("Snowflake", "\u2744\ufe0f", "#25415e", "#d5f2ff")
    },
    {
        "name": "Moon",
        "slug": "moon",
        "type": "Nature",
        "rarity": "Uncommon",
        "attack": 18,
        "power": 32,
        "tagline": "Night lantern",
        "description": "A silver companion shining over quiet rooftops.",
        "art": makeNatureArtDataUri("Moon", "\ud83c\udf19", "#243049", "#e7e7cf")
    },
    {
        "name": "Comet",
        "slug": "comet",
        "type": "Space",
        "rarity": "Rare",
        "attack": 32,
        "power": 43,
        "tagline": "Sky traveller",
        "description": "A bright icy visitor streaking through the night.",
        "art": makeNatureArtDataUri("Comet", "\u2604\ufe0f", "#262350", "#ffbd6b")
    },
    {
        "name": "Orchid",
        "slug": "orchid",
        "type": "Flower",
        "rarity": "Rare",
        "attack": 15,
        "power": 30,
        "tagline": "Rare bloom",
        "description": "A delicate, unusual flower with elegant colours.",
        "art": makeNatureArtDataUri("Orchid", "\ud83c\udf3a", "#55265b", "#ff9ef1")
    },
    {
        "name": "Unicorn",
        "slug": "unicorn",
        "type": "Mythic Nature",
        "rarity": "Mythic",
        "attack": 40,
        "power": 60,
        "tagline": "Rainbow legend",
        "description": "A magical white horse with a shining horn and gentle power.",
        "art": makeNatureArtDataUri("Unicorn", "\ud83e\udd84", "#443070", "#ffd1ff"),
        "price": 40
    }
].map(addPackToCard));

  const ADDITIONAL_CARD_PACKS = Object.freeze([
    { id: "unicorns-fairies", name: "Unicorns & Fairies", shortName: "Magic", description: "Magical unicorns and fairies with bright, gentle artwork.", unlockHint: "Available after you earn a pack unlock." },
    { id: "solar-system", name: "Solar System", shortName: "Space", description: "Planets, moons, and cosmic wonders.", unlockHint: "Available after you earn a pack unlock." },
    { id: "uk-animals", name: "UK Animals", shortName: "UK Animals", description: "Familiar wildlife from woods, coasts, rivers, and moorland.", unlockHint: "Available after you earn a pack unlock." },
    { id: "flowers", name: "Flowers", shortName: "Flowers", description: "Beautiful flower cards with colourful artwork.", unlockHint: "Available after you earn a pack unlock." },
    { id: "greek-gods", name: "Greek Gods", shortName: "Olympus", description: "Dramatic gods and goddesses from ancient Greek myths.", unlockHint: "Available after you earn a pack unlock." }
  ]);

  const ADDITIONAL_CREATURE_CARD_TEMPLATES = Object.freeze([
    { packId: "unicorns-fairies", name: "Moonlight Unicorn", slug: "moonlight-unicorn", type: "Unicorn", tagline: "Silver hoofprints under moonlight", description: "Silver hoofprints under moonlight.", art: "src/card-art/moonlight-unicorn.webp" },
    { packId: "unicorns-fairies", name: "Rainbow Unicorn", slug: "rainbow-unicorn", type: "Unicorn", tagline: "A rainbow-maned unicorn charging through flowers", description: "A rainbow-maned unicorn charging through flowers.", art: "src/card-art/rainbow-unicorn.webp" },
    { packId: "unicorns-fairies", name: "Crystal Unicorn", slug: "crystal-unicorn", type: "Unicorn", tagline: "A sparkling unicorn made of crystal light", description: "A sparkling unicorn made of crystal light.", art: "src/card-art/crystal-unicorn.webp" },
    { packId: "unicorns-fairies", name: "Forest Unicorn", slug: "forest-unicorn", type: "Unicorn", tagline: "A gentle guardian of green woodland glades", description: "A gentle guardian of green woodland glades.", art: "src/card-art/forest-unicorn.webp" },
    { packId: "unicorns-fairies", name: "Golden Unicorn", slug: "golden-unicorn", type: "Unicorn", tagline: "A shining unicorn glowing with golden magic", description: "A shining unicorn glowing with golden magic.", art: "src/card-art/golden-unicorn.webp" },
    { packId: "unicorns-fairies", name: "Storm Unicorn", slug: "storm-unicorn", type: "Unicorn", tagline: "A fierce unicorn racing through lightning", description: "A fierce unicorn racing through lightning.", art: "src/card-art/storm-unicorn.webp" },
    { packId: "unicorns-fairies", name: "Rose Fairy", slug: "rose-fairy", type: "Fairy", tagline: "A fairy among roses and warm pink petals", description: "A fairy among roses and warm pink petals.", art: "src/card-art/rose-fairy.webp" },
    { packId: "unicorns-fairies", name: "Frost Fairy", slug: "frost-fairy", type: "Fairy", tagline: "An icy fairy with snowflakes in her hand", description: "An icy fairy with snowflakes in her hand.", art: "src/card-art/frost-fairy.webp" },
    { packId: "unicorns-fairies", name: "River Fairy", slug: "river-fairy", type: "Fairy", tagline: "A calm river fairy beside glowing water", description: "A calm river fairy beside glowing water.", art: "src/card-art/river-fairy.webp" },
    { packId: "unicorns-fairies", name: "Star Fairy", slug: "star-fairy", type: "Fairy", tagline: "A fairy gathering tiny stars from the sky", description: "A fairy gathering tiny stars from the sky.", art: "src/card-art/star-fairy.webp" },
    { packId: "unicorns-fairies", name: "Sunset Fairy", slug: "sunset-fairy", type: "Fairy", tagline: "A fairy lit by a fiery orange sunset", description: "A fairy lit by a fiery orange sunset.", art: "src/card-art/sunset-fairy.webp" },
    { packId: "unicorns-fairies", name: "Woodland Fairy", slug: "woodland-fairy", type: "Fairy", tagline: "A forest fairy among leaves and mushrooms", description: "A forest fairy among leaves and mushrooms.", art: "src/card-art/woodland-fairy.webp" },
    { packId: "solar-system", name: "Sun", slug: "sun", type: "Star", tagline: "The blazing star at the centre of our solar system", description: "The blazing star at the centre of our solar system.", art: "src/card-art/sun.webp" },
    { packId: "solar-system", name: "Mercury", slug: "mercury", type: "Planet", tagline: "The smallest planet and the closest to the Sun", description: "The smallest planet and the closest to the Sun.", art: "src/card-art/mercury.webp" },
    { packId: "solar-system", name: "Venus", slug: "venus", type: "Planet", tagline: "A swirling golden world wrapped in thick cloud", description: "A swirling golden world wrapped in thick cloud.", art: "src/card-art/venus.webp" },
    { packId: "solar-system", name: "Earth", slug: "earth", type: "Planet", tagline: "Our blue home world full of oceans and life", description: "Our blue home world full of oceans and life.", art: "src/card-art/earth.webp" },
    { packId: "solar-system", name: "Moon", slug: "moon", type: "Moon", tagline: "Earth’s bright natural satellite", description: "Earth’s bright natural satellite.", art: "src/card-art/moon.webp" },
    { packId: "solar-system", name: "Mars", slug: "mars", type: "Planet", tagline: "The red planet of dust, rock, and giant volcanoes", description: "The red planet of dust, rock, and giant volcanoes.", art: "src/card-art/mars.webp" },
    { packId: "solar-system", name: "Jupiter", slug: "jupiter", type: "Planet", tagline: "The largest planet, famous for huge storms", description: "The largest planet, famous for huge storms.", art: "src/card-art/jupiter.webp" },
    { packId: "solar-system", name: "Saturn", slug: "saturn", type: "Planet", tagline: "The ringed giant with a golden glow", description: "The ringed giant with a golden glow.", art: "src/card-art/saturn.webp" },
    { packId: "solar-system", name: "Uranus", slug: "uranus", type: "Planet", tagline: "An icy giant with pale blue rings", description: "An icy giant with pale blue rings.", art: "src/card-art/uranus.webp" },
    { packId: "solar-system", name: "Neptune", slug: "neptune", type: "Planet", tagline: "A deep blue world of fast winds", description: "A deep blue world of fast winds.", art: "src/card-art/neptune.webp" },
    { packId: "solar-system", name: "Pluto", slug: "pluto", type: "Dwarf Planet", tagline: "A distant icy dwarf world", description: "A distant icy dwarf world.", art: "src/card-art/pluto.webp" },
    { packId: "solar-system", name: "Comet", slug: "comet", type: "Comet", tagline: "A blazing comet streaking across the stars", description: "A blazing comet streaking across the stars.", art: "src/card-art/comet.webp" },
    { packId: "uk-animals", name: "Red Fox", slug: "red-fox", type: "Mammal", tagline: "A clever fox with a bright copper coat", description: "A clever fox with a bright copper coat.", art: "src/card-art/red-fox.webp" },
    { packId: "uk-animals", name: "Badger", slug: "badger", type: "Mammal", tagline: "A sturdy badger with bold black-and-white stripes", description: "A sturdy badger with bold black-and-white stripes.", art: "src/card-art/badger.webp" },
    { packId: "uk-animals", name: "Hedgehog", slug: "hedgehog", type: "Mammal", tagline: "A small hedgehog nosing through autumn leaves", description: "A small hedgehog nosing through autumn leaves.", art: "src/card-art/hedgehog.webp" },
    { packId: "uk-animals", name: "Otter", slug: "otter", type: "Mammal", tagline: "A playful otter gliding through a clear stream", description: "A playful otter gliding through a clear stream.", art: "src/card-art/otter.webp" },
    { packId: "uk-animals", name: "Barn Owl", slug: "barn-owl", type: "Bird", tagline: "A pale owl with a heart-shaped face", description: "A pale owl with a heart-shaped face.", art: "src/card-art/barn-owl.webp" },
    { packId: "uk-animals", name: "Puffin", slug: "puffin", type: "Bird", tagline: "A seabird with a colourful beak", description: "A seabird with a colourful beak.", art: "src/card-art/puffin.webp" },
    { packId: "uk-animals", name: "Red Squirrel", slug: "red-squirrel", type: "Mammal", tagline: "A fluffy-tailed squirrel in a sunlit tree", description: "A fluffy-tailed squirrel in a sunlit tree.", art: "src/card-art/red-squirrel.webp" },
    { packId: "uk-animals", name: "Red Deer", slug: "red-deer", type: "Mammal", tagline: "A majestic stag standing in open hills", description: "A majestic stag standing in open hills.", art: "src/card-art/red-deer.webp" },
    { packId: "uk-animals", name: "Grey Seal", slug: "grey-seal", type: "Marine Mammal", tagline: "A speckled seal resting by the shore", description: "A speckled seal resting by the shore.", art: "src/card-art/grey-seal.webp" },
    { packId: "uk-animals", name: "European Robin", slug: "european-robin", type: "Bird", tagline: "A friendly robin with a bright orange chest", description: "A friendly robin with a bright orange chest.", art: "src/card-art/european-robin.webp" },
    { packId: "uk-animals", name: "Scottish Wildcat", slug: "scottish-wildcat", type: "Mammal", tagline: "A rare wildcat of the rugged Highlands", description: "A rare wildcat of the rugged Highlands.", art: "src/card-art/scottish-wildcat.webp" },
    { packId: "uk-animals", name: "Brown Hare", slug: "brown-hare", type: "Mammal", tagline: "A long-eared hare watching the sunset", description: "A long-eared hare watching the sunset.", art: "src/card-art/brown-hare.webp" },
    { packId: "flowers", name: "Rose", slug: "rose", type: "Flower", tagline: "A classic red rose covered with dew", description: "A classic red rose covered with dew.", art: "src/card-art/rose.webp" },
    { packId: "flowers", name: "Sunflower", slug: "sunflower", type: "Flower", tagline: "A tall sunflower turning toward the light", description: "A tall sunflower turning toward the light.", art: "src/card-art/sunflower.webp" },
    { packId: "flowers", name: "Tulip", slug: "tulip", type: "Flower", tagline: "A bright tulip glowing in a spring garden", description: "A bright tulip glowing in a spring garden.", art: "src/card-art/tulip.webp" },
    { packId: "flowers", name: "Bluebell", slug: "bluebell", type: "Flower", tagline: "Bluebells nodding in a shady woodland", description: "Bluebells nodding in a shady woodland.", art: "src/card-art/bluebell.webp" },
    { packId: "flowers", name: "Daffodil", slug: "daffodil", type: "Flower", tagline: "Golden daffodils sparkling in the morning", description: "Golden daffodils sparkling in the morning.", art: "src/card-art/daffodil.webp" },
    { packId: "flowers", name: "Lavender", slug: "lavender", type: "Flower", tagline: "Purple lavender filling the air with scent", description: "Purple lavender filling the air with scent.", art: "src/card-art/lavender.webp" },
    { packId: "flowers", name: "Lily", slug: "lily", type: "Flower", tagline: "A white lily shining beneath the moon", description: "A white lily shining beneath the moon.", art: "src/card-art/lily.webp" },
    { packId: "flowers", name: "Orchid", slug: "orchid", type: "Flower", tagline: "An orchid blooming in a hidden glade", description: "An orchid blooming in a hidden glade.", art: "src/card-art/orchid.webp" },
    { packId: "flowers", name: "Cherry Blossom", slug: "cherry-blossom", type: "Flower", tagline: "Soft pink blossom drifting on the breeze", description: "Soft pink blossom drifting on the breeze.", art: "src/card-art/cherry-blossom.webp" },
    { packId: "flowers", name: "Poppy", slug: "poppy", type: "Flower", tagline: "A vivid red poppy under a warm sky", description: "A vivid red poppy under a warm sky.", art: "src/card-art/poppy.webp" },
    { packId: "flowers", name: "Peony", slug: "peony", type: "Flower", tagline: "A full pink peony with ruffled petals", description: "A full pink peony with ruffled petals.", art: "src/card-art/peony.webp" },
    { packId: "flowers", name: "Snowdrop", slug: "snowdrop", type: "Flower", tagline: "Small white snowdrops pushing through frost", description: "Small white snowdrops pushing through frost.", art: "src/card-art/snowdrop.webp" },
    { packId: "greek-gods", name: "Zeus", slug: "zeus", type: "God", tagline: "King of the gods with storm and lightning", description: "King of the gods with storm and lightning.", art: "src/card-art/zeus.webp" },
    { packId: "greek-gods", name: "Hera", slug: "hera", type: "Goddess", tagline: "Queen of Olympus seated in splendour", description: "Queen of Olympus seated in splendour.", art: "src/card-art/hera.webp" },
    { packId: "greek-gods", name: "Poseidon", slug: "poseidon", type: "God", tagline: "Lord of the sea raising his trident", description: "Lord of the sea raising his trident.", art: "src/card-art/poseidon.webp" },
    { packId: "greek-gods", name: "Athena", slug: "athena", type: "Goddess", tagline: "Warrior goddess of wisdom and strategy", description: "Warrior goddess of wisdom and strategy.", art: "src/card-art/athena.webp" },
    { packId: "greek-gods", name: "Apollo", slug: "apollo", type: "God", tagline: "God of music, sunlight, and prophecy", description: "God of music, sunlight, and prophecy.", art: "src/card-art/apollo.webp" },
    { packId: "greek-gods", name: "Artemis", slug: "artemis", type: "Goddess", tagline: "Goddess of the wild and the moonlit hunt", description: "Goddess of the wild and the moonlit hunt.", art: "src/card-art/artemis.webp" },
    { packId: "greek-gods", name: "Ares", slug: "ares", type: "God", tagline: "Armoured god of battle and fury", description: "Armoured god of battle and fury.", art: "src/card-art/ares.webp" },
    { packId: "greek-gods", name: "Aphrodite", slug: "aphrodite", type: "Goddess", tagline: "Goddess of love rising in beauty", description: "Goddess of love rising in beauty.", art: "src/card-art/aphrodite.webp" },
    { packId: "greek-gods", name: "Hermes", slug: "hermes", type: "God", tagline: "Swift messenger god with winged sandals", description: "Swift messenger god with winged sandals.", art: "src/card-art/hermes.webp" },
    { packId: "greek-gods", name: "Demeter", slug: "demeter", type: "Goddess", tagline: "Goddess of harvest and fertile fields", description: "Goddess of harvest and fertile fields.", art: "src/card-art/demeter.webp" },
    { packId: "greek-gods", name: "Hades", slug: "hades", type: "God", tagline: "Ruler of the underworld and its shadows", description: "Ruler of the underworld and its shadows.", art: "src/card-art/hades.webp" },
    { packId: "greek-gods", name: "Hephaestus", slug: "hephaestus", type: "God", tagline: "Master smith of fire and the forge", description: "Master smith of fire and the forge.", art: "src/card-art/hephaestus.webp" }
  ]);

  const ACTIVE_CARD_PACKS = Object.freeze([
    ...CARD_PACKS.filter((pack) => pack.id !== "nature"),
    ...ADDITIONAL_CARD_PACKS
  ]);

  const ACTIVE_CREATURE_CARD_TEMPLATES = Object.freeze([
    ...CREATURE_CARD_TEMPLATES.filter((card) => card.packId !== "nature"),
    ...ADDITIONAL_CREATURE_CARD_TEMPLATES
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
    levelPanel: document.querySelector("#levelPanel"),
    levelGrid: document.querySelector("#levelGrid"),
    levelStatus: document.querySelector("#levelStatus"),
    levelToggleButton: document.querySelector("#levelToggleButton"),
    wordLevelBadge: document.querySelector("#wordLevelBadge"),
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
    revealWordButton: document.querySelector("#revealWordButton"),
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
    battlePointsTotal: document.querySelector("#battlePointsTotal"),
    wordsCorrectTotal: document.querySelector("#wordsCorrectTotal"),
    battlePointNextText: document.querySelector("#battlePointNextText"),
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
    collectionCardTemplate: document.querySelector("#collectionCardTemplate"),
    authPanel: document.querySelector("#authPanel"),
    authEmail: document.querySelector("#authEmail"),
    authPassword: document.querySelector("#authPassword"),
    signInButton: document.querySelector("#signInButton"),
    signUpButton: document.querySelector("#signUpButton"),
    signOutButton: document.querySelector("#signOutButton"),
    battleArenaJump: document.querySelector("#battleArenaJump"),
    authStatus: document.querySelector("#authStatus"),
    packGrid: document.querySelector("#packGrid"),
    packStatusBadge: document.querySelector("#packStatusBadge"),
    battlePanel: document.querySelector("#battlePanel"),
    battleCardSelect: document.querySelector("#battleCardSelect"),
    enterBattleButton: document.querySelector("#enterBattleButton"),
    battleStatus: document.querySelector("#battleStatus"),
    battleOpponent: document.querySelector("#battleOpponent"),
    battleGrid: document.querySelector("#battleGrid"),
    battleResult: document.querySelector("#battleResult"),
    pointsLeaderboard: document.querySelector("#pointsLeaderboard"),
    masteredLeaderboard: document.querySelector("#masteredLeaderboard"),
    battleQueueCount: document.querySelector("#battleQueueCount"),
    cancelBattleButton: document.querySelector("#cancelBattleButton")
  };

  let state = loadState();
  let levelPanelCollapsed = Boolean(state && state.selectedLevel);
  let currentWord = null;
  let autoAdvanceTimer = null;
  let availableVoices = [];
  let lastPurchasedIndex = null;
  let supabaseClient = null;
  let currentUser = null;
  let remoteSaveTimer = null;
  let currentBattle = null;
  let currentBattlePointSpent = false;
  let battlePollTimer = null;
  let battleLobbyTimer = null;

  initialise();

  function initialise() {
    elements.form.addEventListener("submit", handleSubmit);
    elements.answerInput.addEventListener("keydown", handleAnswerKeydown);
    elements.speakButton.addEventListener("click", speakCurrentWord);
    elements.hintButton.addEventListener("click", showHint);
    elements.revealWordButton.addEventListener("click", revealCurrentWord);
    elements.skipButton.addEventListener("click", skipCurrentWord);
    if (elements.resetButton) {
      elements.resetButton.addEventListener("click", resetProgress);
    }
    elements.refreshButton.addEventListener("click", selectNextWord);
    elements.shopGrid.addEventListener("click", handleShopClick);
    elements.collectionGrid.addEventListener("click", handleCollectionClick);
    elements.levelGrid.addEventListener("click", handleLevelChoice);
    if (elements.levelToggleButton) {
      elements.levelToggleButton.addEventListener("click", () => {
        levelPanelCollapsed = !levelPanelCollapsed;
        renderLevelSelector();
      });
    }
    elements.packGrid.addEventListener("click", handlePackClick);
    elements.signInButton.addEventListener("click", signInUser);
    elements.signUpButton.addEventListener("click", signUpUser);
    elements.signOutButton.addEventListener("click", signOutUser);
    elements.enterBattleButton.addEventListener("click", enterBattleArena);
    if (elements.cancelBattleButton) {
      elements.cancelBattleButton.addEventListener("click", cancelWaitingBattle);
    }
    if (elements.battleArenaJump) {
      elements.battleArenaJump.addEventListener("click", () => elements.battlePanel.scrollIntoView({ behavior: "smooth", block: "start" }));
    }
    window.addEventListener("pagehide", handlePageLifecycleSave);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") {
        handlePageLifecycleSave();
      }
    });

    renderLevelSelector();
    setupVoicePicker();
    initialiseSupabase();
    selectNextWord();
    renderStats();
    renderShop();
    renderCollection();
    renderPacks();
    renderBattlePanel();
    renderLeaderboards();
    refreshBattleLobbyCount();
    startBattleLobbyRefresh();
    renderDueBadge();
  }

  function getStorageKey() {
    return BASE_STORAGE_KEY;
  }

  function normaliseWordEntries(entries) {
    return entries
      .map((entry, index) => {
        const word = String(entry.word || entry.Word || "").trim().toLowerCase();
        const level = Number(entry.level || entry.Level);
        if (!word || !Number.isInteger(level)) {
          return null;
        }

        return {
          word,
          level: clamp(level, MIN_LEVEL, MAX_LEVEL),
          band: String(entry.band || entry.Band || "").trim(),
          sentence: String(entry.sentence || entry.simple_sentence || entry.simpleSentence || "").trim() || `Please spell the word ${word}.`,
          sortOrder: Number(entry.sort_order || entry.sortOrder || entry.No || index + 1) || index + 1
        };
      })
      .filter(Boolean)
      .sort((a, b) => a.level - b.level || a.sortOrder - b.sortOrder || a.word.localeCompare(b.word));
  }

  function groupWordEntriesByLevel(entries) {
    return entries.reduce((acc, entry) => {
      if (!acc[entry.level]) {
        acc[entry.level] = [];
      }
      acc[entry.level].push(entry);
      return acc;
    }, {});
  }

  function setWordEntries(entries) {
    WORD_ENTRIES = normaliseWordEntries(entries);
    WORD_ENTRIES_BY_LEVEL = groupWordEntriesByLevel(WORD_ENTRIES);
    refreshActiveWords(state);
    ensureProgressForActiveWords(state);
    renderLevelSelector();
  }

  function getLevelEntries(level) {
    return WORD_ENTRIES_BY_LEVEL[level] || [];
  }

  function getEntryForWord(word) {
    return WORD_ENTRIES.find((entry) => entry.word === word) || null;
  }

  function getUnlockedLevels(targetState) {
    if (!targetState.selectedLevel) {
      return [];
    }

    const levels = Array.isArray(targetState.unlockedLevels) && targetState.unlockedLevels.length
      ? targetState.unlockedLevels
      : [targetState.selectedLevel];

    return Array.from(new Set(levels.map(Number)))
      .filter((level) => Number.isInteger(level) && level >= MIN_LEVEL && level <= MAX_LEVEL)
      .sort((a, b) => a - b);
  }

  function getActiveWordEntries(targetState) {
    const unlockedLevels = new Set(getUnlockedLevels(targetState));
    return WORD_ENTRIES.filter((entry) => unlockedLevels.has(entry.level));
  }

  function refreshActiveWords(targetState) {
    WORDS = getActiveWordEntries(targetState).map((entry) => entry.word);
  }

  function ensureProgressForActiveWords(targetState) {
    refreshActiveWords(targetState);
    for (const word of WORDS) {
      if (!targetState.progress[word]) {
        targetState.progress[word] = makeBlankProgress(word);
      }
    }
  }

  function renderLevelSelector() {
    if (!elements.levelPanel || !elements.levelGrid) {
      return;
    }

    const hasLevel = Boolean(state && state.selectedLevel);
    if (!hasLevel) {
      levelPanelCollapsed = false;
    }
    elements.levelPanel.hidden = false;
    elements.levelPanel.classList.toggle("is-collapsed", Boolean(hasLevel && levelPanelCollapsed));
    elements.levelGrid.innerHTML = "";

    if (elements.levelToggleButton) {
      elements.levelToggleButton.hidden = !hasLevel;
      elements.levelToggleButton.textContent = levelPanelCollapsed ? "Change level" : "Hide levels";
      elements.levelToggleButton.setAttribute("aria-expanded", String(!levelPanelCollapsed));
    }

    elements.levelStatus.textContent = hasLevel
      ? `Current level ${state.selectedLevel}. You can change it at any time.`
      : (currentUser ? "Choose the level that feels right. You can change it at any time." : "Choose a starting level. Sign in to save it online.");

    for (let level = MIN_LEVEL; level <= MAX_LEVEL; level += 1) {
      const examples = getLevelEntries(level).slice(0, 10).map((entry) => entry.word);
      const tile = document.createElement("article");
      tile.className = `level-tile${state.selectedLevel === level ? " is-selected" : ""}`;
      tile.innerHTML = `
        <h3>Level ${level}</h3>
        <p>${examples.join(", ") || "Words loading…"}</p>
        <button class="primary-button" type="button" data-level="${level}" ${state.selectedLevel === level ? "disabled" : ""}>${state.selectedLevel === level ? "Selected" : `Use level ${level}`}</button>
      `;
      elements.levelGrid.appendChild(tile);
    }
  }

  function handleLevelChoice(event) {
    const button = event.target.closest("button[data-level]");
    if (!button) {
      return;
    }

    const level = Number(button.dataset.level);
    if (!Number.isInteger(level) || level < MIN_LEVEL || level > MAX_LEVEL) {
      return;
    }

    chooseStartingLevel(level);
  }

  function chooseStartingLevel(level) {
    state = makeInitialState(level);
    levelPanelCollapsed = true;
    currentWord = null;
    clearAutoAdvance();
    saveState({ immediateRemote: Boolean(currentUser) });
    if (currentUser) {
      ensureProfile();
    }
    renderLevelSelector();
    selectNextWord();
    renderStats();
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
      lastAttemptAt: null,
      lastAttemptWasWrong: false
    };
  }

  function makeInitialState(selectedLevel = null) {
    const safeLevel = Number.isInteger(Number(selectedLevel)) ? clamp(Number(selectedLevel), MIN_LEVEL, MAX_LEVEL) : null;
    const initialState = {
      version: 11,
      lastUpdatedAt: Date.now(),
      selectedLevel: safeLevel,
      unlockedLevels: safeLevel ? [safeLevel] : [],
      points: 0,
      lifetimePoints: 0,
      battlePoints: 0,
      correctSpellingsTowardBattlePoint: 0,
      ownedCards: [],
      unlockedPackIds: [INITIAL_UNLOCKED_PACK_ID],
      queue: [],
      turn: 0,
      progress: {}
    };

    if (safeLevel) {
      ensureProgressForActiveWords(initialState);
      fillQueueToSize(initialState, ACTIVE_WORD_TARGET);
    } else {
      refreshActiveWords(initialState);
    }

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
      const selectedLevel = Number.isInteger(Number(parsed.selectedLevel)) ? clamp(Number(parsed.selectedLevel), MIN_LEVEL, MAX_LEVEL) : null;
      const loaded = {
        version: 11,
        lastUpdatedAt: Number.isFinite(parsed.lastUpdatedAt) ? parsed.lastUpdatedAt : 0,
        selectedLevel,
        unlockedLevels: Array.isArray(parsed.unlockedLevels) ? parsed.unlockedLevels : (selectedLevel ? [selectedLevel] : []),
        points: Number.isFinite(parsed.points) ? Math.max(0, parsed.points) : 0,
        lifetimePoints: Number.isFinite(parsed.lifetimePoints) ? Math.max(0, parsed.lifetimePoints) : 0,
        battlePoints: Number.isFinite(parsed.battlePoints) ? Math.max(0, parsed.battlePoints) : 0,
        correctSpellingsTowardBattlePoint: Number.isFinite(parsed.correctSpellingsTowardBattlePoint) ? Math.max(0, parsed.correctSpellingsTowardBattlePoint) : 0,
        ownedCards: Array.isArray(parsed.ownedCards) ? parsed.ownedCards : [],
        unlockedPackIds: Array.isArray(parsed.unlockedPackIds) ? parsed.unlockedPackIds : [INITIAL_UNLOCKED_PACK_ID],
        queue: Array.isArray(parsed.queue) ? parsed.queue : [],
        turn: Number.isFinite(parsed.turn) ? parsed.turn : 0,
        progress: parsed.progress && typeof parsed.progress === "object" ? parsed.progress : {}
      };

      if (!loaded.selectedLevel) {
        loaded.queue = [];
        loaded.progress = {};
      } else {
        loaded.unlockedLevels = getUnlockedLevels(loaded);
        ensureProgressForActiveWords(loaded);

        const allowedWords = new Set(WORDS);
        for (const word of Object.keys(loaded.progress)) {
          if (!allowedWords.has(word)) {
            delete loaded.progress[word];
          }
        }

        for (const word of WORDS) {
          const savedProgress = loaded.progress[word] || {};
          loaded.progress[word] = {
            ...makeBlankProgress(word),
            ...savedProgress,
            word,
            introduced: Boolean(savedProgress.introduced || savedProgress.mastered || Number(savedProgress.attempts || 0) > 0),
            mastered: Boolean(savedProgress.mastered),
            lastAttemptWasWrong: Boolean(savedProgress.lastAttemptWasWrong)
          };
        }
      }

      if (!Array.isArray(parsed.ownedCards) && Array.isArray(parsed.cards)) {
        const earnedPoints = calculateEarnedPoints(loaded) || Number(parsed.points) || 0;
        const safeLegacyCards = clamp(parsed.cards.length, 0, ACTIVE_CREATURE_CARD_TEMPLATES.length);
        loaded.ownedCards = Array.from({ length: safeLegacyCards }, (_value, index) => ({
          index,
          purchasedAt: Date.now() + index
        }));
        loaded.lifetimePoints = earnedPoints;
        loaded.points = Math.max(0, earnedPoints - calculateOwnedCardCost(safeLegacyCards));
      } else {
        loaded.ownedCards = sanitiseOwnedCards(loaded.ownedCards);
        loaded.lifetimePoints = Math.max(loaded.lifetimePoints, calculateEarnedPoints(loaded));
      }

      ensurePackUnlockState(loaded);
      cleanQueue(loaded);

      if (loaded.selectedLevel && loaded.queue.length === 0) {
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

  function writeLocalState(targetState = state) {
    window.localStorage.setItem(getStorageKey(), JSON.stringify(targetState));
  }

  function saveState(options = {}) {
    const { skipRemote = false, immediateRemote = false, preserveTimestamp = false } = options;
    if (!preserveTimestamp) {
      state.lastUpdatedAt = Date.now();
    }

    writeLocalState(state);

    if (skipRemote) {
      return;
    }

    if (immediateRemote) {
      saveRemoteProgress();
      return;
    }

    queueRemoteProgressSave();
  }

  function resetProgress() {
    if (!window.confirm("Reset all progress, points, and card purchases?")) {
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
    renderPacks();
    renderBattlePanel();
  }

  function selectNextWord() {
    clearAutoAdvance();
    if (!state.selectedLevel) {
      renderLevelSelector();
      elements.practicePanel.hidden = true;
      elements.restingPanel.hidden = false;
      elements.nextDueText.textContent = "";
      renderDueBadge();
      return;
    }
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
    focusAnswerInput();
  }

  function renderCurrentWord() {
    const points = scoreWord(currentWord);
    const progress = state.progress[currentWord];
    elements.wordLength.textContent = `${currentWord.length} letter word for ${points} ${pluralise(points, "point")}`;
    const entry = getEntryForWord(currentWord);
    elements.contextClue.textContent = entry ? `Level ${entry.level}${entry.band ? ` · ${entry.band}` : ""}` : (CONTEXT_CLUES[currentWord] || "");
    elements.revealWordButton.disabled = !canRevealCurrentWord();
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
    ensureProgressForActiveWords(targetState);
    const allowedWords = new Set(WORDS);
    const seen = new Set();
    targetState.queue = targetState.queue.filter((word) => {
      const progress = targetState.progress[word];
      if (!allowedWords.has(word)) {
        return false;
      }
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
    ensureProgressForActiveWords(targetState);
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

  function handleAnswerKeydown(event) {
    if (event.key !== "Enter" || event.shiftKey || event.isComposing) {
      return;
    }

    event.preventDefault();

    if (!elements.answerInput.disabled && elements.answerInput.value.trim()) {
      elements.form.requestSubmit();
    }
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
    saveState({ immediateRemote: wasCorrect });
    renderStats();
    renderShop();
    renderCollection();
    renderPacks();
    renderBattlePanel();
    lockPracticeControls();
    autoAdvanceTimer = window.setTimeout(selectNextWord, wasCorrect ? AUTO_ADVANCE_MS : WRONG_AUTO_ADVANCE_MS);
  }

  function handleCorrectAnswer(progress) {
    const earnedPoints = scoreWord(progress.word);
    const battlePointAward = recordCorrectSpellingForBattlePoints();
    const battleText = battlePointAward > 0 ? ` You earned ${battlePointAward} battle ${pluralise(battlePointAward, "point")}!` : "";

    progress.correctAttempts += 1;
    progress.lastAttemptWasWrong = false;
    progress.correctStreak = Math.min(MASTERY_STREAK, Number(progress.correctStreak || 0) + 1);
    state.points += earnedPoints;
    state.lifetimePoints += earnedPoints;

    if (progress.correctStreak >= MASTERY_STREAK && !progress.mastered) {
      progress.mastered = true;
      progress.masteredAt = Date.now();
      const unlockedLevel = unlockNextLevelIfReady(state);
      const unlockText = unlockedLevel ? ` Level ${unlockedLevel} words have been added.` : "";
      setFeedback(`Correct! +${earnedPoints} ${pluralise(earnedPoints, "point")}. Mastered “${progress.word}”.${battleText}${unlockText}`, "success");
      return;
    }

    const wordGap = progress.correctStreak === 1 ? FIRST_CORRECT_REVIEW_GAP : SECOND_CORRECT_REVIEW_GAP;
    insertWordAfterGap(progress.word, wordGap);
    setFeedback(`Correct! +${earnedPoints} ${pluralise(earnedPoints, "point")}. Streak: ${progress.correctStreak}/${MASTERY_STREAK}.${battleText}`, "success");
  }

  function recordCorrectSpellingForBattlePoints() {
    state.correctSpellingsTowardBattlePoint = Number(state.correctSpellingsTowardBattlePoint || 0) + 1;
    const awarded = Math.floor(state.correctSpellingsTowardBattlePoint / BATTLE_POINT_EVERY);

    if (awarded > 0) {
      state.battlePoints = Number(state.battlePoints || 0) + awarded;
      state.correctSpellingsTowardBattlePoint %= BATTLE_POINT_EVERY;
    }

    return awarded;
  }

  function handleIncorrectAnswer(progress, answer) {
    progress.correctStreak = 0;
    progress.lastAttemptWasWrong = true;
    insertWordAfterGap(progress.word, WRONG_REVIEW_GAP);
    setFeedback(`Not quite. ${answer ? `You typed “${answer}”. ` : ""}The word was “${progress.word}”. It will come back soon.`, "error");
  }

  function canRevealCurrentWord() {
    if (!currentWord) {
      return false;
    }

    const progress = state.progress[currentWord];
    return Boolean(progress && (Number(progress.attempts || 0) === 0 || progress.lastAttemptWasWrong));
  }

  function revealCurrentWord() {
    if (!canRevealCurrentWord()) {
      return;
    }

    elements.hintText.textContent = `Word: ${currentWord}`;
    focusAnswerInput();
  }

  function unlockNextLevelIfReady(targetState) {
    const unlockedLevels = getUnlockedLevels(targetState);
    if (unlockedLevels.length === 0) {
      return null;
    }

    const currentLevel = unlockedLevels[unlockedLevels.length - 1];
    if (currentLevel >= MAX_LEVEL) {
      return null;
    }

    const levelWords = getLevelEntries(currentLevel).map((entry) => entry.word);
    const masteredCount = levelWords.filter((word) => targetState.progress[word] && targetState.progress[word].mastered).length;
    const targetMastered = Math.max(1, levelWords.length - LEVEL_UNLOCK_REMAINING);

    if (masteredCount < targetMastered) {
      return null;
    }

    const nextLevel = currentLevel + 1;
    if (!targetState.unlockedLevels.includes(nextLevel)) {
      targetState.unlockedLevels.push(nextLevel);
      ensureProgressForActiveWords(targetState);
      return nextLevel;
    }

    return null;
  }

  function renderStats() {
    const masteredCount = WORDS.filter((word) => state.progress[word].mastered).length;
    const ownedCount = state.ownedCards.length;
    const availableCount = getShopCardIndexes().length;
    const currentPackProgress = getCurrentPackProgress();
    const unlockedCount = (state.unlockedPackIds || []).length;
    const spareUnlocks = Math.max(0, getPackUnlockSlots(state) - unlockedCount);

    elements.pointsTotal.textContent = state.points;
    elements.masteredTotal.textContent = masteredCount;
    elements.cardsTotal.textContent = ownedCount;
    elements.battlePointsTotal.textContent = Number(state.battlePoints || 0);
    if (elements.wordsCorrectTotal) {
      elements.wordsCorrectTotal.textContent = getTotalCorrectSpellings();
    }
    elements.battlePointNextText.textContent = `Next battle point in ${getCorrectSpellingsUntilBattlePoint()} words time`;
    const highestLevel = getUnlockedLevels(state).slice(-1)[0] || "—";
    elements.wordLevelBadge.textContent = state.selectedLevel ? `Level ${state.selectedLevel} · ${WORDS.length} words active` : "Choose a level";
    elements.shopOpenTotal.textContent = `${availableCount}/${ACTIVE_CREATURE_CARD_TEMPLATES.length}`;

    if (unlockedCount >= ACTIVE_CARD_PACKS.length) {
      elements.nextShopText.textContent = "All packs unlocked";
      elements.shopProgress.style.width = "100%";
    } else if (spareUnlocks > 0) {
      elements.nextShopText.textContent = `${spareUnlocks} pack unlock ready`;
      elements.shopProgress.style.width = `${(unlockedCount / ACTIVE_CARD_PACKS.length) * 100}%`;
    } else {
      elements.nextShopText.textContent = `${currentPackProgress.owned} / ${currentPackProgress.target} in ${currentPackProgress.pack.shortName}`;
      elements.shopProgress.style.width = `${currentPackProgress.target === 0 ? 100 : (currentPackProgress.owned / currentPackProgress.target) * 100}%`;
    }

    renderDueBadge();
  }

  function getTotalCorrectSpellings() {
    return Object.values(state.progress || {}).reduce((total, progress) => total + Number(progress.correctAttempts || 0), 0);
  }

  function getCorrectSpellingsUntilBattlePoint() {
    const progress = Number(state.correctSpellingsTowardBattlePoint || 0);
    return BATTLE_POINT_EVERY - (progress % BATTLE_POINT_EVERY);
  }

  function renderDueBadge() {
    elements.dueCount.textContent = String(state.queue.length);
  }

  function getShopCardIndexes() {
    const ownedSet = new Set(state.ownedCards.map((card) => card.index));
    return getAvailableCardIndexes().filter((index) => !ownedSet.has(index));
  }

  function renderShop() {
    const availableIndexes = getAvailableCardIndexes();
    const ownedSet = new Set(state.ownedCards.map((card) => card.index));
    const shopIndexes = availableIndexes.filter((index) => !ownedSet.has(index));
    const spareUnlocks = Math.max(0, getPackUnlockSlots(state) - (state.unlockedPackIds || []).length);
    const lockedCount = ACTIVE_CARD_PACKS.filter((pack) => !isPackUnlocked(pack.id)).length;

    elements.shopGrid.innerHTML = "";
    elements.shopStatusBadge.textContent = `${shopIndexes.length} cards available`;
    elements.shopMessage.textContent = lockedCount === 0
      ? "All packs are unlocked. Bought cards are shown only in your collection."
      : (spareUnlocks > 0 ? `You can unlock ${spareUnlocks} more pack${spareUnlocks === 1 ? "" : "s"}. Bought cards are shown in your collection.` : "Only unbought cards from unlocked packs appear in the shop.");

    if (shopIndexes.length === 0) {
      const empty = document.createElement("p");
      empty.className = "empty-album";
      empty.textContent = "No unbought cards are available in the shop right now. Unlock another pack or check your collection below.";
      elements.shopGrid.appendChild(empty);
      return;
    }

    for (const index of shopIndexes) {
      const template = ACTIVE_CREATURE_CARD_TEMPLATES[index];
      const cardCost = getCardCost(index);
      const affordable = state.points >= cardCost;
      const node = elements.shopCardTemplate.content.cloneNode(true);
      const article = node.querySelector(".monster-card");
      const button = node.querySelector("button");

      populateMysteryCardNode(node, template, `${getPackById(template.packId).shortName} pack`, cardCost);
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

      elements.shopGrid.appendChild(node);
    }
  }

  function renderCollection() {
    elements.collectionGrid.innerHTML = "";

    if (state.ownedCards.length === 0) {
      const empty = document.createElement("p");
      empty.className = "empty-album";
      empty.textContent = "No cards bought yet. Keep spelling words correctly and spend your points in the shop.";
      elements.collectionGrid.appendChild(empty);
      elements.collectionBadge.textContent = "No cards yet";
      renderBattlePanel();
      return;
    }

    const latestTemplate = ACTIVE_CREATURE_CARD_TEMPLATES[state.ownedCards[state.ownedCards.length - 1].index];
    elements.collectionBadge.textContent = `Latest: ${latestTemplate.name}`;

    state.ownedCards
      .slice()
      .sort((a, b) => Number(b.purchasedAt || 0) - Number(a.purchasedAt || 0))
      .forEach((ownedCard) => {
        const template = ACTIVE_CREATURE_CARD_TEMPLATES[ownedCard.index];
        const node = elements.collectionCardTemplate.content.cloneNode(true);
        populateRevealedCardNode(node, template, `Owned · ${ownedCard.source || "collection"}`, getCardCost(ownedCard.index), ownedCard.attackStrength);
        const article = node.querySelector(".monster-card");
        article.dataset.instanceId = ownedCard.id || "";
        article.dataset.cardIndex = String(ownedCard.index);
        node.querySelector(".monster-card__cost").textContent = "Owned";
        const historyButton = node.querySelector("[data-history-toggle]");
        if (historyButton) {
          historyButton.dataset.instanceId = ownedCard.id || "";
        }
        elements.collectionGrid.appendChild(node);
      });

    renderBattlePanel();
  }

  function populateRevealedCardNode(node, template, metaText, cardCost, battleAttack = null) {
    const image = node.querySelector(".monster-card__image");
    const rarity = getRarityForCost(cardCost);
    image.src = template.art;
    image.alt = `${template.name} card artwork`;
    image.loading = "lazy";

    node.querySelector(".monster-card__art-badge").textContent = rarity;
    node.querySelector(".monster-card__tagline").textContent = template.tagline;
    node.querySelector(".monster-card__type").textContent = template.type;
    node.querySelector(".monster-card__rarity-pill").textContent = rarity;
    node.querySelector(".monster-card__title").textContent = template.name;
    node.querySelector(".monster-card__description").textContent = template.description;
    node.querySelector(".monster-card__attack").textContent = isValidBattleAttack(battleAttack) ? Number(battleAttack) : "?";
    const rarityShort = node.querySelector(".monster-card__rarity-short");
    if (rarityShort) rarityShort.textContent = shortRarity(rarity);
    node.querySelector(".monster-card__meta").textContent = metaText;
    node.querySelector(".monster-card__cost").textContent = `${cardCost} pts`;
  }

  function populateMysteryCardNode(node, template, metaText, cardCost) {
    const image = node.querySelector(".monster-card__image");
    const rarity = getRarityForCost(cardCost);
    image.removeAttribute("src");
    image.alt = "";

    node.querySelector(".monster-card__art-badge").textContent = "Mystery";
    node.querySelector(".monster-card__tagline").textContent = "Buy to reveal";
    node.querySelector(".monster-card__type").textContent = template.type;
    node.querySelector(".monster-card__rarity-pill").textContent = rarity;
    node.querySelector(".monster-card__title").textContent = template.name;
    node.querySelector(".monster-card__description").textContent = "A mystery card. Buy it to reveal the artwork and unlock its Battle Arena Attack stat later in the arena.";
    node.querySelector(".monster-card__attack").textContent = "?";
    const rarityShort = node.querySelector(".monster-card__rarity-short");
    if (rarityShort) rarityShort.textContent = shortRarity(rarity);
    node.querySelector(".monster-card__meta").textContent = metaText;
    node.querySelector(".monster-card__cost").textContent = `${cardCost} pts`;
  }

  function populateLockedCardNode(node, template) {
    const image = node.querySelector(".monster-card__image");
    image.removeAttribute("src");
    image.alt = "";

    const pack = getPackById(template.packId);
    node.querySelector(".monster-card__art-badge").textContent = "Pack locked";
    node.querySelector(".monster-card__tagline").textContent = pack ? pack.shortName : "Locked";
    node.querySelector(".monster-card__type").textContent = "Locked";
    node.querySelector(".monster-card__rarity-pill").textContent = "???";
    node.querySelector(".monster-card__title").textContent = "???";
    node.querySelector(".monster-card__description").textContent = pack ? `Unlock ${pack.name} to reveal this card.` : "Unlock another pack to reveal this card.";
    node.querySelector(".monster-card__attack").textContent = "?";
    const rarityShort = node.querySelector(".monster-card__rarity-short");
    if (rarityShort) rarityShort.textContent = "?";
    node.querySelector(".monster-card__meta").textContent = "Locked";
    node.querySelector(".monster-card__cost").textContent = "—";
  }

  async function handleCollectionClick(event) {
    const button = event.target.closest("[data-history-toggle]");
    if (!button) return;
    const article = button.closest(".monster-card");
    const panel = article && article.querySelector(".monster-card__history");
    const list = article && article.querySelector(".monster-card__history-list");
    if (!article || !panel || !list) return;

    const showing = article.classList.toggle("is-showing-history");
    panel.hidden = !showing;
    button.textContent = showing ? "Hide card history" : "Show card history";
    if (!showing || list.dataset.loaded === "true") return;

    list.innerHTML = "<li>Loading history…</li>";
    const historyItems = await getCardHistory(article.dataset.instanceId, Number(article.dataset.cardIndex));
    list.innerHTML = historyItems.map((item) => `<li>${item}</li>`).join("") || "<li>No history yet.</li>";
    list.dataset.loaded = "true";
  }

  async function getCardHistory(instanceId, cardIndex) {
    if (!supabaseClient || !currentUser || !instanceId) {
      return [`First bought by ${getCurrentUsername()} on ${formatDate(Date.now())}.`];
    }

    const { data, error } = await supabaseClient
      .from("card_history")
      .select("user_id,action,created_at")
      .eq("card_instance_id", instanceId)
      .order("created_at", { ascending: true });

    if (error || !data || data.length === 0) {
      return [`First bought by ${getCurrentUsername()} on ${formatDate(Date.now())}.`];
    }

    const userIds = [...new Set(data.map((row) => row.user_id).filter(Boolean))];
    let nameMap = new Map();
    if (userIds.length > 0) {
      const { data: profiles } = await supabaseClient.from("profiles").select("user_id,display_name,username").in("user_id", userIds);
      nameMap = new Map((profiles || []).map((profile) => [profile.user_id, profile.display_name || profile.username || "Player"]));
    }

    return data.map((row, index) => {
      const playerName = nameMap.get(row.user_id) || "Player";
      const prefix = index === 0 && row.action !== "battle_win" ? "First bought by" : (row.action === "battle_win" ? "Won by" : "Bought by");
      return `${prefix} ${playerName} on ${formatDate(row.created_at)}.`;
    });
  }

  function formatDate(value) {
    return new Date(value).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  }

function handleShopClick(event) {
    const button = event.target.closest("button[data-card-index]");
    if (!button) {
      return;
    }

    buyCard(Number(button.dataset.cardIndex));
  }

  async function buyCard(cardIndex) {
    const availableIndexes = new Set(getAvailableCardIndexes());
    const ownedSet = new Set(state.ownedCards.map((card) => card.index));

    if (!Number.isInteger(cardIndex) || !availableIndexes.has(cardIndex)) {
      setShopFlash("That card is not available yet. Unlock its pack first.", "error");
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

    state.points -= cardCost;
    const localCard = { index: cardIndex, purchasedAt: Date.now(), source: "shop", attackStrength: null };
    state.ownedCards.push(localCard);
    lastPurchasedIndex = cardIndex;
    saveState({ immediateRemote: true });

    const insertedCard = await upsertUserCard(cardIndex, "shop");
    if (insertedCard && insertedCard.id) {
      localCard.id = insertedCard.id;
      localCard.purchasedAt = new Date(insertedCard.purchased_at).getTime() || localCard.purchasedAt;
      saveState({ immediateRemote: true });
    }

    renderStats();
    renderShop();
    renderCollection();
    renderPacks();
    renderBattlePanel();

    const template = ACTIVE_CREATURE_CARD_TEMPLATES[cardIndex];
    const spareUnlocks = Math.max(0, getPackUnlockSlots(state) - (state.unlockedPackIds || []).length);
    const unlockText = spareUnlocks > 0 ? " You can now unlock another pack." : "";
    setShopFlash(`Bought ${template.name} for ${cardCost} ${pluralise(cardCost, "point")}.${unlockText}`, "success");
  }

  function getCardCost(cardIndex) {
    const template = ACTIVE_CREATURE_CARD_TEMPLATES[cardIndex];
    if (!template) return 50;
    const packIndexes = getCardsInPack(template.packId);
    const position = packIndexes.indexOf(cardIndex);
    if (position < 0) return 50;
    if (position < 3) return 5;
    if (position < 6) return 10;
    if (position < 9) return 20;
    if (position < 12) return 40;
    return 50;
  }

  function getRarityForCost(cost) {
    return ({ 5: "Common", 10: "Uncommon", 20: "Rare", 40: "Epic", 50: "Legendary" }[cost] || "Common");
  }

  function calculateOwnedCardCost(cardCount) {
    let total = 0;
    for (let index = 0; index < cardCount; index += 1) {
      total += getCardCost(index);
    }
    return total;
  }

  function getAvailableCardIndexes() {
    const unlocked = new Set(state.unlockedPackIds || [INITIAL_UNLOCKED_PACK_ID]);
    return ACTIVE_CREATURE_CARD_TEMPLATES
      .map((card, index) => unlocked.has(card.packId) ? index : null)
      .filter((index) => index !== null);
  }

  function isPackUnlocked(packId) {
    return (state.unlockedPackIds || []).includes(packId);
  }

  function getPackById(packId) {
    return ACTIVE_CARD_PACKS.find((pack) => pack.id === packId);
  }

  function getNextLockedPack() {
    return ACTIVE_CARD_PACKS.find((pack) => !isPackUnlocked(pack.id)) || null;
  }

  function getLastUnlockedPack() {
    const unlocked = state.unlockedPackIds || [INITIAL_UNLOCKED_PACK_ID];
    const lastUnlockedId = unlocked[unlocked.length - 1] || INITIAL_UNLOCKED_PACK_ID;
    return getPackById(lastUnlockedId) || ACTIVE_CARD_PACKS[0];
  }

  function getCardsInPack(packId) {
    return ACTIVE_CREATURE_CARD_TEMPLATES
      .map((card, index) => card.packId === packId ? index : null)
      .filter((index) => index !== null);
  }

  function getOwnedIndexes() {
    return new Set(state.ownedCards.map((card) => card.index));
  }

  function getOwnedCountForPack(targetState, packId) {
    const ownedIndexes = new Set((targetState.ownedCards || []).map((card) => card.index));
    return getCardsInPack(packId).filter((index) => ownedIndexes.has(index)).length;
  }

  function getPackUnlockThreshold(packId) {
    return Math.max(1, Math.ceil(getCardsInPack(packId).length / 2));
  }

  function getCurrentPackProgress() {
    const unlocked = state.unlockedPackIds || [INITIAL_UNLOCKED_PACK_ID];
    const candidateId = unlocked.find((packId) => getOwnedCountForPack(state, packId) < getPackUnlockThreshold(packId)) || unlocked[0] || INITIAL_UNLOCKED_PACK_ID;
    const currentPack = getPackById(candidateId) || ACTIVE_CARD_PACKS[0];
    const owned = getOwnedCountForPack(state, currentPack.id);
    const target = getPackUnlockThreshold(currentPack.id);
    return { pack: currentPack, owned: clamp(owned, 0, target), target, total: getCardsInPack(currentPack.id).length };
  }

  function getPackUnlockSlots(targetState) {
    const unlocked = Array.isArray(targetState.unlockedPackIds) && targetState.unlockedPackIds.length
      ? targetState.unlockedPackIds
      : [INITIAL_UNLOCKED_PACK_ID];
    let slots = 1;
    unlocked.forEach((packId) => {
      if (getOwnedCountForPack(targetState, packId) >= getPackUnlockThreshold(packId)) {
        slots += 1;
      }
    });
    return Math.min(slots, ACTIVE_CARD_PACKS.length);
  }

  function ensurePackUnlockState(targetState) {
    const validPackIds = new Set(ACTIVE_CARD_PACKS.map((pack) => pack.id));
    targetState.unlockedPackIds = Array.isArray(targetState.unlockedPackIds)
      ? targetState.unlockedPackIds.filter((packId) => validPackIds.has(packId))
      : [];

    if (targetState.unlockedPackIds.length === 0) {
      targetState.unlockedPackIds = [INITIAL_UNLOCKED_PACK_ID];
    }
  }

  function unlockEligiblePacks() {
    return null;
  }

  async function unlockPack(packId) {
    if (!currentUser) {
      setShopFlash("Create an account or sign in before unlocking more packs.", "info");
      return;
    }
    if (!packId || isPackUnlocked(packId)) return;
    const spareUnlocks = getPackUnlockSlots(state) - (state.unlockedPackIds || []).length;
    if (spareUnlocks <= 0) {
      setShopFlash("Own at least half the cards in an unlocked pack to unlock another pack.", "info");
      return;
    }
    state.unlockedPackIds.push(packId);
    saveState();
    renderStats();
    renderShop();
    renderPacks();
    setShopFlash(`Unlocked ${getPackById(packId).name}.`, "success");
  }

  function handlePackClick(event) {
    const button = event.target.closest("button[data-pack-id]");
    if (!button) return;
    unlockPack(button.dataset.packId);
  }

  function renderPacks() {
    if (!elements.packGrid) return;
    elements.packGrid.innerHTML = "";
    const unlocked = new Set(state.unlockedPackIds || []);
    const spareUnlocks = Math.max(0, getPackUnlockSlots(state) - unlocked.size);
    elements.packStatusBadge.textContent = `${unlocked.size}/${ACTIVE_CARD_PACKS.length} unlocked`;

    for (const pack of ACTIVE_CARD_PACKS) {
      const cardIndexes = getCardsInPack(pack.id);
      const ownedCount = cardIndexes.filter((index) => getOwnedIndexes().has(index)).length;
      const isUnlocked = unlocked.has(pack.id);
      const canUnlock = !isUnlocked && spareUnlocks > 0 && Boolean(currentUser);
      const packNode = document.createElement("article");
      packNode.className = isUnlocked ? "pack-tile is-unlocked" : "pack-tile is-locked";
      packNode.innerHTML = `
        <h3>${pack.name}</h3>
        <p>${pack.description}</p>
        <strong>${ownedCount}/${cardIndexes.length} cards owned</strong>
        <span>${isUnlocked ? "Unlocked" : (currentUser ? "Locked" : "Sign in to unlock")}</span>
        ${canUnlock ? `<button class="primary-button" type="button" data-pack-id="${pack.id}">Unlock this pack</button>` : ""}
      `;
      elements.packGrid.appendChild(packNode);
    }
  }

  function normaliseBattleAttack(value) {
    const attack = Number(value);
    return isValidBattleAttack(attack) ? attack : null;
  }

  function isValidBattleAttack(value, minimum = 1) {
    const attack = Number(value);
    return Number.isInteger(attack) && attack >= minimum && attack <= 100;
  }

  function sanitiseOwnedCards(cards) {
    return cards
      .filter((card) => card && typeof card === "object")
      .map((card) => ({
        id: card.id || null,
        index: Number(card.index),
        purchasedAt: Number(card.purchasedAt) || Date.now(),
        source: card.source || "shop",
        attackStrength: normaliseBattleAttack(card.attackStrength)
      }))
      .filter((card) => Number.isInteger(card.index) && card.index >= 0 && card.index < ACTIVE_CREATURE_CARD_TEMPLATES.length)
      .sort((a, b) => a.purchasedAt - b.purchasedAt);
  }

function scoreWord(word) {
    const length = word.length;
    if (length <= 2) return 1;
    if (length <= 4) return 2;
    if (length <= 6) return 3;
    if (length <= 8) return 4;
    return 5;
  }

  function calculateEarnedPoints(targetState) {
    return WORDS.reduce((total, word) => {
      const progress = targetState.progress[word];
      const correctAttempts = Number(progress && progress.correctAttempts ? progress.correctAttempts : 0);
      return total + Math.max(0, correctAttempts) * scoreWord(word);
    }, 0);
  }

  
  function getSupabaseConfig() {
    return window.DINO_SUPABASE || {};
  }

  function hasSupabaseConfig() {
    const config = getSupabaseConfig();
    return Boolean(config.url && config.anonKey && window.supabase);
  }

  async function initialiseSupabase() {
    if (!hasSupabaseConfig()) {
      elements.authStatus.textContent = "Supabase is not configured yet. Progress is saved on this device only.";
      elements.signInButton.disabled = true;
      elements.signUpButton.disabled = true;
      elements.signOutButton.hidden = true;
      renderBattlePanel();
      return;
    }

    const config = getSupabaseConfig();
    supabaseClient = window.supabase.createClient(config.url, config.anonKey);
    await loadWordEntriesFromSupabase();

    const { data } = await supabaseClient.auth.getSession();
    await handleAuthSession(data.session);

    supabaseClient.auth.onAuthStateChange(async (_event, session) => {
      await handleAuthSession(session);
    });
  }

  async function loadWordEntriesFromSupabase() {
    if (!supabaseClient) {
      return;
    }

    let allRows = await fetchWordEntryRows({ listId: "graded-5000" });

    if (allRows.length === 0) {
      allRows = await fetchWordEntryRows({ listId: null });
    }

    if (allRows.length > 0) {
      setWordEntries(allRows);
      state = restoreStateShape(state);
      saveState();
      return;
    }

    elements.authStatus.textContent = "Using local word list. No database words were returned.";
  }

  async function fetchWordEntryRows({ listId }) {
    const allRows = [];
    const pageSize = 1000;

    for (let from = 0; from < 6000; from += pageSize) {
      let query = supabaseClient
        .from("word_entries")
        .select("word,level,band,simple_sentence,sort_order")
        .order("level", { ascending: true })
        .order("sort_order", { ascending: true })
        .range(from, from + pageSize - 1);

      if (listId) {
        query = query.eq("list_id", listId);
      }

      const { data, error } = await query;

      if (error) {
        elements.authStatus.textContent = `Using local word list. Database word list not loaded: ${error.message}`;
        return [];
      }

      allRows.push(...(data || []));
      if (!data || data.length < pageSize) {
        break;
      }
    }

    return allRows;
  }

  async function handleAuthSession(session) {
    currentUser = session && session.user ? session.user : null;
    renderAuthPanel();

    if (currentUser) {
      await ensureProfile();
      await loadRemoteProgress();
      await refreshCardsFromSupabase();
      renderLevelSelector();
      renderStats();
      renderShop();
      renderCollection();
      renderPacks();
      renderBattlePanel();
      renderLeaderboards();
      renderLevelSelector();
    } else {
      renderBattlePanel();
      renderLeaderboards();
      renderLevelSelector();
    }
  }

  function renderAuthPanel() {
    if (!currentUser) {
      elements.authStatus.textContent = supabaseClient
        ? "Create an account or sign in with a username and password."
        : "Supabase is not configured yet. Progress is saved on this device only.";
      elements.signOutButton.hidden = true;
      elements.signInButton.hidden = false;
      elements.signUpButton.hidden = false;
      elements.signInButton.disabled = !supabaseClient;
      elements.signUpButton.disabled = !supabaseClient;
      elements.authEmail.disabled = !supabaseClient;
      elements.authPassword.disabled = !supabaseClient;
      return;
    }

    elements.authStatus.textContent = `Signed in as ${getCurrentUsername()}.`;
    elements.signOutButton.hidden = false;
    elements.signInButton.hidden = true;
    elements.signUpButton.hidden = true;
    elements.authEmail.disabled = false;
    elements.authPassword.disabled = false;
  }

  function makeUsernameEmail(username) {
    const clean = username.replace(/[^a-z0-9._-]/gi, "").toLowerCase();
    return `${clean}@spellbattlecards.example`;
  }

  function getUsernameInput() {
    return String(elements.authEmail.value || "").trim().toLowerCase();
  }

  function getCurrentUsername() {
    if (!currentUser) return "player";
    return (currentUser.user_metadata && currentUser.user_metadata.username) ||
      (currentUser.email || "player").split("@")[0] ||
      "player";
  }

  async function signUpUser() {
    if (!supabaseClient) return;
    const username = getUsernameInput();
    const password = elements.authPassword.value;
    if (!username || !password) {
      elements.authStatus.textContent = "Enter a username and password first.";
      return;
    }

    const { data, error } = await supabaseClient.auth.signUp({
      email: makeUsernameEmail(username),
      password,
      options: { data: { username } }
    });
    if (error) {
      elements.authStatus.textContent = `Sign-up error: ${error.message}`;
      return;
    }

    if (!data.session) {
      await supabaseClient.auth.signInWithPassword({ email: makeUsernameEmail(username), password });
    }
    elements.authStatus.textContent = "Account created.";
  }

  async function signInUser() {
    if (!supabaseClient) return;
    const username = getUsernameInput();
    const password = elements.authPassword.value;
    if (!username || !password) {
      elements.authStatus.textContent = "Enter a username and password first.";
      return;
    }

    const { error } = await supabaseClient.auth.signInWithPassword({ email: makeUsernameEmail(username), password });
    elements.authStatus.textContent = error ? `Sign-in error: ${error.message}` : "Signed in.";
  }

  async function signOutUser() {
    if (!supabaseClient) return;
    stopBattlePolling();
    await supabaseClient.auth.signOut();
    currentUser = null;
    renderAuthPanel();
    renderBattlePanel();
    renderPacks();
  }

  async function ensureProfile() {
    if (!supabaseClient || !currentUser) return;

    await supabaseClient
      .from("profiles")
      .upsert({
        user_id: currentUser.id,
        email: currentUser.email || null,
        display_name: getCurrentUsername(),
        username: getCurrentUsername(),
        starting_level: state.selectedLevel || null,
        updated_at: new Date().toISOString()
      }, { onConflict: "user_id" });
  }

  function queueRemoteProgressSave() {
    if (!supabaseClient || !currentUser) return;

    window.clearTimeout(remoteSaveTimer);
    remoteSaveTimer = window.setTimeout(saveRemoteProgress, 200);
  }

  function handlePageLifecycleSave() {
    if (!state) return;

    state.lastUpdatedAt = Date.now();
    writeLocalState(state);

    if (supabaseClient && currentUser) {
      window.clearTimeout(remoteSaveTimer);
      saveRemoteProgress();
    }
  }

  async function saveRemoteProgress() {
    if (!supabaseClient || !currentUser) return;

    window.clearTimeout(remoteSaveTimer);
    remoteSaveTimer = null;
    state.lastUpdatedAt = state.lastUpdatedAt || Date.now();
    writeLocalState(state);

    const { error } = await supabaseClient
      .from("user_progress")
      .upsert({
        user_id: currentUser.id,
        mode: "graded",
        state,
        updated_at: new Date().toISOString()
      }, { onConflict: "user_id,mode" });

    if (!error) {
      renderLeaderboards();
    }
  }

  async function loadRemoteProgress() {
    if (!supabaseClient || !currentUser) return;

    const localBeforeRemote = restoreStateShape(state);
    const { data, error } = await supabaseClient
      .from("user_progress")
      .select("state,updated_at")
      .eq("user_id", currentUser.id)
      .eq("mode", "graded")
      .maybeSingle();

    if (error) {
      elements.authStatus.textContent = `Could not load saved progress: ${error.message}`;
      return;
    }

    if (data && data.state) {
      const remoteState = restoreStateShape(data.state);
      state = mergeGameStates(localBeforeRemote, remoteState);
      saveState({ immediateRemote: true, preserveTimestamp: true });
    } else {
      state = localBeforeRemote;
      saveState({ immediateRemote: true, preserveTimestamp: true });
    }

    await syncUnsyncedOwnedCardsToSupabase();
  }

  function restoreStateShape(savedState) {
    const selectedLevel = Number.isInteger(Number(savedState.selectedLevel)) ? clamp(Number(savedState.selectedLevel), MIN_LEVEL, MAX_LEVEL) : null;
    const restored = {
      ...makeInitialState(selectedLevel),
      ...savedState,
      lastUpdatedAt: Number.isFinite(savedState.lastUpdatedAt) ? savedState.lastUpdatedAt : 0,
      selectedLevel,
      progress: savedState.progress && typeof savedState.progress === "object" ? savedState.progress : {},
      ownedCards: sanitiseOwnedCards(savedState.ownedCards || []),
      unlockedPackIds: Array.isArray(savedState.unlockedPackIds) ? savedState.unlockedPackIds : [INITIAL_UNLOCKED_PACK_ID],
      unlockedLevels: Array.isArray(savedState.unlockedLevels) ? savedState.unlockedLevels : (selectedLevel ? [selectedLevel] : [])
    };

    if (restored.selectedLevel) {
      ensureProgressForActiveWords(restored);
      for (const word of WORDS) {
        const savedProgress = restored.progress[word] || {};
        restored.progress[word] = {
          ...makeBlankProgress(word),
          ...savedProgress,
          word,
          introduced: Boolean(savedProgress.introduced || savedProgress.mastered || Number(savedProgress.attempts || 0) > 0),
          mastered: Boolean(savedProgress.mastered),
          lastAttemptWasWrong: Boolean(savedProgress.lastAttemptWasWrong)
        };
      }
    }

    ensurePackUnlockState(restored);
    cleanQueue(restored);
    fillQueueToSize(restored, ACTIVE_WORD_TARGET);
    return restored;
  }

  function mergeGameStates(localState, remoteState) {
    const localScore = getStateProgressScore(localState);
    const remoteScore = getStateProgressScore(remoteState);
    const baseState = localScore >= remoteScore ? localState : remoteState;
    const otherState = localScore >= remoteScore ? remoteState : localState;
    const merged = restoreStateShape(baseState);

    merged.lastUpdatedAt = Math.max(Number(localState.lastUpdatedAt || 0), Number(remoteState.lastUpdatedAt || 0), Date.now());
    merged.selectedLevel = merged.selectedLevel || otherState.selectedLevel || null;
    merged.unlockedLevels = mergeNumberLists(localState.unlockedLevels, remoteState.unlockedLevels).filter((level) => level >= MIN_LEVEL && level <= MAX_LEVEL);
    if (merged.selectedLevel && merged.unlockedLevels.length === 0) {
      merged.unlockedLevels = [merged.selectedLevel];
    }

    merged.unlockedPackIds = mergePackIds(localState.unlockedPackIds, remoteState.unlockedPackIds);
    merged.points = Math.max(Number(localState.points || 0), Number(remoteState.points || 0));
    merged.lifetimePoints = Math.max(Number(localState.lifetimePoints || 0), Number(remoteState.lifetimePoints || 0), calculateEarnedPoints(merged));
    merged.battlePoints = Math.max(Number(localState.battlePoints || 0), Number(remoteState.battlePoints || 0));
    merged.correctSpellingsTowardBattlePoint = Math.max(Number(localState.correctSpellingsTowardBattlePoint || 0), Number(remoteState.correctSpellingsTowardBattlePoint || 0));
    merged.ownedCards = mergeOwnedCards(localState.ownedCards || [], remoteState.ownedCards || []);
    merged.progress = mergeProgressMaps(localState.progress || {}, remoteState.progress || {});

    ensureProgressForActiveWords(merged);
    ensurePackUnlockState(merged);
    cleanQueue(merged);
    fillQueueToSize(merged, ACTIVE_WORD_TARGET);
    return merged;
  }

  function getStateProgressScore(targetState) {
    const progressValues = Object.values(targetState.progress || {});
    const mastered = progressValues.filter((progress) => progress && progress.mastered).length;
    const correctAttempts = progressValues.reduce((sum, progress) => sum + Number(progress && progress.correctAttempts || 0), 0);
    return Number(targetState.lifetimePoints || 0) +
      Number(targetState.points || 0) +
      Number(targetState.battlePoints || 0) * 25 +
      (targetState.ownedCards || []).length * 35 +
      mastered * 12 +
      correctAttempts * 3 +
      (targetState.unlockedPackIds || []).length * 15 +
      (targetState.unlockedLevels || []).length * 10;
  }

  function mergeProgressMaps(localProgress, remoteProgress) {
    const merged = {};
    const allWords = new Set([...Object.keys(localProgress || {}), ...Object.keys(remoteProgress || {})]);
    allWords.forEach((word) => {
      const localWord = localProgress[word] || {};
      const remoteWord = remoteProgress[word] || {};
      const localScore = getWordProgressScore(localWord);
      const remoteScore = getWordProgressScore(remoteWord);
      const base = localScore >= remoteScore ? localWord : remoteWord;
      const laterAttempt = Number(localWord.lastAttemptAt || 0) >= Number(remoteWord.lastAttemptAt || 0) ? localWord : remoteWord;
      merged[word] = {
        ...makeBlankProgress(word),
        ...base,
        word,
        attempts: Math.max(Number(localWord.attempts || 0), Number(remoteWord.attempts || 0)),
        correctAttempts: Math.max(Number(localWord.correctAttempts || 0), Number(remoteWord.correctAttempts || 0)),
        correctStreak: Math.max(Number(localWord.correctStreak || 0), Number(remoteWord.correctStreak || 0)),
        introduced: Boolean(localWord.introduced || remoteWord.introduced),
        mastered: Boolean(localWord.mastered || remoteWord.mastered),
        masteredAt: localWord.masteredAt || remoteWord.masteredAt || null,
        lastAttemptAt: Math.max(Number(localWord.lastAttemptAt || 0), Number(remoteWord.lastAttemptAt || 0)) || null,
        lastAttemptWasWrong: Boolean(laterAttempt.lastAttemptWasWrong)
      };
    });
    return merged;
  }

  function getWordProgressScore(progress) {
    return (progress && progress.mastered ? 100 : 0) +
      Number(progress && progress.correctAttempts || 0) * 10 +
      Number(progress && progress.correctStreak || 0) * 3 +
      Number(progress && progress.attempts || 0);
  }

  function mergeOwnedCards(localCards, remoteCards) {
    const merged = [];
    const seenIds = new Set();
    const seenLoose = new Set();

    [...sanitiseOwnedCards(remoteCards || []), ...sanitiseOwnedCards(localCards || [])].forEach((card) => {
      if (card.id) {
        if (seenIds.has(card.id)) return;
        seenIds.add(card.id);
        merged.push(card);
        return;
      }

      const looseKey = `${card.index}|${card.purchasedAt}|${card.source || "shop"}`;
      if (seenLoose.has(looseKey)) return;
      seenLoose.add(looseKey);
      merged.push(card);
    });

    return merged.sort((a, b) => a.purchasedAt - b.purchasedAt);
  }

  function mergeNumberLists(first = [], second = []) {
    return Array.from(new Set([...(first || []), ...(second || [])].map(Number).filter(Number.isFinite))).sort((a, b) => a - b);
  }

  function mergePackIds(first = [], second = []) {
    const validPackIds = new Set(ACTIVE_CARD_PACKS.map((pack) => pack.id));
    const merged = Array.from(new Set([...(first || []), ...(second || []), INITIAL_UNLOCKED_PACK_ID]))
      .filter((packId) => validPackIds.has(packId));
    return merged.length > 0 ? merged : [INITIAL_UNLOCKED_PACK_ID];
  }

  async function upsertUserCard(cardIndex, source = "shop", options = {}) {
    if (!supabaseClient || !currentUser) return null;

    const purchasedAt = new Date(options.purchasedAt || Date.now()).toISOString();
    const attackStrength = isValidBattleAttack(options.attackStrength) ? Number(options.attackStrength) : null;
    const { data, error } = await supabaseClient
      .from("user_cards")
      .insert({
        user_id: currentUser.id,
        card_index: cardIndex,
        purchased_at: purchasedAt,
        acquired_from: source,
        attack_strength: attackStrength
      })
      .select()
      .single();

    if (!error && data && data.id) {
      await supabaseClient.from("card_history").insert({
        card_instance_id: data.id,
        user_id: currentUser.id,
        action: source === "battle_win" ? "battle_win" : "shop_purchase",
        created_at: data.purchased_at || purchasedAt
      });
    }

    return error ? null : data;
  }

  async function refreshCardsFromSupabase() {
    if (!supabaseClient || !currentUser) return;

    const { data, error } = await supabaseClient
      .from("user_cards")
      .select("id,card_index,purchased_at,acquired_from,attack_strength")
      .eq("user_id", currentUser.id)
      .order("purchased_at", { ascending: true });

    if (error) {
      elements.authStatus.textContent = `Could not load cards: ${error.message}`;
      return;
    }

    const serverCards = sanitiseOwnedCards((data || []).map((card) => ({
      id: card.id,
      index: card.card_index,
      purchasedAt: new Date(card.purchased_at).getTime() || Date.now(),
      source: card.acquired_from || "shop",
      attackStrength: normaliseBattleAttack(card.attack_strength)
    })));

    state.ownedCards = mergeOwnedCards(state.ownedCards || [], serverCards);
    ensurePackUnlockState(state);
    saveState({ preserveTimestamp: true });
    await syncUnsyncedOwnedCardsToSupabase();
  }

  async function syncUnsyncedOwnedCardsToSupabase() {
    if (!supabaseClient || !currentUser) return;

    let changed = false;
    for (const card of state.ownedCards) {
      if (card.id || !Number.isInteger(card.index)) {
        continue;
      }

      const insertedCard = await upsertUserCard(card.index, card.source || "shop", {
        purchasedAt: card.purchasedAt,
        attackStrength: card.attackStrength
      });

      if (insertedCard && insertedCard.id) {
        card.id = insertedCard.id;
        card.purchasedAt = new Date(insertedCard.purchased_at).getTime() || card.purchasedAt;
        card.attackStrength = normaliseBattleAttack(insertedCard.attack_strength) || card.attackStrength || null;
        changed = true;
      }
    }

    if (changed) {
      saveState({ immediateRemote: true });
      renderCollection();
      renderBattlePanel();
    }
  }

  function getBattleHeartbeatCutoffIso() {
    return new Date(Date.now() - BATTLE_HEARTBEAT_STALE_MS).toISOString();
  }

  function getBattleWaitTimeoutIso() {
    return new Date(Date.now() - BATTLE_WAIT_TIMEOUT_MS).toISOString();
  }

  function setBattleWaitingUi(isWaiting) {
    document.body.classList.toggle("is-battle-waiting", Boolean(isWaiting));
    if (elements.cancelBattleButton) {
      elements.cancelBattleButton.hidden = !isWaiting;
    }
    if (elements.enterBattleButton) {
      elements.enterBattleButton.hidden = Boolean(isWaiting);
    }
    if (elements.battleCardSelect && isWaiting) {
      elements.battleCardSelect.disabled = true;
    }
  }

  async function refreshBattleLobbyCount() {
    if (!elements.battleQueueCount) return;

    if (!supabaseClient || !currentUser) {
      elements.battleQueueCount.textContent = "Sign in to see the arena queue.";
      return;
    }

    const { count, error } = await supabaseClient
      .from("battle_rooms")
      .select("id", { count: "exact", head: true })
      .eq("status", "waiting")
      .neq("challenger_id", currentUser.id)
      .gte("heartbeat_at", getBattleHeartbeatCutoffIso());

    if (error) {
      elements.battleQueueCount.textContent = "Arena queue loading…";
      return;
    }

    const waiting = Number(count || 0);
    elements.battleQueueCount.textContent = waiting === 1
      ? "1 other player waiting"
      : `${waiting} other players waiting`;
  }

  function startBattleLobbyRefresh() {
    if (battleLobbyTimer) {
      window.clearInterval(battleLobbyTimer);
    }
    battleLobbyTimer = window.setInterval(refreshBattleLobbyCount, BATTLE_LOBBY_REFRESH_MS);
  }

  async function sendBattleHeartbeat() {
    if (!supabaseClient || !currentUser || !currentBattle || currentBattle.status !== "waiting") {
      return;
    }

    const { error } = await supabaseClient
      .from("battle_rooms")
      .update({ heartbeat_at: new Date().toISOString() })
      .eq("id", currentBattle.id)
      .eq("challenger_id", currentUser.id)
      .eq("status", "waiting");

    if (!error) {
      currentBattle.heartbeat_at = new Date().toISOString();
    }
  }

  async function cancelOwnStaleWaitingBattles() {
    if (!supabaseClient || !currentUser) return;

    await supabaseClient
      .from("battle_rooms")
      .update({ status: "cancelled" })
      .eq("challenger_id", currentUser.id)
      .eq("status", "waiting")
      .lt("created_at", getBattleWaitTimeoutIso());
  }

  async function cancelWaitingBattle() {
    if (!supabaseClient || !currentUser || !currentBattle || currentBattle.status !== "waiting") {
      currentBattle = null;
      currentBattlePointSpent = false;
      setBattleWaitingUi(false);
      renderBattlePanel();
      return;
    }

    await supabaseClient
      .from("battle_rooms")
      .update({ status: "cancelled" })
      .eq("id", currentBattle.id)
      .eq("challenger_id", currentUser.id)
      .eq("status", "waiting");

    stopBattlePolling();
    currentBattle = null;
    currentBattlePointSpent = false;
    setBattleWaitingUi(false);
    setBattleWaitingUi(false);
    elements.battleStatus.textContent = "Battle cancelled. You kept your battle point.";
    elements.battleOpponent.textContent = "";
    elements.battleResult.textContent = "";
    renderBattlePanel();
    refreshBattleLobbyCount();
  }

  async function cancelWaitingBattleIfExpired() {
    if (!currentBattle || currentBattle.status !== "waiting") {
      return false;
    }

    const createdAt = new Date(currentBattle.created_at || Date.now()).getTime();
    if (Date.now() - createdAt < BATTLE_WAIT_TIMEOUT_MS) {
      return false;
    }

    await cancelWaitingBattle();
    elements.battleStatus.textContent = "No opponent joined in time, so the battle was cancelled. You kept your battle point.";
    return true;
  }

  function renderBattlePanel() {
    if (!elements.battlePanel) return;

    const ownedCards = state.ownedCards
      .map((ownedCard) => ({ ...ownedCard, template: ACTIVE_CREATURE_CARD_TEMPLATES[ownedCard.index] }))
      .filter((ownedCard) => ownedCard.template);

    elements.battleCardSelect.innerHTML = "";
    for (const ownedCard of ownedCards) {
      const option = document.createElement("option");
      option.value = String(ownedCard.id || `${ownedCard.index}-${ownedCard.purchasedAt}`);
      option.textContent = `${ownedCard.template.name} (Attack ${isValidBattleAttack(ownedCard.attackStrength) ? ownedCard.attackStrength : "?"})`;
      elements.battleCardSelect.appendChild(option);
    }

    const isWaiting = Boolean(currentBattle && currentBattle.status === "waiting");
    setBattleWaitingUi(isWaiting);

    const battlePoints = Number(state.battlePoints || 0);
    const canBattle = Boolean(currentUser && supabaseClient && ownedCards.length > 0 && battlePoints > 0 && !currentBattle);
    elements.battleCardSelect.disabled = !canBattle || isWaiting;
    elements.enterBattleButton.disabled = !canBattle;

    if (elements.battlePointNextText) {
      elements.battlePointNextText.textContent = `Next battle point in ${getCorrectSpellingsUntilBattlePoint()} words time`;
    }

    refreshBattleLobbyCount();

    if (isWaiting) {
      elements.battleStatus.textContent = "Waiting for an opponent. Keep this battle lobby open, or cancel to leave without spending a battle point.";
    } else if (!currentUser) {
      elements.battleStatus.textContent = "Sign in to battle.";
    } else if (ownedCards.length === 0) {
      elements.battleStatus.textContent = "Buy a card to battle.";
    } else if (battlePoints <= 0) {
      elements.battleStatus.textContent = `You need 1 battle point. ${getCorrectSpellingsUntilBattlePoint()} more correct spellings to earn one.`;
    } else if (!currentBattle) {
      elements.battleStatus.textContent = `Ready. You have ${battlePoints} battle ${pluralise(battlePoints, "point")}.`;
    }
  }

  async function enterBattleArena() {
    if (!supabaseClient || !currentUser) {
      elements.battleStatus.textContent = "Sign in first to use the battle arena.";
      return;
    }

    const selectedId = String(elements.battleCardSelect.value || "");
    const ownedCard = state.ownedCards.find((card) => String(card.id || `${card.index}-${card.purchasedAt}`) === selectedId);
    if (!ownedCard) {
      elements.battleStatus.textContent = "Choose a card you own.";
      return;
    }

    if (Number(state.battlePoints || 0) < 1) {
      elements.battleStatus.textContent = `You need 1 battle point. ${getCorrectSpellingsUntilBattlePoint()} more correct spellings to earn one.`;
      return;
    }

    currentBattlePointSpent = false;
    elements.enterBattleButton.disabled = true;
    elements.battleResult.textContent = "";
    renderBattleGrid(0.5);
    await cancelOwnStaleWaitingBattles();

    const attackStrength = await getOrCreateBattleStrength(ownedCard);
    const displayName = getCurrentUsername();

    const { data: waitingBattle } = await supabaseClient
      .from("battle_rooms")
      .select("*")
      .eq("status", "waiting")
      .neq("challenger_id", currentUser.id)
      .gte("heartbeat_at", getBattleHeartbeatCutoffIso())
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (waitingBattle) {
      const { data: joinedBattle, error } = await supabaseClient
        .from("battle_rooms")
        .update({
          opponent_id: currentUser.id,
          opponent_name: displayName,
          opponent_card_index: ownedCard.index,
          opponent_card_id: ownedCard.id || null,
          opponent_attack: attackStrength,
          status: "ready"
        })
        .eq("id", waitingBattle.id)
        .eq("status", "waiting")
        .select()
        .single();

      if (error) {
        elements.battleStatus.textContent = `Could not join battle: ${error.message}`;
        elements.enterBattleButton.disabled = false;
        return;
      }

      spendBattlePoint();
      currentBattlePointSpent = true;
      currentBattle = joinedBattle;
      renderMatchedBattle(joinedBattle);
      await resolveCurrentBattle();
      return;
    }

    const { data: createdBattle, error } = await supabaseClient
      .from("battle_rooms")
      .insert({
        challenger_id: currentUser.id,
        challenger_name: displayName,
        challenger_card_index: ownedCard.index,
        challenger_card_id: ownedCard.id || null,
        challenger_attack: attackStrength,
        heartbeat_at: new Date().toISOString(),
        status: "waiting"
      })
      .select()
      .single();

    if (error) {
      elements.battleStatus.textContent = `Could not create battle: ${error.message}`;
      elements.enterBattleButton.disabled = false;
      return;
    }

    currentBattlePointSpent = false;
    currentBattle = createdBattle;
    setBattleWaitingUi(true);
    elements.battleStatus.textContent = `Waiting for an opponent. ${ACTIVE_CREATURE_CARD_TEMPLATES[ownedCard.index].name} strength: ${attackStrength}. Keep this lobby open, or cancel to leave.`;
    elements.battleOpponent.textContent = "";
    startBattlePolling(createdBattle.id);
  }

  async function tryMatchWhileWaiting() {
    if (!supabaseClient || !currentUser || !currentBattle || currentBattle.status !== "waiting") {
      return false;
    }

    const currentCreatedAt = currentBattle.created_at || new Date().toISOString();
    const { data: waitingBattle, error: findError } = await supabaseClient
      .from("battle_rooms")
      .select("*")
      .eq("status", "waiting")
      .neq("challenger_id", currentUser.id)
      .gte("heartbeat_at", getBattleHeartbeatCutoffIso())
      .lt("created_at", currentCreatedAt)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (findError || !waitingBattle) {
      return false;
    }

    const selectedId = String(elements.battleCardSelect.value || "");
    const ownedCard = state.ownedCards.find((card) => String(card.id || `${card.index}-${card.purchasedAt}`) === selectedId);
    if (!ownedCard) {
      elements.battleStatus.textContent = "Choose a card you own.";
      return false;
    }

    const attackStrength = await getOrCreateBattleStrength(ownedCard);
    const displayName = getCurrentUsername();
    const ownWaitingBattleId = currentBattle.id;

    const { data: joinedBattle, error: joinError } = await supabaseClient
      .from("battle_rooms")
      .update({
        opponent_id: currentUser.id,
        opponent_name: displayName,
        opponent_card_index: ownedCard.index,
        opponent_card_id: ownedCard.id || null,
        opponent_attack: attackStrength,
        status: "ready"
      })
      .eq("id", waitingBattle.id)
      .eq("status", "waiting")
      .select()
      .single();

    if (joinError || !joinedBattle) {
      return false;
    }

    await supabaseClient
      .from("battle_rooms")
      .update({ status: "cancelled" })
      .eq("id", ownWaitingBattleId)
      .eq("challenger_id", currentUser.id)
      .eq("status", "waiting");

    spendBattlePoint();
    currentBattlePointSpent = true;
    currentBattle = joinedBattle;
    setBattleWaitingUi(false);
    renderMatchedBattle(joinedBattle);
    await resolveCurrentBattle();
    return true;
  }

  function spendBattlePoint() {
    state.battlePoints = Math.max(0, Number(state.battlePoints || 0) - 1);
    saveState({ immediateRemote: true });
    renderStats();
  }

  async function getOrCreateBattleStrength(ownedCard) {
    const minStrength = getCardCost(ownedCard.index);
    if (isValidBattleAttack(ownedCard.attackStrength, minStrength)) {
      return Number(ownedCard.attackStrength);
    }

    const attackStrength = randomInt(minStrength, 100);

    if (ownedCard.id) {
      const { error } = await supabaseClient
        .from("user_cards")
        .update({ attack_strength: attackStrength })
        .eq("id", ownedCard.id)
        .eq("user_id", currentUser.id);

      if (!error) {
        ownedCard.attackStrength = attackStrength;
        const local = state.ownedCards.find((card) => card.id === ownedCard.id);
        if (local) local.attackStrength = attackStrength;
        saveState({ immediateRemote: true });
        renderCollection();
      }
    } else {
      ownedCard.attackStrength = attackStrength;
      saveState({ immediateRemote: true });
    }

    return attackStrength;
  }

  function startBattlePolling(battleId) {
    stopBattlePolling();
    battlePollTimer = window.setInterval(async () => {
      const { data } = await supabaseClient
        .from("battle_rooms")
        .select("*")
        .eq("id", battleId)
        .maybeSingle();

      if (!data) return;
      currentBattle = data;

      if (data.status === "waiting") {
        await sendBattleHeartbeat();
        const expired = await cancelWaitingBattleIfExpired();
        if (!expired) {
          await tryMatchWhileWaiting();
        }
        return;
      }

      if (data.status === "ready") {
        renderMatchedBattle(data);
        if (!currentBattlePointSpent) {
          spendBattlePoint();
          currentBattlePointSpent = true;
        }
        await resolveCurrentBattle();
      } else if (data.status === "resolved") {
        stopBattlePolling();
        setBattleWaitingUi(false);
        await showResolvedBattle(data);
        await refreshCardsFromSupabase();
        renderStats();
        renderShop();
        renderCollection();
        renderPacks();
      } else if (data.status === "cancelled") {
        stopBattlePolling();
        currentBattle = null;
        currentBattlePointSpent = false;
        setBattleWaitingUi(false);
        elements.battleStatus.textContent = "Battle cancelled. You kept your battle point.";
        renderBattlePanel();
      }
    }, 2500);
  }

  function stopBattlePolling() {
    if (battlePollTimer) {
      window.clearInterval(battlePollTimer);
      battlePollTimer = null;
    }
  }

  function renderMatchedBattle(battle) {
    const perspective = getBattlePerspective(battle);
    if (!perspective) {
      return;
    }

    const myCard = ACTIVE_CREATURE_CARD_TEMPLATES[perspective.myCardIndex];
    const opponentCard = ACTIVE_CREATURE_CARD_TEMPLATES[perspective.opponentCardIndex];
    elements.battleStatus.textContent = `${myCard.name}: ${perspective.myAttack}`;
    elements.battleOpponent.textContent = `${perspective.opponentName || "Opponent"}: ${opponentCard.name}, ${perspective.opponentAttack}`;
    renderBattleGrid(perspective.userPercent);
  }

  async function resolveCurrentBattle() {
    if (!currentBattle || currentBattle.status === "resolved") {
      return;
    }

    stopBattlePolling();

    const battleBeforeResolve = { ...currentBattle };
    const { data, error } = await supabaseClient.rpc("resolve_battle", {
      p_battle_id: currentBattle.id
    });

    if (error) {
      elements.battleResult.textContent = `Battle matched, but resolve_battle is not ready: ${error.message}`;
      elements.enterBattleButton.disabled = false;
      return;
    }

    const resolved = Array.isArray(data) ? data[0] : data;
    const result = { ...battleBeforeResolve, ...(resolved || {}) };
    await showResolvedBattle(result);
    await refreshCardsFromSupabase();
    renderStats();
    renderShop();
    renderCollection();
    renderPacks();
  }

  async function showResolvedBattle(result) {
    const winnerId = result.winner_id;
    const didWin = winnerId === currentUser.id;
    const perspective = getBattlePerspective(result);

    if (perspective) {
      renderMatchedBattle(result);
      elements.battleResult.textContent = "Attack square spinning…";
      const attackRoll = Number(result.result_roll);
      const perspectiveRoll = Number.isFinite(attackRoll) ? (perspective.isChallenger ? attackRoll : 1 - attackRoll) : NaN;
      await animateBattleAttack(perspective.userPercent, didWin, perspectiveRoll);
    }

    elements.battleResult.textContent = didWin
      ? "You won the card!"
      : "You lost your card. You can buy it again.";

    currentBattle = null;
    currentBattlePointSpent = false;
    elements.enterBattleButton.disabled = false;
    renderBattlePanel();
  }

  function getBattlePerspective(battle) {
    if (!battle || !currentUser || !battle.opponent_id) {
      return null;
    }

    const isChallenger = battle.challenger_id === currentUser.id;
    const myCardIndex = isChallenger ? battle.challenger_card_index : battle.opponent_card_index;
    const opponentCardIndex = isChallenger ? battle.opponent_card_index : battle.challenger_card_index;
    const myAttack = isChallenger ? battle.challenger_attack : battle.opponent_attack;
    const opponentAttack = isChallenger ? battle.opponent_attack : battle.challenger_attack;
    const opponentName = isChallenger ? battle.opponent_name : battle.challenger_name;

    if (!Number.isFinite(myAttack) || !Number.isFinite(opponentAttack)) {
      return null;
    }

    return {
      isChallenger,
      myCardIndex,
      opponentCardIndex,
      myAttack,
      opponentAttack,
      opponentName,
      userPercent: myAttack / (myAttack + opponentAttack)
    };
  }

  function renderBattleGrid(userPercent, highlightedIndex = null) {
    elements.battleGrid.innerHTML = "";
    const redSquares = Math.round(clamp(userPercent, 0, 1) * 100);

    for (let index = 0; index < 100; index += 1) {
      const square = document.createElement("span");
      square.className = index < redSquares ? "battle-square is-user" : "battle-square is-opponent";
      if (index === highlightedIndex) {
        square.classList.add("is-highlighted");
      }
      elements.battleGrid.appendChild(square);
    }
  }

  function animateBattleAttack(userPercent, didWin, resultRoll) {
    const steps = 30;
    const totalMs = 6000;
    const redSquares = Math.max(1, Math.min(99, Math.round(clamp(userPercent, 0, 1) * 100)));
    const winningPool = didWin
      ? Array.from({ length: redSquares }, (_value, index) => index)
      : Array.from({ length: 100 - redSquares }, (_value, index) => redSquares + index);
    let targetIndex = Number.isFinite(resultRoll) ? Math.max(0, Math.min(99, Math.floor(resultRoll * 100))) : winningPool[randomInt(0, winningPool.length - 1)];

    if (winningPool.indexOf(targetIndex) === -1) {
      targetIndex = winningPool[randomInt(0, winningPool.length - 1)];
    }
    const sequence = Array.from({ length: steps - 1 }, () => randomInt(0, 99)).concat(targetIndex);

    sequence.forEach((squareIndex, stepIndex) => {
      const progress = stepIndex / (steps - 1);
      const delay = Math.round(totalMs * progress * progress);
      window.setTimeout(() => {
        renderBattleGrid(userPercent, squareIndex);
      }, delay);
    });

    return new Promise((resolve) => {
      window.setTimeout(resolve, totalMs + 250);
    });
  }

  function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }


  
  async function renderLeaderboards() {
    if (!elements.pointsLeaderboard || !elements.masteredLeaderboard) {
      return;
    }

    if (!supabaseClient) {
      renderLeaderboardList(elements.pointsLeaderboard, []);
      renderLeaderboardList(elements.masteredLeaderboard, []);
      return;
    }

    const { data, error } = await supabaseClient.rpc("get_spell_battle_leaderboards");

    if (error) {
      renderLeaderboardError(elements.pointsLeaderboard, "Leaderboard unavailable");
      renderLeaderboardError(elements.masteredLeaderboard, "Leaderboard unavailable");
      return;
    }

    const rows = Array.isArray(data) ? data : [];
    renderLeaderboardList(
      elements.pointsLeaderboard,
      rows.filter((row) => row.leaderboard_type === "points")
    );
    renderLeaderboardList(
      elements.masteredLeaderboard,
      rows.filter((row) => row.leaderboard_type === "mastered")
    );
  }

  function renderLeaderboardList(element, rows) {
    element.innerHTML = "";

    if (!rows || rows.length === 0) {
      const empty = document.createElement("li");
      empty.className = "leaderboard-empty";
      empty.textContent = "No scores yet";
      element.appendChild(empty);
      return;
    }

    rows.slice(0, 10).forEach((row) => {
      const item = document.createElement("li");
      const name = row.username || "Player";
      const score = Number(row.score || 0);
      item.innerHTML = `<span><strong>#${row.rank}</strong> ${escapeHtml(name)}</span><b>${score}</b>`;
      element.appendChild(item);
    });
  }

  function renderLeaderboardError(element, message) {
    element.innerHTML = "";
    const item = document.createElement("li");
    item.className = "leaderboard-empty";
    item.textContent = message;
    element.appendChild(item);
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
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
      const defaultVoice = getDefaultVoice(englishVoices);
      const selectedVoice = englishVoices.find((voice) => voice.name === savedVoice) || defaultVoice;

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

  function getDefaultVoice(englishVoices) {
    return englishVoices.find((voice) => voice.name === DEFAULT_VOICE_NAME && voice.lang === DEFAULT_VOICE_LANG) ||
      englishVoices.find((voice) => voice.name === DEFAULT_VOICE_NAME) ||
      englishVoices.find((voice) => voice.lang === DEFAULT_VOICE_LANG && voice.name.toLowerCase().includes("google")) ||
      englishVoices.find((voice) => voice.lang === DEFAULT_VOICE_LANG) ||
      englishVoices[0];
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

  function getSentenceForWord(word) {
    const entry = getEntryForWord(word);
    return (entry && entry.sentence) || SIMPLE_SENTENCES[word] || `Please spell the word ${word}.`;
  }

  function speakCurrentWord() {
    if (!currentWord) {
      return;
    }

    focusAnswerInput();

    if (!("speechSynthesis" in window)) {
      elements.hintText.textContent = `Speech is not available in this browser. Ask a grown-up to read: ${currentWord}`;
      return;
    }

    window.speechSynthesis.cancel();

    const sentence = getSentenceForWord(currentWord);
    const utterance = new SpeechSynthesisUtterance(`${currentWord}. As in, ${sentence}`);
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
    utterance.onend = focusAnswerInput;
    window.speechSynthesis.speak(utterance);
    window.setTimeout(focusAnswerInput, 80);
  }

  function focusAnswerInput() {
    if (!elements.answerInput || elements.answerInput.disabled) {
      return;
    }

    elements.answerInput.focus({ preventScroll: true });
  }

  function renderRestingState() {
    elements.practicePanel.hidden = false;
    elements.restingPanel.hidden = true;
    elements.nextDueText.textContent = "";
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
