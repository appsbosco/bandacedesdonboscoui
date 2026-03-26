import { lazy, Suspense } from "react";
import Header from "components/Header";
import Hero from "components/Hero";

const DonationSection = lazy(() => import("components/Donations"));
const SponsorBadge = lazy(() => import("components/SponsorBadge"));
const Values = lazy(() => import("components/Values"));
const Decor = lazy(() => import("components/Decors"));
const Blog = lazy(() => import("components/Blog"));
const Footer = lazy(() => import("components/Footer"));
import INSPopupBanner from "components/INSPopupBanner";

const Landing = () => {
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
