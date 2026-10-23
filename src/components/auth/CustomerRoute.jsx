import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext.jsx";
import { useLanguage } from "../../i18n/LanguageContext.jsx";
import PageHeader from "../PageHeader.jsx";

export default function CustomerRoute() {
  const { ready, isAuthenticated } = useAuth();
  const location = useLocation();
  const { t } = useLanguage();

  if (!ready) {
    return (
      <section className="pb-24">
        <PageHeader eyebrow={t("auth.eyebrow")} title={t("auth.loadingTitle")} />
      </section>
    );
  }

  if (!isAuthenticated) {
    const from = `${location.pathname}${location.search}`;
    return <Navigate to={`/login?from=${encodeURIComponent(from)}`} replace />;
  }

  return <Outlet />;
}
