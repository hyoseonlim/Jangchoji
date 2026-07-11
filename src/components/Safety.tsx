import type { Dictionary } from "@/i18n";

export function Safety({ dict }: { dict: Dictionary }) {
  return (
    <section
      id="safety"
      className="py-14 md:py-24 px-5 md:px-8"
      style={{ backgroundColor: "#0a0a0a" }}
    >
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 md:mb-16 grid md:grid-cols-2 gap-8 items-end">
          <div>
            <h2
              className="text-white whitespace-pre-line"
              style={{
                fontSize: "clamp(24px, 5.5vw, 56px)",
                fontWeight: 900,
                letterSpacing: "-0.03em",
                lineHeight: 1.05,
              }}
            >
              {dict.safety.title}
            </h2>
            <div className="mt-4 w-12 h-0.5" style={{ backgroundColor: "#00C2D1" }} />
          </div>
          <p
            className="text-white/55"
            style={{ fontSize: "16px", lineHeight: 1.75, maxWidth: "480px" }}
          >
            {dict.safety.intro}
          </p>
        </div>

        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px"
          style={{ backgroundColor: "rgba(255,255,255,0.07)" }}
        >
          {dict.safety.features.map((feature) => (
            <div
              key={feature.title}
              className="p-8"
              style={{ backgroundColor: "#0a0a0a" }}
            >
              <div
                className="mb-4 text-3xl"
                style={{ fontSize: "36px" }}
                role="img"
                aria-label={feature.title}
              >
                {feature.icon}
              </div>
              <h3
                className="text-white mb-3"
                style={{ fontSize: "18px", fontWeight: 700, letterSpacing: "-0.02em" }}
              >
                {feature.title}
              </h3>
              <p
                className="text-white/50 leading-relaxed"
                style={{ fontSize: "14px", lineHeight: 1.75 }}
              >
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        <div
          className="mt-12 p-8 flex flex-col md:flex-row items-center justify-between gap-6"
          style={{
            backgroundColor: "#00C2D1",
            borderRadius: "3px",
          }}
        >
          <div>
            <p
              className="text-black"
              style={{ fontSize: "22px", fontWeight: 800, letterSpacing: "-0.02em" }}
            >
              {dict.safety.ctaTitle}
            </p>
            <p
              className="text-black/70 mt-1"
              style={{ fontSize: "14px" }}
            >
              {dict.safety.ctaSubtitle}
            </p>
          </div>
          <div className="flex gap-3 flex-shrink-0">
            <a
              href={`tel:${dict.brand.phone}`}
              className="inline-flex items-center px-6 py-3 bg-black text-white font-bold transition-opacity hover:opacity-80"
              style={{ fontSize: "14px", borderRadius: "2px" }}
            >
              📞 {dict.brand.phone}
            </a>
            <a
              href="https://smartstore.naver.com/madski/products/11804623124"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:inline-flex items-center px-6 py-3 bg-white text-black font-bold transition-opacity hover:opacity-80"
              style={{ fontSize: "14px", borderRadius: "2px" }}
            >
              {dict.safety.ctaStore}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
