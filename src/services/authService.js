import { parseAuthData } from "../auth/session.js";
import { requestJson } from "./apiClient.js";

export function authFailure(result, fallback = "failure") {
  const details = result.payload?.error?.details;
  const payloadCode = result.payload?.error?.code;
  if (result.network) {
    return { ok: false, code: "NETWORK", session: null, details, status: 0 };
  }
  if (result.status === 401) {
    return { ok: false, code: "UNAUTHORIZED", session: null, details, status: 401 };
  }
  if (payloadCode === "ACCOUNT_LOCKED" || (result.status === 403 && payloadCode === "ACCOUNT_LOCKED")) {
    return { ok: false, code: "ACCOUNT_LOCKED", session: null, details, status: 403 };
  }
  if (result.status === 403) {
    return { ok: false, code: "FORBIDDEN", session: null, details, status: 403 };
  }
  if (result.status === 409) {
    return { ok: false, code: "CONFLICT", session: null, details, status: 409 };
  }
  if (result.status === 422) {
    return { ok: false, code: "VALIDATION", session: null, details, status: 422 };
  }
  if (result.status === 429) {
    return { ok: false, code: "RATE_LIMIT", session: null, details, status: 429 };
  }
  if (result.status === 503) {
    return { ok: false, code: "UNAVAILABLE", session: null, details, status: 503 };
  }
  if (result.status === 400) {
    return { ok: false, code: "BAD_REQUEST", session: null, details, status: 400 };
  }
  return { ok: false, code: payloadCode || fallback, session: null, details, status: result.status };
}

export async function loginWithPassword(body) {
  const result = await requestJson("/api/auth/login", { method: "POST", body });
  if (!result.ok) return authFailure(result);
  const session = parseAuthData(result.payload);
  if (!session) return { ok: false, code: "INVALID_RESPONSE", session: null, details: null };
  return { ok: true, code: null, session };
}

export async function registerWithPassword(body) {
  const result = await requestJson("/api/auth/register", { method: "POST", body });
  if (!result.ok) return authFailure(result);
  const session = parseAuthData(result.payload);
  if (!session) return { ok: false, code: "INVALID_RESPONSE", session: null, details: null };
  return { ok: true, code: null, session };
}

export async function loginWithGoogleCredential(credential) {
  const result = await requestJson("/api/auth/google", {
    method: "POST",
    body: { credential },
  });
  if (!result.ok) return authFailure(result);
  const session = parseAuthData(result.payload);
  if (!session) return { ok: false, code: "INVALID_RESPONSE", session: null, details: null };
  return { ok: true, code: null, session };
}

export async function refreshSession(refreshToken) {
  const result = await requestJson("/api/auth/refresh", {
    method: "POST",
    body: { refreshToken },
  });
  if (!result.ok) return authFailure(result);
  const session = parseAuthData(result.payload);
  if (!session) return { ok: false, code: "INVALID_RESPONSE", session: null, details: null };
  return { ok: true, code: null, session };
}

export async function logoutRemote(refreshToken) {
  if (!refreshToken) return;
  await requestJson("/api/auth/logout", {
    method: "POST",
    body: { refreshToken },
  });
}

export async function fetchCurrentUser(accessToken) {
  const result = await requestJson("/api/account/me", { token: accessToken });
  if (!result.ok) return { ok: false, status: result.status, user: null, code: result.payload?.error?.code };
  const user = result.payload?.success ? result.payload.data : null;
  if (!user?.id) return { ok: false, status: result.status, user: null };
  return { ok: true, status: result.status, user };
}

export async function updateAccountProfile(request, body) {
  const result = await request("/api/account/me", { method: "PUT", body });
  if (!result.ok || result.payload?.success !== true || !result.payload.data?.id) {
    return { ...authFailure(result), user: null };
  }
  return { ok: true, code: null, user: result.payload.data };
}

export async function updateAccountPassword(request, body) {
  const result = await request("/api/account/password", { method: "PUT", body });
  if (!result.ok || result.payload?.success !== true) {
    return authFailure(result);
  }
  return { ok: true, code: null };
}
