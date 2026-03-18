import { lazy, Suspense, useEffect } from "react";
import Header from "components/Header";
import Hero from "components/Hero";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

const DonationSection = lazy(() => import("components/Donations"));
const SponsorBadge = lazy(() => import("components/SponsorBadge"));
const Values = lazy(() => import("components/Values"));
const Decor = lazy(() => import("components/Decors"));
const Blog = lazy(() => import("components/Blog"));
const Footer = lazy(() => import("components/Footer"));
import INSPopupBanner from "components/INSPopupBanner";

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
      <INSPopupBanner />
      <Header />
      <Hero />
      <Suspense fallback={<div style={{ minHeight: "200px" }} />}>
        <DonationSection />
        <SponsorBadge />
        <Values />
        <Decor />
        <Blog />
        <Footer />
      </Suspense>
    </>
  );
};

export default Landing;
