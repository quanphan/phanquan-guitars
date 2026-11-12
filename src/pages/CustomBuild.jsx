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
import { optionLabel, wizardOptionLabel } from "../data/wizardCatalog.js";
import { usesSecondaryBodyWood, usesSecondaryNeckWood } from "../data/wizardSeriesConstruction.js";
import { isCustomScale, scaleDisplayValue } from "../data/wizardScaleAttributes.js";
import { visibleSummaryRows } from "../data/wizardDisplay.js";
import { clearSubmittedDraftSnapshot } from "../data/customBuildDraft.js";
import { isCustomBuildPath } from "../data/customBuildDraftResume.js";
import { useCustomBuild } from "../hooks/useCustomBuild.js";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import { isMissingRequiredConfig } from "../services/customBuildPayload.js";

export default function CustomBuild() {
  const { t, language } = useLanguage();
  const builder = useCustomBuild();
  const isFirstStep = builder.currentStep === 1;
  const isLastStep = builder.currentStep === builder.totalSteps;

  useEffect(() => {
    return () => {
      clearSubmittedDraftSnapshot();
    };
  }, []);

  useEffect(() => {
    if (builder.submitStatus !== "success") return undefined;
    function onClick(event) {
      const link = event.target instanceof Element ? event.target.closest("a[href]") : null;
      if (!link || !isCustomBuildPath(link.getAttribute("href"))) return;
      event.preventDefault();
      builder.reset();
    }
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [builder.submitStatus, builder.reset]);

  useEffect(() => {
    if (builder.submitStatus !== "invalid-config") return;
    const alert = document.getElementById("custom-build-config-alert");
    if (!alert) return;
    alert.scrollIntoView({ behavior: "smooth", block: "center" });
    alert.focus({ preventScroll: true });
  }, [builder.submitStatus, builder.submitAttempt, builder.currentStep]);

  const summaryRows = visibleSummaryRows([
    {
      key: "instrument",
      label: t("customBuild.summary.instrument"),
      value: wizardOptionLabel(builder.instrumentType, language, t, "types") || null,
    },
    {
      key: "series",
      label: t("customBuild.summary.series"),
      value: wizardOptionLabel(builder.series, language, t, "series") || null,
    },
    {
      key: "shape",
      label: t("customBuild.summary.shape"),
      value: wizardOptionLabel(builder.shape, language, t, "shapes") || null,
    },
    {
      key: "scale",
      label: t("customBuild.summary.scale"),
      value: builder.scale
        ? (isCustomScale(builder.scale)
          ? (builder.selections.customScaleValue || t("customBuild.step1.customScaleLabel"))
          : scaleDisplayValue(builder.scale, builder.selections.customScaleValue) || builder.scale.display)
        : null,
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
      value: builder.radius
        ? optionLabel(builder.radius, language, t) || builder.radius.display || null
        : null,
    },
    {
      key: "bodyPieces",
      label: t("customBuild.summary.bodyPieces"),
      value: builder.bodyConstruction?.translations?.[language]?.name
        || builder.bodyConstruction?.translations?.en?.name
        || builder.bodyConstruction?.name
        || null,
    },
    {
      key: "bodyWood",
      label: t("customBuild.summary.mainBodyWood"),
      value: wizardOptionLabel(builder.bodyWood, language, t, "woods") || null,
    },
    {
      key: "secondaryBodyWood",
      label: t("customBuild.summary.secondaryBodyWood"),
      value: usesSecondaryBodyWood(builder.bodyConstruction)
        ? wizardOptionLabel(builder.secondaryBodyWood, language, t, "woods") || null
        : null,
    },
    {
      key: "topWood",
      label: t("customBuild.summary.topWood"),
      value: wizardOptionLabel(builder.topWood, language, t, "woods") || null,
    },
    {
      key: "neckPieces",
      label: t("customBuild.summary.neckPieces"),
      value: builder.neckPieces?.translations?.[language]?.name
        || builder.neckPieces?.translations?.en?.name
        || builder.neckPieces?.name
        || null,
    },
    {
      key: "neckWood",
      label: t("customBuild.summary.mainNeckWood"),
      value: wizardOptionLabel(builder.neckWood, language, t, "neckWoods") || null,
    },
    {
      key: "secondaryNeckWood",
      label: t("customBuild.summary.secondaryNeckWood"),
      value: usesSecondaryNeckWood(builder.neckPieces)
        ? wizardOptionLabel(builder.secondaryNeckWood, language, t, "neckWoods") || null
        : null,
    },
    {
      key: "neckConstruction",
      label: t("customBuild.summary.neckConstruction"),
      value: wizardOptionLabel(builder.neckConstruction, language, t, "constructions") || null,
    },
    {
      key: "fingerboard",
      label: t("customBuild.summary.fingerboard"),
      value: wizardOptionLabel(builder.fingerboardWood, language, t, "fingerboards") || null,
    },
    {
      key: "neckProfile",
      label: t("customBuild.summary.neckProfile"),
      value: wizardOptionLabel(builder.neckProfile, language, t, "profiles") || null,
    },
    {
      key: "frets",
      label: t("customBuild.summary.frets"),
      value: wizardOptionLabel(builder.fretSpec, language, t, "frets") || null,
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
    ...(builder.selections.customerSuppliedParts
      ? [
          {
            key: "customerSuppliedParts",
            label: t("customBuild.summary.customerSuppliedParts"),
            value: t("customBuild.step4.customerSuppliedSummary"),
          },
        ]
      : [
          {
            key: "pickupConfig",
            label: t("customBuild.summary.pickupConfig"),
            value: wizardOptionLabel(builder.pickupConfig, language, t, "pickupConfigs") || null,
          },
          {
            key: "pickupType",
            label: t("customBuild.summary.pickupType"),
            value: wizardOptionLabel(builder.pickupType, language, t, "pickupTypes") || null,
          },
          {
            key: "bridge",
            label: t("customBuild.summary.bridge"),
            value: wizardOptionLabel(builder.bridge, language, t, "bridges") || null,
          },
          {
            key: "tuners",
            label: t("customBuild.summary.tuners"),
            value: wizardOptionLabel(builder.tuner, language, t, "tuners") || null,
          },
          {
            key: "hardwareFinish",
            label: t("customBuild.summary.hardwareFinish"),
            value: wizardOptionLabel(builder.hardwareFinish, language, t, "hardwareFinishes") || null,
          },
          {
            key: "controls",
            label: t("customBuild.summary.controls"),
            value: wizardOptionLabel(builder.controlLayout, language, t, "controls") || null,
          },
        ]),
    {
      key: "finishType",
      label: t("customBuild.summary.finishType"),
      value: wizardOptionLabel(builder.finishType, language, t, "finishTypes") || null,
    },
    {
      key: "finishColor",
      label: t("customBuild.summary.finishColor"),
      value: wizardOptionLabel(builder.finishColor, language, t, "finishColors") || null,
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
      value: wizardOptionLabel(builder.inlay, language, t, "inlays") || null,
    },
    {
      key: "engraving",
      label: t("customBuild.summary.engraving"),
      value: wizardOptionLabel(builder.engraving, language, t, "engravings") || null,
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
  ]);

  return (
    <div className="page-end min-w-0">
      <PageHeader
        eyebrow={t("customBuild.header.eyebrow")}
        title={t("customBuild.header.heading")}
        description={t("customBuild.header.description")}
      />

      <div className="page-follow mx-auto w-full min-w-0 max-w-7xl px-6 lg:px-10">
        {builder.catalogSource === "loading" ? (
          <p className="text-sm text-muted" role="status">
            {t("customBuild.catalogLoading")}
          </p>
        ) : null}
        {builder.catalogSource === "error" ? (
          <div className="border border-gold/40 bg-gold/10 px-4 py-3" role="alert">
            <p className="text-sm text-ivory">{t("customBuild.catalogError")}</p>
            <button
              type="button"
              className="mt-3 text-[11px] uppercase tracking-[0.18em] text-gold"
              onClick={builder.reloadCatalog}
            >
              {t("customBuild.catalogRetry")}
            </button>
          </div>
        ) : null}

        {builder.catalogSource === "live" ? (
        <>
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
            {isMissingRequiredConfig(builder.submitIssues, builder.configIssueStep)
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
                instrumentTypes={builder.instrumentTypes}
                availableSeries={builder.availableSeries}
                availableShapes={builder.availableShapes}
                availableScales={builder.availableScales}
                availableStringCounts={builder.availableStringCounts}
                availableRadii={builder.availableRadii}
                selectInstrumentType={builder.selectInstrumentType}
                selectSeries={builder.selectSeries}
                selectShape={builder.selectShape}
                selectScale={builder.selectScale}
                setCustomScaleValue={builder.setCustomScaleValue}
                selectStringCount={builder.selectStringCount}
                selectRadius={builder.selectRadius}
              />
            ) : builder.currentStep === 2 ? (
              <StepBodyTop
                selections={builder.selections}
                availableBodyWoods={builder.availableBodyWoods}
                availableBodyConstructions={builder.availableBodyConstructions}
                availableTopWoods={builder.availableTopWoods}
                topApplicable={builder.topApplicable}
                selectBodyConstruction={builder.selectBodyConstruction}
                selectBodyWood={builder.selectBodyWood}
                selectSecondaryBodyWood={builder.selectSecondaryBodyWood}
                selectTopWood={builder.selectTopWood}
                missingFields={builder.stepTwoAttempted ? builder.stepTwoMissing : []}
              />
            ) : builder.currentStep === 3 ? (
              <StepNeckFingerboard
                selections={builder.selections}
                availableNeckWoods={builder.availableNeckWoods}
                availableNeckPieces={builder.availableNeckPieces}
                availableNeckConstructions={builder.availableNeckConstructions}
                availableFingerboardWoods={builder.availableFingerboardWoods}
                availableNeckProfiles={builder.availableNeckProfiles}
                availableFretSpecs={builder.availableFretSpecs}
                inheritedFretCount={builder.inheritedFretCount}
                selectNeckPieces={builder.selectNeckPieces}
                selectNeckWood={builder.selectNeckWood}
                selectSecondaryNeckWood={builder.selectSecondaryNeckWood}
                selectNeckConstruction={builder.selectNeckConstruction}
                selectFingerboardWood={builder.selectFingerboardWood}
                selectNeckProfile={builder.selectNeckProfile}
                selectFretSpec={builder.selectFretSpec}
                selectFretCount={builder.selectFretCount}
                missingFields={builder.stepThreeAttempted ? builder.stepThreeMissing : []}
              />
            ) : builder.currentStep === 4 ? (
              <StepElectronicsHardware
                selections={builder.selections}
                availablePickupConfigs={builder.availablePickupConfigs}
                availablePickupTypes={builder.availablePickupTypes}
                availableBridges={builder.availableBridges}
                availableTuners={builder.availableTuners}
                availableHardwareFinishes={builder.availableHardwareFinishes}
                availableControlLayouts={builder.availableControlLayouts}
                selectPickupConfig={builder.selectPickupConfig}
                selectPickupType={builder.selectPickupType}
                selectBridge={builder.selectBridge}
                selectTuner={builder.selectTuner}
                selectHardwareFinish={builder.selectHardwareFinish}
                selectControlLayout={builder.selectControlLayout}
                setCustomerSuppliedParts={builder.setCustomerSuppliedParts}
              />
            ) : builder.currentStep === 5 ? (
              <StepFinishDetails
                selections={builder.selections}
                finishType={builder.finishType}
                availableFinishTypes={builder.availableFinishTypes}
                availableFinishColors={builder.availableFinishColors}
                availableInlays={builder.availableInlays}
                availableEngravings={builder.availableEngravings}
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
                setReferenceImages={builder.setReferenceImages}
              />
            )}

            <StepNav
              backTo={isFirstStep ? "/guitars" : undefined}
              onBack={isFirstStep ? undefined : builder.goBack}
              onContinue={builder.goNext}
              continueDisabled={builder.currentStep === 2 || builder.currentStep === 3 ? false : !builder.canContinue}
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
        </>
        ) : null}
      </div>
    </div>
  );
}
