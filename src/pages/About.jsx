import featuredEngraved from "../assets/guitars/optimized/featured-engraved.jpg";
import featuredEngravedSm from "../assets/guitars/optimized/featured-engraved-800.jpg";
import heroBurlBass from "../assets/guitars/optimized/hero-burl-bass.jpg";
import heroBurlBassSm from "../assets/guitars/optimized/hero-burl-bass-900.jpg";
import workshopBack from "../assets/guitars/optimized/workshop-back.jpg";
import workshopBackSm from "../assets/guitars/optimized/workshop-back-900.jpg";
import EditablePublicPage from "../components/page-content/EditablePublicPage.jsx";

const aboutFallbacks = {
  "about-opening": {
    src: heroBurlBass,
    srcSet: `${heroBurlBassSm} 900w, ${heroBurlBass} 1200w`,
  },
  "about-turning": {
    src: featuredEngraved,
    srcSet: `${featuredEngravedSm} 800w, ${featuredEngraved} 1080w`,
  },
  "about-craft": {
    src: workshopBack,
    srcSet: `${workshopBackSm} 900w, ${workshopBack} 1200w`,
  },
};

export default function About() {
  return <EditablePublicPage pageKey="about" fallbacks={aboutFallbacks} />;
}
