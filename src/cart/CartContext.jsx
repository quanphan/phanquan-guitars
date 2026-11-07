import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../auth/AuthContext.jsx";
import { readAdminSession } from "../auth/session.js";
import { emptyCart, isGuestSessionError } from "../services/serviceCart.js";
import {
  addCartItem,
  clearStoredSession,
  createCartSession,
  fetchCart,
  readStoredCart,
  readStoredSession,
  writeStoredCart,
  writeStoredSession,
  removeCartItem,
  submitCart,
  updateCartItem,
  writeConfirmation,
} from "../services/serviceCartApi.js";

const CartContext = createContext(null);

function initialCart() {
  return readAdminSession()?.accessToken ? emptyCart() : readStoredCart();
}

export function CartProvider({ children }) {
  const { ready, isAuthenticated, authorizedRequest, session: authSession } = useAuth();
  const userId = authSession?.user?.id || null;
  const [session, setSession] = useState(() => (readAdminSession()?.accessToken ? null : readStoredSession()));
  const [cart, setCart] = useState(initialCart);
  const [status, setStatus] = useState("idle");
  const sessionRef = useRef(session);
  const cartRef = useRef(cart);
  sessionRef.current = session;
  cartRef.current = cart;

  const applyCart = useCallback((next, { persistGuest = !isAuthenticated } = {}) => {
    const resolved = next || emptyCart();
    setCart(resolved);
    if (persistGuest && resolved.ownerType !== "user") writeStoredCart(resolved);
  }, [isAuthenticated]);

  const rememberGuestSession = useCallback((next) => {
    setSession(next);
    if (next) writeStoredSession(next);
  }, []);

  const discardGuestSession = useCallback(() => {
    clearStoredSession();
    setSession(null);
  }, []);

  const credentials = useCallback(() => ({
    session: sessionRef.current || readStoredSession(),
    token: isAuthenticated ? authSession?.accessToken : undefined,
    requestFn: isAuthenticated ? authorizedRequest : undefined,
  }), [authSession?.accessToken, authorizedRequest, isAuthenticated]);

  const ensureGuestSession = useCallback(async () => {
    if (isAuthenticated) return sessionRef.current || readStoredSession();
    const current = sessionRef.current || readStoredSession();
    if (current?.sessionId && current?.token) return current;
    const created = await createCartSession();
    if (!created.ok) return null;
    rememberGuestSession(created.session);
    return created.session;
  }, [isAuthenticated, rememberGuestSession]);

  const refresh = useCallback(async () => {
    const current = credentials();
    if (!current.token && !current.session) {
      applyCart(emptyCart());
      return emptyCart();
    }
    const result = await fetchCart(current);
    if (result.ok) {
      if (result.cart?.ownerType === "user") discardGuestSession();
      else if (result.cart?.expiresAt && current.session) {
        rememberGuestSession({ ...current.session, expiresAt: result.cart.expiresAt });
      }
      applyCart(result.cart);
      return result.cart;
    }
    if (result.network || isGuestSessionError(result) || result.status === 401) {
      return cartRef.current;
    }
    return cartRef.current;
  }, [applyCart, credentials, discardGuestSession, isAuthenticated, rememberGuestSession]);

  useEffect(() => {
    if (!ready) return undefined;
    void refresh();
    return undefined;
  }, [ready, userId]);

  useEffect(() => {
    function onVisible() {
      if (document.visibilityState === "visible") void refresh();
    }
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [refresh]);

  useEffect(() => {
    if (!ready || isAuthenticated) return undefined;
    if (cart?.ownerType === "user") {
      discardGuestSession();
      applyCart(emptyCart());
    }
    return undefined;
  }, [applyCart, cart?.ownerType, discardGuestSession, isAuthenticated, ready]);

  const withCart = useCallback(
    async (run) => {
      const guest = await ensureGuestSession();
      const current = {
        ...credentials(),
        session: isAuthenticated ? (sessionRef.current || readStoredSession()) : guest,
      };
      if (!current.token && !current.session) {
        return { ok: false, code: "UNAVAILABLE", cart: emptyCart() };
      }
      let result = await run(current);
      if (result.ok && result.cart) {
        if (result.cart.ownerType === "user") discardGuestSession();
        applyCart(result.cart);
      }
      return result;
    },
    [applyCart, credentials, discardGuestSession, ensureGuestSession, isAuthenticated, rememberGuestSession],
  );

  const value = useMemo(
    () => ({
      cart,
      status,
      itemCount: cart.itemCount || 0,
      async addItem(body) {
        setStatus("saving");
        let result = await withCart((current) => addCartItem(current, body));
        if (!isAuthenticated && isGuestSessionError(result)) {
          discardGuestSession();
          const created = await createCartSession();
          if (created.ok) {
            rememberGuestSession(created.session);
            result = await addCartItem({ session: created.session }, body);
            if (result.ok && result.cart) applyCart(result.cart);
          }
        }
        setStatus(result.ok ? "ready" : "error");
        return result;
      },
      async updateItem(lineId, body) {
        return withCart((current) => updateCartItem(current, lineId, body));
      },
      async removeItem(lineId) {
        return withCart((current) => removeCartItem(current, lineId));
      },
      async submit(body) {
        setStatus("submitting");
        const current = credentials();
        if (!current.token && !current.session) {
          setStatus("error");
          return { ok: false, code: "UNAUTHORIZED" };
        }
        const result = await submitCart(current, body);
        if (result.ok) {
          writeConfirmation(result.inquiry);
          discardGuestSession();
          applyCart(emptyCart(), { persistGuest: true });
        }
        setStatus(result.ok ? "ready" : "error");
        return result;
      },
      refresh,
    }),
    [applyCart, cart, credentials, discardGuestSession, isAuthenticated, rememberGuestSession, refresh, status, withCart],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const value = useContext(CartContext);
  if (!value) throw new Error("useCart must be used within CartProvider");
  return value;
}
