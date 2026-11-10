import { optionDescription, optionLabel, wizardChoiceKey } from "../../../data/wizardCatalog.js";
import {
  isCustomScale,
  isMultiscale,
  isValidCustomScaleValue,
  scaleDisplayValue,
} from "../../../data/wizardScaleAttributes.js";
import { fieldClass } from "../../auth/Field.jsx";
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
  setCustomScaleValue,
  selectStringCount,
  selectRadius,
}) {
  const { t, language } = useLanguage();
  const hasType = Boolean(selections.instrumentTypeId);
  const hasSeries = Boolean(selections.seriesId);
  const hasShape = Boolean(selections.shapeId);
  const selectedScale = availableScales.find((scale) => scale.id === selections.scaleId);
  const customScaleSelected = isCustomScale(selectedScale);

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
                className="flex w-[8.25rem] flex-col items-center gap-2 px-3 py-3 sm:w-[9.25rem]"
              >
                <WizardChoiceArt
                  src={type.image ? mediaUrl(type.image) : ""}
                  size="type"
                  fallback={(
                    <InstrumentTypeIcon
                      id={type.icon || type.id}
                      className={`h-full w-full ${selected ? "text-gold" : "text-ivory/55"}`}
                    />
                  )}
                />
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
              className="grid grid-cols-2 items-stretch gap-3 sm:grid-cols-4"
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
                    selectedFill={false}
                    className="flex h-full flex-col overflow-hidden p-0"
                  >
                    <WizardChoiceArt
                      src={shape.image ? mediaUrl(shape.image) : ""}
                      size="shapeCard"
                      surface="white"
                      fallback={(
                        <ShapeSilhouette
                          id={shape.silhouette}
                          className="h-full w-full text-gold"
                        />
                      )}
                    />
                    <span
                      className={`flex min-h-[2.75rem] w-full items-center justify-center px-3 py-3 text-center text-[10px] uppercase tracking-[0.14em] ${
                        selected ? "bg-gold/15 text-gold" : "bg-ink text-ivory/80"
                      }`}
                    >
                      {name}
                    </span>
                  </ChoiceButton>
                );
              })}
            </div>
        </Section>
      ) : null}

      {hasShape ? (
        <Section title={t("customBuild.step1.scaleLabel")}>
            <div
              role="radiogroup"
              aria-label={t("customBuild.step1.scaleLabel")}
              className="flex flex-wrap gap-3"
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
        </Section>
      ) : null}

      {hasShape ? (
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
                  key={wizardChoiceKey(option)}
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

      {hasShape ? (
        <Section title={t("customBuild.step1.radiusLabel")}>
            <div
              role="radiogroup"
              aria-label={t("customBuild.step1.radiusLabel")}
              className="flex flex-wrap gap-3"
            >
              {availableRadii.map((radius) => {
                const label = optionLabel(radius, language, t) || radius.display;
                return (
                <ChoiceButton
                  key={wizardChoiceKey(radius)}
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
