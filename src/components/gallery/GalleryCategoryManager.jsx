import { useMemo, useState } from "react";
import { slugifyName } from "../../auth/catalog.js";
import { errorText } from "../../auth/errorText.js";
import ConfirmDialog from "../admin/ConfirmDialog.jsx";
import Field from "../auth/Field.jsx";
import Button from "../Button.jsx";
import { galleryCategoryName } from "../../data/gallery.js";
import { useLanguage } from "../../i18n/LanguageContext.jsx";
import {
  deleteGalleryCategory,
  reorderGalleryCategories,
  saveGalleryCategory,
} from "../../services/galleryService.js";

const emptyForm = { id: "", slug: "", nameEn: "", nameVi: "", isActive: true };

export default function GalleryCategoryManager({ categories, onChange, authorizedRequest }) {
  const { t, language } = useLanguage();
  const [form, setForm] = useState(emptyForm);
  const [slugLocked, setSlugLocked] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);

  const editing = Boolean(form.id);
  const ordered = useMemo(
    () => [...(categories || [])].sort((a, b) => (Number(a.sortOrder) || 0) - (Number(b.sortOrder) || 0)),
    [categories],
  );

  function reset() {
    setForm(emptyForm);
    setSlugLocked(false);
    setError(null);
  }

  function edit(item) {
    setForm({
      id: item.id,
      slug: item.slug || "",
      nameEn: item.translations?.en?.name || "",
      nameVi: item.translations?.vi?.name || "",
      isActive: item.isActive !== false,
    });
    setSlugLocked(true);
    setError(null);
  }

  async function onSave() {
    setSaving(true);
    setError(null);
    const result = await saveGalleryCategory(
      authorizedRequest,
      {
        slug: form.slug,
        nameEn: form.nameEn,
        nameVi: form.nameVi,
        isActive: form.isActive,
      },
      form.id || undefined,
    );
    setSaving(false);
    if (!result.ok) {
      setError(result.code);
      return;
    }
    reset();
    onChange();
  }

  async function move(id, direction) {
    const ids = ordered.map((item) => item.id);
    const index = ids.indexOf(id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= ids.length) return;
    [ids[index], ids[target]] = [ids[target], ids[index]];
    setSaving(true);
    const result = await reorderGalleryCategories(authorizedRequest, ids);
    setSaving(false);
    if (!result.ok) {
      setError(result.code);
      return;
    }
    onChange(result.items);
  }

  async function toggle(item) {
    setSaving(true);
    const result = await saveGalleryCategory(
      authorizedRequest,
      { isActive: item.isActive === false },
      item.id,
    );
    setSaving(false);
    if (!result.ok) {
      setError(result.code);
      return;
    }
    onChange();
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    setSaving(true);
    const result = await deleteGalleryCategory(authorizedRequest, pendingDelete.id);
    setSaving(false);
    if (!result.ok) {
      setError(result.code);
      setPendingDelete(null);
      return;
    }
    setPendingDelete(null);
    if (form.id === pendingDelete.id) reset();
    onChange();
  }

  return (
    <section className="mx-auto mt-10 max-w-7xl border border-white/10 bg-ink/40 px-6 py-6 lg:px-10">
      <h2 className="text-[11px] uppercase tracking-[0.22em] text-gold">{t("gallery.categories.title")}</h2>
      <p className="mt-2 max-w-3xl text-sm text-muted">{t("gallery.categories.hint")}</p>
      {error ? (
        <p className="mt-4 text-sm text-gold" role="alert">
          {errorText(t, "gallery", error)}
        </p>
      ) : null}
      <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.8fr)]">
        <ul className="space-y-3">
          {ordered.map((item, index) => (
            <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 border border-white/10 px-4 py-3">
              <div>
                <p className="text-sm text-ivory">{galleryCategoryName(item, language)}</p>
                <p className="mt-1 text-[11px] uppercase tracking-[0.16em] text-muted">{item.slug}</p>
                {item.isActive === false ? (
                  <p className="mt-1 text-[11px] uppercase tracking-[0.16em] text-gold">{t("gallery.categories.disabled")}</p>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-3">
                <button type="button" className="text-[11px] uppercase tracking-[0.16em] text-ivory/70 hover:text-gold" disabled={saving || index === 0} onClick={() => void move(item.id, -1)}>
                  {t("gallery.form.up")}
                </button>
                <button type="button" className="text-[11px] uppercase tracking-[0.16em] text-ivory/70 hover:text-gold" disabled={saving || index === ordered.length - 1} onClick={() => void move(item.id, 1)}>
                  {t("gallery.form.down")}
                </button>
                <button type="button" className="text-[11px] uppercase tracking-[0.16em] text-gold" disabled={saving} onClick={() => edit(item)}>
                  {t("gallery.edit")}
                </button>
                <button type="button" className="text-[11px] uppercase tracking-[0.16em] text-gold" disabled={saving} onClick={() => void toggle(item)}>
                  {item.isActive === false ? t("gallery.categories.enable") : t("gallery.categories.disable")}
                </button>
                <button
                  type="button"
                  className="text-[11px] uppercase tracking-[0.16em] text-ivory/70 hover:text-gold"
                  disabled={saving || (item.usageCount || 0) > 0}
                  onClick={() => setPendingDelete(item)}
                >
                  {t("gallery.delete")}
                </button>
              </div>
            </li>
          ))}
        </ul>
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            void onSave();
          }}
        >
          <p className="text-[11px] uppercase tracking-[0.18em] text-gold">
            {editing ? t("gallery.categories.edit") : t("gallery.categories.add")}
          </p>
          <Field
            id="gallery-cat-en"
            label={t("gallery.categories.nameEn")}
            value={form.nameEn}
            onChange={(value) => {
              setForm((current) => ({
                ...current,
                nameEn: value,
                slug: slugLocked ? current.slug : slugifyName(value || current.nameVi),
              }));
            }}
            disabled={saving}
            required
          />
          <Field
            id="gallery-cat-vi"
            label={t("gallery.categories.nameVi")}
            value={form.nameVi}
            onChange={(value) => setForm((current) => ({ ...current, nameVi: value }))}
            disabled={saving}
            required
          />
          <Field
            id="gallery-cat-slug"
            label={t("gallery.categories.slug")}
            value={form.slug}
            onChange={(value) => {
              setSlugLocked(true);
              setForm((current) => ({ ...current, slug: value }));
            }}
            disabled={saving}
            required
          />
          <label className="flex items-center gap-3 text-sm text-ivory">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))}
              disabled={saving}
            />
            {t("gallery.categories.enabled")}
          </label>
          <div className="flex gap-3">
            <Button type="submit" disabled={saving}>
              {saving ? t("gallery.form.saving") : t("gallery.form.save")}
            </Button>
            {editing ? (
              <Button type="button" variant="outline" disabled={saving} onClick={reset}>
                {t("gallery.form.cancel")}
              </Button>
            ) : null}
          </div>
        </form>
      </div>
      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title={t("gallery.categories.deleteTitle")}
        body={t("gallery.categories.deleteBody")}
        confirmLabel={t("gallery.delete")}
        cancelLabel={t("gallery.confirmDelete.cancel")}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setPendingDelete(null)}
      />
    </section>
  );
}
