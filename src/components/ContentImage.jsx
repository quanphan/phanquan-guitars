import { useEffect, useState } from "react";

export function ImageSkeleton({ className = "" }) {
  return <div className={`bg-ink ${className}`.trim()} aria-hidden="true" />;
}

export default function ContentImage({
  src,
  srcSet,
  sizes,
  alt = "",
  className = "",
  width,
  height,
  loading = "lazy",
  decoding = "async",
  fetchPriority,
}) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setFailed(false);
    setLoaded(false);
  }, [src, srcSet]);

  if (!src || failed) {
    return <ImageSkeleton className={className} />;
  }

  return (
    <span className="relative block h-full w-full">
      {loaded ? null : <ImageSkeleton className={`absolute inset-0 ${className}`.trim()} />}
      <img
        key={src}
        src={src}
        srcSet={srcSet}
        sizes={sizes}
        alt={alt}
        width={width}
        height={height}
        loading={loading}
        decoding={decoding}
        fetchPriority={fetchPriority}
        onLoad={() => setLoaded(true)}
        onError={() => setFailed(true)}
        className={`${className} ${loaded ? "opacity-100" : "opacity-0"}`}
      />
    </span>
  );
}
