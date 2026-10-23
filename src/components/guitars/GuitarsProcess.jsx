import { buildSteps } from "../../data/process.js";
import { useLanguage } from "../../i18n/LanguageContext.jsx";
import Reveal from "../Reveal.jsx";
import SectionHeading from "../SectionHeading.jsx";
import StepIcon from "../StepIcon.jsx";

const stepCopyIds = ["discuss", "design", "build", "setup"];

export default function GuitarsProcess() {
  const { t } = useLanguage();

  return (
    <section className="mx-auto max-w-7xl px-6 py-24 lg:px-10 lg:py-32">
      <Reveal>
        <SectionHeading
          eyebrow={t("guitars.process.eyebrow")}
          title={t("guitars.process.title")}
        />
      </Reveal>
      <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {buildSteps.map((step, index) => {
          const copyId = stepCopyIds[index] ?? step.id;
          return (
            <Reveal key={step.number} delay={index * 90}>
              <article className="h-full border border-white/8 p-7 transition-colors duration-300 hover:border-gold/35">
                <p className="text-[11px] tracking-[0.28em] text-gold">
                  {step.number}
                </p>
                <div className="mt-6">
                  <StepIcon name={step.icon} />
                </div>
                <h3 className="mt-5 font-display text-2xl uppercase tracking-[0.16em] text-ivory">
                  {t(`guitars.process.steps.${copyId}.title`)}
                </h3>
                <p className="mt-4 text-sm leading-relaxed text-muted">
                  {t(`guitars.process.steps.${copyId}.description`)}
                </p>
              </article>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}
