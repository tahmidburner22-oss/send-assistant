/**
 * Adaptly landing page — Overdrive edition.
 * One locked variant: scroll storytelling hero, horizontal Services rail,
 * companion scroll rail (xl+), magnetic cursor (fine pointer only).
 */
import { useEffect } from "react";
import { injectLandingStyles } from "./landing/styles";
// @ts-ignore
import { useLenis } from "./landing/lib/useLenis";
// @ts-ignore
import ScrollRail from "./landing/ScrollRail.jsx";
// @ts-ignore
import MagneticCursor from "./landing/MagneticCursor.jsx";
// @ts-ignore
import Nav from "./landing/Nav.jsx";
// @ts-ignore
import Hero from "./landing/Hero.jsx";
// @ts-ignore
import About from "./landing/About.jsx";
// @ts-ignore
import Services from "./landing/ServicesHorizontal.jsx";
// @ts-ignore
import LiveDifferentiate from "./landing/LiveDifferentiate.jsx";
// @ts-ignore
import ZoomParallax from "./landing/ZoomParallax.jsx";
// @ts-ignore
import Process from "./landing/Process.jsx";
// @ts-ignore
import EhcpBuilder from "./landing/EhcpBuilder.jsx";
// @ts-ignore
import ParentPortal from "./landing/ParentPortal.jsx";
// @ts-ignore
import Analytics from "./landing/Analytics.jsx";
// @ts-ignore
import Competitor from "./landing/Competitor.jsx";
// @ts-ignore
import CaseStudies from "./landing/CaseStudies.jsx";
// @ts-ignore
import Testimonials from "./landing/Testimonials.jsx";
// @ts-ignore
import Investors from "./landing/Investors.jsx";
// @ts-ignore
import Contact from "./landing/Contact.jsx";
// @ts-ignore
import Footer from "./landing/Footer.jsx";

function LandingInner() {
  // Editorial Swiss Humanism: native scroll keeps the long evidence-led page precise, responsive, and predictable.
  // Lenis added an extra RAF loop over many pinned Framer Motion scenes, causing noticeable landing-page lag.
  useLenis({ enabled: false });
  return (
    <div className="adaptly-landing min-h-screen relative overflow-x-hidden">
      <Nav />
      <ScrollRail />
      <MagneticCursor />
      <main>
        <Hero />
        <About />
        <Services />
        <LiveDifferentiate />
        <ZoomParallax />
        <Process />
        <EhcpBuilder />
        <ParentPortal />
        <Analytics />
        <Competitor />
        <CaseStudies />
        <Testimonials />
        <Investors />
        <Contact />
      </main>
      <Footer />
    </div>
  );
}

export default function LandingPage() {
  useEffect(() => {
    injectLandingStyles();
    document.documentElement.dataset.landingVariant = "overdrive";
  }, []);
  return <LandingInner />;
}
