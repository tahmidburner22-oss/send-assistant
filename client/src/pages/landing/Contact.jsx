import { motion } from "framer-motion";

export default function Contact() {
  return (
    <section id="contact" data-testid="contact-section" className="relative py-28 md:py-40 px-6 md:px-12">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="relative rounded-[2rem] md:rounded-[3rem] overflow-hidden p-10 md:p-20 bg-gradient-to-br from-cream-200 via-cream-100 to-cream-50 border border-ink-900/5"
        >
          {/* decorative orbs */}
          <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-terracotta/20 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-10 w-72 h-72 rounded-full bg-honey/30 blur-3xl pointer-events-none" />

          <div className="relative text-center max-w-3xl mx-auto">
            <div className="text-xs uppercase tracking-[0.2em] text-terracotta font-semibold">Ready to start?</div>
            <h2 className="mt-6 font-heading text-ink-900 text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[0.92]">
              Give your SENCO their{" "}
              <span className="font-display italic font-normal">Sundays</span>{" "}
              back.
            </h2>
            <p className="mt-8 text-ink-500 text-base md:text-lg leading-relaxed max-w-xl mx-auto">
              Join schools across the UK using Adaptly's 24 specialist tools to support SEND pupils,
              reduce teacher workload, and stay legally compliant. Free to start, no card required.
            </p>

            <div className="mt-12 flex flex-wrap justify-center gap-3">
              <a
                href="https://adaptly.co.uk/login"
                data-testid="contact-cta-primary"
                className="group inline-flex items-center gap-3 rounded-full bg-ink-900 text-cream-100 px-7 py-4 text-sm md:text-base font-medium hover:bg-terracotta transition-all duration-300 hover:scale-[1.02]"
              >
                Get started free
                <span className="transition-transform group-hover:translate-x-1">→</span>
              </a>
              <a
                href="mailto:hello@adaptly.co.uk"
                data-testid="contact-cta-secondary"
                className="inline-flex items-center gap-3 rounded-full bg-cream-50 border border-ink-900/10 text-ink-900 px-7 py-4 text-sm md:text-base font-medium hover:bg-cream-100 transition-all"
              >
                Talk to the team
              </a>
            </div>

            <div className="mt-10 text-xs uppercase tracking-[0.2em] text-ink-500 flex flex-wrap justify-center gap-x-5 gap-y-2">
              <span>✓ GDPR compliant</span>
              <span>✓ Ofsted ready</span>
              <span>✓ 100% SEND-code aligned</span>
              <span>✓ UK data residency</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
