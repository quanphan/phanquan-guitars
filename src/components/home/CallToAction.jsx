import { useLanguage } from "../../i18n/LanguageContext.jsx";
import Button from "../Button.jsx";
import Reveal from "../Reveal.jsx";

export default function CallToAction() {
  const { t } = useLanguage();

  return (
    <section className="mx-auto max-w-7xl px-6 py-24 text-center lg:px-10 lg:py-32">
      <Reveal className="mx-auto max-w-2xl">
        <p className="text-[11px] uppercase tracking-[0.32em] text-gold">
          {t("home.cta.eyebrow")}
        </p>
        <h2 className="mt-5 font-display text-4xl tracking-wide text-ivory sm:text-6xl">
          {t("home.cta.title")}
        </h2>
        <p className="mt-6 text-lg leading-relaxed text-muted">
          {t("home.cta.body")}
        </p>
        <div className="mt-10">
          <Button to="/custom-build">{t("home.cta.button")}</Button>
        </div>
      </Reveal>
    </section>
  );
}
