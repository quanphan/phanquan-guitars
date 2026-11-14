import { mediaUrl } from "../../../config/api.js";
import FitImage from "../../FitImage.jsx";
import { Select } from "../../auth/Field.jsx";
import { choiceImageSrc, optionDescription, optionLabel, wizardChoiceKey } from "../../../data/wizardCatalog.js";
import { optionIdEquals } from "../../../data/wizardSelection.js";
import { usesSecondaryBodyWood } from "../../../data/wizardSeriesConstruction.js";
import { useLanguage } from "../../../i18n/LanguageContext.jsx";
import ChoiceButton from "../ChoiceButton.jsx";

function WoodCard({ wood, selected, onSelect, t, language }) {
  const name = optionLabel(wood, language, t, `customBuild.woods.${wood.id}.name`);
  const description = optionDescription(wood, language);
  const hasDescription = Boolean(description);

  return (
    <ChoiceButton
      selected={selected}
      onSelect={onSelect}
      label={name}
      className="flex h-full flex-col overflow-visible p-0"
    >
      {wood.image ? (
        <FitImage
          src={choiceImageSrc(wood.image, mediaUrl)}
          alt=""
          fit="cover"
          frameClassName="aspect-[4/3] w-full"
          className="max-h-none max-w-none"
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

function constructionLabel(option, language) {
  return option?.translations?.[language]?.name || option?.translations?.en?.name || option?.name || option?.id || "";
}

export default function StepBodyTop({
  selections,
  availableBodyWoods,
  availableBodyConstructions = [],
  availableTopWoods,
  topApplicable,
  selectBodyConstruction,
  selectBodyWood,
  selectSecondaryBodyWood,
  selectTopWood,
  missingFields = [],
}) {
  const { t, language } = useLanguage();
  const missingKeys = new Set((missingFields || []).map((item) => item.key));
  const selectedConstruction = availableBodyConstructions.find((item) => item.id === selections.bodyConstructionId);
  const selectedBodyWood = availableBodyWoods.find((item) => optionIdEquals(item, selections.bodyWoodId));
  const selectedSecondaryWood = availableBodyWoods.find((item) => optionIdEquals(item, selections.secondaryBodyWoodId));
  const showSecondary = usesSecondaryBodyWood(selectedConstruction);
  const woodChoices = availableBodyWoods.map((wood) => ({
    value: wood.id,
    label: optionLabel(wood, language, t, `customBuild.woods.${wood.id}.name`),
  }));
  const constructionChoices = availableBodyConstructions.map((option) => ({
    value: option.id,
    label: constructionLabel(option, language),
  }));
  const showConstruction = constructionChoices.length > 0;
  const showWoods = woodChoices.length > 0;
  const showBodySection = showConstruction || showWoods;

  return (
    <div>
      <h2 className="font-display text-3xl tracking-wide text-ivory sm:text-4xl">
        {t("customBuild.step2.heading")}
      </h2>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
        {t("customBuild.step2.description")}
      </p>
      <p className="mt-4 max-w-2xl text-xs leading-relaxed text-muted">
        {t("customBuild.provisional")}
      </p>
      {missingFields.length ? (
        <p id="step2-incomplete" className="mt-6 border border-gold/40 bg-gold/10 px-4 py-3 text-sm text-ivory" role="alert">
          {t("customBuild.step2.incomplete")}
          <span className="mt-2 block text-xs uppercase tracking-[0.14em] text-gold">
            {missingFields.map((item) => t(item.labelKey)).join(" · ")}
          </span>
        </p>
      ) : null}

      {showBodySection ? (
      <section className="mt-10">
        <h3 className="text-[11px] uppercase tracking-[0.22em] text-gold">
          {t("customBuild.step2.bodyLabel")}
        </h3>
        <div className="mt-4 grid gap-4">
          {showConstruction ? (
            <Select
              id="body-pieces"
              ariaLabel={t("customBuild.step2.bodyPiecesLabel")}
              value={selections.bodyConstructionId}
              onChange={selectBodyConstruction}
              options={constructionChoices}
              hint={optionDescription(selectedConstruction, language)}
              invalid={missingKeys.has("bodyConstructionId")}
            />
          ) : null}
          {showWoods ? (
            <Select
              id="main-body-wood"
              label={t("customBuild.step2.mainWoodLabel")}
              value={selections.bodyWoodId}
              onChange={selectBodyWood}
              options={woodChoices}
              hint={optionDescription(selectedBodyWood, language)}
              invalid={missingKeys.has("bodyWoodId")}
            />
          ) : null}
          {showSecondary && showWoods ? (
            <Select
              id="secondary-body-wood"
              label={t("customBuild.step2.secondaryWoodLabel")}
              value={selections.secondaryBodyWoodId}
              onChange={selectSecondaryBodyWood}
              options={woodChoices}
              hint={optionDescription(selectedSecondaryWood, language)}
              invalid={missingKeys.has("secondaryBodyWoodId")}
            />
          ) : null}
        </div>
      </section>
      ) : null}

      {topApplicable && availableTopWoods.length > 0 ? (
        <section className="mt-10">
          <h3 className="text-[11px] uppercase tracking-[0.22em] text-gold">
            {t("customBuild.step2.topLabel")}
          </h3>
          <div className="mt-4">
              <div
                id="top-wood"
                role="radiogroup"
                aria-label={t("customBuild.step2.topLabel")}
                aria-invalid={missingKeys.has("topWoodId") || undefined}
                className={`grid gap-3 sm:grid-cols-2 xl:grid-cols-3${missingKeys.has("topWoodId") ? " rounded-sm ring-1 ring-gold/70 p-1" : ""}`}
              >
                {availableTopWoods.map((wood) => (
                  <WoodCard
                    key={wizardChoiceKey(wood)}
                    wood={wood}
                    selected={optionIdEquals(wood, selections.topWoodId)}
                    onSelect={() => selectTopWood(wood.id)}
                    t={t}
                    language={language}
                  />
                ))}
              </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
