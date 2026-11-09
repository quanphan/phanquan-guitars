import CollectionCard from "../components/guitars/CollectionCard.jsx";
import CustomOptions from "../components/guitars/CustomOptions.jsx";
import GuitarsCta from "../components/guitars/GuitarsCta.jsx";
import GuitarsProcess from "../components/guitars/GuitarsProcess.jsx";
import Button from "../components/Button.jsx";
import PageHeader from "../components/PageHeader.jsx";
import { usePublicGuitarList } from "../hooks/usePublicGuitarList.js";
import { useLanguage } from "../i18n/LanguageContext.jsx";

export default function Guitars() {
  const { t } = useLanguage();
  const { items, status, error, retry, hasMore, loadMore, loadingMore } = usePublicGuitarList();
  const collectionEmpty = status === "ready" && items.length === 0 ? t("guitars.collection.empty") : null;

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
              <Button type="button" variant="outline" onClick={() => void loadMore()} disabled={loadingMore}>
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
