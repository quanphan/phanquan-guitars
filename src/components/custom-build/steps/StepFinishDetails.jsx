import { useLanguage } from "../../../i18n/LanguageContext.jsx";
import ChoiceButton from "../ChoiceButton.jsx";
import OptionChips from "../OptionChips.jsx";

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

function NoteField({
  id,
  label,
  value,
  onChange,
  max,
  rows,
  hint,
}) {
  const count = value?.length ?? 0;
  return (
    <div>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <textarea
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        maxLength={max}
        rows={rows}
        className="w-full resize-y border border-white/10 bg-ink px-4 py-3 text-sm leading-relaxed text-ivory placeholder:text-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
        placeholder={hint}
      />
      <p className="mt-2 text-[11px] uppercase tracking-[0.16em] text-muted">
        {count} / {max}
      </p>
    </div>
  );
}

export default function StepFinishDetails({
  selections,
  finishType,
  availableFinishTypes,
  availableFinishColors,
  availableInlays,
  availableEngravings,
  headless,
  customColorMax,
  specialRequestMax,
  selectFinishType,
  selectFinishColor,
  setCustomColorNote,
  selectInlay,
  selectEngraving,
  setSpecialRequests,
}) {
  const { t } = useLanguage();
  const contact = t("customBuild.step5.contact");
  const sheenKey = finishType?.sheen
    ? t(`customBuild.sheens.${finishType.sheen}`)
    : null;

  return (
    <div>
      <h2 className="font-display text-3xl tracking-wide text-ivory sm:text-4xl">
        {t("customBuild.step5.heading")}
      </h2>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
        {t("customBuild.step5.description")}
      </p>
      <p className="mt-4 max-w-2xl text-xs leading-relaxed text-muted">
        {t("customBuild.provisional")}
      </p>

      <Section title={t("customBuild.step5.finishTypeLabel")}>
        <OptionChips
          label={t("customBuild.step5.finishTypeLabel")}
          options={availableFinishTypes}
          selectedId={selections.finishTypeId}
          onSelect={selectFinishType}
          nameKey="customBuild.finishTypes"
          emptyMessage={contact}
          t={t}
        />
      </Section>

      {sheenKey ? (
        <Section title={t("customBuild.step5.sheenLabel")}>
          <p className="border border-white/10 bg-panel/60 px-4 py-3 text-sm text-ivory">
            {t("customBuild.step5.sheenInherited").replace("{sheen}", sheenKey)}
          </p>
        </Section>
      ) : null}

      {selections.finishTypeId ? (
        <Section title={t("customBuild.step5.colorLabel")}>
          {availableFinishColors.length === 0 ? (
            <p className="text-sm leading-relaxed text-muted">{contact}</p>
          ) : (
            <div
              role="radiogroup"
              aria-label={t("customBuild.step5.colorLabel")}
              className="flex flex-wrap gap-3"
            >
              {availableFinishColors.map((color) => {
                const name = t(`customBuild.finishColors.${color.id}.name`);
                return (
                  <ChoiceButton
                    key={color.id}
                    selected={selections.finishColorId === color.id}
                    onSelect={() => selectFinishColor(color.id)}
                    label={name}
                    className="flex min-w-[7.5rem] items-center gap-3 px-3 py-3 text-[11px] uppercase tracking-[0.16em]"
                  >
                    <span
                      className="size-7 shrink-0 border border-white/20"
                      style={{ backgroundColor: color.swatch }}
                      aria-hidden="true"
                    />
                    {name}
                  </ChoiceButton>
                );
              })}
            </div>
          )}
          <p className="mt-4 text-xs leading-relaxed text-muted">
            {t("customBuild.step5.customColorHint")}
          </p>
          <div className="mt-3">
            <NoteField
              id="custom-color-note"
              label={t("customBuild.step5.customColorLabel")}
              value={selections.customColorNote}
              onChange={setCustomColorNote}
              max={customColorMax}
              rows={3}
              hint={t("customBuild.step5.customColorPlaceholder")}
            />
          </div>
        </Section>
      ) : null}

      <Section title={t("customBuild.step5.inlayLabel")}>
        <OptionChips
          label={t("customBuild.step5.inlayLabel")}
          options={availableInlays}
          selectedId={selections.inlayId}
          onSelect={selectInlay}
          nameKey="customBuild.inlays"
          emptyMessage={contact}
          t={t}
        />
      </Section>

      <Section title={t("customBuild.step5.headstockLabel")}>
        <p className="text-sm leading-relaxed text-muted">
          {headless
            ? t("customBuild.step5.headstockNotApplicable")
            : t("customBuild.step5.headstockUnknown")}
        </p>
      </Section>

      {availableEngravings.length > 0 ? (
        <Section title={t("customBuild.step5.engravingLabel")}>
          <OptionChips
            label={t("customBuild.step5.engravingLabel")}
            options={availableEngravings}
            selectedId={selections.engravingId}
            onSelect={(id) =>
              selectEngraving(id === selections.engravingId ? null : id)
            }
            nameKey="customBuild.engravings"
            emptyMessage={contact}
            t={t}
          />
          <p className="mt-3 text-xs leading-relaxed text-muted">
            {t("customBuild.step5.engravingOptional")}
          </p>
        </Section>
      ) : (
        <Section title={t("customBuild.step5.engravingLabel")}>
          <p className="text-sm leading-relaxed text-muted">
            {t("customBuild.step5.engravingUnknown")}
          </p>
        </Section>
      )}

      <Section title={t("customBuild.step5.requestsLabel")}>
        <p className="mb-3 text-xs leading-relaxed text-muted">
          {t("customBuild.step5.requestsHint")}
        </p>
        <NoteField
          id="special-requests"
          label={t("customBuild.step5.requestsLabel")}
          value={selections.specialRequests}
          onChange={setSpecialRequests}
          max={specialRequestMax}
          rows={5}
          hint={t("customBuild.step5.requestsPlaceholder")}
        />
      </Section>
    </div>
  );
}
