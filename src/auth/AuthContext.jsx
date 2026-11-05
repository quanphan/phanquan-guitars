import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  fetchCurrentUser,
  loginWithGoogleCredential,
  loginWithPassword,
  logoutRemote,
  refreshSession,
  registerWithPassword,
  updateAccountPassword,
  updateAccountProfile,
} from "../services/authService.js";
import { requestForm, requestJson } from "../services/apiClient.js";
import { adminLoginPath } from "./adminAccess.js";
import { userHasPermission } from "./permissions.js";
import {
  clearAdminSession,
  publicUser,
  readAdminSession,
  sessionIsAdmin,
  sessionIsExpired,
  stampSessionTimes,
  touchSessionActivity,
  writeAdminSession,
} from "./session.js";

const ACTIVITY_EVENTS = ["pointerdown", "keydown", "touchstart", "scroll"];

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [ready, setReady] = useState(false);
  const sessionRef = useRef(null);
  const refreshPromiseRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const locationRef = useRef(location);

  locationRef.current = location;

  const persist = useCallback((next, { resetClock = false } = {}) => {
    const stamped = next
      ? stampSessionTimes(next, resetClock ? null : sessionRef.current)
      : null;
    sessionRef.current = stamped;
    setSession(stamped);
    if (stamped) writeAdminSession(stamped);
    else clearAdminSession();
  }, []);

  const clear = useCallback(() => {
    persist(null);
  }, [persist]);

  const expireSession = useCallback(async () => {
    const current = sessionRef.current;
    if (!current) return;
    const wasAdmin = sessionIsAdmin(current);
    const pathname = locationRef.current?.pathname || "";
    const token = current.refreshToken;
    clear();
    await logoutRemote(token);
    if (wasAdmin && pathname !== "/admin/login") {
      navigate(adminLoginPath(pathname), { replace: true });
    }
  }, [clear, navigate]);

  const refreshAccessToken = useCallback(async () => {
    const current = sessionRef.current;
    if (!current?.refreshToken) return null;
    if (sessionIsExpired(current)) {
      await expireSession();
      return null;
    }
    if (refreshPromiseRef.current) return refreshPromiseRef.current;

    refreshPromiseRef.current = refreshSession(current.refreshToken)
      .then((result) => {
        if (!result.ok || !result.session) {
          clear();
          return null;
        }
        persist(result.session);
        return result.session.accessToken;
      })
      .finally(() => {
        refreshPromiseRef.current = null;
      });

    return refreshPromiseRef.current;
  }, [clear, expireSession, persist]);

  const authorizedRequest = useCallback(
    async (path, options = {}) => {
      if (sessionRef.current && sessionIsExpired(sessionRef.current)) {
        await expireSession();
        return { ok: false, status: 401, payload: null, network: false };
      }
      const token = sessionRef.current?.accessToken;
      let result = await requestJson(path, { ...options, token });
      if (result.status !== 401) return result;
      const nextToken = await refreshAccessToken();
      if (!nextToken) return result;
      return requestJson(path, { ...options, token: nextToken });
    },
    [expireSession, refreshAccessToken],
  );

  const authorizedFormRequest = useCallback(
    async (path, options = {}) => {
      if (sessionRef.current && sessionIsExpired(sessionRef.current)) {
        await expireSession();
        return { ok: false, status: 401, payload: null, network: false };
      }
      const token = sessionRef.current?.accessToken;
      let result = await requestForm(path, { ...options, token });
      if (result.status !== 401) return result;
      const nextToken = await refreshAccessToken();
      if (!nextToken) return result;
      return requestForm(path, { ...options, token: nextToken });
    },
    [expireSession, refreshAccessToken],
  );

  useEffect(() => {
    let cancelled = false;

    async function restore() {
      const stored = readAdminSession();
      if (!stored || sessionIsExpired(stored)) {
        const wasAdmin = Boolean(stored && sessionIsAdmin(stored));
        if (stored) {
          clearAdminSession();
          void logoutRemote(stored.refreshToken);
        }
        if (!cancelled) {
          setReady(true);
          if (wasAdmin) {
            navigate(adminLoginPath(locationRef.current?.pathname), { replace: true });
          }
        }
        return;
      }
      sessionRef.current = stored;
      const me = await fetchCurrentUser(stored.accessToken);
      if (cancelled) return;
      if (me.ok) {
        persist({ ...stored, user: publicUser({ ...stored.user, ...me.user }) });
        setReady(true);
        return;
      }
      if (me.status === 401) {
        const nextToken = await refreshAccessToken();
        if (cancelled) return;
        if (nextToken) {
          const retry = await fetchCurrentUser(nextToken);
          if (cancelled) return;
          if (retry.ok) {
            persist({
              ...sessionRef.current,
              user: publicUser({ ...sessionRef.current.user, ...retry.user }),
            });
            setReady(true);
            return;
          }
        }
        clear();
      }
      if (!cancelled) setReady(true);
    }

    restore();
    return () => {
      cancelled = true;
    };
  }, [clear, navigate, persist, refreshAccessToken]);

  const login = useCallback(
    async (body) => {
      const result = await loginWithPassword(body);
      if (result.ok) persist(result.session, { resetClock: true });
      return result;
    },
    [persist],
  );

  const register = useCallback(
    async (body) => {
      const result = await registerWithPassword(body);
      if (result.ok) persist(result.session, { resetClock: true });
      return result;
    },
    [persist],
  );

  const loginWithGoogle = useCallback(
    async (credential) => {
      const result = await loginWithGoogleCredential(credential);
      if (result.ok) persist(result.session, { resetClock: true });
      return result;
    },
    [persist],
  );

  useEffect(() => {
    function onActivity() {
      const current = sessionRef.current;
      if (!current) return;
      if (sessionIsExpired(current)) {
        void expireSession();
        return;
      }
      const next = touchSessionActivity(current);
      if (next === current) return;
      sessionRef.current = next;
      writeAdminSession(next);
    }

    function onVisibility() {
      if (document.visibilityState === "visible") onActivity();
    }

    const timer = window.setInterval(() => {
      const current = sessionRef.current;
      if (current && sessionIsExpired(current)) void expireSession();
    }, 15_000);

    ACTIVITY_EVENTS.forEach((event) => window.addEventListener(event, onActivity, { passive: true }));
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.clearInterval(timer);
      ACTIVITY_EVENTS.forEach((event) => window.removeEventListener(event, onActivity));
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [expireSession]);

  const logout = useCallback(async () => {
    const token = sessionRef.current?.refreshToken;
    clear();
    await logoutRemote(token);
  }, [clear]);

  const updateProfile = useCallback(
    async (body) => {
      const result = await updateAccountProfile(authorizedRequest, body);
      if (result.ok && result.user) {
        persist({
          ...sessionRef.current,
          user: publicUser({ ...sessionRef.current.user, ...result.user }),
        });
      }
      return result;
    },
    [authorizedRequest, persist],
  );

  const updatePassword = useCallback(
    async (body) => updateAccountPassword(authorizedRequest, body),
    [authorizedRequest],
  );

  const value = useMemo(
    () => ({
      ready,
      session,
      isAuthenticated: Boolean(session?.accessToken),
      isAdmin: sessionIsAdmin(session),
      hasPermission: (permission) => userHasPermission(session?.user, permission),
      login,
      register,
      loginWithGoogle,
      logout,
      updateProfile,
      updatePassword,
      authorizedRequest,
      authorizedFormRequest,
    }),
    [
      authorizedFormRequest,
      authorizedRequest,
      login,
      loginWithGoogle,
      logout,
      ready,
      register,
      session,
      updatePassword,
      updateProfile,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
