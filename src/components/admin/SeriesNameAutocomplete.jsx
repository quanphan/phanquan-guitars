import { useEffect, useId, useMemo, useRef, useState } from "react";
import { errorFieldClass, fieldClass } from "../auth/Field.jsx";
import {
  filterSeriesCatalogSuggestions,
  nextSuggestionIndex,
} from "../../data/wizardSeriesSuggestions.js";

export default function SeriesNameAutocomplete({
  id,
  label,
  value,
  onChange,
  onSelect,
  suggestions,
  error,
  required,
  t,
}) {
  const listId = useId();
  const rootRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const matches = useMemo(
    () => filterSeriesCatalogSuggestions(suggestions, value),
    [suggestions, value],
  );

  useEffect(() => {
    setActiveIndex((current) => (current >= matches.length ? matches.length - 1 : current));
  }, [matches.length]);

  useEffect(() => {
    if (!open) return undefined;
    function onPointerDown(event) {
      if (!rootRef.current?.contains(event.target)) {
        setOpen(false);
        setActiveIndex(-1);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  function choose(item) {
    if (!item) return;
    onSelect(item);
    setOpen(false);
    setActiveIndex(-1);
  }

  function onKeyDown(event) {
    if (event.key === "Escape") {
      if (open) {
        event.preventDefault();
        setOpen(false);
        setActiveIndex(-1);
      }
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (!open) {
        setOpen(true);
        setActiveIndex(matches.length ? 0 : -1);
        return;
      }
      setActiveIndex((current) => nextSuggestionIndex(current, matches.length, 1));
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      if (!open) {
        setOpen(true);
        setActiveIndex(matches.length ? matches.length - 1 : -1);
        return;
      }
      setActiveIndex((current) => nextSuggestionIndex(current, matches.length, -1));
      return;
    }
    if (event.key === "Enter" && open && activeIndex >= 0 && matches[activeIndex]) {
      event.preventDefault();
      choose(matches[activeIndex]);
    }
  }

  const activeId = activeIndex >= 0 && matches[activeIndex] ? `${listId}-${matches[activeIndex].id}` : undefined;

  return (
    <div ref={rootRef} className="relative">
      <label htmlFor={id} className="text-[11px] uppercase tracking-[0.18em] text-gold">
        {label}
        {required ? <span className="ml-1 text-muted">*</span> : null}
      </label>
      <input
        id={id}
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={open ? activeId : undefined}
        aria-invalid={Boolean(error)}
        value={value}
        required={required}
        autoComplete="off"
        onFocus={() => {
          setOpen(true);
        }}
        onChange={(event) => {
          onChange(event.target.value);
          setOpen(true);
          setActiveIndex(-1);
        }}
        onKeyDown={onKeyDown}
        className={error ? errorFieldClass : fieldClass}
      />
      {open ? (
        <ul
          id={listId}
          role="listbox"
          aria-label={t("admin.wizardSetup.seriesSuggestionList")}
          className="absolute z-30 mt-1 max-h-60 w-full overflow-y-auto border border-gold/25 bg-ink py-1 shadow-[0_12px_40px_rgba(0,0,0,0.45)]"
        >
          {matches.length === 0 ? (
            <li className="px-4 py-2.5 text-sm text-muted">{t("admin.wizardSetup.noSeriesMatch")}</li>
          ) : (
            matches.map((item, index) => {
              const active = index === activeIndex;
              return (
                <li
                  key={item.id}
                  id={`${listId}-${item.id}`}
                  role="option"
                  aria-selected={active}
                  className={`cursor-pointer px-4 py-2.5 ${active ? "bg-gold/15" : "hover:bg-gold/10"}`}
                  onMouseEnter={() => setActiveIndex(index)}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => choose(item)}
                >
                  <p className="text-sm text-ivory">{item.enName}</p>
                  {item.viName ? (
                    <p className="mt-0.5 text-xs text-muted">{item.viName}</p>
                  ) : null}
                </li>
              );
            })
          )}
        </ul>
      ) : null}
      {error ? <p className="mt-2 text-xs text-gold">{error}</p> : null}
    </div>
  );
}
