import BuildProcess from "../components/home/BuildProcess.jsx";
import CallToAction from "../components/home/CallToAction.jsx";
import FeaturedGuitars from "../components/home/FeaturedGuitars.jsx";
import Hero from "../components/home/Hero.jsx";
import Introduction from "../components/home/Introduction.jsx";
import Workshop from "../components/home/Workshop.jsx";

export default function Home() {
  return (
    <>
      <Hero />
      <Introduction />
      <FeaturedGuitars />
      <BuildProcess />
      <Workshop />
      <CallToAction />
    </>
  );
}
