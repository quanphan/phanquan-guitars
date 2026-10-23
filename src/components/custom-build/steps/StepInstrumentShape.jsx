import { INSTRUMENT_TYPES } from "../../../data/customBuild.js";
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

function EmptyState({ message }) {
  return <p className="text-sm leading-relaxed text-muted">{message}</p>;
}

export default function StepInstrumentShape({
  selections,
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
  const { t } = useLanguage();
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

      <Section title={t("customBuild.step1.instrumentLabel")}>
        <div
          role="radiogroup"
          aria-label={t("customBuild.step1.instrumentLabel")}
          className="flex flex-wrap gap-3"
        >
          {INSTRUMENT_TYPES.map((type) => {
            const selected = selections.instrumentTypeId === type.id;
            const name = t(`customBuild.types.${type.id}`);
            return (
              <ChoiceButton
                key={type.id}
                selected={selected}
                onSelect={() => selectInstrumentType(type.id)}
                label={name}
                className="flex w-[7.25rem] flex-col items-center gap-2 px-3 py-3"
              >
                <InstrumentTypeIcon
                  id={type.icon}
                  className={`h-9 w-8 ${selected ? "text-gold" : "text-ivory/55"}`}
                />
                <span className="text-center text-[10px] uppercase tracking-[0.14em] text-current">
                  {name}
                </span>
              </ChoiceButton>
            );
          })}
        </div>
      </Section>

      {hasType ? (
        <Section title={t("customBuild.step1.seriesLabel")}>
          {availableSeries.length === 0 ? (
            <EmptyState message={t("customBuild.step1.seriesContact")} />
          ) : (
            <div
              role="radiogroup"
              aria-label={t("customBuild.step1.seriesLabel")}
              className="flex flex-wrap gap-3"
            >
              {availableSeries.map((series) => (
                <ChoiceButton
                  key={series.id}
                  selected={selections.seriesId === series.id}
                  onSelect={() => selectSeries(series.id)}
                  label={t(`customBuild.series.${series.id}.name`)}
                  description={t(`customBuild.series.${series.id}.description`)}
                  className={chipClass}
                >
                  {t(`customBuild.series.${series.id}.name`)}
                </ChoiceButton>
              ))}
            </div>
          )}
        </Section>
      ) : null}

      {hasSeries ? (
        <Section title={t("customBuild.step1.shapeLabel")}>
          {availableShapes.length === 0 ? (
            <EmptyState message={t("customBuild.step1.shapeContact")} />
          ) : (
            <div
              role="radiogroup"
              aria-label={t("customBuild.step1.shapeLabel")}
              className="grid grid-cols-2 gap-3 sm:grid-cols-4"
            >
              {availableShapes.map((shape) => {
                const selected = selections.shapeId === shape.id;
                const name = t(`customBuild.shapes.${shape.id}.name`);
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
          )}
        </Section>
      ) : null}

      {hasShape ? (
        <Section title={t("customBuild.step1.scaleLabel")}>
          {availableScales.length === 0 ? (
            <EmptyState message={t("customBuild.step1.scaleContact")} />
          ) : (
            <div
              role="radiogroup"
              aria-label={t("customBuild.step1.scaleLabel")}
              className="flex flex-wrap gap-3"
            >
              {availableScales.map((scale) => (
                <ChoiceButton
                  key={scale.id}
                  selected={selections.scaleId === scale.id}
                  onSelect={() => selectScale(scale.id)}
                  label={scale.display}
                  className={chipClass}
                >
                  {scale.display}
                  {scale.type === "multiscale" ? (
                    <span className="mt-1 block text-[10px] font-normal normal-case tracking-normal text-muted">
                      {t("customBuild.step1.multiscaleHint")
                        .replace("{bass}", scale.bass)
                        .replace("{treble}", scale.treble)}
                    </span>
                  ) : null}
                </ChoiceButton>
              ))}
            </div>
          )}
        </Section>
      ) : null}

      {hasScale ? (
        <Section title={t("customBuild.step1.stringsLabel")}>
          {availableStringCounts.length === 0 ? (
            <EmptyState message={t("customBuild.step1.stringsContact")} />
          ) : (
            <div
              role="radiogroup"
              aria-label={t("customBuild.step1.stringsLabel")}
              className="flex flex-wrap gap-3"
            >
              {availableStringCounts.map((option) => (
                <ChoiceButton
                  key={option.id}
                  selected={selections.stringCount === option.value}
                  onSelect={() => selectStringCount(option.value)}
                  label={t("customBuild.strings.count").replace(
                    "{count}",
                    String(option.value),
                  )}
                  className={chipClass}
                >
                  {t("customBuild.strings.count").replace(
                    "{count}",
                    String(option.value),
                  )}
                </ChoiceButton>
              ))}
            </div>
          )}
        </Section>
      ) : null}

      {hasStrings ? (
        <Section title={t("customBuild.step1.radiusLabel")}>
          {availableRadii.length === 0 ? (
            <EmptyState message={t("customBuild.step1.radiusContact")} />
          ) : (
            <div
              role="radiogroup"
              aria-label={t("customBuild.step1.radiusLabel")}
              className="flex flex-wrap gap-3"
            >
              {availableRadii.map((radius) => (
                <ChoiceButton
                  key={radius.id}
                  selected={selections.radiusId === radius.id}
                  onSelect={() => selectRadius(radius.id)}
                  label={radius.display}
                  className={chipClass}
                >
                  {radius.display}
                </ChoiceButton>
              ))}
            </div>
          )}
        </Section>
      ) : null}
    </div>
  );
}
