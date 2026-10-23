export default function SelectionSummary({ rows, onReset, resetDisabled, t }) {
  return (
    <aside
      className="border border-white/10 bg-panel/60 p-6 lg:sticky lg:top-28"
      aria-live="polite"
    >
      <p className="text-[11px] uppercase tracking-[0.28em] text-gold">
        {t("customBuild.summary.title")}
      </p>
      <dl className="mt-5 space-y-4">
        {rows.map((row) => (
          <div
            key={row.key}
            className="border-b border-white/8 pb-4 last:border-b-0 last:pb-0"
          >
            <dt className="text-[11px] uppercase tracking-[0.16em] text-muted">
              {row.label}
            </dt>
            <dd className="mt-1.5 text-sm text-ivory">
              {row.value ?? t("customBuild.summary.empty")}
            </dd>
          </div>
        ))}
      </dl>
      <button
        type="button"
        onClick={onReset}
        disabled={resetDisabled}
        className={`mt-6 text-[11px] uppercase tracking-[0.2em] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold ${
          resetDisabled
            ? "cursor-not-allowed text-muted/40"
            : "text-muted hover:text-gold"
        }`}
      >
        {t("customBuild.reset")}
      </button>
    </aside>
  );
}
