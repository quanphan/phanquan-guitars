import { useEffect } from "react";
import Button from "../../Button.jsx";
import { useLanguage } from "../../../i18n/LanguageContext.jsx";
import {
  CONTACT_MESSAGE_MAX,
  CONTACT_NAME_MAX,
  CONTACT_COUNTRY_MAX,
  CONTACT_PHONE_MAX,
} from "../../../data/customBuild.js";
import { wizardOptionLabel } from "../../../data/wizardCatalog.js";
import { visibleReviewRows } from "../../../data/wizardDisplay.js";
import ReferenceImageField from "../ReferenceImageField.jsx";
import { firstContactFieldId } from "../../../utils/customBuildSubmitFlow.js";
import { debugSubmit } from "../../../utils/submitDebug.js";
import {
  formatSelectionIssueLabel,
  isMissingRequiredConfig,
  selectionIssueMeta,
} from "../../../services/customBuildPayload.js";

function ReviewRow({ label, value }) {
  return (
    <div className="border-b border-white/8 py-3 last:border-b-0 last:pb-0 first:pt-0">
      <dt className="text-[11px] uppercase tracking-[0.16em] text-muted">{label}</dt>
      <dd className="mt-1.5 text-sm text-ivory">{value}</dd>
    </div>
  );
}

function ReviewSection({ title, onEdit, editLabel, rows, locked }) {
  const visible = visibleReviewRows(rows);
  if (!visible.length) return null;
  return (
    <section className="mt-10 border border-white/10 bg-panel/40 p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <h3 className="text-[11px] uppercase tracking-[0.22em] text-gold">{title}</h3>
        {locked ? null : (
          <button
            type="button"
            onClick={onEdit}
            className="shrink-0 text-[11px] uppercase tracking-[0.18em] text-gold transition-colors hover:text-gold-light focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
          >
            {editLabel}
          </button>
        )}
      </div>
      <dl className="mt-4">
        {visible.map((row) => (
          <ReviewRow key={row.key} label={row.label} value={row.value} />
        ))}
      </dl>
    </section>
  );
}

function fieldClassName(error) {
  return error
    ? "mt-2 w-full border border-gold bg-gold/10 px-4 py-3 text-sm text-ivory placeholder:text-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
    : "mt-2 w-full border border-white/10 bg-ink px-4 py-3 text-sm text-ivory placeholder:text-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold";
}

function Field({
  id,
  label,
  value,
  onChange,
  type = "text",
  required,
  maxLength,
  error,
  autoComplete,
  disabled,
}) {
  return (
    <div>
      <label htmlFor={id} className="text-[11px] uppercase tracking-[0.18em] text-gold">
        {label}
        {required ? <span className="ml-1 text-muted">*</span> : null}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        maxLength={maxLength}
        autoComplete={autoComplete}
        disabled={disabled}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`${fieldClassName(error)} ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
      />
      {error ? (
        <p id={`${id}-error`} className="mt-2 text-xs text-gold">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function SubmitAlerts({
  submitStatus,
  inquiryConfigured,
  configIssueStep,
  issues,
  onEditSection,
  t,
  id,
}) {
  return (
    <div id={id} tabIndex={-1} className="space-y-4">
      {!inquiryConfigured || submitStatus === "unavailable" ? (
        <p
          className="border border-gold/40 bg-gold/10 px-4 py-3 text-sm leading-relaxed text-ivory"
          role="status"
        >
          {t("customBuild.step6.unavailable")}
        </p>
      ) : null}

      {submitStatus === "failure" ? (
        <p className="border border-gold/40 px-4 py-3 text-sm text-ivory" role="alert">
          {t("customBuild.step6.failure")}
        </p>
      ) : null}

      {submitStatus === "network" ? (
        <p className="border border-gold/40 px-4 py-3 text-sm text-ivory" role="alert">
          {t("customBuild.step6.network")}
        </p>
      ) : null}

      {submitStatus === "invalid-config" ? (
        <div className="border border-gold/40 bg-gold/10 px-4 py-3 text-sm text-ivory" role="alert">
          <p>
            {isMissingRequiredConfig(issues, configIssueStep)
              ? t("customBuild.step6.incompleteConfig").replace(
                  "{step}",
                  String(configIssueStep),
                )
              : t("customBuild.step6.invalidConfig")}
          </p>
          {configIssueStep ? (
            <button
              type="button"
              onClick={() => onEditSection(configIssueStep)}
              className="mt-3 text-[11px] uppercase tracking-[0.18em] text-gold transition-colors hover:text-gold-light focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
            >
              {t("customBuild.step6.editStep").replace("{step}", String(configIssueStep))}
            </button>
          ) : null}
          {issues.length > 0 ? (
            <ul className="mt-3 list-disc space-y-1 pl-5 text-xs text-muted">
              {issues.map((issue, index) => {
                const meta = selectionIssueMeta(issue.field);
                const label = formatSelectionIssueLabel(t, issue);
                if (meta?.step) {
                  return (
                    <li key={`${issue.field}-${issue.code}-${index}`}>
                      <button
                        type="button"
                        onClick={() => onEditSection(meta.step)}
                        className="text-left text-gold underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
                      >
                        {label}
                      </button>
                    </li>
                  );
                }
                return (
                  <li key={`${issue.field}-${issue.code}-${index}`}>{label}</li>
                );
              })}
            </ul>
          ) : null}
        </div>
      ) : null}

      {submitStatus === "invalid" ? (
        <p className="border border-gold/40 bg-gold/10 px-4 py-3 text-sm text-ivory" role="alert">
          {t("customBuild.step6.formIncomplete")}
        </p>
      ) : null}
    </div>
  );
}

export default function StepReviewSubmit({
  builder,
  contactErrors,
  submitIssues,
  configIssueStep,
  submitStatus,
  inquiryReference,
  inquiryConfigured,
  onEditSection,
  onSubmit,
  submitAttempt = 0,
  setContactName,
  setContactEmail,
  setContactCountry,
  setContactPhone,
  setContactMessage,
  setAcknowledgement,
  setReferenceImages,
}) {
  const { t, language } = useLanguage();
  const selections = builder.selections;
  const optionName = (option, group) => wizardOptionLabel(option, language, t, group) || null;
  const submitted = submitStatus === "success";
  const submitting = submitStatus === "submitting";
  const issues = Array.isArray(submitIssues) ? submitIssues : [];
  const errorKey = (field) =>
    contactErrors[field]
      ? t(`customBuild.step6.errors.${contactErrors[field]}`)
      : null;

  useEffect(() => {
    if (submitted || submitting || submitAttempt < 1) return;
    const actionable =
      submitStatus === "invalid" ||
      submitStatus === "invalid-config" ||
      submitStatus === "network" ||
      submitStatus === "failure" ||
      submitStatus === "unavailable";
    if (!actionable) return;
    const fieldId = firstContactFieldId(Object.keys(contactErrors ?? {}));
    const target =
      (fieldId ? document.getElementById(fieldId) : null) ||
      document.getElementById("custom-build-submit-feedback");
    if (!target) return;
    target.scrollIntoView({ behavior: "smooth", block: "center" });
    if (typeof target.focus === "function") {
      target.focus({ preventScroll: true });
    }
  }, [submitAttempt, submitStatus, submitted, submitting, contactErrors]);

  const scaleValue = builder.scale
    ? builder.scale.type === "multiscale"
      ? t("customBuild.step1.multiscaleHint")
          .replace("{bass}", builder.scale.bass)
          .replace("{treble}", builder.scale.treble) + ` (${builder.scale.display})`
      : builder.scale.display
    : null;

  return (
    <div>
      {submitted ? (
        <>
          <h2 className="font-display text-3xl tracking-wide text-ivory sm:text-4xl">
            {t("customBuild.step6.successHeading")}
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
            {t("customBuild.step6.successBody")}
          </p>
          {inquiryReference ? (
            <p className="mt-6 border border-gold/40 bg-gold/10 px-4 py-3 text-sm text-ivory">
              {t("customBuild.step6.reference").replace("{reference}", inquiryReference)}
            </p>
          ) : null}
        </>
      ) : (
        <>
          <h2 className="font-display text-3xl tracking-wide text-ivory sm:text-4xl">
            {t("customBuild.step6.heading")}
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
            {t("customBuild.step6.description")}
          </p>
          <p className="mt-4 max-w-2xl text-xs leading-relaxed text-muted">
            {t("customBuild.provisional")}
          </p>
        </>
      )}

      <ReviewSection
        title={t("customBuild.steps.instrumentShape")}
        onEdit={() => onEditSection(1)}
        editLabel={t("customBuild.step6.edit")}
        locked={submitted || submitting}
        rows={[
          { key: "instrument", label: t("customBuild.summary.instrument"), value: optionName(builder.instrumentType, "types") },
          { key: "series", label: t("customBuild.summary.series"), value: optionName(builder.series, "series") },
          { key: "shape", label: t("customBuild.summary.shape"), value: optionName(builder.shape, "shapes") },
          { key: "scale", label: t("customBuild.summary.scale"), value: scaleValue },
          {
            key: "strings",
            label: t("customBuild.summary.strings"),
            value:
              selections.stringCount != null
                ? t("customBuild.strings.count").replace("{count}", String(selections.stringCount))
                : null,
          },
          { key: "radius", label: t("customBuild.summary.radius"), value: builder.radius?.display ?? null },
        ]}
      />

      <ReviewSection
        title={t("customBuild.steps.bodyTop")}
        onEdit={() => onEditSection(2)}
        editLabel={t("customBuild.step6.edit")}
        locked={submitted || submitting}
        rows={[
          { key: "bodyWood", label: t("customBuild.summary.bodyWood"), value: optionName(builder.bodyWood, "woods") },
          { key: "topWood", label: t("customBuild.summary.topWood"), value: optionName(builder.topWood, "woods") },
        ]}
      />

      <ReviewSection
        title={t("customBuild.steps.neckFingerboard")}
        onEdit={() => onEditSection(3)}
        editLabel={t("customBuild.step6.edit")}
        locked={submitted || submitting}
        rows={[
          { key: "neckWood", label: t("customBuild.summary.neckWood"), value: optionName(builder.neckWood, "neckWoods") },
          { key: "neckConstruction", label: t("customBuild.summary.neckConstruction"), value: optionName(builder.neckConstruction, "constructions") },
          { key: "fingerboard", label: t("customBuild.summary.fingerboard"), value: optionName(builder.fingerboardWood, "fingerboards") },
          { key: "neckProfile", label: t("customBuild.summary.neckProfile"), value: optionName(builder.neckProfile, "profiles") },
          { key: "frets", label: t("customBuild.summary.frets"), value: optionName(builder.fretSpec, "frets") },
          {
            key: "fretCount",
            label: t("customBuild.summary.fretCount"),
            value:
              builder.inheritedFretCount != null
                ? t("customBuild.step3.fretCountValue").replace("{count}", String(builder.inheritedFretCount))
                : null,
          },
        ]}
      />

      <ReviewSection
        title={t("customBuild.steps.electronicsHardware")}
        onEdit={() => onEditSection(4)}
        editLabel={t("customBuild.step6.edit")}
        locked={submitted || submitting}
        rows={
          selections.customerSuppliedParts
            ? [
                {
                  key: "customerSuppliedParts",
                  label: t("customBuild.summary.customerSuppliedParts"),
                  value: t("customBuild.step4.customerSuppliedSummary"),
                },
              ]
            : [
                { key: "pickupConfig", label: t("customBuild.summary.pickupConfig"), value: optionName(builder.pickupConfig, "pickupConfigs") },
                { key: "pickupType", label: t("customBuild.summary.pickupType"), value: optionName(builder.pickupType, "pickupTypes") },
                { key: "bridge", label: t("customBuild.summary.bridge"), value: optionName(builder.bridge, "bridges") },
                { key: "tuners", label: t("customBuild.summary.tuners"), value: optionName(builder.tuner, "tuners") },
                { key: "hardwareFinish", label: t("customBuild.summary.hardwareFinish"), value: optionName(builder.hardwareFinish, "hardwareFinishes") },
                { key: "controls", label: t("customBuild.summary.controls"), value: optionName(builder.controlLayout, "controls") },
              ]
        }
      />

      <ReviewSection
        title={t("customBuild.steps.finishDetails")}
        onEdit={() => onEditSection(5)}
        editLabel={t("customBuild.step6.edit")}
        locked={submitted || submitting}
        rows={[
          { key: "finishType", label: t("customBuild.summary.finishType"), value: optionName(builder.finishType, "finishTypes") },
          { key: "finishColor", label: t("customBuild.summary.finishColor"), value: optionName(builder.finishColor, "finishColors") },
          { key: "customColor", label: t("customBuild.summary.customColor"), value: selections.customColorNote?.trim() || null },
          { key: "inlay", label: t("customBuild.summary.inlay"), value: optionName(builder.inlay, "inlays") },
          { key: "engraving", label: t("customBuild.summary.engraving"), value: optionName(builder.engraving, "engravings") },
          { key: "specialRequests", label: t("customBuild.summary.specialRequests"), value: selections.specialRequests?.trim() || null },
        ]}
      />

      {submitted ? null : (
      <section className="mt-12">
        <h3 className="font-display text-2xl tracking-wide text-ivory">
          {t("customBuild.step6.contactHeading")}
        </h3>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
          {t("customBuild.step6.contactDescription")}
        </p>

        <form
          className="mt-8 space-y-6"
          onSubmit={(event) => {
            event.preventDefault();
            event.stopPropagation();
            debugSubmit("form-submit", { submitting, submitted });
            if (submitting || submitted) return;
            onSubmit();
          }}
          noValidate
          aria-busy={submitting}
        >
          <SubmitAlerts
            id="custom-build-submit-feedback"
            submitStatus={submitStatus}
            inquiryConfigured={inquiryConfigured}
            configIssueStep={configIssueStep}
            issues={issues}
            onEditSection={onEditSection}
            t={t}
          />
          <Field
            id="contact-name"
            label={t("customBuild.step6.fields.name")}
            value={selections.contactName}
            onChange={setContactName}
            required
            maxLength={CONTACT_NAME_MAX}
            autoComplete="name"
            disabled={submitting}
            error={errorKey("contactName")}
          />
          <Field
            id="contact-email"
            label={t("customBuild.step6.fields.email")}
            value={selections.contactEmail}
            onChange={setContactEmail}
            type="email"
            required
            maxLength={120}
            autoComplete="email"
            disabled={submitting}
            error={errorKey("contactEmail")}
          />
          <Field
            id="contact-country"
            label={t("customBuild.step6.fields.country")}
            value={selections.contactCountry}
            onChange={setContactCountry}
            required
            maxLength={CONTACT_COUNTRY_MAX}
            autoComplete="country-name"
            disabled={submitting}
            error={errorKey("contactCountry")}
          />
          <Field
            id="contact-phone"
            label={t("customBuild.step6.fields.phone")}
            value={selections.contactPhone}
            onChange={setContactPhone}
            type="tel"
            required
            maxLength={CONTACT_PHONE_MAX}
            autoComplete="tel"
            disabled={submitting}
            error={errorKey("contactPhone")}
          />
          <div>
            <label
              htmlFor="contact-message"
              className="text-[11px] uppercase tracking-[0.18em] text-gold"
            >
              {t("customBuild.step6.fields.message")}
            </label>
            <textarea
              id="contact-message"
              value={selections.contactMessage}
              onChange={(event) => setContactMessage(event.target.value)}
              maxLength={CONTACT_MESSAGE_MAX}
              disabled={submitting}
              rows={5}
              aria-invalid={Boolean(contactErrors.contactMessage)}
              aria-describedby={
                contactErrors.contactMessage ? "contact-message-error" : undefined
              }
              className={`${fieldClassName(contactErrors.contactMessage)} resize-y leading-relaxed ${submitting ? "cursor-not-allowed opacity-60" : ""}`}
              placeholder={t("customBuild.step6.fields.messagePlaceholder")}
            />
            <p className="mt-2 text-[11px] uppercase tracking-[0.16em] text-muted">
              {(selections.contactMessage?.length ?? 0)} / {CONTACT_MESSAGE_MAX}
            </p>
            {contactErrors.contactMessage ? (
              <p id="contact-message-error" className="mt-2 text-xs text-gold">
                {errorKey("contactMessage")}
              </p>
            ) : null}
          </div>

          <ReferenceImageField
            images={selections.referenceImages}
            onChange={setReferenceImages}
            disabled={submitting}
          />

          <div
            className={
              contactErrors.acknowledgement
                ? "border border-gold bg-gold/10 px-4 py-3"
                : ""
            }
          >
            <label className="flex items-start gap-3 text-sm leading-relaxed text-ivory">
              <input
                id="contact-acknowledgement"
                type="checkbox"
                checked={Boolean(selections.acknowledgement)}
                onChange={(event) => setAcknowledgement(event.target.checked)}
                disabled={submitting}
                aria-invalid={Boolean(contactErrors.acknowledgement)}
                aria-describedby={
                  contactErrors.acknowledgement ? "acknowledgement-error" : undefined
                }
                className="mt-1 size-4 shrink-0 accent-gold"
              />
              <span>{t("customBuild.step6.acknowledgement")}</span>
            </label>
            {contactErrors.acknowledgement ? (
              <p id="acknowledgement-error" className="mt-2 text-xs text-gold">
                {errorKey("acknowledgement")}
              </p>
            ) : null}
          </div>

          <SubmitAlerts
            id="custom-build-submit-feedback-button"
            submitStatus={submitStatus}
            inquiryConfigured={inquiryConfigured}
            configIssueStep={configIssueStep}
            issues={issues}
            onEditSection={onEditSection}
            t={t}
          />

          <Button type="submit" disabled={submitting || submitted} aria-busy={submitting}>
            {submitting ? (
              <span className="inline-flex items-center gap-3">
                <span
                  className="size-3.5 animate-spin rounded-full border border-charcoal/30 border-t-charcoal"
                  aria-hidden="true"
                />
                {t("customBuild.step6.submitting")}
              </span>
            ) : (
              t("customBuild.step6.submit")
            )}
          </Button>
        </form>
      </section>
      )}
    </div>
  );
}
