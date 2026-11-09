const FIT = {
  contain: "object-contain object-center",
  cover: "object-cover object-center",
};

export default function FitImage({
  src,
  srcSet,
  sizes,
  alt = "",
  fit = "contain",
  frameClassName = "",
  className = "",
  width,
  height,
  loading = "lazy",
  decoding = "async",
  fill = true,
}) {
  const image = src ? (
    <img
      src={src}
      srcSet={srcSet}
      sizes={sizes}
      alt={alt}
      width={width}
      height={height}
      loading={loading}
      decoding={decoding}
      className={`${fill ? "h-full w-full" : "h-auto w-auto"} max-h-full max-w-full ${FIT[fit] || FIT.contain} ${className}`}
    />
  ) : (
    <div className="h-full w-full bg-ink" aria-hidden="true" />
  );

  if (!frameClassName) return image;
  return <div className={`overflow-hidden bg-ink ${frameClassName}`}>{image}</div>;
}
