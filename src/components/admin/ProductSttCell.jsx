import { useEffect, useState } from "react";
import { parseProductStt } from "../../auth/catalog.js";

export default function ProductSttCell({ value, disabled, saving, status, message, onSave }) {
  const current = Number.isInteger(value) ? String(value) : "";
  const [draft, setDraft] = useState(current);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (!editing) setDraft(Number.isInteger(value) ? String(value) : "");
  }, [editing, value]);

  function commit() {
    const parsed = parseProductStt(draft);
    if (!parsed.ok) {
      setDraft(current);
      setEditing(false);
      onSave({ ok: false, invalid: true, value: current });
      return;
    }
    setEditing(false);
    if (parsed.value === value) return;
    onSave({ ok: true, invalid: false, value: parsed.value });
  }

  if (!editing) {
    return (
      <div className="space-y-1">
        <button
          type="button"
          disabled={disabled || saving}
          onClick={() => setEditing(true)}
          className="min-w-12 text-left text-sm text-ivory underline decoration-white/20 underline-offset-4 disabled:opacity-40"
        >
          {Number.isInteger(value) ? value : "—"}
        </button>
        {saving ? <p className="text-[10px] uppercase tracking-[0.14em] text-muted">{status}</p> : null}
        {!saving && message ? <p className="text-[10px] uppercase tracking-[0.14em] text-gold">{message}</p> : null}
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <input
        type="number"
        min="0"
        step="1"
        value={draft}
        autoFocus
        disabled={saving}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            event.currentTarget.blur();
          }
          if (event.key === "Escape") {
            setDraft(current);
            setEditing(false);
          }
        }}
        className="w-20 border border-white/10 bg-ink px-2 py-1 text-sm text-ivory focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
      />
    </div>
  );
}
