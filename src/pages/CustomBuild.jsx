import { useEffect } from "react";
import WizardLivePanel from "../components/custom-build/WizardLivePanel.jsx";
import StepInstrumentShape from "../components/custom-build/steps/StepInstrumentShape.jsx";
import StepReviewSubmit from "../components/custom-build/steps/StepReviewSubmit.jsx";
import WizardContinuousConfig from "../components/custom-build/WizardContinuousConfig.jsx";
import StepNav from "../components/custom-build/StepNav.jsx";
import PageHeader from "../components/PageHeader.jsx";
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

  const showLivePanel = builder.currentStep > 1;
  function stepNav() {
    if (builder.catalogSource !== "live") return null;
    return (
      <StepNav
        backTo={isFirstStep ? "/guitars" : undefined}
        onBack={isFirstStep ? undefined : builder.goBack}
        onContinue={builder.goNext}
        onReset={builder.reset}
        continueDisabled={
          builder.currentStep > 1 && builder.currentStep < builder.totalSteps
            ? false
            : !builder.canContinue
        }
        continueHidden={isLastStep}
        backDisabled={
          builder.submitStatus === "submitting" || builder.submitStatus === "success"
        }
        resetDisabled={builder.submitStatus === "submitting"}
        backLabel={t("customBuild.nav.back")}
        continueLabel={t("customBuild.nav.continue")}
        resetLabel={t("customBuild.reset")}
      />
    );
  }
  function livePanel(className, slot = "any") {
    if (!showLivePanel) return null;
    return (
      <WizardLivePanel
        builder={builder}
        t={t}
        language={language}
        className={className}
        slot={slot}
      />
    );
  }

  const configHeading = (
    <p className="pt-4 pb-3 text-[13px] uppercase tracking-[0.2em] text-gold">
      {t("customBuild.summary.title")}
    </p>
  );

  return (
    <div className="page-end relative min-w-0">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-x-0 top-0 z-[45] h-[9.25rem] bg-charcoal md:h-20"
      />
      <div className="relative z-0 mx-auto w-full min-w-0 max-w-7xl px-6 lg:px-10">
        {builder.catalogSource === "loading" ? (
          <p className="page-start text-sm text-muted" role="status">
            {t("customBuild.catalogLoading")}
          </p>
        ) : null}
        {builder.catalogSource === "error" ? (
          <div className="page-start border border-gold/40 bg-gold/10 px-4 py-3" role="alert">
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

        <div
          className={`grid gap-8 lg:gap-10 ${
            showLivePanel ? "lg:grid-cols-[minmax(0,1.55fr)_minmax(16rem,0.85fr)]" : ""
          }`}
        >
          <div className="min-w-0">
            <PageHeader
              className="page-start"
              eyebrow={t("customBuild.header.eyebrow")}
              title={t("customBuild.header.heading")}
            />
            {livePanel("mt-6 lg:hidden", "mobile")}
            {builder.catalogSource === "live" ? (
              <>
                <div className="sticky z-40 bg-charcoal max-lg:top-[9.25rem] lg:top-20">
                  <div className="pt-5 lg:pt-6">{stepNav()}</div>
                </div>
                {configHeading}
                <div className="relative z-0">
                  {builder.currentStep === 1 ? (
                    <StepInstrumentShape
                      selections={builder.selections}
                      instrumentTypes={builder.instrumentTypes}
                      availableSeries={builder.availableSeries}
                      availableShapes={builder.availableShapes}
                      selectInstrumentType={builder.selectInstrumentType}
                      selectSeries={builder.selectSeries}
                      selectShape={builder.selectShape}
                    />
                  ) : builder.currentStep > 1 && builder.currentStep < builder.totalSteps ? (
                    <WizardContinuousConfig
                      builder={builder}
                      t={t}
                      language={language}
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
                </div>
              </>
            ) : null}
          </div>

          {showLivePanel ? (
            <div className="hidden lg:block">
              <aside className="fixed top-20 right-[max(2.5rem,calc((100vw-80rem)/2+2.5rem))] z-30 w-[calc((min(80rem,100vw)-7.5rem)*0.35417)] max-w-[26rem] bg-charcoal pt-5">
                {livePanel("", "desktop")}
              </aside>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
