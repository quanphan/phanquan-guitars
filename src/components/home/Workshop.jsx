import workshopBack from "../../assets/guitars/optimized/workshop-back.jpg";
import workshopBackSm from "../../assets/guitars/optimized/workshop-back-900.jpg";
import { useLanguage } from "../../i18n/LanguageContext.jsx";
import Reveal from "../Reveal.jsx";

export default function Workshop() {
  const { t } = useLanguage();

  return (
    <section className="relative min-h-[70vh] overflow-hidden">
      <img
        src={workshopBack}
        srcSet={`${workshopBackSm} 900w, ${workshopBack} 1200w`}
        sizes="100vw"
        alt={t("home.workshop.imageAlt")}
        width={1200}
        height={1500}
        loading="lazy"
        decoding="async"
        className="absolute inset-0 h-full w-full object-cover object-[center_35%]"
      />
      <div className="absolute inset-0 bg-charcoal/65" />
      <div className="relative mx-auto flex min-h-[70vh] max-w-7xl items-end px-6 py-24 lg:px-10">
        <Reveal className="max-w-xl">
          <h2 className="font-display text-5xl tracking-wide text-ivory sm:text-6xl">
            {t("home.workshop.title")}
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-ivory/85">
            {t("home.workshop.body")}
          </p>
        </Reveal>
      </div>
    </section>
  );
}
