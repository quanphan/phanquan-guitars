import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext.jsx";
import { slugifyName } from "../../auth/catalog.js";
import { errorText } from "../../auth/errorText.js";
import CompatibilityPicker, { DefaultForTypesPicker } from "../../components/admin/CompatibilityPicker.jsx";
import ImageUploadField from "../../components/admin/ImageUploadField.jsx";
import ScaleLengthFields from "../../components/admin/ScaleLengthFields.jsx";
import SeriesConstructionFields from "../../components/admin/SeriesConstructionFields.jsx";
import SeriesNameAutocomplete from "../../components/admin/SeriesNameAutocomplete.jsx";
import Field from "../../components/auth/Field.jsx";
import Button from "../../components/Button.jsx";
import PageHeader from "../../components/PageHeader.jsx";
import { COMPATIBILITY_FIELDS, nextWizardSortOrder, normalizeWizardSortOrder } from "../../data/wizardCatalog.js";
import {
  categoryStepId,
  compatibilityEditorOptions,
  findWizardSetupOption,
  groupLabel,
  keepAllowedCompatibility,
  precedingGroupIds,
  WIZARD_STEP_COPY,
} from "../../data/wizardSetupLayout.js";
import { mergeSeriesConstructionAttributes } from "../../data/wizardSeriesConstruction.js";
import {
  applySeriesSuggestion,
  buildWizardOptionCreatePayload,
  buildWizardOptionUpdatePayload,
  formFromWizardOption,
  isIdentifierLocked,
} from "../../data/wizardOptionPayload.js";
import {
  emptyScaleForm,
  mergeScaleAttributes,
  scaleFormFromAttributes,
  validateScaleForm,
} from "../../data/wizardScaleAttributes.js";
import {
  seriesCatalogSuggestions,
  usesSeriesNameAutocomplete,
} from "../../data/wizardSeriesSuggestions.js";
import { useLanguage } from "../../i18n/LanguageContext.jsx";
import { listCatalogTerms, uploadAdminImage } from "../../services/adminCatalogService.js";
import {
  createWizardOption,
  getWizardCategory,
  listWizardSetup,
  updateWizardOption,
} from "../../services/wizardSetupService.js";

function emptyCompatibility() {
  return Object.fromEntries(COMPATIBILITY_FIELDS.map((field) => [field.key, []]));
}

const emptyForm = {
  categoryId: "instrument-type",
  code: "",
  description: "",
  enDescription: "",
  viDescription: "",
  viName: "",
  enName: "",
  icon: "",
  imagePath: "",
  active: true,
  isDefault: false,
  defaultForInstrumentTypeIds: [],
  attributes: {},
  bodyConstruction: [],
  neckConstruction: [],
  compatibility: emptyCompatibility(),
  sortOrder: 0,
};

export default function WizardOptionEditor() {
  const { categoryId, optionId } = useParams();
  const [searchParams] = useSearchParams();
  const optionCode = searchParams.get("optionCode") || "";
  const isNew = !optionId || optionId === "new";
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const { authorizedRequest, authorizedFormRequest, hasPermission } = useAuth();
  const [form, setForm] = useState({ ...emptyForm, categoryId: categoryId || "instrument-type", compatibility: emptyCompatibility() });
  const [codeTouched, setCodeTouched] = useState(!isNew);
  const [categories, setCategories] = useState([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [seriesSuggestions, setSeriesSuggestions] = useState([]);
  const [scaleForm, setScaleForm] = useState(() => emptyScaleForm(categoryId === "scale" ? "custom" : "single"));
  const canWrite = hasPermission("catalog.write");
  const canUpload = hasPermission("uploads.write");

  const setField = useCallback((key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    const listed = await listWizardSetup(authorizedRequest);
    if (!listed.ok) {
      setError(listed.code);
      setLoading(false);
      return;
    }
    setCategories(listed.categories);
    if (isNew) {
      const siblings = listed.categories.find((item) => item.id === (categoryId || "instrument-type"))?.options || [];
      setForm({
        ...emptyForm,
        categoryId: categoryId || "instrument-type",
        sortOrder: nextWizardSortOrder(siblings),
        compatibility: emptyCompatibility(),
      });
      setScaleForm(emptyScaleForm((categoryId || "instrument-type") === "scale" ? "custom" : "single"));
      setLoading(false);
      return;
    }
    const result = await getWizardCategory(authorizedRequest, categoryId);
    if (!result.ok) {
      setError(result.code);
      setLoading(false);
      return;
    }
    const option = findWizardSetupOption(result.category.options, optionId, optionCode);
    if (!option) {
      setError("NOT_FOUND");
      setLoading(false);
      return;
    }
    setForm(formFromWizardOption(option, categoryId, listed.categories));
    setScaleForm(scaleFormFromAttributes(option.attributes));
    setLoading(false);
  }, [authorizedRequest, categoryId, isNew, optionId, optionCode]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!isNew || codeTouched) return;
    setForm((current) => ({ ...current, code: slugifyName(current.enName || current.viName) }));
  }, [codeTouched, form.enName, form.viName, isNew]);

  const instrumentTypes = useMemo(
    () => categories.find((item) => item.id === "instrument-type")?.options || [],
    [categories],
  );
  const selectedCategory = categories.find((item) => item.id === form.categoryId);
  const selectedStepId = categoryStepId(selectedCategory || { id: form.categoryId });
  const seriesNameAutocomplete = usesSeriesNameAutocomplete(selectedStepId, form.categoryId);
  const groupChoices = useMemo(
    () => categories.filter((item) => categoryStepId(item) === selectedStepId),
    [categories, selectedStepId],
  );
  const earlierGroups = precedingGroupIds(form.categoryId, categories);
  const canScopeDefault = earlierGroups.includes("instrument-type");
  const stepCopy = WIZARD_STEP_COPY[selectedStepId];
  const stepLabel = stepCopy?.titleKey
    ? t(stepCopy.titleKey)
    : selectedStepId === "unassigned"
      ? t("admin.wizardSetup.unassignedStep")
      : t("admin.wizardSetup.stepN").replace("{n}", String(selectedStepId));
  const listHref = `/admin/custom-build-setup${searchParams.get("step") ? `?${searchParams.toString()}` : selectedStepId ? `?step=${encodeURIComponent(selectedStepId)}` : ""}`;

  useEffect(() => {
    if (!seriesNameAutocomplete) {
      setSeriesSuggestions([]);
      return undefined;
    }
    let cancelled = false;
    async function loadSeries() {
      const listed = await listCatalogTerms(authorizedRequest, "series");
      if (cancelled) return;
      setSeriesSuggestions(listed.ok ? seriesCatalogSuggestions(listed.items) : []);
    }
    void loadSeries();
    return () => {
      cancelled = true;
    };
  }, [authorizedRequest, seriesNameAutocomplete]);

  function setCategory(nextId) {
    const siblings = categories.find((item) => item.id === nextId)?.options || [];
    setForm((current) => ({
      ...current,
      categoryId: nextId,
      sortOrder: nextWizardSortOrder(siblings),
      compatibility: keepAllowedCompatibility(current.compatibility, nextId, categories),
      defaultForInstrumentTypeIds: nextId === "instrument-type" ? [] : current.defaultForInstrumentTypeIds,
    }));
    if (isNew && nextId === "scale") setScaleForm(emptyScaleForm("custom"));
  }

  function payload() {
    const attributes = form.categoryId === "scale"
      ? mergeScaleAttributes(form.attributes, scaleForm)
      : form.categoryId === "series"
        ? mergeSeriesConstructionAttributes(form.attributes, form.bodyConstruction, form.neckConstruction)
        : form.attributes;
    const nextForm = { ...form, attributes };
    const options = {
      canScopeDefault,
      instrumentTypes: compatibilityEditorOptions(instrumentTypes),
      categories,
    };
    return isNew
      ? buildWizardOptionCreatePayload(nextForm, options)
      : buildWizardOptionUpdatePayload(nextForm, options);
  }

  async function onSave(event) {
    event.preventDefault();
    if (!canWrite) return;
    setSaving(true);
    setError(null);
    setFieldErrors({});
    if (form.categoryId === "scale") {
      const scaleErrors = validateScaleForm(scaleForm);
      if (Object.keys(scaleErrors).length) {
        setFieldErrors(scaleErrors);
        setSaving(false);
        return;
      }
    }
    const body = payload();
    const result = isNew
      ? await createWizardOption(authorizedRequest, form.categoryId, body)
      : await updateWizardOption(authorizedRequest, categoryId, optionId, body, { code: form.code });
    setSaving(false);
    if (!result.ok) {
      setError(result.code);
      const next = {};
      for (const detail of result.details || []) {
        if (detail.field) next[detail.field] = detail.message;
        if (detail.field?.startsWith("compatibility")) next.compatibility = detail.message;
      }
      setFieldErrors(next);
      return;
    }
    navigate(listHref);
  }

  const inputClass = "mt-2 w-full border border-white/10 bg-ink px-4 py-3 text-sm text-ivory";

  return (
    <section className="pb-24">
      <PageHeader
        eyebrow={t("admin.wizardSetup.title")}
        title={isNew ? t("admin.wizardSetup.add") : t("admin.wizardSetup.edit")}
        description={t("admin.wizardSetup.formHelp")}
      />
      <div className="mx-auto max-w-3xl px-6 lg:px-10">
        {loading ? <p className="mt-8 text-sm text-muted">{t("admin.loadingBody")}</p> : (
          <form className="mt-8 space-y-5" onSubmit={(event) => void onSave(event)}>
            <label className="block text-[11px] uppercase tracking-[0.18em] text-gold">
              {t("admin.wizardSetup.fields.wizardStep")}
              <input value={stepLabel} readOnly className="mt-2 w-full border border-white/10 bg-ink/60 px-4 py-3 text-sm text-ivory" />
            </label>
            {isNew ? (
              <label className="block text-[11px] uppercase tracking-[0.18em] text-gold">
                {t("admin.wizardSetup.columns.group")}
                <select value={form.categoryId} onChange={(event) => setCategory(event.target.value)} className={inputClass}>
                  {(groupChoices.length ? groupChoices : categories).map((group) => (
                    <option key={group.id} value={group.id}>
                      {groupLabel(t, group)}
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <label className="block text-[11px] uppercase tracking-[0.18em] text-gold">
                {t("admin.wizardSetup.columns.group")}
                <input value={groupLabel(t, selectedCategory || { id: form.categoryId })} readOnly className="mt-2 w-full border border-white/10 bg-ink/60 px-4 py-3 text-sm text-ivory" />
              </label>
            )}
            {form.categoryId === "scale" ? (
              <ScaleLengthFields
                form={scaleForm}
                onChange={setScaleForm}
                errors={fieldErrors}
                t={t}
              />
            ) : null}
            {form.categoryId === "series" ? (
              <SeriesConstructionFields
                bodyConstruction={form.bodyConstruction}
                neckConstruction={form.neckConstruction}
                onBodyChange={(value) => setField("bodyConstruction", value)}
                onNeckChange={(value) => setField("neckConstruction", value)}
                t={t}
              />
            ) : null}
            <Field id="wizard-vi" label={t("admin.wizardSetup.fields.viName")} value={form.viName} onChange={(value) => setField("viName", value)} />
            {seriesNameAutocomplete ? (
              <SeriesNameAutocomplete
                id="wizard-en"
                label={t("admin.wizardSetup.fields.enName")}
                value={form.enName}
                onChange={(value) => setField("enName", value)}
                onSelect={(item) => {
                  setCodeTouched(true);
                  setForm((current) => applySeriesSuggestion(current, item, { isNew }));
                }}
                suggestions={seriesSuggestions}
                error={fieldErrors.name}
                required
                t={t}
              />
            ) : (
              <Field id="wizard-en" label={t("admin.wizardSetup.fields.enName")} value={form.enName} onChange={(value) => setField("enName", value)} required error={fieldErrors.name} />
            )}
            <Field
              id="wizard-code"
              label={t("admin.catalog.fields.slug")}
              value={form.code}
              onChange={(value) => {
                if (isIdentifierLocked(isNew)) return;
                setCodeTouched(true);
                setField("code", value);
              }}
              required
              disabled={isIdentifierLocked(isNew)}
              error={fieldErrors.code}
            />
            {isIdentifierLocked(isNew) ? (
              <p className="-mt-3 text-xs text-muted">{t("admin.wizardSetup.codeLocked")}</p>
            ) : null}
            <Field
              id="wizard-sort-order"
              label={t("admin.wizardSetup.fields.sortOrder")}
              type="number"
              value={String(form.sortOrder ?? 0)}
              onChange={(value) => setField("sortOrder", normalizeWizardSortOrder(value))}
              error={fieldErrors.sortOrder}
            />
            <Field
              id="wizard-desc-en"
              label={t("admin.catalog.fields.description")}
              value={form.enDescription || ""}
              onChange={(value) => {
                setForm((current) => ({ ...current, enDescription: value, description: value }));
              }}
              multiline
              rows={3}
            />
            <Field
              id="wizard-desc-vi"
              label={t("admin.catalog.fields.viDescription")}
              value={form.viDescription || ""}
              onChange={(value) => setField("viDescription", value)}
              multiline
              rows={3}
            />
            <ImageUploadField
              label={t("admin.catalog.fields.image")}
              storedPath={form.imagePath}
              canUpload={canUpload}
              upload={(file) => uploadAdminImage(authorizedFormRequest, { file, scope: "categories" })}
              onUploaded={(path) => setField("imagePath", path)}
              onClear={() => setField("imagePath", "")}
            />
            <label className="flex items-center gap-2 text-sm text-ivory">
              <input type="checkbox" checked={form.active} onChange={(event) => setField("active", event.target.checked)} className="accent-gold" />
              {t("admin.catalog.active")}
            </label>
            <label className="flex items-center gap-2 text-sm text-ivory">
              <input type="checkbox" checked={form.isDefault} onChange={(event) => setField("isDefault", event.target.checked)} className="accent-gold" />
              {t("admin.wizardSetup.default")}
            </label>
            {canScopeDefault ? (
              <DefaultForTypesPicker
                types={instrumentTypes}
                selected={form.defaultForInstrumentTypeIds}
                onChange={(value) => setField("defaultForInstrumentTypeIds", value)}
                language={language}
                t={t}
                allowedIds={form.compatibility.instrumentTypeIds}
              />
            ) : null}
            <CompatibilityPicker
              categories={categories}
              currentCategoryId={form.categoryId}
              value={form.compatibility}
              onChange={(value) => setField("compatibility", value)}
              language={language}
              t={t}
            />
            {fieldErrors.compatibility || fieldErrors.defaultForInstrumentTypeIds ? (
              <p className="text-sm text-gold" role="alert">
                {fieldErrors.compatibility || fieldErrors.defaultForInstrumentTypeIds}
              </p>
            ) : null}
            {error ? <p className="text-sm text-gold" role="alert">{errorText(t, "admin.wizardSetup", error)}</p> : null}
            <div className="flex gap-3">
              <Button type="submit" disabled={saving || !canWrite}>{saving ? t("admin.catalog.saving") : t("admin.catalog.save")}</Button>
              <Button type="button" variant="outline" onClick={() => navigate(listHref)}>{t("admin.catalog.back")}</Button>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}
