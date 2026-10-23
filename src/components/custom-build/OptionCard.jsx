export default function OptionCard({
  selected,
  onSelect,
  title,
  description,
  badge,
  visual,
  name,
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      aria-label={name ?? title}
      onClick={onSelect}
      className={`flex h-full flex-col overflow-hidden border text-left transition-colors duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold ${
        selected
          ? "border-gold bg-gold/10"
          : "border-white/10 bg-panel/70 hover:border-gold/40"
      }`}
    >
      <div className="relative overflow-hidden">{visual}</div>
      <div className="flex flex-1 flex-col gap-2 px-5 py-5">
        {badge ? (
          <p className="text-[10px] uppercase tracking-[0.2em] text-gold">
            {badge}
          </p>
        ) : null}
        <p className="font-display text-2xl text-ivory">{title}</p>
        <p className="text-sm leading-relaxed text-muted">{description}</p>
      </div>
    </button>
  );
}
