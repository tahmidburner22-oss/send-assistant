export default function Footer() {
  return (
    <footer data-testid="footer" className="relative pt-16 md:pt-24 pb-10 px-6 md:px-12 bg-ink-900 text-cream-100 overflow-hidden">
      {/* Massive brand */}
      <div className="max-w-[1400px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 mb-14">
          <div className="md:col-span-5">
            <div className="flex items-center gap-3">
              <img
                src="https://customer-assets.emergentagent.com/job_scroll-animate-hero-1/artifacts/936159wx_IMG-20260412-WA0001.jpg"
                alt="Adaptly"
                className="w-11 h-11 object-contain"
                style={{ filter: "invert(1) brightness(1.1)", mixBlendMode: "screen" }}
              />
              <span className="font-heading font-bold text-2xl tracking-tight">Adaptly</span>
            </div>
            <p className="mt-5 text-cream-100/70 max-w-sm leading-relaxed text-sm md:text-base">
              The UK's leading AI-powered SEND platform — built around UK law, the SEND Code of Practice
              and the people who care about children most.
            </p>
          </div>

          <div className="md:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-8">
            {[
              { title: "Platform", links: ["EHCP Builder", "Worksheet Generator", "Parent Portal", "Scheduler", "SEND Screener"] },
              { title: "Company", links: ["About", "Careers", "Press", "Contact", "Partners"] },
              { title: "Legal", links: ["Privacy", "Cookies", "DPA", "Security", "ICO"] },
            ].map((c) => (
              <div key={c.title}>
                <div className="text-xs uppercase tracking-[0.2em] text-cream-100/40 font-semibold mb-4">{c.title}</div>
                <ul className="space-y-3">
                  {c.links.map((l) => (
                    <li key={l}>
                      <a className="text-sm text-cream-100/80 hover:text-terracotta transition-colors" href="#">
                        {l}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-cream-100/10 pt-10">
          <div className="overflow-hidden">
            <div
              className="font-heading font-black text-cream-100/[0.08] leading-none select-none whitespace-nowrap"
              style={{ fontSize: "clamp(80px, 22vw, 340px)", letterSpacing: "-0.04em" }}
              data-testid="footer-brand-giant"
            >
              ADAPTLY
            </div>
          </div>

          <div className="mt-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 text-xs text-cream-100/50">
            <div>© {new Date().getFullYear()} Adaptly Ltd. Registered in England & Wales.</div>
            <div className="flex gap-5">
              <a href="mailto:hello@adaptly.co.uk" className="hover:text-terracotta transition-colors">hello@adaptly.co.uk</a>
              <a href="mailto:dpo@adaptly.co.uk" className="hover:text-terracotta transition-colors">dpo@adaptly.co.uk</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
