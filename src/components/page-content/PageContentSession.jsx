import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext.jsx";
import { errorText } from "../../auth/errorText.js";
import ConfirmDialog from "../admin/ConfirmDialog.jsx";
import {
  copySharedSectionImages,
  defaultLocaleContent,
  editorLocaleFromDocument,
  localeFromRecord,
  setSectionImage,
} from "../../data/pageContent.js";
import { useLanguage } from "../../i18n/LanguageContext.jsx";
import { uploadAdminImage } from "../../services/adminCatalogService.js";
import {
  getAdminPageContent,
  getPublicPageContent,
  previewPageContent,
  publishPageContent,
  savePageContentDraft,
} from "../../services/pageContentService.js";
import PageContentToolbar from "./PageContentToolbar.jsx";

export default function PageContentSession({ pageKey, children }) {
  const { t, language } = useLanguage();
  const { isAdmin, authorizedRequest, authorizedFormRequest, hasPermission } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const previewRequested = searchParams.get("preview") === "1";
  const canUpload = hasPermission("uploads.write");
  const [locale, setLocale] = useState(() => defaultLocaleContent(pageKey, language));
  const [revision, setRevision] = useState(0);
  const [editing, setEditing] = useState(false);
  const [preview, setPreview] = useState(false);
  const [snapshot, setSnapshot] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState("");
  const [confirm, setConfirm] = useState(null);

  const dirty = useMemo(() => editing && JSON.stringify(locale) !== snapshot, [editing, locale, snapshot]);

  const load = useCallback(async (wantEdit = editing) => {
    setError(null);
    if (isAdmin && previewRequested && !wantEdit) {
      const result = await previewPageContent(authorizedRequest, pageKey);
      if (!result.ok) {
        setError(result.code);
        setLocale(defaultLocaleContent(pageKey, language));
        setPreview(false);
        return;
      }
      setLocale(localeFromRecord(result.document, language, pageKey));
      setRevision(result.document.revision || 0);
      setPreview(true);
      setEditing(false);
      return;
    }
    if (isAdmin && wantEdit) {
      const result = await getAdminPageContent(authorizedRequest, pageKey);
      if (!result.ok) {
        setError(result.code);
        if (result.code === "UNAUTHORIZED") navigate("/admin/login");
        return;
      }
      const next = editorLocaleFromDocument(result.document, language, pageKey).locale;
      setLocale(next);
      setSnapshot(JSON.stringify(next));
      setRevision(result.document.revision || 0);
      setPreview(false);
      return;
    }
    const result = await getPublicPageContent(pageKey);
    if (!result.ok && result.code && result.code !== "NOT_FOUND") {
      setError(result.code);
    }
    setLocale(localeFromRecord(result.document, language, pageKey));
    setPreview(false);
  }, [authorizedRequest, editing, isAdmin, language, navigate, pageKey, previewRequested]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!dirty) return undefined;
    const onLeave = (event) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", onLeave);
    return () => window.removeEventListener("beforeunload", onLeave);
  }, [dirty]);

  async function persistLocale(nextLocale) {
    setSaving(true);
    setError(null);
    const first = await savePageContentDraft(authorizedRequest, pageKey, {
      language,
      locale: nextLocale,
      expectedRevision: revision,
    });
    if (!first.ok) {
      setSaving(false);
      setError(first.code);
      return first;
    }
    const otherLanguage = language === "vi" ? "en" : "vi";
    const otherLocale = copySharedSectionImages(
      nextLocale,
      editorLocaleFromDocument(first.document, otherLanguage, pageKey).locale,
    );
    const second = await savePageContentDraft(authorizedRequest, pageKey, {
      language: otherLanguage,
      locale: otherLocale,
      expectedRevision: first.document.revision,
    });
    if (!second.ok) {
      setSaving(false);
      setRevision(first.document.revision);
      setLocale(nextLocale);
      setSnapshot(JSON.stringify(nextLocale));
      setError(second.code);
      return second;
    }
    setSaving(false);
    setRevision(second.document.revision);
    setLocale(nextLocale);
    setSnapshot(JSON.stringify(nextLocale));
    setStatus(t("admin.pageContent.draftSaved"));
    return { ok: true, document: second.document };
  }

  async function enterEdit() {
    setEditing(true);
    setStatus("");
    await load(true);
  }

  async function saveDraft() {
    const saved = await persistLocale(locale);
    return saved.ok ? saved.document : null;
  }

  async function publish() {
    let expected = revision;
    if (dirty) {
      const saved = await saveDraft();
      if (!saved) return;
      expected = saved.revision;
    }
    setSaving(true);
    const result = await publishPageContent(authorizedRequest, pageKey, { expectedRevision: expected });
    setSaving(false);
    if (!result.ok) {
      setError(result.code);
      return;
    }
    setRevision(result.document.revision);
    setEditing(false);
    setStatus(t("admin.pageContent.published"));
    await load(false);
  }

  function cancel() {
    if (dirty) {
      setConfirm("cancel");
      return;
    }
    setEditing(false);
    void load(false);
  }

  async function replaceImage(sectionId, field, file) {
    if (!canUpload) return { ok: false, code: "FORBIDDEN" };
    const uploaded = await uploadAdminImage(authorizedFormRequest, { file, scope: "pages" });
    if (!uploaded.ok) return uploaded;
    const next = setSectionImage(locale, sectionId, field, uploaded.path);
    const saved = await persistLocale(next);
    return saved.ok ? { ok: true, path: uploaded.path } : saved;
  }

  return (
    <>
      {isAdmin ? (
        <PageContentToolbar
          preview={preview}
          editing={editing}
          dirty={dirty}
          saving={saving}
          status={status}
          onEdit={() => void enterEdit()}
          onCancel={cancel}
          onSaveDraft={() => void saveDraft()}
          onPublish={() => setConfirm("publish")}
          onPreview={() => {
            setEditing(false);
            const next = new URLSearchParams(searchParams);
            next.set("preview", "1");
            setSearchParams(next);
          }}
          onExitPreview={() => {
            const next = new URLSearchParams(searchParams);
            next.delete("preview");
            setSearchParams(next);
          }}
        />
      ) : null}
      {error ? (
        <p className="mx-auto max-w-7xl px-6 py-3 text-sm text-gold lg:px-10" role="alert">
          {errorText(t, "admin.pageContent", error)}
        </p>
      ) : null}
      {typeof children === "function" ? children({ locale, editing, saving, canUpload, replaceImage }) : children}
      <ConfirmDialog
        open={Boolean(confirm)}
        title={confirm === "publish" ? t("admin.pageContent.confirmPublishTitle") : t("admin.pageContent.confirmCancelTitle")}
        body={confirm === "publish" ? t("admin.pageContent.confirmPublishBody") : t("admin.pageContent.confirmCancelBody")}
        confirmLabel={confirm === "publish" ? t("admin.pageContent.publish") : t("admin.pageContent.discard")}
        cancelLabel={t("admin.cancel")}
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          const action = confirm;
          setConfirm(null);
          if (action === "publish") void publish();
          else {
            setEditing(false);
            void load(false);
          }
        }}
      />
    </>
  );
}
