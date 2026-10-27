import { useCallback, useEffect, useMemo, useState } from "react";
import CollectionCard from "../components/guitars/CollectionCard.jsx";
import CustomOptions from "../components/guitars/CustomOptions.jsx";
import GuitarSeriesSection from "../components/guitars/GuitarSeriesSection.jsx";
import GuitarsCta from "../components/guitars/GuitarsCta.jsx";
import GuitarsProcess from "../components/guitars/GuitarsProcess.jsx";
import Button from "../components/Button.jsx";
import PageHeader from "../components/PageHeader.jsx";
import { PRODUCT_TYPES } from "../auth/productSpecs.js";
import { usePublicCatalog } from "../hooks/usePublicCatalog.js";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import { filterInstrumentsBySeries, publicCatalogSeries } from "../services/guitarSeries.js";
import { listPublicCatalogTerms } from "../services/publicProductService.js";

export default function Guitars() {
  const { t } = useLanguage();
  const { items, status, retry } = usePublicCatalog(PRODUCT_TYPES.CUSTOM_ORDER);
  const [series, setSeries] = useState([]);
  const [seriesStatus, setSeriesStatus] = useState("loading");
  const [seriesReload, setSeriesReload] = useState(0);
  const [selectedSeriesId, setSelectedSeriesId] = useState("");

  const retrySeries = useCallback(() => {
    setSeriesReload((current) => current + 1);
  }, []);

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

  useEffect(() => {
    if (!selectedSeriesId) return;
    if (!series.some((item) => item.id === selectedSeriesId)) {
      setSelectedSeriesId("");
    }
  }, [selectedSeriesId, series]);

  const visible = useMemo(
    () => filterInstrumentsBySeries(items, selectedSeriesId),
    [items, selectedSeriesId],
  );
  const collectionEmpty =
    status === "ready" && visible.length === 0
      ? selectedSeriesId
        ? t("guitars.filters.empty")
        : t("guitars.collection.empty")
      : null;

  return (
    <>
      <PageHeader
        eyebrow={t("guitars.hero.eyebrow")}
        title={t("pages.guitars.title")}
        description={t("guitars.hero.description")}
      />
      <GuitarSeriesSection
        series={series}
        status={seriesStatus}
        selectedId={selectedSeriesId}
        onSelect={setSelectedSeriesId}
        onRetry={retrySeries}
      />
      <section id="collection" className="scroll-mt-24 pb-24 lg:pb-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-10">
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
          {status === "ready" && visible.length > 0 ? (
            <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
              {visible.map((guitar) => (
                <CollectionCard key={guitar.id} guitar={guitar} />
              ))}
            </div>
          ) : null}
        </div>
      </section>
      <CustomOptions />
      <GuitarsProcess />
      <GuitarsCta />
    </>
  );
}
