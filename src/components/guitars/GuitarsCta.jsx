import { useLanguage } from "../../i18n/LanguageContext.jsx";
import Button from "../Button.jsx";
import Reveal from "../Reveal.jsx";

export default function GuitarsCta() {
  const { t } = useLanguage();

  return (
    <section className="section-y mx-auto max-w-7xl px-6 text-center lg:px-10">
      <Reveal className="mx-auto max-w-2xl">
        <h2 className="max-w-full font-display text-[clamp(1.75rem,4vw+1rem,3.75rem)] tracking-wide text-ivory break-words">
          {t("guitars.cta.title")}
        </h2>
        <p className="mt-6 max-w-full text-base leading-relaxed text-muted sm:text-lg">
          {t("guitars.cta.description")}
        </p>
        <div className="mt-10">
          <Button to="/custom-build" className="w-full sm:w-auto">
            {t("guitars.cta.button")}
          </Button>
        </div>
      </Reveal>
    </section>
  );
}
