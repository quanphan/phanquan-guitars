import { mediaUrl } from "../../../config/api.js";
import FitImage from "../../FitImage.jsx";
import { Select } from "../../auth/Field.jsx";
import { choiceImageSrc, optionDescription, optionLabel } from "../../../data/wizardCatalog.js";
import { usesSecondaryBodyWood } from "../../../data/wizardSeriesConstruction.js";
import { useLanguage } from "../../../i18n/LanguageContext.jsx";
import ChoiceButton from "../ChoiceButton.jsx";

function WoodCard({ wood, selected, onSelect, t, language }) {
  const name = optionLabel(wood, language, t, `customBuild.woods.${wood.id}.name`);
  const description = optionDescription(wood, language, t, `customBuild.woods.${wood.id}.description`);
  const hasDescription = Boolean(description);

  return (
    <ChoiceButton
      selected={selected}
      onSelect={onSelect}
      label={name}
      className="flex h-full flex-col overflow-hidden p-0"
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
        <span className="px-4 pb-4 text-[11px] font-normal normal-case tracking-normal text-muted">
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
}) {
  const { t, language } = useLanguage();
  const selectedConstruction = availableBodyConstructions.find((item) => item.id === selections.bodyConstructionId);
  const showSecondary = usesSecondaryBodyWood(selectedConstruction);
  const woodChoices = availableBodyWoods.map((wood) => ({
    value: wood.id,
    label: optionLabel(wood, language, t, `customBuild.woods.${wood.id}.name`),
  }));
  const constructionChoices = availableBodyConstructions.map((option) => ({
    value: option.id,
    label: constructionLabel(option, language),
  }));
  const showBodySection = availableBodyConstructions.length > 0 || availableBodyWoods.length > 0;
  const noSeries = !selections.seriesId;
  const constructionHint = noSeries
    ? t("customBuild.step2.bodyPiecesNeedSeries")
    : availableBodyConstructions.length === 0
      ? t("customBuild.step2.bodyPiecesEmpty")
      : "";

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

      {showBodySection ? (
      <section className="mt-10">
        <h3 className="text-[11px] uppercase tracking-[0.22em] text-gold">
          {t("customBuild.step2.bodyLabel")}
        </h3>
        <div className="mt-4 grid gap-4">
          <Select
            id="body-pieces"
            ariaLabel={t("customBuild.step2.bodyPiecesLabel")}
            value={selections.bodyConstructionId}
            onChange={selectBodyConstruction}
            options={constructionChoices}
            disabled={constructionChoices.length === 0}
            hint={constructionHint}
          />
          {availableBodyWoods.length > 0 ? (
            <Select
              id="main-body-wood"
              label={t("customBuild.step2.mainWoodLabel")}
              value={selections.bodyWoodId}
              onChange={selectBodyWood}
              options={woodChoices}
            />
          ) : (
            <p className="text-sm text-muted">{t("customBuild.step2.bodyContact")}</p>
          )}
          {showSecondary ? (
            <Select
              id="secondary-body-wood"
              label={t("customBuild.step2.secondaryWoodLabel")}
              value={selections.secondaryBodyWoodId}
              onChange={selectSecondaryBodyWood}
              options={woodChoices}
            />
          ) : null}
        </div>
      </section>
      ) : (
        <p className="mt-10 text-sm text-muted">{t("customBuild.step2.bodyContact")}</p>
      )}

      {topApplicable && availableTopWoods.length > 0 ? (
        <section className="mt-10">
          <h3 className="text-[11px] uppercase tracking-[0.22em] text-gold">
            {t("customBuild.step2.topLabel")}
          </h3>
          <div className="mt-4">
              <div
                role="radiogroup"
                aria-label={t("customBuild.step2.topLabel")}
                className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3"
              >
                {availableTopWoods.map((wood) => (
                  <WoodCard
                    key={wood.id}
                    wood={wood}
                    selected={selections.topWoodId === wood.id}
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
