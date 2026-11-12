import Button from "../components/Button.jsx";
import PageHeader from "../components/PageHeader.jsx";
import StockCard from "../components/stock/StockCard.jsx";
import { PRODUCT_TYPES } from "../auth/productSpecs.js";
import { usePublicCatalog } from "../hooks/usePublicCatalog.js";
import { useLanguage } from "../i18n/LanguageContext.jsx";

export default function InStock() {
  const { t } = useLanguage();
  const { items, status, retry } = usePublicCatalog(PRODUCT_TYPES.READY_STOCK);

  return (
    <>
      <PageHeader title={t("stock.title")} description={t("stock.description")} />
      <section className="page-end">
        <div className="page-follow mx-auto max-w-7xl px-6 lg:px-10">
          {status === "loading" ? (
            <p className="text-sm text-muted">{t("stock.loading")}</p>
          ) : null}
          {status === "error" ? (
            <div className="space-y-4">
              <p className="text-sm text-muted">{t("stock.error")}</p>
              <Button type="button" variant="outline" onClick={retry}>
                {t("stock.retry")}
              </Button>
            </div>
          ) : null}
          {status === "ready" && items.length === 0 ? (
            <p className="text-sm text-muted">{t("stock.empty")}</p>
          ) : null}
          {status === "ready" && items.length > 0 ? (
            <div className="grid items-stretch gap-x-8 gap-y-10 overflow-visible md:grid-cols-2 xl:grid-cols-3">
              {items.map((item) => (
                <StockCard key={item.id} item={item} />
              ))}
            </div>
          ) : null}
        </div>
      </section>
    </>
  );
}
