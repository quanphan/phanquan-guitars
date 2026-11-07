import { isAdminRole } from "./adminAccess.js";

export const ADMIN_SESSION_KEY = "phanquan-guitars-admin-session";
// Access and refresh tokens stay in sessionStorage (tab-scoped), not localStorage.
// HttpOnly cookie auth was evaluated and deferred: it would require CSRF tokens,
// SameSite/cross-origin API changes, and a coordinated TimboWebApi cookie rollout
// that would break current login, refresh, admin, and authorizedRequest flows.
export const SESSION_MAX_AGE_MS = 24 * 60 * 60 * 1000;
export const SESSION_IDLE_MS = 30 * 60 * 1000;
export const SESSION_ACTIVITY_THROTTLE_MS = 5 * 1000;

function publicAddress(address) {
  if (!address || typeof address !== "object") return null;
  return {
    line1: typeof address.line1 === "string" ? address.line1 : null,
    line2: typeof address.line2 === "string" ? address.line2 : null,
    city: typeof address.city === "string" ? address.city : null,
    region: typeof address.region === "string" ? address.region : null,
    postalCode: typeof address.postalCode === "string" ? address.postalCode : null,
    country: typeof address.country === "string" ? address.country : null,
  };
}

export function publicUser(user) {
  if (!user || typeof user !== "object") return null;
  if (Object.prototype.hasOwnProperty.call(user, "password")) {
    // Drop secrets; keep the rest of the profile.
  }
  return {
    id: typeof user.id === "string" ? user.id : null,
    email: typeof user.email === "string" ? user.email : null,
    username: typeof user.username === "string" ? user.username : null,
    name: typeof user.name === "string" ? user.name : null,
    phone: typeof user.phone === "string" ? user.phone : null,
    country: typeof user.country === "string" ? user.country : null,
    shippingAddress: publicAddress(user.shippingAddress),
    marketingConsent: user.marketingConsent === true,
    emailVerified: user.emailVerified === true,
    status: user.status === "locked" ? "locked" : "active",
    role: typeof user.role === "string" ? user.role : null,
    permissions: Array.isArray(user.permissions)
      ? user.permissions.filter((item) => typeof item === "string")
      : [],
    createdAt: user.createdAt ?? null,
  };
}

export function parseAuthData(payload) {
  const data = payload?.data;
  if (!payload?.success || !data || typeof data !== "object") return null;
  if (typeof data.accessToken !== "string" || !data.accessToken) return null;
  if (typeof data.refreshToken !== "string" || !data.refreshToken) return null;
  const user = publicUser(data.user);
  if (!user?.id) return null;
  return {
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
    expiresIn: data.expiresIn ?? null,
    user,
  };
}

function asTimestamp(value) {
  const time = typeof value === "number" ? value : Number(value);
  return Number.isFinite(time) && time > 0 ? time : null;
}

export function stampSessionTimes(session, previous, now = Date.now()) {
  if (!session) return null;
  const issuedAt = asTimestamp(previous?.issuedAt) ?? asTimestamp(session.issuedAt) ?? now;
  return {
    ...session,
    issuedAt,
    lastActivityAt: now,
  };
}

export function touchSessionActivity(session, now = Date.now()) {
  if (!session) return null;
  const lastActivityAt = asTimestamp(session.lastActivityAt);
  if (lastActivityAt != null && now - lastActivityAt < SESSION_ACTIVITY_THROTTLE_MS) {
    return session;
  }
  return { ...session, lastActivityAt: now };
}

export function sessionIsExpired(session, now = Date.now()) {
  if (!session?.accessToken) return true;
  const issuedAt = asTimestamp(session.issuedAt);
  const lastActivityAt = asTimestamp(session.lastActivityAt);
  if (issuedAt == null || lastActivityAt == null) return true;
  if (now - issuedAt >= SESSION_MAX_AGE_MS) return true;
  if (now - lastActivityAt >= SESSION_IDLE_MS) return true;
  return false;
}

export function sessionIsAdmin(session) {
  return Boolean(session?.accessToken && isAdminRole(session.user?.role));
}

export function readAdminSession(storage = globalThis.sessionStorage) {
  try {
    const raw = storage?.getItem(ADMIN_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed.accessToken !== "string") return null;
    if (typeof parsed.refreshToken !== "string") return null;
    if (Object.prototype.hasOwnProperty.call(parsed, "password")) return null;
    const user = publicUser(parsed.user);
    if (!user?.id) return null;
    if (parsed.user && Object.prototype.hasOwnProperty.call(parsed.user, "password")) {
      return null;
    }
    return {
      accessToken: parsed.accessToken,
      refreshToken: parsed.refreshToken,
      expiresIn: parsed.expiresIn ?? null,
      issuedAt: asTimestamp(parsed.issuedAt),
      lastActivityAt: asTimestamp(parsed.lastActivityAt),
      user,
    };
  } catch {
    return null;
  }
}

export function writeAdminSession(session, storage = globalThis.sessionStorage) {
  if (!session?.accessToken || !session?.refreshToken || !session.user) return;
  try {
    storage?.setItem(
      ADMIN_SESSION_KEY,
      JSON.stringify({
        accessToken: session.accessToken,
        refreshToken: session.refreshToken,
        expiresIn: session.expiresIn ?? null,
        issuedAt: asTimestamp(session.issuedAt),
        lastActivityAt: asTimestamp(session.lastActivityAt),
        user: publicUser(session.user),
      }),
    );
  } catch {
    // Ignore quota / private-mode failures.
  }
}

export function clearAdminSession(storage = globalThis.sessionStorage) {
  try {
    storage?.removeItem(ADMIN_SESSION_KEY);
  } catch {
    // Ignore storage failures.
  }
}
