import type { Dictionary } from "@/i18n";

const rideImageByNo: Record<number, string> = {
  1: "/images/rides/flyfish.jpeg",
  2: "/images/rides/ufo.png",
  3: "/images/rides/waffle.jpeg",
  4: "/images/rides/wild_pang_pang.jpeg",
  5: "/images/rides/bandwagon.png",
  6: "/images/rides/lotus.png",
  7: "/images/rides/peanut_boat.jpeg",
  8: "/images/rides/banana_boat.png",
};

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
          className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5"
          style={{ listStyle: "none", padding: 0 }}
        >
          {dict.rides.items.map((ride) => {
            const image = rideImageByNo[ride.no];
            return (
              <li
                key={ride.no}
                className="flex flex-col bg-white transition-transform hover:-translate-y-1 overflow-hidden"
                style={{
                  border: "1px solid rgba(0,0,0,0.08)",
                  borderRadius: "3px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                }}
              >
                {image && (
                  <div
                    className="relative w-full overflow-hidden"
                    style={{ aspectRatio: "1 / 1", backgroundColor: "#f4f4f4" }}
                  >
                    <img
                      src={image}
                      alt={ride.name}
                      loading="lazy"
                      decoding="async"
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="flex flex-col p-4 md:p-6">
                  <div className="flex items-start justify-between mb-3 md:mb-4 gap-2">
                    <span
                      className="inline-flex items-center justify-center flex-shrink-0"
                      style={{
                        width: "28px",
                        height: "28px",
                        backgroundColor: "#111",
                        color: "#fff",
                        fontSize: "12px",
                        fontWeight: 800,
                        borderRadius: "50%",
                      }}
                      aria-label={dict.rides.itemNoAria.replace("{n}", String(ride.no))}
                    >
                      {ride.no}
                    </span>
                    <span
                      className="inline-flex items-center px-2 py-0.5 flex-shrink-0"
                      style={{
                        backgroundColor: "rgba(0,194,209,0.15)",
                        color: "#009aa8",
                        fontSize: "10px",
                        fontWeight: 700,
                        borderRadius: "2px",
                      }}
                    >
                      {ride.capacity}
                    </span>
                  </div>
                  <h3
                    className="text-black mb-1.5 md:mb-2"
                    style={{
                      fontSize: "clamp(14px, 3.6vw, 18px)",
                      fontWeight: 800,
                      letterSpacing: "-0.02em",
                    }}
                  >
                    {ride.name}
                  </h3>
                  <p
                    className="text-black/60"
                    style={{ fontSize: "12px", lineHeight: 1.55 }}
                  >
                    {ride.description}
                  </p>
                </div>
              </li>
            );
          })}
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
