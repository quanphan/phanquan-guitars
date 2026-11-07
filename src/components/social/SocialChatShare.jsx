import { useState } from "react";
import Button from "../Button.jsx";
import { usePublicBrandSettings } from "../../brand/BrandSettingsContext.jsx";
import { useLanguage } from "../../i18n/LanguageContext.jsx";
import { publicSocialLinks } from "../../services/brandSettings.js";
import {
  chatUrlWithPrefill,
  copyTextSynchronously,
  copyTextWithClipboardApi,
  isFacebookProfileUrl,
  supportsMessengerPrefill,
} from "../../services/socialChat.js";

function openChat(url) {
  window.open(url, "_blank", "noopener,noreferrer");
}

export default function SocialChatShare({ getText, disabled = false }) {
  const { t } = useLanguage();
  const { settings } = usePublicBrandSettings();
  const links = publicSocialLinks(settings);
  const facebookUrl = links.facebookChatUrl || links.facebookProfileUrl;
  const zaloUrl = links.zaloUrl;
  const [status, setStatus] = useState("idle");
  const [fallback, setFallback] = useState("");

  if (!facebookUrl && !zaloUrl) return null;

  async function share(url) {
    const text = String(getText?.() || "").trim();
    if (!url) return;
    const copied = copyTextSynchronously(text);
    const messengerPrefill = supportsMessengerPrefill(url);
    const destination = chatUrlWithPrefill(url, text);
    if (copied) {
      setFallback("");
      setStatus(messengerPrefill ? "copiedMessenger" : "copied");
      openChat(destination);
      return;
    }
    try {
      await copyTextWithClipboardApi(text);
      setFallback("");
      setStatus(messengerPrefill ? "copiedMessenger" : "copied");
      openChat(destination);
    } catch {
      setFallback(text);
      setStatus("copyFailed");
      if (!isFacebookProfileUrl(url)) openChat(destination);
    }
  }

  return (
    <div className="mt-6 border border-white/10 bg-panel/30 px-4 py-4 sm:px-5">
      <p className="text-[11px] uppercase tracking-[0.18em] text-gold">{t("socialChat.contact")}</p>
      <p className="mt-2 text-sm leading-relaxed text-muted">{t("socialChat.help")}</p>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        {facebookUrl ? (
          <Button
            type="button"
            variant="outline"
            className="w-full sm:w-auto"
            disabled={disabled}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              share(facebookUrl);
            }}
          >
            {t("socialChat.facebook")}
          </Button>
        ) : null}
        {zaloUrl ? (
          <Button
            type="button"
            variant="outline"
            className="w-full sm:w-auto"
            disabled={disabled}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              share(zaloUrl);
            }}
          >
            {t("socialChat.zalo")}
          </Button>
        ) : null}
      </div>
      {status === "copied" ? (
        <p className="mt-3 text-sm text-ivory" role="status">
          {t("socialChat.copied")}
        </p>
      ) : null}
      {status === "copiedMessenger" ? (
        <p className="mt-3 text-sm text-ivory" role="status">
          {t("socialChat.copiedMessenger")}
        </p>
      ) : null}
      {status === "copyFailed" ? (
        <div className="mt-3 space-y-2" role="alert">
          <p className="text-sm text-ivory">{t("socialChat.copyFailed")}</p>
          {fallback ? (
            <textarea
              readOnly
              value={fallback}
              rows={6}
              className="w-full border border-white/10 bg-ink px-3 py-2 text-xs leading-relaxed text-ivory"
            />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
