import { useLanguage } from "../../i18n/LanguageContext.jsx";
import Reveal from "../Reveal.jsx";
import SectionHeading from "../SectionHeading.jsx";

export default function CustomOptions() {
  const { t } = useLanguage();
  const items = t("guitars.options.items");

  return (
    <section className="bg-ink/60 py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <Reveal>
          <SectionHeading
            eyebrow={t("guitars.options.eyebrow")}
            title={t("guitars.options.title")}
          />
        </Reveal>
        <Reveal delay={80}>
          <p className="mt-8 max-w-2xl text-base leading-relaxed text-muted">
            {t("guitars.options.intro")}
          </p>
        </Reveal>
        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item, index) => (
            <Reveal key={item.title} delay={index * 60}>
              <article className="h-full border border-white/8 p-7">
                <h3 className="font-display text-2xl tracking-wide text-ivory">
                  {item.title}
                </h3>
                <p className="mt-4 text-sm leading-relaxed text-muted">
                  {item.body}
                </p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
