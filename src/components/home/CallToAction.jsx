import { useLanguage } from "../../i18n/LanguageContext.jsx";
import Button from "../Button.jsx";
import Reveal from "../Reveal.jsx";

export default function CallToAction() {
  const { t } = useLanguage();

  return (
    <section className="section-y mx-auto max-w-7xl px-6 text-center lg:px-10">
      <Reveal className="mx-auto max-w-2xl">
        <p className="max-w-full text-[11px] uppercase tracking-[0.18em] text-gold sm:tracking-[0.32em]">
          {t("home.cta.eyebrow")}
        </p>
        <h2 className="mt-5 max-w-full font-display text-[clamp(1.75rem,4vw+1rem,3.75rem)] tracking-wide text-ivory break-words">
          {t("home.cta.title")}
        </h2>
        <p className="mt-6 max-w-full text-base leading-relaxed text-muted sm:text-lg">
          {t("home.cta.body")}
        </p>
        <div className="mt-10">
          <Button to="/custom-build" className="w-full sm:w-auto">
            {t("home.cta.button")}
          </Button>
        </div>
      </Reveal>
    </section>
  );
}
