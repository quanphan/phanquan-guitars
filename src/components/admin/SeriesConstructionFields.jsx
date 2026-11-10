import Field from "../auth/Field.jsx";
import { emptyConstructionOption, moveConstructionOption } from "../../data/wizardSeriesConstruction.js";

function newRow() {
  return {
    ...emptyConstructionOption(),
    clientKey: `tmp-${Math.random().toString(36).slice(2, 10)}`,
  };
}

function ConstructionList({ title, hint, list, onChange, t, idPrefix }) {
  function updateRow(index, patch) {
    onChange(list.map((item, current) => (current === index ? { ...item, ...patch } : item)));
  }

  return (
    <fieldset className="space-y-4 border border-white/10 bg-panel/40 px-4 py-5">
      <legend className="px-1 text-[11px] uppercase tracking-[0.18em] text-gold">{title}</legend>
      <p className="text-xs leading-relaxed text-muted">{hint}</p>
      <div className="space-y-4">
        {list.map((item, index) => {
          const key = item.clientKey || item.id || `row-${index}`;
          return (
            <div key={key} className="space-y-3 border border-white/8 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-[11px] uppercase tracking-[0.16em] text-muted">
                  {t("admin.wizardSetup.construction.optionN").replace("{n}", String(index + 1))}
                  {item.id ? ` · ${item.id}` : ""}
                </p>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    className="text-[11px] uppercase tracking-[0.16em] text-gold disabled:opacity-40"
                    disabled={index === 0}
                    onClick={() => onChange(moveConstructionOption(list, index, -1))}
                  >
                    {t("admin.wizardSetup.construction.moveUp")}
                  </button>
                  <button
                    type="button"
                    className="text-[11px] uppercase tracking-[0.16em] text-gold disabled:opacity-40"
                    disabled={index === list.length - 1}
                    onClick={() => onChange(moveConstructionOption(list, index, 1))}
                  >
                    {t("admin.wizardSetup.construction.moveDown")}
                  </button>
                  <button
                    type="button"
                    className="text-[11px] uppercase tracking-[0.16em] text-gold"
                    onClick={() => onChange(list.filter((_, current) => current !== index))}
                  >
                    {t("admin.wizardSetup.construction.remove")}
                  </button>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  id={`${idPrefix}-en-${key}`}
                  label={t("admin.wizardSetup.fields.enName")}
                  value={item.enName}
                  onChange={(value) => updateRow(index, { enName: value })}
                />
                <Field
                  id={`${idPrefix}-vi-${key}`}
                  label={t("admin.wizardSetup.fields.viName")}
                  value={item.viName}
                  onChange={(value) => updateRow(index, { viName: value })}
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-ivory">
                <input
                  type="checkbox"
                  checked={item.active !== false}
                  onChange={(event) => updateRow(index, { active: event.target.checked })}
                  className="accent-gold"
                />
                {t("admin.catalog.active")}
              </label>
            </div>
          );
        })}
      </div>
      <button
        type="button"
        className="text-[11px] uppercase tracking-[0.16em] text-gold"
        onClick={() => onChange([...list, newRow()])}
      >
        {t("admin.wizardSetup.construction.add")}
      </button>
    </fieldset>
  );
}

export default function SeriesConstructionFields({
  bodyConstruction,
  neckConstruction,
  onBodyChange,
  onNeckChange,
  t,
}) {
  return (
    <div className="space-y-5">
      <ConstructionList
        idPrefix="body-construction"
        title={t("admin.wizardSetup.construction.bodyHeading")}
        hint={t("admin.wizardSetup.construction.bodyHint")}
        list={bodyConstruction}
        onChange={onBodyChange}
        t={t}
      />
      <ConstructionList
        idPrefix="neck-construction"
        title={t("admin.wizardSetup.construction.neckHeading")}
        hint={t("admin.wizardSetup.construction.neckHint")}
        list={neckConstruction}
        onChange={onNeckChange}
        t={t}
      />
    </div>
  );
}
