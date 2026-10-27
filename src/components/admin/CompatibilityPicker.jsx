import { useEffect, useRef } from "react";
import { optionAlias, optionLabel, optionMatchesAlias } from "../../data/wizardCatalog.js";
import {
  allowedCompatibilityFields,
  applyCompatibilitySelectAll,
  compatibilityEditorOptions,
  compatibilitySelectAllState,
  compatibilityStoredValue,
  groupLabel,
  isCompatibilityValueSelected,
} from "../../data/wizardSetupLayout.js";

function SelectAllCheckbox({ checked, indeterminate, disabled, label, onChange }) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = Boolean(indeterminate) && !checked;
  }, [checked, indeterminate]);
  return (
    <label className={`flex shrink-0 items-center gap-2 text-[11px] uppercase tracking-[0.16em] ${disabled ? "text-muted" : "text-gold"}`}>
      <span>{label}</span>
      <input
        ref={ref}
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={onChange}
        className="size-4 accent-gold disabled:opacity-40"
      />
    </label>
  );
}

export default function CompatibilityPicker({
  categories,
  currentCategoryId,
  value,
  onChange,
  language,
  t,
}) {
  const fields = allowedCompatibilityFields(currentCategoryId, categories);

  function toggle(field, option, category) {
    const selected = Array.isArray(value[field.key]) ? [...value[field.key]] : [];
    const isOn = isCompatibilityValueSelected(selected, option, category.id);
    const next = isOn
      ? selected.filter((item) => !optionMatchesAlias(option, category.id, item))
      : [...selected, compatibilityStoredValue(field, option, category.id)];
    onChange({ ...value, [field.key]: next });
  }

  function toggleAll(field, options, categoryId, selectAll) {
    onChange({
      ...value,
      [field.key]: applyCompatibilitySelectAll(value[field.key], options, field, categoryId, selectAll),
    });
  }

  return (
    <fieldset className="space-y-4">
      <legend className="text-[11px] uppercase tracking-[0.18em] text-gold">
        {t("admin.wizardSetup.fields.compatibility")}
      </legend>
      {!fields.length ? (
        <p className="text-sm text-muted">{t("admin.wizardSetup.compatNone")}</p>
      ) : (
        <>
          <p className="text-sm text-muted">{t("admin.wizardSetup.compatibilityHelp")}</p>
          {fields.map((field) => {
            const category = categories.find((item) => item.id === field.categoryId);
            const options = compatibilityEditorOptions(category?.options);
            const allState = compatibilitySelectAllState(value[field.key], options, field.categoryId);
            return (
              <div key={field.key}>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-gold">
                    {groupLabel(t, category || { id: field.categoryId })}
                  </p>
                  <SelectAllCheckbox
                    label={t("admin.wizardSetup.selectAll")}
                    checked={allState.checked}
                    indeterminate={allState.indeterminate}
                    disabled={allState.disabled}
                    onChange={() => toggleAll(field, options, field.categoryId, !allState.checked)}
                  />
                </div>
                {options.length === 0 ? (
                  <p className="mt-2 text-sm text-muted">{t("admin.wizardSetup.compatEmpty")}</p>
                ) : (
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    {options.map((option) => {
                      const checked = isCompatibilityValueSelected(value[field.key], option, field.categoryId);
                      const label = optionLabel(option, language, t);
                      const vi = option.translations?.vi?.name;
                      const en = option.translations?.en?.name || option.name;
                      const bilingual = vi && en && vi !== en ? `${en} / ${vi}` : label;
                      return (
                        <label key={option.id} className="flex items-start gap-2 text-sm text-ivory">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggle(field, option, category)}
                            className="mt-0.5 size-4 accent-gold"
                          />
                          <span>
                            {bilingual}
                            <span className="mt-0.5 block text-[10px] uppercase tracking-[0.14em] text-muted">
                              {optionAlias(option, field.categoryId)}
                            </span>
                          </span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </>
      )}
    </fieldset>
  );
}

export function DefaultForTypesPicker({ types, selected, onChange, language, t, allowedIds }) {
  return (
    <fieldset>
      <legend className="text-[11px] uppercase tracking-[0.18em] text-gold">
        {t("admin.wizardSetup.fields.defaultForTypes")}
      </legend>
      <p className="mt-2 text-sm text-muted">{t("admin.wizardSetup.defaultForHelp")}</p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {compatibilityEditorOptions(types).map((option) => {
          const alias = optionAlias(option, "instrument-type");
          const allowed = !allowedIds?.length || allowedIds.includes(alias) || allowedIds.includes(option.code);
          const checked = selected.includes(alias) || selected.includes(option.code) || selected.includes(option.id);
          const en = option.translations?.en?.name || option.name;
          const vi = option.translations?.vi?.name;
          return (
            <label key={option.id} className={`flex items-start gap-2 text-sm ${allowed ? "text-ivory" : "text-muted"}`}>
              <input
                type="checkbox"
                checked={checked}
                disabled={!allowed}
                onChange={() => {
                  const next = checked ? selected.filter((item) => item !== alias && item !== option.code && item !== option.id) : [...selected, alias];
                  onChange(next);
                }}
                className="mt-0.5 size-4 accent-gold"
              />
              <span>
                {vi && vi !== en ? `${en} / ${vi}` : optionLabel(option, language, t)}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
