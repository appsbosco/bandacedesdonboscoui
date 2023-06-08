import Blog from "components/Blog";
import Decor from "components/Decors";
import Header from "components/Header";
import Hero from "components/Hero";
import Values from "components/Values";
import Footer from "components/Footer";

const Landing = () => {
  return (
    <>
      <Header />
      <Hero />
      <Values />
      <Decor />
      <Blog />
      <Footer />
    </>
  );
};

export default Landing;
