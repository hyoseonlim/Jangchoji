import type { Dictionary } from "@/i18n";

export function Rides({ dict }: { dict: Dictionary }) {
  return (
    <section
      id="rides"
      className="py-14 md:py-24 px-5 md:px-8 scroll-mt-20"
      style={{ backgroundColor: "#ffffff" }}
    >
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h2
            className="text-black"
            style={{
              fontSize: "clamp(22px, 5vw, 48px)",
              fontWeight: 900,
              letterSpacing: "-0.03em",
              lineHeight: 1.05,
            }}
          >
            {dict.rides.title}
          </h2>
          <div className="mt-4 w-12 h-0.5" style={{ backgroundColor: "#00C2D1" }} />
        </div>

        <div
          className="mb-8 p-5 flex items-start gap-3"
          style={{
            backgroundColor: "rgba(0,194,209,0.10)",
            border: "1px solid rgba(0,194,209,0.35)",
            borderRadius: "3px",
          }}
        >
          <span style={{ fontSize: "20px", flexShrink: 0 }} aria-hidden="true">
            🎉
          </span>
          <p className="text-black" style={{ fontSize: "14px", lineHeight: 1.6, fontWeight: 600 }}>
            {dict.rides.promo}
          </p>
        </div>

        <ol
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
          style={{ listStyle: "none", padding: 0 }}
        >
          {dict.rides.items.map((ride) => (
            <li
              key={ride.no}
              className="flex flex-col p-6 bg-white transition-transform hover:-translate-y-1"
              style={{
                border: "1px solid rgba(0,0,0,0.08)",
                borderRadius: "3px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
              }}
            >
              <div className="flex items-start justify-between mb-4">
                <span
                  className="inline-flex items-center justify-center"
                  style={{
                    width: "32px",
                    height: "32px",
                    backgroundColor: "#111",
                    color: "#fff",
                    fontSize: "13px",
                    fontWeight: 800,
                    borderRadius: "50%",
                  }}
                  aria-label={dict.rides.itemNoAria.replace("{n}", String(ride.no))}
                >
                  {ride.no}
                </span>
                <span
                  className="inline-flex items-center px-2 py-0.5"
                  style={{
                    backgroundColor: "rgba(0,194,209,0.15)",
                    color: "#009aa8",
                    fontSize: "11px",
                    fontWeight: 700,
                    borderRadius: "2px",
                  }}
                >
                  {ride.capacity}
                </span>
              </div>
              <h3
                className="text-black mb-2"
                style={{
                  fontSize: "18px",
                  fontWeight: 800,
                  letterSpacing: "-0.02em",
                }}
              >
                {ride.name}
              </h3>
              <p
                className="text-black/60"
                style={{ fontSize: "13px", lineHeight: 1.6 }}
              >
                {ride.description}
              </p>
            </li>
          ))}
        </ol>

        <p
          className="mt-8 text-black/60 flex items-center gap-2"
          style={{ fontSize: "13px" }}
        >
          <span aria-hidden="true">⚠️</span>
          {dict.rides.safety}
        </p>
      </div>
    </section>
  );
}
