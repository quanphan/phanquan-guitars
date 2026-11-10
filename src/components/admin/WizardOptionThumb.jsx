import { useEffect, useState } from "react";
import { mediaUrl } from "../../config/api.js";
import { wizardOptionImagePath } from "../../data/wizardOptionPayload.js";

export default function WizardOptionThumb({ option, t }) {
  const path = wizardOptionImagePath(option);
  const src = path ? mediaUrl(path) : "";
  const [broken, setBroken] = useState(false);

  useEffect(() => {
    setBroken(false);
  }, [src]);

  if (!src || broken) {
    return (
      <div className="flex h-14 w-14 shrink-0 items-center justify-center border border-white/10 bg-ink px-1 text-center text-[9px] uppercase leading-tight tracking-[0.12em] text-muted">
        {t("admin.wizardSetup.noImage")}
      </div>
    );
  }

  return (
    <a
      href={src}
      target="_blank"
      rel="noreferrer"
      className="block h-14 w-14 shrink-0 overflow-hidden border border-white/10 bg-ink"
    >
      <img
        src={src}
        alt=""
        className="h-full w-full object-cover object-center"
        onError={() => setBroken(true)}
      />
    </a>
  );
}
