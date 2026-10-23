import { useEffect, useRef, useState } from "react";
import { getGoogleClientId, isGoogleSignInConfigured } from "../../config/api.js";
import { useLanguage } from "../../i18n/LanguageContext.jsx";

export default function GoogleSignIn({
  onCredential,
  disabled = false,
  labelKey = "auth.orGoogle",
  silentIfUnconfigured = false,
}) {
  const { t } = useLanguage();
  const hostRef = useRef(null);
  const [error, setError] = useState(null);
  const enabled = isGoogleSignInConfigured();

  useEffect(() => {
    if (!enabled || disabled) return undefined;
    const clientId = getGoogleClientId();
    let cancelled = false;

    async function mount() {
      try {
        await loadGoogleIdentity();
        if (cancelled || !window.google?.accounts?.id || !hostRef.current) return;
        hostRef.current.innerHTML = "";
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response) => {
            if (!response?.credential) {
              setError("google");
              return;
            }
            onCredential(response.credential);
          },
        });
        window.google.accounts.id.renderButton(hostRef.current, {
          theme: "filled_black",
          size: "large",
          width: 320,
          text: "continue_with",
        });
      } catch {
        if (!cancelled) setError("googleUnavailable");
      }
    }

    void mount();
    return () => {
      cancelled = true;
    };
  }, [disabled, enabled, onCredential]);

  if (!enabled) {
    if (silentIfUnconfigured) return null;
    return (
      <p className="mt-6 text-center text-xs leading-relaxed text-muted">{t("auth.googleNotConfigured")}</p>
    );
  }

  return (
    <div className="mt-8">
      <p className="mb-4 text-center text-[11px] uppercase tracking-[0.18em] text-muted">{t(labelKey)}</p>
      <div ref={hostRef} className="flex justify-center" />
      {error ? (
        <p className="mt-3 text-center text-xs text-gold" role="alert">
          {t(`auth.errors.${error}`)}
        </p>
      ) : null}
    </div>
  );
}

function loadGoogleIdentity() {
  if (window.google?.accounts?.id) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const existing = document.querySelector("script[data-google-identity]");
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("google")));
      return;
    }
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.dataset.googleIdentity = "true";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("google"));
    document.head.appendChild(script);
  });
}
