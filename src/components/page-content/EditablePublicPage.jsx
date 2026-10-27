import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext.jsx";
import { errorText } from "../../auth/errorText.js";
import ConfirmDialog from "../admin/ConfirmDialog.jsx";
import { defaultLocaleContent, localeFromRecord } from "../../data/pageContent.js";
import { useLanguage } from "../../i18n/LanguageContext.jsx";
import { uploadAdminImage } from "../../services/adminCatalogService.js";
import {
  getAdminPageContent,
  getPublicPageContent,
  previewPageContent,
  publishPageContent,
  savePageContentDraft,
} from "../../services/pageContentService.js";
import PageContentEditor from "./PageContentEditor.jsx";
import PageContentRenderer from "./PageContentRenderer.jsx";
import PageContentToolbar from "./PageContentToolbar.jsx";

export default function EditablePublicPage({ pageKey, fallbacks }) {
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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState("");
  const [confirm, setConfirm] = useState(null);

  const dirty = useMemo(() => editing && JSON.stringify(locale) !== snapshot, [editing, locale, snapshot]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const wantPreview = isAdmin && previewRequested;
    if (wantPreview) {
      const result = await previewPageContent(authorizedRequest, pageKey);
      if (!result.ok) {
        setError(result.code);
        setLocale(defaultLocaleContent(pageKey, language));
        setPreview(false);
        setLoading(false);
        return;
      }
      setLocale(localeFromRecord(result.document, language, pageKey));
      setRevision(result.document.revision || 0);
      setPreview(true);
      setEditing(false);
      setLoading(false);
      return;
    }
    const result = await getPublicPageContent(pageKey);
    if (!result.ok && result.code && result.code !== "NOT_FOUND") {
      setError(result.code);
    }
    setLocale(localeFromRecord(result.document, language, pageKey));
    setPreview(false);
    setLoading(false);
  }, [authorizedRequest, isAdmin, language, pageKey, previewRequested]);

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

  async function enterEdit() {
    const result = await getAdminPageContent(authorizedRequest, pageKey);
    if (!result.ok) {
      setError(result.code);
      if (result.code === "UNAUTHORIZED") navigate("/admin/login");
      return;
    }
    const next = localeFromRecord(
      result.document.exists ? { locales: result.document.draft } : null,
      language,
      pageKey,
    );
    if (!result.document.exists) {
      const fallback = defaultLocaleContent(pageKey, language);
      setLocale(fallback);
      setSnapshot(JSON.stringify(fallback));
    } else {
      setLocale(next);
      setSnapshot(JSON.stringify(next));
    }
    setRevision(result.document.revision || 0);
    setEditing(true);
    setPreview(false);
    setStatus("");
  }

  async function saveDraft() {
    setSaving(true);
    setError(null);
    const result = await savePageContentDraft(authorizedRequest, pageKey, {
      language,
      locale,
      expectedRevision: revision,
    });
    setSaving(false);
    if (!result.ok) {
      setError(result.code);
      return false;
    }
    setRevision(result.document.revision);
    setSnapshot(JSON.stringify(locale));
    setStatus(t("admin.pageContent.draftSaved"));
    return result.document;
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
    await load();
  }

  function cancel() {
    if (dirty) {
      setConfirm("cancel");
      return;
    }
    setEditing(false);
    void load();
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
            setSearchParams({ preview: "1" });
          }}
          onExitPreview={() => {
            searchParams.delete("preview");
            setSearchParams(searchParams);
          }}
        />
      ) : null}
      {error ? (
        <p className="mx-auto max-w-7xl px-6 py-3 text-sm text-gold lg:px-10" role="alert">
          {errorText(t, "admin.pageContent", error)}
        </p>
      ) : null}
      {loading ? (
        <p className="mx-auto max-w-7xl px-6 py-16 text-sm text-muted lg:px-10">{t("admin.pageContent.loading")}</p>
      ) : (
        <>
          <PageContentRenderer locale={locale} fallbacks={fallbacks} />
          {editing ? (
            <div className="mx-auto max-w-7xl px-6 pb-16 lg:px-10">
              <PageContentEditor
                locale={locale}
                onChange={setLocale}
                disabled={saving}
                canUpload={canUpload}
                upload={(file) => uploadAdminImage(authorizedFormRequest, { file, scope: "pages" })}
              />
            </div>
          ) : null}
        </>
      )}
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
            void load();
          }
        }}
      />
    </>
  );
}
