(function () {
  "use strict";

  let WORD_ENTRIES = normaliseWordEntries(window.GRADED_SPELLING_WORDS || []);
  let WORD_ENTRIES_BY_LEVEL = groupWordEntriesByLevel(WORD_ENTRIES);
  let WORDS = [];

  const BASE_STORAGE_KEY = "spell-battle-cards-state-v11";
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
  const MIN_LEVEL = 1;
  const MAX_LEVEL = 20;
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
    authStatus: document.querySelector("#authStatus"),
    packGrid: document.querySelector("#packGrid"),
    packStatusBadge: document.querySelector("#packStatusBadge"),
    battlePanel: document.querySelector("#battlePanel"),
    battleCardSelect: document.querySelector("#battleCardSelect"),
    enterBattleButton: document.querySelector("#enterBattleButton"),
    battleStatus: document.querySelector("#battleStatus"),
    battleOpponent: document.querySelector("#battleOpponent"),
    battleGrid: document.querySelector("#battleGrid"),
    battleResult: document.querySelector("#battleResult")
  };

  let state = loadState();
  let currentWord = null;
  let autoAdvanceTimer = null;
  let availableVoices = [];
  let lastPurchasedIndex = null;
  let supabaseClient = null;
  let currentUser = null;
  let remoteSaveTimer = null;
  let currentBattle = null;
  let battlePollTimer = null;

  initialise();

  function initialise() {
    elements.form.addEventListener("submit", handleSubmit);
    elements.answerInput.addEventListener("keydown", handleAnswerKeydown);
    elements.speakButton.addEventListener("click", speakCurrentWord);
    elements.hintButton.addEventListener("click", showHint);
    elements.revealWordButton.addEventListener("click", revealCurrentWord);
    elements.skipButton.addEventListener("click", skipCurrentWord);
    elements.resetButton.addEventListener("click", resetProgress);
    elements.refreshButton.addEventListener("click", selectNextWord);
    elements.shopGrid.addEventListener("click", handleShopClick);
    elements.levelGrid.addEventListener("click", handleLevelChoice);
    elements.signInButton.addEventListener("click", signInUser);
    elements.signUpButton.addEventListener("click", signUpUser);
    elements.signOutButton.addEventListener("click", signOutUser);
    elements.enterBattleButton.addEventListener("click", enterBattleArena);

    renderLevelSelector();
    setupVoicePicker();
    initialiseSupabase();
    selectNextWord();
    renderStats();
    renderShop();
    renderCollection();
    renderPacks();
    renderBattlePanel();
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
    elements.levelPanel.hidden = hasLevel;
    elements.levelGrid.innerHTML = "";

    if (hasLevel) {
      elements.levelStatus.textContent = `Starting level ${state.selectedLevel}. Levels unlocked: ${getUnlockedLevels(state).join(", ")}.`;
      return;
    }

    elements.levelStatus.textContent = currentUser
      ? "Choose the level that feels right. You can see examples before starting."
      : "Choose a starting level. Sign in to save it online.";

    for (let level = MIN_LEVEL; level <= MAX_LEVEL; level += 1) {
      const examples = getLevelEntries(level).slice(0, 10).map((entry) => entry.word);
      const tile = document.createElement("article");
      tile.className = "level-tile";
      tile.innerHTML = `
        <h3>Level ${level}</h3>
        <p>${examples.join(", ") || "Words loading…"}</p>
        <button class="primary-button" type="button" data-level="${level}">Start level ${level}</button>
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
    currentWord = null;
    clearAutoAdvance();
    saveState();
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
        const safeLegacyCards = clamp(parsed.cards.length, 0, CREATURE_CARD_TEMPLATES.length);
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

  function saveState() {
    window.localStorage.setItem(getStorageKey(), JSON.stringify(state));
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
      elements.nextDueText.textContent = "Choose a starting level to begin.";
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
    elements.answerInput.focus();
  }

  function renderCurrentWord() {
    const points = scoreWord(currentWord);
    const progress = state.progress[currentWord];
    elements.wordLength.textContent = `Word length: ${currentWord.length} letters · worth ${points} ${pluralise(points, "point")}`;
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
    saveState();
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
    const availableCount = getAvailableCardIndexes().length;
    const nextPack = getNextLockedPack();
    const currentPackProgress = getCurrentPackProgress();

    elements.pointsTotal.textContent = state.points;
    elements.masteredTotal.textContent = masteredCount;
    elements.cardsTotal.textContent = ownedCount;
    elements.battlePointsTotal.textContent = Number(state.battlePoints || 0);
    elements.battlePointNextText.textContent = `${getCorrectSpellingsUntilBattlePoint()} correct to next battle point`;
    const highestLevel = getUnlockedLevels(state).slice(-1)[0] || "—";
    elements.wordLevelBadge.textContent = state.selectedLevel ? `Level ${highestLevel} · ${WORDS.length} words active` : "Choose a level";
    elements.shopOpenTotal.textContent = `${availableCount}/${CREATURE_CARD_TEMPLATES.length}`;

    if (!nextPack) {
      elements.nextShopText.textContent = "All packs unlocked";
      elements.shopProgress.style.width = "100%";
    } else {
      elements.nextShopText.textContent = `${currentPackProgress.owned} / ${currentPackProgress.target} in ${currentPackProgress.pack.shortName}`;
      elements.shopProgress.style.width = `${currentPackProgress.target === 0 ? 100 : (currentPackProgress.owned / currentPackProgress.target) * 100}%`;
    }

    renderDueBadge();
  }

  function getCorrectSpellingsUntilBattlePoint() {
    const progress = Number(state.correctSpellingsTowardBattlePoint || 0);
    return BATTLE_POINT_EVERY - (progress % BATTLE_POINT_EVERY);
  }

  function renderDueBadge() {
    elements.dueCount.textContent = `${state.queue.length} queued`;
  }

  function renderShop() {
    const availableIndexes = new Set(getAvailableCardIndexes());
    const nextPack = getNextLockedPack();
    const ownedSet = new Set(state.ownedCards.map((card) => card.index));

    elements.shopGrid.innerHTML = "";
    elements.shopStatusBadge.textContent = `${availableIndexes.size} cards available`;

    if (nextPack) {
      const progress = getCurrentPackProgress();
      const remaining = Math.max(0, progress.target - progress.owned);
      elements.shopMessage.textContent = remaining === 1
        ? `Buy 1 more card from ${progress.pack.name} to unlock ${nextPack.name}.`
        : `Buy ${remaining} more cards from ${progress.pack.name} to unlock ${nextPack.name}.`;
    } else {
      elements.shopMessage.textContent = "All card packs are unlocked.";
    }

    CREATURE_CARD_TEMPLATES.forEach((template, index) => {
      const released = availableIndexes.has(index);
      const owned = ownedSet.has(index);
      const cardCost = getCardCost(index);
      const affordable = state.points >= cardCost;
      const node = elements.shopCardTemplate.content.cloneNode(true);
      const article = node.querySelector(".monster-card");
      const button = node.querySelector("button");

      if (released && owned) {
        populateRevealedCardNode(node, template, `Card ${index + 1} of ${CREATURE_CARD_TEMPLATES.length}`, cardCost);
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
      } else {
        populateLockedCardNode(node, template);
        article.classList.add("is-locked");
        button.textContent = "Pack locked";
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
      renderBattlePanel();
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

    renderBattlePanel();
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

    node.querySelector(".monster-card__art-badge").textContent = "Mystery";
    node.querySelector(".monster-card__tagline").textContent = "Buy to reveal";
    node.querySelector(".monster-card__type").textContent = "Hidden";
    node.querySelector(".monster-card__rarity-pill").textContent = "???";
    node.querySelector(".monster-card__title").textContent = template.name;
    node.querySelector(".monster-card__description").textContent = "A mystery card. Buy it to flip the card and reveal the artwork, type, rarity, ATK, and PWR.";
    node.querySelector(".monster-card__attack").textContent = "?";
    node.querySelector(".monster-card__power").textContent = "?";
    node.querySelector(".monster-card__rarity-short").textContent = "?";
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
    state.ownedCards.push({ index: cardIndex, purchasedAt: Date.now() });
    lastPurchasedIndex = cardIndex;

    const unlockedPack = unlockEligiblePacks(state);
    saveState();
    await upsertUserCard(cardIndex);
    renderStats();
    renderShop();
    renderCollection();
    renderPacks();
    renderBattlePanel();

    const template = CREATURE_CARD_TEMPLATES[cardIndex];
    const unlockText = unlockedPack ? ` ${unlockedPack.name} just unlocked!` : "";
    setShopFlash(`Bought ${template.name} for ${cardCost} ${pluralise(cardCost, "point")}.${unlockText}`, "success");
  }

  function getCardCost(cardIndex) {
    const template = CREATURE_CARD_TEMPLATES[cardIndex];
    if (template && Number.isFinite(template.price)) {
      return template.price;
    }

    return (Math.floor(cardIndex / CARD_PRICE_GROUP_SIZE) + 1) * CARD_PRICE_STEP;
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
    return CREATURE_CARD_TEMPLATES
      .map((card, index) => unlocked.has(card.packId) ? index : null)
      .filter((index) => index !== null);
  }

  function isPackUnlocked(packId) {
    return (state.unlockedPackIds || []).includes(packId);
  }

  function getPackById(packId) {
    return CARD_PACKS.find((pack) => pack.id === packId);
  }

  function getNextLockedPack() {
    return CARD_PACKS.find((pack) => !isPackUnlocked(pack.id)) || null;
  }

  function getLastUnlockedPack() {
    const unlocked = state.unlockedPackIds || [INITIAL_UNLOCKED_PACK_ID];
    const lastUnlockedId = unlocked[unlocked.length - 1] || INITIAL_UNLOCKED_PACK_ID;
    return getPackById(lastUnlockedId) || CARD_PACKS[0];
  }

  function getCardsInPack(packId) {
    return CREATURE_CARD_TEMPLATES
      .map((card, index) => card.packId === packId ? index : null)
      .filter((index) => index !== null);
  }

  function getOwnedIndexes() {
    return new Set(state.ownedCards.map((card) => card.index));
  }

  function getCurrentPackProgress() {
    const currentPack = getLastUnlockedPack();
    const packCards = getCardsInPack(currentPack.id);
    const ownedIndexes = getOwnedIndexes();
    const ownedInPack = packCards.filter((index) => ownedIndexes.has(index)).length;
    const target = Math.max(0, packCards.length - PACK_UNLOCK_REMAINING_TRIGGER);

    return {
      pack: currentPack,
      owned: clamp(ownedInPack, 0, target),
      target,
      total: packCards.length
    };
  }

  function ensurePackUnlockState(targetState) {
    const validPackIds = new Set(CARD_PACKS.map((pack) => pack.id));
    targetState.unlockedPackIds = Array.isArray(targetState.unlockedPackIds)
      ? targetState.unlockedPackIds.filter((packId) => validPackIds.has(packId))
      : [];

    if (targetState.unlockedPackIds.length === 0) {
      targetState.unlockedPackIds = [INITIAL_UNLOCKED_PACK_ID];
    }

    const ownedIndexes = new Set((targetState.ownedCards || []).map((card) => card.index));
    for (const cardIndex of ownedIndexes) {
      const packId = CREATURE_CARD_TEMPLATES[cardIndex] && CREATURE_CARD_TEMPLATES[cardIndex].packId;
      const packIndex = CARD_PACKS.findIndex((pack) => pack.id === packId);
      for (let index = 0; index <= packIndex; index += 1) {
        const unlockId = CARD_PACKS[index].id;
        if (!targetState.unlockedPackIds.includes(unlockId)) {
          targetState.unlockedPackIds.push(unlockId);
        }
      }
    }

    unlockEligiblePacks(targetState);
  }

  function unlockEligiblePacks(targetState) {
    const originalState = state;
    if (targetState !== state) {
      state = targetState;
    }

    let newlyUnlockedPack = null;
    const nextPack = getNextLockedPack();
    if (nextPack) {
      const progress = getCurrentPackProgress();
      if (progress.owned >= progress.target) {
        state.unlockedPackIds.push(nextPack.id);
        newlyUnlockedPack = nextPack;
      }
    }

    if (targetState !== originalState) {
      targetState.unlockedPackIds = state.unlockedPackIds;
      state = originalState;
    }

    return newlyUnlockedPack;
  }

  function renderPacks() {
    if (!elements.packGrid) {
      return;
    }

    elements.packGrid.innerHTML = "";
    const unlocked = new Set(state.unlockedPackIds || []);
    const ownedIndexes = getOwnedIndexes();

    elements.packStatusBadge.textContent = `${unlocked.size}/${CARD_PACKS.length} packs unlocked`;

    for (const pack of CARD_PACKS) {
      const cardIndexes = getCardsInPack(pack.id);
      const ownedCount = cardIndexes.filter((index) => ownedIndexes.has(index)).length;
      const packNode = document.createElement("article");
      packNode.className = unlocked.has(pack.id) ? "pack-tile is-unlocked" : "pack-tile is-locked";
      packNode.innerHTML = `
        <h3>${pack.name}</h3>
        <p>${pack.description}</p>
        <strong>${ownedCount}/${cardIndexes.length} cards owned</strong>
        <span>${unlocked.has(pack.id) ? "Unlocked" : pack.unlockHint}</span>
      `;
      elements.packGrid.appendChild(packNode);
    }
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

    const allRows = [];
    const pageSize = 1000;
    for (let from = 0; from < 6000; from += pageSize) {
      const { data, error } = await supabaseClient
        .from("word_entries")
        .select("word,level,band,simple_sentence,sort_order")
        .eq("list_id", "graded-5000")
        .order("level", { ascending: true })
        .order("sort_order", { ascending: true })
        .range(from, from + pageSize - 1);

      if (error) {
        elements.authStatus.textContent = `Using local word list. Database word list not loaded: ${error.message}`;
        return;
      }

      allRows.push(...(data || []));
      if (!data || data.length < pageSize) {
        break;
      }
    }

    if (allRows.length > 0) {
      setWordEntries(allRows);
      state = restoreStateShape(state);
      saveState();
    }
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
      renderLevelSelector();
    } else {
      renderBattlePanel();
      renderLevelSelector();
    }
  }

  function renderAuthPanel() {
    if (!currentUser) {
      elements.authStatus.textContent = supabaseClient
        ? "Not signed in. Sign in to save progress and use the battle arena."
        : "Supabase is not configured yet. Progress is saved on this device only.";
      elements.signOutButton.hidden = true;
      elements.signInButton.disabled = !supabaseClient;
      elements.signUpButton.disabled = !supabaseClient;
      elements.authEmail.disabled = !supabaseClient;
      elements.authPassword.disabled = !supabaseClient;
      return;
    }

    elements.authStatus.textContent = `Signed in as ${currentUser.email || "player"}. Progress sync is on.`;
    elements.signOutButton.hidden = false;
    elements.signInButton.disabled = true;
    elements.signUpButton.disabled = true;
    elements.authEmail.disabled = true;
    elements.authPassword.disabled = true;
  }

  async function signUpUser() {
    if (!supabaseClient) return;
    const email = elements.authEmail.value.trim();
    const password = elements.authPassword.value;
    if (!email || !password) {
      elements.authStatus.textContent = "Enter an email and password first.";
      return;
    }

    const { error } = await supabaseClient.auth.signUp({ email, password });
    elements.authStatus.textContent = error
      ? `Sign-up error: ${error.message}`
      : "Account created. Check your email if Supabase asks for confirmation, then sign in.";
  }

  async function signInUser() {
    if (!supabaseClient) return;
    const email = elements.authEmail.value.trim();
    const password = elements.authPassword.value;
    if (!email || !password) {
      elements.authStatus.textContent = "Enter an email and password first.";
      return;
    }

    const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
    elements.authStatus.textContent = error ? `Sign-in error: ${error.message}` : "Signed in.";
  }

  async function signOutUser() {
    if (!supabaseClient) return;
    stopBattlePolling();
    await supabaseClient.auth.signOut();
    currentUser = null;
    renderAuthPanel();
    renderBattlePanel();
  }

  async function ensureProfile() {
    if (!supabaseClient || !currentUser) return;

    await supabaseClient
      .from("profiles")
      .upsert({
        user_id: currentUser.id,
        email: currentUser.email || null,
        display_name: (currentUser.email || "Player").split("@")[0],
        starting_level: state.selectedLevel || null,
        updated_at: new Date().toISOString()
      }, { onConflict: "user_id" });
  }

  function queueRemoteProgressSave() {
    if (!supabaseClient || !currentUser) return;

    window.clearTimeout(remoteSaveTimer);
    remoteSaveTimer = window.setTimeout(saveRemoteProgress, 700);
  }

  async function saveRemoteProgress() {
    if (!supabaseClient || !currentUser) return;

    await supabaseClient
      .from("user_progress")
      .upsert({
        user_id: currentUser.id,
        mode: "graded",
        state,
        updated_at: new Date().toISOString()
      }, { onConflict: "user_id,mode" });
  }

  async function loadRemoteProgress() {
    if (!supabaseClient || !currentUser) return;

    const { data, error } = await supabaseClient
      .from("user_progress")
      .select("state")
      .eq("user_id", currentUser.id)
      .eq("mode", "graded")
      .maybeSingle();

    if (error) {
      elements.authStatus.textContent = `Could not load saved progress: ${error.message}`;
      return;
    }

    if (data && data.state) {
      state = restoreStateShape(data.state);
      saveState();
    } else {
      await saveRemoteProgress();
    }
  }

  function restoreStateShape(savedState) {
    const selectedLevel = Number.isInteger(Number(savedState.selectedLevel)) ? clamp(Number(savedState.selectedLevel), MIN_LEVEL, MAX_LEVEL) : null;
    const restored = {
      ...makeInitialState(selectedLevel),
      ...savedState,
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

  async function upsertUserCard(cardIndex) {
    if (!supabaseClient || !currentUser) return;

    await supabaseClient
      .from("user_cards")
      .upsert({
        user_id: currentUser.id,
        card_index: cardIndex,
        purchased_at: new Date().toISOString(),
        acquired_from: "shop"
      }, { onConflict: "user_id,card_index" });
  }

  async function refreshCardsFromSupabase() {
    if (!supabaseClient || !currentUser) return;

    const { data, error } = await supabaseClient
      .from("user_cards")
      .select("card_index,purchased_at")
      .eq("user_id", currentUser.id)
      .order("purchased_at", { ascending: true });

    if (error) {
      elements.authStatus.textContent = `Could not load cards: ${error.message}`;
      return;
    }

    state.ownedCards = sanitiseOwnedCards((data || []).map((card) => ({
      index: card.card_index,
      purchasedAt: new Date(card.purchased_at).getTime() || Date.now()
    })));
    ensurePackUnlockState(state);
    saveState();
  }

  function renderBattlePanel() {
    if (!elements.battlePanel) return;

    const ownedCards = state.ownedCards
      .map((ownedCard) => ({ ...ownedCard, template: CREATURE_CARD_TEMPLATES[ownedCard.index] }))
      .filter((ownedCard) => ownedCard.template);

    elements.battleCardSelect.innerHTML = "";
    for (const ownedCard of ownedCards) {
      const option = document.createElement("option");
      option.value = String(ownedCard.index);
      option.textContent = `${ownedCard.template.name} (${getCardCost(ownedCard.index)} pts)`;
      elements.battleCardSelect.appendChild(option);
    }

    const battlePoints = Number(state.battlePoints || 0);
    const canBattle = Boolean(currentUser && supabaseClient && ownedCards.length > 0 && battlePoints > 0 && !currentBattle);
    elements.battleCardSelect.disabled = !canBattle;
    elements.enterBattleButton.disabled = !canBattle;

    if (elements.battlePointNextText) {
      elements.battlePointNextText.textContent = `${getCorrectSpellingsUntilBattlePoint()} correct to next battle point`;
    }

    if (!currentUser) {
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

    const cardIndex = Number(elements.battleCardSelect.value);
    const ownedSet = getOwnedIndexes();
    if (!Number.isInteger(cardIndex) || !ownedSet.has(cardIndex)) {
      elements.battleStatus.textContent = "Choose a card you own.";
      return;
    }

    if (Number(state.battlePoints || 0) < 1) {
      elements.battleStatus.textContent = `You need 1 battle point. ${getCorrectSpellingsUntilBattlePoint()} more correct spellings to earn one.`;
      return;
    }

    elements.enterBattleButton.disabled = true;
    elements.battleResult.textContent = "";
    renderBattleGrid(0.5);

    const attackStrength = await getOrCreateBattleStrength(cardIndex);
    const displayName = (currentUser.email || "Player").split("@")[0];

    const { data: waitingBattle } = await supabaseClient
      .from("battle_rooms")
      .select("*")
      .eq("status", "waiting")
      .neq("challenger_id", currentUser.id)
      .limit(1)
      .maybeSingle();

    if (waitingBattle) {
      const { data: joinedBattle, error } = await supabaseClient
        .from("battle_rooms")
        .update({
          opponent_id: currentUser.id,
          opponent_name: displayName,
          opponent_card_index: cardIndex,
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
        challenger_card_index: cardIndex,
        challenger_attack: attackStrength,
        status: "waiting"
      })
      .select()
      .single();

    if (error) {
      elements.battleStatus.textContent = `Could not create battle: ${error.message}`;
      elements.enterBattleButton.disabled = false;
      return;
    }

    spendBattlePoint();
    currentBattle = createdBattle;
    elements.battleStatus.textContent = `Waiting for an opponent. ${CREATURE_CARD_TEMPLATES[cardIndex].name} strength: ${attackStrength}.`;
    elements.battleOpponent.textContent = "";
    startBattlePolling(createdBattle.id);
  }

  function spendBattlePoint() {
    state.battlePoints = Math.max(0, Number(state.battlePoints || 0) - 1);
    saveState();
    renderStats();
  }

  async function getOrCreateBattleStrength(cardIndex) {
    const { data } = await supabaseClient
      .from("card_battle_stats")
      .select("attack_strength")
      .eq("user_id", currentUser.id)
      .eq("card_index", cardIndex)
      .maybeSingle();

    if (data && Number.isFinite(data.attack_strength)) {
      return data.attack_strength;
    }

    const minStrength = getCardCost(cardIndex);
    const attackStrength = randomInt(minStrength, 100);
    await supabaseClient
      .from("card_battle_stats")
      .upsert({
        user_id: currentUser.id,
        card_index: cardIndex,
        attack_strength: attackStrength,
        created_at: new Date().toISOString()
      }, { onConflict: "user_id,card_index" });

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

      if (data.status === "ready") {
        renderMatchedBattle(data);
        await resolveCurrentBattle();
      } else if (data.status === "resolved") {
        stopBattlePolling();
        await showResolvedBattle(data);
        await refreshCardsFromSupabase();
        renderStats();
        renderShop();
        renderCollection();
        renderPacks();
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

    const myCard = CREATURE_CARD_TEMPLATES[perspective.myCardIndex];
    const opponentCard = CREATURE_CARD_TEMPLATES[perspective.opponentCardIndex];
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
    elements.practicePanel.hidden = true;
    elements.restingPanel.hidden = false;
    elements.nextDueText.textContent = "You mastered every active word. Great work!";
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
