import { useRef, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import Button from "../components/Button.jsx";
import CartSocialShare from "../components/cart/CartSocialShare.jsx";
import Field from "../components/auth/Field.jsx";
import PageHeader from "../components/PageHeader.jsx";
import { useCart } from "../cart/CartContext.jsx";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import { formatStoredPrice } from "../services/formatPrice.js";
import { localizedCategory, localizedTitle, optionSummary, validateQuoteRequest } from "../services/serviceCart.js";

export default function CartRequest() {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const { cart, submit, status } = useCart();
  const submittingRef = useRef(false);
  const [values, setValues] = useState({ name: "", email: "", phone: "", country: "", notes: "" });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [priceChanges, setPriceChanges] = useState([]);
  const [submittedId, setSubmittedId] = useState("");

  if (submittedId) {
    return <Navigate to={`/cart/confirmation/${encodeURIComponent(submittedId)}`} replace />;
  }

  if (!cart.items?.length && status !== "submitting") {
    return <Navigate to="/cart" replace />;
  }

  if (cart.items?.some((item) => item.unavailable) && status !== "submitting") {
    return <Navigate to="/cart" replace />;
  }

  function setField(name, value) {
    setValues((current) => ({ ...current, [name]: value }));
  }

  async function sendRequest({ acceptPriceChanges = false } = {}) {
    if (submittingRef.current) return;
    const nextErrors = validateQuoteRequest(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      setFormError("formIncomplete");
      return;
    }
    submittingRef.current = true;
    setFormError("");
    const result = await submit({
      name: values.name.trim(),
      email: values.email.trim(),
      phone: values.phone.trim(),
      country: values.country.trim(),
      notes: values.notes.trim(),
      acceptPriceChanges,
    });
    submittingRef.current = false;
    if (!result.ok) {
      if (result.code === "PRICE_CHANGED") {
        setPriceChanges(result.details || []);
        setFormError("PRICE_CHANGED");
        return;
      }
      const itemIssue = (result.details || []).some((item) => item.field === "items");
      setFormError(
        itemIssue ? "ITEMS_UNAVAILABLE" : result.code === "VALIDATION" ? "formIncomplete" : result.code || "failure",
      );
      return;
    }
    setSubmittedId(result.inquiry.id);
    navigate(`/cart/confirmation/${encodeURIComponent(result.inquiry.id)}`, { replace: true });
  }

  function onSubmit(event) {
    event.preventDefault();
    void sendRequest({ acceptPriceChanges: false });
  }

  return (
    <>
      <PageHeader eyebrow={t("cart.eyebrow")} title={t("cart.requestTitle")} description={t("cart.requestDescription")} />
      <section className="page-end">
        <div className="page-follow mx-auto grid max-w-6xl gap-10 px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-10">
          <form onSubmit={onSubmit} className="space-y-5">
            <Field
              id="quote-name"
              label={t("cart.fields.name")}
              value={values.name}
              onChange={(value) => setField("name", value)}
              autoComplete="name"
              error={errors.name ? t(`cart.errors.${errors.name}`) : ""}
            />
            <Field
              id="quote-email"
              label={t("cart.fields.email")}
              type="email"
              value={values.email}
              onChange={(value) => setField("email", value)}
              autoComplete="email"
              error={errors.email ? t(`cart.errors.${errors.email}`) : ""}
            />
            <Field
              id="quote-phone"
              label={t("cart.fields.phone")}
              type="tel"
              value={values.phone}
              onChange={(value) => setField("phone", value)}
              autoComplete="tel"
              error={errors.phone ? t(`cart.errors.${errors.phone}`) : ""}
            />
            <Field
              id="quote-country"
              label={t("cart.fields.country")}
              value={values.country}
              onChange={(value) => setField("country", value)}
              autoComplete="country-name"
            />
            <Field
              id="quote-notes"
              label={t("cart.fields.notes")}
              value={values.notes}
              onChange={(value) => setField("notes", value)}
              multiline
              rows={5}
              error={errors.notes ? t(`cart.errors.${errors.notes}`) : ""}
            />
            {formError ? (
              <p className="text-sm text-gold" role="alert">
                {t(`cart.errors.${formError}`) === `cart.errors.${formError}` ? t("cart.errors.failure") : t(`cart.errors.${formError}`)}
              </p>
            ) : null}
            {priceChanges.length ? (
              <ul className="space-y-2 text-sm text-muted">
                {priceChanges.map((change) => (
                  <li key={change.lineId || change.message}>
                    {change.message}: {formatStoredPrice(change.previous, change.currency)} →{" "}
                    {formatStoredPrice(change.current, change.currency)}
                  </li>
                ))}
              </ul>
            ) : null}
            <div className="flex flex-wrap gap-4">
              {formError === "PRICE_CHANGED" ? (
                <Button type="button" disabled={status === "submitting"} onClick={() => void sendRequest({ acceptPriceChanges: true })}>
                  {status === "submitting" ? t("cart.submitting") : t("cart.acceptUpdatedPrices")}
                </Button>
              ) : (
                <Button type="submit" disabled={status === "submitting"}>
                  {status === "submitting" ? t("cart.submitting") : t("cart.submit")}
                </Button>
              )}
              <Button to="/cart" variant="outline">
                {t("cart.backCart")}
              </Button>
            </div>
          </form>
          <aside className="border border-white/10 bg-panel/40 p-6">
            <p className="text-[11px] uppercase tracking-[0.22em] text-gold">{t("cart.confirmItems")}</p>
            <ul className="mt-5 space-y-4">
              {cart.items.map((item) => (
                <li key={item.lineId} className="border-b border-white/8 pb-4">
                  <p className="text-sm text-gold">{localizedCategory(item, language)}</p>
                  <p className="mt-1 text-ivory">{localizedTitle(item, language)}</p>
                  {optionSummary(item, language).map((line) => (
                    <p key={line} className="text-sm text-muted">
                      {line}
                    </p>
                  ))}
                  <p className="mt-2 text-sm text-muted">
                    {t("cart.quantity")}: {item.quantity}
                    {" · "}
                    {item.priceOnRequest ? t("cart.priceOnRequest") : formatStoredPrice(item.lineTotal, item.currency)}
                  </p>
                  {item.indicative ? <p className="mt-1 text-xs text-muted">{t("cart.indicativePrice")}</p> : null}
                </li>
              ))}
            </ul>
            <p className="mt-5 text-sm text-ivory">
              {cart.quotationRequired ? t("cart.quotationRequired") : formatStoredPrice(cart.subtotal, cart.items[0]?.currency)}
            </p>
            <CartSocialShare cart={cart} customer={values} />
          </aside>
        </div>
        <div className="mx-auto max-w-6xl px-6 pt-8 lg:px-10">
          <Link to="/cart" className="text-[11px] uppercase tracking-[0.22em] text-gold hover:text-gold-light">
            {t("cart.backCart")}
          </Link>
        </div>
      </section>
    </>
  );
}
