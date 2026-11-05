import { useMemo, useState } from "react";
import ProductPrice from "../ProductPrice.jsx";
import ServiceHtml from "./ServiceHtml.jsx";
import { mediaUrl } from "../../config/api.js";
import {
  optionGroupLabel,
  optionValueLabel,
  resolveServiceItemPrice,
  serviceLocale,
} from "../../data/services.js";
import { useLanguage } from "../../i18n/LanguageContext.jsx";
import { fieldClass } from "../auth/Field.jsx";

export default function ServiceItemCard({ item }) {
  const { t, language } = useLanguage();
  const copy = serviceLocale(item, language);
  const heading = copy.title || item.title;
  const groups = Array.isArray(item.optionGroups) ? item.optionGroups : [];
  const [selected, setSelected] = useState(() => groups.map((group) => group.values?.[0]?.id || ""));

  const price = useMemo(
    () => resolveServiceItemPrice(item, selected),
    [item, selected],
  );

  return (
    <article className="border border-white/10 bg-panel/30 p-6">
      {item.imagePath ? (
        <img
          src={mediaUrl(item.imagePath)}
          alt={heading}
          className="aspect-[4/3] w-full object-cover"
        />
      ) : null}
      <h2 className="mt-5 font-display text-2xl tracking-wide text-ivory">{heading}</h2>
      <ProductPrice product={{ price, currency: item.currency }} className="mt-3 text-gold" />
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
          <p className="text-xs text-muted">{t("services.detail.optionsHint")}</p>
        </div>
      ) : null}
      <div className="mt-4">
        <ServiceHtml html={copy.html} />
      </div>
    </article>
  );
}
