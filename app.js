/* global CONJUGO_DATA, BRAINROT_PIPELINE */

const SESSION_SIZE = 10;
const SESSION_SUCCESS_SCORE = 8;
const RECENT_VERB_WINDOW = 2;
const STORAGE_KEY = "conjugo-preferences-v1";
const PROGRESS_KEY = "conjugo-progress-v1";
const FAMILY_KEY = "conjugo-family-v1";
const FAMILY_SERVER_CACHE_KEY = "conjugo-family-server-cache-v1";
const FAMILY_API_ENDPOINT = "/api/family-state";
const USERS_API_ENDPOINT = "/api/users";
const APP_VERSION = "v2026.05.27.1";
const STICKER_CATALOG_SIZE = 30;
const STICKER_UNLOCK_XP_STEP = 40;
const SELF_SELECTION_ID = "__self__";

const STICKER_SOURCES = [
  "./stickers/brainy-rocket.svg",
  "./stickers/brainy-shark.svg",
  "./stickers/brainy-toast.svg",
  "./stickers/brainy-slime.svg"
];

const CARD_DEFS = BRAINROT_PIPELINE
  ? BRAINROT_PIPELINE.buildBrainrotCatalog(STICKER_CATALOG_SIZE, STICKER_SOURCES)
  : [];

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

const FUNNY_TEMPLATES_BY_VERB = {
  etre: [
    "Avant la mission, {pronounBlank} ({verb}) de bonne humeur.",
    "Pendant le cours magique, {pronounBlank} ({verb}) toujours en avance.",
    "Au club des robots, {pronounBlank} ({verb}) au rendez-vous."
  ],
  avoir: [
    "Pour la mission du jour, {pronounBlank} ({verb}) une idee brillante.",
    "A la fete de l'ecole, {pronounBlank} ({verb}) un costume rigolo.",
    "Dans le labo secret, {pronounBlank} ({verb}) une lampe arc-en-ciel."
  ],
  manger: [
    "A la cantine de l'espace, {pronounBlank} ({verb}) une pizza cosmique.",
    "Pendant le picnic geant, {pronounBlank} ({verb}) un sandwich geant.",
    "Au parc des dragons, {pronounBlank} ({verb}) une glace bleue."
  ],
  jouer: [
    "Dans la cour de recreation, {pronounBlank} ({verb}) au ballon.",
    "Au stade des pingouins, {pronounBlank} ({verb}) avec l'equipe.",
    "A la fete du village, {pronounBlank} ({verb}) a cache-cache."
  ],
  parler: [
    "En classe, {pronounBlank} ({verb}) au micro de la radio.",
    "Au conseil des heros, {pronounBlank} ({verb}) avec assurance.",
    "Pendant la reunion, {pronounBlank} ({verb}) calmement."
  ],
  aimer: [
    "Dans la bibliotheque magique, {pronounBlank} ({verb}) les histoires droles.",
    "A la maison, {pronounBlank} ({verb}) les jeux de mots.",
    "Pendant la fete, {pronounBlank} ({verb}) les chansons rigolotes."
  ],
  finir: [
    "En etude, {pronounBlank} ({verb}) l'exercice avant la cloche.",
    "Dans le labo, {pronounBlank} ({verb}) le puzzle geant.",
    "Avant la recre, {pronounBlank} ({verb}) le devoir."
  ],
  choisir: [
    "Dans le coffre magique, {pronounBlank} ({verb}) la bonne cle.",
    "Au jeu des cartes, {pronounBlank} ({verb}) la meilleure option.",
    "Pendant la mission, {pronounBlank} ({verb}) le bon chemin."
  ],
  aller: [
    "Chaque matin, {pronounBlank} ({verb}) a l'ecole en chanson.",
    "Pour la mission, {pronounBlank} ({verb}) au laboratoire secret.",
    "Apres le cours, {pronounBlank} ({verb}) a la bibliotheque."
  ],
  faire: [
    "En atelier, {pronounBlank} ({verb}) un dessin geant.",
    "Pour la fete, {pronounBlank} ({verb}) un gateau imaginaire.",
    "En equipe, {pronounBlank} ({verb}) un plan parfait."
  ],
  venir: [
    "Pour la reunion, {pronounBlank} ({verb}) avec le sourire.",
    "A la fete de l'ecole, {pronounBlank} ({verb}) en avance.",
    "Dans le labo secret, {pronounBlank} ({verb}) pour aider l'equipe."
  ],
  prendre: [
    "Avant la course, {pronounBlank} ({verb}) le bus volant.",
    "En classe, {pronounBlank} ({verb}) le cahier bleu.",
    "Pour la mission, {pronounBlank} ({verb}) la bonne direction."
  ]
};

const FUNNY_FALLBACK_TEMPLATES = [
  "Pendant la mission du jour, {pronounBlank} ({verb}) avec concentration.",
  "En classe, {pronounBlank} ({verb}) sans se tromper.",
  "A la fete de l'ecole, {pronounBlank} ({verb}) avec le sourire."
];

const FUNNY_SUCCESS_LINES = [
  "Parfait, les licornes valident.",
  "Excellent, mission turbo reussie.",
  "Bien joue, les pingouins applaudissent.",
  "Top, le dragon dit bravo."
];

const FUNNY_RETRY_LINES = [
  "Pas grave, on relance la fusee.",
  "Ce n'est pas loin, on continue.",
  "Presque, les pingouins t'encouragent.",
  "On y est presque, prochain coup c'est bon."
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
  adminTab: "children",
  progressStore: null,
  isParentMode: false,
  knownUsers: [],
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
    admin: document.getElementById("view-admin"),
    session: document.getElementById("view-session"),
    result: document.getElementById("view-result")
  },
  cards: Array.from(document.querySelectorAll(".cat-card")),
  familyStatusLine: document.getElementById("familyStatusLine"),
  selectionFollowLine: document.getElementById("selectionFollowLine"),
  activeChildSelect: document.getElementById("activeChildSelect"),
  parentModeBtn: document.getElementById("parentModeBtn"),
  leaveParentModeBtn: document.getElementById("leaveParentModeBtn"),
  openAdminBtn: document.getElementById("openAdminBtn"),
  progressChildLine: document.getElementById("progressChildLine"),
  parentAdminPanel: document.getElementById("parentAdminPanel"),
  adminLockedNotice: document.getElementById("adminLockedNotice"),
  adminChildrenTab: document.getElementById("adminChildrenTab"),
  adminBrainrotTab: document.getElementById("adminBrainrotTab"),
  adminChildrenPanel: document.getElementById("adminChildrenPanel"),
  adminBrainrotPanel: document.getElementById("adminBrainrotPanel"),
  brainrotCountLine: document.getElementById("brainrotCountLine"),
  adminBrainrotGrid: document.getElementById("adminBrainrotGrid"),
  brainrotModal: document.getElementById("brainrotModal"),
  brainrotModalBackdrop: document.getElementById("brainrotModalBackdrop"),
  brainrotModalClose: document.getElementById("brainrotModalClose"),
  brainrotModalSaveBtn: document.getElementById("brainrotModalSaveBtn"),
  brainrotModalStage: document.getElementById("brainrotModalStage"),
  brainrotModalImage: document.getElementById("brainrotModalImage"),
  brainrotModalEmblem: document.getElementById("brainrotModalEmblem"),
  brainrotModalTitle: document.getElementById("brainrotModalTitle"),
  brainrotModalMeta: document.getElementById("brainrotModalMeta"),
  brainrotModalLine: document.getElementById("brainrotModalLine"),
  addChildForm: document.getElementById("addChildForm"),
  childNameInput: document.getElementById("childNameInput"),
  childPinInput: document.getElementById("childPinInput"),
  lockParentAccessBtn: document.getElementById("lockParentAccessBtn"),
  unlockParentAccessBtn: document.getElementById("unlockParentAccessBtn"),
  adminChildCount: document.getElementById("adminChildCount"),
  adminKnownUsersCount: document.getElementById("adminKnownUsersCount"),
  adminLinkedUsersCount: document.getElementById("adminLinkedUsersCount"),
  adminAccessState: document.getElementById("adminAccessState"),
  adminActiveProfileLine: document.getElementById("adminActiveProfileLine"),
  accountUsersList: document.getElementById("accountUsersList"),
  adminMsg: document.getElementById("adminMsg"),
  childrenOverview: document.getElementById("childrenOverview"),
  selectionSummary: document.getElementById("selectionSummary"),
  startBtn: document.getElementById("startBtn"),
  progressBtn: document.getElementById("progressBtn"),
  openAdminFromProgressBtn: document.getElementById("openAdminFromProgressBtn"),
  backTrainingBtn: document.getElementById("backTrainingBtn"),
  backTrainingFromAdminBtn: document.getElementById("backTrainingFromAdminBtn"),
  backProgressFromAdminBtn: document.getElementById("backProgressFromAdminBtn"),
  openProgressFromResultBtn: document.getElementById("openProgressFromResultBtn"),
  counter: document.getElementById("counter"),
  progressBar: document.getElementById("progressBar"),
  pronounBadge: document.getElementById("pronounBadge"),
  verbLabel: document.getElementById("verbLabel"),
  questionExplain: document.getElementById("questionExplain"),
  sessionModeHint: document.getElementById("sessionModeHint"),
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
  unlockProgressLine: document.getElementById("unlockProgressLine"),
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

function applyCardVisual(img, card) {
  if (!img || !card) {
    return;
  }

  if (card.image && card.image.startsWith("data:")) {
    img.style.filter = "";
    return;
  }

  img.style.filter = `hue-rotate(${Number(card.hue || 0)}deg) saturate(${Number(card.sat || 1)})`;
}

function rarityClass(card) {
  return `rarity-${String(card && card.rarity ? card.rarity : "common").toLowerCase()}`;
}

function cardTone(card) {
  if (!card) {
    return "0";
  }
  return String(Number(card.hue || 0));
}

function cardAccent(card) {
  if (!card) {
    return "0";
  }
  return String(Number(card.accent || 0));
}

function cardMotif(card) {
  return `motif-${String(card && card.motif ? card.motif : "spark")}`;
}

function makeVisualStage(card, size = "normal") {
  const stage = document.createElement("div");
  stage.className = `brainrot-stage ${rarityClass(card)} ${cardMotif(card)} ${size === "large" ? "is-large" : ""}`;
  stage.style.setProperty("--brainrot-hue", cardTone(card));
  stage.style.setProperty("--brainrot-accent", cardAccent(card));

  const emblem = document.createElement("span");
  emblem.className = "brainrot-emblem";
  emblem.textContent = card.emblem || "⚡";

  const img = document.createElement("img");
  img.src = card.image;
  img.alt = `Brainrot ${card.name}`;
  applyCardVisual(img, card);

  stage.appendChild(img);
  stage.appendChild(emblem);
  return stage;
}

function getCardById(cardId) {
  return CARD_DEFS.find((card) => card.id === cardId) || null;
}

function slugifyCardName(name) {
  return String(name || "brainrot")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "brainrot";
}

function extensionFromImageSource(src) {
  const source = String(src || "").toLowerCase();
  if (source.startsWith("data:image/svg+xml")) {
    return "svg";
  }
  if (source.startsWith("data:image/png")) {
    return "png";
  }
  if (source.startsWith("data:image/webp")) {
    return "webp";
  }
  if (source.startsWith("data:image/jpeg") || source.startsWith("data:image/jpg")) {
    return "jpg";
  }

  const dotIndex = source.lastIndexOf(".");
  if (dotIndex === -1) {
    return "svg";
  }

  const ext = source.slice(dotIndex + 1).split("?")[0].split("#")[0];
  return ext || "svg";
}

function downloadCardImage(card) {
  if (!card || !card.image) {
    return;
  }

  const extension = extensionFromImageSource(card.image);
  const filename = `${slugifyCardName(card.name)}.${extension}`;
  const link = document.createElement("a");
  link.href = card.image;
  link.download = filename;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
}

function openBrainrotModal(card) {
  if (!card || !el.brainrotModal) {
    return;
  }

  if (el.brainrotModalImage) {
    el.brainrotModalImage.src = card.image;
    el.brainrotModalImage.alt = `Brainrot ${card.name}`;
    applyCardVisual(el.brainrotModalImage, card);
  }
  if (el.brainrotModalEmblem) {
    el.brainrotModalEmblem.textContent = card.emblem || "⚡";
  }
  if (el.brainrotModalTitle) {
    el.brainrotModalTitle.textContent = card.name;
  }
  if (el.brainrotModalMeta) {
    el.brainrotModalMeta.textContent = `${card.rarity} · ${card.family || "Brainrot"} · Q${Number(card.quality || 0)}`;
  }
  if (el.brainrotModalLine) {
    el.brainrotModalLine.textContent = card.line || "";
  }

  if (el.brainrotModalStage) {
    el.brainrotModalStage.className = `brainrot-stage is-large ${rarityClass(card)} ${cardMotif(card)}`;
    el.brainrotModalStage.style.setProperty("--brainrot-hue", cardTone(card));
    el.brainrotModalStage.style.setProperty("--brainrot-accent", cardAccent(card));
  }

  el.brainrotModal.dataset.cardId = card.id;

  el.brainrotModal.hidden = false;
}

function closeBrainrotModal() {
  if (!el.brainrotModal) {
    return;
  }
  delete el.brainrotModal.dataset.cardId;
  el.brainrotModal.hidden = true;
}

function handleSaveBrainrotImage() {
  if (!el.brainrotModal) {
    return;
  }

  const cardId = el.brainrotModal.dataset.cardId;
  const card = getCardById(cardId);
  if (!card) {
    return;
  }

  downloadCardImage(card);
}

function handleBrainrotClick(event) {
  const target = event.target.closest("[data-card-id]");
  if (!target) {
    return;
  }

  const card = getCardById(target.dataset.cardId);
  if (!card) {
    return;
  }

  openBrainrotModal(card);
}

function getUnlockedCount(progress) {
  if (!progress || !progress.collection) {
    return 0;
  }

  return Object.values(progress.collection).filter((count) => Number(count || 0) > 0).length;
}

function getStickerUnlockTarget(progress) {
  const xp = Math.max(0, Number(progress && progress.xp ? progress.xp : 0));
  const target = Math.floor(xp / STICKER_UNLOCK_XP_STEP);
  return Math.min(CARD_DEFS.length, target);
}

function sanitizeCollection(progress) {
  const collection = progress && progress.collection && typeof progress.collection === "object"
    ? { ...progress.collection }
    : {};
  const catalogIds = new Set(CARD_DEFS.map((card) => card.id));

  Object.keys(collection).forEach((cardId) => {
    const count = Math.floor(Number(collection[cardId] || 0));
    if (!catalogIds.has(cardId) || count <= 0) {
      delete collection[cardId];
      return;
    }
    collection[cardId] = count;
  });

  return collection;
}

function repairLegacyOverUnlockedCollection(progress) {
  if (!progress) {
    return;
  }

  const unlockedCount = getUnlockedCount(progress);
  if (unlockedCount !== CARD_DEFS.length) {
    return;
  }

  const sessionsCount = Number(progress.sessionsCount || 0);
  if (sessionsCount > 5) {
    return;
  }

  const xpTarget = getStickerUnlockTarget(progress);
  const sessionTarget = Math.min(CARD_DEFS.length, Math.max(1, sessionsCount));
  const repairedTarget = Math.max(xpTarget, sessionTarget);

  if (repairedTarget >= unlockedCount) {
    return;
  }

  const keepIds = new Set(CARD_DEFS.slice(0, repairedTarget).map((card) => card.id));
  Object.keys(progress.collection || {}).forEach((cardId) => {
    if (!keepIds.has(cardId)) {
      delete progress.collection[cardId];
      return;
    }
    progress.collection[cardId] = Math.max(1, Math.floor(Number(progress.collection[cardId] || 1)));
  });
}

function unlockCardsForProgress(progress) {
  const unlockedNow = [];
  const target = getStickerUnlockTarget(progress);
  const unlockedCount = getUnlockedCount(progress);

  if (target <= unlockedCount) {
    return unlockedNow;
  }

  const missing = target - unlockedCount;
  const lockedCards = shuffle(CARD_DEFS.filter((card) => Number(progress.collection[card.id] || 0) === 0));

  lockedCards.slice(0, missing).forEach((card) => {
    progress.collection[card.id] = 1;
    unlockedNow.push(card);
  });

  return unlockedNow;
}

function unlockSingleNewCard(score, progress) {
  const lockedCards = CARD_DEFS.filter((card) => Number(progress.collection[card.id] || 0) === 0);
  if (!lockedCards.length) {
    return null;
  }

  const weighted = [];
  lockedCards.forEach((card) => {
    let weight = 1;
    if (card.rarity === "Common") {
      weight = score >= 8 ? 2 : 5;
    } else if (card.rarity === "Rare") {
      weight = score >= 7 ? 4 : 2;
    } else if (card.rarity === "Epic") {
      weight = score >= 9 ? 3 : 1;
    }

    for (let i = 0; i < weight; i += 1) {
      weighted.push(card);
    }
  });

  const picked = weighted[Math.floor(Math.random() * weighted.length)];
  progress.collection[picked.id] = 1;
  return picked;
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
  const accountRole = isConnectedParent() ? "parent" : "enfant";
  const profileName = isSelfSelection(state.activeChildId) ? "Mon profil" : getChildDisplayName(activeChild);
  const trackedLabel = isSelfSelection(state.activeChildId) ? "Profil suivi" : "Enfant suivi";
  userLineEl.textContent = `Compte: ${firstName} (${accountRole}) · ${trackedLabel}: ${profileName} · Mode: ${modeLabel}`;
  userLineEl.hidden = false;
}

function getUserAccountId(user) {
  if (!user) {
    return "";
  }

  return String(user.email || user.providerSubject || user.id || "").trim();
}

function getAccountIdFromUserRecord(userRecord) {
  if (!userRecord || typeof userRecord !== "object") {
    return "";
  }
  return String(userRecord.email || userRecord.providerSubject || userRecord.id || "").trim();
}

function getSuggestedChildNameFromUserRecord(userRecord) {
  if (!userRecord || typeof userRecord !== "object") {
    return "";
  }

  const displayFirstName = toFirstName(userRecord.displayName);
  if (displayFirstName) {
    return displayFirstName;
  }

  const email = String(userRecord.email || "").trim();
  if (!email || !email.includes("@")) {
    return "";
  }

  const localPart = email.split("@")[0] || "";
  return localPart ? localPart.replace(/[._-]+/g, " ").trim() : "";
}

function getChildDisplayName(child) {
  if (!child) {
    return "-";
  }
  return toFirstName(child.name) || child.name || "-";
}

function isSelfSelection(selectionId) {
  return selectionId === SELF_SELECTION_ID;
}

function getSelfProgressKey() {
  const connectedAccountId = getUserAccountId(state.user);
  const familyParentAccountId =
    state.family && state.family.parent && typeof state.family.parent.accountId === "string"
      ? state.family.parent.accountId.trim()
      : "";
  const accountId = connectedAccountId || familyParentAccountId || "local";
  return `self:${accountId}`;
}

function getProgressKeyForSelection(selectionId) {
  if (!selectionId) {
    return "";
  }
  return isSelfSelection(selectionId) ? getSelfProgressKey() : selectionId;
}

function getActiveProgressKey() {
  return getProgressKeyForSelection(state.activeChildId);
}

function isKnownChildId(selectionId) {
  if (!state.family || !selectionId) {
    return false;
  }
  const normalizedSelectionId = String(selectionId).trim();
  return state.family.children.some((child) => String(child.id || "").trim() === normalizedSelectionId);
}

function normalizeSelectionId(selectionId) {
  if (isSelfSelection(selectionId)) {
    return SELF_SELECTION_ID;
  }

  if (isKnownChildId(selectionId)) {
    return selectionId;
  }

  if (state.family && isKnownChildId(state.family.activeChildId)) {
    return state.family.activeChildId;
  }

  if (state.family && state.family.children.length) {
    return state.family.children[0].id;
  }

  return SELF_SELECTION_ID;
}

function getSelectionDisplayName(selectionId = state.activeChildId) {
  if (isSelfSelection(selectionId)) {
    return "Mon profil";
  }

  if (!state.family) {
    return "-";
  }

  const normalizedSelectionId = String(selectionId || "").trim();
  const child = state.family.children.find((entry) => String(entry.id || "").trim() === normalizedSelectionId) || null;
  return getChildDisplayName(child);
}

async function fetchKnownUsers() {
  try {
    const response = await fetch(USERS_API_ENDPOINT, { cache: "no-store" });
    if (!response.ok) {
      return [];
    }

    const payload = await response.json();
    return Array.isArray(payload && payload.users) ? payload.users : [];
  } catch (_error) {
    return [];
  }
}

async function removeKnownUserRecord(userId) {
  try {
    const response = await fetch(`${USERS_API_ENDPOINT}/${encodeURIComponent(userId)}`, {
      method: "DELETE",
      cache: "no-store"
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      return { ok: false, error: payload.error || "delete_failed" };
    }

    return {
      ok: true,
      unlinkedChildren: Number(payload.unlinkedChildren || 0)
    };
  } catch (_error) {
    return { ok: false, error: "network_error" };
  }
}

async function renderAccountUsersList() {
  if (!el.accountUsersList || !state.family) {
    return;
  }

  el.accountUsersList.innerHTML = "";

  const users = await fetchKnownUsers();
  state.knownUsers = users;

  if (!users.length) {
    const empty = document.createElement("p");
    empty.className = "hint";
    empty.textContent = "Aucun utilisateur detecte pour le moment.";
    el.accountUsersList.appendChild(empty);
    renderAdminOverview();
    return;
  }

  const parentAccountId = String(state.family.parent && state.family.parent.accountId ? state.family.parent.accountId : "").trim();

  users.forEach((userRecord) => {
    const accountId = getAccountIdFromUserRecord(userRecord);
    const linkedChild = state.family.children.find((child) => String(child.accountId || "").trim() === accountId) || null;
    const suggestedChildName = getSuggestedChildNameFromUserRecord(userRecord);
    const existingChildByName = linkedChild ? linkedChild : findChildByName(suggestedChildName);
    const isParentAccount = Boolean(parentAccountId && accountId && parentAccountId === accountId);

    const row = document.createElement("article");
    row.className = "account-user-row";

    const identity = document.createElement("div");
    identity.className = "account-user-identity";

    const title = document.createElement("strong");
    title.textContent = toFirstName(userRecord.displayName) || userRecord.displayName || userRecord.email || "Compte";

    const subtitle = document.createElement("p");
    subtitle.className = "hint";
    subtitle.textContent = userRecord.email || userRecord.providerSubject || userRecord.id || "identite inconnue";

    identity.appendChild(title);
    identity.appendChild(subtitle);

    const actions = document.createElement("div");
    actions.className = "account-user-actions";

    const badge = document.createElement("span");
    badge.className = "badge-chip";

    if (isParentAccount) {
      badge.textContent = "Parent";
      actions.appendChild(badge);
    } else if (linkedChild) {
      badge.textContent = `Enfant: ${getChildDisplayName(linkedChild)}`;
      actions.appendChild(badge);

      const unlinkButton = document.createElement("button");
      unlinkButton.type = "button";
      unlinkButton.className = "mini-btn";
      unlinkButton.textContent = "Retirer enfant";
      unlinkButton.dataset.action = "unlink-child";
      unlinkButton.dataset.accountId = accountId;
      unlinkButton.dataset.userId = String(userRecord.id || "").trim();
      actions.appendChild(unlinkButton);
    } else if (existingChildByName) {
      badge.textContent = `Profil enfant: ${getChildDisplayName(existingChildByName)}`;
      actions.appendChild(badge);

      const button = document.createElement("button");
      button.type = "button";
      button.className = "mini-btn";
      button.textContent = "Lier ce compte";
      button.dataset.action = "define-child";
      button.dataset.accountId = accountId;
      button.dataset.userId = String(userRecord.id || "").trim();
      button.dataset.childId = existingChildByName.id;
      button.dataset.accountName = existingChildByName.name || userRecord.displayName || "";
      button.dataset.accountEmail = userRecord.email || "";
      actions.appendChild(button);
    } else {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "mini-btn";
      button.textContent = "Definir enfant";
      button.dataset.action = "define-child";
      button.dataset.accountId = accountId;
      button.dataset.accountName = userRecord.displayName || "";
      button.dataset.accountEmail = userRecord.email || "";
      button.dataset.userId = String(userRecord.id || "").trim();
      actions.appendChild(button);
    }

    if (!isParentAccount) {
      const userId = String(userRecord.id || "").trim();
      if (userId) {
        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.className = "mini-btn danger";
        deleteButton.textContent = "Supprimer compte";
        deleteButton.dataset.action = "delete-account";
        deleteButton.dataset.userId = userId;
        deleteButton.dataset.accountId = accountId;
        actions.appendChild(deleteButton);
      }
    }

    row.appendChild(identity);
    row.appendChild(actions);
    el.accountUsersList.appendChild(row);
  });

  renderAdminOverview();
}

async function handleAccountUsersClick(event) {
  if (!state.family || !state.isParentMode) {
    return;
  }

  const button = event.target.closest("button[data-action]");
  if (!button) {
    return;
  }

  const action = String(button.dataset.action || "").trim();
  const accountId = String(button.dataset.accountId || "").trim();
  const userId = String(button.dataset.userId || "").trim();
  const isParentAccount = String(state.family.parent && state.family.parent.accountId ? state.family.parent.accountId : "").trim() === accountId;

  if (!action) {
    return;
  }

  if (action === "unlink-child") {
    if (!accountId) {
      showAdminMessage("Compte introuvable pour retirer le lien enfant.");
      return;
    }

    const linkedChild = state.family.children.find((child) => String(child.accountId || "").trim() === accountId) || null;
    if (!linkedChild) {
      showAdminMessage("Aucun profil enfant lie a ce compte.");
      return;
    }

    linkedChild.accountId = "";
    saveFamily();
    renderFamilyUI();
    renderProgressPanel();
    showAdminMessage(`Lien retire pour ${getChildDisplayName(linkedChild)}.`);
    return;
  }

  if (action === "delete-account") {
    if (!userId) {
      showAdminMessage("Impossible de supprimer ce compte (identifiant manquant).");
      return;
    }

    if (isParentAccount) {
      showAdminMessage("Le compte parent principal ne peut pas etre supprime.");
      return;
    }

    const confirmed = window.confirm("Supprimer ce compte de la liste des utilisateurs connus ?");
    if (!confirmed) {
      return;
    }

    button.disabled = true;
    const result = await removeKnownUserRecord(userId);
    button.disabled = false;

    if (!result.ok) {
      showAdminMessage("Suppression impossible pour le moment.");
      return;
    }

    renderFamilyUI();
    renderProgressPanel();

    if (result.unlinkedChildren > 0) {
      showAdminMessage(`Compte supprime. ${result.unlinkedChildren} lien(s) enfant retire(s).`);
    } else {
      showAdminMessage("Compte supprime de la liste.");
    }
    return;
  }

  if (action !== "define-child") {
    return;
  }

  if (!accountId) {
    showAdminMessage("Ce compte ne contient pas d'identifiant exploitable.");
    return;
  }

  if (isParentAccount) {
    showAdminMessage("Le compte parent ne peut pas etre marque comme enfant.");
    return;
  }

  if (state.family.children.some((child) => String(child.accountId || "").trim() === accountId)) {
    showAdminMessage("Ce compte est deja lie a un profil enfant. Utilise 'Retirer enfant' pour le delier.");
    return;
  }

  const targetChildId = String(button.dataset.childId || "").trim();
  if (targetChildId) {
    const existingChild = state.family.children.find((child) => child.id === targetChildId) || null;
    if (!existingChild) {
      showAdminMessage("Profil enfant cible introuvable.");
      return;
    }

    existingChild.accountId = accountId;
    saveFamily();
    saveProgress();
    renderFamilyUI();
    renderProgressPanel();
    showAdminMessage(`Compte lie a ${getChildDisplayName(existingChild)}.`);
    return;
  }

  const suggestedName = String(button.dataset.accountName || button.dataset.accountEmail || "Enfant").trim();
  const enteredName = String(window.prompt("Nom du profil enfant:", suggestedName) || "").trim();
  if (enteredName.length < 2) {
    showAdminMessage("Nom enfant trop court.");
    return;
  }

  const pin = cleanPin(window.prompt(`PIN de ${enteredName} (4 chiffres min):`));
  if (pin.length < 4) {
    showAdminMessage("PIN enfant trop court (4 chiffres min).");
    return;
  }

  const existingChild = findChildByName(enteredName);
  if (existingChild) {
    const existingAccountId = String(existingChild.accountId || "").trim();
    if (existingAccountId && existingAccountId !== accountId) {
      showAdminMessage(`Le profil ${getChildDisplayName(existingChild)} est deja lie a un autre compte.`);
      return;
    }

    existingChild.accountId = accountId;
    existingChild.pin = pin || existingChild.pin;
    saveFamily();
    saveProgress();
    renderFamilyUI();
    renderProgressPanel();
    showAdminMessage(`Compte rattache au profil existant: ${getChildDisplayName(existingChild)}.`);
    return;
  }

  const child = {
    id: makeChildId(),
    name: enteredName,
    pin,
    accountId,
    createdAt: Date.now()
  };

  state.family.children.push(child);
  state.progressStore = state.progressStore || { schema: 2, activeChildId: state.activeChildId, byChild: {} };
  state.progressStore.byChild[child.id] = defaultProgress();
  saveFamily();
  saveProgress();
  renderFamilyUI();
  renderProgressPanel();
  showAdminMessage(`Compte lie comme enfant: ${getChildDisplayName(child)}.`);
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
  const hasPinValidation = Number(state.family.settings.parentPinValidatedAt || 0) > 0;
  state.isParentMode = unlocked && hasPinValidation && isConnectedParent();
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
      if (isSelfSelection(state.activeChildId)) {
        loadProgress();
      }
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
  return {
    parent: {
      name: "Parent Admin",
      pin: "1234",
      accountId: ""
    },
    settings: {
      parentUnlocked: false,
      parentPinValidatedAt: 0,
      hideParentAccess: false
    },
    children: [],
    activeChildId: SELF_SELECTION_ID
  };
}

function isLegacyPlaceholderChild(child) {
  if (!child || typeof child !== "object") {
    return false;
  }

  const childId = String(child.id || "").trim();
  const childName = String(child.name || "").trim().toLowerCase();
  const childPin = cleanPin(child.pin);
  return childId === "child-1" && childName === "enfant" && childPin === "1111";
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
  const activeId = String(state.activeChildId || "").trim();
  return state.family.children.find((child) => String(child.id || "").trim() === activeId) || null;
}

function normalizeChildName(name) {
  return String(name || "").trim().toLowerCase();
}

function findChildByName(name) {
  if (!state.family || !Array.isArray(state.family.children)) {
    return null;
  }

  const normalizedName = normalizeChildName(name);
  if (!normalizedName) {
    return null;
  }

  return state.family.children.find((child) => normalizeChildName(child.name) === normalizedName) || null;
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
    parentPinValidatedAt: Number(input.settings && input.settings.parentPinValidatedAt) || 0,
    hideParentAccess: Boolean(input.settings && input.settings.hideParentAccess)
  };

  let children = Array.isArray(input.children)
    ? input.children
        .filter((child) => child && typeof child.name === "string")
        .map((child, index) => ({
          id: String(child.id || `child-${index + 1}`).trim(),
          name: child.name.trim() || `Enfant ${index + 1}`,
          pin: cleanPin(child.pin) || "0000",
          accountId: String(child.accountId || "").trim(),
          createdAt: Number(child.createdAt) || Date.now()
        }))
    : [];

  if (children.length === 1 && isLegacyPlaceholderChild(children[0])) {
    children = [];
  }

  const mergedByName = new Map();

  children.forEach((child) => {
    const normalizedName = normalizeChildName(child.name);
    if (!normalizedName) {
      return;
    }

    const existing = mergedByName.get(normalizedName);
    if (!existing) {
      mergedByName.set(normalizedName, { ...child });
      return;
    }

    const preferred = String(existing.accountId || "").trim()
      ? existing
      : String(child.accountId || "").trim()
        ? child
        : Number(existing.createdAt || 0) >= Number(child.createdAt || 0)
          ? existing
          : child;

    mergedByName.set(normalizedName, {
      ...existing,
      ...preferred,
      id: String(existing.id || child.id || "").trim() || makeChildId(),
      name: existing.name || child.name,
      pin: cleanPin(existing.pin) || cleanPin(child.pin) || "0000",
      accountId: String(existing.accountId || child.accountId || "").trim(),
      createdAt: Number(existing.createdAt || child.createdAt) || Date.now()
    });
  });

  children = Array.from(mergedByName.values());

  const requestedSelectionId = String(input.activeChildId || "").trim();
  const activeChildId = isSelfSelection(requestedSelectionId)
    ? SELF_SELECTION_ID
    : children.some((child) => child.id === requestedSelectionId)
      ? requestedSelectionId
      : children.length
        ? children[0].id
        : SELF_SELECTION_ID;

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

  if (isKnownChildId(state.activeChildId)) {
    state.family.activeChildId = state.activeChildId;
  }
  localStorage.setItem(FAMILY_KEY, JSON.stringify(state.family));
  scheduleServerPersist();
}

function loadFamily() {
  try {
    const raw = localStorage.getItem(FAMILY_KEY);
    if (!raw) {
      state.family = defaultFamily();
      state.activeChildId = normalizeSelectionId(state.family.activeChildId);
      saveFamily();
      return;
    }

    state.family = ensureFamilyShape(JSON.parse(raw));
    state.activeChildId = normalizeSelectionId(state.family.activeChildId);
  } catch (_error) {
    state.family = defaultFamily();
    state.activeChildId = normalizeSelectionId(state.family.activeChildId);
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
        const persistedSelection = payload.progressStore && payload.progressStore.activeChildId
          ? payload.progressStore.activeChildId
          : state.family.activeChildId;
        state.activeChildId = normalizeSelectionId(persistedSelection);
        state.progressStore = normalizeProgressStore(payload.progressStore, state.activeChildId);

        const activeProgressKey = getActiveProgressKey();
        if (activeProgressKey && !state.progressStore.byChild[activeProgressKey]) {
          state.progressStore.byChild[activeProgressKey] = defaultProgress();
        }

        state.progress = getProgressSnapshotForChild(activeProgressKey);
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
        const persistedSelection = payload.progressStore && payload.progressStore.activeChildId
          ? payload.progressStore.activeChildId
          : state.family.activeChildId;
        state.activeChildId = normalizeSelectionId(persistedSelection);
        state.progressStore = normalizeProgressStore(payload.progressStore, state.activeChildId);
        const activeProgressKey = getActiveProgressKey();
        if (activeProgressKey && !state.progressStore.byChild[activeProgressKey]) {
          state.progressStore.byChild[activeProgressKey] = defaultProgress();
        }
        state.progress = getProgressSnapshotForChild(activeProgressKey);
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
  const snapshot = !state.progressStore || !state.progressStore.byChild
    ? defaultProgress()
    : {
    ...defaultProgress(),
    ...(state.progressStore.byChild[childId] || {})
  };

  snapshot.collection = sanitizeCollection(snapshot);
  repairLegacyOverUnlockedCollection(snapshot);
  return snapshot;
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

function renderAdminOverview() {
  if (!state.family) {
    return;
  }

  const children = Array.isArray(state.family.children) ? state.family.children : [];
  const childCount = children.length;

  const knownUsers = Array.isArray(state.knownUsers) ? state.knownUsers : [];
  const knownAccountIds = new Set(
    knownUsers
      .map((entry) => getAccountIdFromUserRecord(entry))
      .filter((accountId) => Boolean(accountId))
  );

  const childLinkedIds = new Set(
    children
      .map((child) => String(child.accountId || "").trim())
      .filter((accountId) => Boolean(accountId))
  );

  const linkedCount = [...knownAccountIds].filter((accountId) => childLinkedIds.has(accountId)).length;
  const hideParentAccess = Boolean(state.family.settings && state.family.settings.hideParentAccess);

  if (el.adminChildCount) {
    el.adminChildCount.textContent = String(childCount);
  }

  if (el.adminKnownUsersCount) {
    el.adminKnownUsersCount.textContent = String(knownAccountIds.size || knownUsers.length);
  }

  if (el.adminLinkedUsersCount) {
    el.adminLinkedUsersCount.textContent = String(linkedCount);
  }

  if (el.adminAccessState) {
    el.adminAccessState.textContent = hideParentAccess ? "Verrouille" : "Visible";
    el.adminAccessState.classList.toggle("is-locked", hideParentAccess);
  }

  if (el.adminActiveProfileLine) {
    el.adminActiveProfileLine.textContent = `Profil actif: ${getSelectionDisplayName()}`;
  }
}

function renderAdminBrainrotCatalog() {
  if (!el.adminBrainrotGrid) {
    return;
  }

  el.adminBrainrotGrid.innerHTML = "";

  const rarityCounts = { Common: 0, Rare: 0, Epic: 0 };
  CARD_DEFS.forEach((card) => {
    rarityCounts[card.rarity] = Number(rarityCounts[card.rarity] || 0) + 1;

    const item = document.createElement("article");
    item.className = `brainrot-item brainrot-clickable ${rarityClass(card)}`;
    item.dataset.cardId = card.id;
    item.style.setProperty("--brainrot-hue", cardTone(card));
    item.style.setProperty("--brainrot-accent", cardAccent(card));

    const stage = makeVisualStage(card);

    const title = document.createElement("strong");
    title.textContent = card.name;

    const rarity = document.createElement("span");
    rarity.className = `rarity-chip rarity-${card.rarity.toLowerCase()}`;
    rarity.textContent = card.rarity;

    const family = document.createElement("p");
    family.className = "collect-meta";
    family.textContent = card.family || "Brainrot";

    item.appendChild(stage);
    item.appendChild(title);
    item.appendChild(rarity);
    item.appendChild(family);
    el.adminBrainrotGrid.appendChild(item);
  });

  if (el.brainrotCountLine) {
    el.brainrotCountLine.textContent =
      `Brainrot disponibles: ${CARD_DEFS.length} · Common ${rarityCounts.Common} · Rare ${rarityCounts.Rare} · Epic ${rarityCounts.Epic}`;
  }
}

function setAdminTab(tabName) {
  state.adminTab = tabName === "brainrot" ? "brainrot" : "children";

  if (el.adminChildrenTab) {
    const active = state.adminTab === "children";
    el.adminChildrenTab.classList.toggle("is-active", active);
    el.adminChildrenTab.setAttribute("aria-selected", active ? "true" : "false");
  }

  if (el.adminBrainrotTab) {
    const active = state.adminTab === "brainrot";
    el.adminBrainrotTab.classList.toggle("is-active", active);
    el.adminBrainrotTab.setAttribute("aria-selected", active ? "true" : "false");
  }

  if (el.adminChildrenPanel) {
    el.adminChildrenPanel.hidden = state.adminTab !== "children";
  }

  if (el.adminBrainrotPanel) {
    el.adminBrainrotPanel.hidden = state.adminTab !== "brainrot";
  }

  if (state.adminTab === "brainrot") {
    renderAdminBrainrotCatalog();
  }
}

function renderFamilyUI() {
  if (!state.family) {
    return;
  }

  const activeChild = getActiveChild();

  if (el.activeChildSelect) {
    el.activeChildSelect.innerHTML = "";

    const selfOption = document.createElement("option");
    selfOption.value = SELF_SELECTION_ID;
    selfOption.textContent = "Mon profil";
    if (isSelfSelection(state.activeChildId)) {
      selfOption.selected = true;
    }
    el.activeChildSelect.appendChild(selfOption);

    state.family.children.forEach((child) => {
      const option = document.createElement("option");
      option.value = String(child.id || "").trim();
      option.textContent = getChildDisplayName(child);
      if (String(child.id || "").trim() === String(state.activeChildId || "").trim()) {
        option.selected = true;
      }
      el.activeChildSelect.appendChild(option);
    });
  }

  if (el.familyStatusLine) {
    const modeLabel = state.isParentMode ? "parent/admin" : "enfant";
    const trackedLabel = isSelfSelection(state.activeChildId) ? "Profil suivi" : "Enfant suivi";
    el.familyStatusLine.textContent = `${trackedLabel}: ${getSelectionDisplayName()} · Mode ${modeLabel}`;
  }

  if (el.selectionFollowLine) {
    const selected = [...state.selected]
      .map((cat) => (CONJUGO_DATA.categories[cat] ? CONJUGO_DATA.categories[cat].label : cat))
      .join(", ");
    el.selectionFollowLine.textContent = `Selection suivie pour ${getSelectionDisplayName()}: ${selected || "aucune categorie"}`;
  }

  if (el.progressChildLine) {
    el.progressChildLine.textContent = `Profil: ${getSelectionDisplayName()}`;
  }

  const hideParentAccess = Boolean(state.family.settings && state.family.settings.hideParentAccess);
  if (el.parentAdminPanel) {
    el.parentAdminPanel.hidden = !state.isParentMode;
  }
  if (el.adminLockedNotice) {
    el.adminLockedNotice.hidden = state.isParentMode;
  }

  if (el.leaveParentModeBtn) {
    el.leaveParentModeBtn.hidden = !state.isParentMode;
  }

  if (el.parentModeBtn) {
    // Child-side lock hides parent access only for non-parent sessions.
    el.parentModeBtn.hidden = hideParentAccess && !state.isParentMode && !isConnectedParent();
    el.parentModeBtn.disabled = !state.isParentMode && !isConnectedParent();
  }

  if (el.openAdminBtn) {
    el.openAdminBtn.hidden = hideParentAccess && !state.isParentMode && !isConnectedParent();
    el.openAdminBtn.disabled = !state.isParentMode && !isConnectedParent();
  }

  if (el.openAdminFromProgressBtn) {
    el.openAdminFromProgressBtn.hidden = hideParentAccess && !state.isParentMode && !isConnectedParent();
    el.openAdminFromProgressBtn.disabled = !state.isParentMode && !isConnectedParent();
  }

  setAdminTab(state.adminTab);

  renderAdminOverview();
  renderAccountUsersList();
  renderChildrenOverview();
}

function switchActiveChild(nextChildId) {
  if (!state.family) {
    return;
  }

  if (!isSelfSelection(nextChildId) && !isKnownChildId(nextChildId)) {
    return;
  }

  state.activeChildId = isSelfSelection(nextChildId) ? SELF_SELECTION_ID : nextChildId;
  if (isKnownChildId(nextChildId)) {
    state.family.activeChildId = nextChildId;
  }
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
  const fallbackSelection = state.activeChildId || (state.family && state.family.activeChildId) || "";
  const activeSelectionId = normalizeSelectionId(fallbackSelection);
  state.activeChildId = activeSelectionId;

  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (!raw) {
      const activeProgressKey = getActiveProgressKey();
      state.progressStore = {
        schema: 2,
        activeChildId: activeSelectionId,
        byChild: activeProgressKey ? { [activeProgressKey]: defaultProgress() } : {}
      };
      state.progress = getProgressSnapshotForChild(activeProgressKey);
      saveProgress();
      return;
    }

    const parsed = JSON.parse(raw);

    if (parsed && typeof parsed === "object" && parsed.schema === 2 && parsed.byChild) {
      // Keep the user's current profile choice as source of truth when switching profiles.
      const storedSelection = normalizeSelectionId(activeSelectionId || parsed.activeChildId);
      state.activeChildId = storedSelection;
      state.progressStore = {
        schema: 2,
        activeChildId: storedSelection,
        byChild: { ...parsed.byChild }
      };
    } else {
      // Legacy migration: old payload stored one single progress object.
      const legacyProgress = { ...defaultProgress(), ...(parsed || {}) };
      const activeProgressKey = getActiveProgressKey();
      state.progressStore = {
        schema: 2,
        activeChildId: activeSelectionId,
        byChild: activeProgressKey ? { [activeProgressKey]: legacyProgress } : {}
      };
    }

    const activeProgressKey = getActiveProgressKey();
    if (activeProgressKey && !state.progressStore.byChild[activeProgressKey]) {
      state.progressStore.byChild[activeProgressKey] = defaultProgress();
    }

    state.progress = getProgressSnapshotForChild(activeProgressKey);
    saveProgress();
  } catch (_error) {
    const activeProgressKey = getActiveProgressKey();
    state.progressStore = {
      schema: 2,
      activeChildId: activeSelectionId,
      byChild: activeProgressKey ? { [activeProgressKey]: defaultProgress() } : {}
    };
    state.progress = getProgressSnapshotForChild(activeProgressKey);
    saveProgress();
  }
}

function saveProgress() {
  if (!state.progressStore) {
    return;
  }

  const activeSelectionId = normalizeSelectionId(state.activeChildId);
  state.activeChildId = activeSelectionId;
  const activeProgressKey = getActiveProgressKey();
  if (!activeProgressKey) {
    return;
  }

  state.progressStore.schema = 2;
  state.progressStore.activeChildId = activeSelectionId;
  state.progressStore.byChild = state.progressStore.byChild || {};
  state.progressStore.byChild[activeProgressKey] = {
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
    el.progressChildLine.textContent = `Profil: ${isSelfSelection(state.activeChildId) ? "Mon profil" : getChildDisplayName(activeChild)}`;
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

  if (el.unlockProgressLine) {
    const unlockedCount = getUnlockedCount(state.progress);
    const xpTarget = getStickerUnlockTarget(state.progress);
    if (unlockedCount >= CARD_DEFS.length) {
      el.unlockProgressLine.textContent = `Stickers debloques: ${unlockedCount} / ${CARD_DEFS.length} · Collection complete`;
    } else {
      const nextXpStep = (xpTarget + 1) * STICKER_UNLOCK_XP_STEP;
      el.unlockProgressLine.textContent =
        `Stickers debloques: ${unlockedCount} / ${CARD_DEFS.length} · Palier XP: ${xpTarget} (1 sticker / ${STICKER_UNLOCK_XP_STEP} xp, prochain a ${nextXpStep} xp)`;
    }
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
    const unlockedCards = CARD_DEFS.filter((card) => Number(state.progress.collection[card.id] || 0) > 0);

    if (!unlockedCards.length) {
      const empty = document.createElement("p");
      empty.className = "hint";
      empty.textContent = "Aucun sticker gagne pour l'instant. Lance une session pour debloquer rapidement.";
      el.collectionGrid.appendChild(empty);
      return;
    }

    unlockedCards.forEach((card) => {
      const count = Number(state.progress.collection[card.id] || 0);
      const article = document.createElement("article");
      article.className = `collect-card unlocked brainrot-clickable ${rarityClass(card)}`;
      article.dataset.cardId = card.id;
      article.style.setProperty("--brainrot-hue", cardTone(card));
      article.style.setProperty("--brainrot-accent", cardAccent(card));

      const stage = makeVisualStage(card);

      const title = document.createElement("p");
      title.className = "collect-title";
      title.textContent = card.name;

      const meta = document.createElement("p");
      meta.className = "collect-meta";
      meta.textContent = `${card.rarity} · x${count}`;

      article.appendChild(stage);
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

  if (state.score >= SESSION_SUCCESS_SCORE) {
    progress.currentStreak += 1;
  } else {
    progress.currentStreak = 0;
  }
  progress.maxStreak = Math.max(progress.maxStreak, progress.currentStreak);

  const earnedCoins = state.score + (state.score === SESSION_SIZE ? 4 : 0);
  progress.coins += earnedCoins;
  const earnedXp = state.score * 10 + (state.score === SESSION_SIZE ? 20 : 0) + (state.score >= SESSION_SUCCESS_SCORE ? 10 : 0);
  progress.xp += earnedXp;

  const unlockedCards = unlockCardsForProgress(progress);
  let drawnCard = unlockedCards.length ? unlockedCards[unlockedCards.length - 1] : null;
  let wasNewCard = false;

  if (!drawnCard) {
    drawnCard = unlockSingleNewCard(state.score, progress);
  }

  if (drawnCard) {
    wasNewCard = true;
  } else {
    drawnCard = drawRewardCard(state.score, progress);
    const previousCount = Number(progress.collection[drawnCard.id] || 0);
    progress.collection[drawnCard.id] = previousCount + 1;
    wasNewCard = previousCount === 0;
  }

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

function drawRewardCard(score, progress) {
  const unlockedCards = CARD_DEFS.filter((card) => Number(progress && progress.collection ? progress.collection[card.id] || 0 : 0) > 0);
  const source = unlockedCards.length ? unlockedCards : CARD_DEFS;
  const weighted = [];

  source.forEach((card) => {
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
      cardEl.className = `pack-card ${rarityClass(card)} brainrot-clickable`;
      cardEl.dataset.cardId = card.id;
      cardEl.style.setProperty("--brainrot-hue", cardTone(card));
      cardEl.style.setProperty("--brainrot-accent", cardAccent(card));

      const stage = makeVisualStage(card, "large");

      const title = document.createElement("p");
      title.className = "pack-title";
      title.textContent = card.name;

      const meta = document.createElement("p");
      meta.className = "pack-meta";
      const fresh = state.sessionReward.wasNewCard ? "NOUVELLE" : "Doublon";
      meta.textContent = `${card.rarity} · ${fresh}`;

      cardEl.appendChild(stage);
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

function randomFromList(list) {
  if (!Array.isArray(list) || !list.length) {
    return "";
  }
  return list[Math.floor(Math.random() * list.length)] || "";
}

function buildFunnyQuestionPrompt(question) {
  const infinitive = String(question && question.verb ? question.verb : "").trim().toLowerCase();
  const templates = FUNNY_TEMPLATES_BY_VERB[infinitive] || FUNNY_FALLBACK_TEMPLATES;

  const template = randomFromList(templates);
  if (!template) {
    return `Complete: ${getPromptPronoun(question)} ___ (${question.verb})`;
  }

  const pronoun = getPromptPronoun(question);
  const pronounBlank = `${pronoun}${pronoun.endsWith("'") ? "" : " "}___`;
  return template.replace("{pronounBlank}", pronounBlank).replace("{verb}", question.verb);
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
    el.selectionFollowLine.textContent = `Selection suivie pour ${getSelectionDisplayName()}: ${labels.join(", ") || "aucune categorie"}`;
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
    options: buildMcqOptions(question, selectedCategories),
    responseMode: "mcq"
  }));
}

function getTypedQuestionCountForLevel(level) {
  if (level < 5) {
    return 0;
  }

  return Math.min(3, Math.max(1, level - 4));
}

function applyProgressiveDifficulty(questions, level) {
  if (!Array.isArray(questions) || !questions.length) {
    return questions;
  }

  const typedCount = Math.min(getTypedQuestionCountForLevel(level), questions.length);
  if (!typedCount) {
    return questions;
  }

  const indices = shuffle(questions.map((_question, index) => index)).slice(0, typedCount);
  indices.forEach((index) => {
    questions[index].responseMode = "typed";
  });

  return questions;
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
  el.questionExplain.textContent = buildFunnyQuestionPrompt(question);

  el.feedback.hidden = true;
  el.feedbackText.textContent = "";
  el.optionsWrap.innerHTML = "";

  const isTypedQuestion = question.responseMode === "typed";
  if (el.sessionModeHint) {
    el.sessionModeHint.textContent = isTypedQuestion ? "Ecris la bonne forme." : "Choisis le bon mot.";
  }
  const typedTotal = state.questions.filter((entry) => entry.responseMode === "typed").length;
  const typedDone = state.questions
    .slice(0, state.currentIndex + 1)
    .filter((entry) => entry.responseMode === "typed").length;

  if (typedTotal > 0) {
    const typedLabel = isTypedQuestion
      ? ` · Saisie ${typedDone}/${typedTotal}`
      : ` · Saisie libre: ${typedTotal}`;
    el.counter.textContent = `Question ${state.currentIndex + 1}/${SESSION_SIZE}${typedLabel}`;
  }

  if (isTypedQuestion) {
    const box = document.createElement("div");
    box.className = "typed-answer-box";

    const input = document.createElement("input");
    input.type = "text";
    input.className = "typed-answer-input";
    input.placeholder = "Ecris la bonne forme";
    input.autocomplete = "off";
    input.spellcheck = false;

    const submit = document.createElement("button");
    submit.type = "button";
    submit.className = "cta small typed-answer-submit";
    submit.textContent = "Valider";
    submit.addEventListener("click", () => validateTypedAnswer(input));

    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        validateTypedAnswer(input);
      }
    });

    box.appendChild(input);
    box.appendChild(submit);
    el.optionsWrap.appendChild(box);
    input.focus();
    return;
  }

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

function normalizeComparableForm(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[’`]/g, "'")
    .replace(/\s+/g, " ")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function extractTypedVerbForm(inputValue, question) {
  const normalized = normalizeComparableForm(inputValue);
  if (!normalized) {
    return "";
  }

  const promptPronoun = normalizeComparableForm(getPromptPronoun(question));
  const pronounLabel = normalizeComparableForm(question.pronounLabel);

  if (promptPronoun === "j'" && normalized.startsWith("j'")) {
    return normalized.slice(2).trim();
  }

  if (promptPronoun && normalized.startsWith(`${promptPronoun} `)) {
    return normalized.slice(promptPronoun.length + 1).trim();
  }

  if (pronounLabel && normalized.startsWith(`${pronounLabel} `)) {
    return normalized.slice(pronounLabel.length + 1).trim();
  }

  return normalized;
}

function validateTypedAnswer(inputEl) {
  if (state.answered) {
    return;
  }

  const question = state.questions[state.currentIndex];
  const selectedText = String(inputEl && inputEl.value ? inputEl.value : "").trim();
  if (!selectedText) {
    return;
  }

  state.answered = true;
  const expectedForm = normalizeComparableForm(extractVerbForm(question.answer));
  const typedForm = extractTypedVerbForm(selectedText, question);
  const ok = typedForm === expectedForm;

  const typedInput = el.optionsWrap.querySelector(".typed-answer-input");
  const typedButton = el.optionsWrap.querySelector(".typed-answer-submit");
  if (typedInput) {
    typedInput.disabled = true;
    typedInput.classList.toggle("is-correct", ok);
    typedInput.classList.toggle("is-wrong", !ok);
  }
  if (typedButton) {
    typedButton.disabled = true;
  }

  const canonicalForm = extractVerbForm(question.answer);
  if (ok) {
    state.score += 1;
    el.feedbackText.textContent = `Super! ${formatFullAnswer(question, canonicalForm)}. ${randomFromList(FUNNY_SUCCESS_LINES)}`;
    triggerRewardAnimation();
  } else {
    state.errors.push({
      verb: question.verb,
      pronoun: question.pronounLabel,
      expected: formatFullAnswer(question, canonicalForm),
      selected: selectedText
    });
    el.feedbackText.textContent = `Presque! La bonne phrase: ${formatFullAnswer(question, canonicalForm)}. ${randomFromList(FUNNY_RETRY_LINES)}`;
  }

  el.feedback.hidden = false;
  el.nextBtn.focus();
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
    el.feedbackText.textContent = `Super! ${formatFullAnswer(question, correctForm)}. ${randomFromList(FUNNY_SUCCESS_LINES)}`;
    triggerRewardAnimation();
  } else {
    state.errors.push({
      verb: question.verb,
      pronoun: question.pronounLabel,
      expected: formatFullAnswer(question, correctForm),
      selected: selectedText
    });
    el.feedbackText.textContent = `Presque! La bonne phrase: ${formatFullAnswer(question, correctForm)}. ${randomFromList(FUNNY_RETRY_LINES)}`;
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
  if (score < SESSION_SUCCESS_SCORE) {
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

function navigateToAdmin() {
  showView("admin");
  renderFamilyUI();
  if (!state.isParentMode) {
    showAdminMessage("Active le mode parent/admin depuis la page d'entrainement pour gerer les comptes.");
  }
}

function showResults() {
  applySessionRewards();
  showView("result");
  el.scoreLine.textContent = `Score: ${state.score}/${SESSION_SIZE}`;
  const faults = SESSION_SIZE - state.score;
  const successLine = state.score >= SESSION_SUCCESS_SCORE
    ? `Questionnaire reussi (${SESSION_SUCCESS_SCORE}/10 ou plus, max ${SESSION_SIZE - SESSION_SUCCESS_SCORE} faute(s)).`
    : `Questionnaire non valide (${faults} faute(s)). Objectif: au moins ${SESSION_SUCCESS_SCORE}/10.`;
  el.resultMessage.textContent = `${scoreMessage(state.score)} ${successLine}`;
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
  const currentLevel = getProgressLevel(state.progress || defaultProgress()).level;
  applyProgressiveDifficulty(state.questions, currentLevel);
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

  const hasPinValidation = Number(state.family.settings && state.family.settings.parentPinValidatedAt) > 0;
  if (state.family.settings && state.family.settings.parentUnlocked && hasPinValidation) {
    state.isParentMode = true;
    showAdminMessage("Mode parent/admin actif (code deja valide sur cet appareil).");
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
  state.family.settings.parentPinValidatedAt = Date.now();
  state.isParentMode = true;
  showAdminMessage("Mode parent/admin active (code valide).");
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

  if (isSelfSelection(targetChildId)) {
    switchActiveChild(SELF_SELECTION_ID);
    showAdminMessage("Profil actif: Mon profil.");
    return;
  }

  const normalizedTargetChildId = String(targetChildId || "").trim();
  const targetChild = state.family.children.find((child) => String(child.id || "").trim() === normalizedTargetChildId);
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

  if (findChildByName(name)) {
    showAdminMessage("Un profil enfant avec ce nom existe deja.");
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

function handleAdminChildrenTab() {
  setAdminTab("children");
}

function handleAdminBrainrotTab() {
  setAdminTab("brainrot");
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
  if (el.accountUsersList) {
    el.accountUsersList.addEventListener("click", handleAccountUsersClick);
  }
  if (el.adminChildrenTab) {
    el.adminChildrenTab.addEventListener("click", handleAdminChildrenTab);
  }
  if (el.adminBrainrotTab) {
    el.adminBrainrotTab.addEventListener("click", handleAdminBrainrotTab);
  }
  if (el.collectionGrid) {
    el.collectionGrid.addEventListener("click", handleBrainrotClick);
  }
  if (el.adminBrainrotGrid) {
    el.adminBrainrotGrid.addEventListener("click", handleBrainrotClick);
  }
  if (el.rewardCard) {
    el.rewardCard.addEventListener("click", handleBrainrotClick);
  }
  if (el.brainrotModalClose) {
    el.brainrotModalClose.addEventListener("click", closeBrainrotModal);
  }
  if (el.brainrotModalSaveBtn) {
    el.brainrotModalSaveBtn.addEventListener("click", handleSaveBrainrotImage);
  }
  if (el.brainrotModalBackdrop) {
    el.brainrotModalBackdrop.addEventListener("click", closeBrainrotModal);
  }
  el.startBtn.addEventListener("click", startSession);
  el.progressBtn.addEventListener("click", navigateToProgress);
  if (el.openAdminBtn) {
    el.openAdminBtn.addEventListener("click", navigateToAdmin);
  }
  if (el.openAdminFromProgressBtn) {
    el.openAdminFromProgressBtn.addEventListener("click", navigateToAdmin);
  }
  el.backTrainingBtn.addEventListener("click", backToTraining);
  if (el.backTrainingFromAdminBtn) {
    el.backTrainingFromAdminBtn.addEventListener("click", backToTraining);
  }
  if (el.backProgressFromAdminBtn) {
    el.backProgressFromAdminBtn.addEventListener("click", navigateToProgress);
  }
  el.openProgressFromResultBtn.addEventListener("click", navigateToProgress);
  el.nextBtn.addEventListener("click", nextQuestion);
  el.replayBtn.addEventListener("click", startSession);
  el.backConfigBtn.addEventListener("click", backToConfig);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && el.brainrotModal && !el.brainrotModal.hidden) {
      closeBrainrotModal();
      return;
    }
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
  state.activeChildId = normalizeSelectionId(state.activeChildId || (state.family && state.family.activeChildId) || "");
  loadProgress();
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
