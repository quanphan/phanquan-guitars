import Field from "../auth/Field.jsx";
import { SCALE_TYPES } from "../../data/wizardScaleAttributes.js";

const selectClass =
  "mt-2 w-full border border-white/10 bg-ink px-4 py-3 text-sm text-ivory";

export default function ScaleLengthFields({ form, onChange, errors = {}, t }) {
  const type = form.scaleType;

  function setField(key, value) {
    onChange({ ...form, [key]: value });
  }

  return (
    <fieldset className="space-y-5 border border-white/10 bg-panel/40 px-4 py-5">
      <legend className="px-1 text-[11px] uppercase tracking-[0.18em] text-gold">
        {t("admin.wizardSetup.scaleLengthLegend")}
      </legend>
      <p className="text-xs leading-relaxed text-muted">{t("admin.wizardSetup.scaleLengthHelp")}</p>
      <label className="block text-[11px] uppercase tracking-[0.18em] text-gold">
        {t("admin.wizardSetup.fields.scaleType")}
        <select
          value={type}
          onChange={(event) => setField("scaleType", event.target.value)}
          className={selectClass}
        >
          {SCALE_TYPES.map((id) => (
            <option key={id} value={id}>
              {t(`admin.wizardSetup.scaleTypes.${id}`)}
            </option>
          ))}
        </select>
      </label>
      {type === "custom" ? (
        <p className="text-sm text-ivory">{t("admin.wizardSetup.customScaleCustomerHelp")}</p>
      ) : type === "multiscale" ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            id="wizard-scale-bass"
            label={t("admin.wizardSetup.fields.scaleBass")}
            value={form.bass}
            onChange={(value) => setField("bass", value)}
            placeholder='25.5"'
            required
            error={errors.scaleEnds ? t("admin.wizardSetup.errors.scaleEnds") : ""}
          />
          <Field
            id="wizard-scale-treble"
            label={t("admin.wizardSetup.fields.scaleTreble")}
            value={form.treble}
            onChange={(value) => setField("treble", value)}
            placeholder='27.5"'
            required
            error={errors.scaleEnds ? t("admin.wizardSetup.errors.scaleEnds") : ""}
          />
        </div>
      ) : (
        <Field
          id="wizard-scale-display"
          label={t("admin.wizardSetup.fields.scaleLength")}
          value={form.display}
          onChange={(value) => setField("display", value)}
          placeholder='25.5"'
        />
      )}
    </fieldset>
  );
}
