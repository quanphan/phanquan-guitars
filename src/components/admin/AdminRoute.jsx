import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext.jsx";
import { useLanguage } from "../../i18n/LanguageContext.jsx";
import PageHeader from "../PageHeader.jsx";
import Button from "../Button.jsx";
import AdminTabs from "./AdminTabs.jsx";

export default function AdminRoute() {
  const { ready, session, isAdmin, logout } = useAuth();
  const location = useLocation();
  const { t } = useLanguage();

  if (!ready) {
    return (
      <section className="pb-24">
        <PageHeader
          eyebrow={t("admin.eyebrow")}
          title={t("admin.loadingTitle")}
          description={t("admin.loadingBody")}
        />
      </section>
    );
  }

  if (!session?.accessToken) {
    const from = `${location.pathname}${location.search}`;
    return (
      <Navigate
        to={`/admin/login?from=${encodeURIComponent(from)}`}
        replace
      />
    );
  }

  if (!isAdmin) {
    return (
      <section className="pb-24">
        <PageHeader
          eyebrow={t("admin.eyebrow")}
          title={t("admin.forbiddenTitle")}
          description={t("admin.forbiddenBody")}
        >
          <div className="mt-8 flex flex-wrap gap-4">
            <Button to="/" variant="outline">
              {t("pages.backHome")}
            </Button>
            <Button type="button" onClick={() => void logout()}>
              {t("nav.logout")}
            </Button>
          </div>
        </PageHeader>
      </section>
    );
  }

  return (
    <>
      <AdminTabs />
      <Outlet />
    </>
  );
}
