window.BRAINROT_PIPELINE = (() => {
  const systemPrompt = [
    "Tu ecris des brainrots internet-native en francais.",
    "Interdits: ton scolaire, explications meta, paraphrase plate, politesse neutre.",
    "Sortie: 1 a 2 phrases max, courtes et incisives.",
    "Obligations: au moins 2 images mentales concretes, 1 personnification absurde.",
    "Escalade comique obligatoire.",
    "La derniere phrase doit etre la plus forte et claquer comme une chute."
  ].join(" ");

  const stylePresets = {
    classic: {
      label: "Classic",
      energy: 1,
      minScore: 78,
      openers: ["Ce specimen", "Ton totem", "Cette relique", "Le brainrot"],
      verbs: ["sprinte", "gicle", "rebondit", "hurle", "degouline", "pirouette"],
      finishers: ["et la timeline casse en deux", "et le quartier freeze", "et la gravite ragequit"],
      hueBase: 35,
      satBase: 1.05
    },
    feral: {
      label: "Feral",
      energy: 1.35,
      minScore: 82,
      openers: ["Ce monstre", "Le boss", "Cette entite", "Le meme"],
      verbs: ["griffe", "mord", "vrille", "vrombit", "fracture", "detonne"],
      finishers: ["et ton cerveau fait un salto arriere", "et la rue demarre en panique", "et les horloges se cachent"],
      hueBase: 145,
      satBase: 1.18
    },
    nuclear: {
      label: "Nuclear",
      energy: 1.7,
      minScore: 86,
      openers: ["Ce cataclysme", "Le boss final", "La machine", "Le totem"],
      verbs: ["detonne", "atomise", "turbine", "sature", "court-circuite", "pulverise"],
      finishers: ["et internet se met a genoux", "et les nuages font des wheelings", "et la gravite depose sa demission en hurlant"],
      hueBase: 265,
      satBase: 1.3
    }
  };

  const curatedBrainrots = [
    {
      id: "br-pigeon-turbo",
      name: "Pigeon turbo",
      rarity: "Common",
      style: "feral",
      subject: "pigeon turbo",
      hooks: ["un pigeon en armure", "une trottinette au plafond"],
      persona: "lampadaire",
      visualSeed: { hue: 196, sat: 1.14, accent: 34, emblem: "🪽", motif: "dash" }
    },
    {
      id: "br-banane-nucleaire",
      name: "Banane nucleaire",
      rarity: "Rare",
      style: "nuclear",
      subject: "banane nucleaire",
      hooks: ["une banane en costard", "un grille-pain en feu"],
      persona: "frigo",
      visualSeed: { hue: 52, sat: 1.2, accent: 16, emblem: "☢️", motif: "ring" }
    },
    {
      id: "br-grille-pain-possede",
      name: "Grille-pain possede",
      rarity: "Rare",
      style: "feral",
      subject: "grille-pain possede",
      hooks: ["un grille-pain en feu", "un metro rempli de confettis"],
      persona: "trottoir",
      visualSeed: { hue: 18, sat: 1.22, accent: 358, emblem: "👹", motif: "zigzag" }
    },
    {
      id: "br-chaussette-laser",
      name: "Chaussette laser",
      rarity: "Common",
      style: "classic",
      subject: "chaussette laser",
      hooks: ["une chaussette en orbite", "un clavier qui aboie"],
      persona: "aspirateur",
      visualSeed: { hue: 286, sat: 1.12, accent: 222, emblem: "🧦", motif: "grid" }
    },
    {
      id: "br-biscuit-orbitale",
      name: "Biscuit orbitale",
      rarity: "Common",
      style: "classic",
      subject: "biscuit orbitale",
      hooks: ["un biscuit qui flotte", "une pizza orbitale"],
      persona: "antenne",
      visualSeed: { hue: 40, sat: 1.1, accent: 12, emblem: "🍪", motif: "ring" }
    },
    {
      id: "br-cactus-disco",
      name: "Cactus disco",
      rarity: "Common",
      style: "classic",
      subject: "cactus disco",
      hooks: ["un cactus en boule a facettes", "un bus plein de bulles"],
      persona: "abribus",
      visualSeed: { hue: 132, sat: 1.2, accent: 196, emblem: "🌵", motif: "spark" }
    },
    {
      id: "br-canape-toxique",
      name: "Canape toxique",
      rarity: "Rare",
      style: "feral",
      subject: "canape toxique",
      hooks: ["un canape qui derape", "une lampe qui tousse des etincelles"],
      persona: "moquette",
      visualSeed: { hue: 108, sat: 1.18, accent: 328, emblem: "🛋️", motif: "zigzag" }
    },
    {
      id: "br-micro-onde-gobelin",
      name: "Micro-onde gobelin",
      rarity: "Rare",
      style: "feral",
      subject: "micro-onde gobelin",
      hooks: ["un micro-onde qui ricane", "une cuillere en mode turbo"],
      persona: "plan de travail",
      visualSeed: { hue: 24, sat: 1.24, accent: 74, emblem: "🧌", motif: "dash" }
    },
    {
      id: "br-patate-satellite",
      name: "Patate satellite",
      rarity: "Common",
      style: "classic",
      subject: "patate satellite",
      hooks: ["une patate avec antenne", "un ciel pixelise"],
      persona: "radar",
      visualSeed: { hue: 36, sat: 1.12, accent: 214, emblem: "🥔", motif: "ring" }
    },
    {
      id: "br-lama-wifi",
      name: "Lama wifi",
      rarity: "Rare",
      style: "classic",
      subject: "lama wifi",
      hooks: ["un lama qui bufferise", "un routeur qui rote des arcs-en-ciel"],
      persona: "modem",
      visualSeed: { hue: 262, sat: 1.2, accent: 193, emblem: "🦙", motif: "grid" }
    },
    {
      id: "br-cornichon-plasma",
      name: "Cornichon plasma",
      rarity: "Rare",
      style: "feral",
      subject: "cornichon plasma",
      hooks: ["un cornichon en fusion", "un neon qui transpire"],
      persona: "frigo",
      visualSeed: { hue: 98, sat: 1.26, accent: 265, emblem: "🥒", motif: "spark" }
    },
    {
      id: "br-croissant-mutant",
      name: "Croissant mutant",
      rarity: "Common",
      style: "classic",
      subject: "croissant mutant",
      hooks: ["un croissant avec des bras", "une cafetiere qui applaudit"],
      persona: "boulangerie",
      visualSeed: { hue: 44, sat: 1.16, accent: 356, emblem: "🥐", motif: "wave" }
    },
    {
      id: "br-mouette-cyberpunk",
      name: "Mouette cyberpunk",
      rarity: "Rare",
      style: "feral",
      subject: "mouette cyberpunk",
      hooks: ["une mouette en neon", "une flaque holographique"],
      persona: "passage pieton",
      visualSeed: { hue: 206, sat: 1.2, accent: 309, emblem: "🕶️", motif: "grid" }
    },
    {
      id: "br-frigo-karate",
      name: "Frigo karate",
      rarity: "Rare",
      style: "feral",
      subject: "frigo karate",
      hooks: ["un frigo qui casse des briques", "des glaçons qui crient"],
      persona: "carrelage",
      visualSeed: { hue: 190, sat: 1.18, accent: 352, emblem: "🥋", motif: "dash" }
    },
    {
      id: "br-kebab-quantique",
      name: "Kebab quantique",
      rarity: "Epic",
      style: "nuclear",
      subject: "kebab quantique",
      hooks: ["un kebab en superposition", "une sauce qui teleporte les passants"],
      persona: "enseigne",
      visualSeed: { hue: 28, sat: 1.32, accent: 280, emblem: "🌯", motif: "ring" }
    },
    {
      id: "br-pneu-chaman",
      name: "Pneu chaman",
      rarity: "Common",
      style: "classic",
      subject: "pneu chaman",
      hooks: ["un pneu qui chante", "des etincelles en cercle"],
      persona: "rond-point",
      visualSeed: { hue: 12, sat: 1.1, accent: 220, emblem: "🛞", motif: "ring" }
    },
    {
      id: "br-dragon-peluche",
      name: "Dragon peluche",
      rarity: "Common",
      style: "classic",
      subject: "dragon peluche",
      hooks: ["un dragon en coton", "une fumee en confettis"],
      persona: "oreiller",
      visualSeed: { hue: 312, sat: 1.16, accent: 132, emblem: "🐉", motif: "spark" }
    },
    {
      id: "br-clavier-fantome",
      name: "Clavier fantome",
      rarity: "Rare",
      style: "feral",
      subject: "clavier fantome",
      hooks: ["un clavier qui aboie", "des touches en mode poltergeist"],
      persona: "bureau",
      visualSeed: { hue: 234, sat: 1.2, accent: 18, emblem: "👻", motif: "grid" }
    },
    {
      id: "br-pizza-galactique",
      name: "Pizza galactique",
      rarity: "Rare",
      style: "classic",
      subject: "pizza galactique",
      hooks: ["une pizza orbitale", "une pluie de parmesan stellaire"],
      persona: "constellation",
      visualSeed: { hue: 16, sat: 1.22, accent: 233, emblem: "🍕", motif: "ring" }
    },
    {
      id: "br-trottinette-vampire",
      name: "Trottinette vampire",
      rarity: "Common",
      style: "feral",
      subject: "trottinette vampire",
      hooks: ["une trottinette qui grince des crocs", "un lampadaire qui s'evanouit"],
      persona: "piste cyclable",
      visualSeed: { hue: 334, sat: 1.18, accent: 196, emblem: "🛴", motif: "zigzag" }
    },
    {
      id: "br-ananas-mecha",
      name: "Ananas mecha",
      rarity: "Rare",
      style: "feral",
      subject: "ananas mecha",
      hooks: ["un ananas en exosquelette", "des boulons qui pleuvent"],
      persona: "planche a decouper",
      visualSeed: { hue: 78, sat: 1.24, accent: 260, emblem: "🍍", motif: "grid" }
    },
    {
      id: "br-bonnet-sismique",
      name: "Bonnet sismique",
      rarity: "Common",
      style: "classic",
      subject: "bonnet sismique",
      hooks: ["un bonnet qui tremble", "une rue en mode trampoline"],
      persona: "trottoir",
      visualSeed: { hue: 252, sat: 1.12, accent: 40, emblem: "🧢", motif: "wave" }
    },
    {
      id: "br-hamster-ministere",
      name: "Hamster ministere",
      rarity: "Common",
      style: "classic",
      subject: "hamster ministere",
      hooks: ["un hamster en cravate", "un bureau qui tourne a 200km/h"],
      persona: "tampon administratif",
      visualSeed: { hue: 24, sat: 1.15, accent: 212, emblem: "🐹", motif: "dash" }
    },
    {
      id: "br-radiateur-shuriken",
      name: "Radiateur shuriken",
      rarity: "Common",
      style: "feral",
      subject: "radiateur shuriken",
      hooks: ["un radiateur qui lance des etincelles", "des murs en mode dodge"],
      persona: "couloir",
      visualSeed: { hue: 8, sat: 1.17, accent: 230, emblem: "🥷", motif: "zigzag" }
    },
    {
      id: "br-canard-overclock",
      name: "Canard overclock",
      rarity: "Common",
      style: "classic",
      subject: "canard overclock",
      hooks: ["un canard qui bipppe", "une baignoire en mode turbo"],
      persona: "robinet",
      visualSeed: { hue: 54, sat: 1.2, accent: 202, emblem: "🦆", motif: "spark" }
    },
    {
      id: "br-sushi-volcanique",
      name: "Sushi volcanique",
      rarity: "Rare",
      style: "feral",
      subject: "sushi volcanique",
      hooks: ["un sushi en eruption", "des baguettes en flammes"],
      persona: "table basse",
      visualSeed: { hue: 6, sat: 1.26, accent: 94, emblem: "🍣", motif: "ring" }
    },
    {
      id: "br-brique-oracle",
      name: "Brique oracle",
      rarity: "Common",
      style: "classic",
      subject: "brique oracle",
      hooks: ["une brique qui predit le futur", "un mur qui cligne de l'oeil"],
      persona: "chantier",
      visualSeed: { hue: 18, sat: 1.14, accent: 270, emblem: "🧱", motif: "grid" }
    },
    {
      id: "br-manette-sorcier",
      name: "Manette sorcier",
      rarity: "Rare",
      style: "feral",
      subject: "manette sorcier",
      hooks: ["une manette qui lance des sorts", "des pixels qui deviennent des corbeaux"],
      persona: "console",
      visualSeed: { hue: 266, sat: 1.22, accent: 46, emblem: "🎮", motif: "spark" }
    },
    {
      id: "br-toboggan-apocalypse",
      name: "Toboggan apocalypse",
      rarity: "Epic",
      style: "nuclear",
      subject: "toboggan apocalypse",
      hooks: ["un toboggan en fusion", "un parc qui fait des wheelings"],
      persona: "bac a sable",
      visualSeed: { hue: 358, sat: 1.34, accent: 57, emblem: "🌋", motif: "zigzag" }
    },
    {
      id: "br-aspirateur-samourai",
      name: "Aspirateur samourai",
      rarity: "Epic",
      style: "nuclear",
      subject: "aspirateur samourai",
      hooks: ["un aspirateur avec katana", "des miettes en mode duel"],
      persona: "salon",
      visualSeed: { hue: 210, sat: 1.33, accent: 20, emblem: "🗡️", motif: "dash" }
    }
  ];

  const bannedPhrases = [
    "c'est du pur brainrot",
    "c'est trop drole",
    "c'est chaotique",
    "chaotique",
    "en resume",
    "cela signifie",
    "en fait",
    "on peut dire que",
    "cette phrase",
    "ce mot"
  ];

  const concreteImagery = [
    "un grille-pain en feu", "une trottinette sur le plafond", "un pigeon en armure", "un aquarium dans un bus",
    "une banane en costard", "un neon qui transpire", "une pizza orbitale", "un clavier qui aboie",
    "un lampadaire en roller", "une machine a bulles furieuse", "un canape qui derape", "un metro rempli de confettis"
  ];

  const internetVibes = [
    "ratio", "lowres", "irl", "lag", "speedrun", "glitch", "timeline", "feed", "mode troll", "patch note"
  ];

  const emblems = ["⚡", "🔥", "🛸", "🧠", "🦈", "🍞", "🧪", "🎛️", "💥", "🌪️", "🧨", "👾"];

  function hashText(text) {
    let h = 2166136261;
    for (let i = 0; i < text.length; i += 1) {
      h ^= text.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function makeRng(seed) {
    let t = hashText(String(seed) || "seed") || 1;
    return () => {
      t += 0x6d2b79f5;
      let x = Math.imul(t ^ (t >>> 15), 1 | t);
      x ^= x + Math.imul(x ^ (x >>> 7), 61 | x);
      return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
    };
  }

  function pick(rng, list) {
    return list[Math.floor(rng() * list.length)];
  }

  function sentenceSplit(text) {
    return text
      .split(/[.!?]+/)
      .map((part) => part.trim())
      .filter(Boolean);
  }

  function capitalize(text) {
    if (!text) {
      return "";
    }
    return text.charAt(0).toUpperCase() + text.slice(1);
  }

  function generateBrainrot(input, style = "classic", seed = "") {
    const preset = stylePresets[style] || stylePresets.classic;
    const rng = makeRng(`${input}|${style}|${seed}`);
    const token = String(input || "objet").trim().toLowerCase() || "objet";
    const sentenceCount = 1 + Math.floor(rng() * 2);

    const lines = [];
    const imgA = pick(rng, concreteImagery);
    const imgB = pick(rng, concreteImagery.filter((entry) => entry !== imgA));
    const vibeA = pick(rng, internetVibes);

    const opener = `${capitalize(token)} debarque: ${imgA} + ${imgB}, feed en ${vibeA}.`;
    const finisher = `Final: ${pick(rng, preset.finishers)}.`;

    lines.push(opener);
    if (sentenceCount >= 2) {
      lines.push(finisher);
    }

    return lines.slice(0, sentenceCount).join(" ");
  }

  function generateRewardText(entry, seed = "") {
    const preset = stylePresets[entry.style] || stylePresets.classic;
    const rng = makeRng(`${entry.id}|${seed}|${entry.name}`);
    const hooks = entry.hooks && entry.hooks.length >= 2
      ? entry.hooks
      : [pick(rng, concreteImagery), pick(rng, concreteImagery)];

    const opener = `${entry.name}: ${hooks[0]} + ${hooks[1]}, ${entry.persona || "le decor"} vrille.`;
    const finisher = `Final: ${pick(rng, preset.finishers)}.`;
    const twoLines = rng() > 0.45;

    return twoLines ? `${opener} ${finisher}` : `${entry.name}: ${hooks[0]}, ${hooks[1]}.`;
  }

  function scoreBrainrot(output) {
    const text = String(output || "").toLowerCase();
    const sentences = sentenceSplit(text);

    const bannedHit = bannedPhrases.some((phrase) => text.includes(phrase));
    const sentenceScore = sentences.length >= 1 && sentences.length <= 2 ? 20 : 0;

    const imageryHits = concreteImagery.reduce((count, term) => count + (text.includes(term) ? 1 : 0), 0);
    const genericImageryHits = (text.match(/\b(un|une)\b/g) || []).length;
    const visualHits = Math.max(imageryHits, genericImageryHits >= 2 ? 2 : 0);
    const visualScore = Math.min(22, visualHits >= 2 ? 22 : visualHits * 8);

    const personificationMarkers = [
      "frigo", "trottoir", "lampadaire", "carrelage", "routeur", "enseigne", "moquette", "bureau",
      "console", "salon", "vitrine", "radar", "robinet", "abribus", "boulangerie", "chantier",
      "constellation", "planche a decouper", "bac a sable", "passage pieton"
    ];
    const personificationVerbs = ["vrille", "applaudit", "panique", "rage", "hurle", "cligne", "demissionne", "rugit"];
    const personificationHits =
      personificationMarkers.some((marker) => text.includes(marker)) &&
      personificationVerbs.some((verb) => text.includes(verb));
    const absurdityScore = personificationHits ? 20 : 0;

    const vibeHits = internetVibes.reduce((count, token) => count + (text.includes(token) ? 1 : 0), 0);
    const vibeScore = Math.min(20, vibeHits * 6 + (text.includes("final") ? 7 : 0));

    const escalationScore = /(puis|ensuite|final|dernier palier|dernier niveau)/.test(text) ? 20 : 0;

    const longTextPenalty = text.length > 190 ? 24 : text.length > 150 ? 12 : 0;

    const total = bannedHit
      ? 0
      : Math.max(0, Math.min(100, sentenceScore + visualScore + absurdityScore + vibeScore + escalationScore - longTextPenalty));

    return {
      total,
      passed: total >= 70,
      details: {
        sentenceScore,
        visualScore,
        absurdityScore,
        vibeScore,
        escalationScore,
        bannedHit,
        longTextPenalty
      }
    };
  }

  function generateWithQuality(input, style, options = {}) {
    const preset = stylePresets[style] || stylePresets.classic;
    const threshold = Number(options.minScore || preset.minScore || 70);
    const maxAttempts = Number(options.maxAttempts || 6);
    const customGenerator = typeof options.generator === "function" ? options.generator : null;

    let best = { output: "", score: { total: -1 } };

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      const output = customGenerator
        ? customGenerator(attempt)
        : generateBrainrot(input, style, `${options.seed || "seed"}-${attempt}`);
      const score = scoreBrainrot(output);

      if (score.total > best.score.total) {
        best = { output, score, attempts: attempt };
      }

      if (score.total >= threshold) {
        return {
          output,
          score,
          attempts: attempt
        };
      }
    }

    return best;
  }

  function styleFromRarity(rarity, index) {
    if (rarity === "Epic") {
      return "nuclear";
    }
    if (rarity === "Rare") {
      return index % 2 === 0 ? "feral" : "nuclear";
    }
    return index % 3 === 0 ? "feral" : "classic";
  }

  function buildBrainrotCatalog(total, stickerSources) {
    const maxCards = Math.min(Number(total || curatedBrainrots.length), curatedBrainrots.length);
    const catalog = [];

    for (let index = 0; index < maxCards; index += 1) {
      const entry = curatedBrainrots[index];
      const style = entry.style || styleFromRarity(entry.rarity, index);
      const seed = `${entry.id}-${index + 1}`;

      const generated = generateWithQuality(entry.subject || entry.name, style, {
        seed,
        minScore: stylePresets[style].minScore,
        maxAttempts: 10,
        generator: (attempt) => generateRewardText(entry, `${seed}-${attempt}`)
      });

      const visualSeed = entry.visualSeed || {};
      const emblem = visualSeed.emblem || emblems[hashText(entry.name) % emblems.length];

      catalog.push({
        id: entry.id,
        name: entry.name,
        rarity: entry.rarity,
        image: (typeof BRAINROT_VISUALS !== "undefined" && BRAINROT_VISUALS.generate(entry.id)) || stickerSources[index % stickerSources.length],
        family: stylePresets[style].label,
        line: generated.output,
        quality: generated.score.total,
        emblem,
        hue: Number(visualSeed.hue || ((stylePresets[style].hueBase + (index * 23)) % 360)),
        sat: Number(visualSeed.sat || (stylePresets[style].satBase + ((index % 5) * 0.04))),
        accent: Number(visualSeed.accent || ((index * 41) % 360)),
        motif: visualSeed.motif || "spark",
        visualStyle: style
      });
    }

    return catalog;
  }

  function qualityExamples() {
    const failed = "Le mot est drole. C'est du pur brainrot.";
    const success =
      "Banane nucleaire: une banane en costard + un grille-pain en feu, le frigo vrille. " +
      "Final: internet se met a genoux.";

    return {
      failed: {
        text: failed,
        score: scoreBrainrot(failed)
      },
      success: {
        text: success,
        score: scoreBrainrot(success)
      }
    };
  }

  return {
    systemPrompt,
    stylePresets,
    curatedBrainrots,
    generateBrainrot,
    generateRewardText,
    scoreBrainrot,
    generateWithQuality,
    buildBrainrotCatalog,
    qualityExamples,
    bannedPhrases
  };
})();
