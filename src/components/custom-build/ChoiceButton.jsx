export default function ChoiceButton({
  selected,
  onSelect,
  label,
  description,
  children,
  className = "",
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      aria-label={label}
      onClick={onSelect}
      className={`border text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold ${
        selected
          ? "border-gold bg-gold/15 text-gold"
          : "border-white/10 text-ivory/80 hover:border-gold/40"
      } ${className}`}
    >
      {children}
      {description ? (
        <span className="mt-1 block text-[11px] font-normal normal-case tracking-normal text-muted">
          {description}
        </span>
      ) : null}
    </button>
  );
}
