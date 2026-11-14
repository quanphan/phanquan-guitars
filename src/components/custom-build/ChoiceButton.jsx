export const CHOICE_HOVER =
  "hover:border-gold hover:text-gold hover:shadow-[0_0_0_2px_rgba(198,161,91,0.9),0_6px_20px_rgba(198,161,91,0.35)]";

export default function ChoiceButton({
  selected,
  onSelect,
  label,
  description,
  children,
  className = "",
  selectedFill = true,
  quietBorder = false,
}) {
  const idleBorder = quietBorder
    ? `border-transparent text-ivory/80 ${CHOICE_HOVER}`
    : `border-white/10 text-ivory/80 ${CHOICE_HOVER}`;
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      aria-label={label}
      onClick={onSelect}
      className={`box-border max-w-full overflow-visible border text-left break-words transition-[border-color,box-shadow,color] duration-75 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold ${
        selected
          ? `border-gold text-gold${selectedFill ? " bg-gold/15" : ""}`
          : idleBorder
      } ${className}`}
    >
      {children}
      {description ? (
        <span className="mt-1 block whitespace-pre-wrap text-[11px] font-normal normal-case tracking-normal text-muted">
          {description}
        </span>
      ) : null}
    </button>
  );
}
