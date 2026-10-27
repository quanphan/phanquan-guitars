import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext.jsx";
import { slugifyName } from "../../auth/catalog.js";
import { errorText } from "../../auth/errorText.js";
import CompatibilityPicker, { DefaultForTypesPicker } from "../../components/admin/CompatibilityPicker.jsx";
import ImageUploadField from "../../components/admin/ImageUploadField.jsx";
import Field from "../../components/auth/Field.jsx";
import Button from "../../components/Button.jsx";
import PageHeader from "../../components/PageHeader.jsx";
import { COMPATIBILITY_FIELDS, optionMatchesAlias } from "../../data/wizardCatalog.js";
import {
  categoryStepId,
  compatibilityEditorOptions,
  groupLabel,
  keepAllowedCompatibility,
  precedingGroupIds,
  WIZARD_STEP_COPY,
} from "../../data/wizardSetupLayout.js";
import { useLanguage } from "../../i18n/LanguageContext.jsx";
import { uploadAdminImage } from "../../services/adminCatalogService.js";
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
  viName: "",
  enName: "",
  icon: "",
  imagePath: "",
  active: true,
  isDefault: false,
  defaultForInstrumentTypeIds: [],
  attributes: {},
  compatibility: emptyCompatibility(),
};

export default function WizardOptionEditor() {
  const { categoryId, optionId } = useParams();
  const [searchParams] = useSearchParams();
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
      setLoading(false);
      return;
    }
    const result = await getWizardCategory(authorizedRequest, categoryId);
    if (!result.ok) {
      setError(result.code);
      setLoading(false);
      return;
    }
    const option = result.category.options.find((item) => item.id === optionId);
    if (!option) {
      setError("NOT_FOUND");
      setLoading(false);
      return;
    }
    setForm({
      categoryId,
      code: option.code || "",
      description: option.description || option.translations?.en?.description || option.translations?.vi?.description || "",
      viName: option.translations?.vi?.name || "",
      enName: option.translations?.en?.name || option.name || "",
      icon: option.icon || "",
      imagePath: option.imagePath || "",
      active: option.active !== false,
      isDefault: Boolean(option.isDefault),
      defaultForInstrumentTypeIds: option.defaultForInstrumentTypeIds || [],
      attributes: option.attributes && typeof option.attributes === "object" ? option.attributes : {},
      compatibility: keepAllowedCompatibility(
        { ...emptyCompatibility(), ...(option.compatibility || {}) },
        categoryId,
        listed.categories,
      ),
    });
    setLoading(false);
  }, [authorizedRequest, categoryId, isNew, optionId]);

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

  function setCategory(nextId) {
    setForm((current) => ({
      ...current,
      categoryId: nextId,
      compatibility: keepAllowedCompatibility(current.compatibility, nextId, categories),
      defaultForInstrumentTypeIds: nextId === "instrument-type" ? [] : current.defaultForInstrumentTypeIds,
    }));
  }

  function payload() {
    return {
      name: form.enName || form.viName,
      code: form.code,
      description: form.description,
      icon: form.icon,
      imagePath: form.imagePath,
      active: form.active,
      isDefault: form.isDefault,
      defaultForInstrumentTypeIds: canScopeDefault
        ? form.defaultForInstrumentTypeIds.filter((id) => compatibilityEditorOptions(instrumentTypes).some((option) => (
          optionMatchesAlias(option, "instrument-type", id)
        )))
        : [],
      translations: {
        vi: { name: form.viName, description: form.description },
        en: { name: form.enName || form.viName, description: form.description },
      },
      compatibility: keepAllowedCompatibility(form.compatibility, form.categoryId, categories),
      attributes: form.attributes,
    };
  }

  async function onSave(event) {
    event.preventDefault();
    if (!canWrite) return;
    setSaving(true);
    setError(null);
    setFieldErrors({});
    const body = payload();
    const result = isNew
      ? await createWizardOption(authorizedRequest, form.categoryId, body)
      : await updateWizardOption(authorizedRequest, categoryId, optionId, body);
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
            <Field id="wizard-vi" label={t("admin.wizardSetup.fields.viName")} value={form.viName} onChange={(value) => setField("viName", value)} />
            <Field id="wizard-en" label={t("admin.wizardSetup.fields.enName")} value={form.enName} onChange={(value) => setField("enName", value)} required error={fieldErrors.name} />
            <Field
              id="wizard-code"
              label={t("admin.catalog.fields.slug")}
              value={form.code}
              onChange={(value) => {
                setCodeTouched(true);
                setField("code", value);
              }}
              required
              error={fieldErrors.code}
            />
            <Field id="wizard-desc" label={t("admin.catalog.fields.description")} value={form.description} onChange={(value) => setField("description", value)} multiline rows={3} />
            <Field id="wizard-icon" label={t("admin.wizardSetup.fields.icon")} value={form.icon} onChange={(value) => setField("icon", value)} />
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
              onChange={(value) => setField("compatibility", keepAllowedCompatibility(value, form.categoryId, categories))}
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
