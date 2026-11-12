import { catalogCard } from "./catalogCardChrome.js";

export const CATALOG_CARD_COVER_FRAME = "aspect-[16/9] w-full shrink-0 overflow-hidden bg-ink";

export default function CatalogCardCoverImage({ src, alt = "", position = "center", className = "" }) {
  if (!src) return null;

  return (
    <div className={`${CATALOG_CARD_COVER_FRAME} ${className}`.trim()}>
      <div
        role={alt ? "img" : undefined}
        aria-label={alt || undefined}
        aria-hidden={alt ? undefined : true}
        className={`h-full w-full bg-no-repeat ${catalogCard.image}`}
        style={{
          backgroundImage: `url(${JSON.stringify(src)})`,
          backgroundSize: "cover",
          backgroundPosition: position || "center",
        }}
      />
    </div>
  );
}
