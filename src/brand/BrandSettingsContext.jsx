import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  emptyPublicBrandSettings,
  fetchPublicBrandSettings,
} from "../services/brandSettings.js";

const BrandSettingsContext = createContext(null);

export function BrandSettingsProvider({ children }) {
  const [settings, setSettings] = useState(emptyPublicBrandSettings);
  const [status, setStatus] = useState("loading");

  const refresh = useCallback(async () => {
    setStatus("loading");
    const result = await fetchPublicBrandSettings();
    setSettings(result.settings);
    setStatus(result.ok ? "ready" : "error");
    return result;
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value = useMemo(
    () => ({
      settings,
      status,
      loading: status === "loading",
      refresh,
    }),
    [refresh, settings, status],
  );

  return <BrandSettingsContext.Provider value={value}>{children}</BrandSettingsContext.Provider>;
}

export function usePublicBrandSettings() {
  const context = useContext(BrandSettingsContext);
  if (!context) {
    return {
      settings: emptyPublicBrandSettings(),
      status: "ready",
      loading: false,
      refresh: async () => ({ ok: false, settings: emptyPublicBrandSettings() }),
    };
  }
  return context;
}
