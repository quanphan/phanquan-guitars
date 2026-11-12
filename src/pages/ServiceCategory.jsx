import { Fragment, useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import CatalogGridRowDividers from "../components/cards/CatalogGridRowDividers.jsx";
import Button from "../components/Button.jsx";
import PageHeader from "../components/PageHeader.jsx";
import ServiceItemCard from "../components/services/ServiceItemCard.jsx";
import { PRODUCT_GRID_BREAKPOINTS } from "../data/catalogGrid.js";
import { categoryFallbackKey, serviceLocale } from "../data/services.js";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import { getPublicServiceCategory } from "../services/serviceCatalog.js";

export default function ServiceCategory() {
  const { slug } = useParams();
  const { t, language } = useLanguage();
  const [status, setStatus] = useState("loading");
  const [category, setCategory] = useState(null);
  const [items, setItems] = useState([]);

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    getPublicServiceCategory(slug).then((result) => {
      if (cancelled) return;
      if (!result.ok) {
        const fallbackKey = categoryFallbackKey(slug);
        if (result.status === 404 && fallbackKey && fallbackKey !== "cnc") {
          setCategory({ slug, linkMode: "details", translations: {}, fallbackKey });
          setItems([]);
          setStatus("ready");
          return;
        }
        setCategory(null);
        setItems([]);
        setStatus(result.status === 404 ? "missing" : "error");
        return;
      }
      setCategory(result.category);
      setItems(result.items);
      setStatus("ready");
    });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (status === "missing") {
    if (slug === "3d-design-cnc") return <Navigate to="/contact" replace />;
    return <Navigate to="/services" replace />;
  }

  const locale = serviceLocale(category, language);
  const key = categoryFallbackKey(slug);
  const title = locale.name || (key ? t(`services.items.${key}.title`) : slug);
  const description = locale.description || "";

  return (
    <>
      <PageHeader title={title} description={description || t("services.detail.intro")}>
        <div className="mt-8">
          <Link to="/services" className="text-[11px] uppercase tracking-[0.22em] text-gold hover:text-gold-light">
            {t("services.detail.back")}
          </Link>
        </div>
      </PageHeader>

      <section className="page-end">
        <div className="page-follow mx-auto max-w-7xl px-6 lg:px-10">
          {status === "loading" ? (
            <p className="text-sm text-muted">{t("services.detail.loading")}</p>
          ) : null}
          {status === "error" ? (
            <p className="text-sm text-muted">{t("services.detail.error")}</p>
          ) : null}
          {status === "ready" && items.length === 0 ? (
            <p className="text-sm text-muted">{t("services.detail.empty")}</p>
          ) : null}
          {status === "ready" && items.length > 0 ? (
            <div className="grid items-stretch gap-x-8 gap-y-10 overflow-visible md:grid-cols-2 xl:grid-cols-3">
              {items.map((item, index) => (
                <Fragment key={item.id}>
                  <ServiceItemCard item={item} categorySlug={slug} />
                  <CatalogGridRowDividers index={index} count={items.length} breakpoints={PRODUCT_GRID_BREAKPOINTS} />
                </Fragment>
              ))}
            </div>
          ) : null}
          <div className="mt-12">
            <Button to="/contact" variant="outline">
              {t("services.contact")}
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
