export default function BuilderProgress({ steps, currentStep, totalSteps, t }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-[0.22em] text-muted">
        {t("customBuild.progress.label")
          .replace("{current}", String(currentStep))
          .replace("{total}", String(totalSteps))}
      </p>
      <ol className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {steps.map((step) => {
          const complete = step.id < currentStep;
          const current = step.id === currentStep;
          return (
            <li
              key={step.id}
              aria-current={current ? "step" : undefined}
              className={`border px-3 py-3 ${
                current
                  ? "border-gold bg-gold/10"
                  : complete
                    ? "border-gold/30"
                    : "border-white/10"
              }`}
            >
              <p
                className={`text-[10px] uppercase tracking-[0.18em] ${
                  current || complete ? "text-gold" : "text-muted"
                }`}
              >
                {complete
                  ? t("customBuild.progress.complete")
                  : `${String(step.id).padStart(2, "0")}`}
              </p>
              <p
                className={`mt-1 text-[11px] uppercase tracking-[0.14em] ${
                  current ? "text-ivory" : "text-ivory/60"
                }`}
              >
                {t(`customBuild.steps.${step.key}`)}
              </p>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
