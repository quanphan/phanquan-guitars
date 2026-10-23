import { NavLink, Outlet } from "react-router-dom";
import { CATALOG_KINDS } from "../../auth/catalog.js";
import { useLanguage } from "../../i18n/LanguageContext.jsx";

const tabs = [
  ...CATALOG_KINDS.map((kind) => ({ to: `/admin/catalog/${kind}`, key: `admin.catalog.groups.${kind}` })),
  { to: "/admin/catalog/products", key: "admin.catalog.groups.products" },
];

export default function AdminCatalog() {
  const { t } = useLanguage();

  return (
    <section className="pb-24">
      <nav className="mx-auto mt-8 max-w-7xl overflow-x-auto px-6 lg:px-10" aria-label={t("admin.catalog.groupsLabel")}>
        <div className="flex gap-5 border-b border-white/10 pb-3">
          {tabs.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              className={({ isActive }) =>
                `shrink-0 text-[11px] uppercase tracking-[0.2em] ${
                  isActive ? "text-gold" : "text-ivory/70 hover:text-ivory"
                }`
              }
            >
              {t(tab.key)}
            </NavLink>
          ))}
        </div>
      </nav>
      <Outlet />
    </section>
  );
}
