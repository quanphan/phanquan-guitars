import { useEffect, useMemo, useState } from "react";
import ProductPrice from "../ProductPrice.jsx";
import ServiceHtml from "./ServiceHtml.jsx";
import { mediaUrl } from "../../config/api.js";
import { ImageSkeleton } from "../ContentImage.jsx";
import FitImage from "../FitImage.jsx";
import { useCart } from "../../cart/CartContext.jsx";
import {
  optionGroupLabel,
  optionValueLabel,
  resolveServiceItemPrice,
  serviceCardImageFit,
  serviceLocale,
} from "../../data/services.js";
import { useLanguage } from "../../i18n/LanguageContext.jsx";
import { fieldClass } from "../auth/Field.jsx";
import { isCartCategory } from "../../services/serviceCart.js";

function ServiceItemMedia({ src, alt }) {
  const [fit, setFit] = useState("cover");

  useEffect(() => {
    if (!src) {
      setFit("cover");
      return undefined;
    }
    let cancelled = false;
    const probe = new window.Image();
    probe.onload = () => {
      if (!cancelled) setFit(serviceCardImageFit(probe.naturalWidth, probe.naturalHeight));
    };
    probe.src = src;
    return () => {
      cancelled = true;
    };
  }, [src]);

  if (!src) {
    return <ImageSkeleton className="aspect-[4/3] w-full" />;
  }

  return (
    <FitImage
      src={src}
      alt={alt}
      fit={fit}
      frameClassName="aspect-[4/3] w-full bg-ink"
    />
  );
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
    <article className="flex h-full min-h-0 flex-col overflow-hidden border border-white/8 bg-panel/80 transition-colors duration-300 hover:border-gold/40">
      <ServiceItemMedia src={imageSrc} alt={heading} />
      <div className="flex flex-1 flex-col px-6 py-6">
        <h2 className="font-display text-2xl leading-snug tracking-wide text-ivory break-words">
          {heading}
        </h2>
        {copy.html ? (
          <div className="mt-3">
            <ServiceHtml html={copy.html} />
          </div>
        ) : null}
        {price == null ? (
          <p className="mt-4 text-lg text-gold">{t("cart.priceOnRequest")}</p>
        ) : (
          <ProductPrice product={{ price, currency: item.currency }} className="mt-4 text-lg text-gold" />
        )}
        {groups.length > 0 ? (
          <div className="mt-6 space-y-5">
            {groups.map((group, groupIndex) => {
              const name = optionGroupLabel(group, language);
              const values = group.values || [];
              const useSelect = values.length > 8;
              return (
                <fieldset key={group.id || name}>
                  <legend className="text-[11px] uppercase tracking-[0.18em] text-gold">{name}</legend>
                  {useSelect ? (
                    <select
                      className={`${fieldClass} mt-3`}
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
                    <div className="mt-3 flex flex-wrap gap-2">
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
        {cartEnabled ? (
          <div className="mt-auto flex flex-col gap-4 pt-6">
            <button
              type="button"
              onClick={() => void onAdd()}
              disabled={saving}
              className="inline-flex min-h-12 w-full items-center justify-center border border-gold bg-gold px-5 py-3 text-[11px] uppercase tracking-[0.22em] text-charcoal transition-colors hover:bg-gold-light disabled:opacity-50"
            >
              {saving ? t("cart.adding") : t("cart.add")}
            </button>
            {feedback === "added" ? (
              <p className="text-sm text-gold" role="status">
                {t("cart.added")}
              </p>
            ) : null}
            {feedback && feedback !== "added" ? (
              <p className="text-sm text-gold" role="alert">
                {t("cart.addFailed")}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
    </article>
  );
}
