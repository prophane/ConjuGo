window.BRAINROT_PIPELINE = (() => {
  const systemPrompt = [
    "Tu ecris des brainrots internet-native en francais.",
    "Interdits: ton scolaire, explications meta, paraphrase plate, politesse neutre.",
    "Sortie: 3 a 6 phrases max, nerveuses et concretes.",
    "Obligations: au moins 2 images mentales visibles, 1 personnification absurde.",
    "Le texte doit escalader: chaque phrase monte en intensite.",
    "La derniere phrase doit etre la plus forte."
  ].join(" ");

  const stylePresets = {
    classic: {
      label: "Classic",
      energy: 1,
      minScore: 68,
      openers: ["Ce truc", "Le mot", "Ton objet", "La scene"],
      verbs: ["sprinte", "gicle", "rebondit", "hurle", "degouline", "se teleporte"],
      finishers: ["et la timeline explose", "et tout le quartier bugue", "et la realite prend feu doux"],
      hueBase: 35,
      satBase: 1.05
    },
    feral: {
      label: "Feral",
      energy: 1.35,
      minScore: 74,
      openers: ["Ce monstre", "Le brain", "Cette entite", "Le meme"],
      verbs: ["griffe", "mord", "vrille", "vrombit", "fracture", "pirouette"],
      finishers: ["et ton cerveau fait un salto", "et la rue part en karaoke sauvage", "et les horloges demandent pardon"],
      hueBase: 145,
      satBase: 1.18
    },
    nuclear: {
      label: "Nuclear",
      energy: 1.7,
      minScore: 80,
      openers: ["Ce cataclysme", "Le boss final", "La machine", "Le totem"],
      verbs: ["detonne", "atomise", "turbine", "sature", "court-circuite", "pulverise"],
      finishers: ["et internet se met a genoux", "et les nuages font des wheelings", "et la gravite depose sa demission"],
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
    "cela signifie"
  ];

  const concreteImagery = [
    "un grille-pain en feu", "une trottinette sur le plafond", "un pigeon en armure", "un aquarium dans un bus",
    "une banane en costard", "un neon qui transpire", "une pizza orbitale", "un clavier qui aboie",
    "un lampadaire en roller", "une machine a bulles furieuse", "un canape qui derape", "un metro rempli de confettis"
  ];

  const internetVibes = [
    "ratio", "lowres", "irl", "lag", "speedrun", "glitch", "timeline", "feed", "mode troll", "patch note"
  ];

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
    const sentenceCount = 3 + Math.floor(rng() * 4);

    const imgA = pick(rng, concreteImagery);
    let imgB = pick(rng, concreteImagery);
    if (imgB === imgA) {
      imgB = pick(rng, concreteImagery);
    }

    const vibeA = pick(rng, internetVibes);
    const vibeB = pick(rng, internetVibes);

    const lines = [];
    lines.push(`${capitalize(token)} debarque en ${pick(rng, preset.openers).toLowerCase()} avec ${imgA}, et le feed commence a trembler.`);
    lines.push(`${capitalize(token)} ${pick(rng, preset.verbs)} comme un influenceur mal reveille, il exige des applaudissements au lampadaire.`);

    if (sentenceCount > 3) {
      lines.push(`Puis ${imgB} surgit en ${vibeA}, et meme le trottoir veut faire un speedrun de panique.`);
    }
    if (sentenceCount > 4) {
      lines.push(`Ensuite la scene passe en ${vibeB}, les murs clignotent et le frigo negocie un cessez-le-feu.`);
    }

    lines.push(`Dernier palier: ${pick(rng, preset.finishers)}.`);

    return lines.slice(0, sentenceCount).join(" ");
  }

  function scoreBrainrot(output) {
    const text = String(output || "").toLowerCase();
    const sentences = sentenceSplit(text);

    const bannedHit = bannedPhrases.some((phrase) => text.includes(phrase));
    const sentenceScore = sentences.length >= 3 && sentences.length <= 6 ? 20 : 0;

    const imageryHits = concreteImagery.reduce((count, term) => count + (text.includes(term) ? 1 : 0), 0);
    const visualScore = Math.min(20, imageryHits * 10);

    const personificationMarkers = ["il exige", "le frigo", "le trottoir", "les murs", "la gravite", "le lampadaire"];
    const personificationHits = personificationMarkers.some((marker) => text.includes(marker));
    const absurdityScore = personificationHits ? 20 : 8;

    const vibeHits = internetVibes.reduce((count, token) => count + (text.includes(token) ? 1 : 0), 0);
    const vibeScore = Math.min(20, vibeHits * 6 + (text.includes("dernier") ? 4 : 0));

    const escalationScore = /(puis|ensuite|dernier palier|dernier niveau)/.test(text) ? 20 : 8;

    const total = bannedHit
      ? 0
      : Math.max(0, Math.min(100, sentenceScore + visualScore + absurdityScore + vibeScore + escalationScore));

    return {
      total,
      passed: total >= 70,
      details: {
        sentenceScore,
        visualScore,
        absurdityScore,
        vibeScore,
        escalationScore,
        bannedHit
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
        maxAttempts: 8
      });

      catalog.push({
        id: `sticker-${String(tier).padStart(3, "0")}`,
        name: `${capitalize(subject)} ${String(tier).padStart(3, "0")}`,
        rarity,
        image: stickerSources[index % stickerSources.length],
        family: stylePresets[style].label,
        line: generated.output,
        quality: generated.score.total,
        hue: (stylePresets[style].hueBase + (index * 23)) % 360,
        sat: stylePresets[style].satBase + ((index % 5) * 0.04)
      });
    }

    return catalog;
  }

  function qualityExamples() {
    const failed = "Le mot est drole. C'est du pur brainrot. C'est chaotique.";
    const success =
      "Banane laser debarque avec un grille-pain en feu sur une trottinette au plafond, et le feed panique. " +
      "Elle reclame un autographe au lampadaire pendant qu'un pigeon en armure fait du drift sur la table. " +
      "Puis un aquarium dans le bus passe en mode glitch et meme le frigo demande une truce. " +
      "Dernier palier: la gravite depose sa demission et internet se met a genoux.";

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
