import { useEffect, useState } from "react";

const SIZE = {
  type: "h-20 w-14 sm:h-24 sm:w-16 lg:h-[7.5rem] lg:w-20",
  shape: "h-[7.5rem] w-[4.75rem] sm:h-36 sm:w-[5.5rem] lg:h-40 lg:w-24",
  shapeCard: "aspect-[3/4] h-auto min-h-[16rem] w-full sm:min-h-[18rem] lg:min-h-[20rem]",
};

export default function WizardChoiceArt({ src, size = "type", fallback, surface }) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  const showImage = Boolean(src) && !failed;
  const onWhite = surface === "white";

  return (
    <span
      className={`flex ${SIZE[size] || SIZE.type} shrink-0 items-center justify-center ${
        onWhite ? "bg-white p-2 sm:p-3" : "p-1"
      }`}
      style={onWhite ? { backgroundColor: "#FFFFFF" } : undefined}
    >
      {showImage ? (
        <img
          src={src}
          alt=""
          onError={() => setFailed(true)}
          className="h-full w-full object-contain object-center"
        />
      ) : (
        fallback
      )}
    </span>
  );
}
