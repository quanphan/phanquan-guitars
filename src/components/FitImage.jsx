import ContentImage from "./ContentImage.jsx";

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
  fetchPriority,
  fill = true,
}) {
  const image = (
    <ContentImage
      src={src}
      srcSet={srcSet}
      sizes={sizes}
      alt={alt}
      width={width}
      height={height}
      loading={loading}
      decoding={decoding}
      fetchPriority={fetchPriority}
      className={`${fill ? "h-full w-full" : "h-auto w-auto"} max-h-full max-w-full ${FIT[fit] || FIT.contain} ${className}`}
    />
  );

  if (!frameClassName) return image;
  const hasBg = /\bbg-/.test(frameClassName);
  return (
    <div className={`overflow-hidden ${hasBg ? "" : "bg-ink"} ${frameClassName}`.trim()}>
      {image}
    </div>
  );
}
