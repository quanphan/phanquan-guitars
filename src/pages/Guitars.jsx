import CollectionCard from "../components/guitars/CollectionCard.jsx";
import CustomOptions from "../components/guitars/CustomOptions.jsx";
import GuitarsCta from "../components/guitars/GuitarsCta.jsx";
import GuitarsProcess from "../components/guitars/GuitarsProcess.jsx";
import Button from "../components/Button.jsx";
import PageHeader from "../components/PageHeader.jsx";
import { PRODUCT_TYPES } from "../auth/productSpecs.js";
import { usePublicCatalog } from "../hooks/usePublicCatalog.js";
import { useLanguage } from "../i18n/LanguageContext.jsx";

export default function Guitars() {
  const { t } = useLanguage();
  const { items, status, retry } = usePublicCatalog(PRODUCT_TYPES.CUSTOM_ORDER);

  return (
    <>
      <PageHeader
        eyebrow={t("guitars.hero.eyebrow")}
        title={t("pages.guitars.title")}
        description={t("guitars.hero.description")}
      />
      <section id="collection" className="scroll-mt-24 pb-24 lg:pb-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-10">
          {status === "loading" ? (
            <p className="mt-8 text-sm text-muted">{t("guitars.collection.loading")}</p>
          ) : null}
          {status === "error" ? (
            <div className="mt-8 space-y-4">
              <p className="text-sm text-muted">{t("guitars.collection.error")}</p>
              <Button type="button" variant="outline" onClick={retry}>
                {t("guitars.collection.retry")}
              </Button>
            </div>
          ) : null}
          {status === "ready" && items.length === 0 ? (
            <p className="mt-8 text-sm text-muted">{t("guitars.collection.empty")}</p>
          ) : null}
          {status === "ready" && items.length > 0 ? (
            <div className="mt-8 grid gap-8 md:grid-cols-2 xl:grid-cols-3">
              {items.map((guitar) => (
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
