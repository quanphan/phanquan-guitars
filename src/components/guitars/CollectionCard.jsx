import { useLanguage } from "../../i18n/LanguageContext.jsx";
import { publicProductHref } from "../../services/productView.js";
import CatalogCardCoverImage, { CATALOG_CARD_COVER_FRAME } from "../cards/CatalogCardCoverImage.jsx";
import CatalogCardFrame from "../cards/CatalogCardFrame.jsx";
import { catalogCard } from "../cards/catalogCardChrome.js";
import ProductPrice from "../ProductPrice.jsx";
import Reveal from "../Reveal.jsx";
import CardSpecSummary from "./CardSpecSummary.jsx";

export default function CollectionCard({ guitar, showPrice = false }) {
  const { t } = useLanguage();
  const image = guitar.images?.[0];
  const name = guitar.name;
  const typeLabel = guitar.typeLabel;
  const description = guitar.description;
  const href = publicProductHref(guitar);

  return (
    <Reveal className="group h-full [@media(hover:hover)_and_(pointer:fine)]:hover:z-20">
      <CatalogCardFrame href={href}>
        {image?.src ? (
          <CatalogCardCoverImage src={image.src} alt={name} />
        ) : (
          <div className={`${CATALOG_CARD_COVER_FRAME} px-6 py-5`}>
            <p className="text-[11px] uppercase tracking-[0.22em] text-gold">{t("guitars.collection.title")}</p>
          </div>
        )}
        <div className={`${catalogCard.copy} pb-6`}>
          <p className="min-h-[1rem] text-[11px] uppercase tracking-[0.22em] text-gold">{typeLabel || "\u00a0"}</p>
          <h3 className={`${catalogCard.title} mt-5 min-h-[1.25em]`}>{name}</h3>
          <p className="mt-2 line-clamp-2 min-h-[2.5em] text-sm leading-relaxed text-muted">
            {description || "\u00a0"}
          </p>
          {showPrice ? <ProductPrice product={guitar} className="mt-3 min-h-7 text-lg text-ivory" /> : null}
          <CardSpecSummary guitar={guitar} t={t} layout="product" className="mt-4" />
        </div>
      </CatalogCardFrame>
    </Reveal>
  );
}
