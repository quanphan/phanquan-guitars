import { optionDescription, optionLabel } from "../../data/wizardCatalog.js";
import { useLanguage } from "../../i18n/LanguageContext.jsx";
import ChoiceButton from "./ChoiceButton.jsx";

export default function OptionChips({
  label,
  options,
  selectedId,
  onSelect,
  nameKey,
  t,
}) {
  const { language } = useLanguage();
  if (!options.length) return null;

  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-3">
      {options.map((option) => {
        const name = optionLabel(option, language, t, `${nameKey}.${option.id}.name`);
        return (
          <ChoiceButton
            key={option.id}
            selected={selectedId === option.id}
            onSelect={() => onSelect(option.id)}
            label={name}
            description={optionDescription(option, language)}
            className="min-w-0 max-w-full px-4 py-3 text-[11px] uppercase tracking-[0.16em]"
          >
            {name}
          </ChoiceButton>
        );
      })}
    </div>
  );
}
