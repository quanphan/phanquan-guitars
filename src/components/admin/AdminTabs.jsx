import { NavLink } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext.jsx";
import { useLanguage } from "../../i18n/LanguageContext.jsx";

const tabs = [
  { to: "/admin/users", key: "admin.tabs.users", permission: "users.read" },
  { to: "/admin/catalog", key: "admin.tabs.catalog", permission: "catalog.read" },
  { to: "/admin/custom-build-setup", key: "admin.tabs.wizardSetup", permission: "customBuild.read" },
  { to: "/admin/inquiries", key: "admin.tabs.inquiries", permission: "inquiries.read" },
  { to: "/admin/messages", key: "admin.tabs.messages", permission: "messages.read" },
  { to: "/admin/settings/brand", key: "admin.tabs.brandSettings", permission: "brand.read" },
  { to: "/admin/settings/footer-links", key: "admin.tabs.footerLinks", permission: "footerLinks.read" },
  { to: "/admin/page-content", key: "admin.tabs.pageContent", permission: "pages.read" },
  { to: "/admin/services", key: "admin.tabs.services", permission: "services.read" },
];

export default function AdminTabs() {
  const { t } = useLanguage();
  const { hasPermission } = useAuth();
  const visible = tabs.filter((tab) => hasPermission(tab.permission));

  if (!visible.length) return null;

  return (
    <nav
      className="border-b border-white/5 bg-ink/60"
      aria-label={t("admin.tabs.label")}
    >
      <div className="mx-auto flex max-w-7xl gap-6 overflow-x-auto px-6 py-3 lg:px-10">
        {visible.map((tab) => (
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
