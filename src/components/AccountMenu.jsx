import { UserRound } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { accountMenuLinks } from "../auth/accountMenu.js";
import { useAuth } from "../auth/AuthContext.jsx";
import { useLanguage } from "../i18n/LanguageContext.jsx";

const itemClass =
  "block w-full px-4 py-2.5 text-left text-[11px] uppercase tracking-[0.18em] text-ivory/80 transition-colors hover:bg-gold/10 hover:text-gold focus-visible:bg-gold/10 focus-visible:text-gold focus-visible:outline-none";

export default function AccountMenu() {
  const { t } = useLanguage();
  const { isAdmin, isAuthenticated, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const menuId = useId();
  const links = accountMenuLinks({ isAuthenticated, isAdmin });

  useEffect(() => {
    if (!open) return undefined;
    function onPointerDown(event) {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    }
    function onKeyDown(event) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        className="inline-flex h-11 w-11 items-center justify-center text-ivory/75 transition-colors duration-300 hover:text-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
        aria-label={t("nav.accountMenu")}
        title={t("nav.accountMenu")}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((current) => !current)}
      >
        <UserRound aria-hidden="true" size={22} strokeWidth={1.6} />
      </button>
      {open ? (
        <div
          id={menuId}
          role="menu"
          aria-label={t("nav.accountMenu")}
          className="absolute right-0 z-50 mt-2 min-w-[13.5rem] border border-gold/25 bg-ink py-2 shadow-[0_12px_40px_rgba(0,0,0,0.45)]"
        >
          {links.map((link) => (
            <Link
              key={link.to}
              role="menuitem"
              to={link.to}
              className={itemClass}
              onClick={() => setOpen(false)}
            >
              {t(link.key)}
            </Link>
          ))}
          {isAuthenticated ? (
            <button
              type="button"
              role="menuitem"
              className={itemClass}
              onClick={() => {
                setOpen(false);
                void logout();
              }}
            >
              {t("nav.logout")}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
