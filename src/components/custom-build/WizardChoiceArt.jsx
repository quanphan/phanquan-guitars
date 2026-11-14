import { useEffect, useState } from "react";

const SIZE = {
  type: "aspect-[3/4] h-auto w-full",
  typeCard: "aspect-[3/5] h-auto w-full",
  shape: "aspect-[3/4] h-auto w-full",
  shapeCard: "aspect-[3/4] h-auto w-full",
};

const FIT = {
  contain: "object-contain",
  cover: "object-cover",
};

export default function WizardChoiceArt({ src, size = "type", fallback, fit = "contain", paper = false }) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  const showImage = Boolean(src) && !failed;
  const objectFit = FIT[fit] || FIT.contain;

  return (
    <span
      className={`relative block box-border overflow-hidden ${SIZE[size] || SIZE.type} shrink-0`}
      style={paper ? { backgroundColor: "rgb(150, 150, 150)" } : undefined}
    >
      {showImage ? (
        <img
          src={src}
          alt=""
          onError={() => setFailed(true)}
          draggable={false}
          className={`absolute inset-0 block h-full w-full object-center ${objectFit}`}
          style={{ imageRendering: "auto" }}
        />
      ) : (
        <span className="absolute inset-0 flex items-center justify-center p-2">
          {fallback}
        </span>
      )}
    </span>
  );
}
