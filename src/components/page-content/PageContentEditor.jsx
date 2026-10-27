import { emptySection, moveSection, duplicateSection, SECTION_TYPES } from "../../data/pageContent.js";
import { useLanguage } from "../../i18n/LanguageContext.jsx";
import SectionEditor from "./SectionEditor.jsx";

export default function PageContentEditor({
  locale,
  onChange,
  upload,
  canUpload,
  disabled,
}) {
  const { t } = useLanguage();
  const sections = locale.sections || [];

  function updateSection(index, nextSection) {
    const next = [...sections];
    next[index] = nextSection;
    onChange({ ...locale, sections: next });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {SECTION_TYPES.map((type) => (
          <button
            key={type}
            type="button"
            disabled={disabled}
            onClick={() => onChange({ ...locale, sections: [...sections, emptySection(type)] })}
            className="border border-white/15 px-3 py-2 text-[11px] uppercase tracking-[0.18em] text-ivory/80 hover:text-ivory"
          >
            {t("admin.pageContent.add")} {t(`admin.pageContent.types.${type}`)}
          </button>
        ))}
      </div>
      {sections.length === 0 ? (
        <p className="text-sm text-muted">{t("admin.pageContent.emptySections")}</p>
      ) : null}
      {sections.map((section, index) => (
        <SectionEditor
          key={section.id}
          section={section}
          disabled={disabled}
          upload={upload}
          canUpload={canUpload}
          onChange={(next) => updateSection(index, next)}
          onMoveUp={() => onChange({ ...locale, sections: moveSection(sections, index, -1) })}
          onMoveDown={() => onChange({ ...locale, sections: moveSection(sections, index, 1) })}
          onDuplicate={() => onChange({ ...locale, sections: duplicateSection(sections, index) })}
          onDelete={() => onChange({ ...locale, sections: sections.filter((_, current) => current !== index) })}
        />
      ))}
    </div>
  );
}
