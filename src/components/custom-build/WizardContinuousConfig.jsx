import { useEffect, useMemo, useState } from "react";
import { mediaUrl } from "../../config/api.js";
import { fieldClass } from "../auth/Field.jsx";
import FitImage from "../FitImage.jsx";
import { choiceImageSrc } from "../../data/wizardCatalog.js";
import {
  CONFIG_GROUP_TARGET_ID,
  continuousConfigSections,
  firstIncompleteGroupKey,
} from "../../data/wizardContinuous.js";
import { applyLiveConfigSelection, buildLiveConfigGroups } from "../../data/wizardLiveConfig.js";
import {
  isCustomScale,
  isValidCustomScaleValue,
  isValidFretCountSelection,
} from "../../data/wizardScaleAttributes.js";
import ChoiceButton from "./ChoiceButton.jsx";

function Chevron({ open }) {
  return (
    <svg
      viewBox="0 0 20 20"
      aria-hidden="true"
      className={`size-4 shrink-0 text-gold transition-transform duration-200 ${open ? "rotate-180" : ""}`}
    >
      <path fill="currentColor" d="M5.2 7.4a.9.9 0 0 1 1.27-.05L10 10.7l3.53-3.35a.9.9 0 0 1 1.22 1.32l-4.14 3.93a.9.9 0 0 1-1.22 0L5.25 8.67a.9.9 0 0 1-.05-1.27Z" />
    </svg>
  );
}

function OptionGrid({ group, onSelect, t }) {
  const hasImage = group.items?.some((item) => item.image);
  const hasSwatch = group.items?.some((item) => item.swatch);
  return (
    <div className={hasImage ? "grid gap-2 sm:grid-cols-2" : "flex flex-wrap gap-2"}>
      {group.items.map((item) => (
        <ChoiceButton
          key={item.id}
          selected={item.selected}
          onSelect={() => {
            if (!group.selectable) return;
            if (item.value == null || item.value === "" || typeof item.value === "object") return;
            onSelect(group.selectKey, item.value);
          }}
          label={item.label}
          className={`flex min-w-0 max-w-full flex-col overflow-hidden p-0 text-[11px] uppercase tracking-[0.12em] ${
            hasImage ? "" : "px-3 py-2"
          }`}
        >
          {hasImage ? (
            <>
              {item.image ? (
                <FitImage
                  src={choiceImageSrc(item.image, mediaUrl)}
                  alt=""
                  fit="cover"
                  frameClassName="aspect-[4/3] w-full"
                  className="max-h-none max-w-none"
                />
              ) : (
                <div
                  className="flex aspect-[4/3] w-full items-center justify-center bg-ink text-[10px] uppercase tracking-[0.18em] text-muted"
                  aria-hidden="true"
                >
                  {t("customBuild.step2.noImage")}
                </div>
              )}
              <span className="px-3 py-2 text-current">{item.label}</span>
            </>
          ) : hasSwatch ? (
            <span className="flex items-center gap-2 px-3 py-2">
              <span
                className="size-6 shrink-0 border border-white/20"
                style={item.swatch ? { backgroundColor: item.swatch } : undefined}
                aria-hidden="true"
              />
              {item.label}
            </span>
          ) : (
            item.label
          )}
        </ChoiceButton>
      ))}
    </div>
  );
}

function GroupExtras({ group, builder, t }) {
  const selections = builder.selections || {};
  if (group.key === "scale" && isCustomScale(builder.scale)) {
    return (
      <label className="mt-3 block text-[11px] uppercase tracking-[0.18em] text-gold">
        {t("customBuild.step1.customScaleInputLabel")}
        <input
          value={selections.customScaleValue || ""}
          onChange={(event) => builder.setCustomScaleValue(event.target.value)}
          placeholder={t("customBuild.step1.customScalePlaceholder")}
          className={fieldClass}
          aria-invalid={!isValidCustomScaleValue(selections.customScaleValue)}
        />
      </label>
    );
  }
  if (group.key === "fretCount") {
    const valid = isValidFretCountSelection(selections.fretCount);
    return (
      <label className="block">
        <input
          id="fret-count"
          type="text"
          inputMode="numeric"
          autoComplete="off"
          value={selections.fretCount ?? ""}
          onChange={(event) => builder.selectFretCount(event.target.value)}
          className={valid ? fieldClass : fieldClass.replace("border-white/10", "border-gold")}
          aria-label={t("customBuild.step3.fretCountLabel")}
          aria-invalid={!valid}
        />
        <span className="mt-2 block text-[10px] font-normal normal-case tracking-normal text-muted">
          {t("customBuild.step3.fretCountInputHelp")}
        </span>
        {valid ? null : (
          <span className="mt-2 block text-xs text-gold" role="alert">
            {t("customBuild.step3.fretCountError")}
          </span>
        )}
      </label>
    );
  }
  if (group.key === "customColor") {
    return (
      <textarea
        id="custom-color-note"
        value={selections.customColorNote || ""}
        onChange={(event) => builder.setCustomColorNote(event.target.value)}
        maxLength={builder.customColorMax}
        rows={3}
        className={`${fieldClass} resize-y`}
        placeholder={t("customBuild.step5.customColorPlaceholder")}
      />
    );
  }
  if (group.key === "specialRequests") {
    return (
      <textarea
        id="special-requests"
        value={selections.specialRequests || ""}
        onChange={(event) => builder.setSpecialRequests(event.target.value)}
        maxLength={builder.specialRequestMax}
        rows={4}
        className={`${fieldClass} resize-y`}
        placeholder={t("customBuild.step5.requestsPlaceholder")}
      />
    );
  }
  return null;
}

function ConfigAccordion({ group, expanded, invalid, onToggle, onCollapse, builder, t }) {
  const panelId = `wizard-config-panel-${group.key}`;
  const targetId = CONFIG_GROUP_TARGET_ID[group.key] || `wizard-config-${group.key}`;
  return (
    <div
      id={targetId}
      tabIndex={-1}
      className={`border-b border-white/10 last:border-b-0 ${invalid ? "ring-1 ring-gold/70" : ""}`}
    >
      <button
        type="button"
        className="flex w-full items-start justify-between gap-3 py-3 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
        aria-expanded={expanded}
        aria-controls={panelId}
        onClick={onToggle}
      >
        <span className="min-w-0">
          <span className="block text-[11px] uppercase tracking-[0.16em] text-muted">{group.label}</span>
          <span className={`mt-1 block text-sm ${group.filled ? "text-ivory" : "text-muted"}`}>{group.value}</span>
        </span>
        <span className="mt-1" title={expanded ? t("customBuild.summary.collapse") : t("customBuild.summary.expand")}>
          <Chevron open={expanded} />
        </span>
      </button>
      <div
        id={panelId}
        className={`grid transition-[grid-template-rows] duration-200 ease-out ${expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
      >
        <div className={`min-h-0 overflow-hidden ${expanded ? "" : "pointer-events-none"}`} aria-hidden={!expanded}>
          <div className="pb-4">
            {group.items?.length && group.selectable ? (
              <OptionGrid
                group={group}
                onSelect={(selectKey, value) => {
                  const applied = applyLiveConfigSelection(builder, selectKey, value);
                  if (applied) onCollapse?.();
                }}
                t={t}
              />
            ) : null}
            <GroupExtras group={group} builder={builder} t={t} />
            {!group.items?.length && group.selectable === false && !["fretCount", "customColor", "specialRequests"].includes(group.key) ? (
              <p className="text-xs text-muted">{group.filled ? group.value : t("customBuild.summary.empty")}</p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function WizardContinuousConfig({ builder, t, language }) {
  const allGroups = useMemo(() => buildLiveConfigGroups(builder, t, language), [builder, t, language]);
  const sections = useMemo(
    () => continuousConfigSections(allGroups, builder.steps || []),
    [allGroups, builder.steps],
  );
  const groups = useMemo(
    () => sections.filter((section) => section.type === "group").map((section) => section.group),
    [sections],
  );
  const [expanded, setExpanded] = useState(() => new Set());

  const missingKeys = useMemo(() => {
    const keys = new Set();
    if (builder.stepTwoAttempted) {
      (builder.stepTwoMissing || []).forEach((item) => keys.add(item.key));
    }
    if (builder.stepThreeAttempted) {
      (builder.stepThreeMissing || []).forEach((item) => keys.add(item.key));
    }
    return keys;
  }, [builder.stepTwoAttempted, builder.stepTwoMissing, builder.stepThreeAttempted, builder.stepThreeMissing]);

  const incompleteKey = firstIncompleteGroupKey(builder);

  useEffect(() => {
    setExpanded((current) => {
      if (current.size) return current;
      const first = incompleteKey || groups[0]?.key;
      return first ? new Set([first]) : current;
    });
  }, [groups, incompleteKey]);

  function toggle(key) {
    setExpanded((previous) => {
      const next = new Set(previous);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function collapseGroup(key) {
    setExpanded((previous) => {
      if (!previous.has(key)) return previous;
      const next = new Set(previous);
      next.delete(key);
      return next;
    });
  }

  const fieldInvalid = (group) => {
    const selectKey = group.selectKey;
    return Boolean(selectKey && missingKeys.has(selectKey));
  };

  return (
    <div>
      {(builder.stepTwoAttempted && builder.stepTwoMissing?.length) || (builder.stepThreeAttempted && builder.stepThreeMissing?.length) ? (
        <p className="mb-6 border border-gold/40 bg-gold/10 px-4 py-3 text-sm text-ivory" role="alert">
          {t("customBuild.continuous.incomplete")}
        </p>
      ) : null}

      <div>
        {sections.map((section) => {
          if (section.type === "heading") {
            return (
              <div key={`heading-${section.step}`} className="pt-5 first:pt-0">
                <p className="text-[11px] uppercase tracking-[0.22em] text-gold">
                  {t(`customBuild.steps.${section.key}`)}
                </p>
                {section.step === 4 ? (
                  <label className="mt-4 mb-2 flex cursor-pointer items-start gap-3 border border-white/10 bg-panel/60 px-4 py-4">
                    <input
                      type="checkbox"
                      checked={Boolean(builder.selections.customerSuppliedParts)}
                      onChange={(event) => builder.setCustomerSuppliedParts(event.target.checked)}
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
                ) : null}
              </div>
            );
          }
          const group = section.group;
          return (
            <ConfigAccordion
              key={group.key}
              group={group}
              expanded={expanded.has(group.key)}
              invalid={fieldInvalid(group)}
              onToggle={() => toggle(group.key)}
              onCollapse={() => collapseGroup(group.key)}
              builder={builder}
              t={t}
            />
          );
        })}
      </div>
    </div>
  );
}
