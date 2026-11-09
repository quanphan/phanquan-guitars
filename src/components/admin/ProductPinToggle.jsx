export default function ProductPinToggle({ pinned, disabled, saving, label, onToggle }) {
  return (
    <label className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-gold">
      <input
        type="checkbox"
        checked={pinned === true}
        disabled={disabled || saving}
        onChange={onToggle}
        className="accent-gold"
      />
      <span className={saving ? "opacity-60" : undefined}>{label}</span>
    </label>
  );
}
