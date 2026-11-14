import { lazy, Suspense, useCallback, useRef, useState } from "react";
import Guitar3dErrorBoundary from "./Guitar3dErrorBoundary.jsx";

const Guitar3dCanvas = lazy(() => import("./Guitar3dCanvas.jsx"));

function OverlayMessage({ title, body }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-ink px-6 text-center">
      {title ? (
        <p className="text-[11px] uppercase tracking-[0.2em] text-gold">{title}</p>
      ) : null}
      {body ? <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted">{body}</p> : null}
    </div>
  );
}

export default function Guitar3dPreview({ scene, side, t, fallback }) {
  const resetRef = useRef(null);
  const [canReset, setCanReset] = useState(false);
  const onResetReady = useCallback((fn) => {
    resetRef.current = fn;
    setCanReset(typeof fn === "function");
  }, []);

  return (
    <div className="relative h-full w-full bg-ink">
      <Guitar3dErrorBoundary
        resetKey={scene.model?.url}
        fallback={
          fallback || (
            <OverlayMessage
              title={t("customBuild.summary.preview3dErrorTitle")}
              body={t("customBuild.summary.preview3dError")}
            />
          )
        }
      >
        <Suspense fallback={<OverlayMessage title={t("customBuild.summary.preview3dLoading")} />}>
          <Guitar3dCanvas scene={scene} side={side} onResetReady={onResetReady} />
        </Suspense>
      </Guitar3dErrorBoundary>
      {canReset ? (
        <button
          type="button"
          onClick={() => resetRef.current?.()}
          className="absolute bottom-3 right-3 z-10 px-2 py-1 text-[10px] uppercase tracking-[0.16em] text-muted hover:text-gold"
        >
          {t("customBuild.summary.preview3dReset")}
        </button>
      ) : null}
    </div>
  );
}
