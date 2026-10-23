import { useLanguage } from "../../../i18n/LanguageContext.jsx";
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

export default function StepElectronicsHardware({
  selections,
  pickupConfig,
  availablePickupConfigs,
  availablePickupTypes,
  availableBridges,
  availableTuners,
  availableHardwareFinishes,
  availableControlLayouts,
  tunersApplicable,
  selectPickupConfig,
  selectPickupType,
  selectBridge,
  selectTuner,
  selectHardwareFinish,
  selectControlLayout,
}) {
  const { t } = useLanguage();
  const contact = t("customBuild.step4.contact");

  return (
    <div>
      <h2 className="font-display text-3xl tracking-wide text-ivory sm:text-4xl">
        {t("customBuild.step4.heading")}
      </h2>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
        {t("customBuild.step4.description")}
      </p>
      <p className="mt-4 max-w-2xl text-xs leading-relaxed text-muted">
        {t("customBuild.provisional")}
      </p>

      <Section title={t("customBuild.step4.configLabel")}>
        <OptionChips
          label={t("customBuild.step4.configLabel")}
          options={availablePickupConfigs}
          selectedId={selections.pickupConfigId}
          onSelect={selectPickupConfig}
          nameKey="customBuild.pickupConfigs"
          emptyMessage={contact}
          t={t}
        />
      </Section>

      {selections.pickupConfigId ? (
        <Section title={t("customBuild.step4.typeLabel")}>
          <OptionChips
            label={t("customBuild.step4.typeLabel")}
            options={availablePickupTypes}
            selectedId={selections.pickupTypeId}
            onSelect={selectPickupType}
            nameKey="customBuild.pickupTypes"
            emptyMessage={contact}
            t={t}
          />
        </Section>
      ) : null}

      <Section title={t("customBuild.step4.brandLabel")}>
        <p className="text-sm leading-relaxed text-muted">
          {t("customBuild.step4.brandUnknown")}
        </p>
      </Section>

      {pickupConfig?.positions?.length ? (
        <Section title={t("customBuild.step4.positionsLabel")}>
          <p className="border border-white/10 bg-panel/60 px-4 py-3 text-sm text-ivory">
            {pickupConfig.positions
              .map((position) => t(`customBuild.step4.positions.${position}`))
              .join(" · ")}
          </p>
        </Section>
      ) : null}

      <Section title={t("customBuild.step4.bridgeLabel")}>
        <OptionChips
          label={t("customBuild.step4.bridgeLabel")}
          options={availableBridges}
          selectedId={selections.bridgeId}
          onSelect={selectBridge}
          nameKey="customBuild.bridges"
          emptyMessage={contact}
          t={t}
        />
      </Section>

      <Section title={t("customBuild.step4.tunerLabel")}>
        {!tunersApplicable ? (
          <p className="text-sm leading-relaxed text-muted">
            {t("customBuild.step4.tunersNotApplicable")}
          </p>
        ) : (
          <OptionChips
            label={t("customBuild.step4.tunerLabel")}
            options={availableTuners}
            selectedId={selections.tunerId}
            onSelect={selectTuner}
            nameKey="customBuild.tuners"
            emptyMessage={contact}
            t={t}
          />
        )}
      </Section>

      <Section title={t("customBuild.step4.hardwareFinishLabel")}>
        <OptionChips
          label={t("customBuild.step4.hardwareFinishLabel")}
          options={availableHardwareFinishes}
          selectedId={selections.hardwareFinishId}
          onSelect={selectHardwareFinish}
          nameKey="customBuild.hardwareFinishes"
          emptyMessage={contact}
          t={t}
        />
      </Section>

      {selections.pickupConfigId ? (
        <Section title={t("customBuild.step4.controlsLabel")}>
          <OptionChips
            label={t("customBuild.step4.controlsLabel")}
            options={availableControlLayouts}
            selectedId={selections.controlLayoutId}
            onSelect={selectControlLayout}
            nameKey="customBuild.controls"
            emptyMessage={contact}
            t={t}
          />
        </Section>
      ) : null}
    </div>
  );
}
