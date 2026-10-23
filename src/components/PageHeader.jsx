export default function PageHeader({
  eyebrow,
  title,
  description,
  align = "left",
  children,
}) {
  const alignment =
    align === "center" ? "mx-auto max-w-3xl text-center" : "max-w-3xl text-left";

  return (
    <header className="mx-auto max-w-7xl px-6 pt-16 lg:px-10 lg:pt-20">
      <div className={alignment}>
        {eyebrow ? (
          <p className="text-[11px] uppercase tracking-[0.32em] text-gold">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="mt-4 font-display text-4xl font-medium tracking-wide text-ivory sm:text-5xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-5 text-base leading-relaxed text-muted sm:text-lg">
            {description}
          </p>
        ) : null}
        {children}
      </div>
    </header>
  );
}
