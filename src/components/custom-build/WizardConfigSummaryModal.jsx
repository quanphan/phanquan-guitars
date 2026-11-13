import { useEffect, useMemo } from "react";
import { wizardSummarySections } from "../../data/wizardContinuous.js";
import { buildLiveConfigGroups } from "../../data/wizardLiveConfig.js";

export default function WizardConfigSummaryModal({ open, builder, t, language, onClose }) {
  const groups = useMemo(
    () => (open ? buildLiveConfigGroups(builder, t, language) : []),
    [open, builder, t, language],
  );
  const sections = useMemo(
    () => wizardSummarySections(groups, builder.steps || []),
    [groups, builder.steps],
  );

  useEffect(() => {
    if (!open) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(event) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-6"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="wizard-config-summary-title"
        className="flex max-h-[92vh] w-full max-w-lg flex-col border border-white/10 bg-panel sm:max-h-[85vh]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-white/10 px-5 py-4">
          <h2
            id="wizard-config-summary-title"
            className="font-display text-2xl tracking-wide text-ivory"
          >
            {t("customBuild.summary.viewSummary")}
          </h2>
          <button
            type="button"
            className="shrink-0 px-2 py-1 text-sm text-muted transition-colors hover:text-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
            onClick={onClose}
            aria-label={t("customBuild.summary.closePanel")}
          >
            ×
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-2">
          <dl>
            {sections.map((section) => {
              if (section.type === "heading") {
                return (
                  <div key={`heading-${section.step}`} className="pt-5 first:pt-3">
                    <p className="text-[11px] uppercase tracking-[0.22em] text-gold">
                      {t(`customBuild.steps.${section.key}`)}
                    </p>
                  </div>
                );
              }
              const group = section.group;
              return (
                <div
                  key={group.key}
                  className="border-b border-white/8 py-3 last:border-b-0"
                >
                  <dt className="text-[11px] uppercase tracking-[0.16em] text-muted">
                    {group.label}
                  </dt>
                  <dd className={`mt-1.5 text-sm ${group.filled ? "text-ivory" : "text-muted"}`}>
                    {group.value}
                  </dd>
                </div>
              );
            })}
          </dl>
        </div>
      </div>
    </div>
  );
}
