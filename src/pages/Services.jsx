import { useEffect, useState } from "react";
import featuredEngraved from "../assets/guitars/optimized/featured-engraved.jpg";
import featuredEngravedSm from "../assets/guitars/optimized/featured-engraved-800.jpg";
import featuredGrey from "../assets/guitars/optimized/featured-grey.jpg";
import featuredGreySm from "../assets/guitars/optimized/featured-grey-700.jpg";
import workshopBack from "../assets/guitars/optimized/workshop-back.jpg";
import workshopBackSm from "../assets/guitars/optimized/workshop-back-900.jpg";
import workshopCraft from "../assets/guitars/optimized/workshop-craft.jpg";
import workshopCraftSm from "../assets/guitars/optimized/workshop-craft-700.jpg";
import construction from "../assets/buildProcess/construction.jpg";
import Button from "../components/Button.jsx";
import EditableFixedImage from "../components/page-content/EditableFixedImage.jsx";
import PageContentSession from "../components/page-content/PageContentSession.jsx";
import PageHeader from "../components/PageHeader.jsx";
import Reveal from "../components/Reveal.jsx";
import SectionHeading from "../components/SectionHeading.jsx";
import { mediaUrl } from "../config/api.js";
import { SERVICES_EXPERTISE_SECTION_ID, storedSectionImage } from "../data/pageContent.js";
import { categoryFallbackKey, mergePublicCategories, serviceLocale } from "../data/services.js";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import { listPublicServices } from "../services/serviceCatalog.js";

const FALLBACK_IMAGES = {
  repair: {
    src: featuredGrey,
    srcSet: `${featuredGreySm} 700w, ${featuredGrey} 1080w`,
  },
  tools: {
    src: workshopBack,
    srcSet: `${workshopBackSm} 900w, ${workshopBack} 1200w`,
  },
  cnc: {
    src: featuredEngraved,
    srcSet: `${featuredEngravedSm} 800w, ${featuredEngraved} 1080w`,
  },
};

const EXPERTISE_FALLBACKS = {
  image: {
    src: workshopCraft,
    srcSet: `${workshopCraftSm} 700w, ${workshopCraft} 956w`,
  },
  imageSecondary: {
    src: construction,
    srcSet: undefined,
  },
};

function expertiseImage(locale, field) {
  const stored = storedSectionImage(locale, SERVICES_EXPERTISE_SECTION_ID, field, EXPERTISE_FALLBACKS[field]);
  if (stored.stored) {
    return { src: mediaUrl(stored.src), srcSet: undefined };
  }
  return EXPERTISE_FALLBACKS[field];
}

function usePageMeta(title, description) {
  useEffect(() => {
    if (typeof document === "undefined") return;
    const previousTitle = document.title;
    document.title = title;
    let meta = document.querySelector('meta[name="description"]');
    const created = !meta;
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }
    const previousDescription = meta.getAttribute("content");
    meta.setAttribute("content", description);
    return () => {
      document.title = previousTitle;
      if (created) meta.remove();
      else if (previousDescription == null) meta.remove();
      else meta.setAttribute("content", previousDescription);
    };
  }, [description, title]);
}

function categoryCopy(category, language, t) {
  const key = category.fallbackKey || categoryFallbackKey(category.slug);
  const locale = serviceLocale(category, language);
  const title = locale.name || (key ? t(`services.items.${key}.title`) : category.name || category.slug);
  const description = locale.description || "";
  const list = !description && key ? t(`services.items.${key}.list`) : [];
  const imageAlt = key ? t(`services.items.${key}.imageAlt`) : title;
  const fallbackImage = key ? FALLBACK_IMAGES[key] : null;
  const src = category.imagePath ? mediaUrl(category.imagePath) : fallbackImage?.src;
  return { title, description, list, imageAlt, src, srcSet: category.imagePath ? undefined : fallbackImage?.srcSet };
}

export default function Services() {
  const { t, language } = useLanguage();
  const [categories, setCategories] = useState(() => mergePublicCategories([]));

  usePageMeta(t("services.meta.title"), t("services.meta.description"));

  useEffect(() => {
    let cancelled = false;
    listPublicServices().then((result) => {
      if (cancelled) return;
      setCategories(mergePublicCategories(result.ok ? result.items : []));
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <PageContentSession pageKey="services">
      {(session) => {
        const primary = expertiseImage(session.locale, "image");
        const secondary = expertiseImage(session.locale, "imageSecondary");
        return (
    <>
      <PageHeader
        eyebrow={t("services.intro.eyebrow")}
        title={t("services.intro.title")}
        description={t("services.intro.body")}
      />

      <section className="pb-24 lg:pb-32">
        <div className="mx-auto max-w-7xl space-y-16 px-6 pt-16 lg:space-y-24 lg:px-10">
          {categories.map((category, index) => {
            const copy = categoryCopy(category, language, t);
            const reversed = index % 2 === 1;
            const details = category.linkMode !== "contact";
            return (
              <Reveal key={category.id || category.slug} delay={index * 40}>
                <article className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
                  <div className={reversed ? "lg:order-2" : undefined}>
                    {copy.src ? (
                      <img
                        src={copy.src}
                        srcSet={copy.srcSet}
                        sizes="(min-width: 1024px) 40vw, 100vw"
                        alt={copy.imageAlt}
                        loading={index === 0 ? "eager" : "lazy"}
                        decoding="async"
                        className="aspect-[4/5] w-full object-cover"
                      />
                    ) : null}
                  </div>
                  <div className={reversed ? "lg:order-1" : undefined}>
                    <h2 className="font-display text-3xl tracking-wide text-ivory sm:text-4xl">
                      {copy.title}
                    </h2>
                    {copy.description ? (
                      <p className="mt-6 whitespace-pre-line text-sm leading-relaxed text-muted sm:text-base">
                        {copy.description}
                      </p>
                    ) : (
                      <ul className="mt-6 space-y-3 text-sm leading-relaxed text-muted sm:text-base">
                        {copy.list.map((item) => (
                          <li key={item} className="flex gap-3">
                            <span className="mt-2.5 h-px w-4 shrink-0 bg-gold" aria-hidden="true" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                    <div className="mt-8">
                      {details ? (
                        <Button to={`/services/${category.slug}`} variant="outline">
                          {t("services.details")}
                        </Button>
                      ) : (
                        <Button to="/contact" variant="outline">
                          {t("services.contact")}
                        </Button>
                      )}
                    </div>
                  </div>
                </article>
              </Reveal>
            );
          })}
        </div>
      </section>

      <section className="border-t border-white/5">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-6 py-24 lg:grid-cols-2 lg:gap-16 lg:px-10 lg:py-32">
          <Reveal>
            <EditableFixedImage
              editing={session.editing}
              src={primary.src}
              srcSet={primary.srcSet}
              sizes="(min-width: 1024px) 40vw, 100vw"
              alt={t("services.expertise.imageAlt")}
              className="aspect-[4/5] w-full object-cover"
              disabled={session.saving || !session.canUpload}
              onConfirmFile={(file) => session.replaceImage(SERVICES_EXPERTISE_SECTION_ID, "image", file)}
            />
          </Reveal>
          <Reveal delay={80}>
            <SectionHeading
              eyebrow={t("services.expertise.eyebrow")}
              title={t("services.expertise.title")}
            />
            <p className="mt-6 text-sm leading-relaxed text-muted sm:text-base">
              {t("services.expertise.body")}
            </p>
            <ul className="mt-8 space-y-3 text-sm leading-relaxed text-muted sm:text-base">
              {t("services.expertise.points").map((point) => (
                <li key={point} className="flex gap-3">
                  <span className="mt-2.5 h-px w-4 shrink-0 bg-gold" aria-hidden="true" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
            <EditableFixedImage
              editing={session.editing}
              src={secondary.src}
              srcSet={secondary.srcSet}
              alt=""
              wrapperClassName="mt-10 hidden lg:block"
              className="aspect-[16/9] w-full object-cover"
              disabled={session.saving || !session.canUpload}
              onConfirmFile={(file) => session.replaceImage(SERVICES_EXPERTISE_SECTION_ID, "imageSecondary", file)}
            />
          </Reveal>
        </div>
      </section>

      <section className="border-t border-white/5">
        <div className="mx-auto max-w-7xl px-6 py-24 lg:px-10 lg:py-32">
          <Reveal>
            <SectionHeading
              eyebrow={t("services.howWeWork.eyebrow")}
              title={t("services.howWeWork.title")}
            />
          </Reveal>
          <ol className="relative mt-16 grid gap-10 lg:grid-cols-4 lg:gap-8">
            <span
              className="pointer-events-none absolute left-4 top-3 hidden h-px w-[calc(100%-2rem)] bg-gold/30 lg:block"
              aria-hidden="true"
            />
            {t("services.howWeWork.steps").map((step, index) => (
              <Reveal key={step.title} delay={index * 70}>
                <li className="relative border-l border-gold/35 pl-6 lg:border-l-0 lg:pl-0">
                  <p className="text-[11px] tracking-[0.28em] text-gold">
                    {String(index + 1).padStart(2, "0")}
                  </p>
                  <h3 className="mt-5 font-display text-2xl tracking-wide text-ivory">
                    {step.title}
                  </h3>
                  <p className="mt-4 text-sm leading-relaxed text-muted">{step.body}</p>
                </li>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      <section className="border-t border-white/5">
        <div className="mx-auto max-w-7xl px-6 py-24 text-center lg:px-10 lg:py-32">
          <Reveal className="mx-auto max-w-2xl">
            <p className="text-[11px] uppercase tracking-[0.32em] text-gold">
              {t("services.cta.eyebrow")}
            </p>
            <h2 className="mt-5 font-display text-4xl tracking-wide text-ivory sm:text-5xl">
              {t("services.cta.title")}
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-muted">{t("services.cta.body")}</p>
            <div className="mt-10">
              <Button to="/contact">{t("services.contact")}</Button>
            </div>
          </Reveal>
        </div>
      </section>
    </>
        );
      }}
    </PageContentSession>
  );
}
