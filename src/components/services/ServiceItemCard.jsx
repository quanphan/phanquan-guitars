import { useMemo, useState } from "react";
import ProductPrice from "../ProductPrice.jsx";
import ServiceHtml from "./ServiceHtml.jsx";
import { mediaUrl } from "../../config/api.js";
import { ImageSkeleton } from "../ContentImage.jsx";
import CatalogCardCoverImage, { CATALOG_CARD_COVER_FRAME } from "../cards/CatalogCardCoverImage.jsx";
import { CatalogCardShell } from "../cards/CatalogCardFrame.jsx";
import { catalogCard } from "../cards/catalogCardChrome.js";
import { useCart } from "../../cart/CartContext.jsx";
import {
  optionGroupLabel,
  optionValueLabel,
  resolveServiceItemPrice,
  serviceLocale,
} from "../../data/services.js";
import { useLanguage } from "../../i18n/LanguageContext.jsx";
import { fieldClass } from "../auth/Field.jsx";
import Reveal from "../Reveal.jsx";
import { isCartCategory } from "../../services/serviceCart.js";

function ServiceItemMedia({ src, alt }) {
  if (!src) {
    return <ImageSkeleton className={CATALOG_CARD_COVER_FRAME} />;
  }

  return <CatalogCardCoverImage src={src} alt={alt} />;
}

export default function ServiceItemCard({ item, categorySlug }) {
  const { t, language } = useLanguage();
  const copy = serviceLocale(item, language);
  const heading = copy.title || item.title;
  const groups = Array.isArray(item.optionGroups) ? item.optionGroups : [];
  const [selected, setSelected] = useState(() => groups.map((group) => group.values?.[0]?.id || ""));
  const [feedback, setFeedback] = useState("");
  const [saving, setSaving] = useState(false);
  const cartEnabled = isCartCategory(categorySlug);
  const { addItem } = useCart();
  const imageSrc = item.imagePath ? mediaUrl(item.imagePath) : "";

  const price = useMemo(
    () => resolveServiceItemPrice(item, selected),
    [item, selected],
  );

  async function onAdd() {
    if (!cartEnabled || saving) return;
    setSaving(true);
    setFeedback("");
    const result = await addItem({
      serviceItemId: item.id,
      optionValueIds: selected.filter(Boolean),
      quantity: 1,
    });
    setSaving(false);
    setFeedback(result.ok ? "added" : result.code || "failure");
  }

  return (
    <Reveal className="group h-full [@media(hover:hover)_and_(pointer:fine)]:hover:z-20">
      <CatalogCardShell>
        <ServiceItemMedia src={imageSrc} alt={heading} />
        <div className={`${catalogCard.copy} flex-1 pb-5`}>
          <h2 className="font-display text-2xl leading-tight tracking-wide text-ivory sm:text-3xl">{heading}</h2>
          <div className="mt-1.5 line-clamp-2 overflow-hidden text-sm leading-snug text-muted">
            {copy.html ? (
              <ServiceHtml html={copy.html} className="leading-snug [&_h3]:mt-0 [&_p]:my-0 [&_p+p]:mt-1 [&_li]:my-0" />
            ) : (
              "\u00a0"
            )}
          </div>
          <div className="mt-3 flex min-w-0 flex-wrap items-center justify-between gap-x-3 gap-y-2">
            {price == null ? (
              <p className="min-w-0 text-lg text-gold">{t("cart.priceOnRequest")}</p>
            ) : (
              <ProductPrice product={{ price, currency: item.currency }} className="min-w-0 text-lg text-gold" />
            )}
            {cartEnabled ? (
              <button
                type="button"
                onClick={() => void onAdd()}
                disabled={saving}
                className="ml-auto inline-flex min-h-11 shrink-0 cursor-pointer items-center justify-center whitespace-nowrap border border-gold/70 bg-transparent px-3.5 text-[10px] font-medium uppercase tracking-[0.16em] text-ivory transition-colors duration-300 hover:border-gold hover:bg-gold/10 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? t("cart.adding") : t("cart.add")}
              </button>
            ) : null}
          </div>
          {groups.length > 0 ? (
            <div className="mt-4 space-y-4">
              {groups.map((group, groupIndex) => {
                const name = optionGroupLabel(group, language);
                const values = group.values || [];
                const useSelect = values.length > 8;
                return (
                  <fieldset key={group.id || name}>
                    <legend className="text-[11px] uppercase tracking-[0.18em] text-gold">{name}</legend>
                    {useSelect ? (
                      <select
                        className={`${fieldClass} mt-2`}
                        aria-label={name}
                        value={selected[groupIndex] || ""}
                        onChange={(event) => {
                          setSelected((current) => current.map((id, index) => (index === groupIndex ? event.target.value : id)));
                        }}
                      >
                        {values.map((value) => (
                          <option key={value.id} value={value.id}>
                            {optionValueLabel(value, language)}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {values.map((value) => {
                          const active = selected[groupIndex] === value.id;
                          return (
                            <button
                              key={value.id}
                              type="button"
                              aria-pressed={active}
                              className={`border px-3 py-2 text-sm ${
                                active
                                  ? "border-gold bg-gold/15 text-ivory"
                                  : "border-white/15 text-muted hover:border-gold/50 hover:text-ivory"
                              }`}
                              onClick={() => {
                                setSelected((current) => current.map((id, index) => (index === groupIndex ? value.id : id)));
                              }}
                            >
                              {optionValueLabel(value, language)}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </fieldset>
                );
              })}
            </div>
          ) : null}
          {cartEnabled && feedback === "added" ? (
            <p className="mt-2 text-sm text-gold" role="status">
              {t("cart.added")}
            </p>
          ) : null}
          {cartEnabled && feedback && feedback !== "added" ? (
            <p className="mt-2 text-sm text-gold" role="alert">
              {t("cart.addFailed")}
            </p>
          ) : null}
        </div>
      </CatalogCardShell>
    </Reveal>
  );
}
