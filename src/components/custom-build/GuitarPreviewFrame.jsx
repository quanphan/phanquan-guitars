import { useEffect, useRef, useState } from "react";
import { mediaUrl } from "../../config/api.js";
import {
  fillPreviewFromImageData,
  guitarPreviewLayerSrcs,
  guitarPreviewPath,
  guitarPreviewSrc,
  resolveGuitarPreview,
} from "../../data/wizardGuitarPreview.js";
import FitImage from "../FitImage.jsx";

function sameOriginSrc(path, resolved) {
  if (typeof path === "string" && path.startsWith("/uploads/")) return path;
  return resolved || "";
}

function loadImage(src) {
  return new Promise((resolve) => {
    if (!src) {
      resolve(null);
      return;
    }
    const image = new Image();
    image.decoding = "async";
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = src;
  });
}

function sampleFill(image, width, height) {
  if (!image) return null;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
  const w = image.naturalWidth * scale;
  const h = image.naturalHeight * scale;
  ctx.drawImage(image, (width - w) / 2, (height - h) / 2, w, h);
  return ctx.getImageData(0, 0, width, height).data;
}

export default function GuitarPreviewFrame({ builder, t, side = "front" }) {
  const preview = resolveGuitarPreview(builder);
  const path = guitarPreviewPath(preview, side);
  const src = guitarPreviewSrc(preview, mediaUrl, side);
  const layers = guitarPreviewLayerSrcs(preview, mediaUrl);
  const canvasRef = useRef(null);
  const [composed, setComposed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setComposed(false);
    if (!src || (!layers.bodyWood && !layers.topWood && !layers.finishSwatch)) {
      return undefined;
    }

    async function draw() {
      const guitar = await loadImage(sameOriginSrc(path, src));
      if (cancelled || !guitar) return;
      const fillImage = await loadImage(
        sameOriginSrc(preview.layers?.topWoodImage || preview.layers?.bodyWoodImage, layers.topWood || layers.bodyWood),
      );
      const canvas = canvasRef.current;
      if (!canvas) return;
      const width = guitar.naturalWidth;
      const height = guitar.naturalHeight;
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;
      try {
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(guitar, 0, 0, width, height);
        const guitarData = ctx.getImageData(0, 0, width, height);
        const fillData = sampleFill(fillImage, width, height);
        if (!fillData && !layers.finishSwatch) return;
        const next = fillPreviewFromImageData(
          guitarData.data,
          fillData,
          layers.finishSwatch,
          width,
          height,
        );
        ctx.putImageData(new ImageData(next.data, width, height), 0, 0);
        if (!cancelled) setComposed(true);
      } catch {
        if (!cancelled) setComposed(false);
      }
    }

    void draw();
    return () => {
      cancelled = true;
    };
  }, [src, path, layers.bodyWood, layers.topWood, layers.finishSwatch]);

  const empty = !src;
  const emptyTitle = side === "back"
    ? t("customBuild.summary.previewBackEmptyTitle")
    : t("customBuild.summary.previewEmptyTitle");
  const emptyBody = side === "back"
    ? t("customBuild.summary.previewBackEmpty")
    : t("customBuild.summary.previewEmpty");

  return (
    <div className="relative w-full overflow-hidden bg-ink aspect-[4/5] max-lg:aspect-[5/4]">
      <div
        className={
          empty
            ? "absolute inset-0"
            : "absolute inset-0 transition-opacity duration-300 max-lg:left-1/2 max-lg:top-1/2 max-lg:h-[125%] max-lg:w-auto max-lg:aspect-[4/5] max-lg:origin-center max-lg:-translate-x-1/2 max-lg:-translate-y-1/2 max-lg:rotate-90"
        }
      >
        {empty ? (
          <div className="flex h-full w-full flex-col items-center justify-center px-6 text-center">
            <p className="text-[11px] uppercase tracking-[0.2em] text-gold">{emptyTitle}</p>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted">{emptyBody}</p>
          </div>
        ) : (
          <>
            <FitImage
              src={src}
              alt={preview.altName || t("customBuild.summary.previewAlt")}
              fit="contain"
              frameClassName={`absolute inset-0 bg-transparent transition-opacity duration-300 ${composed ? "opacity-0" : "opacity-100"}`}
            />
            <canvas
              ref={canvasRef}
              className={`absolute inset-0 h-full w-full object-contain transition-opacity duration-300 ${composed ? "opacity-100" : "opacity-0"}`}
              aria-hidden={!composed}
            />
          </>
        )}
      </div>
    </div>
  );
}
