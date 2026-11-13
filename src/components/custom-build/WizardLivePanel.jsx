import { useState } from "react";
import GuitarPreviewFrame from "./GuitarPreviewFrame.jsx";
import WizardConfigSummaryModal from "./WizardConfigSummaryModal.jsx";

const controlClass =
  "min-w-[7.5rem] flex-1 px-2 py-2 text-center text-[10px] uppercase tracking-[0.16em] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold sm:text-[11px] sm:tracking-[0.18em]";

export default function WizardLivePanel({
  builder,
  t,
  language,
  onReset,
  resetDisabled,
  side,
  onSideChange,
  className = "",
}) {
  const [uncontrolledSide, setUncontrolledSide] = useState("front");
  const [summaryOpen, setSummaryOpen] = useState(false);
  const currentSide = side ?? uncontrolledSide;
  const setSide = onSideChange ?? setUncontrolledSide;
  const showingBack = currentSide === "back";

  return (
    <>
      <aside className={className} aria-live="polite">
        <GuitarPreviewFrame builder={builder} t={t} side={currentSide} />
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onReset}
            disabled={resetDisabled}
            className={`${controlClass} ${
              resetDisabled ? "cursor-not-allowed text-muted/40" : "text-muted hover:text-gold"
            }`}
          >
            {t("customBuild.reset")}
          </button>
          <button
            type="button"
            onClick={() => setSummaryOpen(true)}
            className={`${controlClass} text-gold hover:text-ivory`}
          >
            {t("customBuild.summary.viewSummary")}
          </button>
          <button
            type="button"
            onClick={() => setSide(showingBack ? "front" : "back")}
            className={`${controlClass} text-muted hover:text-gold`}
            aria-pressed={showingBack}
          >
            {showingBack ? t("customBuild.summary.flipToFront") : t("customBuild.summary.flipToBack")}
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
