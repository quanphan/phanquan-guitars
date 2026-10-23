import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
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
import { userHasPermission } from "./permissions.js";
import {
  clearAdminSession,
  publicUser,
  readAdminSession,
  sessionIsAdmin,
  writeAdminSession,
} from "./session.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [ready, setReady] = useState(false);
  const sessionRef = useRef(null);
  const refreshPromiseRef = useRef(null);

  const persist = useCallback((next) => {
    sessionRef.current = next;
    setSession(next);
    if (next) writeAdminSession(next);
    else clearAdminSession();
  }, []);

  const clear = useCallback(() => {
    persist(null);
  }, [persist]);

  const refreshAccessToken = useCallback(async () => {
    const current = sessionRef.current;
    if (!current?.refreshToken) return null;
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
  }, [clear, persist]);

  const authorizedRequest = useCallback(
    async (path, options = {}) => {
      const token = sessionRef.current?.accessToken;
      let result = await requestJson(path, { ...options, token });
      if (result.status !== 401) return result;
      const nextToken = await refreshAccessToken();
      if (!nextToken) return result;
      return requestJson(path, { ...options, token: nextToken });
    },
    [refreshAccessToken],
  );

  const authorizedFormRequest = useCallback(
    async (path, options = {}) => {
      const token = sessionRef.current?.accessToken;
      let result = await requestForm(path, { ...options, token });
      if (result.status !== 401) return result;
      const nextToken = await refreshAccessToken();
      if (!nextToken) return result;
      return requestForm(path, { ...options, token: nextToken });
    },
    [refreshAccessToken],
  );

  useEffect(() => {
    let cancelled = false;

    async function restore() {
      const stored = readAdminSession();
      if (!stored) {
        if (!cancelled) setReady(true);
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
  }, [clear, persist, refreshAccessToken]);

  const login = useCallback(
    async (body) => {
      const result = await loginWithPassword(body);
      if (result.ok) persist(result.session);
      return result;
    },
    [persist],
  );

  const register = useCallback(
    async (body) => {
      const result = await registerWithPassword(body);
      if (result.ok) persist(result.session);
      return result;
    },
    [persist],
  );

  const loginWithGoogle = useCallback(
    async (credential) => {
      const result = await loginWithGoogleCredential(credential);
      if (result.ok) persist(result.session);
      return result;
    },
    [persist],
  );

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
