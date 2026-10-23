import featuredEngraved from "../assets/guitars/optimized/featured-engraved.jpg";
import featuredEngravedSm from "../assets/guitars/optimized/featured-engraved-800.jpg";
import heroBurlBass from "../assets/guitars/optimized/hero-burl-bass.jpg";
import heroBurlBassSm from "../assets/guitars/optimized/hero-burl-bass-900.jpg";
import workshopBack from "../assets/guitars/optimized/workshop-back.jpg";
import workshopBackSm from "../assets/guitars/optimized/workshop-back-900.jpg";
import Button from "../components/Button.jsx";
import PageHeader from "../components/PageHeader.jsx";
import Reveal from "../components/Reveal.jsx";
import SectionHeading from "../components/SectionHeading.jsx";
import { useLanguage } from "../i18n/LanguageContext.jsx";

function paragraphs(t, key) {
  const value = t(key);
  return Array.isArray(value) ? value : value ? [value] : [];
}

function StoryImage({ src, srcSet, alt }) {
  if (!src) {
    return <div className="min-h-[18rem] w-full border border-white/10 bg-ink/50" aria-hidden="true" />;
  }

  return (
    <img
      src={src}
      srcSet={srcSet}
      sizes="(min-width: 1024px) 42vw, 100vw"
      alt={alt}
      loading="lazy"
      decoding="async"
      className="aspect-[4/5] w-full object-cover object-center"
    />
  );
}

function StoryCopy({ children }) {
  return <div className="min-w-0 space-y-5 text-base leading-relaxed text-muted sm:text-lg">{children}</div>;
}

export default function About() {
  const { t } = useLanguage();

  return (
    <article className="overflow-x-hidden pb-24">
      <PageHeader
        eyebrow={t("about.eyebrow")}
        title={t("about.title")}
        description={t("about.lede")}
      />

      <StorySection
        image={
          <StoryImage
            src={heroBurlBass}
            srcSet={`${heroBurlBassSm} 900w, ${heroBurlBass} 1200w`}
            alt={t("about.images.wood")}
          />
        }
      >
        {paragraphs(t, "about.opening").map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </StorySection>

      <StorySection
        reverse
        heading={t("about.turningPoint.title")}
        image={
          <StoryImage
            src={featuredEngraved}
            srcSet={`${featuredEngravedSm} 800w, ${featuredEngraved} 1080w`}
            alt={t("about.images.instrument")}
          />
        }
      >
        {paragraphs(t, "about.turningPoint.body").map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
        <blockquote className="border-l border-gold/50 pl-5">
          <p className="font-display text-xl italic leading-relaxed text-ivory/90 sm:text-2xl">
            {t("about.turningPoint.quote")}
          </p>
        </blockquote>
        {paragraphs(t, "about.turningPoint.after").map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </StorySection>

      <StorySection
        heading={t("about.craft.title")}
        image={
          <StoryImage
            src={workshopBack}
            srcSet={`${workshopBackSm} 900w, ${workshopBack} 1200w`}
            alt={t("about.images.workshop")}
          />
        }
      >
        {paragraphs(t, "about.craft.body").map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </StorySection>

      <section className="mx-auto max-w-7xl px-6 pt-16 lg:px-10 lg:pt-24">
        <Reveal className="mx-auto max-w-3xl">
          <SectionHeading title={t("about.philosophy.title")} />
          <StoryCopy>
            <div className="mt-8 space-y-5">
              {paragraphs(t, "about.philosophy.body").map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
            <p className="pt-4 font-display text-xl tracking-wide text-ivory sm:text-2xl">
              {t("about.philosophy.signature")}
            </p>
          </StoryCopy>
        </Reveal>
      </section>

      <section className="mx-auto max-w-7xl px-6 pt-16 text-center lg:px-10 lg:pt-24">
        <Reveal className="mx-auto max-w-2xl">
          <h2 className="font-display text-3xl tracking-wide text-ivory sm:text-4xl">
            {t("about.cta.title")}
          </h2>
          <p className="mt-5 text-base leading-relaxed text-muted sm:text-lg">{t("about.cta.body")}</p>
          <div className="mt-10">
            <Button to="/custom-build">{t("about.cta.button")}</Button>
          </div>
        </Reveal>
      </section>
    </article>
  );
}

function StorySection({ heading, image, reverse = false, children }) {
  return (
    <section className="mx-auto grid max-w-7xl items-center gap-10 px-6 pt-14 lg:grid-cols-2 lg:gap-16 lg:px-10 lg:pt-20">
      <Reveal className={`min-w-0 ${reverse ? "lg:order-2" : ""}`}>{image}</Reveal>
      <Reveal className={`min-w-0 ${reverse ? "lg:order-1" : ""}`} delay={80}>
        {heading ? <SectionHeading title={heading} /> : null}
        <StoryCopy>
          <div className={heading ? "mt-8 space-y-5" : "space-y-5"}>{children}</div>
        </StoryCopy>
      </Reveal>
    </section>
  );
}
