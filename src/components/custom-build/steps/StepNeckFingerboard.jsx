import { mediaUrl } from "../../../config/api.js";
import FitImage from "../../FitImage.jsx";
import { Select, fieldClass } from "../../auth/Field.jsx";
import { choiceImageSrc, optionDescription, optionLabel } from "../../../data/wizardCatalog.js";
import { DEFAULT_FRET_COUNT, parsePositiveFretCount } from "../../../data/wizardScaleAttributes.js";
import { optionIdEquals } from "../../../data/wizardSelection.js";
import { usesSecondaryNeckWood } from "../../../data/wizardSeriesConstruction.js";
import { useLanguage } from "../../../i18n/LanguageContext.jsx";
import ChoiceButton from "../ChoiceButton.jsx";

function constructionLabel(option, language) {
  return option?.translations?.[language]?.name || option?.translations?.en?.name || option?.name || option?.id || "";
}

function WoodCard({ option, selected, onSelect, nameKey, t, language, imageFit = "contain" }) {
  const name = optionLabel(option, language, t, `${nameKey}.${option.id}.name`);
  const description = optionDescription(option, language);
  const hasDescription = Boolean(description);

  return (
    <ChoiceButton
      selected={selected}
      onSelect={onSelect}
      label={name}
      className="flex h-full flex-col overflow-hidden p-0"
    >
      {option.image ? (
        <FitImage
          src={choiceImageSrc(option.image, mediaUrl)}
          alt=""
          fit={imageFit}
          frameClassName="aspect-[4/3] w-full"
          className={imageFit === "cover" ? "max-h-none max-w-none" : ""}
        />
      ) : (
        <div
          className="flex aspect-[4/3] w-full items-center justify-center bg-ink text-[10px] uppercase tracking-[0.18em] text-muted"
          aria-hidden="true"
        >
          {t("customBuild.step2.noImage")}
        </div>
      )}
      <span className="px-4 py-3 text-[11px] uppercase tracking-[0.16em] text-current">
        {name}
      </span>
      {hasDescription ? (
        <span className="whitespace-pre-wrap px-4 pb-4 text-[11px] font-normal normal-case tracking-normal text-muted">
          {description}
        </span>
      ) : null}
    </ChoiceButton>
  );
}

function ChipGroup({ id, label, options, selectedId, onSelect, nameKey, t, language, invalid }) {
  if (!options.length) return null;

  return (
    <div id={id} role="radiogroup" aria-label={label} aria-invalid={invalid || undefined} className={`flex flex-wrap gap-3${invalid ? " rounded-sm ring-1 ring-gold/70 p-1" : ""}`}>
      {options.map((option) => {
        const name = optionLabel(option, language, t, `${nameKey}.${option.id}.name`);
        const selected = optionIdEquals(option, selectedId);
        return (
          <ChoiceButton
            key={option.optionId || option.id}
            selected={selected}
            onSelect={() => onSelect(option.id)}
            label={name}
            description={optionDescription(option, language)}
            className="min-w-[5.5rem] px-4 py-3 text-[11px] uppercase tracking-[0.16em]"
          >
            {name}
          </ChoiceButton>
        );
      })}
    </div>
  );
}

export default function StepNeckFingerboard({
  selections,
  availableNeckWoods,
  availableNeckPieces = [],
  availableNeckConstructions,
  availableFingerboardWoods,
  availableNeckProfiles,
  availableFretSpecs,
  selectNeckPieces,
  selectNeckWood,
  selectSecondaryNeckWood,
  selectNeckConstruction,
  selectFingerboardWood,
  selectNeckProfile,
  selectFretSpec,
  selectFretCount,
  missingFields = [],
}) {
  const { t, language } = useLanguage();
  const missingKeys = new Set((missingFields || []).map((item) => item.key));
  const selectedPieces = availableNeckPieces.find((item) => item.id === selections.neckPiecesId);
  const selectedNeckWood = availableNeckWoods.find((item) => optionIdEquals(item, selections.neckWoodId));
  const selectedSecondaryNeckWood = availableNeckWoods.find((item) => optionIdEquals(item, selections.secondaryNeckWoodId));
  const showSecondary = usesSecondaryNeckWood(selectedPieces);
  const woodChoices = availableNeckWoods.map((wood) => ({
    value: wood.id,
    label: optionLabel(wood, language, t, `customBuild.neckWoods.${wood.id}.name`),
  }));
  const pieceChoices = availableNeckPieces.map((option) => ({
    value: option.id,
    label: constructionLabel(option, language),
  }));
  const showPieces = pieceChoices.length > 0;
  const showWoods = availableNeckWoods.length > 0;
  const showNeckWoodSection = showPieces || showWoods;

  return (
    <div>
      <h2 className="font-display text-3xl tracking-wide text-ivory sm:text-4xl">
        {t("customBuild.step3.heading")}
      </h2>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
        {t("customBuild.step3.description")}
      </p>
      <p className="mt-4 max-w-2xl text-xs leading-relaxed text-muted">
        {t("customBuild.provisional")}
      </p>
      {missingFields.length ? (
        <p id="step3-incomplete" className="mt-6 border border-gold/40 bg-gold/10 px-4 py-3 text-sm text-ivory" role="alert">
          {t("customBuild.step3.incomplete")}
          <span className="mt-2 block text-xs uppercase tracking-[0.14em] text-gold">
            {missingFields.map((item) => t(item.labelKey)).join(" · ")}
          </span>
        </p>
      ) : null}

      {showNeckWoodSection ? (
      <section className="mt-10">
        <h3 className="text-[11px] uppercase tracking-[0.22em] text-gold">
          {t("customBuild.step3.neckWoodLabel")}
        </h3>
        <div className="mt-4 grid gap-4">
          {showPieces ? (
            <Select
              id="neck-pieces"
              ariaLabel={t("customBuild.step3.neckPiecesLabel")}
              value={selections.neckPiecesId}
              onChange={selectNeckPieces}
              options={pieceChoices}
              hint={optionDescription(selectedPieces, language)}
              invalid={missingKeys.has("neckPiecesId")}
            />
          ) : null}
          {showWoods ? (
            <Select
              id="main-neck-wood"
              label={t("customBuild.step3.mainWoodLabel")}
              value={selections.neckWoodId}
              onChange={selectNeckWood}
              options={woodChoices}
              hint={optionDescription(selectedNeckWood, language)}
              invalid={missingKeys.has("neckWoodId")}
            />
          ) : null}
          {showSecondary && showWoods ? (
            <Select
              id="secondary-neck-wood"
              label={t("customBuild.step3.secondaryWoodLabel")}
              value={selections.secondaryNeckWoodId}
              onChange={selectSecondaryNeckWood}
              options={woodChoices}
              hint={optionDescription(selectedSecondaryNeckWood, language)}
              invalid={missingKeys.has("secondaryNeckWoodId")}
            />
          ) : null}
        </div>
      </section>
      ) : null}

      {availableNeckConstructions.length > 0 ? (
      <section className="mt-10">
        <h3 className="text-[11px] uppercase tracking-[0.22em] text-gold">
          {t("customBuild.step3.constructionLabel")}
        </h3>
        <div className="mt-4">
          <ChipGroup
            id="neck-construction"
            label={t("customBuild.step3.constructionLabel")}
            options={availableNeckConstructions}
            selectedId={selections.neckConstructionId}
            onSelect={selectNeckConstruction}
            nameKey="customBuild.constructions"
            t={t}
            language={language}
            invalid={missingKeys.has("neckConstructionId")}
          />
        </div>
      </section>
      ) : null}

      {availableFingerboardWoods.length > 0 ? (
      <section className="mt-10">
        <h3 className="text-[11px] uppercase tracking-[0.22em] text-gold">
          {t("customBuild.step3.fingerboardLabel")}
        </h3>
        <div className="mt-4">
              <div
                id="fingerboard-wood"
                role="radiogroup"
                aria-label={t("customBuild.step3.fingerboardLabel")}
                aria-invalid={missingKeys.has("fingerboardWoodId") || undefined}
                className={`grid gap-3 sm:grid-cols-2 xl:grid-cols-3${missingKeys.has("fingerboardWoodId") ? " rounded-sm ring-1 ring-gold/70 p-1" : ""}`}
              >
                {availableFingerboardWoods.map((wood) => (
                  <WoodCard
                    key={wood.optionId || wood.id}
                    option={wood}
                    selected={optionIdEquals(wood, selections.fingerboardWoodId)}
                    onSelect={() => selectFingerboardWood(wood.id)}
                    nameKey="customBuild.fingerboards"
                    t={t}
                    language={language}
                    imageFit="cover"
                  />
                ))}
              </div>
        </div>
      </section>
      ) : null}

      {availableNeckProfiles.length > 0 ? (
      <section className="mt-10">
        <h3 className="text-[11px] uppercase tracking-[0.22em] text-gold">
          {t("customBuild.step3.profileLabel")}
        </h3>
        <div className="mt-4">
          <ChipGroup
            id="neck-profile"
            label={t("customBuild.step3.profileLabel")}
            options={availableNeckProfiles}
            selectedId={selections.neckProfileId}
            onSelect={selectNeckProfile}
            nameKey="customBuild.profiles"
            t={t}
            language={language}
            invalid={missingKeys.has("neckProfileId")}
          />
        </div>
      </section>
      ) : null}

      {availableFretSpecs.length > 0 ? (
      <section className="mt-10">
        <h3 className="text-[11px] uppercase tracking-[0.22em] text-gold">
          {t("customBuild.step3.fretLabel")}
        </h3>
        <div className="mt-4">
          <ChipGroup
            id="fret-spec"
            label={t("customBuild.step3.fretLabel")}
            options={availableFretSpecs}
            selectedId={selections.fretSpecId}
            onSelect={selectFretSpec}
            nameKey="customBuild.frets"
            t={t}
            language={language}
            invalid={missingKeys.has("fretSpecId")}
          />
        </div>
      </section>
      ) : null}

      <section className="mt-10">
        <h3 className="text-[11px] uppercase tracking-[0.22em] text-gold">
          {t("customBuild.step3.fretCountLabel")}
        </h3>
        <div className="mt-4">
          <label className="block">
            <input
              id="fret-count"
              type="number"
              min="1"
              step="1"
              value={selections.fretCount ?? DEFAULT_FRET_COUNT}
              onChange={(event) => selectFretCount?.(event.target.value === "" ? "" : event.target.value)}
              className={missingKeys.has("fretCount") ? fieldClass.replace("border-white/10", "border-gold") : fieldClass}
              aria-label={t("customBuild.step3.fretCountLabel")}
              aria-invalid={parsePositiveFretCount(selections.fretCount) == null}
            />
            <span className="mt-2 block text-[10px] font-normal normal-case tracking-normal text-muted">
              {t("customBuild.step3.fretCountInputHelp")}
            </span>
            {parsePositiveFretCount(selections.fretCount) == null ? (
              <span className="mt-2 block text-xs text-gold" role="alert">
                {t("customBuild.step3.fretCountError")}
              </span>
            ) : null}
          </label>
        </div>
      </section>
    </div>
  );
}
