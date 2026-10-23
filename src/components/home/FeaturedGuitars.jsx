import { featuredGuitars } from "../../data/guitars.js";
import { useLanguage } from "../../i18n/LanguageContext.jsx";
import GuitarCard from "../GuitarCard.jsx";
import Reveal from "../Reveal.jsx";
import SectionHeading from "../SectionHeading.jsx";

export default function FeaturedGuitars() {
  const { t } = useLanguage();

  return (
    <section className="bg-ink/60 py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <Reveal>
          <SectionHeading
            eyebrow={t("home.featured.eyebrow")}
            title={t("home.featured.title")}
          />
        </Reveal>
        <div className="mt-16 grid gap-8 md:grid-cols-2 xl:grid-cols-3">
          {featuredGuitars.map((guitar) => (
            <GuitarCard key={guitar.id} guitar={guitar} />
          ))}
        </div>
      </div>
    </section>
  );
}
