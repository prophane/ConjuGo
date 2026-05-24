/* global CONJUGO_DATA */

const SESSION_SIZE = 10;
const RECENT_VERB_WINDOW = 2;
const STORAGE_KEY = "conjugo-preferences-v1";

const state = {
  selected: new Set(),
  questions: [],
  currentIndex: 0,
  score: 0,
  errors: [],
  answered: false
};

let deferredInstallPrompt = null;

const el = {
  views: {
    config: document.getElementById("view-config"),
    session: document.getElementById("view-session"),
    result: document.getElementById("view-result")
  },
  cards: Array.from(document.querySelectorAll(".cat-card")),
  selectionSummary: document.getElementById("selectionSummary"),
  startBtn: document.getElementById("startBtn"),
  installBtn: document.getElementById("installBtn"),
  counter: document.getElementById("counter"),
  progressBar: document.getElementById("progressBar"),
  pronounBadge: document.getElementById("pronounBadge"),
  verbLabel: document.getElementById("verbLabel"),
  optionsWrap: document.getElementById("optionsWrap"),
  feedback: document.getElementById("feedback"),
  feedbackText: document.getElementById("feedbackText"),
  nextBtn: document.getElementById("nextBtn"),
  scoreLine: document.getElementById("scoreLine"),
  resultMessage: document.getElementById("resultMessage"),
  errorList: document.getElementById("errorList"),
  replayBtn: document.getElementById("replayBtn"),
  backConfigBtn: document.getElementById("backConfigBtn"),
  questionCard: document.getElementById("questionCard")
};

function shuffle(list) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function showView(name) {
  Object.entries(el.views).forEach(([viewName, viewEl]) => {
    viewEl.classList.toggle("active", viewName === name);
  });
}

function savePreferences() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...state.selected]));
}

function loadPreferences() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return;
    }
    const saved = JSON.parse(raw);
    if (Array.isArray(saved)) {
      saved.forEach((cat) => {
        if (CONJUGO_DATA.categories[cat]) {
          state.selected.add(cat);
        }
      });
    }
  } catch (_error) {
    // Ignore malformed local data.
  }
}

function updateConfigUI() {
  el.cards.forEach((card) => {
    const cat = card.dataset.category;
    const active = state.selected.has(cat);
    card.classList.toggle("active", active);
    card.setAttribute("aria-pressed", active ? "true" : "false");
  });

  const labels = [...state.selected].map((cat) => CONJUGO_DATA.categories[cat].label);
  if (labels.length) {
    el.selectionSummary.textContent = `Tu as choisi: ${labels.join(", ")}`;
  } else {
    el.selectionSummary.textContent = "Aucune categorie selectionnee.";
  }

  el.startBtn.disabled = labels.length === 0;
}

function buildCategoryTargets(selectedCategories, total) {
  const targets = Object.fromEntries(selectedCategories.map((cat) => [cat, 0]));
  const base = Math.floor(total / selectedCategories.length);
  let remainder = total % selectedCategories.length;

  selectedCategories.forEach((cat) => {
    targets[cat] = base;
  });

  const remainderOrder = shuffle(selectedCategories);
  for (let i = 0; i < remainder; i += 1) {
    targets[remainderOrder[i]] += 1;
  }

  return targets;
}

function getCategoryCandidates(categoryKey) {
  const category = CONJUGO_DATA.categories[categoryKey];
  const pronouns = CONJUGO_DATA.pronouns;
  const candidates = [];

  category.verbs.forEach((verb) => {
    pronouns.forEach((pronoun) => {
      candidates.push({
        categoryKey,
        categoryLabel: category.label,
        verb: verb.infinitive,
        pronounKey: pronoun.key,
        pronounLabel: pronoun.label,
        answer: verb.forms[pronoun.key]
      });
    });
  });

  return candidates;
}

function generateQuestions(selectedCategories, total = SESSION_SIZE) {
  const usedPair = new Set();
  const recentVerbs = [];
  const pronounUsage = Object.fromEntries(CONJUGO_DATA.pronouns.map((p) => [p.key, 0]));
  const targets = buildCategoryTargets(selectedCategories, total);
  const candidatesByCategory = Object.fromEntries(
    selectedCategories.map((cat) => [cat, getCategoryCandidates(cat)])
  );

  const questions = [];

  // Balanced round-robin generation with anti-repetition rules.
  while (questions.length < total) {
    const availableCats = selectedCategories.filter((cat) => targets[cat] > 0);
    const stepCats = availableCats.length ? availableCats : selectedCategories;

    let picked = null;

    for (const cat of shuffle(stepCats)) {
      const candidates = candidatesByCategory[cat].filter((c) => !usedPair.has(`${c.verb}|${c.pronounKey}`));
      if (!candidates.length) {
        continue;
      }

      const sorted = [...candidates].sort((a, b) => {
        const scoreA = pronounUsage[a.pronounKey] + (recentVerbs.includes(a.verb) ? 10 : 0) + Math.random();
        const scoreB = pronounUsage[b.pronounKey] + (recentVerbs.includes(b.verb) ? 10 : 0) + Math.random();
        return scoreA - scoreB;
      });

      const best = sorted[0];
      if (best) {
        picked = best;
        if (targets[cat] > 0) {
          targets[cat] -= 1;
        }
        break;
      }
    }

    if (!picked) {
      break;
    }

    const pairKey = `${picked.verb}|${picked.pronounKey}`;
    usedPair.add(pairKey);
    pronounUsage[picked.pronounKey] += 1;
    recentVerbs.push(picked.verb);
    if (recentVerbs.length > RECENT_VERB_WINDOW) {
      recentVerbs.shift();
    }

    questions.push(picked);
  }

  return questions.map((question) => ({
    ...question,
    options: buildMcqOptions(question, selectedCategories)
  }));
}

function buildMcqOptions(question, selectedCategories) {
  const pool = [];

  selectedCategories.forEach((cat) => {
    const category = CONJUGO_DATA.categories[cat];
    category.verbs.forEach((verb) => {
      const form = verb.forms[question.pronounKey];
      if (form !== question.answer) {
        pool.push(form);
      }
    });
  });

  let distractors = shuffle([...new Set(pool)]).slice(0, 3);

  if (distractors.length < 3) {
    const fallback = [];
    selectedCategories.forEach((cat) => {
      CONJUGO_DATA.categories[cat].verbs.forEach((verb) => {
        Object.values(verb.forms).forEach((f) => {
          if (f !== question.answer) {
            fallback.push(f);
          }
        });
      });
    });
    const uniqueFallback = shuffle([...new Set(fallback)]).filter((f) => !distractors.includes(f));
    distractors = [...distractors, ...uniqueFallback.slice(0, 3 - distractors.length)];
  }

  return shuffle([question.answer, ...distractors]);
}

function renderQuestion() {
  const question = state.questions[state.currentIndex];
  if (!question) {
    return;
  }

  state.answered = false;

  el.counter.textContent = `Question ${state.currentIndex + 1}/${SESSION_SIZE}`;
  el.progressBar.style.width = `${((state.currentIndex + 1) / SESSION_SIZE) * 100}%`;

  el.pronounBadge.textContent = question.pronounLabel;
  el.verbLabel.textContent = question.verb;

  el.feedback.hidden = true;
  el.feedbackText.textContent = "";
  el.optionsWrap.innerHTML = "";

  question.options.forEach((optionText, index) => {
    const button = document.createElement("button");
    button.className = "option";
    button.textContent = optionText;
    button.type = "button";
    button.setAttribute("aria-label", `Reponse ${index + 1}: ${optionText}`);
    button.addEventListener("click", () => validateAnswer(optionText, button));
    el.optionsWrap.appendChild(button);
  });
}

function validateAnswer(selectedText, clickedButton) {
  if (state.answered) {
    return;
  }

  state.answered = true;
  const question = state.questions[state.currentIndex];
  const ok = selectedText === question.answer;

  const optionButtons = Array.from(el.optionsWrap.querySelectorAll(".option"));
  optionButtons.forEach((btn) => {
    btn.disabled = true;
    if (btn.textContent === question.answer) {
      btn.classList.add("is-correct");
    }
    if (btn === clickedButton && !ok) {
      btn.classList.add("is-wrong");
    }
  });

  if (ok) {
    state.score += 1;
    el.feedbackText.textContent = "Super! C'est la bonne reponse!";
    triggerRewardAnimation();
  } else {
    state.errors.push({
      verb: question.verb,
      pronoun: question.pronounLabel,
      expected: question.answer,
      selected: selectedText
    });
    el.feedbackText.textContent = `Presque! La bonne reponse etait: ${question.answer}`;
  }

  el.feedback.hidden = false;
  el.nextBtn.focus();
}

function triggerRewardAnimation() {
  el.questionCard.classList.remove("reward");
  void el.questionCard.offsetWidth;
  el.questionCard.classList.add("reward");
}

function nextQuestion() {
  state.currentIndex += 1;
  if (state.currentIndex >= SESSION_SIZE || state.currentIndex >= state.questions.length) {
    showResults();
    return;
  }

  renderQuestion();
}

function scoreMessage(score) {
  if (score <= 3) {
    return "Tu progresses! On rejoue pour devenir une mega-star.";
  }
  if (score <= 7) {
    return "Bravo! Tu es sur la bonne voie, continue!";
  }
  if (score <= 9) {
    return "Excellent! Tu conjugues tres bien au present!";
  }
  return "Parfait 10/10! Tu es le boss du present!";
}

function showResults() {
  showView("result");
  el.scoreLine.textContent = `Score: ${state.score}/${SESSION_SIZE}`;
  el.resultMessage.textContent = scoreMessage(state.score);

  el.errorList.innerHTML = "";
  if (!state.errors.length) {
    const li = document.createElement("li");
    li.textContent = "Aucune erreur, bravo!";
    el.errorList.appendChild(li);
  } else {
    state.errors.forEach((entry) => {
      const li = document.createElement("li");
      li.textContent = `${entry.pronoun} ${entry.verb} -> attendu: ${entry.expected}`;
      el.errorList.appendChild(li);
    });
  }
}

function startSession() {
  const selectedCategories = [...state.selected];
  if (!selectedCategories.length) {
    return;
  }

  state.questions = generateQuestions(selectedCategories, SESSION_SIZE);
  state.currentIndex = 0;
  state.score = 0;
  state.errors = [];

  showView("session");
  renderQuestion();
}

function backToConfig() {
  showView("config");
  updateConfigUI();
}

function handleCategoryToggle(event) {
  const button = event.currentTarget;
  const category = button.dataset.category;

  if (state.selected.has(category)) {
    state.selected.delete(category);
  } else {
    state.selected.add(category);
  }

  savePreferences();
  updateConfigUI();
}

function bindEvents() {
  el.cards.forEach((card) => card.addEventListener("click", handleCategoryToggle));
  el.startBtn.addEventListener("click", startSession);
  el.nextBtn.addEventListener("click", nextQuestion);
  el.replayBtn.addEventListener("click", startSession);
  el.backConfigBtn.addEventListener("click", backToConfig);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !el.feedback.hidden && el.views.session.classList.contains("active")) {
      nextQuestion();
    }
  });
}

function bindPwaInstall() {
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
    el.installBtn.hidden = false;
  });

  el.installBtn.addEventListener("click", async () => {
    if (!deferredInstallPrompt) {
      return;
    }
    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    el.installBtn.hidden = true;
  });

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("./sw.js").catch(() => {
        // Service worker registration failure should not block app usage.
      });
    });
  }
}

function init() {
  loadPreferences();
  updateConfigUI();
  bindEvents();
  bindPwaInstall();
}

init();
