import { mediaUrl } from "../../../config/api.js";
import { choiceImageSrc, optionDescription, optionLabel } from "../../../data/wizardCatalog.js";
import { useLanguage } from "../../../i18n/LanguageContext.jsx";
import ChoiceButton from "../ChoiceButton.jsx";

function WoodCard({ option, selected, onSelect, nameKey, t, language }) {
  const name = optionLabel(option, language, t, `${nameKey}.${option.id}.name`);
  const description = optionDescription(option, language, t, `${nameKey}.${option.id}.description`);
  const hasDescription = Boolean(description);

  return (
    <ChoiceButton
      selected={selected}
      onSelect={onSelect}
      label={name}
      className="flex h-full flex-col overflow-hidden"
    >
      {option.image ? (
        <img
          src={choiceImageSrc(option.image, mediaUrl)}
          alt=""
          className="aspect-[4/3] w-full object-cover"
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

function ChipGroup({ label, options, selectedId, onSelect, nameKey, t, language }) {
  if (!options.length) return null;

  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-3">
      {options.map((option) => {
        const name = optionLabel(option, language, t, `${nameKey}.${option.id}.name`);
        const detail = optionDescription(option, language, t, `${nameKey}.${option.id}.detail`);
        const hasDetail = Boolean(detail);
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

export default function StepNeckFingerboard({
  selections,
  availableNeckWoods,
  availableNeckConstructions,
  availableFingerboardWoods,
  availableNeckProfiles,
  availableFretSpecs,
  inheritedFretCount,
  selectNeckWood,
  selectNeckConstruction,
  selectFingerboardWood,
  selectNeckProfile,
  selectFretSpec,
}) {
  const { t, language } = useLanguage();

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

      {availableNeckWoods.length > 0 ? (
      <section className="mt-10">
        <h3 className="text-[11px] uppercase tracking-[0.22em] text-gold">
          {t("customBuild.step3.neckWoodLabel")}
        </h3>
        <div className="mt-4">
            <div
              role="radiogroup"
              aria-label={t("customBuild.step3.neckWoodLabel")}
              className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3"
            >
              {availableNeckWoods.map((wood) => (
                <WoodCard
                  key={wood.id}
                  option={wood}
                  selected={selections.neckWoodId === wood.id}
                  onSelect={() => selectNeckWood(wood.id)}
                  nameKey="customBuild.neckWoods"
                  t={t}
                  language={language}
                />
              ))}
            </div>
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
            label={t("customBuild.step3.constructionLabel")}
            options={availableNeckConstructions}
            selectedId={selections.neckConstructionId}
            onSelect={selectNeckConstruction}
            nameKey="customBuild.constructions"
            t={t}
            language={language}
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
                role="radiogroup"
                aria-label={t("customBuild.step3.fingerboardLabel")}
                className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3"
              >
                {availableFingerboardWoods.map((wood) => (
                  <WoodCard
                    key={wood.id}
                    option={wood}
                    selected={selections.fingerboardWoodId === wood.id}
                    onSelect={() => selectFingerboardWood(wood.id)}
                    nameKey="customBuild.fingerboards"
                    t={t}
                    language={language}
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
            label={t("customBuild.step3.profileLabel")}
            options={availableNeckProfiles}
            selectedId={selections.neckProfileId}
            onSelect={selectNeckProfile}
            nameKey="customBuild.profiles"
            t={t}
            language={language}
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
            label={t("customBuild.step3.fretLabel")}
            options={availableFretSpecs}
            selectedId={selections.fretSpecId}
            onSelect={selectFretSpec}
            nameKey="customBuild.frets"
            t={t}
            language={language}
          />
        </div>
      </section>
      ) : null}

      {inheritedFretCount != null ? (
      <section className="mt-10">
        <h3 className="text-[11px] uppercase tracking-[0.22em] text-gold">
          {t("customBuild.step3.fretCountLabel")}
        </h3>
        <div className="mt-4">
            <p className="border border-white/10 bg-panel/60 px-4 py-3 text-sm text-ivory">
              {t("customBuild.step3.fretCountInherited").replace(
                "{count}",
                String(inheritedFretCount),
              )}
            </p>
        </div>
      </section>
      ) : null}
    </div>
  );
}
