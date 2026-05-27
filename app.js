/* global CONJUGO_DATA */

const SESSION_SIZE = 10;
const RECENT_VERB_WINDOW = 2;
const STORAGE_KEY = "conjugo-preferences-v1";
const PROGRESS_KEY = "conjugo-progress-v1";
const FAMILY_KEY = "conjugo-family-v1";
const FAMILY_SERVER_CACHE_KEY = "conjugo-family-server-cache-v1";
const FAMILY_API_ENDPOINT = "/api/family-state";
const APP_VERSION = "v2026.05.27.1";

const STICKER_SOURCES = [
  "./stickers/brainy-rocket.svg",
  "./stickers/brainy-shark.svg",
  "./stickers/brainy-toast.svg",
  "./stickers/brainy-slime.svg"
];

const CARD_DEFS = [
  {
    id: "rocket_rider",
    name: "Rocket Rider",
    rarity: "Rare",
    image: "./stickers/brainy-rocket.svg",
    line: "Turbo conjugaison"
  },
  {
    id: "shark_blitz",
    name: "Shark Blitz",
    rarity: "Epic",
    image: "./stickers/brainy-shark.svg",
    line: "Mord les fautes"
  },
  {
    id: "toast_king",
    name: "Toast King",
    rarity: "Common",
    image: "./stickers/brainy-toast.svg",
    line: "Chaud devant"
  },
  {
    id: "slime_combo",
    name: "Slime Combo",
    rarity: "Common",
    image: "./stickers/brainy-slime.svg",
    line: "Combo gluant"
  }
];

const REWARD_DEFS = [
  { id: "first_session", label: "Premier pas", check: (p) => p.sessionsCount >= 1 },
  { id: "sharp_30", label: "30 bonnes reponses", check: (p) => p.totalCorrect >= 30 },
  { id: "ace_10", label: "Score parfait", check: (p, s) => s >= 10 },
  { id: "streak_3", label: "Serie x3", check: (p) => p.currentStreak >= 3 }
];

const LEVEL_SIZE = 100;
const LEVEL_LABELS = [
  "Petit verbe",
  "Mini héros",
  "Turbo conjugueur",
  "Champion du present",
  "Boss des verbes"
];

const state = {
  selected: new Set(),
  questions: [],
  currentIndex: 0,
  score: 0,
  errors: [],
  answered: false,
  user: null,
  family: null,
  activeChildId: "",
  progressStore: null,
  isParentMode: false,
  progress: null,
  sessionReward: {
    coins: 0,
    unlocked: [],
    card: null,
    wasNewCard: false
  }
};

const el = {
  views: {
    config: document.getElementById("view-config"),
    progress: document.getElementById("view-progress"),
    session: document.getElementById("view-session"),
    result: document.getElementById("view-result")
  },
  cards: Array.from(document.querySelectorAll(".cat-card")),
  familyStatusLine: document.getElementById("familyStatusLine"),
  selectionFollowLine: document.getElementById("selectionFollowLine"),
  activeChildSelect: document.getElementById("activeChildSelect"),
  parentModeBtn: document.getElementById("parentModeBtn"),
  leaveParentModeBtn: document.getElementById("leaveParentModeBtn"),
  progressChildLine: document.getElementById("progressChildLine"),
  parentAdminPanel: document.getElementById("parentAdminPanel"),
  addChildForm: document.getElementById("addChildForm"),
  childNameInput: document.getElementById("childNameInput"),
  childPinInput: document.getElementById("childPinInput"),
  lockParentAccessBtn: document.getElementById("lockParentAccessBtn"),
  unlockParentAccessBtn: document.getElementById("unlockParentAccessBtn"),
  adminMsg: document.getElementById("adminMsg"),
  childrenOverview: document.getElementById("childrenOverview"),
  selectionSummary: document.getElementById("selectionSummary"),
  startBtn: document.getElementById("startBtn"),
  progressBtn: document.getElementById("progressBtn"),
  backTrainingBtn: document.getElementById("backTrainingBtn"),
  openProgressFromResultBtn: document.getElementById("openProgressFromResultBtn"),
  counter: document.getElementById("counter"),
  progressBar: document.getElementById("progressBar"),
  pronounBadge: document.getElementById("pronounBadge"),
  verbLabel: document.getElementById("verbLabel"),
  questionExplain: document.getElementById("questionExplain"),
  optionsWrap: document.getElementById("optionsWrap"),
  feedback: document.getElementById("feedback"),
  feedbackText: document.getElementById("feedbackText"),
  nextBtn: document.getElementById("nextBtn"),
  scoreLine: document.getElementById("scoreLine"),
  resultMessage: document.getElementById("resultMessage"),
  errorList: document.getElementById("errorList"),
  replayBtn: document.getElementById("replayBtn"),
  backConfigBtn: document.getElementById("backConfigBtn"),
  questionCard: document.getElementById("questionCard"),
  statSessions: document.getElementById("statSessions"),
  statBest: document.getElementById("statBest"),
  statAccuracy: document.getElementById("statAccuracy"),
  statCoins: document.getElementById("statCoins"),
  progressLevel: document.getElementById("progressLevel"),
  progressLevelLabel: document.getElementById("progressLevelLabel"),
  progressXpText: document.getElementById("progressXpText"),
  progressXpBar: document.getElementById("progressXpBar"),
  progressNextGoal: document.getElementById("progressNextGoal"),
  badgeWall: document.getElementById("badgeWall"),
  collectionGrid: document.getElementById("collectionGrid"),
  earnedCoins: document.getElementById("earnedCoins"),
  rewardUnlockedList: document.getElementById("rewardUnlockedList"),
  rewardCard: document.getElementById("rewardCard"),
  mascotImage: document.getElementById("mascotImage"),
  mascotText: document.getElementById("mascotText")
};

function toFirstName(fullName) {
  if (!fullName || typeof fullName !== "string") {
    return "";
  }
  return fullName.trim().split(/\s+/)[0] || "";
}

function renderUserHeader() {
  const subtitleEl = document.getElementById("subtitleText");
  const userLineEl = document.getElementById("userLine");

  if (!subtitleEl || !userLineEl) {
    return;
  }

  const activeChild = getActiveChild();
  const modeLabel = state.isParentMode ? "parent/admin" : "enfant";

  subtitleEl.textContent = "Le mini-jeu du present";

  if (!state.user && !activeChild) {
    userLineEl.hidden = true;
    return;
  }

  const firstName = state.user ? toFirstName(state.user.displayName) : "local";
  const childName = getChildDisplayName(activeChild);
  userLineEl.textContent = `Compte: ${firstName} · Profil: ${childName} · Mode: ${modeLabel}`;
  userLineEl.hidden = false;
}

function getUserAccountId(user) {
  if (!user) {
    return "";
  }
  return String(user.id || user.email || user.providerSubject || "").trim();
}

function getChildDisplayName(child) {
  if (!child) {
    return "-";
  }
  return toFirstName(child.name) || child.name || "-";
}

function isConnectedParent() {
  if (!state.family || !state.family.parent) {
    return false;
  }

  const parentAccountId = String(state.family.parent.accountId || "").trim();
  const userAccountId = getUserAccountId(state.user);
  return Boolean(parentAccountId && userAccountId && parentAccountId === userAccountId);
}

function syncParentModeFromIdentity() {
  if (!state.family || !state.family.settings) {
    state.isParentMode = false;
    return;
  }

  const unlocked = Boolean(state.family.settings.parentUnlocked);
  state.isParentMode = unlocked && isConnectedParent();
}

function ensureParentIdentityFromUser() {
  if (!state.family || !state.user) {
    return;
  }

  state.family.parent = state.family.parent || {};
  const userAccountId = getUserAccountId(state.user);
  if (!userAccountId) {
    return;
  }

  state.family.parent.accountId = userAccountId;
  if (state.user.displayName) {
    state.family.parent.name = state.user.displayName;
  }

  saveFamily();
}

async function loadConnectedUser() {
  try {
    const response = await fetch("/api/me", { cache: "no-store" });
    if (!response.ok) {
      return;
    }

    const payload = await response.json();
    if (payload && payload.user) {
      state.user = payload.user;
      ensureParentIdentityFromUser();
      syncParentModeFromIdentity();
      renderUserHeader();
      renderFamilyUI();
      renderProgressPanel();
    }
  } catch (_error) {
    // Front remains usable even if backend user API is unavailable.
  }
}

function defaultFamily() {
  const defaultChildId = "child-1";
  return {
    parent: {
      name: "Parent Admin",
      pin: "1234",
      accountId: ""
    },
    settings: {
      parentUnlocked: false,
      hideParentAccess: false
    },
    children: [
      {
        id: defaultChildId,
        name: "Eleve 1",
        pin: "1111",
        createdAt: Date.now()
      }
    ],
    activeChildId: defaultChildId
  };
}

function makeChildId() {
  if (window.crypto && typeof window.crypto.randomUUID === "function") {
    return `child-${window.crypto.randomUUID()}`;
  }
  return `child-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

function cleanPin(value) {
  return String(value || "").trim();
}

function getActiveChild() {
  if (!state.family) {
    return null;
  }
  return state.family.children.find((child) => child.id === state.activeChildId) || null;
}

function ensureFamilyShape(input) {
  const fallback = defaultFamily();
  if (!input || typeof input !== "object") {
    return fallback;
  }

  const parentName = input.parent && typeof input.parent.name === "string" ? input.parent.name : fallback.parent.name;
  const parentPin = input.parent && cleanPin(input.parent.pin) ? cleanPin(input.parent.pin) : fallback.parent.pin;
  const parentAccountId =
    input.parent && typeof input.parent.accountId === "string" ? input.parent.accountId.trim() : fallback.parent.accountId;

  const settings = {
    parentUnlocked: Boolean(input.settings && input.settings.parentUnlocked),
    hideParentAccess: Boolean(input.settings && input.settings.hideParentAccess)
  };

  const children = Array.isArray(input.children)
    ? input.children
        .filter((child) => child && typeof child.name === "string")
        .map((child, index) => ({
          id: child.id || `child-${index + 1}`,
          name: child.name.trim() || `Eleve ${index + 1}`,
          pin: cleanPin(child.pin) || "0000",
          createdAt: Number(child.createdAt) || Date.now()
        }))
    : fallback.children;

  if (!children.length) {
    children.push(...fallback.children);
  }

  const activeChildId = children.some((child) => child.id === input.activeChildId)
    ? input.activeChildId
    : children[0].id;

  return {
    parent: { name: parentName, pin: parentPin, accountId: parentAccountId },
    settings,
    children,
    activeChildId
  };
}

function saveFamily() {
  if (!state.family) {
    return;
  }

  state.family.activeChildId = state.activeChildId;
  localStorage.setItem(FAMILY_KEY, JSON.stringify(state.family));
  scheduleServerPersist();
}

function loadFamily() {
  try {
    const raw = localStorage.getItem(FAMILY_KEY);
    if (!raw) {
      state.family = defaultFamily();
      state.activeChildId = state.family.activeChildId;
      saveFamily();
      return;
    }

    state.family = ensureFamilyShape(JSON.parse(raw));
    state.activeChildId = state.family.activeChildId;
  } catch (_error) {
    state.family = defaultFamily();
    state.activeChildId = state.family.activeChildId;
    saveFamily();
  }
}

function normalizeProgressStore(input, activeChildId) {
  if (input && typeof input === "object" && input.schema === 2 && input.byChild && typeof input.byChild === "object") {
    return {
      schema: 2,
      activeChildId,
      byChild: { ...input.byChild }
    };
  }

  return {
    schema: 2,
    activeChildId,
    byChild: activeChildId ? { [activeChildId]: defaultProgress() } : {}
  };
}

function buildFamilyPayload() {
  return {
    family: state.family,
    progressStore: state.progressStore
  };
}

function cacheFamilyPayloadLocally() {
  try {
    const payload = buildFamilyPayload();
    localStorage.setItem(FAMILY_SERVER_CACHE_KEY, JSON.stringify(payload));
  } catch (_error) {
    // Ignore cache failures.
  }
}

let persistTimer = null;

function scheduleServerPersist() {
  if (persistTimer) {
    clearTimeout(persistTimer);
  }

  persistTimer = setTimeout(() => {
    persistFamilyStateToServer();
  }, 120);
}

async function persistFamilyStateToServer() {
  if (!state.family || !state.progressStore) {
    return;
  }

  cacheFamilyPayloadLocally();

  try {
    await fetch(FAMILY_API_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(buildFamilyPayload())
    });
  } catch (_error) {
    // App remains usable even if server sync temporarily fails.
  }
}

async function loadFamilyStateFromServer() {
  try {
    const response = await fetch(FAMILY_API_ENDPOINT, { cache: "no-store" });
    if (response.ok) {
      const payload = await response.json();
      if (payload && payload.family && payload.progressStore) {
        state.family = ensureFamilyShape(payload.family);
        state.activeChildId = state.family.activeChildId;
        state.progressStore = normalizeProgressStore(payload.progressStore, state.activeChildId);

        if (state.activeChildId && !state.progressStore.byChild[state.activeChildId]) {
          state.progressStore.byChild[state.activeChildId] = defaultProgress();
        }

        state.progress = getProgressSnapshotForChild(state.activeChildId);
        localStorage.setItem(FAMILY_KEY, JSON.stringify(state.family));
        localStorage.setItem(PROGRESS_KEY, JSON.stringify(state.progressStore));
        cacheFamilyPayloadLocally();
        return;
      }
    }
  } catch (_error) {
    // Fallback to local cache below.
  }

  try {
    const cached = localStorage.getItem(FAMILY_SERVER_CACHE_KEY);
    if (cached) {
      const payload = JSON.parse(cached);
      if (payload && payload.family && payload.progressStore) {
        state.family = ensureFamilyShape(payload.family);
        state.activeChildId = state.family.activeChildId;
        state.progressStore = normalizeProgressStore(payload.progressStore, state.activeChildId);
        if (state.activeChildId && !state.progressStore.byChild[state.activeChildId]) {
          state.progressStore.byChild[state.activeChildId] = defaultProgress();
        }
        state.progress = getProgressSnapshotForChild(state.activeChildId);
        return;
      }
    }
  } catch (_error) {
    // Ignore malformed cache and fallback to legacy keys.
  }

  loadFamily();
  loadProgress();
}

function getProgressSnapshotForChild(childId) {
  if (!state.progressStore || !state.progressStore.byChild) {
    return defaultProgress();
  }
  return {
    ...defaultProgress(),
    ...(state.progressStore.byChild[childId] || {})
  };
}

function renderChildrenOverview() {
  if (!el.childrenOverview || !state.family) {
    return;
  }

  el.childrenOverview.innerHTML = "";

  state.family.children.forEach((child) => {
    const progress = getProgressSnapshotForChild(child.id);
    const accuracy = progress.totalQuestions ? Math.round((progress.totalCorrect / progress.totalQuestions) * 100) : 0;

    const row = document.createElement("article");
    row.className = "child-row";

    const title = document.createElement("strong");
    title.textContent = getChildDisplayName(child);

    const stats = document.createElement("p");
    stats.textContent = `Sessions ${progress.sessionsCount} · Best ${progress.bestScore}/${SESSION_SIZE} · Precision ${accuracy}%`;

    row.appendChild(title);
    row.appendChild(stats);
    el.childrenOverview.appendChild(row);
  });
}

function renderFamilyUI() {
  if (!state.family) {
    return;
  }

  const activeChild = getActiveChild();

  if (el.activeChildSelect) {
    el.activeChildSelect.innerHTML = "";

    state.family.children.forEach((child) => {
      const option = document.createElement("option");
      option.value = child.id;
      option.textContent = getChildDisplayName(child);
      if (child.id === state.activeChildId) {
        option.selected = true;
      }
      el.activeChildSelect.appendChild(option);
    });
  }

  if (el.familyStatusLine) {
    const modeLabel = state.isParentMode ? "parent/admin" : "enfant";
    el.familyStatusLine.textContent = `Profil actif: ${getChildDisplayName(activeChild)} · Mode ${modeLabel}`;
  }

  if (el.selectionFollowLine) {
    const selected = [...state.selected]
      .map((cat) => (CONJUGO_DATA.categories[cat] ? CONJUGO_DATA.categories[cat].label : cat))
      .join(", ");
    el.selectionFollowLine.textContent = `Selection suivie pour ${getChildDisplayName(activeChild)}: ${selected || "aucune categorie"}`;
  }

  if (el.progressChildLine) {
    el.progressChildLine.textContent = `Profil: ${getChildDisplayName(activeChild)}`;
  }

  const hideParentAccess = Boolean(state.family.settings && state.family.settings.hideParentAccess);
  if (el.parentAdminPanel) {
    el.parentAdminPanel.hidden = !state.isParentMode;
  }

  if (el.leaveParentModeBtn) {
    el.leaveParentModeBtn.hidden = !state.isParentMode;
  }

  if (el.parentModeBtn) {
    el.parentModeBtn.hidden = hideParentAccess && !state.isParentMode;
    el.parentModeBtn.disabled = !state.isParentMode && !isConnectedParent();
  }

  renderChildrenOverview();
}

function switchActiveChild(nextChildId) {
  if (!state.family) {
    return;
  }

  const child = state.family.children.find((entry) => entry.id === nextChildId);
  if (!child) {
    return;
  }

  state.activeChildId = child.id;
  state.family.activeChildId = child.id;
  loadProgress();
  renderFamilyUI();
  renderProgressPanel();
  renderUserHeader();
  saveFamily();
}

function defaultProgress() {
  return {
    sessionsCount: 0,
    totalQuestions: 0,
    totalCorrect: 0,
    bestScore: 0,
    currentStreak: 0,
    maxStreak: 0,
    coins: 0,
    xp: 0,
    badges: [],
    collection: {}
  };
}

function getProgressLevel(progress) {
  const level = Math.floor((progress.xp || 0) / LEVEL_SIZE) + 1;
  const xpIntoLevel = (progress.xp || 0) % LEVEL_SIZE;
  const xpToNext = LEVEL_SIZE - xpIntoLevel;

  return {
    level,
    xpIntoLevel,
    xpToNext,
    progressRatio: (xpIntoLevel / LEVEL_SIZE) * 100,
    label: LEVEL_LABELS[Math.min(LEVEL_LABELS.length - 1, level - 1)]
  };
}

function loadProgress() {
  const activeChildId = state.activeChildId || (state.family && state.family.activeChildId) || "";

  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (!raw) {
      state.progressStore = {
        schema: 2,
        activeChildId,
        byChild: activeChildId ? { [activeChildId]: defaultProgress() } : {}
      };
      state.progress = getProgressSnapshotForChild(activeChildId);
      saveProgress();
      return;
    }

    const parsed = JSON.parse(raw);

    if (parsed && typeof parsed === "object" && parsed.schema === 2 && parsed.byChild) {
      state.progressStore = {
        schema: 2,
        activeChildId,
        byChild: { ...parsed.byChild }
      };
    } else {
      // Legacy migration: old payload stored one single progress object.
      const legacyProgress = { ...defaultProgress(), ...(parsed || {}) };
      state.progressStore = {
        schema: 2,
        activeChildId,
        byChild: activeChildId ? { [activeChildId]: legacyProgress } : {}
      };
    }

    if (activeChildId && !state.progressStore.byChild[activeChildId]) {
      state.progressStore.byChild[activeChildId] = defaultProgress();
    }

    state.progress = getProgressSnapshotForChild(activeChildId);
    saveProgress();
  } catch (_error) {
    state.progressStore = {
      schema: 2,
      activeChildId,
      byChild: activeChildId ? { [activeChildId]: defaultProgress() } : {}
    };
    state.progress = getProgressSnapshotForChild(activeChildId);
    saveProgress();
  }
}

function saveProgress() {
  if (!state.progressStore) {
    return;
  }

  const activeChildId = state.activeChildId;
  if (!activeChildId) {
    return;
  }

  state.progressStore.schema = 2;
  state.progressStore.activeChildId = activeChildId;
  state.progressStore.byChild = state.progressStore.byChild || {};
  state.progressStore.byChild[activeChildId] = {
    ...defaultProgress(),
    ...(state.progress || {})
  };

  localStorage.setItem(PROGRESS_KEY, JSON.stringify(state.progressStore));
  scheduleServerPersist();
}

function renderProgressPanel() {
  if (!state.progress) {
    return;
  }

  const activeChild = getActiveChild();
  if (el.progressChildLine) {
    el.progressChildLine.textContent = `Profil: ${getChildDisplayName(activeChild)}`;
  }
  if (el.parentAdminPanel) {
    el.parentAdminPanel.hidden = !state.isParentMode;
  }

  const accuracy = state.progress.totalQuestions
    ? Math.round((state.progress.totalCorrect / state.progress.totalQuestions) * 100)
    : 0;
  const levelInfo = getProgressLevel(state.progress);

  if (el.progressLevel) {
    el.progressLevel.textContent = String(levelInfo.level);
  }
  if (el.progressLevelLabel) {
    el.progressLevelLabel.textContent = levelInfo.label;
  }
  if (el.progressXpText) {
    el.progressXpText.textContent = `${levelInfo.xpIntoLevel} / ${LEVEL_SIZE} xp`;
  }
  if (el.progressXpBar) {
    el.progressXpBar.style.width = `${levelInfo.progressRatio}%`;
  }
  if (el.progressNextGoal) {
    el.progressNextGoal.textContent = `Encore ${levelInfo.xpToNext} xp pour le prochain niveau.`;
  }

  if (el.statSessions) {
    el.statSessions.textContent = String(state.progress.sessionsCount);
  }
  if (el.statBest) {
    el.statBest.textContent = `${state.progress.bestScore}/${SESSION_SIZE}`;
  }
  if (el.statAccuracy) {
    el.statAccuracy.textContent = `${accuracy}%`;
  }
  if (el.statCoins) {
    el.statCoins.textContent = String(state.progress.coins);
  }

  if (el.badgeWall) {
    el.badgeWall.innerHTML = "";
    if (!state.progress.badges.length) {
      const empty = document.createElement("span");
      empty.className = "badge-chip";
      empty.textContent = "Aucun badge pour l'instant";
      el.badgeWall.appendChild(empty);
    } else {
      state.progress.badges.forEach((badge) => {
        const chip = document.createElement("span");
        chip.className = "badge-chip";
        chip.textContent = badge;
        el.badgeWall.appendChild(chip);
      });
    }
  }

  if (el.collectionGrid) {
    el.collectionGrid.innerHTML = "";
    CARD_DEFS.forEach((card) => {
      const count = Number(state.progress.collection[card.id] || 0);
      const article = document.createElement("article");
      article.className = `collect-card ${count ? "unlocked" : "locked"}`;

      const img = document.createElement("img");
      img.src = card.image;
      img.alt = count ? `Carte ${card.name}` : "Carte verrouillee";

      const title = document.createElement("p");
      title.className = "collect-title";
      title.textContent = count ? card.name : "???";

      const meta = document.createElement("p");
      meta.className = "collect-meta";
      meta.textContent = count ? `${card.rarity} · x${count}` : "A debloquer";

      article.appendChild(img);
      article.appendChild(title);
      article.appendChild(meta);
      el.collectionGrid.appendChild(article);
    });
  }
}

function applySessionRewards() {
  const progress = state.progress;
  if (!progress) {
    return;
  }

  progress.sessionsCount += 1;
  progress.totalQuestions += SESSION_SIZE;
  progress.totalCorrect += state.score;
  progress.bestScore = Math.max(progress.bestScore, state.score);

  if (state.score >= 8) {
    progress.currentStreak += 1;
  } else {
    progress.currentStreak = 0;
  }
  progress.maxStreak = Math.max(progress.maxStreak, progress.currentStreak);

  const earnedCoins = state.score + (state.score === SESSION_SIZE ? 4 : 0);
  progress.coins += earnedCoins;
  const earnedXp = state.score * 10 + (state.score === SESSION_SIZE ? 20 : 0) + (state.score >= 8 ? 10 : 0);
  progress.xp += earnedXp;

  const drawnCard = drawRewardCard(state.score);
  const previousCount = Number(progress.collection[drawnCard.id] || 0);
  progress.collection[drawnCard.id] = previousCount + 1;
  const wasNewCard = previousCount === 0;

  if (drawnCard.rarity === "Epic") {
    progress.coins += 3;
  } else if (drawnCard.rarity === "Rare") {
    progress.coins += 1;
  }

  const unlockedNow = [];
  REWARD_DEFS.forEach((reward) => {
    const already = progress.badges.includes(reward.label);
    if (!already && reward.check(progress, state.score)) {
      progress.badges.push(reward.label);
      unlockedNow.push(reward.label);
    }
  });

  state.sessionReward = {
    coins: earnedCoins + (drawnCard.rarity === "Epic" ? 3 : drawnCard.rarity === "Rare" ? 1 : 0),
    unlocked: unlockedNow,
    card: drawnCard,
    wasNewCard,
    xp: earnedXp
  };

  saveProgress();
  renderProgressPanel();
}

function drawRewardCard(score) {
  const weighted = [];

  CARD_DEFS.forEach((card) => {
    let weight = 1;
    if (card.rarity === "Common") {
      weight = 6;
    } else if (card.rarity === "Rare") {
      weight = score >= 7 ? 4 : 2;
    } else if (card.rarity === "Epic") {
      weight = score >= 9 ? 2 : 1;
    }

    for (let i = 0; i < weight; i += 1) {
      weighted.push(card);
    }
  });

  return weighted[Math.floor(Math.random() * weighted.length)];
}

function renderSessionRewards() {
  if (el.earnedCoins) {
    el.earnedCoins.textContent = String(state.sessionReward.coins);
  }

  if (el.rewardUnlockedList) {
    el.rewardUnlockedList.innerHTML = "";
    if (!state.sessionReward.unlocked.length) {
      const li = document.createElement("li");
      li.textContent = "Continue, un badge arrive bientot!";
      el.rewardUnlockedList.appendChild(li);
    } else {
      state.sessionReward.unlocked.forEach((badge) => {
        const li = document.createElement("li");
        li.textContent = `Nouveau badge: ${badge}`;
        el.rewardUnlockedList.appendChild(li);
      });
    }
  }

  if (el.rewardUnlockedList && state.sessionReward.xp) {
    const xpLi = document.createElement("li");
    xpLi.textContent = `XP gagnee: ${state.sessionReward.xp}`;
    el.rewardUnlockedList.appendChild(xpLi);
  }

  if (el.rewardCard) {
    el.rewardCard.innerHTML = "";
    if (state.sessionReward.card) {
      const card = state.sessionReward.card;
      const cardEl = document.createElement("article");
      cardEl.className = `pack-card rarity-${card.rarity.toLowerCase()}`;

      const img = document.createElement("img");
      img.src = card.image;
      img.alt = `Carte ${card.name}`;

      const title = document.createElement("p");
      title.className = "pack-title";
      title.textContent = card.name;

      const meta = document.createElement("p");
      meta.className = "pack-meta";
      const fresh = state.sessionReward.wasNewCard ? "NOUVELLE" : "Doublon";
      meta.textContent = `${card.rarity} · ${fresh}`;

      cardEl.appendChild(img);
      cardEl.appendChild(title);
      cardEl.appendChild(meta);
      el.rewardCard.appendChild(cardEl);
    }
  }
}

function shuffle(list) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function randomMascotMessage() {
  const lines = [
    "Mode turbo active!",
    "Ton cerveau brille!",
    "Combo en cours!",
    "Let's pop conjugaison!"
  ];
  return lines[Math.floor(Math.random() * lines.length)];
}

function setRandomMascot() {
  if (el.mascotImage) {
    const src = STICKER_SOURCES[Math.floor(Math.random() * STICKER_SOURCES.length)];
    el.mascotImage.src = src;
  }
  if (el.mascotText) {
    el.mascotText.textContent = randomMascotMessage();
  }
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

  if (el.selectionFollowLine) {
    const activeChild = getActiveChild();
    el.selectionFollowLine.textContent = `Selection suivie pour ${getChildDisplayName(activeChild)}: ${labels.join(", ") || "aucune categorie"}`;
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

function extractVerbForm(fullAnswer) {
  if (fullAnswer.startsWith("j'")) {
    return fullAnswer.slice(2).trim();
  }

  const firstSpace = fullAnswer.indexOf(" ");
  if (firstSpace === -1) {
    return fullAnswer.trim();
  }

  return fullAnswer.slice(firstSpace + 1).trim();
}

function findVerb(categoryKey, verbInfinitive) {
  return CONJUGO_DATA.categories[categoryKey].verbs.find((verb) => verb.infinitive === verbInfinitive);
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
    let fallbackPicked = null;

    for (const cat of shuffle(stepCats)) {
      const uniqueCandidates = candidatesByCategory[cat].filter((c) => !usedPair.has(`${c.verb}|${c.pronounKey}`));
      const allCandidates = candidatesByCategory[cat];

      const sortCandidates = (candidates) => [...candidates].sort((a, b) => {
        const scoreA = pronounUsage[a.pronounKey] + (recentVerbs.includes(a.verb) ? 10 : 0) + Math.random();
        const scoreB = pronounUsage[b.pronounKey] + (recentVerbs.includes(b.verb) ? 10 : 0) + Math.random();
        return scoreA - scoreB;
      });

      const sorted = sortCandidates(uniqueCandidates);
      const best = sorted[0];
      if (best) {
        picked = best;
        if (targets[cat] > 0) {
          targets[cat] -= 1;
        }
        break;
      }

      if (!fallbackPicked && allCandidates.length) {
        fallbackPicked = sortCandidates(allCandidates)[0];
      }
    }

    if (!picked) {
      picked = fallbackPicked;
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
  const correctForm = extractVerbForm(question.answer);
  const pool = [];

  const currentVerb = findVerb(question.categoryKey, question.verb);
  Object.entries(currentVerb.forms).forEach(([pronounKey, fullForm]) => {
    if (pronounKey !== question.pronounKey) {
      pool.push(extractVerbForm(fullForm));
    }
  });

  selectedCategories.forEach((cat) => {
    const category = CONJUGO_DATA.categories[cat];
    category.verbs.forEach((verb) => {
      const form = extractVerbForm(verb.forms[question.pronounKey]);
      if (form !== correctForm) {
        pool.push(form);
      }
    });
  });

  const uniquePool = shuffle([...new Set(pool)].filter((form) => form !== correctForm));
  const distractors = uniquePool.slice(0, 3);

  return shuffle([correctForm, ...distractors]);
}

function renderQuestion() {
  const question = state.questions[state.currentIndex];
  if (!question) {
    return;
  }

  state.answered = false;
  setRandomMascot();

  el.counter.textContent = `Question ${state.currentIndex + 1}/${SESSION_SIZE}`;
  el.progressBar.style.width = `${((state.currentIndex + 1) / SESSION_SIZE) * 100}%`;

  el.pronounBadge.textContent = question.pronounLabel;
  el.verbLabel.textContent = question.verb;
  el.questionExplain.textContent = `Complete: ${getPromptPronoun(question)} ___ (${question.verb})`;

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
  const correctForm = extractVerbForm(question.answer);
  const ok = selectedText === correctForm;

  const optionButtons = Array.from(el.optionsWrap.querySelectorAll(".option"));
  optionButtons.forEach((btn) => {
    btn.disabled = true;
    if (btn.textContent === correctForm) {
      btn.classList.add("is-correct");
    }
    if (btn === clickedButton && !ok) {
      btn.classList.add("is-wrong");
    }
  });

  if (ok) {
    state.score += 1;
    el.feedbackText.textContent = `Super! ${formatFullAnswer(question, correctForm)}.`;
    triggerRewardAnimation();
  } else {
    state.errors.push({
      verb: question.verb,
      pronoun: question.pronounLabel,
      expected: formatFullAnswer(question, correctForm),
      selected: selectedText
    });
    el.feedbackText.textContent = `Presque! La bonne phrase: ${formatFullAnswer(question, correctForm)}.`;
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

function isElidedPronoun(question) {
  if (question.pronounKey !== "je") {
    return false;
  }

  return /^[aeiouyh]/i.test(extractVerbForm(question.answer));
}

function getPromptPronoun(question) {
  if (isElidedPronoun(question)) {
    return "j'";
  }
  return question.pronounLabel;
}

function formatFullAnswer(question, correctForm) {
  return `${getPromptPronoun(question)}${isElidedPronoun(question) ? "" : " "}${correctForm}`;
}

function navigateToProgress() {
  showView("progress");
  renderProgressPanel();
}

function showResults() {
  applySessionRewards();
  showView("result");
  el.scoreLine.textContent = `Score: ${state.score}/${SESSION_SIZE}`;
  el.resultMessage.textContent = scoreMessage(state.score);
  renderSessionRewards();

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
  state.sessionReward = { coins: 0, unlocked: [], card: null, wasNewCard: false };

  showView("session");
  renderQuestion();
}

function backToConfig() {
  showView("config");
  updateConfigUI();
}

function backToTraining() {
  showView("config");
  updateConfigUI();
}

function showAdminMessage(message) {
  if (!el.adminMsg) {
    return;
  }
  el.adminMsg.textContent = message;
}

function handleParentMode() {
  if (!state.family) {
    return;
  }

  if (!isConnectedParent()) {
    showAdminMessage("Seul le parent connecte peut activer ce mode.");
    return;
  }

  if (state.family.settings && state.family.settings.parentUnlocked) {
    state.isParentMode = true;
    showAdminMessage("Mode parent/admin actif (session memorisee).");
    renderFamilyUI();
    renderProgressPanel();
    renderUserHeader();
    return;
  }

  const pin = cleanPin(window.prompt("Code parent/admin:"));
  if (!pin) {
    showAdminMessage("Activation annulee.");
    return;
  }

  if (pin !== cleanPin(state.family.parent.pin)) {
    showAdminMessage("Code incorrect.");
    return;
  }

  state.family.settings = state.family.settings || {};
  state.family.settings.parentUnlocked = true;
  state.isParentMode = true;
  showAdminMessage("Mode parent/admin active et memorisee sur cet appareil.");
  saveFamily();
  renderFamilyUI();
  renderProgressPanel();
  renderUserHeader();
}

function handleLeaveParentMode() {
  state.isParentMode = false;
  showAdminMessage("Mode enfant actif.");
  renderFamilyUI();
  renderProgressPanel();
  renderUserHeader();
}

function handleChildSwitch(event) {
  if (!state.family || !el.activeChildSelect) {
    return;
  }

  const targetChildId = event.target.value;
  if (!targetChildId || targetChildId === state.activeChildId) {
    return;
  }

  const targetChild = state.family.children.find((child) => child.id === targetChildId);
  if (!targetChild) {
    return;
  }

  if (!state.isParentMode) {
    const pin = cleanPin(window.prompt(`PIN de ${targetChild.name}:`));
    if (pin !== cleanPin(targetChild.pin)) {
      el.activeChildSelect.value = state.activeChildId;
      showAdminMessage("PIN enfant incorrect.");
      return;
    }
  }

  switchActiveChild(targetChildId);
  showAdminMessage(`Profil actif: ${getChildDisplayName(targetChild)}.`);
}

function handleAddChild(event) {
  event.preventDefault();

  if (!state.family || !state.isParentMode) {
    showAdminMessage("Active le mode parent/admin pour ajouter un profil.");
    return;
  }

  const name = String(el.childNameInput && el.childNameInput.value ? el.childNameInput.value : "").trim();
  const pin = cleanPin(el.childPinInput && el.childPinInput.value ? el.childPinInput.value : "");

  if (name.length < 2) {
    showAdminMessage("Nom enfant trop court.");
    return;
  }
  if (pin.length < 4) {
    showAdminMessage("PIN enfant trop court (4 chiffres min).");
    return;
  }

  if (toFirstName(name).toLowerCase() === toFirstName(state.family.parent.name || "").toLowerCase()) {
    showAdminMessage("Le parent connecte ne peut pas etre cree comme enfant.");
    return;
  }

  const child = {
    id: makeChildId(),
    name,
    pin,
    createdAt: Date.now()
  };

  state.family.children.push(child);
  if (!state.progressStore) {
    state.progressStore = { schema: 2, activeChildId: state.activeChildId, byChild: {} };
  }
  state.progressStore.byChild[child.id] = defaultProgress();
  saveFamily();
  saveProgress();

  if (el.childNameInput) {
    el.childNameInput.value = "";
  }
  if (el.childPinInput) {
    el.childPinInput.value = "";
  }

  renderFamilyUI();
  showAdminMessage(`Profil enfant ajoute: ${getChildDisplayName(child)}.`);
}

function handleLockParentAccess() {
  if (!state.family || !state.isParentMode) {
    showAdminMessage("Active le mode parent/admin pour modifier ce verrou.");
    return;
  }

  state.family.settings = state.family.settings || {};
  state.family.settings.hideParentAccess = true;
  saveFamily();
  renderFamilyUI();
  showAdminMessage("Acces parent masque cote enfant. Raccourci parent: Alt+Shift+P.");
}

function handleUnlockParentAccess() {
  if (!state.family || !state.isParentMode) {
    showAdminMessage("Active le mode parent/admin pour modifier ce verrou.");
    return;
  }

  state.family.settings = state.family.settings || {};
  state.family.settings.hideParentAccess = false;
  saveFamily();
  renderFamilyUI();
  showAdminMessage("Acces parent visible pour la connexion.");
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
  if (el.activeChildSelect) {
    el.activeChildSelect.addEventListener("change", handleChildSwitch);
  }
  if (el.parentModeBtn) {
    el.parentModeBtn.addEventListener("click", handleParentMode);
  }
  if (el.leaveParentModeBtn) {
    el.leaveParentModeBtn.addEventListener("click", handleLeaveParentMode);
  }
  if (el.addChildForm) {
    el.addChildForm.addEventListener("submit", handleAddChild);
  }
  if (el.lockParentAccessBtn) {
    el.lockParentAccessBtn.addEventListener("click", handleLockParentAccess);
  }
  if (el.unlockParentAccessBtn) {
    el.unlockParentAccessBtn.addEventListener("click", handleUnlockParentAccess);
  }
  el.startBtn.addEventListener("click", startSession);
  el.progressBtn.addEventListener("click", navigateToProgress);
  el.backTrainingBtn.addEventListener("click", backToTraining);
  el.openProgressFromResultBtn.addEventListener("click", navigateToProgress);
  el.nextBtn.addEventListener("click", nextQuestion);
  el.replayBtn.addEventListener("click", startSession);
  el.backConfigBtn.addEventListener("click", backToConfig);
  document.addEventListener("keydown", (event) => {
    if (event.altKey && event.shiftKey && event.key.toLowerCase() === "p") {
      handleParentMode();
      return;
    }
    if (event.key === "Enter" && !el.feedback.hidden && el.views.session.classList.contains("active")) {
      nextQuestion();
    }
  });
}

function bindServiceWorker() {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("./sw.js").catch(() => {
        // Service worker registration failure should not block app usage.
      });
    });
  }
}

async function init() {
  const versionEl = document.getElementById("appVersion");
  if (versionEl) {
    versionEl.textContent = APP_VERSION;
  }

  await loadFamilyStateFromServer();
  syncParentModeFromIdentity();
  loadPreferences();
  renderFamilyUI();
  renderUserHeader();
  updateConfigUI();
  renderProgressPanel();
  bindEvents();
  bindServiceWorker();
  loadConnectedUser();
}

init();
