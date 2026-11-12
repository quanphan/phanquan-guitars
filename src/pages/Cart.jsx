import { Link } from "react-router-dom";
import Button from "../components/Button.jsx";
import CartSocialShare from "../components/cart/CartSocialShare.jsx";
import FitImage from "../components/FitImage.jsx";
import PageHeader from "../components/PageHeader.jsx";
import { mediaUrl } from "../config/api.js";
import { useCart } from "../cart/CartContext.jsx";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import { formatStoredPrice } from "../services/formatPrice.js";
import { localizedCategory, localizedTitle, optionSummary } from "../services/serviceCart.js";

const selectClass =
  "box-border h-9 w-[180px] max-w-full shrink-0 border border-white/15 bg-ink px-2 text-sm font-sans font-normal normal-case tracking-normal text-ivory";
const qtyClass =
  "box-border h-9 w-16 shrink-0 border border-white/15 bg-ink px-2 text-center text-sm font-sans font-normal normal-case tracking-normal text-ivory";

function optionLabel(option, language) {
  return language === "vi" ? option.labelVi || option.labelEn : option.labelEn || option.labelVi;
}

function groupName(group, language) {
  return language === "vi" ? group.nameVi || group.nameEn : group.nameEn || group.nameVi;
}

export default function Cart() {
  const { t, language } = useLanguage();
  const { cart, updateItem, removeItem } = useCart();
  const items = cart.items || [];
  const hasUnavailable = items.some((item) => item.unavailable);
  const hasPriceChanges = items.some((item) => item.priceChanged);

  return (
    <>
      <PageHeader eyebrow={t("cart.eyebrow")} title={t("cart.title")} description={t("cart.description")}>
        <div className="mt-6 max-w-2xl">
          <p className="text-[10px] uppercase tracking-[0.22em] text-gold">{t("cart.repairPricingLabel")}</p>
          <p className="mt-2 text-sm leading-relaxed text-muted">{t("cart.repairPricing")}</p>
        </div>
      </PageHeader>
      <section className="page-end">
        <div className="page-follow mx-auto max-w-5xl min-w-0 px-6 lg:px-10">
          {hasUnavailable ? (
            <p className="mb-4 text-sm text-gold" role="alert">
              {t("cart.unavailableItems")}
            </p>
          ) : null}
          {hasPriceChanges ? (
            <p className="mb-4 text-sm text-gold" role="alert">
              {t("cart.priceChangedItems")}
            </p>
          ) : null}
          {items.length === 0 ? (
            <div className="border border-white/10 px-5 py-8">
              <p className="text-sm text-muted">{t("cart.empty")}</p>
              <Button to="/services" className="mt-6">
                {t("cart.continue")}
              </Button>
            </div>
          ) : (
            <>
              <ul className="space-y-2">
                {items.map((item) => (
                  <li key={item.lineId} className="overflow-hidden border border-white/10 bg-panel/40 p-2.5 sm:p-3">
                    <div className="flex min-w-0 gap-3">
                      {item.imagePath ? (
                        <FitImage
                          src={mediaUrl(item.imagePath)}
                          alt=""
                          fit="contain"
                          frameClassName="h-16 w-16 shrink-0 sm:h-[4.5rem] sm:w-[4.5rem]"
                        />
                      ) : null}
                      <div className="min-w-0 flex-1">
                        <h2 className="font-display text-[1.375rem] font-medium leading-snug tracking-wide text-ivory sm:text-[1.625rem]">
                          {localizedTitle(item, language)}
                        </h2>
                        <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-muted">
                          {localizedCategory(item, language)}
                        </p>
                        {(item.optionGroups || []).length > 0 ? (
                          <div className="mt-2.5 flex min-w-0 flex-col gap-2">
                            {item.optionGroups.map((group) => (
                              <label
                                key={group.id}
                                className="flex min-w-0 max-w-full flex-wrap items-center gap-x-3.5 gap-y-2.5 text-[10px] uppercase tracking-[0.14em] text-gold"
                              >
                                <span className="shrink-0">{groupName(group, language)}</span>
                                <select
                                  className={selectClass}
                                  disabled={item.unavailable}
                                  value={item.optionValueIds?.find((id) => group.values.some((value) => value.id === id)) || ""}
                                  onChange={(event) => {
                                    const next = (item.optionValueIds || []).filter(
                                      (id) => !group.values.some((value) => value.id === id),
                                    );
                                    next.push(event.target.value);
                                    void updateItem(item.lineId, { optionValueIds: next });
                                  }}
                                >
                                  {group.values.map((value) => (
                                    <option key={value.id} value={value.id}>
                                      {optionLabel(value, language)}
                                    </option>
                                  ))}
                                </select>
                              </label>
                            ))}
                          </div>
                        ) : optionSummary(item, language).length ? (
                          <p className="mt-2.5 truncate text-xs text-muted">
                            {optionSummary(item, language).join(" · ")}
                          </p>
                        ) : null}
                        <div className="mt-2 flex min-w-0 flex-wrap items-center gap-x-4 gap-y-1.5 sm:flex-nowrap">
                          <p className="min-w-0 shrink-0 text-sm text-gold">
                            {item.unavailable
                              ? t("cart.unavailableItem")
                              : item.priceOnRequest
                                ? t("cart.priceOnRequest")
                                : formatStoredPrice(item.unitPrice, item.currency)}
                            {item.priceChanged && !item.unavailable
                              ? ` · ${t("cart.priceChangedItem")} ${formatStoredPrice(item.currentUnitPrice, item.currency)}`
                              : ""}
                          </p>
                          {item.indicative && !item.unavailable ? (
                            <p className="w-full text-[10px] uppercase tracking-[0.14em] text-muted">{t("cart.indicativePrice")}</p>
                          ) : null}
                          <label className="inline-flex shrink-0 items-center gap-3.5 text-[10px] uppercase tracking-[0.14em] text-gold">
                            {t("cart.quantity")}
                            <input
                              type="number"
                              min="1"
                              max="99"
                              disabled={item.unavailable}
                              value={item.quantity}
                              onChange={(event) => {
                                const quantity = Number(event.target.value);
                                if (Number.isInteger(quantity) && quantity >= 1 && quantity <= 99) {
                                  void updateItem(item.lineId, { quantity });
                                }
                              }}
                              className={qtyClass}
                            />
                          </label>
                          <button
                            type="button"
                            onClick={() => void removeItem(item.lineId)}
                            className="shrink-0 text-[11px] uppercase tracking-[0.16em] text-gold/80 hover:text-gold-light"
                          >
                            {t("cart.remove")}
                          </button>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="mt-8 border border-white/10 bg-panel/40 p-5">
                <p className="text-[11px] uppercase tracking-[0.22em] text-gold">{t("cart.summary")}</p>
                <p className="mt-2 text-lg text-ivory">
                  {cart.quotationRequired
                    ? t("cart.quotationRequired")
                    : formatStoredPrice(cart.subtotal, items[0]?.currency) || t("cart.quotationRequired")}
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Button to="/services" variant="outline">
                    {t("cart.continue")}
                  </Button>
                  <Button to="/cart/request" disabled={hasUnavailable}>
                    {t("cart.checkout")}
                  </Button>
                </div>
                <CartSocialShare cart={cart} />
              </div>
            </>
          )}
          <p className="mt-6">
            <Link to="/services" className="text-[11px] uppercase tracking-[0.22em] text-gold hover:text-gold-light">
              {t("cart.backServices")}
            </Link>
          </p>
        </div>
      </section>
    </>
  );
}
