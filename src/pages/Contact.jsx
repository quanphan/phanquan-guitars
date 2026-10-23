import { useEffect, useId, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import workshopBack from "../assets/guitars/optimized/workshop-back.jpg";
import workshopBackSm from "../assets/guitars/optimized/workshop-back-900.jpg";
import Button from "../components/Button.jsx";
import Field, { errorFieldClass, fieldClass } from "../components/auth/Field.jsx";
import {
  BrandDirectContacts,
  BrandHours,
  BrandSocialLinks,
  BrandWorkshops,
} from "../brand/BrandPublicContacts.jsx";
import { usePublicBrandSettings } from "../brand/BrandSettingsContext.jsx";
import {
  CONTACT_MESSAGE_MAX,
  CONTACT_NAME_MAX,
  DRAFT_ID_MAX,
  INQUIRY_TYPE_VALUES,
  PRODUCT_REF_MAX,
  SUBJECT_MAX,
  emptyContactValues,
  parseInquiryType,
  validateContactInquiry,
} from "../services/contactInquiry.js";
import { hasPublicBrandContact } from "../services/brandSettings.js";
import { CONTACT_INQUIRY_CODES, submitContactInquiry } from "../services/contactService.js";
import { readCustomBuildDraft } from "../data/customBuildDraft.js";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import { getPublicProduct } from "../services/publicProductService.js";

function errorMessage(t, key) {
  if (!key) return "";
  return t(`contact.errors.${key}`);
}

export default function Contact() {
  const { t, language } = useLanguage();
  const { settings } = usePublicBrandSettings();
  const showBrandContact = hasPublicBrandContact(settings);
  const [searchParams] = useSearchParams();
  const formId = useId();
  const submittingRef = useRef(false);
  const productPrefillRef = useRef("");
  const [values, setValues] = useState(() => valuesFromSearch(searchParams));
  const [fieldErrors, setFieldErrors] = useState({});
  const [status, setStatus] = useState("idle");
  const [reference, setReference] = useState(null);

  useEffect(() => {
    setValues((current) => mergeQueryIntoValues(current, searchParams, { applyStoredDraft: false }));
  }, [searchParams]);

  useEffect(() => {
    const productId = values.productId.trim();
    if (!productId || productPrefillRef.current === productId) return;
    let cancelled = false;
    getPublicProduct(productId).then((result) => {
      if (cancelled || !result.ok || !result.item?.name) return;
      productPrefillRef.current = productId;
      setValues((current) => {
        if (current.productId !== productId || current.productRef.trim()) return current;
        return { ...current, productRef: result.item.name };
      });
    });
    return () => {
      cancelled = true;
    };
  }, [values.productId]);

  function update(field, value) {
    setValues((current) => ({ ...current, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors((current) => {
        const next = { ...current };
        delete next[field];
        return next;
      });
    }
  }

  function setInquiryType(inquiryType) {
    setValues((current) => {
      const next = { ...current, inquiryType };
      if (inquiryType === "custom-guitar" && !next.draftId.trim()) {
        const draft = readCustomBuildDraft();
        if (draft?.draftId) next.draftId = draft.draftId;
      }
      return next;
    });
    if (fieldErrors.inquiryType) {
      setFieldErrors((current) => {
        const next = { ...current };
        delete next.inquiryType;
        return next;
      });
    }
  }

  async function onSubmit(event) {
    event.preventDefault();
    if (submittingRef.current || status === "submitting") return;

    const errors = validateContactInquiry(values);
    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      setStatus("invalid");
      const first = Object.keys(errors)[0];
      document.getElementById(`contact-${first}`)?.focus();
      return;
    }

    submittingRef.current = true;
    setFieldErrors({});
    setStatus("submitting");
    const result = await submitContactInquiry(values);
    submittingRef.current = false;

    if (result.ok && result.confirmed) {
      setReference(result.reference);
      setStatus("success");
      return;
    }

    setFieldErrors(result.fieldErrors || {});
    setStatus(result.code || CONTACT_INQUIRY_CODES.REJECTED);
  }

  function resetForm() {
    setValues(valuesFromSearch(searchParams));
    setFieldErrors({});
    setStatus("idle");
    setReference(null);
    productPrefillRef.current = "";
  }

  const submitting = status === "submitting";
  const showProductRef =
    values.inquiryType === "custom-guitar" ||
    values.inquiryType === "ready-stock" ||
    values.inquiryType === "technical";
  const showDraft = values.inquiryType === "custom-guitar";

  return (
    <section className="overflow-x-hidden pb-20">
      <header className="mx-auto grid max-w-7xl items-end gap-8 px-6 pt-12 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-12 lg:px-10 lg:pt-16">
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-[0.32em] text-gold">{t("contact.eyebrow")}</p>
          <h1 className="mt-4 font-display text-4xl font-medium tracking-wide text-ivory sm:text-5xl">
            {t("contact.title")}
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
            {t("contact.description")}
          </p>
        </div>
        <div className="min-w-0">
          <img
            src={workshopBack}
            srcSet={`${workshopBackSm} 900w, ${workshopBack} 1200w`}
            sizes="(min-width: 1024px) 40vw, 100vw"
            alt={t("contact.imageAlt")}
            className="aspect-[16/9] w-full max-h-56 object-cover object-center"
          />
        </div>
      </header>

      <div className="mx-auto mt-12 max-w-7xl px-6 lg:mt-16 lg:px-10">
        <fieldset id="contact-inquiryType" tabIndex={-1} className="min-w-0 outline-none">
          <legend className="text-[11px] uppercase tracking-[0.22em] text-gold">
            {t("contact.inquiryType")}
            <span className="ml-1 text-muted">*</span>
          </legend>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {INQUIRY_TYPE_VALUES.map((type) => {
              const selected = values.inquiryType === type;
              return (
                <label
                  key={type}
                  className={`block min-w-0 cursor-pointer border px-4 py-4 transition-colors duration-300 focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-gold ${
                    selected
                      ? "border-gold bg-gold/10"
                      : "border-white/10 bg-panel/30 hover:border-gold/50"
                  }`}
                >
                  <input
                    type="radio"
                    name={`${formId}-inquiry-type`}
                    value={type}
                    checked={selected}
                    onChange={() => setInquiryType(type)}
                    className="sr-only"
                  />
                  <span className="block text-[12px] uppercase tracking-[0.16em] text-ivory">
                    {t(`contact.types.${type}.title`)}
                  </span>
                  <span className="mt-2 block text-sm leading-relaxed text-muted">
                    {t(`contact.types.${type}.body`)}
                  </span>
                </label>
              );
            })}
          </div>
          {fieldErrors.inquiryType ? (
            <p className="mt-3 text-xs text-gold" role="alert">
              {errorMessage(t, fieldErrors.inquiryType)}
            </p>
          ) : null}
        </fieldset>
      </div>

      <div className="mx-auto mt-12 grid max-w-7xl gap-10 px-6 lg:mt-16 lg:grid-cols-[minmax(0,1.2fr)_minmax(16rem,0.8fr)] lg:items-start lg:gap-14 lg:px-10">
        <div className="min-w-0">
          {status === "success" ? (
            <div className="border border-white/10 bg-panel/40 px-6 py-8" role="status">
              <p className="text-[11px] uppercase tracking-[0.22em] text-gold">{t("contact.successEyebrow")}</p>
              <h2 className="mt-3 font-display text-3xl tracking-wide text-ivory">
                {t("contact.successTitle")}
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-muted">{t("contact.successBody")}</p>
              {reference ? (
                <p className="mt-4 text-sm text-ivory">
                  {t("contact.reference").replace("{reference}", reference)}
                </p>
              ) : null}
              <Button type="button" variant="outline" className="mt-8" onClick={resetForm}>
                {t("contact.sendAnother")}
              </Button>
            </div>
          ) : (
            <form className="min-w-0 space-y-6" onSubmit={onSubmit} noValidate>
              {status === "invalid" || CONTACT_FAILURE.has(status) ? (
                <div className="border border-gold/40 bg-gold/10 px-4 py-3 text-sm text-ivory" role="alert">
                  {t(alertCopy(status, fieldErrors))}
                </div>
              ) : null}

              <Field
                id="contact-name"
                label={t("contact.fields.name")}
                value={values.name}
                onChange={(value) => update("name", value)}
                autoComplete="name"
                required
                maxLength={CONTACT_NAME_MAX}
                disabled={submitting}
                error={errorMessage(t, fieldErrors.name)}
              />
              <Field
                id="contact-email"
                label={t("contact.fields.email")}
                type="email"
                value={values.email}
                onChange={(value) => update("email", value)}
                autoComplete="email"
                required
                maxLength={254}
                disabled={submitting}
                error={errorMessage(t, fieldErrors.email)}
              />
              <Field
                id="contact-subject"
                label={t("contact.fields.subject")}
                value={values.subject}
                onChange={(value) => update("subject", value)}
                maxLength={SUBJECT_MAX}
                disabled={submitting}
                error={errorMessage(t, fieldErrors.subject)}
              />

              {showProductRef ? (
                <Field
                  id="contact-productRef"
                  label={t(
                    values.inquiryType === "ready-stock"
                      ? "contact.fields.productRef"
                      : "contact.fields.modelRef",
                  )}
                  value={values.productRef}
                  onChange={(value) => update("productRef", value)}
                  maxLength={PRODUCT_REF_MAX}
                  disabled={submitting}
                />
              ) : null}

              {showDraft ? (
                <Field
                  id="contact-draftId"
                  label={t("contact.fields.draftId")}
                  value={values.draftId}
                  onChange={(value) => update("draftId", value)}
                  maxLength={DRAFT_ID_MAX}
                  disabled={submitting}
                />
              ) : null}

              <div>
                <label htmlFor="contact-message" className="text-[11px] uppercase tracking-[0.18em] text-gold">
                  {t("contact.fields.message")}
                  <span className="ml-1 text-muted">*</span>
                </label>
                <textarea
                  id="contact-message"
                  value={values.message}
                  onChange={(event) => update("message", event.target.value)}
                  maxLength={CONTACT_MESSAGE_MAX}
                  disabled={submitting}
                  required
                  rows={6}
                  aria-invalid={Boolean(fieldErrors.message)}
                  placeholder={t("contact.fields.messagePlaceholder")}
                  className={`${fieldErrors.message ? errorFieldClass : fieldClass} resize-y leading-relaxed ${
                    submitting ? "cursor-not-allowed opacity-60" : ""
                  }`}
                />
                <p className="mt-2 text-[11px] uppercase tracking-[0.16em] text-muted">
                  {values.message.length} / {CONTACT_MESSAGE_MAX}
                </p>
                {fieldErrors.message ? (
                  <p className="mt-2 text-xs text-gold">{errorMessage(t, fieldErrors.message)}</p>
                ) : null}
              </div>

              <Button type="submit" disabled={submitting}>
                {submitting ? t("contact.submitting") : t("contact.submit")}
              </Button>
            </form>
          )}
        </div>

        <aside className="min-w-0 border-t border-white/10 pt-8 lg:border-l lg:border-t-0 lg:pl-10 lg:pt-0">
          <p className="text-[11px] uppercase tracking-[0.22em] text-gold">{t("contact.workshop.eyebrow")}</p>
          <h2 className="mt-3 font-display text-2xl tracking-wide text-ivory">
            {t("contact.workshop.title")}
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-muted">{t("contact.workshop.body")}</p>
          {showBrandContact ? (
            <div className="mt-8 space-y-6">
              <BrandDirectContacts settings={settings} t={t} />
              <BrandHours settings={settings} language={language} t={t} />
              <BrandWorkshops settings={settings} t={t} />
              {settings.instagram || settings.facebook || settings.youtube || settings.other ? (
                <div>
                  <p className="text-[11px] uppercase tracking-[0.16em] text-muted">{t("contact.workshop.social")}</p>
                  <div className="mt-2">
                    <BrandSocialLinks settings={settings} t={t} />
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
        </aside>
      </div>

      <p className="mx-auto mt-16 max-w-7xl px-6 text-center font-display text-xl tracking-wide text-ivory/70 lg:px-10">
        {t("contact.closing")}
      </p>
    </section>
  );
}

const CONTACT_FAILURE = new Set([
  CONTACT_INQUIRY_CODES.UNAVAILABLE,
  CONTACT_INQUIRY_CODES.NETWORK,
  CONTACT_INQUIRY_CODES.VALIDATION,
  CONTACT_INQUIRY_CODES.REJECTED,
]);

function alertCopy(status, fieldErrors = {}) {
  if (status === "invalid") return "contact.formIncomplete";
  if (status === CONTACT_INQUIRY_CODES.VALIDATION && Object.keys(fieldErrors).length > 0) {
    return "contact.formIncomplete";
  }
  if (status === CONTACT_INQUIRY_CODES.UNAVAILABLE) return "contact.unavailable";
  if (status === CONTACT_INQUIRY_CODES.NETWORK) return "contact.network";
  return "contact.failure";
}

function valuesFromSearch(searchParams) {
  return mergeQueryIntoValues(emptyContactValues(), searchParams, { applyStoredDraft: true });
}

function mergeQueryIntoValues(current, searchParams, { applyStoredDraft = false } = {}) {
  const next = { ...current };
  const type = parseInquiryType(searchParams.get("type"));
  if (type) next.inquiryType = type;
  const product = String(searchParams.get("product") ?? "").trim();
  if (product) next.productId = product;
  const productRef = String(searchParams.get("productRef") ?? "").trim();
  if (productRef) next.productRef = productRef;
  const draftFromQuery = String(searchParams.get("draftId") ?? "").trim();
  if (draftFromQuery) next.draftId = draftFromQuery;
  else if (
    applyStoredDraft &&
    (type === "custom-guitar" || next.inquiryType === "custom-guitar") &&
    !next.draftId
  ) {
    const draft = readCustomBuildDraft();
    if (draft?.draftId) next.draftId = draft.draftId;
  }
  return next;
}
