import Blog from "components/Blog";
import Decor from "components/Decors";
import Header from "components/Header";
import Hero from "components/Hero";
import Values from "components/Values";
import Footer from "components/Footer";
import { useParams } from "react-router-dom";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

const Landing = () => {
  const { lang } = useParams();
  const { i18n } = useTranslation();

  useEffect(() => {
    if (lang && typeof i18n.changeLanguage === "function") {
      i18n.changeLanguage(lang);
    }
  }, [lang, i18n]);

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
