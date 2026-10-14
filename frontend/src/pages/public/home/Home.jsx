import Navbar from "../../../components/layout/Navbar";
import HomeHero from "./HomeHero";
import HowItWorks from "./HowItWorks";
import About from "./About";

function Home() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main>
        <HomeHero />
        <HowItWorks />
        <About />
      </main>
    </div>
  );
}

export default Home;
