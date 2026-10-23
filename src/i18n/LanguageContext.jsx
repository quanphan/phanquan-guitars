import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  detectLanguageFromIp,
  getInitialLanguage,
  getStoredLanguage,
  persistLanguage,
  shouldSkipIpDetection,
} from "./language.js";
import { tFor } from "./translations.js";

const LanguageContext = createContext(null);

function applyDocumentLang(language) {
  if (typeof document !== "undefined") {
    document.documentElement.lang = language;
  }
}

export function LanguageProvider({ children, initialLanguage }) {
  const [language, setLanguageState] = useState(() => {
    const next = initialLanguage ?? getInitialLanguage();
    applyDocumentLang(next);
    return next;
  });
  const manualOverrideRef = useRef(Boolean(getStoredLanguage()));

  useEffect(() => {
    applyDocumentLang(language);
  }, [language]);

  useEffect(() => {
    if (initialLanguage) return;
    if (manualOverrideRef.current) return;
    if (getStoredLanguage()) return;
    if (shouldSkipIpDetection()) return;

    let cancelled = false;

    detectLanguageFromIp().then((detected) => {
      if (cancelled || manualOverrideRef.current || !detected) return;
      if (getStoredLanguage()) return;
      setLanguageState((current) => (current === detected ? current : detected));
    });

    return () => {
      cancelled = true;
    };
  }, [initialLanguage]);

  const value = useMemo(() => {
    const setLanguage = (next) => {
      if (next !== "en" && next !== "vi") return;
      manualOverrideRef.current = true;
      persistLanguage(next);
      applyDocumentLang(next);
      setLanguageState(next);
    };

    return {
      language,
      setLanguage,
      t: (key) => tFor(language, key),
    };
  }, [language]);

  return (
    <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return context;
}
