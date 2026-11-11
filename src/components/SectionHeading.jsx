export default function SectionHeading({ eyebrow, title, align = "left" }) {
  const alignment =
    align === "center" ? "items-center text-center" : "items-start text-left";

  return (
    <div className={`flex flex-col gap-4 ${alignment}`}>
      {eyebrow ? (
        <p className="max-w-full text-[11px] font-medium uppercase tracking-[0.18em] text-gold sm:tracking-[0.32em]">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="max-w-full font-display text-[clamp(1.75rem,4vw+1rem,3rem)] font-medium tracking-wide text-ivory break-words">
        {title}
      </h2>
    </div>
  );
}
