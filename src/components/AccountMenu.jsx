import { UserRound } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { accountDisplayName, accountMenuLinks } from "../auth/accountMenu.js";
import { useAuth } from "../auth/AuthContext.jsx";
import { useLanguage } from "../i18n/LanguageContext.jsx";

const itemClass =
  "block w-full px-4 py-2.5 text-left text-[11px] uppercase tracking-[0.18em] text-ivory/80 transition-colors hover:bg-gold/10 hover:text-gold focus-visible:bg-gold/10 focus-visible:text-gold focus-visible:outline-none";

export default function AccountMenu({
  className = "",
  buttonClassName = "",
  iconSize = 22,
  onOpen,
  closeToken,
}) {
  const { t } = useLanguage();
  const { ready, isAdmin, isAuthenticated, logout, session } = useAuth();
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const menuRef = useRef(null);
  const menuId = useId();
  const signedIn = ready && isAuthenticated;
  const displayName = signedIn ? accountDisplayName(session?.user) : "";
  const links = accountMenuLinks({ isAuthenticated, isAdmin });

  function setMenuOpen(next) {
    setOpen(next);
    if (next) onOpen?.();
  }

  useEffect(() => {
    setOpen(false);
  }, [closeToken]);

  useEffect(() => {
    if (!open) return undefined;
    function onPointerDown(event) {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    }
    function onKeyDown(event) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const menu = menuRef.current;
    if (!menu) return undefined;
    const pad = 12;
    const rect = menu.getBoundingClientRect();
    let shift = 0;
    if (rect.right > window.innerWidth - pad) {
      shift -= rect.right - (window.innerWidth - pad);
    }
    if (rect.left + shift < pad) {
      shift += pad - (rect.left + shift);
    }
    menu.style.transform = shift ? `translateX(${shift}px)` : "";
    return undefined;
  }, [open]);

  return (
    <div className={`relative ${className}`} ref={rootRef}>
      <button
        type="button"
        className={`inline-flex h-11 w-11 items-center justify-center text-ivory/75 transition-colors duration-300 hover:text-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold ${buttonClassName}`}
        aria-label={signedIn ? t("nav.accountMenuSignedIn") : t("nav.accountMenu")}
        title={t("nav.accountMenu")}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setMenuOpen(!open)}
      >
        <span className="relative inline-flex">
          <UserRound aria-hidden="true" size={iconSize} strokeWidth={1.6} />
          {signedIn ? (
            <span
              className="absolute -right-0.5 -top-0.5 size-1.5 rounded-full bg-gold shadow-[0_0_0_2px] shadow-charcoal"
              aria-hidden="true"
            />
          ) : null}
        </span>
      </button>
      {open ? (
        <div
          ref={menuRef}
          id={menuId}
          role="menu"
          aria-label={t("nav.accountMenu")}
          className="absolute right-0 z-[60] mt-2 max-h-[min(70dvh,24rem)] min-w-[13.5rem] max-w-[min(18rem,calc(100vw-1.5rem))] overflow-y-auto border border-gold/25 bg-ink py-2 shadow-[0_12px_40px_rgba(0,0,0,0.45)]"
        >
          {displayName ? (
            <p className="truncate px-4 py-2 text-sm text-ivory/90">{displayName}</p>
          ) : null}
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
