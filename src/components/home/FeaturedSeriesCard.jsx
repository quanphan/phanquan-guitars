import { mediaUrl } from "../../config/api.js";
import { useLanguage } from "../../i18n/LanguageContext.jsx";
import CatalogCardFrame from "../cards/CatalogCardFrame.jsx";
import { catalogCard } from "../cards/catalogCardChrome.js";
import SeriesCardCoverImage, { SERIES_CARD_IMAGE_FRAME } from "../series/SeriesCardCoverImage.jsx";

export default function FeaturedSeriesCard({ series }) {
  const { t } = useLanguage();
  const image = series.imagePath ? mediaUrl(series.imagePath) : "";

  return (
    <div className="group h-full">
      <CatalogCardFrame href={series.href} actionLabel={t("home.featured.viewSeries")}>
        {image ? (
          <SeriesCardCoverImage src={image} alt={series.name} series={series} />
        ) : (
          <div className={`${SERIES_CARD_IMAGE_FRAME} px-6 py-5`}>
            <p className="text-[11px] uppercase tracking-[0.22em] text-gold">{t("home.featured.title")}</p>
          </div>
        )}
        <div className={catalogCard.copy}>
          <h3 className={catalogCard.title}>{series.name}</h3>
          <p className={catalogCard.description}>{series.shortDescription || "\u00a0"}</p>
        </div>
      </CatalogCardFrame>
    </div>
  );
}
