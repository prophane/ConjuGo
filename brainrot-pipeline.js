window.BRAINROT_PIPELINE = (() => {
  const systemPrompt = [
    "Tu ecris des brainrots internet-native en francais.",
    "Interdits: ton scolaire, explications meta, paraphrase plate, politesse neutre.",
    "Sortie: 1 a 3 phrases max, courtes et incisives.",
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
    const sentenceCount = 1 + Math.floor(rng() * 3);

    const imgA = pick(rng, concreteImagery);
    let imgB = pick(rng, concreteImagery);
    if (imgB === imgA) {
      imgB = pick(rng, concreteImagery);
    }

    const vibeA = pick(rng, internetVibes);
    const vibeB = pick(rng, internetVibes);

    const lines = [];
    const opener = `${capitalize(token)} sort du spawn avec ${imgA} et ${imgB}, en ${vibeA} violent.`;
    const middle = `${pick(rng, preset.openers)} ${pick(rng, preset.verbs)} pendant que le frigo applaudit et que le trottoir panique.`;
    const finisher = `Final: ${pick(rng, preset.finishers)}.`;

    lines.push(opener);
    if (sentenceCount >= 2) {
      lines.push(middle);
    }
    if (sentenceCount >= 3) {
      lines.push(finisher);
    } else {
      lines[lines.length - 1] = `${lines[lines.length - 1]} ${finisher}`;
    }

    return lines.slice(0, sentenceCount).join(" ");
  }

  function scoreBrainrot(output) {
    const text = String(output || "").toLowerCase();
    const sentences = sentenceSplit(text);

    const bannedHit = bannedPhrases.some((phrase) => text.includes(phrase));
    const sentenceScore = sentences.length >= 1 && sentences.length <= 3 ? 20 : 0;

    const imageryHits = concreteImagery.reduce((count, term) => count + (text.includes(term) ? 1 : 0), 0);
    const visualScore = Math.min(20, imageryHits >= 2 ? 20 : imageryHits * 8);

    const personificationMarkers = ["il exige", "le frigo", "le trottoir", "les murs", "la gravite", "le lampadaire"];
    const personificationHits = personificationMarkers.some((marker) => text.includes(marker));
    const absurdityScore = personificationHits ? 20 : 0;

    const vibeHits = internetVibes.reduce((count, token) => count + (text.includes(token) ? 1 : 0), 0);
    const vibeScore = Math.min(20, vibeHits * 6 + (text.includes("final") ? 6 : 0));

    const escalationScore = /(puis|ensuite|final|dernier palier|dernier niveau)/.test(text) ? 20 : 0;

    const longTextPenalty = text.length > 260 ? 20 : 0;

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

    let best = { output: "", score: { total: -1 } };

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      const output = generateBrainrot(input, style, `${options.seed || "seed"}-${attempt}`);
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
    const subjectsA = [
      "mouette", "banane", "grille-pain", "chaussette", "trottinette", "capsule", "drone", "sandwich", "tapis", "cookie",
      "pigeon", "radiateur", "casque", "manette", "microwave", "hamster", "neon", "piano", "trampoline", "robot"
    ];
    const subjectsB = [
      "quantique", "laser", "supersonique", "caramel", "interstellaire", "mystique", "glitch", "volcanique", "arcade", "toxique",
      "pixel", "meteor", "ninja", "vintage", "electrique", "spicy", "cosmique", "vortex", "ultra", "meme"
    ];

    const catalog = [];

    for (let index = 0; index < total; index += 1) {
      const tier = index + 1;
      const rarity = tier % 10 === 0 ? "Epic" : tier % 4 === 0 ? "Rare" : "Common";
      const style = styleFromRarity(rarity, index);
      const seed = `brainrot-${tier}`;
      const subject = `${subjectsA[index % subjectsA.length]} ${subjectsB[(index * 7) % subjectsB.length]}`;

      const generated = generateWithQuality(subject, style, {
        seed,
        minScore: stylePresets[style].minScore,
        maxAttempts: 10
      });

      const emblem = emblems[hashText(subject) % emblems.length];

      catalog.push({
        id: `sticker-${String(tier).padStart(3, "0")}`,
        name: `${capitalize(subject)} ${String(tier).padStart(3, "0")}`,
        rarity,
        image: stickerSources[index % stickerSources.length],
        family: stylePresets[style].label,
        line: generated.output,
        quality: generated.score.total,
        emblem,
        hue: (stylePresets[style].hueBase + (index * 23)) % 360,
        sat: stylePresets[style].satBase + ((index % 5) * 0.04)
      });
    }

    return catalog;
  }

  function qualityExamples() {
    const failed = "Le mot est drole. C'est du pur brainrot.";
    const success =
      "Banane laser sort du spawn avec un grille-pain en feu et une trottinette au plafond, feed en glitch. " +
      "Le frigo applaudit pendant que le trottoir sprint en panique. " +
      "Final: la gravite ragequit et internet se met a genoux.";

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
    generateBrainrot,
    scoreBrainrot,
    generateWithQuality,
    buildBrainrotCatalog,
    qualityExamples,
    bannedPhrases
  };
})();
