import { useEffect, useRef, useState } from "react";
import { mediaUrl } from "../../config/api.js";
import { resolveGuitar3d } from "../../data/wizardGuitar3d.js";
import {
  fillPreviewFromImageData,
  guitarPreviewLayerSrcs,
  guitarPreviewPath,
  guitarPreviewSrc,
  previewCanvasSrc,
  resolveGuitarPreview,
} from "../../data/wizardGuitarPreview.js";
import FitImage from "../FitImage.jsx";
import Guitar3dPreview from "./Guitar3dPreview.jsx";

function loadImage(src) {
  return new Promise((resolve) => {
    const url = previewCanvasSrc(src);
    if (!url) {
      resolve(null);
      return;
    }
    const image = new Image();
    image.decoding = "async";
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = url;
  });
}

function sampleFill(image, width, height) {
  if (!image) return null;
  try {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return null;
    const pattern = ctx.createPattern(image, "repeat");
    if (pattern) {
      ctx.fillStyle = pattern;
      ctx.fillRect(0, 0, width, height);
    } else {
      ctx.drawImage(image, 0, 0, width, height);
    }
    return ctx.getImageData(0, 0, width, height).data;
  } catch {
    return null;
  }
}

function useDesktopViewport() {
  const [desktop, setDesktop] = useState(() => (
    typeof window !== "undefined" ? window.matchMedia("(min-width: 1024px)").matches : true
  ));
  useEffect(() => {
    const media = window.matchMedia("(min-width: 1024px)");
    const onChange = () => setDesktop(media.matches);
    onChange();
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);
  return desktop;
}

function GuitarPreview2d({ builder, t, side = "front" }) {
  const preview = resolveGuitarPreview(builder);
  const path = guitarPreviewPath(preview, side);
  const src = guitarPreviewSrc(preview, mediaUrl, side);
  const layers = guitarPreviewLayerSrcs(preview, mediaUrl);
  const canvasRef = useRef(null);
  const [composed, setComposed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setComposed(false);
    if (!src || (!layers.fillWood && !layers.finishSwatch && !layers.woodTone)) {
      return undefined;
    }

    async function draw() {
      const guitar = await loadImage(path || src);
      if (cancelled || !guitar) return;
      const fillImage = await loadImage(layers.fillWood);
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
        if (!fillData && !layers.finishSwatch && !layers.woodTone) return;
        const next = fillPreviewFromImageData(
          guitarData.data,
          fillData,
          layers.finishSwatch,
          width,
          height,
          layers.woodTone,
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
  }, [src, path, layers.fillWood, layers.finishSwatch, layers.woodTone]);

  const empty = !src;
  const emptyTitle = side === "back"
    ? t("customBuild.summary.previewBackEmptyTitle")
    : t("customBuild.summary.previewEmptyTitle");
  const emptyBody = side === "back"
    ? t("customBuild.summary.previewBackEmpty")
    : t("customBuild.summary.previewEmpty");

  return (
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
  );
}

const frameClass =
  "relative w-full overflow-hidden bg-ink aspect-[4/5] max-h-[calc(100dvh-11rem)] max-lg:aspect-[5/4] max-lg:max-h-none";

export default function GuitarPreviewFrame({ builder, t, side = "front", slot = "any" }) {
  const desktop = useDesktopViewport();
  const inactive = (slot === "mobile" && desktop) || (slot === "desktop" && !desktop);
  const scene = resolveGuitar3d(builder, { resolveUpload: mediaUrl });

  if (inactive) {
    return <div className={frameClass} aria-hidden="true" />;
  }

  const twoD = <GuitarPreview2d builder={builder} t={t} side={side} />;
  if (scene.mode === "model") {
    return (
      <div className={frameClass}>
        <Guitar3dPreview scene={scene} side={side} t={t} fallback={twoD} />
      </div>
    );
  }

  return <div className={frameClass}>{twoD}</div>;
}
