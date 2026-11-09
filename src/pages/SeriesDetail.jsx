import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import CollectionCard from "../components/guitars/CollectionCard.jsx";
import Button from "../components/Button.jsx";
import FitImage from "../components/FitImage.jsx";
import { mediaUrl } from "../config/api.js";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import { seriesCardCopy } from "../services/guitarSeries.js";
import { toPublicInstrument } from "../services/productView.js";
import { getPublicSeries, listPublicProductsForSeries, loadCatalogNameMap } from "../services/publicProductService.js";

export default function SeriesDetail() {
  const { slug } = useParams();
  const { t, language } = useLanguage();
  const [status, setStatus] = useState("loading");
  const [series, setSeries] = useState(null);
  const [products, setProducts] = useState([]);
  const [reloadToken, setReloadToken] = useState(0);
  const retry = useCallback(() => setReloadToken((current) => current + 1), []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setStatus("loading");
      setSeries(null);
      setProducts([]);
      const listed = await getPublicSeries(slug);
      if (cancelled) return;
      if (!listed.ok) {
        setStatus(listed.code === "NOT_FOUND" ? "notFound" : "error");
        return;
      }
      const copy = seriesCardCopy(listed.item, language);
      const productsListed = await listPublicProductsForSeries(listed.item.id);
      if (cancelled) return;
      if (!productsListed.ok) {
        setSeries(copy);
        setStatus("error");
        return;
      }
      const names = await loadCatalogNameMap(productsListed.items);
      if (cancelled) return;
      setSeries(copy);
      setProducts(productsListed.items.map((item) => toPublicInstrument(item, names)).filter(Boolean));
      setStatus("ready");
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [language, reloadToken, slug]);

  const image = series?.imagePath ? mediaUrl(series.imagePath) : "";

  return (
    <article className="bg-charcoal pb-24 lg:pb-32">
      <div className="mx-auto max-w-7xl px-6 pt-10 lg:px-10 lg:pt-14">
        <nav aria-label={t("seriesDetail.breadcrumb")} className="text-[11px] uppercase tracking-[0.22em] text-muted">
          <Link to="/" className="text-gold transition-colors hover:text-gold-light">
            {t("seriesDetail.breadcrumbHome")}
          </Link>
          <span className="mx-3 text-white/30" aria-hidden="true">
            /
          </span>
          <span className="text-ivory">{series?.name || t("seriesDetail.fallbackName")}</span>
        </nav>
      </div>

      {status === "loading" ? (
        <p className="mx-auto mt-16 max-w-7xl px-6 text-sm text-muted lg:px-10">{t("seriesDetail.loading")}</p>
      ) : null}

      {status === "error" ? (
        <div className="mx-auto mt-16 max-w-7xl space-y-4 px-6 lg:px-10">
          <p className="text-sm text-muted">{t("seriesDetail.error")}</p>
          <Button type="button" variant="outline" onClick={retry}>
            {t("seriesDetail.retry")}
          </Button>
        </div>
      ) : null}

      {status === "notFound" ? (
        <div className="mx-auto mt-16 max-w-7xl space-y-6 px-6 lg:px-10">
          <h1 className="font-display text-4xl tracking-wide text-ivory">{t("seriesDetail.notFound")}</h1>
          <div className="flex flex-wrap gap-4">
            <Button to="/guitars" variant="outline">
              {t("seriesDetail.backGuitars")}
            </Button>
            <Button to="/" variant="outline">
              {t("seriesDetail.backHome")}
            </Button>
          </div>
        </div>
      ) : null}

      {status === "ready" && series ? (
        <>
          <section className="mx-auto mt-10 grid max-w-7xl gap-10 px-6 lg:mt-14 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:items-start lg:gap-16 lg:px-10">
            <div className="overflow-hidden border border-white/8 bg-ink">
              <FitImage src={image} alt={series.name} fit="contain" frameClassName="aspect-[4/5] w-full" />
            </div>
            <div className="lg:pt-4">
              <p className="text-[11px] uppercase tracking-[0.32em] text-gold">{t("seriesDetail.eyebrow")}</p>
              <h1 className="mt-4 font-display text-4xl tracking-wide text-ivory sm:text-5xl">{series.name}</h1>
              {series.shortDescription ? (
                <p className="mt-5 text-lg leading-relaxed text-ivory/80">{series.shortDescription}</p>
              ) : null}
              {series.description ? (
                <div className="mt-8 border-t border-white/8 pt-8">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-gold">{t("seriesDetail.fullDescription")}</p>
                  <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-muted sm:text-base">
                    {series.description}
                  </p>
                </div>
              ) : null}
              <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button to="/guitars" variant="outline">
                  {t("seriesDetail.backGuitars")}
                </Button>
                <Link
                  to="/"
                  className="inline-flex w-fit text-[11px] uppercase tracking-[0.22em] text-gold transition-colors hover:text-gold-light"
                >
                  {t("seriesDetail.backHome")}
                </Link>
              </div>
            </div>
          </section>

          <section className="mx-auto mt-20 max-w-7xl px-6 lg:mt-28 lg:px-10">
            <p className="text-[11px] uppercase tracking-[0.32em] text-gold">{t("seriesDetail.productsEyebrow")}</p>
            <h2 className="mt-4 font-display text-3xl tracking-wide text-ivory sm:text-4xl">
              {t("seriesDetail.productsTitle")}
            </h2>
            {products.length === 0 ? (
              <p className="mt-10 text-sm text-muted">{t("seriesDetail.productsEmpty")}</p>
            ) : (
              <div className="mt-12 grid gap-8 md:grid-cols-2 xl:grid-cols-3">
                {products.map((guitar) => (
                  <CollectionCard key={guitar.id} guitar={guitar} showPrice />
                ))}
              </div>
            )}
          </section>
        </>
      ) : null}
    </article>
  );
}
