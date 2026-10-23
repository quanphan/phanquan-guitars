import { useLanguage } from "../../../i18n/LanguageContext.jsx";

export default function StepPlaceholder({ stepKey }) {
  const { t } = useLanguage();

  return (
    <div className="border border-white/10 bg-panel/50 px-6 py-12 sm:px-10">
      <p className="text-[11px] uppercase tracking-[0.28em] text-gold">
        {t(`customBuild.steps.${stepKey}`)}
      </p>
      <h2 className="mt-4 font-display text-3xl tracking-wide text-ivory sm:text-4xl">
        {t("customBuild.placeholder.heading")}
      </h2>
      <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted sm:text-base">
        {t(`customBuild.placeholder.${stepKey}`)}
      </p>
      <p className="mt-6 max-w-xl text-sm leading-relaxed text-ivory/75">
        {t("customBuild.placeholder.saved")}
      </p>
    </div>
  );
}
