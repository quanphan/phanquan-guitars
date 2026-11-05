import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { moveId } from "../../auth/catalog.js";
import { useAuth } from "../../auth/AuthContext.jsx";
import { errorText } from "../../auth/errorText.js";
import ConfirmDialog from "../../components/admin/ConfirmDialog.jsx";
import Button from "../../components/Button.jsx";
import PageHeader from "../../components/PageHeader.jsx";
import { footerLinkLocale } from "../../data/footerQuickLinks.js";
import { useLanguage } from "../../i18n/LanguageContext.jsx";
import {
  deleteAdminFooterQuickLink,
  listAdminFooterQuickLinks,
  reorderAdminFooterQuickLinks,
  updateAdminFooterQuickLink,
} from "../../services/footerQuickLinkService.js";

export default function AdminFooterQuickLinks() {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const { authorizedRequest, isAdmin } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);

  const load = useCallback(async () => {
    if (!isAdmin) {
      setError("FORBIDDEN");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const listed = await listAdminFooterQuickLinks(authorizedRequest);
    if (!listed.ok) {
      setError(listed.code);
      setLoading(false);
      if (listed.code === "UNAUTHORIZED") {
        navigate("/admin/login?from=/admin/settings/footer-links", { replace: true });
      }
      return;
    }
    setItems(listed.items);
    setLoading(false);
  }, [authorizedRequest, isAdmin, navigate]);

  useEffect(() => {
    void load();
  }, [load]);

  async function move(id, direction) {
    const nextIds = moveId(items.map((item) => item.id), id, direction);
    if (!nextIds) return;
    setBusyId(id);
    const result = await reorderAdminFooterQuickLinks(authorizedRequest, nextIds);
    setBusyId(null);
    if (!result.ok) {
      setError(result.code);
      return;
    }
    setItems(result.items);
    setNotice("reordered");
  }

  async function toggle(item) {
    setBusyId(item.id);
    const result = await updateAdminFooterQuickLink(authorizedRequest, item.id, { isActive: item.isActive === false });
    setBusyId(null);
    if (!result.ok) {
      setError(result.code);
      return;
    }
    setItems((current) => current.map((row) => (row.id === item.id ? result.item : row)));
    setNotice("saved");
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    setBusyId(pendingDelete.id);
    const result = await deleteAdminFooterQuickLink(authorizedRequest, pendingDelete.id);
    setBusyId(null);
    setPendingDelete(null);
    if (!result.ok) {
      setError(result.code);
      return;
    }
    setNotice("deleted");
    await load();
  }

  return (
    <section className="pb-24">
      <PageHeader
        eyebrow={t("admin.eyebrow")}
        title={t("admin.footerLinks.title")}
        description={t("admin.footerLinks.description")}
      >
        {isAdmin ? (
          <div className="mt-8">
            <Button to="/admin/settings/footer-links/new">{t("admin.footerLinks.add")}</Button>
          </div>
        ) : null}
      </PageHeader>

      <div className="mx-auto mt-10 max-w-7xl px-6 lg:px-10">
        {error ? <p className="text-sm text-gold" role="alert">{errorText(t, "admin.brandSettings", error)}</p> : null}
        {notice ? <p className="text-sm text-ivory/80">{t(`admin.catalog.notices.${notice}`)}</p> : null}
        {loading ? <p className="text-sm text-muted">{t("admin.footerLinks.loading")}</p> : null}
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-[11px] uppercase tracking-[0.16em] text-muted">
              <tr>
                <th className="py-3 pr-4">{t("admin.footerLinks.fields.title")}</th>
                <th className="py-3 pr-4">{t("admin.footerLinks.fields.url")}</th>
                <th className="py-3 pr-4">{t("admin.footerLinks.fields.linkType")}</th>
                <th className="py-3 pr-4">{t("admin.footerLinks.fields.status")}</th>
                <th className="py-3">{t("admin.footerLinks.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-t border-white/10">
                  <td className="py-4 pr-4 text-ivory">{footerLinkLocale(item, language).title || item.title}</td>
                  <td className="py-4 pr-4 text-muted">{item.url}</td>
                  <td className="py-4 pr-4 text-muted">{t(`admin.footerLinks.linkTypes.${item.linkType}`)}</td>
                  <td className="py-4 pr-4 text-muted">
                    {item.isActive === false ? t("admin.footerLinks.hidden") : t("admin.footerLinks.visible")}
                  </td>
                  <td className="py-4">
                    <div className="flex flex-wrap gap-3">
                      <Link className="text-gold" to={`/admin/settings/footer-links/${item.id}`}>{t("admin.footerLinks.edit")}</Link>
                      <Link className="text-gold" to={`/admin/settings/footer-links/new?copyFrom=${encodeURIComponent(item.id)}`}>
                        {t("admin.footerLinks.copyNew")}
                      </Link>
                      <button type="button" className="text-ivory/80" disabled={busyId === item.id} onClick={() => void move(item.id, -1)}>
                        {t("admin.pageContent.moveUp")}
                      </button>
                      <button type="button" className="text-ivory/80" disabled={busyId === item.id} onClick={() => void move(item.id, 1)}>
                        {t("admin.pageContent.moveDown")}
                      </button>
                      <button type="button" className="text-ivory/80" disabled={busyId === item.id} onClick={() => void toggle(item)}>
                        {item.isActive === false ? t("admin.footerLinks.show") : t("admin.footerLinks.hide")}
                      </button>
                      <button type="button" className="text-gold" onClick={() => setPendingDelete(item)}>
                        {t("admin.delete")}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && items.length === 0 ? (
            <p className="mt-6 text-sm text-muted">{t("admin.footerLinks.empty")}</p>
          ) : null}
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title={t("admin.footerLinks.deleteTitle")}
        body={t("admin.footerLinks.deleteBody")}
        confirmLabel={t("admin.delete")}
        cancelLabel={t("admin.cancel")}
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => void confirmDelete()}
      />
    </section>
  );
}
