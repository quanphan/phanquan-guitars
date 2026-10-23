import ChoiceButton from "./ChoiceButton.jsx";

export default function OptionChips({
  label,
  options,
  selectedId,
  onSelect,
  nameKey,
  emptyMessage,
  t,
}) {
  if (options.length === 0) {
    return <p className="text-sm leading-relaxed text-muted">{emptyMessage}</p>;
  }

  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-3">
      {options.map((option) => {
        const name = t(`${nameKey}.${option.id}.name`);
        const detail = t(`${nameKey}.${option.id}.detail`);
        const hasDetail = detail && !detail.endsWith(".detail");
        return (
          <ChoiceButton
            key={option.id}
            selected={selectedId === option.id}
            onSelect={() => onSelect(option.id)}
            label={name}
            className="min-w-[5.5rem] px-4 py-3 text-[11px] uppercase tracking-[0.16em]"
          >
            {name}
            {hasDetail ? (
              <span className="mt-1 block text-[10px] font-normal normal-case tracking-normal text-muted">
                {detail}
              </span>
            ) : null}
          </ChoiceButton>
        );
      })}
    </div>
  );
}
