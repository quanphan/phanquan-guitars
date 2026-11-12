import { Fragment, useCallback, useEffect, useState } from "react";
import CollectionCard from "../components/guitars/CollectionCard.jsx";
import CustomOptions from "../components/guitars/CustomOptions.jsx";
import GuitarSeriesSection from "../components/guitars/GuitarSeriesSection.jsx";
import GuitarsCta from "../components/guitars/GuitarsCta.jsx";
import GuitarsProcess from "../components/guitars/GuitarsProcess.jsx";
import CatalogGridRowDividers from "../components/cards/CatalogGridRowDividers.jsx";
import Button from "../components/Button.jsx";
import PageHeader from "../components/PageHeader.jsx";
import { usePublicGuitarList } from "../hooks/usePublicGuitarList.js";
import { PRODUCT_GRID_BREAKPOINTS } from "../data/catalogGrid.js";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import { publicCatalogSeries } from "../services/guitarSeries.js";
import { listPublicCatalogTerms } from "../services/publicProductService.js";

/** Set true to show the Guitars page intro heading and description again. */
const SHOW_GUITARS_INTRO = false;

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
      {SHOW_GUITARS_INTRO ? (
        <PageHeader
          eyebrow={t("guitars.hero.eyebrow")}
          title={t("pages.guitars.title")}
          description={t("guitars.hero.description")}
        />
      ) : null}
      <GuitarSeriesSection series={series} status={seriesStatus} onRetry={retrySeries} />
      <section id="collection" className="scroll-mt-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-10">
          <header className="mb-8 lg:mb-10">
            <div className="h-px w-full bg-gold/25" aria-hidden="true" />
            <h2 className="mt-6 max-w-full font-display text-[clamp(1.5rem,3vw+1rem,2.25rem)] tracking-wide text-ivory break-words lg:mt-8">
              {t("guitars.collection.title")}
            </h2>
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
            <div className="grid items-stretch gap-x-8 gap-y-10 overflow-visible md:grid-cols-2 xl:grid-cols-3">
              {items.map((guitar, index) => (
                <Fragment key={guitar.id}>
                  <CollectionCard guitar={guitar} />
                  <CatalogGridRowDividers index={index} count={items.length} breakpoints={PRODUCT_GRID_BREAKPOINTS} />
                </Fragment>
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
