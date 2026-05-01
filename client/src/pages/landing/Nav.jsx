import { useEffect, useState } from "react";
import { motion, useScroll, useSpring } from "framer-motion";
import { Menu, X } from "lucide-react";
import { NAV_LINKS } from "./lib/data";

const LOGO = "https://customer-assets.emergentagent.com/job_scroll-animate-hero-1/artifacts/936159wx_IMG-20260412-WA0001.jpg";

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState("");
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.3 });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 32);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const ids = NAV_LINKS.map((l) => l.href.slice(1));
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActive("#" + e.target.id);
        });
      },
      { rootMargin: "-40% 0px -55% 0px" }
    );
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, []);

  return (
    <>
      <motion.div
        data-testid="nav-scroll-progress"
        style={{ scaleX: progress }}
        className="fixed top-0 left-0 right-0 h-[2px] origin-left bg-terracotta z-[60]"
      />
      <header
        data-testid="nav-header"
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled ? "py-3" : "py-6"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 md:px-10">
          <div
            className={`flex items-center justify-between rounded-full pl-3 pr-3 md:pl-4 md:pr-4 py-2 transition-all duration-500 ${
              scrolled ? "glass" : "bg-transparent"
            }`}
          >
            <a href="#top" data-testid="nav-logo" className="flex items-center gap-3 group pl-1">
              <img
                src={LOGO}
                alt="Adaptly"
                className="w-10 h-10 md:w-11 md:h-11 object-contain mix-blend-multiply"
              />
              <span className="font-heading font-bold text-xl md:text-2xl tracking-tight text-ink-900">Adaptly</span>
            </a>

            <nav className="hidden md:flex items-center gap-1 relative bg-cream-50/50 rounded-full p-1 backdrop-blur-sm">
              {NAV_LINKS.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  data-testid={`nav-link-${l.label.toLowerCase()}`}
                  className="relative px-4 py-2 text-sm text-ink-700 hover:text-ink-900 transition-colors rounded-full"
                >
                  {active === l.href && (
                    <motion.span
                      layoutId="nav-pill"
                      className="absolute inset-0 bg-ink-900 rounded-full"
                      transition={{ type: "spring", stiffness: 380, damping: 32 }}
                    />
                  )}
                  <span className={`relative z-10 ${active === l.href ? "text-cream-100" : ""}`}>{l.label}</span>
                </a>
              ))}
            </nav>

            <div className="flex items-center gap-2">
              <a
                href="https://adaptly.co.uk/login"
                data-testid="nav-cta-start"
                className="hidden md:inline-flex items-center gap-2 rounded-full bg-ink-900 text-cream-100 px-5 py-2.5 text-sm font-medium hover:bg-terracotta transition-colors"
              >
                Start free <span aria-hidden>→</span>
              </a>
              <button
                onClick={() => setOpen(!open)}
                data-testid="nav-mobile-toggle"
                className="md:hidden w-10 h-10 rounded-full bg-ink-900 text-cream-100 flex items-center justify-center"
                aria-label="Toggle menu"
              >
                {open ? <X size={18} /> : <Menu size={18} />}
              </button>
            </div>
          </div>
        </div>
      </header>

      <motion.div
        initial={false}
        animate={{ opacity: open ? 1 : 0, pointerEvents: open ? "auto" : "none" }}
        transition={{ duration: 0.25 }}
        className="fixed inset-0 z-40 md:hidden bg-cream-100/95 backdrop-blur-xl"
        data-testid="mobile-menu"
      >
        <div className="pt-28 px-8 flex flex-col gap-6">
          {NAV_LINKS.map((l, i) => (
            <motion.a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              initial={{ opacity: 0, y: 20 }}
              animate={open ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ delay: open ? 0.1 + i * 0.05 : 0 }}
              className="font-display italic text-5xl text-ink-900"
            >
              {l.label}
            </motion.a>
          ))}
          <a
            href="https://adaptly.co.uk/login"
            onClick={() => setOpen(false)}
            className="mt-8 self-start inline-flex items-center gap-2 rounded-full bg-ink-900 text-cream-100 px-6 py-3 text-sm font-medium"
          >
            Start free →
          </a>
        </div>
      </motion.div>
    </>
  );
}
