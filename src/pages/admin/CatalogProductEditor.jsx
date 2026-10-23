import { useCallback, useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext.jsx";
import { buildProductPayload } from "../../auth/catalog.js";
import { errorText } from "../../auth/errorText.js";
import {
  copyFormFromProduct,
  editorFormFromProduct,
  emptySpecForm,
  mergeProductSpecs,
  PRODUCT_TYPES,
  SPEC_GROUPS,
  SPEC_TEXTAREA_KEYS,
} from "../../auth/productSpecs.js";
import { fieldErrorsFromPayload } from "../../auth/registerPayload.js";
import ImageUploadField from "../../components/admin/ImageUploadField.jsx";
import Field, { fieldClass, errorFieldClass } from "../../components/auth/Field.jsx";
import Button from "../../components/Button.jsx";
import PageHeader from "../../components/PageHeader.jsx";
import { mediaUrl } from "../../config/api.js";
import { useLanguage } from "../../i18n/LanguageContext.jsx";
import {
  createAdminCatalogProduct,
  getAdminCatalogProduct,
  listCatalogTerms,
  updateAdminCatalogProduct,
  uploadAdminImage,
} from "../../services/adminCatalogService.js";

const emptyForm = {
  name: "",
  code: "",
  productType: "",
  qty: "",
  price: "",
  unit: "",
  description: "",
  descriptionDetail: "",
  status: "draft",
  sortOrder: 0,
  image: "",
  images: [],
  categoryId: "",
  instrumentTypeId: "",
  bodyShapeId: "",
  seriesId: "",
  ...emptySpecForm(),
};

export default function CatalogProductEditor() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const copyFrom = isCopyQuery(searchParams.get("copyFrom"));
  const isNew = !id || id === "new";
  const isCopy = isNew && Boolean(copyFrom);
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const { authorizedRequest, authorizedFormRequest, hasPermission } = useAuth();
  const [form, setForm] = useState(emptyForm);
  const [existingSpecs, setExistingSpecs] = useState(null);
  const [terms, setTerms] = useState({ categories: [], "instrument-types": [], "body-shapes": [], series: [] });
  const [loading, setLoading] = useState(!isNew || Boolean(copyFrom));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [notice, setNotice] = useState(location.state?.saved ? "saved" : null);
  const canRead = hasPermission("catalog.read");
  const canWrite = hasPermission("catalog.write");
  const canUpload = hasPermission("uploads.write");

  const setField = useCallback((key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
  }, []);

  const load = useCallback(async () => {
    if (!canRead) {
      setError("FORBIDDEN");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    setUploadError(null);
    setFieldErrors({});
    setForm(emptyForm);
    setExistingSpecs(null);
    const [categories, types, shapes, series] = await Promise.all([
      listCatalogTerms(authorizedRequest, "categories"),
      listCatalogTerms(authorizedRequest, "instrument-types"),
      listCatalogTerms(authorizedRequest, "body-shapes"),
      listCatalogTerms(authorizedRequest, "series"),
    ]);
    const failed = [categories, types, shapes, series].find((result) => !result.ok);
    if (failed) {
      setError(failed.code);
      setLoading(false);
      if (failed.code === "UNAUTHORIZED") {
        navigate("/admin/login?from=/admin/catalog/products", { replace: true });
      }
      return;
    }
    setTerms({
      categories: categories.items,
      "instrument-types": types.items,
      "body-shapes": shapes.items,
      series: series.items,
    });
    if (!isNew) {
      const detail = await getAdminCatalogProduct(authorizedRequest, id);
      if (!detail.ok) {
        setError(detail.code);
        setLoading(false);
        return;
      }
      const item = detail.item;
      setExistingSpecs(item.specs && typeof item.specs === "object" ? item.specs : null);
      setForm({ ...emptyForm, ...editorFormFromProduct(item) });
    } else if (copyFrom) {
      const detail = await getAdminCatalogProduct(authorizedRequest, copyFrom);
      if (!detail.ok) {
        setError(detail.code);
        setLoading(false);
        return;
      }
      const item = detail.item;
      setExistingSpecs(item.specs && typeof item.specs === "object" ? { ...item.specs } : null);
      setForm({ ...emptyForm, ...copyFormFromProduct(item) });
      setNotice("copied");
    } else {
      setNotice(null);
    }
    setLoading(false);
  }, [authorizedRequest, canRead, copyFrom, id, isNew, navigate]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onSubmit(event) {
    event.preventDefault();
    if (!canWrite || saving) return;
    const payloadForm = {
      ...form,
      specs: mergeProductSpecs(existingSpecs, form),
    };
    const next = buildProductPayload(payloadForm);
    if (!next.ok) {
      setFieldErrors(
        Object.fromEntries(Object.entries(next.errors).map(([key, code]) => [key, t(`admin.catalog.fieldErrors.${code}`)])),
      );
      setError("invalid");
      return;
    }
    setFieldErrors({});
    setError(null);
    setSaving(true);
    const result = isNew
      ? await createAdminCatalogProduct(authorizedRequest, next.body)
      : await updateAdminCatalogProduct(authorizedRequest, id, next.body);
    if (!result.ok) {
      setSaving(false);
      setError(result.code);
      const mapped = fieldErrorsFromPayload({ error: { details: result.details } });
      if (Object.keys(mapped).length) {
        setFieldErrors(
          Object.fromEntries(Object.entries(mapped).map(([key, code]) => [key, t(`admin.catalog.fieldErrors.${code}`)])),
        );
      }
      return;
    }
    const savedId = result.item.id;
    const verified = await getAdminCatalogProduct(authorizedRequest, savedId);
    setSaving(false);
    if (!verified.ok) {
      setError(verified.code);
      return;
    }
    setExistingSpecs(verified.item.specs && typeof verified.item.specs === "object" ? verified.item.specs : null);
    setForm({ ...emptyForm, ...editorFormFromProduct(verified.item) });
    setNotice("saved");
    if (isNew) {
      navigate(`/admin/catalog/products/${savedId}`, { replace: true, state: { saved: true } });
    }
  }

  async function uploadMain(file) {
    return uploadAdminImage(authorizedFormRequest, { file, scope: "guitars" });
  }

  async function uploadGallery(file) {
    setUploadError(null);
    const result = await uploadAdminImage(authorizedFormRequest, { file, scope: "guitars" });
    if (result.ok) {
      setForm((current) => {
        const images = current.images.includes(result.path) ? current.images : [...current.images, result.path];
        return { ...current, images, image: current.image || result.path };
      });
    } else {
      setUploadError(result.code);
    }
    return result;
  }

  function moveImage(index, direction) {
    setForm((current) => {
      const images = current.images.slice();
      const next = index + direction;
      if (next < 0 || next >= images.length) return current;
      [images[index], images[next]] = [images[next], images[index]];
      return { ...current, images, image: images[0] || current.image };
    });
  }

  function removeImage(path) {
    setForm((current) => {
      const images = current.images.filter((item) => item !== path);
      return {
        ...current,
        images,
        image: current.image === path ? images[0] || "" : current.image,
      };
    });
  }

  const disabled = saving || !canWrite;

  return (
    <>
      <PageHeader
        eyebrow={t("admin.eyebrow")}
        title={isNew ? t("admin.catalog.createProductTitle") : t("admin.catalog.editProductTitle")}
        description={t("admin.catalog.groups.products")}
      >
        <Link to="/admin/catalog/products" className="mt-8 inline-flex text-[11px] uppercase tracking-[0.22em] text-gold">
          {t("admin.catalog.back")}
        </Link>
      </PageHeader>
      <div className="mx-auto mt-8 max-w-6xl px-6 lg:px-10">
        {loading ? (
          <p className="text-sm text-muted">{t("admin.loadingBody")}</p>
        ) : (
          <form key={isCopy ? `copy-${copyFrom}` : isNew ? "new" : id} className="space-y-6" onSubmit={onSubmit} noValidate>
            {notice ? (
              <p className="border border-gold/40 px-4 py-3 text-sm" role="status">
                {t(`admin.catalog.notices.${notice}`)}
              </p>
            ) : null}
            {error ? (
              <p className="border border-gold/40 bg-gold/10 px-4 py-3 text-sm" role="alert">
                {error === "invalid" ? t("auth.formIncomplete") : errorText(t, "admin.catalog", error)}
              </p>
            ) : null}
            {uploadError ? (
              <p className="border border-gold/40 bg-gold/10 px-4 py-3 text-sm" role="alert">
                {errorText(t, "admin.catalog", uploadError)}
              </p>
            ) : null}

            <Section title={t("admin.catalog.sections.basic")}>
              <div className="grid gap-5 md:grid-cols-2">
                <Field id="product-name" label={t("admin.catalog.fields.name")} value={form.name} onChange={(value) => setField("name", value)} disabled={disabled} required error={fieldErrors.name} />
                <Field id="product-code" label={t("admin.catalog.fields.code")} value={form.code} onChange={(value) => setField("code", value)} disabled={disabled} />
                <fieldset className="md:col-span-2">
                  <legend className="text-[11px] uppercase tracking-[0.18em] text-gold">
                    {t("admin.catalog.fields.productType")} *
                  </legend>
                  <div className="mt-3 flex flex-wrap gap-4">
                    {[PRODUCT_TYPES.CUSTOM_ORDER, PRODUCT_TYPES.READY_STOCK].map((value) => (
                      <label key={value} className="flex items-center gap-2 text-sm text-ivory">
                        <input
                          type="radio"
                          name="productType"
                          value={value}
                          checked={form.productType === value}
                          onChange={() => setField("productType", value)}
                          disabled={disabled}
                          className="accent-gold"
                        />
                        {t(`admin.catalog.productTypes.${value}`)}
                      </label>
                    ))}
                  </div>
                  {fieldErrors.productType ? <p className="mt-2 text-xs text-gold">{fieldErrors.productType}</p> : null}
                </fieldset>
                <label className="block text-[11px] uppercase tracking-[0.18em] text-gold">
                  {t("admin.catalog.fields.status")}
                  <select value={form.status} onChange={(event) => setField("status", event.target.value)} disabled={disabled} className={fieldClass}>
                    <option value="draft">{t("admin.catalog.draft")}</option>
                    <option value="published">{t("admin.catalog.published")}</option>
                  </select>
                </label>
                <RelationSelect id="product-category" label={t("admin.catalog.fields.category")} value={form.categoryId} onChange={(value) => setField("categoryId", value)} items={terms.categories} disabled={disabled} emptyLabel={t("admin.catalog.none")} />
                <RelationSelect id="product-instrument" label={t("admin.catalog.fields.instrumentType")} value={form.instrumentTypeId} onChange={(value) => setField("instrumentTypeId", value)} items={terms["instrument-types"]} disabled={disabled} emptyLabel={t("admin.catalog.none")} />
                <RelationSelect id="product-shape" label={t("admin.catalog.fields.bodyShape")} value={form.bodyShapeId} onChange={(value) => setField("bodyShapeId", value)} items={terms["body-shapes"]} disabled={disabled} emptyLabel={t("admin.catalog.none")} />
                <RelationSelect id="product-series" label={t("admin.catalog.fields.series")} value={form.seriesId} onChange={(value) => setField("seriesId", value)} items={terms.series} disabled={disabled} emptyLabel={t("admin.catalog.none")} />
                <Field id="product-sort" label={t("admin.catalog.fields.sortOrder")} type="number" value={String(form.sortOrder)} onChange={(value) => setField("sortOrder", value === "" ? 0 : Number(value))} disabled={disabled} error={fieldErrors.sortOrder} />
                <Field id="product-qty" label={t("admin.catalog.fields.qty")} type="number" value={String(form.qty)} onChange={(value) => setField("qty", value)} disabled={disabled} error={fieldErrors.qty} />
                <div className="grid grid-cols-2 gap-3">
                  <Field id="product-price" label={t("admin.catalog.fields.price")} type="number" value={form.price} onChange={(value) => setField("price", value)} disabled={disabled} error={fieldErrors.price} />
                  <Field id="product-unit" label={t("admin.catalog.fields.unit")} value={form.unit} onChange={(value) => setField("unit", value)} disabled={disabled} />
                </div>
                <div className="md:col-span-2">
                  <TextArea id="product-description" label={t("admin.catalog.fields.shortDescription")} value={form.description} onChange={(value) => setField("description", value)} disabled={disabled} rows={3} />
                </div>
              </div>
            </Section>

            <Section title={t("admin.catalog.sections.images")}>
              <ImageUploadField
                label={t("admin.catalog.fields.image")}
                storedPath={form.image}
                canUpload={canUpload && canWrite}
                disabled={saving}
                onUploaded={(path) => {
                  setForm((current) => ({
                    ...current,
                    image: path,
                    images: current.images.includes(path) ? current.images : [path, ...current.images],
                  }));
                }}
                upload={uploadMain}
              />
              <div className="mt-6">
                <p className="text-[11px] uppercase tracking-[0.18em] text-gold">{t("admin.catalog.fields.gallery")}</p>
                <ul className="mt-3 space-y-3">
                  {form.images.map((path, index) => (
                    <li key={path} className="flex flex-wrap items-center gap-3 border border-white/8 p-3">
                      <img src={mediaUrl(path)} alt="" className="h-16 w-16 object-cover" />
                      <p className="min-w-0 flex-1 break-all text-xs text-muted">{path}</p>
                      <button type="button" disabled={disabled || index === 0} onClick={() => moveImage(index, -1)} className="text-[11px] uppercase tracking-[0.16em] text-gold disabled:opacity-40">
                        {t("admin.catalog.up")}
                      </button>
                      <button type="button" disabled={disabled || index === form.images.length - 1} onClick={() => moveImage(index, 1)} className="text-[11px] uppercase tracking-[0.16em] text-gold disabled:opacity-40">
                        {t("admin.catalog.down")}
                      </button>
                      <button type="button" disabled={disabled} onClick={() => removeImage(path)} className="text-[11px] uppercase tracking-[0.16em] text-gold">
                        {t("admin.catalog.removeImage")}
                      </button>
                    </li>
                  ))}
                </ul>
                {canUpload && canWrite ? (
                  <label className="mt-3 inline-flex cursor-pointer border border-gold/70 px-4 py-2 text-[11px] uppercase tracking-[0.18em] text-ivory hover:bg-gold/10">
                    {t("admin.catalog.addGalleryImage")}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      className="sr-only"
                      disabled={saving}
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        event.target.value = "";
                        if (file) void uploadGallery(file);
                      }}
                    />
                  </label>
                ) : null}
              </div>
            </Section>

            <Section title={t("admin.catalog.sections.specs")}>
              <p className="text-sm text-muted">{t("admin.catalog.specsHint")}</p>
              {SPEC_GROUPS.map((group) => (
                <SpecGroup
                  key={`${id || "new"}-${group.id}`}
                  title={t(`admin.catalog.specGroups.${group.id}`)}
                  initiallyOpen={group.id === "instrument" || group.id === "electronics" || group.id === "finish"}
                >
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    {group.keys.map((key) =>
                      SPEC_TEXTAREA_KEYS.includes(key) ? (
                        <div key={key} className="md:col-span-2">
                          <TextArea
                            id={`spec-${key}`}
                            label={t(`guitars.specLabels.${key}`)}
                            value={form[key] || ""}
                            onChange={(value) => setField(key, value)}
                            disabled={disabled}
                            rows={key === "pickupConfiguration" ? 5 : 3}
                          />
                          {key === "pickupConfiguration" ? (
                            <p className="mt-2 text-xs text-muted">{t("admin.catalog.pickupHint")}</p>
                          ) : null}
                        </div>
                      ) : (
                        <Field
                          key={key}
                          id={`spec-${key}`}
                          label={t(`guitars.specLabels.${key}`)}
                          value={form[key] || ""}
                          onChange={(value) => setField(key, value)}
                          disabled={disabled}
                        />
                      ),
                    )}
                  </div>
                  {group.id === "additional" ? (
                    <div className="mt-4">
                      <TextArea id="product-description-detail" label={t("admin.catalog.fields.descriptionDetail")} value={form.descriptionDetail} onChange={(value) => setField("descriptionDetail", value)} disabled={disabled} rows={5} />
                    </div>
                  ) : null}
                </SpecGroup>
              ))}
            </Section>

            {canWrite ? (
              <Button type="submit" disabled={saving}>
                {saving ? t("admin.catalog.saving") : t("admin.catalog.save")}
              </Button>
            ) : (
              <p className="text-sm text-muted">{t("admin.catalog.readOnly")}</p>
            )}
          </form>
        )}
      </div>
    </>
  );
}

function SpecGroup({ title, initiallyOpen, children }) {
  const [open, setOpen] = useState(Boolean(initiallyOpen));
  return (
    <details
      className="mt-4 border border-white/8 p-4"
      open={open}
      onToggle={(event) => {
        const details = event.currentTarget;
        const nextOpen = details instanceof HTMLDetailsElement ? details.open : null;
        if (typeof nextOpen !== "boolean") return;
        setOpen(nextOpen);
      }}
    >
      <summary className="cursor-pointer text-[11px] uppercase tracking-[0.2em] text-gold">{title}</summary>
      {children}
    </details>
  );
}

function Section({ title, children }) {
  return (
    <section className="border border-white/10 bg-panel/40 p-5 sm:p-6">
      <h2 className="text-[11px] uppercase tracking-[0.22em] text-gold">{title}</h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function TextArea({ id, label, value, onChange, disabled, error, rows = 4 }) {
  return (
    <div>
      <label htmlFor={id} className="text-[11px] uppercase tracking-[0.18em] text-gold">
        {label}
      </label>
      <textarea
        id={id}
        rows={rows}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        className={error ? errorFieldClass : fieldClass}
      />
    </div>
  );
}

function isCopyQuery(value) {
  const id = typeof value === "string" ? value.trim() : "";
  if (!id || id === "new") return "";
  return id;
}

function RelationSelect({ id, label, value, onChange, items, disabled, emptyLabel }) {
  return (
    <label htmlFor={id} className="block text-[11px] uppercase tracking-[0.18em] text-gold">
      {label}
      <select id={id} value={value} onChange={(event) => onChange(event.target.value)} disabled={disabled} className={fieldClass}>
        <option value="">{emptyLabel}</option>
        {items.map((item) => (
          <option key={item.id} value={item.id}>
            {item.name}
          </option>
        ))}
      </select>
    </label>
  );
}
