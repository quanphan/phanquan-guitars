import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext.jsx";
import ConfirmDialog from "../../components/admin/ConfirmDialog.jsx";
import PageHeader from "../../components/PageHeader.jsx";
import { useLanguage } from "../../i18n/LanguageContext.jsx";
import { deleteAdminMessage, listAdminMessages } from "../../services/adminMessageService.js";

const PAGE_SIZE = 10;

export default function AdminMessages() {
  const { t, language } = useLanguage();
  const { authorizedRequest, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const listed = await listAdminMessages(authorizedRequest, { page, limit: PAGE_SIZE });
    if (!listed.ok) {
      setItems([]);
      setMeta(null);
      setError(listed.code);
      setLoading(false);
      if (listed.code === "UNAUTHORIZED") {
        navigate("/admin/login?from=/admin/messages", { replace: true });
      }
      return;
    }
    setItems(listed.items);
    setMeta(listed.meta);
    setLoading(false);
  }, [authorizedRequest, navigate, page]);

  useEffect(() => {
    void load();
  }, [load]);

  async function confirmDelete() {
    if (!pendingDelete || deleting) return;
    setDeleting(true);
    const result = await deleteAdminMessage(authorizedRequest, pendingDelete.id);
    setDeleting(false);
    if (!result.ok) {
      setError(result.code);
      setPendingDelete(null);
      return;
    }
    setPendingDelete(null);
    await load();
  }

  const dateFormatter = new Intl.DateTimeFormat(language === "vi" ? "vi-VN" : "en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <section className="pb-24">
      <PageHeader
        eyebrow={t("admin.eyebrow")}
        title={t("admin.messages.title")}
        description={t("admin.messages.description")}
      />

      <div className="mx-auto mt-10 max-w-7xl px-6 lg:px-10">
        {error ? (
          <div className="border border-gold/40 bg-gold/10 px-4 py-4 text-sm text-ivory" role="alert">
            <p>
              {t(`admin.errors.${error}`) === `admin.errors.${error}`
                ? t("admin.errors.failure")
                : t(`admin.errors.${error}`)}
            </p>
            <button
              type="button"
              onClick={() => void load()}
              className="mt-3 text-[11px] uppercase tracking-[0.18em] text-gold hover:text-gold-light"
            >
              {t("admin.retry")}
            </button>
          </div>
        ) : null}

        {loading ? (
          <p className="mt-10 text-sm text-muted" role="status">
            {t("admin.loadingBody")}
          </p>
        ) : !error && items.length === 0 ? (
          <p className="mt-10 border border-white/10 px-4 py-6 text-sm text-muted" role="status">
            {t("admin.messages.empty")}
          </p>
        ) : null}

        {!loading && items.length > 0 ? (
          <div className="mt-8 overflow-x-auto border border-white/10">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-ink text-[11px] uppercase tracking-[0.16em] text-gold">
                <tr>
                  <th className="px-4 py-3 font-medium">{t("admin.messages.columns.customer")}</th>
                  <th className="px-4 py-3 font-medium">{t("admin.messages.columns.email")}</th>
                  <th className="px-4 py-3 font-medium">{t("admin.messages.columns.type")}</th>
                  <th className="px-4 py-3 font-medium">{t("admin.messages.columns.subject")}</th>
                  <th className="px-4 py-3 font-medium">{t("admin.messages.columns.date")}</th>
                  <th className="px-4 py-3 font-medium">
                    <span className="sr-only">{t("admin.inquiries.columns.actions")}</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-t border-white/8 text-ivory/90">
                    <td className="px-4 py-4 align-top">{item.name || "—"}</td>
                    <td className="px-4 py-4 align-top">{item.email || "—"}</td>
                    <td className="px-4 py-4 align-top">
                      {item.inquiryType
                        ? t(`contact.types.${item.inquiryType}.title`) === `contact.types.${item.inquiryType}.title`
                          ? item.inquiryType
                          : t(`contact.types.${item.inquiryType}.title`)
                        : "—"}
                    </td>
                    <td className="max-w-xs px-4 py-4 align-top text-muted">
                      <p>{item.subject || "—"}</p>
                      {item.productRef ? (
                        <p className="mt-1 text-xs">{item.productRef}</p>
                      ) : null}
                      {item.draftId ? (
                        <p className="mt-1 text-xs">{item.draftId}</p>
                      ) : null}
                      {item.message ? (
                        <p className="mt-2 whitespace-pre-wrap text-ivory/80">{item.message}</p>
                      ) : null}
                    </td>
                    <td className="px-4 py-4 align-top">
                      {item.createdAt ? dateFormatter.format(new Date(item.createdAt)) : "—"}
                    </td>
                    <td className="px-4 py-4 align-top">
                      {isAdmin ? (
                        <button
                          type="button"
                          onClick={() => setPendingDelete(item)}
                          className="text-[11px] uppercase tracking-[0.16em] text-gold hover:text-gold-light"
                        >
                          {t("admin.delete")}
                        </button>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}

        {meta && meta.totalPages > 1 ? (
          <div className="mt-6 flex items-center justify-between text-sm text-muted">
            <p>
              {t("admin.inquiries.page")
                .replace("{page}", String(meta.page))
                .replace("{total}", String(meta.totalPages))}
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((value) => Math.max(1, value - 1))}
                className="uppercase tracking-[0.16em] text-gold disabled:opacity-40"
              >
                {t("admin.inquiries.previous")}
              </button>
              <button
                type="button"
                disabled={page >= meta.totalPages}
                onClick={() => setPage((value) => value + 1)}
                className="uppercase tracking-[0.16em] text-gold disabled:opacity-40"
              >
                {t("admin.inquiries.next")}
              </button>
            </div>
          </div>
        ) : null}
      </div>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title={t("admin.deleteTitle")}
        body={t("admin.deleteBody")}
        confirmLabel={t("admin.deleteConfirm")}
        cancelLabel={t("admin.cancel")}
        busy={deleting}
        onCancel={() => {
          if (!deleting) setPendingDelete(null);
        }}
        onConfirm={() => void confirmDelete()}
      />
    </section>
  );
}
