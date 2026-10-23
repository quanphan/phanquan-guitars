import heroBurlBass from "../../assets/guitars/optimized/hero-burl-bass.jpg";
import heroBurlBassSm from "../../assets/guitars/optimized/hero-burl-bass-900.jpg";
import { useLanguage } from "../../i18n/LanguageContext.jsx";
import Button from "../Button.jsx";
import Reveal from "../Reveal.jsx";

export default function Hero() {
  const { t } = useLanguage();

  return (
    <section className="relative min-h-[100svh] overflow-hidden">
      <img
        src={heroBurlBass}
        srcSet={`${heroBurlBassSm} 900w, ${heroBurlBass} 956w`}
        sizes="100vw"
        alt={t("home.hero.imageAlt")}
        width={956}
        height={1276}
        fetchPriority="high"
        decoding="async"
        className="pointer-events-none absolute inset-0 h-full w-full object-cover object-[78%_42%] sm:object-[82%_40%]"
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-charcoal via-charcoal/80 to-transparent" />

      <div className="relative z-10 mx-auto flex min-h-[100svh] max-w-7xl flex-col justify-end px-6 pb-24 pt-32 lg:justify-center lg:px-10 lg:pb-20">
        <Reveal className="max-w-2xl">
          <p className="text-[11px] uppercase tracking-[0.36em] text-gold">
            {t("home.hero.eyebrow")}
          </p>
          <h1 className="mt-6 font-display text-5xl font-medium leading-[0.95] tracking-wide text-ivory sm:text-7xl lg:text-8xl">
            {t("home.hero.titleLine1")}
            <br />
            {t("home.hero.titleLine2")}
          </h1>
          <p className="mt-6 text-lg text-ivory/85 sm:text-xl">
            {t("home.hero.subtitle")}
          </p>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted sm:text-base">
            {t("home.hero.body")}
          </p>
          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <Button to="/guitars">{t("home.hero.explore")}</Button>
            <Button to="/custom-build" variant="outline">
              {t("home.hero.startBuild")}
            </Button>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
