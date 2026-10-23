import { useLanguage } from "../../i18n/LanguageContext.jsx";
import Reveal from "../Reveal.jsx";
import SectionHeading from "../SectionHeading.jsx";

export default function Introduction() {
  const { t } = useLanguage();
  const specs = t("home.intro.specs");

  return (
    <section className="mx-auto grid max-w-7xl gap-16 px-6 py-24 lg:grid-cols-2 lg:items-center lg:px-10 lg:py-32">
      <Reveal>
        <SectionHeading
          eyebrow={t("home.intro.eyebrow")}
          title={t("home.intro.title")}
        />
      </Reveal>
      <Reveal delay={120}>
        <p className="text-lg leading-relaxed text-ivory/85">{t("home.intro.p1")}</p>
        <p className="mt-6 leading-relaxed text-muted">{t("home.intro.p2")}</p>
        <ul className="mt-10 grid grid-cols-2 gap-x-6 gap-y-3 text-[11px] uppercase tracking-[0.2em] text-gold sm:grid-cols-3">
          {specs.map((spec) => (
            <li key={spec} className="border-l border-gold/40 pl-3">
              {spec}
            </li>
          ))}
        </ul>
      </Reveal>
    </section>
  );
}
