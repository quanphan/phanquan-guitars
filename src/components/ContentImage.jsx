import { useLayoutEffect, useRef, useState } from "react";
import {
  imageElementStatus,
  restartImageLoad,
  shouldIgnoreImageError,
} from "../utils/imageLoadState.js";

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
  const imgRef = useRef(null);
  const retriedRef = useRef(false);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  useLayoutEffect(() => {
    retriedRef.current = false;
    const img = imgRef.current;
    const status = imageElementStatus(img);
    if (status === "ready") {
      setFailed(false);
      setLoaded(true);
      return;
    }
    setLoaded(false);
    setFailed(false);
    if (status === "broken" && src && img) {
      retriedRef.current = true;
      restartImageLoad(img, src);
    }
  }, [src, srcSet]);

  function onLoad() {
    setFailed(false);
    setLoaded(true);
  }

  function onError() {
    const img = imgRef.current;
    if (shouldIgnoreImageError(img)) return;
    if (imageElementStatus(img) === "ready") {
      setFailed(false);
      setLoaded(true);
      return;
    }
    if (!retriedRef.current && src) {
      retriedRef.current = true;
      restartImageLoad(img, src);
      return;
    }
    setLoaded(false);
    setFailed(true);
  }

  if (!src) {
    return <ImageSkeleton className={className} />;
  }

  return (
    <span className="relative block h-full w-full">
      {loaded ? null : (
        <ImageSkeleton
          className={`absolute inset-0 ${failed ? "bg-panel" : ""} ${className}`.trim()}
        />
      )}
      <img
        ref={imgRef}
        src={src}
        srcSet={srcSet}
        sizes={sizes}
        alt={alt}
        width={width}
        height={height}
        loading={loading}
        decoding={decoding}
        fetchPriority={fetchPriority}
        onLoad={onLoad}
        onError={onError}
        className={`${className} ${loaded ? "opacity-100" : "opacity-0"}`}
      />
    </span>
  );
}
