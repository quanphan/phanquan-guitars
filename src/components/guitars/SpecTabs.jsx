import { useId, useState } from "react";
import { useLanguage } from "../../i18n/LanguageContext.jsx";

export const SPEC_TABS = [
  {
    id: "body",
    fields: [
      "bodyWood",
      "topWood",
      "bodyConstruction",
      "bodyContour",
      "neckHeel",
      "binding",
    ],
  },
  {
    id: "neck",
    fields: [
      "neckConstruction",
      "neckWood",
      "fingerboardWood",
      "scaleLength",
      "multiscaleRange",
      "stringCount",
      "fretCount",
      "fingerboardRadius",
      "nutWidth",
      "fretMaterial",
      "neckProfile",
    ],
  },
  {
    id: "electronicsHardware",
    fields: [
      "pickupConfiguration",
      "neckPickup",
      "middlePickup",
      "bridgePickup",
      "pickupModel",
      "pickupSelector",
      "controlsAndSwitching",
      "preamp",
      "bridge",
      "tuningSystem",
      "nut",
      "stringSpacing",
      "hardwareManufacturerFinish",
      "hardwareFinish",
    ],
  },
  {
    id: "finish",
    fields: ["finishType", "colour", "inlay"],
  },
  {
    id: "additional",
    fields: [
      "weight",
      "designStory",
      "specialFeatures",
      "setupNotes",
      "buildNotes",
      "otherDetails",
      "buildStatus",
    ],
  },
];

function resolveValue(guitar, tab, field, t) {
  if (field === "designStory" && guitar.source !== "api") {
    const key = `guitars.items.${guitar.id}.designStory`;
    const translated = t(key);
    if (translated && translated !== key) return translated;
  }
  if (field === "buildStatus") {
    const raw = guitar.specTabs?.[tab.id]?.[field];
    if (!raw) return "";
    const key = `guitars.buildStatus.${raw}`;
    const translated = t(key);
    return translated !== key ? translated : raw;
  }
  return guitar.specTabs?.[tab.id]?.[field];
}

function rowsForTab(guitar, tab, t) {
  return tab.fields
    .map((field) => ({ field, value: resolveValue(guitar, tab, field, t) }))
    .filter(({ value }) => value != null && String(value).trim() !== "");
}

export default function SpecTabs({ guitar }) {
  const { t } = useLanguage();
  const baseId = useId();
  const [activeId, setActiveId] = useState("body");
  const activeTab = SPEC_TABS.find((tab) => tab.id === activeId) ?? SPEC_TABS[0];
  const rows = rowsForTab(guitar, activeTab, t);

  const onKeyDown = (event) => {
    const index = SPEC_TABS.findIndex((tab) => tab.id === activeTab.id);
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      event.preventDefault();
      setActiveId(SPEC_TABS[(index + 1) % SPEC_TABS.length].id);
    }
    if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      event.preventDefault();
      setActiveId(SPEC_TABS[(index - 1 + SPEC_TABS.length) % SPEC_TABS.length].id);
    }
    if (event.key === "Home") {
      event.preventDefault();
      setActiveId(SPEC_TABS[0].id);
    }
    if (event.key === "End") {
      event.preventDefault();
      setActiveId(SPEC_TABS[SPEC_TABS.length - 1].id);
    }
  };

  return (
    <div className="min-w-0">
      <div
        role="tablist"
        aria-label={t("guitars.detail.specs")}
        className="flex overflow-x-auto overscroll-x-contain [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        onKeyDown={onKeyDown}
      >
        {SPEC_TABS.map((tab) => {
          const selected = tab.id === activeTab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              id={`${baseId}-${tab.id}`}
              aria-selected={selected}
              aria-controls={`${baseId}-panel-${tab.id}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActiveId(tab.id)}
              className={`shrink-0 whitespace-nowrap px-3.5 py-2.5 text-[10px] uppercase tracking-[0.16em] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-gold sm:text-[11px] ${
                selected
                  ? "bg-gold/25 text-gold"
                  : "bg-ink text-ivory/50 hover:text-ivory"
              }`}
            >
              {t(`guitars.tabs.${tab.id}`)}
            </button>
          );
        })}
      </div>

      <div
        role="tabpanel"
        id={`${baseId}-panel-${activeTab.id}`}
        aria-labelledby={`${baseId}-${activeTab.id}`}
        className="bg-panel px-5 py-2"
      >
        {rows.length > 0 ? (
          <dl>
            {rows.map(({ field, value }) => (
              <div
                key={field}
                className="border-b border-white/10 py-4 last:border-b-0"
              >
                <dt className="text-[11px] uppercase tracking-[0.16em] text-muted">
                  {t(`guitars.specLabels.${field}`)}
                </dt>
                <dd className="mt-1.5 text-base leading-relaxed text-ivory">
                  {value}
                </dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className="py-4 text-sm text-muted">{t("guitars.specs.empty")}</p>
        )}
      </div>
    </div>
  );
}
