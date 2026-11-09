import { useCallback, useEffect, useState } from "react";
import CollectionCard from "../components/guitars/CollectionCard.jsx";
import CustomOptions from "../components/guitars/CustomOptions.jsx";
import GuitarSeriesSection from "../components/guitars/GuitarSeriesSection.jsx";
import GuitarsCta from "../components/guitars/GuitarsCta.jsx";
import GuitarsProcess from "../components/guitars/GuitarsProcess.jsx";
import Button from "../components/Button.jsx";
import PageHeader from "../components/PageHeader.jsx";
import { usePublicGuitarList } from "../hooks/usePublicGuitarList.js";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import { publicCatalogSeries } from "../services/guitarSeries.js";
import { listPublicCatalogTerms } from "../services/publicProductService.js";

export default function Guitars() {
  const { t } = useLanguage();
  const { items, status, error, retry, hasMore, loadMore, loadingMore } = usePublicGuitarList();
  const [series, setSeries] = useState([]);
  const [seriesStatus, setSeriesStatus] = useState("loading");
  const [seriesReload, setSeriesReload] = useState(0);
  const retrySeries = useCallback(() => {
    setSeriesReload((current) => current + 1);
  }, []);
  const collectionEmpty = status === "ready" && items.length === 0 ? t("guitars.collection.empty") : null;

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setSeriesStatus("loading");
      const listed = await listPublicCatalogTerms("series");
      if (cancelled) return;
      if (!listed.ok) {
        setSeries([]);
        setSeriesStatus("error");
        return;
      }
      setSeries(publicCatalogSeries(listed.items));
      setSeriesStatus("ready");
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [seriesReload]);

  return (
    <>
      <PageHeader
        eyebrow={t("guitars.hero.eyebrow")}
        title={t("pages.guitars.title")}
        description={t("guitars.hero.description")}
      />
      <GuitarSeriesSection series={series} status={seriesStatus} onRetry={retrySeries} />
      <section id="collection" className="scroll-mt-24 pb-24 lg:pb-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-10">
          <header className="mb-10 lg:mb-12">
            <div className="h-px w-14 bg-gold/25 sm:w-16" aria-hidden="true" />
            <p className="mt-8 text-[10px] uppercase tracking-[0.2em] text-gold/80 sm:text-[11px]">
              {t("guitars.collection.eyebrow")}
            </p>
            <h2 className="mt-3 font-display text-[1.75rem] font-medium leading-[1.15] tracking-normal text-ivory sm:text-3xl lg:text-[2.125rem]">
              {t("guitars.collection.title")}
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted sm:text-[15px] sm:leading-7">
              {t("guitars.collection.description")}
            </p>
          </header>
          {status === "loading" ? (
            <p className="text-sm text-muted">{t("guitars.collection.loading")}</p>
          ) : null}
          {status === "error" ? (
            <div className="space-y-4">
              <p className="text-sm text-muted">{t("guitars.collection.error")}</p>
              <Button type="button" variant="outline" onClick={retry}>
                {t("guitars.collection.retry")}
              </Button>
            </div>
          ) : null}
          {collectionEmpty ? (
            <p className="text-sm text-muted">{collectionEmpty}</p>
          ) : null}
          {items.length > 0 ? (
            <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
              {items.map((guitar) => (
                <CollectionCard key={guitar.id} guitar={guitar} />
              ))}
            </div>
          ) : null}
          {status === "ready" && items.length > 0 && hasMore ? (
            <div className="mt-12 flex flex-col items-center gap-3">
              {loadingMore ? (
                <p className="text-sm text-muted" role="status">
                  {t("guitars.collection.loadingMore")}
                </p>
              ) : null}
              <Button
                type="button"
                variant="outline"
                className="max-w-full whitespace-nowrap px-5 tracking-[0.16em] sm:px-7 sm:tracking-[0.22em]"
                onClick={() => void loadMore()}
                disabled={loadingMore}
              >
                {t("guitars.collection.showMore")}
              </Button>
            </div>
          ) : null}
          {status === "ready" && error && items.length > 0 ? (
            <p className="mt-6 text-sm text-muted" role="alert">
              {t("guitars.collection.error")}
            </p>
          ) : null}
        </div>
      </section>
      <CustomOptions />
      <GuitarsProcess />
      <GuitarsCta />
    </>
  );
}
