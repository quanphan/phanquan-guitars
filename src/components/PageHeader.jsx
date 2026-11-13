export default function PageHeader({
  eyebrow,
  title,
  description,
  align = "left",
  children,
  className,
}) {
  const alignment =
    align === "center" ? "mx-auto max-w-3xl text-center" : "max-w-3xl text-left";

  return (
    <header className={className ?? "page-start mx-auto max-w-7xl px-6 lg:px-10"}>
      <div className={alignment}>
        {eyebrow ? (
          <p className="max-w-full text-[11px] uppercase tracking-[0.18em] text-gold sm:tracking-[0.32em]">
            {eyebrow}
          </p>
        ) : null}
        <h1
          className={`${eyebrow ? "mt-4 " : ""}max-w-full font-display text-[clamp(1.75rem,4vw+1rem,3rem)] font-medium tracking-wide text-ivory break-words`}
        >
          {title}
        </h1>
        {description ? (
          <p className="mt-5 max-w-full text-base leading-relaxed text-muted sm:text-lg">
            {description}
          </p>
        ) : null}
        {children}
      </div>
    </header>
  );
}
