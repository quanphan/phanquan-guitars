import { useLanguage } from "../../i18n/LanguageContext.jsx";
import { publicProductHref } from "../../services/productView.js";
import CatalogCardCoverImage, { CATALOG_CARD_COVER_FRAME } from "../cards/CatalogCardCoverImage.jsx";
import CatalogCardFrame from "../cards/CatalogCardFrame.jsx";
import { catalogCard } from "../cards/catalogCardChrome.js";
import ProductPrice from "../ProductPrice.jsx";
import CardSpecSummary from "../guitars/CardSpecSummary.jsx";
import Reveal from "../Reveal.jsx";

export default function StockCard({ item }) {
  const { t } = useLanguage();
  const image = item.images?.[0];
  const href = publicProductHref(item);
  const sold = item.availability === "sold";
  const name = item.name;
  const typeLabel = item.typeLabel;
  const description = item.description;

  return (
    <Reveal className="group h-full [@media(hover:hover)_and_(pointer:fine)]:hover:z-20">
      <CatalogCardFrame href={href}>
        <div className="relative shrink-0">
          {image?.src ? (
            <CatalogCardCoverImage src={image.src} alt={name} className={sold ? "opacity-80" : ""} />
          ) : (
            <div className={`${CATALOG_CARD_COVER_FRAME} px-6 py-5`}>
              <p className="text-[11px] uppercase tracking-[0.22em] text-gold">{t("stock.title")}</p>
            </div>
          )}
          <p
            className={`absolute left-4 top-4 z-10 px-3 py-1 text-[10px] uppercase tracking-[0.2em] ${
              sold ? "bg-charcoal/85 text-ivory/80" : "bg-gold/90 text-charcoal"
            }`}
          >
            {t(`stock.status.${item.availability}`)}
          </p>
        </div>
        <div className={`${catalogCard.copy} pb-6`}>
          <p className="min-h-[1rem] text-[11px] uppercase tracking-[0.22em] text-gold">{typeLabel || "\u00a0"}</p>
          <h3 className={`${catalogCard.title} mt-5 min-h-[1.25em]`}>{name}</h3>
          <p className="mt-2 line-clamp-2 min-h-[2.5em] text-sm leading-relaxed text-muted">
            {description || "\u00a0"}
          </p>
          <div className="mt-3 min-h-7">
            <ProductPrice product={item} className="text-lg text-ivory" />
          </div>
          <CardSpecSummary guitar={item} t={t} layout="product" className="mt-4" />
        </div>
      </CatalogCardFrame>
    </Reveal>
  );
}
