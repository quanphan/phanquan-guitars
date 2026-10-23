import { useEffect } from "react";
import BuilderProgress from "../components/custom-build/BuilderProgress.jsx";
import SelectionSummary from "../components/custom-build/SelectionSummary.jsx";
import StepBodyTop from "../components/custom-build/steps/StepBodyTop.jsx";
import StepElectronicsHardware from "../components/custom-build/steps/StepElectronicsHardware.jsx";
import StepFinishDetails from "../components/custom-build/steps/StepFinishDetails.jsx";
import StepInstrumentShape from "../components/custom-build/steps/StepInstrumentShape.jsx";
import StepNeckFingerboard from "../components/custom-build/steps/StepNeckFingerboard.jsx";
import StepReviewSubmit from "../components/custom-build/steps/StepReviewSubmit.jsx";
import StepNav from "../components/custom-build/StepNav.jsx";
import PageHeader from "../components/PageHeader.jsx";
import { useCustomBuild } from "../hooks/useCustomBuild.js";
import { useLanguage } from "../i18n/LanguageContext.jsx";

export default function CustomBuild() {
  const { t, language } = useLanguage();
  const builder = useCustomBuild();
  const isFirstStep = builder.currentStep === 1;
  const isLastStep = builder.currentStep === builder.totalSteps;

  useEffect(() => {
    if (builder.submitStatus !== "invalid-config") return;
    const alert = document.getElementById("custom-build-config-alert");
    if (!alert) return;
    alert.scrollIntoView({ behavior: "smooth", block: "center" });
    alert.focus({ preventScroll: true });
  }, [builder.submitStatus, builder.submitAttempt, builder.currentStep]);

  const summaryRows = [
    {
      key: "instrument",
      label: t("customBuild.summary.instrument"),
      value: builder.instrumentType
        ? t(`customBuild.types.${builder.instrumentType.id}`)
        : null,
    },
    {
      key: "series",
      label: t("customBuild.summary.series"),
      value: builder.series
        ? t(`customBuild.series.${builder.series.id}.name`)
        : null,
    },
    {
      key: "shape",
      label: t("customBuild.summary.shape"),
      value: builder.shape
        ? t(`customBuild.shapes.${builder.shape.id}.name`)
        : null,
    },
    {
      key: "scale",
      label: t("customBuild.summary.scale"),
      value: builder.scale?.display ?? null,
    },
    {
      key: "strings",
      label: t("customBuild.summary.strings"),
      value:
        builder.selections.stringCount != null
          ? t("customBuild.strings.count").replace(
              "{count}",
              String(builder.selections.stringCount),
            )
          : null,
    },
    {
      key: "radius",
      label: t("customBuild.summary.radius"),
      value: builder.radius?.display ?? null,
    },
    {
      key: "bodyWood",
      label: t("customBuild.summary.bodyWood"),
      value: builder.bodyWood
        ? t(`customBuild.woods.${builder.bodyWood.id}.name`)
        : null,
    },
    {
      key: "topWood",
      label: t("customBuild.summary.topWood"),
      value: builder.topApplicable
        ? builder.topWood
          ? t(`customBuild.woods.${builder.topWood.id}.name`)
          : null
        : builder.bodyWood
          ? t("customBuild.step2.topNotApplicable")
          : null,
    },
    {
      key: "neckWood",
      label: t("customBuild.summary.neckWood"),
      value: builder.neckWood
        ? t(`customBuild.neckWoods.${builder.neckWood.id}.name`)
        : null,
    },
    {
      key: "neckConstruction",
      label: t("customBuild.summary.neckConstruction"),
      value: builder.neckConstruction
        ? t(`customBuild.constructions.${builder.neckConstruction.id}.name`)
        : null,
    },
    {
      key: "fingerboard",
      label: t("customBuild.summary.fingerboard"),
      value: builder.fingerboardWood
        ? t(`customBuild.fingerboards.${builder.fingerboardWood.id}.name`)
        : null,
    },
    {
      key: "neckProfile",
      label: t("customBuild.summary.neckProfile"),
      value: builder.neckProfile
        ? t(`customBuild.profiles.${builder.neckProfile.id}.name`)
        : null,
    },
    {
      key: "frets",
      label: t("customBuild.summary.frets"),
      value: builder.fretSpec
        ? t(`customBuild.frets.${builder.fretSpec.id}.name`)
        : null,
    },
    {
      key: "fretCount",
      label: t("customBuild.summary.fretCount"),
      value:
        builder.inheritedFretCount != null
          ? t("customBuild.step3.fretCountValue").replace(
              "{count}",
              String(builder.inheritedFretCount),
            )
          : null,
    },
    {
      key: "pickupConfig",
      label: t("customBuild.summary.pickupConfig"),
      value: builder.pickupConfig
        ? t(`customBuild.pickupConfigs.${builder.pickupConfig.id}.name`)
        : null,
    },
    {
      key: "pickupType",
      label: t("customBuild.summary.pickupType"),
      value: builder.pickupType
        ? t(`customBuild.pickupTypes.${builder.pickupType.id}.name`)
        : null,
    },
    {
      key: "bridge",
      label: t("customBuild.summary.bridge"),
      value: builder.bridge
        ? t(`customBuild.bridges.${builder.bridge.id}.name`)
        : null,
    },
    {
      key: "tuners",
      label: t("customBuild.summary.tuners"),
      value: !builder.tunersApplicable
        ? t("customBuild.step4.tunersNotApplicable")
        : builder.tuner
          ? t(`customBuild.tuners.${builder.tuner.id}.name`)
          : null,
    },
    {
      key: "hardwareFinish",
      label: t("customBuild.summary.hardwareFinish"),
      value: builder.hardwareFinish
        ? t(`customBuild.hardwareFinishes.${builder.hardwareFinish.id}.name`)
        : null,
    },
    {
      key: "controls",
      label: t("customBuild.summary.controls"),
      value: builder.controlLayout
        ? t(`customBuild.controls.${builder.controlLayout.id}.name`)
        : null,
    },
    {
      key: "finishType",
      label: t("customBuild.summary.finishType"),
      value: builder.finishType
        ? t(`customBuild.finishTypes.${builder.finishType.id}.name`)
        : null,
    },
    {
      key: "finishColor",
      label: t("customBuild.summary.finishColor"),
      value: builder.finishColor
        ? t(`customBuild.finishColors.${builder.finishColor.id}.name`)
        : null,
    },
    {
      key: "customColor",
      label: t("customBuild.summary.customColor"),
      value: builder.selections.customColorNote?.trim()
        ? builder.selections.customColorNote.trim()
        : null,
    },
    {
      key: "inlay",
      label: t("customBuild.summary.inlay"),
      value: builder.inlay
        ? t(`customBuild.inlays.${builder.inlay.id}.name`)
        : null,
    },
    {
      key: "engraving",
      label: t("customBuild.summary.engraving"),
      value: builder.engraving
        ? t(`customBuild.engravings.${builder.engraving.id}.name`)
        : null,
    },
    {
      key: "specialRequests",
      label: t("customBuild.summary.specialRequests"),
      value: builder.selections.specialRequests?.trim()
        ? builder.selections.specialRequests.trim()
        : null,
    },
    {
      key: "step",
      label: t("customBuild.summary.step"),
      value: `${builder.currentStep} / ${builder.totalSteps} · ${t(
        `customBuild.steps.${builder.currentStepMeta.key}`,
      )}`,
    },
  ];

  return (
    <div className="pb-24 lg:pb-32">
      <PageHeader
        eyebrow={t("customBuild.header.eyebrow")}
        title={t("customBuild.header.heading")}
        description={t("customBuild.header.description")}
      />

      <div className="mx-auto mt-10 max-w-7xl px-6 lg:px-10">
        <BuilderProgress
          steps={builder.steps}
          currentStep={builder.currentStep}
          totalSteps={builder.totalSteps}
          t={t}
        />

        {builder.submitStatus === "invalid-config" ? (
          <p
            id="custom-build-config-alert"
            className="mt-8 border border-gold/40 bg-gold/10 px-4 py-3 text-sm text-ivory"
            role="alert"
            tabIndex={-1}
          >
            {builder.configIssueStep
              ? t("customBuild.step6.incompleteConfig").replace(
                  "{step}",
                  String(builder.configIssueStep),
                )
              : t("customBuild.step6.invalidConfig")}
          </p>
        ) : null}

        <div className="mt-12 grid gap-10 lg:grid-cols-[minmax(0,1.7fr)_minmax(16rem,0.9fr)] lg:items-start">
          <div>
            {builder.currentStep === 1 ? (
              <StepInstrumentShape
                selections={builder.selections}
                availableSeries={builder.availableSeries}
                availableShapes={builder.availableShapes}
                availableScales={builder.availableScales}
                availableStringCounts={builder.availableStringCounts}
                availableRadii={builder.availableRadii}
                selectInstrumentType={builder.selectInstrumentType}
                selectSeries={builder.selectSeries}
                selectShape={builder.selectShape}
                selectScale={builder.selectScale}
                selectStringCount={builder.selectStringCount}
                selectRadius={builder.selectRadius}
              />
            ) : builder.currentStep === 2 ? (
              <StepBodyTop
                selections={builder.selections}
                availableBodyWoods={builder.availableBodyWoods}
                availableTopWoods={builder.availableTopWoods}
                topApplicable={builder.topApplicable}
                selectBodyWood={builder.selectBodyWood}
                selectTopWood={builder.selectTopWood}
              />
            ) : builder.currentStep === 3 ? (
              <StepNeckFingerboard
                selections={builder.selections}
                availableNeckWoods={builder.availableNeckWoods}
                availableNeckConstructions={builder.availableNeckConstructions}
                availableFingerboardWoods={builder.availableFingerboardWoods}
                availableNeckProfiles={builder.availableNeckProfiles}
                availableFretSpecs={builder.availableFretSpecs}
                inheritedFretCount={builder.inheritedFretCount}
                selectNeckWood={builder.selectNeckWood}
                selectNeckConstruction={builder.selectNeckConstruction}
                selectFingerboardWood={builder.selectFingerboardWood}
                selectNeckProfile={builder.selectNeckProfile}
                selectFretSpec={builder.selectFretSpec}
              />
            ) : builder.currentStep === 4 ? (
              <StepElectronicsHardware
                selections={builder.selections}
                pickupConfig={builder.pickupConfig}
                availablePickupConfigs={builder.availablePickupConfigs}
                availablePickupTypes={builder.availablePickupTypes}
                availableBridges={builder.availableBridges}
                availableTuners={builder.availableTuners}
                availableHardwareFinishes={builder.availableHardwareFinishes}
                availableControlLayouts={builder.availableControlLayouts}
                tunersApplicable={builder.tunersApplicable}
                selectPickupConfig={builder.selectPickupConfig}
                selectPickupType={builder.selectPickupType}
                selectBridge={builder.selectBridge}
                selectTuner={builder.selectTuner}
                selectHardwareFinish={builder.selectHardwareFinish}
                selectControlLayout={builder.selectControlLayout}
              />
            ) : builder.currentStep === 5 ? (
              <StepFinishDetails
                selections={builder.selections}
                finishType={builder.finishType}
                availableFinishTypes={builder.availableFinishTypes}
                availableFinishColors={builder.availableFinishColors}
                availableInlays={builder.availableInlays}
                availableEngravings={builder.availableEngravings}
                headless={builder.headless}
                customColorMax={builder.customColorMax}
                specialRequestMax={builder.specialRequestMax}
                selectFinishType={builder.selectFinishType}
                selectFinishColor={builder.selectFinishColor}
                setCustomColorNote={builder.setCustomColorNote}
                selectInlay={builder.selectInlay}
                selectEngraving={builder.selectEngraving}
                setSpecialRequests={builder.setSpecialRequests}
              />
            ) : (
              <StepReviewSubmit
                builder={builder}
                contactErrors={builder.contactErrors}
                submitIssues={builder.submitIssues}
                configIssueStep={builder.configIssueStep}
                submitStatus={builder.submitStatus}
                inquiryReference={builder.inquiryReference}
                inquiryConfigured={builder.inquiryConfigured}
                onEditSection={builder.goToStep}
                onSubmit={() => {
                  void builder.submitInquiry(language);
                }}
                submitAttempt={builder.submitAttempt}
                setContactName={builder.setContactName}
                setContactEmail={builder.setContactEmail}
                setContactCountry={builder.setContactCountry}
                setContactPhone={builder.setContactPhone}
                setContactMessage={builder.setContactMessage}
                setAcknowledgement={builder.setAcknowledgement}
              />
            )}

            <StepNav
              backTo={isFirstStep ? "/guitars" : undefined}
              onBack={isFirstStep ? undefined : builder.goBack}
              onContinue={builder.goNext}
              continueDisabled={!builder.canContinue}
              continueHidden={isLastStep}
              backDisabled={
                builder.submitStatus === "submitting" ||
                builder.submitStatus === "success"
              }
              backLabel={t("customBuild.nav.back")}
              continueLabel={t("customBuild.nav.continue")}
            />
          </div>

          <SelectionSummary
            rows={summaryRows}
            onReset={builder.reset}
            resetDisabled={builder.submitStatus === "submitting"}
            t={t}
          />
        </div>
      </div>
    </div>
  );
}
