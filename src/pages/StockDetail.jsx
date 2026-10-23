import { useCallback, useEffect, useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import BackLink from "../components/BackLink.jsx";
import Button from "../components/Button.jsx";
import ProductPrice from "../components/ProductPrice.jsx";
import GuitarGallery from "../components/guitars/GuitarGallery.jsx";
import SpecTabs from "../components/guitars/SpecTabs.jsx";
import PageHeader from "../components/PageHeader.jsx";
import { PRODUCT_TYPES, readProductType } from "../auth/productSpecs.js";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import { getPublicProduct, loadCatalogNameMap } from "../services/publicProductService.js";
import { contactPagePath } from "../services/contactInquiry.js";
import { toPublicInstrument } from "../services/productView.js";

export default function StockDetail() {
  const { slug } = useParams();
  const { t } = useLanguage();
  const [item, setItem] = useState(null);
  const [productType, setProductType] = useState(null);
  const [status, setStatus] = useState("loading");
  const [reloadToken, setReloadToken] = useState(0);
  const retry = useCallback(() => setReloadToken((current) => current + 1), []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setStatus("loading");
      setItem(null);
      setProductType(null);
      const result = await getPublicProduct(slug);
      if (cancelled) return;
      if (!result.ok) {
        setStatus(result.code === "NOT_FOUND" ? "notFound" : "error");
        return;
      }
      const names = await loadCatalogNameMap([result.item]);
      if (cancelled) return;
      setProductType(readProductType(result.item));
      setItem(toPublicInstrument(result.item, names));
      setStatus("ready");
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [slug, reloadToken]);

  if (status === "loading") {
    return <PageHeader title={t("stock.title")} description={t("stock.detail.loading")} />;
  }

  if (status === "error") {
    return (
      <>
        <PageHeader title={t("stock.title")} description={t("stock.detail.error")} />
        <div className="mx-auto max-w-7xl space-y-4 px-6 pb-24 lg:px-10">
          <Button type="button" variant="outline" onClick={retry}>
            {t("stock.retry")}
          </Button>
        </div>
      </>
    );
  }

  if (status === "ready" && productType === PRODUCT_TYPES.CUSTOM_ORDER) {
    return <Navigate to={`/guitars/${slug}`} replace />;
  }

  if (status !== "ready" || productType !== PRODUCT_TYPES.READY_STOCK || !item) {
    return (
      <>
        <PageHeader title={t("stock.title")} description={t("stock.detail.notFound")} />
        <div className="mx-auto max-w-7xl px-6 pb-24 lg:px-10">
          <BackLink to="/in-stock" label={t("stock.detail.back")} />
        </div>
      </>
    );
  }

  const sold = item.availability === "sold";
  const inquiryTo = contactPagePath({
    type: "ready-stock",
    product: item.id,
    productRef: item.name,
  });

  return (
    <article className="bg-charcoal pb-16">
      <div className="mx-auto max-w-7xl px-6 pt-8 lg:px-10 lg:pt-10">
        <BackLink to="/in-stock" label={t("stock.detail.back")} />
      </div>

      <div className="mx-auto mt-6 grid max-w-7xl grid-cols-1 gap-8 px-6 lg:grid-cols-2 lg:grid-rows-[auto_1fr] lg:items-start lg:gap-x-10 lg:gap-y-10 lg:px-10">
        <div className="order-1 min-w-0 lg:order-none lg:col-start-2 lg:row-start-1">
          <div className="flex flex-wrap items-center gap-3">
            {item.typeLabel ? (
              <p className="text-[11px] uppercase tracking-[0.28em] text-gold">{item.typeLabel}</p>
            ) : null}
            <p className={`text-[10px] uppercase tracking-[0.2em] ${sold ? "text-ivory/70" : "text-gold"}`}>
              {t(`stock.status.${item.availability}`)}
            </p>
          </div>
          <h1 className="mt-3 font-display text-4xl tracking-wide text-ivory sm:text-5xl">{item.name}</h1>
          {item.description ? <p className="mt-4 text-sm leading-relaxed text-ivory/80 sm:text-base">{item.description}</p> : null}
          <ProductPrice product={item} />
        </div>

        <div className="order-2 min-w-0 lg:order-none lg:col-start-1 lg:row-span-2 lg:row-start-1">
          <GuitarGallery guitar={item} />
        </div>

        <div className="order-3 min-w-0 lg:order-none lg:col-start-2 lg:row-start-2">
          <SpecTabs guitar={item} />
          <div className="mt-6">
            {sold ? (
              <div className="space-y-4">
                <p className="text-sm leading-relaxed text-muted">{t("stock.detail.soldMessage")}</p>
                <Button to={inquiryTo} variant="outline">
                  {t("stock.detail.enquireSimilar")}
                </Button>
              </div>
            ) : (
              <Button to={inquiryTo}>{t("stock.detail.enquire")}</Button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
