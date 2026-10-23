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

export default function GuitarDetail() {
  const { id } = useParams();
  const { t } = useLanguage();
  const [guitar, setGuitar] = useState(null);
  const [productType, setProductType] = useState(null);
  const [status, setStatus] = useState("loading");
  const [reloadToken, setReloadToken] = useState(0);
  const retry = useCallback(() => setReloadToken((current) => current + 1), []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setStatus("loading");
      setGuitar(null);
      setProductType(null);
      const result = await getPublicProduct(id);
      if (cancelled) return;
      if (!result.ok) {
        setStatus(result.code === "NOT_FOUND" ? "notFound" : "error");
        return;
      }
      const names = await loadCatalogNameMap([result.item]);
      if (cancelled) return;
      setProductType(readProductType(result.item));
      setGuitar(toPublicInstrument(result.item, names));
      setStatus("ready");
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [id, reloadToken]);

  if (status === "loading") {
    return <PageHeader title={t("pages.guitars.title")} description={t("guitars.detail.loading")} />;
  }

  if (status === "error") {
    return (
      <>
        <PageHeader title={t("pages.guitars.title")} description={t("guitars.detail.error")} />
        <div className="mx-auto max-w-7xl space-y-4 px-6 pb-24 lg:px-10">
          <Button type="button" variant="outline" onClick={retry}>
            {t("guitars.collection.retry")}
          </Button>
        </div>
      </>
    );
  }

  if (status === "ready" && productType === PRODUCT_TYPES.READY_STOCK) {
    return <Navigate to={`/in-stock/${id}`} replace />;
  }

  if (status !== "ready" || productType !== PRODUCT_TYPES.CUSTOM_ORDER || !guitar) {
    return (
      <>
        <PageHeader title={t("pages.guitars.title")} description={t("guitars.detail.notFound")} />
        <div className="mx-auto max-w-7xl px-6 pb-24 lg:px-10">
          <BackLink to="/guitars" label={t("guitars.detail.back")} />
        </div>
      </>
    );
  }

  return (
    <article className="bg-charcoal pb-16">
      <div className="mx-auto max-w-7xl px-6 pt-8 lg:px-10 lg:pt-10">
        <BackLink to="/guitars" label={t("guitars.detail.back")} />
      </div>

      <div className="mx-auto mt-6 grid max-w-7xl grid-cols-1 gap-8 px-6 lg:grid-cols-2 lg:grid-rows-[auto_1fr] lg:items-start lg:gap-x-10 lg:gap-y-10 lg:px-10">
        <div className="order-1 min-w-0 lg:order-none lg:col-start-2 lg:row-start-1">
          {guitar.typeLabel ? (
            <p className="text-[11px] uppercase tracking-[0.28em] text-gold">{guitar.typeLabel}</p>
          ) : null}
          <h1 className="mt-3 font-display text-4xl tracking-wide text-ivory sm:text-5xl">{guitar.name}</h1>
          {guitar.description ? (
            <p className="mt-4 text-sm leading-relaxed text-ivory/80 sm:text-base">{guitar.description}</p>
          ) : null}
          <ProductPrice product={guitar} />
        </div>

        <div className="order-2 min-w-0 lg:order-none lg:col-start-1 lg:row-span-2 lg:row-start-1">
          <GuitarGallery guitar={guitar} />
        </div>

        <div className="order-3 min-w-0 lg:order-none lg:col-start-2 lg:row-start-2">
          <SpecTabs guitar={guitar} />
          <div className="mt-6">
            <Button
              to={contactPagePath({ type: "custom-guitar", product: guitar.id, productRef: guitar.name })}
            >
              {t("guitars.detail.enquire")}
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
}
