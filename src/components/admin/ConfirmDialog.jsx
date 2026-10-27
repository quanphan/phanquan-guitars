import { useEffect, useRef } from "react";

export default function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel,
  cancelLabel,
  busy = false,
  busyLabel,
  extraActionLabel,
  onExtraAction,
  hideConfirm = false,
  onConfirm,
  onCancel,
}) {
  const confirmRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    confirmRef.current?.focus();
    const onKey = (event) => {
      if (event.key === "Escape" && !busy) onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [busy, open, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-charcoal/80 px-6"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !busy) onCancel();
      }}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="admin-confirm-title"
        aria-describedby="admin-confirm-body"
        className="w-full max-w-md border border-gold/40 bg-ink p-6 shadow-xl"
      >
        <h2 id="admin-confirm-title" className="font-display text-2xl text-ivory">
          {title}
        </h2>
        <p id="admin-confirm-body" className="mt-3 text-sm leading-relaxed text-muted">
          {body}
        </p>
        <div className="mt-8 flex flex-wrap justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="px-5 py-3 text-[11px] uppercase tracking-[0.22em] text-ivory/80 transition-colors hover:text-ivory focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold disabled:opacity-40"
          >
            {cancelLabel}
          </button>
          {hideConfirm ? null : (
          <button
            ref={confirmRef}
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="border border-gold bg-gold px-5 py-3 text-[11px] uppercase tracking-[0.22em] text-charcoal transition-colors hover:bg-gold-light focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold disabled:opacity-40"
          >
            {busy ? busyLabel || confirmLabel : confirmLabel}
          </button>
          )}
          {extraActionLabel && onExtraAction ? (
            <button
              type="button"
              onClick={onExtraAction}
              disabled={busy}
              className="border border-gold/70 px-5 py-3 text-[11px] uppercase tracking-[0.22em] text-gold transition-colors hover:bg-gold/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold disabled:opacity-40"
            >
              {extraActionLabel}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
