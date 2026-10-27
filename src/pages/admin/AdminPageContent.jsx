import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext.jsx";
import { errorText } from "../../auth/errorText.js";
import ConfirmDialog from "../../components/admin/ConfirmDialog.jsx";
import Field from "../../components/auth/Field.jsx";
import Button from "../../components/Button.jsx";
import PageHeader from "../../components/PageHeader.jsx";
import PageContentEditor from "../../components/page-content/PageContentEditor.jsx";
import {
  defaultLocaleContent,
  isPageKey,
  PAGE_KEYS,
  PAGE_LANGUAGES,
  publicPagePath,
} from "../../data/pageContent.js";
import { useLanguage } from "../../i18n/LanguageContext.jsx";
import { uploadAdminImage } from "../../services/adminCatalogService.js";
import {
  deletePageImageOrphans,
  getAdminPageContent,
  listPageImageOrphans,
  publishPageContent,
  revertPageContent,
  savePageContentDraft,
} from "../../services/pageContentService.js";

export default function AdminPageContent() {
  const { t, language: uiLanguage } = useLanguage();
  const { authorizedRequest, authorizedFormRequest, hasPermission } = useAuth();
  const navigate = useNavigate();
  const canUpload = hasPermission("uploads.write");
  const [pageKey, setPageKey] = useState("about");
  const [language, setLanguage] = useState(uiLanguage === "vi" ? "vi" : "en");
  const [locale, setLocale] = useState(() => defaultLocaleContent("about", "en"));
  const [revision, setRevision] = useState(0);
  const [exists, setExists] = useState(false);
  const [hasPublished, setHasPublished] = useState(false);
  const [snapshot, setSnapshot] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState("");
  const [confirm, setConfirm] = useState(null);
  const [pendingSwitch, setPendingSwitch] = useState(null);
  const [orphans, setOrphans] = useState(null);

  const dirty = useMemo(() => JSON.stringify(locale) !== snapshot, [locale, snapshot]);

  const applyDocument = useCallback((document, nextPage, nextLanguage) => {
    const fallback = defaultLocaleContent(nextPage, nextLanguage);
    const stored = document?.draft?.[nextLanguage];
    const next = document?.exists
      ? { title: stored?.title || "", sections: Array.isArray(stored?.sections) ? stored.sections : [] }
      : fallback;
    setLocale(next);
    setSnapshot(JSON.stringify(next));
    setRevision(document?.revision || 0);
    setExists(Boolean(document?.exists));
    setHasPublished(Boolean(document?.published));
  }, []);

  const load = useCallback(async (nextPage = pageKey, nextLanguage = language) => {
    setLoading(true);
    setError(null);
    setSuccess("");
    const result = await getAdminPageContent(authorizedRequest, nextPage);
    if (!result.ok) {
      setError(result.code);
      setLoading(false);
      if (result.code === "UNAUTHORIZED") {
        navigate("/admin/login?from=/admin/page-content", { replace: true });
      }
      return;
    }
    applyDocument(result.document, nextPage, nextLanguage);
    setLoading(false);
  }, [applyDocument, authorizedRequest, language, navigate, pageKey]);

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

  function requestSwitch(nextPage, nextLanguage) {
    if (nextPage === pageKey && nextLanguage === language) return;
    if (dirty) {
      setPendingSwitch({ pageKey: nextPage, language: nextLanguage });
      setConfirm("switch");
      return;
    }
    setPageKey(nextPage);
    setLanguage(nextLanguage);
  }

  async function saveDraft() {
    setSaving(true);
    setError(null);
    setSuccess("");
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
    applyDocument(result.document, pageKey, language);
    setSuccess(t("admin.pageContent.draftSaved"));
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
    applyDocument(result.document, pageKey, language);
    setSuccess(t("admin.pageContent.published"));
  }

  async function revert() {
    setSaving(true);
    const result = await revertPageContent(authorizedRequest, pageKey, { expectedRevision: revision });
    setSaving(false);
    if (!result.ok) {
      setError(result.code);
      return;
    }
    applyDocument(result.document, pageKey, language);
    setSuccess(t("admin.pageContent.reverted"));
  }

  return (
    <>
      <PageHeader eyebrow={t("admin.eyebrow")} title={t("admin.pageContent.title")} description={t("admin.pageContent.description")} />
      <div className="mx-auto max-w-7xl px-6 pb-24 lg:px-10">
        <div className="mb-8 flex flex-wrap gap-4">
          {PAGE_KEYS.filter(isPageKey).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => requestSwitch(key, language)}
              className={`text-[11px] uppercase tracking-[0.22em] ${pageKey === key ? "text-gold" : "text-ivory/70"}`}
            >
              {t(`admin.pageContent.pages.${key}`)}
            </button>
          ))}
          {PAGE_LANGUAGES.map((code) => (
            <button
              key={code}
              type="button"
              onClick={() => requestSwitch(pageKey, code)}
              className={`text-[11px] uppercase tracking-[0.22em] ${language === code ? "text-gold" : "text-ivory/70"}`}
            >
              {code.toUpperCase()}
            </button>
          ))}
        </div>

        {error ? (
          <p className="mb-6 border border-gold/40 bg-gold/10 px-4 py-3 text-sm" role="alert">
            {errorText(t, "admin.pageContent", error)}
          </p>
        ) : null}
        {success ? <p className="mb-6 text-sm text-gold">{success}</p> : null}
        {dirty ? <p className="mb-6 text-sm text-gold">{t("admin.pageContent.unsaved")}</p> : null}

        {loading ? (
          <p className="text-sm text-muted">{t("admin.pageContent.loading")}</p>
        ) : (
          <form
            className="space-y-8"
            onSubmit={(event) => {
              event.preventDefault();
              void saveDraft();
            }}
          >
            <Field
              id="page-title"
              label={t("admin.pageContent.fields.pageTitle")}
              value={locale.title}
              onChange={(value) => setLocale({ ...locale, title: value })}
              disabled={saving}
              maxLength={200}
            />
            <PageContentEditor
              locale={locale}
              onChange={setLocale}
              disabled={saving}
              canUpload={canUpload}
              upload={(file) => uploadAdminImage(authorizedFormRequest, { file, scope: "pages" })}
            />
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Button type="submit" disabled={saving}>
                {saving ? t("admin.pageContent.saving") : t("admin.pageContent.saveDraft")}
              </Button>
              <Button type="button" variant="outline" disabled={saving} onClick={() => setConfirm("publish")}>
                {t("admin.pageContent.publish")}
              </Button>
              <Button type="button" variant="outline" disabled={saving || !hasPublished} onClick={() => setConfirm("revert")}>
                {t("admin.pageContent.revert")}
              </Button>
              <Link
                to={`${publicPagePath(pageKey)}?preview=1`}
                className="inline-flex items-center px-4 py-3 text-[11px] uppercase tracking-[0.18em] text-gold"
              >
                {t("admin.pageContent.preview")}
              </Link>
            </div>
            {!exists ? <p className="text-sm text-muted">{t("admin.pageContent.fallbackHint")}</p> : null}
          </form>
        )}
        <section className="mt-16 space-y-4 border-t border-white/10 pt-10">
          <h2 className="text-[11px] uppercase tracking-[0.22em] text-gold">{t("admin.pageContent.orphansTitle")}</h2>
          <p className="max-w-3xl text-sm text-muted">{t("admin.pageContent.orphansHint")}</p>
          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              variant="outline"
              disabled={saving}
              onClick={async () => {
                setSaving(true);
                setError(null);
                const result = await listPageImageOrphans(authorizedRequest);
                setSaving(false);
                if (!result.ok) {
                  setError(result.code);
                  return;
                }
                setOrphans(result.listing);
              }}
            >
              {t("admin.pageContent.orphansScan")}
            </Button>
            {canUpload && orphans?.orphans?.length ? (
              <Button type="button" variant="outline" disabled={saving} onClick={() => setConfirm("orphans")}>
                {t("admin.pageContent.orphansDelete")}
              </Button>
            ) : null}
          </div>
          {orphans?.writable === false ? <p className="text-sm text-gold">{t("admin.pageContent.orphansStorage")}</p> : null}
          {orphans && orphans.writable !== false && !orphans.orphans?.length ? (
            <p className="text-sm text-muted">{t("admin.pageContent.orphansEmpty")}</p>
          ) : null}
          {orphans?.orphans?.length ? (
            <ul className="space-y-1 text-sm text-muted">
              {orphans.orphans.map((item) => (
                <li key={item.path} className="break-all">{item.path}</li>
              ))}
            </ul>
          ) : null}
        </section>
      </div>
      <ConfirmDialog
        open={Boolean(confirm)}
        title={
          confirm === "publish"
            ? t("admin.pageContent.confirmPublishTitle")
            : confirm === "revert"
              ? t("admin.pageContent.confirmRevertTitle")
              : confirm === "orphans"
                ? t("admin.pageContent.confirmOrphansTitle")
                : t("admin.pageContent.confirmSwitchTitle")
        }
        body={
          confirm === "publish"
            ? t("admin.pageContent.confirmPublishBody")
            : confirm === "revert"
              ? t("admin.pageContent.confirmRevertBody")
              : confirm === "orphans"
                ? t("admin.pageContent.confirmOrphansBody")
                : t("admin.pageContent.confirmSwitchBody")
        }
        confirmLabel={
          confirm === "publish"
            ? t("admin.pageContent.publish")
            : confirm === "revert"
              ? t("admin.pageContent.revert")
              : confirm === "orphans"
                ? t("admin.pageContent.orphansDelete")
                : t("admin.pageContent.discard")
        }
        cancelLabel={t("admin.cancel")}
        busy={saving}
        onCancel={() => {
          setConfirm(null);
          setPendingSwitch(null);
        }}
        onConfirm={() => {
          const action = confirm;
          const next = pendingSwitch;
          setConfirm(null);
          setPendingSwitch(null);
          if (action === "publish") void publish();
          else if (action === "revert") void revert();
          else if (action === "orphans") {
            void (async () => {
              setSaving(true);
              const result = await deletePageImageOrphans(authorizedRequest, {
                paths: (orphans?.orphans || []).map((item) => item.path),
              });
              setSaving(false);
              if (!result.ok) {
                setError(result.code);
                return;
              }
              setOrphans({ ...result.listing, orphans: result.listing.remaining || [], dryRun: true, writable: true });
              setSuccess(t("admin.pageContent.orphansEmpty"));
            })();
          } else if (next) {
            setPageKey(next.pageKey);
            setLanguage(next.language);
            void load(next.pageKey, next.language);
          }
        }}
      />
    </>
  );
}
