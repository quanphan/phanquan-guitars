import { optionDescription, optionLabel } from "../../../data/wizardCatalog.js";
import { mediaUrl } from "../../../config/api.js";
import { useLanguage } from "../../../i18n/LanguageContext.jsx";
import ChoiceButton from "../ChoiceButton.jsx";
import InstrumentTypeIcon from "../InstrumentTypeIcon.jsx";
import ShapeSilhouette from "../ShapeSilhouette.jsx";
import WizardChoiceArt from "../WizardChoiceArt.jsx";

const chipClass =
  "min-w-[5.5rem] px-4 py-3 text-[11px] uppercase tracking-[0.16em]";

function Section({ title, children }) {
  return (
    <section className="mt-10 first:mt-0">
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
  selectInstrumentType,
  selectSeries,
  selectShape,
}) {
  const { t, language } = useLanguage();
  const hasType = Boolean(selections.instrumentTypeId);
  const hasSeries = Boolean(selections.seriesId);
  const hasShape = Boolean(selections.shapeId);
  const seriesReady = hasSeries || availableSeries.length === 0;
  const shapeReady = hasShape || availableShapes.length === 0;

  return (
    <div>
      {instrumentTypes.length > 0 ? (
      <Section title={t("customBuild.step1.instrumentLabel")}>
        <div
          role="radiogroup"
          aria-label={t("customBuild.step1.instrumentLabel")}
          className="flex flex-wrap items-stretch gap-2"
        >
          {instrumentTypes.map((type) => {
            const selected = selections.instrumentTypeId === type.id;
            const name = optionLabel(type, language, t, `customBuild.types.${type.id}`);
            const description = optionDescription(type, language);
            return (
              <ChoiceButton
                key={type.id}
                selected={selected}
                onSelect={() => selectInstrumentType(type.id)}
                label={name}
                selectedFill={false}
                className="flex min-h-0 min-w-0 w-[calc((100%-0.5rem)/2)] flex-col overflow-visible p-0 sm:w-[min(12.1rem,calc((100%-1.5rem)/4))]"
              >
                <WizardChoiceArt
                  src={type.image ? mediaUrl(type.image) : ""}
                  size="typeCard"
                  fit="contain"
                  fallback={(
                    <InstrumentTypeIcon
                      id={type.icon || type.id}
                      className={`h-full w-full ${selected ? "text-gold" : "text-ivory/55"}`}
                    />
                  )}
                />
                <span
                  className={`flex min-h-[2.5rem] w-full flex-1 flex-col items-center justify-center px-2 py-2 text-center text-[10px] uppercase tracking-[0.14em] ${
                    selected ? "bg-gold/15 text-gold" : "bg-ink text-ivory/80"
                  }`}
                >
                  {name}
                  {description ? (
                    <span className="mt-1 block whitespace-pre-wrap text-[11px] font-normal normal-case tracking-normal text-muted">
                      {description}
                    </span>
                  ) : null}
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
                const description = optionDescription(series, language);
                const imageSrc = series.image ? mediaUrl(series.image) : "";
                if (!imageSrc) {
                  return (
                    <ChoiceButton
                      key={series.id}
                      selected={selections.seriesId === series.id}
                      onSelect={() => selectSeries(series.id)}
                      label={name}
                      description={description}
                      className={chipClass}
                    >
                      {name}
                    </ChoiceButton>
                  );
                }
                const selected = selections.seriesId === series.id;
                return (
                  <ChoiceButton
                    key={series.id}
                    selected={selected}
                    onSelect={() => selectSeries(series.id)}
                    label={name}
                    selectedFill={false}
                    className="flex w-[8.25rem] min-w-0 flex-col overflow-visible p-0 sm:w-[9.25rem]"
                  >
                    <WizardChoiceArt src={imageSrc} size="type" fit="contain" />
                    <span
                      className={`flex min-h-[2.75rem] w-full flex-1 flex-col items-center justify-center px-3 py-3 text-center text-[10px] uppercase tracking-[0.14em] ${
                        selected ? "bg-gold/15 text-gold" : "bg-ink text-ivory/80"
                      }`}
                    >
                      {name}
                      {description ? (
                        <span className="mt-1 block whitespace-pre-wrap text-[11px] font-normal normal-case tracking-normal text-muted">
                          {description}
                        </span>
                      ) : null}
                    </span>
                  </ChoiceButton>
                );
              })}
            </div>
        </Section>
      ) : null}

      {hasType && seriesReady && availableShapes.length > 0 ? (
        <Section title={t("customBuild.step1.shapeLabel")}>
            <div
              role="radiogroup"
              aria-label={t("customBuild.step1.shapeLabel")}
              className="grid grid-cols-2 items-stretch gap-3 sm:grid-cols-4"
            >
              {availableShapes.map((shape) => {
                const selected = selections.shapeId === shape.id;
                const name = optionLabel(shape, language, t, `customBuild.shapes.${shape.id}.name`);
                const description = optionDescription(shape, language);
                return (
                  <ChoiceButton
                    key={shape.id}
                    selected={selected}
                    onSelect={() => selectShape(shape.id)}
                    label={name}
                    selectedFill={false}
                    className="flex h-full min-w-0 flex-col overflow-visible p-0"
                  >
                    <WizardChoiceArt
                      src={shape.image ? mediaUrl(shape.image) : ""}
                      size="shapeCard"
                      fit="contain"
                      paper
                      fallback={(
                        <ShapeSilhouette
                          id={shape.silhouette}
                          className="h-full w-full text-gold"
                        />
                      )}
                    />
                    <span
                      className={`flex min-h-[2.75rem] w-full flex-1 flex-col items-center justify-center px-3 py-3 text-center text-[10px] uppercase tracking-[0.14em] ${
                        selected ? "bg-gold/15 text-gold" : "bg-ink text-ivory/80"
                      }`}
                    >
                      {name}
                      {description ? (
                        <span className="mt-1 block whitespace-pre-wrap text-[11px] font-normal normal-case tracking-normal text-muted">
                          {description}
                        </span>
                      ) : null}
                    </span>
                  </ChoiceButton>
                );
              })}
            </div>
        </Section>
      ) : null}
    </div>
  );
}
