import Button from "../Button.jsx";
import PageHeader from "../PageHeader.jsx";
import Reveal from "../Reveal.jsx";
import SectionHeading from "../SectionHeading.jsx";
import { mediaUrl } from "../../config/api.js";
import { splitParagraphs, visibleSections } from "../../data/pageContent.js";

function StoryImage({ src, srcSet, alt, wide = false }) {
  if (!src) {
    return <div className={`w-full border border-white/10 bg-ink/50 ${wide ? "min-h-[16rem]" : "min-h-[18rem]"}`} aria-hidden="true" />;
  }
  return (
    <img
      src={src}
      srcSet={srcSet}
      sizes="(min-width: 1024px) 42vw, 100vw"
      alt={alt || ""}
      loading="lazy"
      decoding="async"
      className={`${wide ? "aspect-[16/10]" : "aspect-[4/5]"} w-full object-cover object-center`}
    />
  );
}

function StoryCopy({ children }) {
  return <div className="min-w-0 space-y-5 text-base leading-relaxed text-muted sm:text-lg">{children}</div>;
}

function resolveImage(section, fallbacks) {
  if (section.image) {
    return { src: mediaUrl(section.image), srcSet: undefined };
  }
  return fallbacks?.[section.id] || { src: "", srcSet: undefined };
}

function Paragraphs({ text, quote }) {
  const parts = splitParagraphs(text);
  if (!parts.length && !quote) return null;
  if (!quote) {
    return parts.map((paragraph) => <p key={paragraph}>{paragraph}</p>);
  }
  const [first, ...rest] = parts;
  return (
    <>
      {first ? <p>{first}</p> : null}
      <blockquote className="border-l border-gold/50 pl-5">
        <p className="font-display text-xl italic leading-relaxed text-ivory/90 sm:text-2xl">{quote}</p>
      </blockquote>
      {rest.map((paragraph) => (
        <p key={paragraph}>{paragraph}</p>
      ))}
    </>
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

function ProcessSection({ section, image, reverse }) {
  return (
    <section className="mx-auto grid max-w-7xl items-start gap-10 px-6 pt-14 lg:grid-cols-2 lg:gap-16 lg:px-10 lg:pt-24">
      <Reveal className={`min-w-0 ${reverse ? "lg:order-2" : ""}`}>
        <StoryImage src={image.src} srcSet={image.srcSet} alt={section.imageAlt} wide />
      </Reveal>
      <Reveal className={`min-w-0 ${reverse ? "lg:order-1" : ""}`} delay={80}>
        {section.number ? <p className="text-[11px] uppercase tracking-[0.32em] text-gold">{section.number}</p> : null}
        {section.title ? (
          <h2 className="mt-4 font-display text-3xl tracking-wide text-ivory sm:text-4xl">{section.title}</h2>
        ) : null}
        <div className="mt-6 max-w-xl space-y-5 text-base leading-relaxed text-muted sm:text-lg">
          <Paragraphs text={section.body} />
          {section.subtitle ? (
            <p className="font-display text-xl italic tracking-wide text-ivory/90 sm:text-2xl">{section.subtitle}</p>
          ) : null}
        </div>
      </Reveal>
    </section>
  );
}

function SectionView({ section, fallbacks }) {
  const image = resolveImage(section, fallbacks);
  const reverse = section.layout === "image-right";

  if (section.type === "hero") {
    return <PageHeader eyebrow={section.subtitle} title={section.title} description={section.body} />;
  }

  if (section.type === "process-step") {
    return <ProcessSection section={section} image={image} reverse={reverse} />;
  }

  if (section.type === "cta") {
    const to = section.ctaUrl || "/custom-build";
    const internal = to.startsWith("/");
    return (
      <section className="mx-auto max-w-7xl px-6 pt-16 text-center lg:px-10 lg:pt-24">
        <Reveal className="mx-auto max-w-2xl">
          {section.title ? (
            <h2 className="font-display text-3xl tracking-wide text-ivory sm:text-4xl">{section.title}</h2>
          ) : null}
          {section.body ? <p className="mt-5 text-base leading-relaxed text-muted sm:text-lg">{section.body}</p> : null}
          {section.ctaLabel ? (
            <div className="mt-10">
              {internal ? <Button to={to}>{section.ctaLabel}</Button> : (
                <a href={to} className="inline-flex border border-gold bg-gold px-6 py-3 text-[11px] uppercase tracking-[0.22em] text-charcoal">
                  {section.ctaLabel}
                </a>
              )}
            </div>
          ) : null}
        </Reveal>
      </section>
    );
  }

  if (section.type === "quote") {
    return (
      <section className="mx-auto max-w-7xl px-6 pt-14 lg:px-10">
        <Reveal className="mx-auto max-w-3xl">
          <blockquote className="border-l border-gold/50 pl-5">
            <p className="font-display text-xl italic leading-relaxed text-ivory/90 sm:text-2xl">{section.body || section.quote}</p>
          </blockquote>
        </Reveal>
      </section>
    );
  }

  if (section.type === "image") {
    return (
      <section className="mx-auto max-w-7xl px-6 pt-14 lg:px-10">
        <Reveal>
          <StoryImage src={image.src} srcSet={image.srcSet} alt={section.imageAlt} wide />
        </Reveal>
      </section>
    );
  }

  if (section.type === "video") {
    const src = section.videoUrl ? mediaUrl(section.videoUrl) : "";
    if (!src) return null;
    return (
      <section className="mx-auto max-w-7xl px-6 pt-14 lg:px-10">
        <Reveal>
          <video src={src} controls playsInline className="aspect-video w-full bg-ink" />
        </Reveal>
      </section>
    );
  }

  if (section.type === "gallery") {
    const items = (section.images || []).filter((item) => item.path);
    if (!items.length) return null;
    return (
      <section className="mx-auto grid max-w-7xl gap-4 px-6 pt-14 sm:grid-cols-2 lg:grid-cols-3 lg:px-10">
        {items.map((item) => (
          <img key={item.path} src={mediaUrl(item.path)} alt={item.alt || ""} className="aspect-[4/5] w-full object-cover" />
        ))}
      </section>
    );
  }

  if (section.type === "text") {
    return (
      <section className="mx-auto max-w-7xl px-6 pt-16 lg:px-10 lg:pt-24">
        <Reveal className="mx-auto max-w-3xl">
          {section.title ? <SectionHeading title={section.title} /> : null}
          <StoryCopy>
            <div className={section.title ? "mt-8 space-y-5" : "space-y-5"}>
              <Paragraphs text={section.body} quote={section.quote} />
            </div>
            {section.subtitle ? (
              <p className="pt-4 font-display text-xl tracking-wide text-ivory sm:text-2xl">{section.subtitle}</p>
            ) : null}
          </StoryCopy>
        </Reveal>
      </section>
    );
  }

  return (
    <StorySection
      heading={section.title}
      reverse={reverse}
      image={<StoryImage src={image.src} srcSet={image.srcSet} alt={section.imageAlt} />}
    >
      <Paragraphs text={section.body} quote={section.quote} />
    </StorySection>
  );
}

export default function PageContentRenderer({ locale, fallbacks, wrapSection }) {
  const sections = visibleSections(locale);
  return (
    <article className="overflow-x-hidden pb-24">
      {sections.map((section) => {
        const view = <SectionView section={section} fallbacks={fallbacks} />;
        return wrapSection ? wrapSection(section, view) : <div key={section.id}>{view}</div>;
      })}
    </article>
  );
}
