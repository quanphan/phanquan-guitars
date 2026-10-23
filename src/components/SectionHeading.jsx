export default function SectionHeading({ eyebrow, title, align = "left" }) {
  const alignment =
    align === "center" ? "items-center text-center" : "items-start text-left";

  return (
    <div className={`flex flex-col gap-4 ${alignment}`}>
      {eyebrow ? (
        <p className="text-[11px] font-medium uppercase tracking-[0.32em] text-gold">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="font-display text-4xl font-medium tracking-wide text-ivory sm:text-5xl">
        {title}
      </h2>
    </div>
  );
}
