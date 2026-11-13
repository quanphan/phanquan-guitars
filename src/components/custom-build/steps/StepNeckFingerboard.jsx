import { mediaUrl } from "../../../config/api.js";
import FitImage from "../../FitImage.jsx";
import { Select, fieldClass } from "../../auth/Field.jsx";
import { choiceImageSrc, optionDescription, optionLabel, wizardChoiceKey } from "../../../data/wizardCatalog.js";
import {
  isCustomScale,
  isMultiscale,
  isValidCustomScaleValue,
  isValidFretCountSelection,
  scaleDisplayValue,
} from "../../../data/wizardScaleAttributes.js";
import { optionIdEquals } from "../../../data/wizardSelection.js";
import { usesSecondaryNeckWood } from "../../../data/wizardSeriesConstruction.js";
import { useLanguage } from "../../../i18n/LanguageContext.jsx";
import ChoiceButton from "../ChoiceButton.jsx";

const chipClass =
  "min-w-[5.5rem] px-4 py-3 text-[11px] uppercase tracking-[0.16em]";

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
            className="min-w-0 max-w-full px-4 py-3 text-[11px] uppercase tracking-[0.16em]"
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
  availableScales = [],
  availableStringCounts = [],
  availableRadii = [],
  availableNeckWoods,
  availableNeckPieces = [],
  availableNeckConstructions,
  availableFingerboardWoods,
  availableNeckProfiles,
  availableFretSpecs,
  selectScale,
  setCustomScaleValue,
  selectStringCount,
  selectRadius,
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
  const selectedScale = availableScales.find((scale) => scale.id === selections.scaleId);
  const customScaleSelected = isCustomScale(selectedScale);

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

      {availableScales.length > 0 ? (
        <section className="mt-10">
          <h3 className="text-[11px] uppercase tracking-[0.22em] text-gold">
            {t("customBuild.step1.scaleLabel")}
          </h3>
          <div className="mt-4">
            <div
              id="scale-length"
              role="radiogroup"
              aria-label={t("customBuild.step1.scaleLabel")}
              aria-invalid={missingKeys.has("scaleId") || undefined}
              className={`flex flex-wrap gap-3${missingKeys.has("scaleId") ? " rounded-sm ring-1 ring-gold/70 p-1" : ""}`}
            >
              {availableScales.map((scale) => {
                const custom = isCustomScale(scale);
                const label = custom
                  ? optionLabel(scale, language, t, `customBuild.scales.${scale.id}`) || t("customBuild.step1.customScaleLabel")
                  : scaleDisplayValue(scale) || optionLabel(scale, language, t, `customBuild.scales.${scale.id}`);
                const multi = isMultiscale(scale);
                return (
                  <ChoiceButton
                    key={wizardChoiceKey(scale)}
                    selected={selections.scaleId === scale.id}
                    onSelect={() => selectScale(scale.id)}
                    label={label}
                    description={optionDescription(scale, language)}
                    className={chipClass}
                  >
                    {label}
                    {multi && !custom ? (
                      <span className="mt-1 block text-[10px] font-normal normal-case tracking-normal text-muted">
                        {t("customBuild.step1.multiscaleHint")
                          .replace("{bass}", scale.bass)
                          .replace("{treble}", scale.treble)}
                      </span>
                    ) : null}
                  </ChoiceButton>
                );
              })}
            </div>
            {customScaleSelected ? (
              <label className="mt-4 block text-[11px] uppercase tracking-[0.18em] text-gold">
                {t("customBuild.step1.customScaleInputLabel")}
                <input
                  value={selections.customScaleValue || ""}
                  onChange={(event) => setCustomScaleValue?.(event.target.value)}
                  placeholder={t("customBuild.step1.customScalePlaceholder")}
                  className={fieldClass}
                  aria-invalid={!isValidCustomScaleValue(selections.customScaleValue)}
                />
                <span className="mt-2 block text-[10px] font-normal normal-case tracking-normal text-muted">
                  {t("customBuild.step1.customScaleInputHelp")}
                </span>
                {!isValidCustomScaleValue(selections.customScaleValue) ? (
                  <span className="mt-2 block text-xs font-normal normal-case tracking-normal text-gold" role="alert">
                    {t("customBuild.step1.customScaleError")}
                  </span>
                ) : null}
              </label>
            ) : null}
          </div>
        </section>
      ) : null}

      {availableStringCounts.length > 0 ? (
        <section className="mt-10">
          <h3 className="text-[11px] uppercase tracking-[0.22em] text-gold">
            {t("customBuild.step1.stringsLabel")}
          </h3>
          <div className="mt-4">
            <div
              id="string-count"
              role="radiogroup"
              aria-label={t("customBuild.step1.stringsLabel")}
              aria-invalid={missingKeys.has("stringCount") || undefined}
              className={`flex flex-wrap gap-3${missingKeys.has("stringCount") ? " rounded-sm ring-1 ring-gold/70 p-1" : ""}`}
            >
              {availableStringCounts.map((option) => {
                const countTemplate = t("customBuild.strings.count");
                const fromOption = optionLabel(option, language, t);
                const label =
                  fromOption && !fromOption.includes("{count}")
                    ? fromOption
                    : countTemplate.includes("{count}")
                      ? countTemplate.replace("{count}", String(option.value))
                      : fromOption || String(option.value);
                return (
                  <ChoiceButton
                    key={wizardChoiceKey(option)}
                    selected={selections.stringCount === option.value}
                    onSelect={() => selectStringCount(option.value)}
                    label={label}
                    description={optionDescription(option, language)}
                    className={chipClass}
                  >
                    {label}
                  </ChoiceButton>
                );
              })}
            </div>
          </div>
        </section>
      ) : null}

      {availableRadii.length > 0 ? (
        <section className="mt-10">
          <h3 className="text-[11px] uppercase tracking-[0.22em] text-gold">
            {t("customBuild.step1.radiusLabel")}
          </h3>
          <div className="mt-4">
            <div
              id="fretboard-radius"
              role="radiogroup"
              aria-label={t("customBuild.step1.radiusLabel")}
              aria-invalid={missingKeys.has("radiusId") || undefined}
              className={`flex flex-wrap gap-3${missingKeys.has("radiusId") ? " rounded-sm ring-1 ring-gold/70 p-1" : ""}`}
            >
              {availableRadii.map((radius) => {
                const label = optionLabel(radius, language, t) || radius.display;
                return (
                  <ChoiceButton
                    key={wizardChoiceKey(radius)}
                    selected={selections.radiusId === radius.id}
                    onSelect={() => selectRadius(radius.id)}
                    label={label}
                    description={optionDescription(radius, language)}
                    className={chipClass}
                  >
                    {label}
                  </ChoiceButton>
                );
              })}
            </div>
          </div>
        </section>
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
              type="text"
              inputMode="numeric"
              autoComplete="off"
              value={selections.fretCount ?? ""}
              onChange={(event) => selectFretCount?.(event.target.value)}
              className={missingKeys.has("fretCount") || !isValidFretCountSelection(selections.fretCount) ? fieldClass.replace("border-white/10", "border-gold") : fieldClass}
              aria-label={t("customBuild.step3.fretCountLabel")}
              aria-invalid={!isValidFretCountSelection(selections.fretCount)}
            />
            <span className="mt-2 block text-[10px] font-normal normal-case tracking-normal text-muted">
              {t("customBuild.step3.fretCountInputHelp")}
            </span>
            {isValidFretCountSelection(selections.fretCount) ? null : (
              <span className="mt-2 block text-xs text-gold" role="alert">
                {t("customBuild.step3.fretCountError")}
              </span>
            )}
          </label>
        </div>
      </section>
    </div>
  );
}
