const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

const PORT = Number(process.env.PORT || 3077);
const PUBLIC_DIR = __dirname;
const USER_DB_FILE = process.env.USER_DB_FILE || path.join(__dirname, "data", "users.json");
const FAMILY_DB_FILE = process.env.FAMILY_DB_FILE || path.join(__dirname, "data", "family-state.json");
const SSO_SUB_HEADER = (process.env.SSO_SUB_HEADER || "x-pangolin-sub").toLowerCase();
const SSO_EMAIL_HEADER = (process.env.SSO_EMAIL_HEADER || "x-pangolin-email").toLowerCase();
const SSO_NAME_HEADER = (process.env.SSO_NAME_HEADER || "x-pangolin-name").toLowerCase();
const TRUST_PROXY_HEADER = (process.env.TRUST_PROXY_HEADER || "x-pangolin-trusted").toLowerCase();
const TRUST_PROXY_SECRET = process.env.TRUST_PROXY_SECRET || "";

const SUB_HEADER_CANDIDATES = [
  SSO_SUB_HEADER,
  "x-forwarded-user",
  "x-auth-request-user",
  "x-user",
  "remote-user"
];

const EMAIL_HEADER_CANDIDATES = [
  SSO_EMAIL_HEADER,
  "x-forwarded-email",
  "x-auth-request-email",
  "x-email",
  "remote-email",
  "x-ms-client-principal-name"
];

const NAME_HEADER_CANDIDATES = [
  SSO_NAME_HEADER,
  "x-forwarded-name",
  "x-auth-request-name",
  "x-name",
  "remote-name",
  "x-forwarded-preferred-username",
  "x-ms-client-principal-name"
];

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".ico": "image/x-icon"
};

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  });
  response.end(JSON.stringify(payload));
}

function safeReadJson(filePath) {
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(raw);
  } catch (_error) {
    return { users: [] };
  }
}

function safeReadJsonWithDefault(filePath, defaultValue) {
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(raw);
  } catch (_error) {
    return defaultValue;
  }
}

function safeWriteJson(filePath, payload) {
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(payload, null, 2), "utf-8");
}

function readRequestBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";

    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1024 * 1024) {
        reject(new Error("payload_too_large"));
      }
    });

    request.on("end", () => resolve(body));
    request.on("error", reject);
  });
}

function defaultFamilyState() {
  const childId = "child-1";
  return {
    family: {
      parent: { name: "Parent Admin", pin: "1234", accountId: "" },
      settings: { parentUnlocked: false, hideParentAccess: false },
      children: [{ id: childId, name: "Enfant", pin: "1111", createdAt: Date.now() }],
      activeChildId: childId
    },
    progressStore: {
      schema: 2,
      activeChildId: childId,
      byChild: {
        [childId]: {
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
        }
      }
    }
  };
}

function readFamilyState() {
  return safeReadJsonWithDefault(FAMILY_DB_FILE, defaultFamilyState());
}

function writeFamilyState(payload) {
  safeWriteJson(FAMILY_DB_FILE, payload);
}

function normalizeEmail(value) {
  if (!value || typeof value !== "string") {
    return "";
  }
  return value.trim().toLowerCase();
}

function getCanonicalUserKey(user) {
  if (!user || typeof user !== "object") {
    return "";
  }

  const email = normalizeEmail(user.email);
  if (email) {
    return `email:${email}`;
  }

  const providerSubject = String(user.providerSubject || "").trim();
  if (providerSubject) {
    return `subject:${providerSubject}`;
  }

  const id = String(user.id || "").trim();
  return id ? `id:${id}` : "";
}

function dedupeKnownUsers(users) {
  const byKey = new Map();

  users.forEach((entry) => {
    if (!entry || typeof entry !== "object") {
      return;
    }

    const key = getCanonicalUserKey(entry);
    if (!key) {
      return;
    }

    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, { ...entry, email: normalizeEmail(entry.email) });
      return;
    }

    const existingLastSeen = String(existing.lastSeenAt || "");
    const nextLastSeen = String(entry.lastSeenAt || "");
    const preferred = nextLastSeen.localeCompare(existingLastSeen) > 0 ? entry : existing;
    const merged = {
      ...existing,
      ...preferred,
      id: existing.id || entry.id || "",
      email: normalizeEmail(existing.email || entry.email),
      providerSubject: existing.providerSubject || entry.providerSubject || "",
      displayName: preferred.displayName || existing.displayName || entry.displayName || "",
      createdAt: existing.createdAt || entry.createdAt || "",
      lastSeenAt: nextLastSeen.localeCompare(existingLastSeen) > 0 ? entry.lastSeenAt || existing.lastSeenAt || "" : existing.lastSeenAt || entry.lastSeenAt || "",
      source: existing.source || entry.source || ""
    };

    byKey.set(key, merged);
  });

  return Array.from(byKey.values());
}

function getHeader(request, name) {
  const value = request.headers[name];
  if (Array.isArray(value)) {
    return value[0];
  }
  return value || "";
}

function uniqueNames(names) {
  return [...new Set(names.map((name) => name.toLowerCase()))];
}

function readFirstHeader(request, candidates) {
  const names = uniqueNames(candidates);
  for (const name of names) {
    const value = getHeader(request, name).trim();
    if (value) {
      return { headerName: name, value };
    }
  }
  return { headerName: "", value: "" };
}

function ensureTrustedProxy(request) {
  if (!TRUST_PROXY_SECRET) {
    return true;
  }
  return getHeader(request, TRUST_PROXY_HEADER) === TRUST_PROXY_SECRET;
}

function upsertUserFromHeaders(request) {
  if (!ensureTrustedProxy(request)) {
    return { error: "forbidden", statusCode: 403 };
  }

  const subjectCandidate = readFirstHeader(request, SUB_HEADER_CANDIDATES);
  const emailCandidate = readFirstHeader(request, EMAIL_HEADER_CANDIDATES);
  const nameCandidate = readFirstHeader(request, NAME_HEADER_CANDIDATES);

  const providerSubject = subjectCandidate.value;
  const email = normalizeEmail(emailCandidate.value);
  const displayName = nameCandidate.value || email || providerSubject;

  if (!providerSubject && !email) {
    return { error: "missing_identity", statusCode: 401 };
  }

  const store = safeReadJson(USER_DB_FILE);
  if (!Array.isArray(store.users)) {
    store.users = [];
  }

  store.users = dedupeKnownUsers(store.users);

  const now = new Date().toISOString();
  let user = store.users.find((entry) => {
    if (email && entry.email === email) {
      return true;
    }
    if (providerSubject && entry.providerSubject === providerSubject) {
      return true;
    }
    return false;
  });

  if (!user) {
    user = {
      id: crypto.randomUUID(),
      email,
      providerSubject,
      displayName,
      createdAt: now,
      lastSeenAt: now,
      source: "pangolin-sso"
    };
    store.users.push(user);
  } else {
    user.email = email || user.email;
    user.providerSubject = providerSubject || user.providerSubject;
    user.displayName = displayName || user.displayName;
    user.lastSeenAt = now;
  }

  safeWriteJson(USER_DB_FILE, store);
  return {
    user,
    identitySource: {
      subHeader: subjectCandidate.headerName,
      emailHeader: emailCandidate.headerName,
      nameHeader: nameCandidate.headerName
    }
  };
}

function listKnownUsers() {
  const store = safeReadJson(USER_DB_FILE);
  const users = dedupeKnownUsers(Array.isArray(store.users) ? store.users : []);

  if (!Array.isArray(store.users) || store.users.length !== users.length) {
    store.users = users;
    safeWriteJson(USER_DB_FILE, store);
  }

  return users
    .map((entry) => ({
      id: entry.id || "",
      email: entry.email || "",
      providerSubject: entry.providerSubject || "",
      displayName: entry.displayName || "",
      lastSeenAt: entry.lastSeenAt || "",
      createdAt: entry.createdAt || ""
    }))
    .sort((a, b) => String(b.lastSeenAt || "").localeCompare(String(a.lastSeenAt || "")));
}

function getKnownUserAccountId(entry) {
  if (!entry || typeof entry !== "object") {
    return "";
  }

  const email = normalizeEmail(entry.email);
  if (email) {
    return email;
  }

  const providerSubject = String(entry.providerSubject || "").trim();
  if (providerSubject) {
    return providerSubject;
  }

  return String(entry.id || "").trim();
}

function deleteKnownUserById(userId) {
  const normalizedUserId = String(userId || "").trim();
  if (!normalizedUserId) {
    return { error: "missing_user_id", statusCode: 400 };
  }

  const userStore = safeReadJson(USER_DB_FILE);
  userStore.users = dedupeKnownUsers(Array.isArray(userStore.users) ? userStore.users : []);

  const userIndex = userStore.users.findIndex((entry) => String(entry.id || "").trim() === normalizedUserId);
  if (userIndex === -1) {
    return { error: "not_found", statusCode: 404 };
  }

  const removedUser = userStore.users[userIndex];
  userStore.users.splice(userIndex, 1);
  safeWriteJson(USER_DB_FILE, userStore);

  const removedAccountId = getKnownUserAccountId(removedUser);
  let unlinkedChildren = 0;

  if (removedAccountId) {
    const familyState = readFamilyState();
    const family = familyState && familyState.family ? familyState.family : null;
    if (family && Array.isArray(family.children)) {
      family.children.forEach((child) => {
        if (String(child.accountId || "").trim() === removedAccountId) {
          child.accountId = "";
          unlinkedChildren += 1;
        }
      });

      if (unlinkedChildren > 0) {
        writeFamilyState(familyState);
      }
    }
  }

  return {
    ok: true,
    removedUserId: normalizedUserId,
    removedAccountId,
    unlinkedChildren
  };
}

function pickRelevantHeaders(request) {
  const allowPattern = /(pangolin|auth|user|email|name|forwarded|remote|principal)/i;
  const result = {};

  Object.entries(request.headers).forEach(([name, value]) => {
    if (!allowPattern.test(name)) {
      return;
    }

    if (Array.isArray(value)) {
      result[name] = value[0] || "";
      return;
    }

    result[name] = value || "";
  });

  return result;
}

function serveStatic(request, response) {
  const requestPath = decodeURIComponent(new URL(request.url, `http://${request.headers.host}`).pathname);
  const rawPath = requestPath === "/" ? "/index.html" : requestPath;
  const safePath = path.normalize(rawPath).replace(/^([.][.][/\\])+/, "");
  const filePath = path.join(PUBLIC_DIR, safePath);

  if (!filePath.startsWith(PUBLIC_DIR)) {
    sendJson(response, 400, { error: "invalid_path" });
    return;
  }

  const extension = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[extension] || "application/octet-stream";

  fs.readFile(filePath, (readError, buffer) => {
    if (!readError) {
      response.writeHead(200, {
        "Content-Type": contentType,
        "Cache-Control": extension === ".js" || extension === ".css" || extension === ".html" ? "no-cache" : "public, max-age=3600"
      });
      response.end(buffer);
      return;
    }

    if (!extension) {
      const fallbackPath = path.join(PUBLIC_DIR, "index.html");
      fs.readFile(fallbackPath, (fallbackError, fallbackBuffer) => {
        if (fallbackError) {
          sendJson(response, 404, { error: "not_found" });
          return;
        }
        response.writeHead(200, {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "no-cache"
        });
        response.end(fallbackBuffer);
      });
      return;
    }

    sendJson(response, 404, { error: "not_found" });
  });
}

const server = http.createServer((request, response) => {
  if (!request.url) {
    sendJson(response, 400, { error: "missing_url" });
    return;
  }

  const pathname = new URL(request.url, `http://${request.headers.host}`).pathname;

  if (request.method === "GET" && pathname === "/api/health") {
    sendJson(response, 200, {
      ok: true,
      service: "conjugo",
      ssoHeaders: {
        sub: uniqueNames(SUB_HEADER_CANDIDATES),
        email: uniqueNames(EMAIL_HEADER_CANDIDATES),
        name: uniqueNames(NAME_HEADER_CANDIDATES)
      }
    });
    return;
  }

  if (request.method === "GET" && pathname === "/api/debug-identity") {
    if (!ensureTrustedProxy(request)) {
      sendJson(response, 403, { error: "forbidden" });
      return;
    }

    sendJson(response, 200, {
      relevantHeaders: pickRelevantHeaders(request),
      configuredHeaderPriority: {
        sub: uniqueNames(SUB_HEADER_CANDIDATES),
        email: uniqueNames(EMAIL_HEADER_CANDIDATES),
        name: uniqueNames(NAME_HEADER_CANDIDATES)
      }
    });
    return;
  }

  if (request.method === "GET" && pathname === "/api/me") {
    const result = upsertUserFromHeaders(request);
    if (result.error) {
      sendJson(response, result.statusCode, { error: result.error });
      return;
    }

    sendJson(response, 200, { user: result.user, identitySource: result.identitySource });
    return;
  }

  if (request.method === "GET" && pathname === "/api/users") {
    if (!ensureTrustedProxy(request)) {
      sendJson(response, 403, { error: "forbidden" });
      return;
    }

    sendJson(response, 200, { users: listKnownUsers() });
    return;
  }

  if (request.method === "DELETE" && pathname.startsWith("/api/users/")) {
    if (!ensureTrustedProxy(request)) {
      sendJson(response, 403, { error: "forbidden" });
      return;
    }

    const encodedUserId = pathname.slice("/api/users/".length);
    const userId = decodeURIComponent(encodedUserId || "");
    const result = deleteKnownUserById(userId);

    if (result.error) {
      sendJson(response, result.statusCode, { error: result.error });
      return;
    }

    sendJson(response, 200, result);
    return;
  }

  if (request.method === "GET" && pathname === "/api/family-state") {
    sendJson(response, 200, readFamilyState());
    return;
  }

  if (request.method === "POST" && pathname === "/api/family-state") {
    readRequestBody(request)
      .then((rawBody) => {
        let parsed = null;
        try {
          parsed = rawBody ? JSON.parse(rawBody) : null;
        } catch (_error) {
          sendJson(response, 400, { error: "invalid_json" });
          return;
        }

        if (!parsed || typeof parsed !== "object" || !parsed.family || !parsed.progressStore) {
          sendJson(response, 400, { error: "invalid_payload" });
          return;
        }

        writeFamilyState(parsed);
        sendJson(response, 200, { ok: true });
      })
      .catch((error) => {
        if (error && error.message === "payload_too_large") {
          sendJson(response, 413, { error: "payload_too_large" });
          return;
        }
        sendJson(response, 500, { error: "read_body_failed" });
      });
    return;
  }

  if (request.method !== "GET" && request.method !== "HEAD") {
    sendJson(response, 405, { error: "method_not_allowed" });
    return;
  }

  serveStatic(request, response);
});

server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Conjugo server listening on port ${PORT}`);
});
