import { isCustomBuildApiConfigured } from "../config/api.js";
import { requestJson } from "./apiClient.js";
import { CART_CONFIRM_KEY, CART_SNAPSHOT_KEY, CART_STORAGE_KEY, emptyCart } from "./serviceCart.js";

function failure(result, extra = {}) {
  if (result.network) return { ok: false, code: "NETWORK", status: 0, ...extra };
  const payloadCode = result.payload?.error?.code;
  const details = result.payload?.error?.details;
  if (result.status === 401) {
    return { ok: false, code: payloadCode || "UNAUTHORIZED", status: 401, details, ...extra };
  }
  if (result.status === 409) {
    return { ok: false, code: payloadCode || "CONFLICT", status: 409, details, ...extra };
  }
  if (result.status === 422) {
    return {
      ok: false,
      code: payloadCode || "VALIDATION",
      status: 422,
      details,
      ...extra,
    };
  }
  return {
    ok: false,
    code: payloadCode || "failure",
    status: result.status,
    details,
    ...extra,
  };
}

export function readStoredSession() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.sessionId || !parsed?.token) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeStoredSession(session) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(session));
}

export function clearStoredSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(CART_STORAGE_KEY);
  window.localStorage.removeItem(CART_SNAPSHOT_KEY);
}

export function readStoredCart() {
  if (typeof window === "undefined") return emptyCart();
  try {
    const raw = window.localStorage.getItem(CART_SNAPSHOT_KEY);
    if (!raw) return emptyCart();
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.items)) return emptyCart();
    return parsed;
  } catch {
    return emptyCart();
  }
}

export function writeStoredCart(cart) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CART_SNAPSHOT_KEY, JSON.stringify(cart || emptyCart()));
}

export function writeConfirmation(payload) {
  if (typeof window === "undefined" || !payload?.id) return;
  const { confirmationToken, ...inquiry } = payload;
  window.sessionStorage.setItem(CART_CONFIRM_KEY, JSON.stringify(inquiry));
  if (confirmationToken) {
    window.localStorage.setItem(
      `${CART_CONFIRM_KEY}:${payload.id}`,
      JSON.stringify({ id: payload.id, confirmationToken }),
    );
  }
}

export function readConfirmation() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(CART_CONFIRM_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function readConfirmationReceipt(id) {
  if (typeof window === "undefined" || !id) return null;
  try {
    const raw = window.localStorage.getItem(`${CART_CONFIRM_KEY}:${id}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.confirmationToken ? String(parsed.confirmationToken) : null;
  } catch {
    return null;
  }
}

function cartHeaders(session) {
  if (!session?.sessionId || !session?.token) return {};
  return {
    "X-Cart-Session": session.sessionId,
    "X-Cart-Token": session.token,
  };
}

function requestCart(path, { session, token, method, body, requestFn } = {}) {
  const send = requestFn || requestJson;
  return send(path, {
    method,
    body,
    token,
    headers: cartHeaders(session),
  });
}

export async function createCartSession() {
  if (!isCustomBuildApiConfigured()) return { ok: false, code: "UNAVAILABLE" };
  const result = await requestJson("/api/service-cart/session", { method: "POST" });
  if (!result.ok || result.payload?.success !== true || !result.payload.data?.sessionId) {
    return failure(result);
  }
  const session = {
    sessionId: result.payload.data.sessionId,
    token: result.payload.data.token,
    expiresAt: result.payload.data.expiresAt,
  };
  writeStoredSession(session);
  return { ok: true, session };
}

export async function fetchCart({ session, token, requestFn } = {}) {
  if (!session && !token && !requestFn) return { ok: true, cart: emptyCart() };
  const result = await requestCart("/api/service-cart", { session, token, requestFn });
  if (!result.ok || result.payload?.success !== true) {
    return failure(result, { cart: emptyCart() });
  }
  return { ok: true, cart: result.payload.data };
}

export async function addCartItem({ session, token, requestFn } = {}, body) {
  const result = await requestCart("/api/service-cart/items", {
    method: "POST",
    session,
    token,
    requestFn,
    body,
  });
  if (!result.ok || result.payload?.success !== true) {
    return failure(result, { cart: emptyCart() });
  }
  return { ok: true, cart: result.payload.data };
}

export async function updateCartItem({ session, token, requestFn } = {}, lineId, body) {
  const result = await requestCart(`/api/service-cart/items/${encodeURIComponent(lineId)}`, {
    method: "PATCH",
    session,
    token,
    requestFn,
    body,
  });
  if (!result.ok || result.payload?.success !== true) {
    return failure(result, { cart: emptyCart() });
  }
  return { ok: true, cart: result.payload.data };
}

export async function removeCartItem({ session, token, requestFn } = {}, lineId) {
  const result = await requestCart(`/api/service-cart/items/${encodeURIComponent(lineId)}`, {
    method: "DELETE",
    session,
    token,
    requestFn,
  });
  if (!result.ok || result.payload?.success !== true) {
    return failure(result, { cart: emptyCart() });
  }
  return { ok: true, cart: result.payload.data };
}

export async function submitCart({ session, token, requestFn } = {}, body) {
  const result = await requestCart("/api/service-cart/submit", {
    method: "POST",
    session,
    token,
    requestFn,
    body,
  });
  if (!result.ok || result.payload?.success !== true || !result.payload.data?.id) {
    return failure(result, { inquiry: null });
  }
  return { ok: true, inquiry: result.payload.data };
}

export async function fetchConfirmation(id, receipt) {
  if (!id || !receipt) return { ok: false, code: "UNAUTHORIZED", inquiry: null };
  const result = await requestJson(`/api/service-cart/confirmation/${encodeURIComponent(id)}`, {
    headers: { "X-Inquiry-Receipt": receipt },
  });
  if (!result.ok || result.payload?.success !== true || !result.payload.data?.id) {
    return failure(result, { inquiry: null });
  }
  return { ok: true, inquiry: result.payload.data };
}
