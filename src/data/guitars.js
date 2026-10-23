import featuredHorizontal from "../assets/guitars/optimized/featured-horizontal.jpg";
import featuredHorizontalSm from "../assets/guitars/optimized/featured-horizontal-800.jpg";
import featuredGrey from "../assets/guitars/optimized/featured-grey.jpg";
import featuredGreySm from "../assets/guitars/optimized/featured-grey-700.jpg";
import featuredEngraved from "../assets/guitars/optimized/featured-engraved.jpg";
import featuredEngravedSm from "../assets/guitars/optimized/featured-engraved-800.jpg";
import galleryCustom from "../assets/guitars/optimized/gallery-custom.jpg";
import galleryCustomSm from "../assets/guitars/optimized/gallery-custom-800.jpg";

export const featuredGuitars = [
  {
    id: "pq-t-custom",
    name: "PQ-T Custom",
    wood: "Swamp ash & roasted maple",
    scale: '25.5"',
    strings: 6,
    image: featuredHorizontal,
    imageSrcSet: `${featuredHorizontalSm} 800w, ${featuredHorizontal} 1276w`,
    imageSizes: "(min-width: 1280px) 30vw, (min-width: 768px) 45vw, 100vw",
    imagePosition: "object-center",
  },
  {
    id: "pq-offset",
    name: "PQ Offset",
    wood: "Mahogany & maple",
    scale: '24.75"',
    strings: 6,
    image: featuredGrey,
    imageSrcSet: `${featuredGreySm} 700w, ${featuredGrey} 559w`,
    imageSizes: "(min-width: 1280px) 30vw, (min-width: 768px) 45vw, 100vw",
    imagePosition: "object-top",
  },
  {
    id: "pq-baritone",
    name: "PQ Baritone",
    wood: "Roasted maple & walnut",
    scale: '27"',
    strings: 7,
    image: featuredEngraved,
    imageSrcSet: `${featuredEngravedSm} 800w, ${featuredEngraved} 1080w`,
    imageSizes: "(min-width: 1280px) 30vw, (min-width: 768px) 45vw, 100vw",
    imagePosition: "object-center",
  },
];

export const galleryPhotos = [
  {
    id: "gallery-custom-finish",
    src: galleryCustom,
    srcSet: `${galleryCustomSm} 800w, ${galleryCustom} 1080w`,
    sizes: "(min-width: 768px) 50vw, 100vw",
    altKey: "pages.gallery.imageAlt",
  },
];
