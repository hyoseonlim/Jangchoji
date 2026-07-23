import { ImageWithFallback } from "./figma/ImageWithFallback";
import { RotatingImage } from "./ui/RotatingImage";
import { galleries } from "../data/imageGalleries";
import type { Dictionary, Locale } from "@/i18n";

type ActivityItem = Dictionary["activities"]["items"][number];

const detailSlugs = new Set([
  "rides",
  "ski",
  "wakesurf",
  "waterpark",
  "bbq",
  "cafe",
  "rooftop",
  "stay",
]);

function resolveHref(item: ActivityItem, locale: Locale): string | undefined {
  if (detailSlugs.has(item.id)) return `/${locale}/activities/${item.id}`;
  return item.href;
}

const galleryById: Record<string, readonly string[]> = {
  rides: galleries.rides,
  ski: galleries.ski,
  wakesurf: galleries.surf,
  waterpark: galleries.waterpark,
  bbq: galleries.bbq,
  cafe: galleries.cafe,
  rooftop: galleries.rooftop,
  stay: galleries.stay,
};

const fallbackImageById: Record<string, string | undefined> = {};

const intervalMsById: Record<string, number | undefined> = {
  ski: 4400,
  wakesurf: 4400,
  stay: 5000,
};

function ActivityCard({
  item,
  detailChip,
  href,
}: {
  item: ActivityItem;
  detailChip: string;
  href?: string;
}) {
  const clickable = Boolean(href);
  const gallery = galleryById[item.id] ?? [];
  const fallback = fallbackImageById[item.id];
  const interval = intervalMsById[item.id] ?? 3800;

  const header = (
    <div
      className="flex items-center justify-between gap-2 px-4 py-3 md:px-5 md:py-4"
      style={{ backgroundColor: "#111" }}
    >
      <h3
        className="text-white min-w-0 truncate"
        style={{
          fontSize: "clamp(15px, 4.2vw, 18px)",
          fontWeight: 800,
          letterSpacing: "-0.02em",
          lineHeight: 1.2,
        }}
      >
        {item.title}
      </h3>
      {clickable && (
        <span
          className="inline-flex items-center gap-1 px-2 py-1 flex-shrink-0 transition-transform group-hover:-translate-y-0.5"
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
        </span>
      )}
    </div>
  );

  const image = (
    <div
      className="relative overflow-hidden bg-black w-full aspect-[16/9] md:aspect-[4/3]"
    >
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
    </div>
  );

  const commonClass =
    "group relative block overflow-hidden bg-white flex flex-col" +
    (clickable ? " cursor-pointer" : "");
  const commonStyle = {
    borderRadius: "3px",
    border: "1px solid rgba(0,0,0,0.08)",
    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
  };

  const body = (
    <>
      {header}
      {image}
    </>
  );

  return clickable && href ? (
    <a href={href} className={commonClass} style={commonStyle} aria-label={item.title}>
      {body}
    </a>
  ) : (
    <article className={commonClass} style={commonStyle} aria-label={item.title}>
      {body}
    </article>
  );
}

function DetailCard({
  item,
  detailLink,
  href,
}: {
  item: ActivityItem;
  detailLink: string;
  href?: string;
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
        {href && (
          <a
            href={href}
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

export function Activities({ dict, locale }: { dict: Dictionary; locale: Locale }) {
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-14 md:mb-24">
          {activityItems.map((item) => (
            <ActivityCard
              key={item.id}
              item={item}
              detailChip={dict.activities.detailChip}
              href={resolveHref(item, locale)}
            />
          ))}
        </div>

        <div id="relax-dine" className="scroll-mt-20">
          <GroupHeader title={dict.activities.relaxTitle} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {relaxItems.map((item) => (
            <DetailCard
              key={item.id}
              item={item}
              detailLink={dict.activities.detailLink}
              href={resolveHref(item, locale)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
