import galleryCustom from "../assets/guitars/optimized/gallery-custom.jpg";
import galleryCustomSm from "../assets/guitars/optimized/gallery-custom-800.jpg";

export const galleryPhotos = [
  {
    id: "gallery-custom-finish",
    src: galleryCustom,
    srcSet: `${galleryCustomSm} 800w, ${galleryCustom} 1080w`,
    sizes: "(min-width: 768px) 50vw, 100vw",
    altKey: "pages.gallery.imageAlt",
  },
];
