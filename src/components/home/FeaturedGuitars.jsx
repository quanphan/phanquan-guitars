import { useCallback, useEffect, useState } from "react";
import { useLanguage } from "../../i18n/LanguageContext.jsx";
import { toFeaturedSeriesCard } from "../../services/featuredHome.js";
import { listFeaturedHomeSeries } from "../../services/publicProductService.js";
import Button from "../Button.jsx";
import Reveal from "../Reveal.jsx";
import SectionHeading from "../SectionHeading.jsx";
import SeriesCarousel from "../series/SeriesCarousel.jsx";
import FeaturedSeriesCard from "./FeaturedSeriesCard.jsx";

export default function FeaturedGuitars() {
  const { t, language } = useLanguage();
  const [series, setSeries] = useState([]);
  const [status, setStatus] = useState("loading");
  const [reloadToken, setReloadToken] = useState(0);
  const retry = useCallback(() => setReloadToken((current) => current + 1), []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setStatus("loading");
      const listed = await listFeaturedHomeSeries();
      if (cancelled) return;
      if (!listed.ok) {
        setSeries([]);
        setStatus("error");
        return;
      }
      setSeries(listed.items.map((item) => toFeaturedSeriesCard(item, language)).filter(Boolean));
      setStatus("ready");
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [language, reloadToken]);

  if (status === "ready" && series.length === 0) {
    return null;
  }

  return (
    <section className="section-y bg-ink/60">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <Reveal>
          <SectionHeading
            eyebrow={t("home.featured.eyebrow")}
            title={t("home.featured.title")}
          />
        </Reveal>
        {status === "loading" ? (
          <p className="mt-10 text-sm text-muted">{t("home.featured.loading")}</p>
        ) : null}
        {status === "error" ? (
          <div className="mt-10 space-y-4">
            <p className="text-sm text-muted">{t("home.featured.error")}</p>
            <Button type="button" variant="outline" onClick={retry}>
              {t("home.featured.retry")}
            </Button>
          </div>
        ) : null}
        {status === "ready" ? (
          <div className="mt-10 overflow-visible">
            <SeriesCarousel
              items={series}
              previousLabel={t("guitars.series.previous")}
              nextLabel={t("guitars.series.next")}
            >
              {({ item, offscreen, style }) => (
                <li
                  className="relative z-0 flex h-full min-w-0 shrink-0 flex-col [@media(hover:hover)_and_(pointer:fine)]:hover:z-20"
                  style={style}
                  aria-hidden={offscreen || undefined}
                  inert={offscreen ? true : undefined}
                >
                  <FeaturedSeriesCard series={item} />
                </li>
              )}
            </SeriesCarousel>
          </div>
        ) : null}
      </div>
    </section>
  );
}
