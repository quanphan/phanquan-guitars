import { useLanguage } from "../../../i18n/LanguageContext.jsx";
import ChoiceButton from "../ChoiceButton.jsx";

function WoodCard({ wood, selected, onSelect, t }) {
  const name = t(`customBuild.woods.${wood.id}.name`);
  const description = t(`customBuild.woods.${wood.id}.description`);
  const hasDescription = description && !description.endsWith(`.${wood.id}.description`);

  return (
    <ChoiceButton
      selected={selected}
      onSelect={onSelect}
      label={name}
      className="flex h-full flex-col overflow-hidden"
    >
      {wood.image ? (
        <img
          src={wood.image}
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

export default function StepBodyTop({
  selections,
  availableBodyWoods,
  availableTopWoods,
  topApplicable,
  selectBodyWood,
  selectTopWood,
}) {
  const { t } = useLanguage();

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

      <section className="mt-10">
        <h3 className="text-[11px] uppercase tracking-[0.22em] text-gold">
          {t("customBuild.step2.bodyLabel")}
        </h3>
        <div className="mt-4">
          {availableBodyWoods.length === 0 ? (
            <p className="text-sm leading-relaxed text-muted">
              {t("customBuild.step2.bodyContact")}
            </p>
          ) : (
            <div
              role="radiogroup"
              aria-label={t("customBuild.step2.bodyLabel")}
              className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3"
            >
              {availableBodyWoods.map((wood) => (
                <WoodCard
                  key={wood.id}
                  wood={wood}
                  selected={selections.bodyWoodId === wood.id}
                  onSelect={() => selectBodyWood(wood.id)}
                  t={t}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {selections.bodyWoodId ? (
        <section className="mt-10">
          <h3 className="text-[11px] uppercase tracking-[0.22em] text-gold">
            {t("customBuild.step2.topLabel")}
          </h3>
          <div className="mt-4">
            {!topApplicable ? (
              <p className="text-sm leading-relaxed text-muted">
                {t("customBuild.step2.topNotApplicable")}
              </p>
            ) : availableTopWoods.length === 0 ? (
              <p className="text-sm leading-relaxed text-muted">
                {t("customBuild.step2.topContact")}
              </p>
            ) : (
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
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      ) : null}
    </div>
  );
}
