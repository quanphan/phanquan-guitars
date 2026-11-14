import { useEffect, useState } from "react";
import { mediaUrl } from "../../config/api.js";
import { resolveGuitar3d } from "../../data/wizardGuitar3d.js";
import {
  guitarPreviewSrc,
  resolveGuitarPreview,
} from "../../data/wizardGuitarPreview.js";
import FitImage from "../FitImage.jsx";
import Guitar3dPreview from "./Guitar3dPreview.jsx";

const PAPER = "rgb(150, 150, 150)";

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
  const src = guitarPreviewSrc(preview, mediaUrl, side);

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
          : "absolute inset-0 max-lg:left-1/2 max-lg:top-1/2 max-lg:h-[200%] max-lg:w-[60%] max-lg:origin-center max-lg:-translate-x-1/2 max-lg:-translate-y-1/2 max-lg:rotate-90"
      }
    >
      {empty ? (
        <div className="flex h-full w-full flex-col items-center justify-center px-6 text-center">
          <p className="text-[11px] uppercase tracking-[0.2em] text-gold">{emptyTitle}</p>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-ink/70">{emptyBody}</p>
        </div>
      ) : (
        <FitImage
          src={src}
          alt={preview.altName || t("customBuild.summary.previewAlt")}
          fit="contain"
          frameClassName="absolute inset-0 bg-transparent"
        />
      )}
    </div>
  );
}

const frameClass =
  "relative mx-auto w-[64%] max-w-[18rem] overflow-hidden aspect-[3/5] max-h-[calc(100dvh-11rem)] max-lg:w-full max-lg:max-w-none max-lg:aspect-[5/2.5] max-lg:max-h-none";

export default function GuitarPreviewFrame({ builder, t, side = "front", slot = "any" }) {
  const desktop = useDesktopViewport();
  const inactive = (slot === "mobile" && desktop) || (slot === "desktop" && !desktop);
  const scene = resolveGuitar3d(builder, { resolveUpload: mediaUrl });

  if (inactive) {
    return <div className={frameClass} style={{ backgroundColor: PAPER }} aria-hidden="true" />;
  }

  const twoD = <GuitarPreview2d builder={builder} t={t} side={side} />;
  if (scene.mode === "model") {
    return (
      <div className={frameClass} style={{ backgroundColor: PAPER }}>
        <Guitar3dPreview scene={scene} side={side} t={t} fallback={twoD} />
      </div>
    );
  }

  return (
    <div className={frameClass} style={{ backgroundColor: PAPER }}>
      {twoD}
    </div>
  );
}
