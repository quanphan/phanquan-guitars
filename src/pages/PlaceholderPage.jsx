import { Link } from "react-router-dom";
import PageHeader from "../components/PageHeader.jsx";
import { useLanguage } from "../i18n/LanguageContext.jsx";

export default function PlaceholderPage({ page }) {
  const { t } = useLanguage();

  return (
    <section className="pb-24">
      <PageHeader
        eyebrow="PhanQuan Guitars"
        title={t(`pages.${page}.title`)}
        description={t(`pages.${page}.description`)}
      >
        <Link
          to="/"
          className="mt-8 inline-flex text-[11px] uppercase tracking-[0.22em] text-gold hover:text-gold-light focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
        >
          {t("pages.backHome")}
        </Link>
      </PageHeader>
    </section>
  );
}
