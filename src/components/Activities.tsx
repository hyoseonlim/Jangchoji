import { ImageWithFallback } from "./figma/ImageWithFallback";
import { RotatingImage } from "./ui/RotatingImage";
import { galleries } from "../data/imageGalleries";
import type { Dictionary } from "@/i18n";

type ActivityItem = Dictionary["activities"]["items"][number];

const galleryById: Record<string, readonly string[]> = {
  rides: galleries.rides,
  ski: galleries.ski,
  wakesurf: galleries.surf,
  waterpark: galleries.waterpark,
  cafe: galleries.cafe,
  rooftop: galleries.rooftop,
  stay: galleries.stay,
};

const fallbackImageById: Record<string, string | undefined> = {
  bbq: "https://images.unsplash.com/photo-1780091606130-2bfc03991da6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=640",
};

const intervalMsById: Record<string, number | undefined> = {
  ski: 4400,
  wakesurf: 4400,
  stay: 5000,
};

function ActivityCard({
  item,
  detailChip,
}: {
  item: ActivityItem;
  detailChip: string;
}) {
  const clickable = Boolean(item.href);
  const gallery = galleryById[item.id] ?? [];
  const fallback = fallbackImageById[item.id];
  const interval = intervalMsById[item.id] ?? 3800;

  const media = (
    <>
      <div className="absolute inset-0 transition-transform duration-700 group-hover:scale-[1.06]">
        {gallery.length > 0 ? (
          <RotatingImage
            images={[...gallery]}
            alt={item.alt}
            intervalMs={interval}
          />
        ) : fallback ? (
          <ImageWithFallback
            src={fallback}
            alt={item.alt}
            className="w-full h-full object-cover"
          />
        ) : null}
      </div>

      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.35) 45%, transparent 70%)",
        }}
      />

      {clickable && (
        <div
          className="absolute top-3 right-3 inline-flex items-center gap-1 px-2.5 py-1 transition-transform group-hover:-translate-y-0.5"
          style={{
            backgroundColor: "#00C2D1",
            color: "#000",
            fontSize: "11px",
            fontWeight: 800,
            borderRadius: "2px",
            letterSpacing: "0.02em",
          }}
        >
          {detailChip}
        </div>
      )}

      <div className="absolute bottom-0 left-0 right-0 p-5 md:p-6">
        <h3
          className="text-white"
          style={{
            fontSize: "22px",
            fontWeight: 900,
            letterSpacing: "-0.02em",
            lineHeight: 1.15,
            textShadow: "0 1px 6px rgba(0,0,0,0.35)",
          }}
        >
          {item.title}
        </h3>
      </div>
    </>
  );

  const commonClass =
    "group relative block overflow-hidden bg-black aspect-[8/9] md:aspect-[4/5]" +
    (clickable ? " cursor-pointer" : "");
  const commonStyle = { borderRadius: "3px" };

  return clickable ? (
    <a href={item.href} className={commonClass} style={commonStyle} aria-label={item.title}>
      {media}
    </a>
  ) : (
    <article className={commonClass} style={commonStyle} aria-label={item.title}>
      {media}
    </article>
  );
}

function DetailCard({
  item,
  detailLink,
}: {
  item: ActivityItem;
  detailLink: string;
}) {
  const gallery = galleryById[item.id] ?? [];
  const fallback = fallbackImageById[item.id];
  const interval = intervalMsById[item.id] ?? 3800;

  return (
    <article
      className="group bg-white border border-black/8 overflow-hidden flex flex-col"
      style={{ borderRadius: "2px" }}
    >
      <div
        className="overflow-hidden transition-transform duration-700 group-hover:scale-[1.03]"
        style={{ aspectRatio: "16/10" }}
      >
        {gallery.length > 0 ? (
          <RotatingImage
            images={[...gallery]}
            alt={item.alt}
            intervalMs={interval}
          />
        ) : fallback ? (
          <ImageWithFallback
            src={fallback}
            alt={item.alt}
            className="w-full h-full object-cover"
          />
        ) : null}
      </div>

      <div className="p-6 flex flex-col flex-1">
        <h3
          className="text-black"
          style={{ fontSize: "20px", fontWeight: 700, letterSpacing: "-0.02em" }}
        >
          {item.title}
        </h3>
        {item.description && (
          <p
            className="text-black/55 mt-3 mb-5 leading-relaxed flex-1"
            style={{ fontSize: "14px" }}
          >
            {item.description}
          </p>
        )}
        {item.href && (
          <a
            href={item.href}
            className="mt-4 inline-flex items-center gap-1 text-black font-bold border-b-2 border-black pb-0.5 hover:border-[#00C2D1] hover:text-[#00C2D1] transition-colors duration-200 self-start"
            style={{ fontSize: "13px" }}
          >
            {detailLink}
            <span className="transition-transform duration-200 group-hover:translate-x-1">
              →
            </span>
          </a>
        )}
      </div>
    </article>
  );
}

function GroupHeader({ title }: { title: string }) {
  return (
    <div className="mb-6 md:mb-12">
      <h2
        className="text-black"
        style={{
          fontSize: "clamp(22px, 5vw, 48px)",
          fontWeight: 900,
          letterSpacing: "-0.03em",
          lineHeight: 1.05,
        }}
      >
        {title}
      </h2>
      <div className="mt-3 md:mt-4 w-12 h-0.5" style={{ backgroundColor: "#00C2D1" }} />
    </div>
  );
}

export function Activities({ dict }: { dict: Dictionary }) {
  const activityItems = dict.activities.items.filter((i) => i.group === "activities");
  const relaxItems = dict.activities.items.filter((i) => i.group === "relaxDine");

  return (
    <section
      id="activities"
      className="py-14 md:py-24 px-5 md:px-8"
      style={{ backgroundColor: "#ffffff" }}
    >
      <div className="max-w-7xl mx-auto">
        <div className="scroll-mt-20">
          <GroupHeader title={dict.activities.title} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6 mb-14 md:mb-24">
          {activityItems.map((item) => (
            <ActivityCard key={item.id} item={item} detailChip={dict.activities.detailChip} />
          ))}
        </div>

        <div id="relax-dine" className="scroll-mt-20">
          <GroupHeader title={dict.activities.relaxTitle} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {relaxItems.map((item) => (
            <DetailCard key={item.id} item={item} detailLink={dict.activities.detailLink} />
          ))}
        </div>
      </div>
    </section>
  );
}
