import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext.jsx";
import { canChangeTarget, ADMIN_ASSIGNABLE } from "../../auth/permissions.js";
import { errorText } from "../../auth/errorText.js";
import ConfirmDialog from "../../components/admin/ConfirmDialog.jsx";
import Button from "../../components/Button.jsx";
import PageHeader from "../../components/PageHeader.jsx";
import { useLanguage } from "../../i18n/LanguageContext.jsx";
import {
  getAdminUser,
  updateAdminUserRole,
  updateAdminUserStatus,
} from "../../services/adminUserService.js";

export default function AdminUserDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const { authorizedRequest, hasPermission, session } = useAuth();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [role, setRole] = useState("customer");
  const [permissions, setPermissions] = useState([]);
  const [saving, setSaving] = useState(false);
  const [pendingStatus, setPendingStatus] = useState(null);
  const [statusBusy, setStatusBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await getAdminUser(authorizedRequest, id);
    if (!result.ok) {
      setUser(null);
      setError(result.code);
      setLoading(false);
      if (result.code === "UNAUTHORIZED") {
        navigate(`/admin/login?from=${encodeURIComponent(`/admin/users/${id}`)}`, { replace: true });
      }
      return;
    }
    setUser(result.user);
    setRole(result.user.role === "admin" ? "admin" : result.user.role === "superadmin" ? "superadmin" : "customer");
    setPermissions(result.user.permissions.filter((item) => ADMIN_ASSIGNABLE.includes(item)));
    setLoading(false);
  }, [authorizedRequest, id, navigate]);

  useEffect(() => {
    void load();
  }, [load]);

  const actor = session?.user;
  const manageable = canChangeTarget(actor, user);
  const canRole = manageable && hasPermission("users.update_role");
  const canStatus = manageable && hasPermission("users.update_status");
  const dateFormatter = new Intl.DateTimeFormat(language === "vi" ? "vi-VN" : "en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  async function saveRole(event) {
    event.preventDefault();
    if (!user || !canRole || saving || role === "superadmin") return;
    setSaving(true);
    setError(null);
    const body = { role };
    if (role === "admin") body.permissions = permissions;
    const result = await updateAdminUserRole(authorizedRequest, user.id, body);
    setSaving(false);
    if (!result.ok) {
      setError(result.code);
      return;
    }
    setUser(result.user);
    setRole(result.user.role);
    setPermissions(result.user.permissions.filter((item) => ADMIN_ASSIGNABLE.includes(item)));
  }

  async function confirmStatus() {
    if (!user || !canStatus || !pendingStatus || statusBusy) return;
    setStatusBusy(true);
    setError(null);
    const result = await updateAdminUserStatus(authorizedRequest, user.id, pendingStatus);
    setStatusBusy(false);
    setPendingStatus(null);
    if (!result.ok) {
      setError(result.code);
      return;
    }
    setUser(result.user);
  }

  return (
    <section className="pb-24">
      <PageHeader
        eyebrow={t("admin.eyebrow")}
        title={t("admin.users.detailTitle")}
        description={t("admin.users.detailDescription")}
      >
        <Link
          to="/admin/users"
          className="mt-8 inline-flex text-[11px] uppercase tracking-[0.22em] text-gold hover:text-gold-light"
        >
          {t("admin.users.back")}
        </Link>
      </PageHeader>

      <div className="mx-auto mt-10 max-w-3xl px-6 lg:px-10">
        {error ? (
          <div className="mb-8 border border-gold/40 bg-gold/10 px-4 py-4 text-sm" role="alert">
            <p>{errorText(t, "admin", error)}</p>
            <button type="button" onClick={() => void load()} className="mt-3 text-[11px] uppercase tracking-[0.18em] text-gold">
              {t("admin.retry")}
            </button>
          </div>
        ) : null}

        {loading ? (
          <p className="text-sm text-muted" role="status">
            {t("admin.loadingBody")}
          </p>
        ) : null}

        {!loading && user ? (
          <div className="space-y-8">
            <section className="border border-white/10 bg-panel/40 p-6">
              <dl className="grid gap-4 sm:grid-cols-2">
                <Info label={t("admin.users.columns.name")} value={user.name} />
                <Info label={t("admin.users.columns.email")} value={user.email} />
                <Info label={t("admin.users.columns.username")} value={user.username} />
                <Info label={t("auth.fields.phone")} value={user.phone} />
                <Info label={t("admin.users.columns.role")} value={t(`admin.users.roles.${user.role}`) || user.role} />
                <Info
                  label={t("admin.users.columns.status")}
                  value={t(`admin.users.statuses.${user.status}`) || user.status}
                />
                <Info
                  label={t("admin.users.columns.created")}
                  value={user.createdAt ? dateFormatter.format(new Date(user.createdAt)) : null}
                />
                <Info
                  label={t("auth.fields.marketingConsent")}
                  value={user.marketingConsent ? t("admin.users.consentOn") : t("admin.users.consentOff")}
                />
              </dl>
              <div className="mt-6">
                <p className="text-[11px] uppercase tracking-[0.18em] text-gold">{t("admin.users.columns.permissions")}</p>
                <p className="mt-2 text-sm text-ivory/90">
                  {user.permissions?.length ? user.permissions.join(", ") : "—"}
                </p>
              </div>
              {user.role === "superadmin" ? (
                <p className="mt-6 text-sm text-muted">{t("admin.users.superadminProtected")}</p>
              ) : null}
            </section>

            {canRole ? (
              <form className="space-y-5 border border-white/10 bg-panel/40 p-6" onSubmit={saveRole}>
                <h2 className="text-[11px] uppercase tracking-[0.22em] text-gold">{t("admin.users.changeRole")}</h2>
                <label className="block text-[11px] uppercase tracking-[0.18em] text-gold">
                  {t("admin.users.role")}
                  <select
                    value={role}
                    onChange={(event) => setRole(event.target.value)}
                    disabled={saving}
                    className="mt-2 w-full border border-white/10 bg-ink px-3 py-2.5 text-sm text-ivory"
                  >
                    <option value="customer">{t("admin.users.roles.customer")}</option>
                    <option value="admin">{t("admin.users.roles.admin")}</option>
                  </select>
                </label>
                {role === "admin" ? (
                  <fieldset>
                    <legend className="text-[11px] uppercase tracking-[0.18em] text-gold">
                      {t("admin.users.assignablePermissions")}
                    </legend>
                    <div className="mt-3 space-y-2">
                      {ADMIN_ASSIGNABLE.map((permission) => (
                        <label key={permission} className="flex items-start gap-3 text-sm">
                          <input
                            type="checkbox"
                            className="mt-1 size-4 accent-gold"
                            checked={permissions.includes(permission)}
                            disabled={saving}
                            onChange={() =>
                              setPermissions((current) =>
                                current.includes(permission)
                                  ? current.filter((item) => item !== permission)
                                  : [...current, permission],
                              )
                            }
                          />
                          <span>
                            {t(`admin.permissions.${permission}`)}
                            <span className="mt-0.5 block text-xs text-muted">{permission}</span>
                          </span>
                        </label>
                      ))}
                    </div>
                  </fieldset>
                ) : null}
                <Button type="submit" disabled={saving}>
                  {saving ? t("admin.users.saving") : t("admin.users.saveRole")}
                </Button>
              </form>
            ) : null}

            {canStatus ? (
              <div className="border border-white/10 bg-panel/40 p-6">
                <h2 className="text-[11px] uppercase tracking-[0.22em] text-gold">{t("admin.users.changeStatus")}</h2>
                <p className="mt-3 text-sm text-muted">{t("admin.users.changeStatusBody")}</p>
                <Button
                  type="button"
                  variant="outline"
                  className="mt-5"
                  onClick={() => setPendingStatus(user.status === "locked" ? "active" : "locked")}
                >
                  {user.status === "locked" ? t("admin.users.unlock") : t("admin.users.lock")}
                </Button>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      <ConfirmDialog
        open={Boolean(pendingStatus)}
        title={pendingStatus === "locked" ? t("admin.users.lockTitle") : t("admin.users.unlockTitle")}
        body={pendingStatus === "locked" ? t("admin.users.lockBody") : t("admin.users.unlockBody")}
        confirmLabel={pendingStatus === "locked" ? t("admin.users.lock") : t("admin.users.unlock")}
        cancelLabel={t("admin.cancel")}
        busy={statusBusy}
        onCancel={() => {
          if (!statusBusy) setPendingStatus(null);
        }}
        onConfirm={() => void confirmStatus()}
      />
    </section>
  );
}

function Info({ label, value }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-[0.16em] text-muted">{label}</dt>
      <dd className="mt-1 text-sm text-ivory">{value || "—"}</dd>
    </div>
  );
}
