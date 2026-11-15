import { useEffect, useRef, useState } from "react";
import { errorFieldClass, fieldClass } from "../auth/Field.jsx";
import { isValidCustomScaleValue } from "../../data/wizardScaleAttributes.js";

export default function CustomScaleLengthField({
  value,
  onChange,
  t,
  forceError = false,
  autoFocus = false,
  className = "mt-3 block text-[11px] uppercase tracking-[0.18em] text-gold",
}) {
  const inputRef = useRef(null);
  const [focused, setFocused] = useState(Boolean(autoFocus));
  const [blurred, setBlurred] = useState(false);
  const valid = isValidCustomScaleValue(value);
  const showError = !valid && (forceError || (blurred && !focused));

  useEffect(() => {
    function syncFocus(event) {
      const node = inputRef.current;
      if (!node) return;
      if (event.type === "focusin" && event.target === node) {
        setFocused(true);
        return;
      }
      if (node.contains(event.target)) return;
      if (document.activeElement === node) return;
      setFocused(false);
      setBlurred(true);
    }
    document.addEventListener("focusin", syncFocus);
    document.addEventListener("focusout", syncFocus);
    return () => {
      document.removeEventListener("focusin", syncFocus);
      document.removeEventListener("focusout", syncFocus);
    };
  }, []);

  useEffect(() => {
    if (!autoFocus) return undefined;
    const node = inputRef.current;
    if (!node) return undefined;
    const frame = window.requestAnimationFrame(() => node.focus());
    return () => window.cancelAnimationFrame(frame);
  }, [autoFocus]);

  return (
    <label
      className={className}
      onMouseDown={(event) => event.stopPropagation()}
      onClick={(event) => event.stopPropagation()}
    >
      {t("customBuild.step1.customScaleInputLabel")}
      <input
        ref={inputRef}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => {
          setFocused(false);
          setBlurred(true);
        }}
        onMouseDown={(event) => event.stopPropagation()}
        onClick={(event) => event.stopPropagation()}
        placeholder={t("customBuild.step1.customScalePlaceholder")}
        className={showError ? errorFieldClass : fieldClass}
        aria-invalid={showError}
      />
      <span className="mt-2 block text-[10px] font-normal normal-case tracking-normal text-muted">
        {t("customBuild.step1.customScaleInputHelp")}
      </span>
      {showError ? (
        <span className="mt-2 block text-xs font-normal normal-case tracking-normal text-gold" role="alert">
          {t("customBuild.step1.customScaleError")}
        </span>
      ) : null}
    </label>
  );
}
