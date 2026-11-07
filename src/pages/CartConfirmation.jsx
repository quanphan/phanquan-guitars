import { useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import Button from "../components/Button.jsx";
import PageHeader from "../components/PageHeader.jsx";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import { formatStoredPrice } from "../services/formatPrice.js";
import { localizedCategory, localizedTitle, optionSummary } from "../services/serviceCart.js";
import { fetchConfirmation, readConfirmation, readConfirmationReceipt } from "../services/serviceCartApi.js";

export default function CartConfirmation() {
  const { id } = useParams();
  const { t, language } = useLanguage();
  const cached = readConfirmation();
  const [inquiry, setInquiry] = useState(cached?.id === id ? cached : null);
  const [status, setStatus] = useState(inquiry ? "ready" : "loading");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const receipt = readConfirmationReceipt(id);
      if (!receipt) {
        if (!cancelled && !inquiry) setStatus("missing");
        return;
      }
      const result = await fetchConfirmation(id, receipt);
      if (cancelled) return;
      if (result.ok) {
        setInquiry(result.inquiry);
        setStatus("ready");
        return;
      }
      setStatus(inquiry ? "ready" : "missing");
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (status === "loading") {
    return (
      <PageHeader eyebrow={t("cart.successEyebrow")} title={t("cart.successTitle")} description={t("cart.successBody")} />
    );
  }

  if (status === "missing" || !inquiry?.id) {
    return <Navigate to="/cart" replace />;
  }

  return (
    <>
      <PageHeader eyebrow={t("cart.successEyebrow")} title={t("cart.successTitle")} description={t("cart.successBody")} />
      <section className="pb-24 lg:pb-32">
        <div className="mx-auto max-w-3xl px-6 pt-12 lg:px-10">
          <p className="text-[11px] uppercase tracking-[0.22em] text-gold">
            {t("cart.reference").replace("{reference}", inquiry.id)}
          </p>
          <dl className="mt-8 space-y-3 text-sm">
            <div>
              <dt className="text-gold">{t("cart.fields.name")}</dt>
              <dd className="text-ivory">{inquiry.customer?.name}</dd>
            </div>
            <div>
              <dt className="text-gold">{t("cart.fields.email")}</dt>
              <dd className="text-ivory">{inquiry.customer?.email}</dd>
            </div>
            <div>
              <dt className="text-gold">{t("cart.fields.phone")}</dt>
              <dd className="text-ivory">{inquiry.customer?.phone}</dd>
            </div>
            {inquiry.country ? (
              <div>
                <dt className="text-gold">{t("cart.fields.country")}</dt>
                <dd className="text-ivory">{inquiry.country}</dd>
              </div>
            ) : null}
          </dl>
          <ul className="mt-10 space-y-4">
            {(inquiry.items || []).map((item, index) => (
              <li key={`${item.serviceItemId}-${index}`} className="border border-white/10 p-4">
                <p className="text-[11px] uppercase tracking-[0.18em] text-gold">{localizedCategory(item, language)}</p>
                <p className="mt-2 text-ivory">{localizedTitle(item, language)}</p>
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
          <p className="mt-8 text-sm leading-relaxed text-muted">{t("cart.followUp")}</p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Button to="/services">{t("cart.continue")}</Button>
            <Link to="/contact" className="inline-flex items-center text-[11px] uppercase tracking-[0.22em] text-gold">
              {t("nav.contact")}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
