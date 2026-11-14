import { useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { wizardSummarySections } from "../../data/wizardContinuous.js";
import { buildLiveConfigGroups } from "../../data/wizardLiveConfig.js";

export default function WizardConfigSummaryModal({ open, builder, t, language, onClose }) {
  const groups = useMemo(
    () => (open ? buildLiveConfigGroups(builder, t, language) : []),
    [open, builder, t, language],
  );
  const emptyLabel = t("customBuild.summary.empty");
  const sections = useMemo(() => {
    const all = wizardSummarySections(groups, builder.steps || []);
    const visible = [];
    let pendingHeading = null;
    for (const section of all) {
      if (section.type === "heading") {
        pendingHeading = section;
        continue;
      }
      const group = section.group;
      const value = String(group?.value || "").trim();
      if (!group?.filled || !value || value === emptyLabel) continue;
      if (pendingHeading) {
        visible.push(pendingHeading);
        pendingHeading = null;
      }
      visible.push(section);
    }
    return visible;
  }, [groups, builder.steps, emptyLabel]);

  useEffect(() => {
    if (!open) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(event) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 sm:p-8" role="presentation">
      <div className="absolute inset-0 bg-charcoal/80" aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="wizard-config-summary-title"
        className="relative z-10 flex max-h-[min(88vh,40rem)] w-full max-w-lg flex-col border border-gold/40 bg-charcoal shadow-[0_18px_40px_rgba(0,0,0,0.45)]"
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
            className="shrink-0 border border-gold/70 px-3 py-1.5 text-[11px] uppercase tracking-[0.18em] text-gold transition-colors hover:bg-gold/10 hover:text-ivory focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
            onClick={onClose}
          >
            {t("customBuild.summary.closePanel")}
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-3">
          <dl className="space-y-0">
            {sections.map((section) => {
              if (section.type === "heading") {
                return (
                  <div key={`heading-${section.step}`} className="pt-4 pb-1 first:pt-1">
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
                  className="flex items-baseline gap-2 border-b border-white/8 py-1.5 last:border-b-0"
                >
                  <dt className="shrink-0 text-[12px] text-muted">
                    {group.label}:
                  </dt>
                  <dd className={`min-w-0 text-sm ${group.filled ? "text-ivory" : "text-muted"}`}>
                    {group.value}
                  </dd>
                </div>
              );
            })}
          </dl>
        </div>
      </div>
    </div>,
    document.body,
  );
}
