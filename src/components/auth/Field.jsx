export const fieldClass =
  "mt-2 w-full border border-white/10 bg-ink px-4 py-3 text-sm text-ivory placeholder:text-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold";
export const errorFieldClass =
  "mt-2 w-full border border-gold bg-gold/10 px-4 py-3 text-sm text-ivory placeholder:text-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold";

export default function Field({
  id,
  label,
  error,
  type = "text",
  value,
  onChange,
  disabled,
  autoComplete,
  required,
  maxLength,
  placeholder,
  multiline = false,
  rows = 3,
}) {
  const shared = {
    id,
    value,
    onChange: (event) => onChange(event.target.value),
    disabled,
    maxLength,
    placeholder,
    "aria-invalid": Boolean(error),
    className: `${error ? errorFieldClass : fieldClass}${multiline ? " min-h-24 resize-y" : ""}`,
  };
  return (
    <div>
      <label htmlFor={id} className="text-[11px] uppercase tracking-[0.18em] text-gold">
        {label}
        {required ? <span className="ml-1 text-muted">*</span> : null}
      </label>
      {multiline ? (
        <textarea {...shared} rows={rows} />
      ) : (
        <input {...shared} type={type} autoComplete={autoComplete} />
      )}
      {error ? <p className="mt-2 text-xs text-gold">{error}</p> : null}
    </div>
  );
}
