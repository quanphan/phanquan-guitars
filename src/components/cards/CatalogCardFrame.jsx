import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { catalogCard } from "./catalogCardChrome.js";

export function CatalogCardShell({ children, className = "" }) {
  return <article className={`${catalogCard.article} ${className}`.trim()}>{children}</article>;
}

export function CatalogCardHoverAction({ label, href, className }) {
  if (!label) return null;
  const text = (
    <span className={catalogCard.action}>
      {label}
      <ArrowRight className="size-3.5" aria-hidden="true" />
    </span>
  );
  return (
    <div className={className || catalogCard.actionOverlay}>
      {href ? (
        <Link to={href} className="pointer-events-auto">
          {text}
        </Link>
      ) : (
        text
      )}
    </div>
  );
}

export default function CatalogCardFrame({
  href,
  actionLabel,
  children,
  actionSpacerClassName,
  actionOverlayClassName,
}) {
  return (
    <CatalogCardShell>
      <Link to={href} className={catalogCard.link}>
        {children}
        {actionLabel ? (
          <span className={actionSpacerClassName || catalogCard.actionSpacer} aria-hidden="true" />
        ) : null}
      </Link>
      <CatalogCardHoverAction label={actionLabel} className={actionOverlayClassName} />
    </CatalogCardShell>
  );
}
