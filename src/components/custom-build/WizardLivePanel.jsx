import { useState } from "react";
import GuitarPreviewFrame from "./GuitarPreviewFrame.jsx";
import WizardConfigSummaryModal from "./WizardConfigSummaryModal.jsx";

const captionClass =
  "px-1 py-1 text-[10px] uppercase tracking-[0.2em] sm:text-[11px] sm:tracking-[0.22em]";

export default function WizardLivePanel({
  builder,
  t,
  language,
  className = "",
  slot = "any",
}) {
  const [summaryOpen, setSummaryOpen] = useState(false);

  return (
    <>
      <aside className={className} aria-live="polite">
        <GuitarPreviewFrame builder={builder} t={t} side="front" slot={slot} />
        <div className="mt-4 flex items-center justify-between gap-4 border-t border-gold/15 pt-3">
          <button
            type="button"
            onClick={() => setSummaryOpen(true)}
            className={`${captionClass} text-gold transition-colors hover:text-ivory focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold`}
          >
            {t("customBuild.summary.viewSummary")}
          </button>
          <button
            type="button"
            disabled
            aria-disabled="true"
            className={`${captionClass} cursor-not-allowed text-muted/35`}
          >
            {t("customBuild.summary.flipToBack")}
          </button>
        </div>
      </aside>
      <WizardConfigSummaryModal
        open={summaryOpen}
        builder={builder}
        t={t}
        language={language}
        onClose={() => setSummaryOpen(false)}
      />
    </>
  );
}
