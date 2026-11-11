import { useEffect, useState } from "react";

const SIZE = {
  type: "aspect-[3/4] h-auto w-full",
  shape: "aspect-[3/4] h-auto w-full",
  shapeCard: "aspect-[3/4] h-auto w-full",
};

const FIT = {
  contain: "object-contain",
  cover: "object-cover",
};

export default function WizardChoiceArt({ src, size = "type", fallback, surface, fit = "contain" }) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  const showImage = Boolean(src) && !failed;
  const onWhite = surface === "white";
  const objectFit = FIT[fit] || FIT.contain;

  return (
    <span
      className={`relative block box-border overflow-hidden ${SIZE[size] || SIZE.type} shrink-0 ${
        onWhite ? "bg-white" : ""
      }`}
      style={onWhite ? { backgroundColor: "#FFFFFF" } : undefined}
    >
      {showImage ? (
        <img
          src={src}
          alt=""
          onError={() => setFailed(true)}
          className={`absolute inset-0 block h-full w-full object-center ${objectFit}`}
        />
      ) : (
        <span className="absolute inset-0 flex items-center justify-center p-2">
          {fallback}
        </span>
      )}
    </span>
  );
}
