const overlayClass =
  "absolute inset-0 z-20 flex items-center justify-center [transform:translate3d(0,0,1px)]";

function PlayMark({ compact = false }) {
  return (
    <span
      className={`flex items-center justify-center rounded-full border border-gold bg-charcoal text-gold shadow-[0_0_0_1px_rgba(201,168,76,0.45)] ${
        compact ? "size-7" : "size-14 sm:size-16"
      }`}
    >
      <svg viewBox="0 0 24 24" className={`ml-0.5 fill-current ${compact ? "size-3" : "size-6 sm:size-7"}`} aria-hidden="true">
        <path d="M8 5.14v13.72L19 12 8 5.14z" />
      </svg>
    </span>
  );
}

export default function GalleryPlayIcon({ className = "", compact = false, onClick, label }) {
  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={label}
        className={`${overlayClass} ${className}`}
      >
        <PlayMark compact={compact} />
      </button>
    );
  }

  return (
    <span className={`pointer-events-none ${overlayClass} ${className}`} aria-hidden="true">
      <PlayMark compact={compact} />
    </span>
  );
}
