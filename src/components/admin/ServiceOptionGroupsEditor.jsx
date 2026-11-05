import Field, { fieldClass } from "../auth/Field.jsx";
import { emptyOptionGroup, emptyOptionValue } from "../../data/services.js";
import { useLanguage } from "../../i18n/LanguageContext.jsx";

export default function ServiceOptionGroupsEditor({
  optionGroups,
  variantPrices,
  onChange,
  disabled,
}) {
  const { t } = useLanguage();

  function setGroups(nextGroups, nextPrices = variantPrices) {
    onChange(nextGroups, nextPrices);
  }

  function updateGroup(index, patch) {
    setGroups(optionGroups.map((group, current) => (current === index ? { ...group, ...patch } : group)));
  }

  function updateValue(groupIndex, valueIndex, patch) {
    const group = optionGroups[groupIndex];
    updateGroup(groupIndex, {
      values: group.values.map((value, current) => (current === valueIndex ? { ...value, ...patch } : value)),
    });
  }

  function removeGroup(index) {
    const removed = optionGroups[index];
    const ids = new Set((removed.values || []).map((value) => value.id));
    ids.add(removed.id);
    setGroups(
      optionGroups.filter((_, current) => current !== index),
      variantPrices.filter((row) => !(row.valueIds || []).some((id) => ids.has(id))),
    );
  }

  function removeValue(groupIndex, valueIndex) {
    const valueId = optionGroups[groupIndex].values[valueIndex]?.id;
    const group = optionGroups[groupIndex];
    const values = group.values.filter((_, current) => current !== valueIndex);
    setGroups(
      optionGroups.map((item, current) => (current === groupIndex ? { ...item, values } : item)),
      variantPrices.filter((row) => !(row.valueIds || []).includes(valueId)),
    );
  }

  function addCombo() {
    const valueIds = optionGroups.map((group) => group.values[0]?.id).filter(Boolean);
    if (valueIds.length !== optionGroups.length) return;
    setGroups(optionGroups, [...variantPrices, { valueIds, price: "" }]);
  }

  function updateCombo(index, patch) {
    onChange(
      optionGroups,
      variantPrices.map((row, current) => (current === index ? { ...row, ...patch } : row)),
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="text-[11px] uppercase tracking-[0.18em] text-gold">{t("admin.services.options.title")}</h3>
          <p className="mt-2 text-xs text-muted">{t("admin.services.options.hint")}</p>
        </div>
        <button
          type="button"
          className="text-[11px] uppercase tracking-[0.16em] text-gold disabled:opacity-40"
          disabled={disabled}
          onClick={() => setGroups([...optionGroups, emptyOptionGroup()])}
        >
          {t("admin.services.options.addGroup")}
        </button>
      </div>

      {optionGroups.map((group, groupIndex) => (
        <div key={group.id} className="border border-white/10 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-[11px] uppercase tracking-[0.16em] text-muted">
              {t("admin.services.options.group")} {groupIndex + 1}
            </p>
            <button
              type="button"
              className="text-[11px] uppercase tracking-[0.16em] text-gold disabled:opacity-40"
              disabled={disabled}
              onClick={() => removeGroup(groupIndex)}
            >
              {t("admin.services.options.removeGroup")}
            </button>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field
              id={`group-en-${group.id}`}
              label={t("admin.services.options.enName")}
              value={group.enName}
              onChange={(value) => updateGroup(groupIndex, { enName: value })}
              disabled={disabled}
            />
            <Field
              id={`group-vi-${group.id}`}
              label={t("admin.services.options.viName")}
              value={group.viName}
              onChange={(value) => updateGroup(groupIndex, { viName: value })}
              disabled={disabled}
            />
          </div>
          <div className="mt-6 space-y-4">
            {group.values.map((value, valueIndex) => (
              <div key={value.id} className="grid gap-4 border border-white/5 p-4 sm:grid-cols-3">
                <Field
                  id={`value-en-${value.id}`}
                  label={t("admin.services.options.enLabel")}
                  value={value.enLabel}
                  onChange={(next) => updateValue(groupIndex, valueIndex, { enLabel: next })}
                  disabled={disabled}
                />
                <Field
                  id={`value-vi-${value.id}`}
                  label={t("admin.services.options.viLabel")}
                  value={value.viLabel}
                  onChange={(next) => updateValue(groupIndex, valueIndex, { viLabel: next })}
                  disabled={disabled}
                />
                <div>
                  <Field
                    id={`value-price-${value.id}`}
                    label={t("admin.services.options.valuePrice")}
                    value={value.price}
                    onChange={(next) => updateValue(groupIndex, valueIndex, { price: next })}
                    disabled={disabled}
                  />
                  <button
                    type="button"
                    className="mt-2 text-[11px] uppercase tracking-[0.16em] text-gold disabled:opacity-40"
                    disabled={disabled || group.values.length < 2}
                    onClick={() => removeValue(groupIndex, valueIndex)}
                  >
                    {t("admin.services.options.removeValue")}
                  </button>
                </div>
              </div>
            ))}
          </div>
          <button
            type="button"
            className="mt-4 text-[11px] uppercase tracking-[0.16em] text-gold disabled:opacity-40"
            disabled={disabled}
            onClick={() => updateGroup(groupIndex, { values: [...group.values, emptyOptionValue()] })}
          >
            {t("admin.services.options.addValue")}
          </button>
        </div>
      ))}

      {optionGroups.length > 1 ? (
        <div className="border border-white/10 p-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h4 className="text-[11px] uppercase tracking-[0.18em] text-gold">{t("admin.services.options.combos")}</h4>
              <p className="mt-2 text-xs text-muted">{t("admin.services.options.combosHint")}</p>
            </div>
            <button
              type="button"
              className="text-[11px] uppercase tracking-[0.16em] text-gold disabled:opacity-40"
              disabled={disabled}
              onClick={addCombo}
            >
              {t("admin.services.options.addCombo")}
            </button>
          </div>
          <div className="mt-4 space-y-4">
            {variantPrices.map((row, index) => (
              <div key={`${row.valueIds.join("-")}-${index}`} className="grid gap-3 sm:grid-cols-[1fr_8rem_auto] sm:items-end">
                <div className="grid gap-3 sm:grid-cols-2">
                  {optionGroups.map((group, groupIndex) => (
                    <label key={group.id} className="block text-[11px] uppercase tracking-[0.16em] text-gold">
                      {group.enName || group.viName || t("admin.services.options.group")}
                      <select
                        className={`${fieldClass} mt-2`}
                        value={row.valueIds[groupIndex] || ""}
                        disabled={disabled}
                        onChange={(event) => {
                          const valueIds = optionGroups.map((item, current) => (
                            current === groupIndex ? event.target.value : row.valueIds[current] || item.values[0]?.id || ""
                          ));
                          updateCombo(index, { valueIds });
                        }}
                      >
                        {group.values.map((value) => (
                          <option key={value.id} value={value.id}>
                            {value.enLabel || value.viLabel}
                          </option>
                        ))}
                      </select>
                    </label>
                  ))}
                </div>
                <Field
                  id={`combo-price-${index}`}
                  label={t("admin.services.fields.price")}
                  value={row.price}
                  onChange={(value) => updateCombo(index, { price: value })}
                  disabled={disabled}
                />
                <button
                  type="button"
                  className="mb-1 text-[11px] uppercase tracking-[0.16em] text-gold disabled:opacity-40"
                  disabled={disabled}
                  onClick={() => onChange(optionGroups, variantPrices.filter((_, current) => current !== index))}
                >
                  {t("admin.services.options.removeCombo")}
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
