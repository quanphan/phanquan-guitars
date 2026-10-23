import Button from "../components/Button.jsx";
import PageHeader from "../components/PageHeader.jsx";
import Reveal from "../components/Reveal.jsx";
import { processStages } from "../data/buildProcess.js";
import { useLanguage } from "../i18n/LanguageContext.jsx";

function paragraphs(t, key) {
  const value = t(key);
  if (Array.isArray(value)) return value.filter(Boolean);
  if (!value || value === key) return [];
  return [value];
}

function optionalCopy(t, key) {
  const value = t(key);
  if (!value || value === key || Array.isArray(value)) return "";
  return value;
}

function StageImage({ src, alt }) {
  if (!src) {
    return <div className="min-h-[16rem] w-full border border-white/10 bg-ink/50" aria-hidden="true" />;
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      className="aspect-[16/10] w-full object-cover object-center"
    />
  );
}

function StageSection({ stage, reverse, t }) {
  const copyKey = `process.stages.${stage.id}`;
  const body = paragraphs(t, `${copyKey}.body`);
  const tagline = optionalCopy(t, `${copyKey}.tagline`);
  const closing = optionalCopy(t, `${copyKey}.closing`);

  return (
    <section className="mx-auto grid max-w-7xl items-start gap-10 px-6 pt-14 lg:grid-cols-2 lg:gap-16 lg:px-10 lg:pt-24">
      <Reveal className={`min-w-0 ${reverse ? "lg:order-2" : ""}`}>
        <StageImage src={stage.image} alt={t(`${copyKey}.imageAlt`)} />
      </Reveal>
      <Reveal className={`min-w-0 ${reverse ? "lg:order-1" : ""}`} delay={80}>
        <p className="text-[11px] uppercase tracking-[0.32em] text-gold">{stage.number}</p>
        <h2 className="mt-4 font-display text-3xl tracking-wide text-ivory sm:text-4xl">
          {t(`${copyKey}.title`)}
        </h2>
        <div className="mt-6 max-w-xl space-y-5 text-base leading-relaxed text-muted sm:text-lg">
          {body.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
          {tagline ? (
            <p className="font-display text-xl italic tracking-wide text-ivory/90 sm:text-2xl">{tagline}</p>
          ) : null}
          {closing ? <p>{closing}</p> : null}
        </div>
      </Reveal>
    </section>
  );
}

export default function BuildProcess() {
  const { t } = useLanguage();

  return (
    <article className="overflow-x-hidden pb-24">
      <PageHeader
        eyebrow={t("process.eyebrow")}
        title={t("process.title")}
        description={t("process.description")}
      />

      {processStages.map((stage, index) => (
        <StageSection key={stage.id} stage={stage} reverse={index % 2 === 1} t={t} />
      ))}

      <section className="mx-auto max-w-7xl px-6 pt-16 text-center lg:px-10 lg:pt-24">
        <Reveal className="mx-auto max-w-2xl">
          <h2 className="font-display text-3xl tracking-wide text-ivory sm:text-4xl">{t("process.cta.title")}</h2>
          <p className="mt-5 text-base leading-relaxed text-muted sm:text-lg">{t("process.cta.body")}</p>
          <div className="mt-10">
            <Button to="/custom-build">{t("process.cta.button")}</Button>
          </div>
        </Reveal>
      </section>
    </article>
  );
}
