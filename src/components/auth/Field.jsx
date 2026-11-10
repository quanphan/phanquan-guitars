export const fieldClass =
  "mt-2 w-full border border-white/10 bg-ink px-4 py-3 text-sm text-ivory placeholder:text-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold";
export const errorFieldClass =
  "mt-2 w-full border border-gold bg-gold/10 px-4 py-3 text-sm text-ivory placeholder:text-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold";

export function Select({
  id,
  label,
  ariaLabel,
  value,
  onChange,
  options = [],
  disabled,
  hint,
  allowEmpty = false,
  invalid = false,
}) {
  function handleChange(event) {
    if (disabled) return;
    if (typeof onChange !== "function") {
      throw new Error(`Select "${id}" requires an onChange(value) callback.`);
    }
    onChange(event.target.value || null);
  }

  const select = (
    <select
      id={id}
      aria-label={ariaLabel || label}
      value={value || ""}
      onChange={handleChange}
      disabled={disabled}
      className={`${invalid ? errorFieldClass : label ? fieldClass : fieldClass.replace("mt-2 ", "")}${disabled ? " cursor-not-allowed bg-ink/60 text-muted" : ""}`}
      aria-invalid={invalid || undefined}
    >
      {allowEmpty ? <option value="" /> : null}
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
  const hintNode = hint ? (
    <span className="mt-2 block text-xs font-normal normal-case tracking-normal text-muted">
      {hint}
    </span>
  ) : null;

  if (!label) {
    return (
      <div>
        {select}
        {hintNode}
      </div>
    );
  }

  return (
    <label htmlFor={id} className="block text-[11px] uppercase tracking-[0.18em] text-gold">
      {label}
      {select}
      {hintNode}
    </label>
  );
}

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
  function handleChange(event) {
    if (disabled) return;
    if (typeof onChange !== "function") {
      throw new Error(`Field "${id}" requires an onChange(value) callback.`);
    }
    onChange(event.target.value);
  }

  const shared = {
    id,
    value,
    onChange: handleChange,
    disabled,
    maxLength,
    placeholder,
    "aria-invalid": Boolean(error),
    className: `${error ? errorFieldClass : fieldClass}${disabled ? " cursor-not-allowed bg-ink/60 text-muted" : ""}${multiline ? " min-h-24 resize-y" : ""}`,
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
