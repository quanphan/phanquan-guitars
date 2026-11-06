import { useCallback, useEffect, useState } from "react";
import { useLanguage } from "../../i18n/LanguageContext.jsx";
import { toFeaturedSeriesCard } from "../../services/featuredHome.js";
import { listFeaturedHomeSeries } from "../../services/publicProductService.js";
import Button from "../Button.jsx";
import Reveal from "../Reveal.jsx";
import SectionHeading from "../SectionHeading.jsx";
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
    <section className="bg-ink/60 py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <Reveal>
          <SectionHeading
            eyebrow={t("home.featured.eyebrow")}
            title={t("home.featured.title")}
          />
        </Reveal>
        {status === "loading" ? (
          <p className="mt-16 text-sm text-muted">{t("home.featured.loading")}</p>
        ) : null}
        {status === "error" ? (
          <div className="mt-16 space-y-4">
            <p className="text-sm text-muted">{t("home.featured.error")}</p>
            <Button type="button" variant="outline" onClick={retry}>
              {t("home.featured.retry")}
            </Button>
          </div>
        ) : null}
        {status === "ready" ? (
          <div className="mt-16 grid gap-8 md:grid-cols-2 xl:grid-cols-3">
            {series.map((item) => (
              <FeaturedSeriesCard key={item.id} series={item} />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
