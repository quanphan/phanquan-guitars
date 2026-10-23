import { isAdminRole } from "./adminAccess.js";

export const ADMIN_SESSION_KEY = "phanquan-guitars-admin-session";

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
