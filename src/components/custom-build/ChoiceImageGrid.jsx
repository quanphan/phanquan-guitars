import { mediaUrl } from "../../config/api.js";
import { choiceImageSrc } from "../../data/wizardCatalog.js";
import FitImage from "../FitImage.jsx";
import ChoiceButton from "./ChoiceButton.jsx";

export const CHOICE_IMAGE_GRID =
  "grid grid-cols-2 items-stretch gap-3 md:grid-cols-3";

export function ChoiceImageCard({
  selected,
  onSelect,
  label,
  description,
  image,
  emptyLabel,
}) {
  const src = image ? choiceImageSrc(image, mediaUrl) : "";

  return (
    <ChoiceButton
      selected={selected}
      onSelect={onSelect}
      label={label}
      selectedFill={false}
      quietBorder
      className="group flex h-full min-w-0 w-full flex-col overflow-visible p-0 text-[11px] uppercase tracking-[0.12em]"
    >
      {src ? (
        <FitImage
          src={src}
          alt=""
          fit="cover"
          frameClassName="aspect-[4/3] w-full rounded-sm transition-[filter] duration-75 group-hover:brightness-110"
          className="max-h-none max-w-none"
        />
      ) : (
        <div
          className="flex aspect-[4/3] w-full items-center justify-center rounded-sm bg-ink text-[10px] uppercase tracking-[0.18em] text-muted"
          aria-hidden="true"
        >
          {emptyLabel}
        </div>
      )}
      <span className="px-2 py-2 leading-snug break-words text-current sm:px-3">{label}</span>
      {description ? (
        <span className="whitespace-pre-wrap px-2 pb-3 text-[11px] font-normal normal-case tracking-normal text-muted sm:px-3">
          {description}
        </span>
      ) : null}
    </ChoiceButton>
  );
}
