import { buildSteps } from "../../data/process.js";
import { useLanguage } from "../../i18n/LanguageContext.jsx";
import Reveal from "../Reveal.jsx";
import SectionHeading from "../SectionHeading.jsx";
import StepIcon from "../StepIcon.jsx";

export default function BuildProcess() {
  const { t } = useLanguage();

  return (
    <section className="mx-auto max-w-7xl px-6 py-24 lg:px-10 lg:py-32">
      <Reveal>
        <SectionHeading
          eyebrow={t("home.process.eyebrow")}
          title={t("home.process.title")}
        />
      </Reveal>
      <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {buildSteps.map((step, index) => (
          <Reveal key={step.number} delay={index * 90}>
            <article className="h-full border border-white/8 p-7 transition-colors duration-300 hover:border-gold/35">
              <p className="text-[11px] tracking-[0.28em] text-gold">
                {step.number}
              </p>
              <div className="mt-6">
                <StepIcon name={step.icon} />
              </div>
              <h3 className="mt-5 font-display text-2xl uppercase tracking-[0.16em] text-ivory">
                {t(`home.process.steps.${step.id}.title`)}
              </h3>
              <p className="mt-4 text-sm leading-relaxed text-muted">
                {t(`home.process.steps.${step.id}.description`)}
              </p>
            </article>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
