import { optionDescription, optionLabel } from "../../../data/wizardCatalog.js";
import { mediaUrl } from "../../../config/api.js";
import { useLanguage } from "../../../i18n/LanguageContext.jsx";
import ChoiceButton from "../ChoiceButton.jsx";
import InstrumentTypeIcon from "../InstrumentTypeIcon.jsx";
import ShapeSilhouette from "../ShapeSilhouette.jsx";

const chipClass =
  "min-w-[5.5rem] px-4 py-3 text-[11px] uppercase tracking-[0.16em]";

function Section({ title, children }) {
  return (
    <section className="mt-10">
      <h3 className="text-[11px] uppercase tracking-[0.22em] text-gold">
        {title}
      </h3>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export default function StepInstrumentShape({
  selections,
  instrumentTypes = [],
  availableSeries,
  availableShapes,
  availableScales,
  availableStringCounts,
  availableRadii,
  selectInstrumentType,
  selectSeries,
  selectShape,
  selectScale,
  selectStringCount,
  selectRadius,
}) {
  const { t, language } = useLanguage();
  const hasType = Boolean(selections.instrumentTypeId);
  const hasSeries = Boolean(selections.seriesId);
  const hasShape = Boolean(selections.shapeId);
  const hasScale = Boolean(selections.scaleId);
  const hasStrings = selections.stringCount != null;

  return (
    <div>
      <h2 className="font-display text-3xl tracking-wide text-ivory sm:text-4xl">
        {t("customBuild.step1.heading")}
      </h2>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
        {t("customBuild.step1.description")}
      </p>
      <p className="mt-4 max-w-2xl text-xs leading-relaxed text-muted">
        {t("customBuild.provisional")}
      </p>

      {instrumentTypes.length > 0 ? (
      <Section title={t("customBuild.step1.instrumentLabel")}>
        <div
          role="radiogroup"
          aria-label={t("customBuild.step1.instrumentLabel")}
          className="flex flex-wrap gap-3"
        >
          {instrumentTypes.map((type) => {
            const selected = selections.instrumentTypeId === type.id;
            const name = optionLabel(type, language, t, `customBuild.types.${type.id}`);
            return (
              <ChoiceButton
                key={type.id}
                selected={selected}
                onSelect={() => selectInstrumentType(type.id)}
                label={name}
                className="flex w-[7.25rem] flex-col items-center gap-2 px-3 py-3"
              >
                {type.image ? (
                  <img src={mediaUrl(type.image)} alt="" className="h-9 w-8 object-contain" />
                ) : (
                <InstrumentTypeIcon
                  id={type.icon || type.id}
                  className={`h-9 w-8 ${selected ? "text-gold" : "text-ivory/55"}`}
                />
                )}
                <span className="text-center text-[10px] uppercase tracking-[0.14em] text-current">
                  {name}
                </span>
              </ChoiceButton>
            );
          })}
        </div>
      </Section>
      ) : null}

      {hasType && availableSeries.length > 0 ? (
        <Section title={t("customBuild.step1.seriesLabel")}>
            <div
              role="radiogroup"
              aria-label={t("customBuild.step1.seriesLabel")}
              className="flex flex-wrap gap-3"
            >
              {availableSeries.map((series) => {
                const name = optionLabel(series, language, t, `customBuild.series.${series.id}.name`);
                return (
                <ChoiceButton
                  key={series.id}
                  selected={selections.seriesId === series.id}
                  onSelect={() => selectSeries(series.id)}
                  label={name}
                  description={optionDescription(series, language, t, `customBuild.series.${series.id}.description`)}
                  className={chipClass}
                >
                  {name}
                </ChoiceButton>
                );
              })}
            </div>
        </Section>
      ) : null}

      {hasSeries && availableShapes.length > 0 ? (
        <Section title={t("customBuild.step1.shapeLabel")}>
            <div
              role="radiogroup"
              aria-label={t("customBuild.step1.shapeLabel")}
              className="grid grid-cols-2 gap-3 sm:grid-cols-4"
            >
              {availableShapes.map((shape) => {
                const selected = selections.shapeId === shape.id;
                const name = optionLabel(shape, language, t, `customBuild.shapes.${shape.id}.name`);
                return (
                  <ChoiceButton
                    key={shape.id}
                    selected={selected}
                    onSelect={() => selectShape(shape.id)}
                    label={name}
                    className="flex flex-col items-center px-3 py-4"
                  >
                    <ShapeSilhouette
                      id={shape.silhouette}
                      className={`h-20 w-auto ${selected ? "text-gold" : "text-ivory/40"}`}
                    />
                    <span className="mt-2 text-center text-[10px] uppercase tracking-[0.14em]">
                      {name}
                    </span>
                  </ChoiceButton>
                );
              })}
            </div>
        </Section>
      ) : null}

      {hasShape && availableScales.length > 0 ? (
        <Section title={t("customBuild.step1.scaleLabel")}>
            <div
              role="radiogroup"
              aria-label={t("customBuild.step1.scaleLabel")}
              className="flex flex-wrap gap-3"
            >
              {availableScales.map((scale) => {
                const label = scale.display || optionLabel(scale, language, t, `customBuild.scales.${scale.id}`);
                return (
                <ChoiceButton
                  key={scale.id}
                  selected={selections.scaleId === scale.id}
                  onSelect={() => selectScale(scale.id)}
                  label={label}
                  className={chipClass}
                >
                  {label}
                  {scale.type === "multiscale" ? (
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
        </Section>
      ) : null}

      {hasScale && availableStringCounts.length > 0 ? (
        <Section title={t("customBuild.step1.stringsLabel")}>
            <div
              role="radiogroup"
              aria-label={t("customBuild.step1.stringsLabel")}
              className="flex flex-wrap gap-3"
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
                  key={option.id}
                  selected={selections.stringCount === option.value}
                  onSelect={() => selectStringCount(option.value)}
                  label={label}
                  className={chipClass}
                >
                  {label}
                </ChoiceButton>
                );
              })}
            </div>
        </Section>
      ) : null}

      {hasStrings && availableRadii.length > 0 ? (
        <Section title={t("customBuild.step1.radiusLabel")}>
            <div
              role="radiogroup"
              aria-label={t("customBuild.step1.radiusLabel")}
              className="flex flex-wrap gap-3"
            >
              {availableRadii.map((radius) => {
                const label = radius.display || optionLabel(radius, language, t);
                return (
                <ChoiceButton
                  key={radius.id}
                  selected={selections.radiusId === radius.id}
                  onSelect={() => selectRadius(radius.id)}
                  label={label}
                  className={chipClass}
                >
                  {label}
                </ChoiceButton>
                );
              })}
            </div>
        </Section>
      ) : null}
    </div>
  );
}
