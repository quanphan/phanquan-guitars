import { useLanguage } from "../../i18n/LanguageContext.jsx";
import Button from "../Button.jsx";
import Reveal from "../Reveal.jsx";

export default function GuitarsCta() {
  const { t } = useLanguage();

  return (
    <section className="mx-auto max-w-7xl px-6 py-24 text-center lg:px-10 lg:py-32">
      <Reveal className="mx-auto max-w-2xl">
        <h2 className="font-display text-4xl tracking-wide text-ivory sm:text-6xl">
          {t("guitars.cta.title")}
        </h2>
        <p className="mt-6 text-lg leading-relaxed text-muted">
          {t("guitars.cta.description")}
        </p>
        <div className="mt-10">
          <Button to="/custom-build">{t("guitars.cta.button")}</Button>
        </div>
      </Reveal>
    </section>
  );
}
