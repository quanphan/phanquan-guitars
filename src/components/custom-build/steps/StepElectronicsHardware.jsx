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
  availablePickupConfigs,
  availablePickupTypes,
  availableBridges,
  availableTuners,
  availableHardwareFinishes,
  availableControlLayouts,
  selectPickupConfig,
  selectPickupType,
  selectBridge,
  selectTuner,
  selectHardwareFinish,
  selectControlLayout,
  setCustomerSuppliedParts,
}) {
  const { t } = useLanguage();
  const customerSupplied = Boolean(selections.customerSuppliedParts);

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

      <label className="mt-10 flex cursor-pointer items-start gap-3 border border-white/10 bg-panel/60 px-4 py-4">
        <input
          type="checkbox"
          checked={customerSupplied}
          onChange={(event) => setCustomerSuppliedParts(event.target.checked)}
          className="mt-1 size-4 shrink-0 accent-gold"
        />
        <span>
          <span className="block text-[11px] uppercase tracking-[0.16em] text-ivory">
            {t("customBuild.step4.customerSuppliedLabel")}
          </span>
          <span className="mt-2 block text-sm leading-relaxed text-muted">
            {t("customBuild.step4.customerSuppliedHint")}
          </span>
        </span>
      </label>

      {customerSupplied ? null : (
        <>
      {availablePickupConfigs.length > 0 ? (
      <Section title={t("customBuild.step4.configLabel")}>
        <OptionChips
          label={t("customBuild.step4.configLabel")}
          options={availablePickupConfigs}
          selectedId={selections.pickupConfigId}
          onSelect={selectPickupConfig}
          nameKey="customBuild.pickupConfigs"
          t={t}
        />
      </Section>
      ) : null}

      {availablePickupTypes.length > 0 ? (
        <Section title={t("customBuild.step4.typeLabel")}>
          <OptionChips
            label={t("customBuild.step4.typeLabel")}
            options={availablePickupTypes}
            selectedId={selections.pickupTypeId}
            onSelect={selectPickupType}
            nameKey="customBuild.pickupTypes"
            t={t}
          />
        </Section>
      ) : null}

      {availableBridges.length > 0 ? (
      <Section title={t("customBuild.step4.bridgeLabel")}>
        <OptionChips
          label={t("customBuild.step4.bridgeLabel")}
          options={availableBridges}
          selectedId={selections.bridgeId}
          onSelect={selectBridge}
          nameKey="customBuild.bridges"
          t={t}
        />
      </Section>
      ) : null}

      {availableTuners.length > 0 ? (
        <Section title={t("customBuild.step4.tunerLabel")}>
          <OptionChips
            label={t("customBuild.step4.tunerLabel")}
            options={availableTuners}
            selectedId={selections.tunerId}
            onSelect={selectTuner}
            nameKey="customBuild.tuners"
            t={t}
          />
        </Section>
      ) : null}

      {availableHardwareFinishes.length > 0 ? (
      <Section title={t("customBuild.step4.hardwareFinishLabel")}>
        <OptionChips
          label={t("customBuild.step4.hardwareFinishLabel")}
          options={availableHardwareFinishes}
          selectedId={selections.hardwareFinishId}
          onSelect={selectHardwareFinish}
          nameKey="customBuild.hardwareFinishes"
          t={t}
        />
      </Section>
      ) : null}

      {availableControlLayouts.length > 0 ? (
        <Section title={t("customBuild.step4.controlsLabel")}>
          <OptionChips
            label={t("customBuild.step4.controlsLabel")}
            options={availableControlLayouts}
            selectedId={selections.controlLayoutId}
            onSelect={selectControlLayout}
            nameKey="customBuild.controls"
            t={t}
          />
        </Section>
      ) : null}
        </>
      )}
    </div>
  );
}
