import heroBurlBass from "../../assets/guitars/optimized/hero-burl-bass.jpg";
import heroBurlBassSm from "../../assets/guitars/optimized/hero-burl-bass-900.jpg";
import { useLanguage } from "../../i18n/LanguageContext.jsx";
import Button from "../Button.jsx";
import Reveal from "../Reveal.jsx";

export default function Hero() {
  const { t } = useLanguage();

  return (
    <section className="relative min-h-[100svh]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <img
          src={heroBurlBass}
          srcSet={`${heroBurlBassSm} 900w, ${heroBurlBass} 956w`}
          sizes="100vw"
          alt=""
          width={956}
          height={1276}
          fetchPriority="high"
          loading="eager"
          decoding="async"
          className="absolute inset-0 h-full w-full max-w-none object-cover object-[78%_42%] sm:object-[82%_40%]"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-charcoal via-charcoal/80 to-transparent" />
      </div>
      <span className="sr-only">{t("home.hero.imageAlt")}</span>

      <div className="relative z-10 mx-auto flex min-h-[100svh] w-full min-w-0 max-w-7xl flex-col justify-end px-6 pb-[calc(6rem+env(safe-area-inset-bottom,0px))] pt-32 lg:justify-center lg:px-10 lg:pb-20">
        <Reveal className="w-full min-w-0 max-w-2xl">
          <p className="max-w-full text-[11px] uppercase tracking-[0.18em] text-gold sm:tracking-[0.36em]">
            {t("home.hero.eyebrow")}
          </p>
          <h1 className="mt-6 max-w-full font-display text-[clamp(2.5rem,6vw+1.15rem,6rem)] font-medium leading-[1.08] tracking-wide text-ivory break-words">
            {t("home.hero.titleLine1")}
            <br />
            {t("home.hero.titleLine2")}
          </h1>
          <p className="mt-6 max-w-full text-base leading-relaxed text-ivory/85 sm:text-xl">
            {t("home.hero.subtitle")}
          </p>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted sm:text-base">
            {t("home.hero.body")}
          </p>
          <div className="mt-10 flex w-full min-w-0 flex-col gap-4 sm:flex-row sm:flex-wrap">
            <Button to="/guitars" className="w-full sm:w-auto">
              {t("home.hero.explore")}
            </Button>
            <Button to="/custom-build" variant="outline" className="w-full sm:w-auto">
              {t("home.hero.startBuild")}
            </Button>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
