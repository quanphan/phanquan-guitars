import { NavLink } from "react-router-dom";
import { useLanguage } from "../../i18n/LanguageContext.jsx";

const tabs = [
  { to: "/admin/users", key: "admin.tabs.users" },
  { to: "/admin/catalog", key: "admin.tabs.catalog" },
  { to: "/admin/custom-build-setup", key: "admin.tabs.wizardSetup" },
  { to: "/admin/inquiries", key: "admin.tabs.inquiries" },
  { to: "/admin/messages", key: "admin.tabs.messages" },
  { to: "/admin/settings/brand", key: "admin.tabs.brandSettings" },
  { to: "/admin/page-content", key: "admin.tabs.pageContent" },
];

export default function AdminTabs() {
  const { t } = useLanguage();

  return (
    <nav
      className="border-b border-white/5 bg-ink/60"
      aria-label={t("admin.tabs.label")}
    >
      <div className="mx-auto flex max-w-7xl gap-6 overflow-x-auto px-6 py-3 lg:px-10">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) =>
              `shrink-0 text-[11px] uppercase tracking-[0.22em] transition-colors ${
                isActive ? "text-gold" : "text-ivory/70 hover:text-ivory"
              }`
            }
          >
            {t(tab.key)}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
