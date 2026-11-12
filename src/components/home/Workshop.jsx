import workshopBack from "../../assets/guitars/optimized/workshop-back.jpg";
import workshopBackSm from "../../assets/guitars/optimized/workshop-back-900.jpg";
import { useLanguage } from "../../i18n/LanguageContext.jsx";
import Reveal from "../Reveal.jsx";

export default function Workshop() {
  const { t } = useLanguage();

  return (
    <section className="relative hidden min-h-[48svh] md:block">
      <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
        <img
          src={workshopBack}
          srcSet={`${workshopBackSm} 900w, ${workshopBack} 1200w`}
          sizes="100vw"
          alt=""
          width={1200}
          height={1500}
          loading="lazy"
          decoding="async"
          className="absolute inset-0 h-full w-full max-w-none object-cover object-[center_35%]"
        />
        <div className="absolute inset-0 bg-charcoal/65" />
      </div>
      <span className="sr-only">{t("home.workshop.imageAlt")}</span>
      <div className="relative mx-auto flex min-h-[48svh] w-full min-w-0 max-w-7xl items-end px-6 py-16 lg:px-10 lg:py-20">
        <Reveal className="w-full min-w-0 max-w-xl">
          <h2 className="max-w-full font-display text-[clamp(2.25rem,5vw+1rem,3.75rem)] tracking-wide text-ivory break-words">
            {t("home.workshop.title")}
          </h2>
          <p className="mt-6 max-w-full text-base leading-relaxed text-ivory/85 sm:text-lg">
            {t("home.workshop.body")}
          </p>
        </Reveal>
      </div>
    </section>
  );
}
