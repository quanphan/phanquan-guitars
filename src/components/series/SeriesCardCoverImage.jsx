import CatalogCardCoverImage, { CATALOG_CARD_COVER_FRAME } from "../cards/CatalogCardCoverImage.jsx";
import { seriesCardImagePosition } from "../../data/seriesCardImage.js";

export const SERIES_CARD_IMAGE_FRAME = CATALOG_CARD_COVER_FRAME;

export default function SeriesCardCoverImage({ src, alt = "", series }) {
  return <CatalogCardCoverImage src={src} alt={alt} position={seriesCardImagePosition(series)} />;
}
