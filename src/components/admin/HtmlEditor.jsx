import { useEffect, useRef } from "react";
import { errorFieldClass, fieldClass } from "../auth/Field.jsx";

export default function HtmlEditor({
  id,
  label,
  value,
  onChange,
  disabled,
  error,
  hint,
}) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (document.activeElement === el) return;
    const next = value || "";
    if (el.innerHTML !== next) el.innerHTML = next;
  }, [value]);

  function emit() {
    onChange(ref.current?.innerHTML || "");
  }

  function command(name) {
    if (disabled) return;
    ref.current?.focus();
    document.execCommand(name, false, null);
    emit();
  }

  return (
    <div>
      {label ? (
        <label htmlFor={id} className="block text-[11px] uppercase tracking-[0.18em] text-gold">
          {label}
        </label>
      ) : null}
      <div className="mt-2 flex flex-wrap gap-2">
        <ToolbarButton disabled={disabled} onClick={() => command("bold")}>
          B
        </ToolbarButton>
        <ToolbarButton disabled={disabled} onClick={() => command("italic")}>
          I
        </ToolbarButton>
        <ToolbarButton disabled={disabled} onClick={() => command("insertUnorderedList")}>
          List
        </ToolbarButton>
      </div>
      <div
        id={id}
        ref={ref}
        role="textbox"
        aria-multiline="true"
        contentEditable={!disabled}
        suppressContentEditableWarning
        onInput={emit}
        onBlur={emit}
        className={`${error ? errorFieldClass : fieldClass} mt-2 min-h-40 whitespace-pre-wrap`}
      />
      {hint ? <p className="mt-2 text-xs text-muted">{hint}</p> : null}
      {error ? (
        <p className="mt-2 text-xs text-gold" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function ToolbarButton({ children, onClick, disabled }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="border border-white/15 px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-ivory hover:border-gold/50 disabled:opacity-40"
    >
      {children}
    </button>
  );
}
