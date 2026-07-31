"use client";

import { useCallback, useEffect, useState } from "react";
import type { Dictionary } from "@/i18n";
import { galleries } from "@/data/imageGalleries";
import { assetUrl } from "@/lib/assetUrl";

type ActivitySlug =
  | "rides"
  | "ski"
  | "wakesurf"
  | "waterpark"
  | "bbq"
  | "cafe"
  | "rooftop"
  | "stay";

const galleryBySlug: Record<Exclude<ActivitySlug, "stay" | "rides">, readonly string[]> = {
  ski: galleries.activityDetails.ski,
  wakesurf: galleries.activityDetails.wakesurf,
  waterpark: galleries.activityDetails.waterpark,
  bbq: galleries.activityDetails.bbq,
  cafe: galleries.activityDetails.cafe,
  rooftop: galleries.activityDetails.rooftop,
};

const rideImageByNo: Record<number, string> = {
  1: assetUrl("/images/rides/flyfish.webp"),
  2: assetUrl("/images/rides/ufo.webp"),
  3: assetUrl("/images/rides/waffle.webp"),
  4: assetUrl("/images/rides/wild_pang_pang.webp"),
  5: assetUrl("/images/rides/bandwagon.webp"),
  6: assetUrl("/images/rides/lotus.webp"),
  7: assetUrl("/images/rides/peanut_boat.webp"),
  8: assetUrl("/images/rides/banana_boat.webp"),
};

const roomImages: Record<string, readonly string[]> = {
  stay4: galleries.activityDetails.stay4,
  stay5: galleries.activityDetails.stay5,
  stay6: galleries.activityDetails.stay6,
  stay8: galleries.activityDetails.stay8,
};

function useLightbox(images: readonly string[]) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const close = useCallback(() => setOpenIndex(null), []);
  const prev = useCallback(
    () =>
      setOpenIndex((i) =>
        i === null ? null : (i - 1 + images.length) % images.length,
      ),
    [images.length],
  );
  const next = useCallback(
    () => setOpenIndex((i) => (i === null ? null : (i + 1) % images.length)),
    [images.length],
  );

  useEffect(() => {
    if (openIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowLeft") prev();
      else if (e.key === "ArrowRight") next();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [openIndex, close, prev, next]);

  return { openIndex, setOpenIndex, close, prev, next };
}

function Lightbox({
  images,
  index,
  onClose,
  onPrev,
  onNext,
  alt,
  closeLabel,
  prevLabel,
  nextLabel,
}: {
  images: readonly string[];
  index: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  alt: string;
  closeLabel: string;
  prevLabel: string;
  nextLabel: string;
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.92)" }}
      onClick={onClose}
    >
      <div
        className="pointer-events-none flex items-center justify-center w-full h-full px-4 py-20 md:px-20"
      >
        <img
          src={images[index]}
          alt={alt}
          onClick={(e) => e.stopPropagation()}
          className="pointer-events-auto max-w-full max-h-full object-contain"
          style={{ borderRadius: "3px" }}
        />
      </div>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        aria-label={closeLabel}
        className="absolute z-10 top-4 right-4 md:top-6 md:right-6 flex items-center justify-center text-white hover:text-[#00C2D1] transition-colors"
        style={{
          width: "44px",
          height: "44px",
          backgroundColor: "rgba(0,0,0,0.6)",
          borderRadius: "50%",
          fontSize: "20px",
        }}
      >
        ✕
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onPrev();
        }}
        aria-label={prevLabel}
        className="absolute z-10 left-2 md:left-6 top-1/2 -translate-y-1/2 flex items-center justify-center text-white hover:text-[#00C2D1] transition-colors"
        style={{
          width: "44px",
          height: "44px",
          backgroundColor: "rgba(0,0,0,0.6)",
          borderRadius: "50%",
          fontSize: "22px",
        }}
      >
        ‹
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onNext();
        }}
        aria-label={nextLabel}
        className="absolute z-10 right-2 md:right-6 top-1/2 -translate-y-1/2 flex items-center justify-center text-white hover:text-[#00C2D1] transition-colors"
        style={{
          width: "44px",
          height: "44px",
          backgroundColor: "rgba(0,0,0,0.6)",
          borderRadius: "50%",
          fontSize: "22px",
        }}
      >
        ›
      </button>
    </div>
  );
}

export function ActivityDetail({
  slug,
  dict,
  locale,
}: {
  slug: ActivitySlug;
  dict: Dictionary;
  locale: string;
}) {
  const content = dict.detailPages.items[slug];
  const isStay = slug === "stay";
  const isRides = slug === "rides";
  const generalImages =
    isStay || isRides
      ? ([] as readonly string[])
      : galleryBySlug[slug as Exclude<ActivitySlug, "stay" | "rides">];

  const lightbox = useLightbox(generalImages);
  const priceFormatter = new Intl.NumberFormat(dict.pricing.priceLocale);
  const won = (n: number) => `₩${priceFormatter.format(n)}`;

  return (
    <div
      style={{ backgroundColor: "#ffffff", minHeight: "100vh" }}
      className="pt-24 md:pt-28 pb-16 md:pb-20 px-5 md:px-8"
    >
      <div className="max-w-5xl mx-auto">
        <a
          href={`/${locale}#activities`}
          className="inline-flex items-center text-black/60 hover:text-black transition-colors mb-6 md:mb-8"
          style={{ fontSize: "13px", fontWeight: 600 }}
        >
          {dict.detailPages.backLabel}
        </a>

        <header className="mb-10 md:mb-14">
          <h1
            className="text-black"
            style={{
              fontSize: "clamp(28px, 6vw, 56px)",
              fontWeight: 900,
              letterSpacing: "-0.03em",
              lineHeight: 1.05,
            }}
          >
            {content.title}
          </h1>
          <div className="mt-4 w-12 h-0.5" style={{ backgroundColor: "#00C2D1" }} />
          <p
            className="text-black/60 mt-4"
            style={{ fontSize: "15px", fontWeight: 600 }}
          >
            {content.subtitle}
          </p>
          <p
            className="text-black/70 mt-5"
            style={{ fontSize: "15px", lineHeight: 1.8, maxWidth: "720px" }}
          >
            {content.intro}
          </p>
        </header>

        {content.prices.length > 0 && (
          <section className="mb-12">
            <h2
              className="text-black mb-4"
              style={{ fontSize: "20px", fontWeight: 800, letterSpacing: "-0.02em" }}
            >
              {dict.detailPages.priceHeading}
            </h2>
            <ul
              className="bg-white"
              style={{
                border: "1px solid rgba(0,0,0,0.08)",
                borderRadius: "3px",
              }}
            >
              {content.prices.map((p, i) => {
                const note = "note" in p ? p.note : undefined;
                return (
                  <li
                    key={p.label}
                    className="flex items-baseline justify-between gap-3 py-4 px-5"
                    style={{
                      borderTop:
                        i === 0 ? "none" : "1px solid rgba(0,0,0,0.06)",
                    }}
                  >
                    <div className="min-w-0 flex-1">
                      <p
                        className="text-black"
                        style={{ fontSize: "15px", fontWeight: 600 }}
                      >
                        {p.label}
                      </p>
                      {note && (
                        <p
                          className="text-black/50 mt-0.5"
                          style={{ fontSize: "12px" }}
                        >
                          {note}
                        </p>
                      )}
                    </div>
                    <span
                      className="text-black flex-shrink-0"
                      style={{ fontSize: "17px", fontWeight: 800 }}
                    >
                      {won(p.price)}
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {content.info.length > 0 && (
          <section className="mb-12">
            <h2
              className="text-black mb-4"
              style={{ fontSize: "20px", fontWeight: 800, letterSpacing: "-0.02em" }}
            >
              {dict.detailPages.infoHeading}
            </h2>
            <ul
              className="space-y-2 text-black/75 bg-white p-5 md:p-6"
              style={{
                fontSize: "14px",
                lineHeight: 1.8,
                border: "1px solid rgba(0,0,0,0.08)",
                borderRadius: "3px",
              }}
            >
              {content.info.map((line) => (
                <li key={line} className="flex items-start gap-2">
                  <span style={{ color: "#00C2D1", flexShrink: 0 }}>•</span>
                  {line}
                </li>
              ))}
            </ul>
          </section>
        )}

        {isStay ? (
          <StayRooms dict={dict} />
        ) : isRides ? (
          <RidesList dict={dict} />
        ) : (
          generalImages.length > 0 && (
            <section>
              <h2
                className="text-black mb-4"
                style={{ fontSize: "20px", fontWeight: 800, letterSpacing: "-0.02em" }}
              >
                {dict.detailPages.galleryHeading}
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 md:gap-3">
                {generalImages.map((src, i) => (
                  <button
                    key={src}
                    type="button"
                    onClick={() => lightbox.setOpenIndex(i)}
                    className="group relative block overflow-hidden bg-white cursor-pointer"
                    style={{
                      aspectRatio: "1 / 1",
                      border: "1px solid rgba(0,0,0,0.08)",
                      borderRadius: "3px",
                    }}
                    aria-label={`${content.title} ${i + 1}`}
                  >
                    <img
                      src={src}
                      alt={`${content.title} ${i + 1}`}
                      loading="lazy"
                      decoding="async"
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </button>
                ))}
              </div>
              {lightbox.openIndex !== null && (
                <Lightbox
                  images={generalImages}
                  index={lightbox.openIndex}
                  onClose={lightbox.close}
                  onPrev={lightbox.prev}
                  onNext={lightbox.next}
                  alt={content.title}
                  closeLabel={dict.infoGallery.close}
                  prevLabel={dict.infoGallery.prev}
                  nextLabel={dict.infoGallery.next}
                />
              )}
            </section>
          )
        )}
      </div>
    </div>
  );
}

function StayRooms({ dict }: { dict: Dictionary }) {
  const stay = dict.detailPages.items.stay;
  const [openRoom, setOpenRoom] = useState<{ key: string; index: number } | null>(
    null,
  );

  const activeImages = openRoom ? roomImages[openRoom.key] : [];

  const close = useCallback(() => setOpenRoom(null), []);
  const prev = useCallback(() => {
    setOpenRoom((cur) =>
      cur
        ? {
            ...cur,
            index:
              (cur.index - 1 + roomImages[cur.key].length) %
              roomImages[cur.key].length,
          }
        : null,
    );
  }, []);
  const next = useCallback(() => {
    setOpenRoom((cur) =>
      cur
        ? {
            ...cur,
            index: (cur.index + 1) % roomImages[cur.key].length,
          }
        : null,
    );
  }, []);

  useEffect(() => {
    if (!openRoom) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowLeft") prev();
      else if (e.key === "ArrowRight") next();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [openRoom, close, prev, next]);

  return (
    <>
      <section className="mb-12">
        <h2
          className="text-black mb-4"
          style={{ fontSize: "20px", fontWeight: 800, letterSpacing: "-0.02em" }}
        >
          {dict.detailPages.galleryHeading}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5">
          {stay.rooms.map((room) => {
            const images = roomImages[room.key] ?? [];
            const first = images[0];
            return (
              <button
                key={room.key}
                type="button"
                onClick={() => images.length > 0 && setOpenRoom({ key: room.key, index: 0 })}
                className="group text-left bg-white overflow-hidden flex flex-col"
                style={{
                  border: "1px solid rgba(0,0,0,0.08)",
                  borderRadius: "3px",
                  cursor: images.length > 0 ? "pointer" : "default",
                }}
              >
                {first && (
                  <div className="relative overflow-hidden" style={{ aspectRatio: "4 / 3" }}>
                    <img
                      src={first}
                      alt={room.title}
                      loading="lazy"
                      decoding="async"
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                )}
                <div className="p-5">
                  <p
                    className="text-black"
                    style={{ fontSize: "17px", fontWeight: 800, letterSpacing: "-0.02em" }}
                  >
                    {room.title}
                  </p>
                  <p
                    className="text-black/60 mt-1"
                    style={{ fontSize: "13px" }}
                  >
                    {room.desc}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <section className="mb-4">
        <h2
          className="text-black mb-4"
          style={{ fontSize: "20px", fontWeight: 800, letterSpacing: "-0.02em" }}
        >
          {stay.amenities.title}
        </h2>
        <div
          className="bg-white p-5 md:p-6"
          style={{
            border: "1px solid rgba(0,0,0,0.08)",
            borderRadius: "3px",
          }}
        >
          <ul
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-4 gap-y-2 text-black/75"
            style={{ fontSize: "14px", lineHeight: 1.7 }}
          >
            {stay.amenities.items.map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span style={{ color: "#00C2D1", flexShrink: 0 }}>•</span>
                {item}
              </li>
            ))}
          </ul>
          <p
            className="mt-4 text-black/60"
            style={{ fontSize: "13px", lineHeight: 1.7 }}
          >
            {stay.amenities.note}
          </p>
        </div>
      </section>

      {openRoom && activeImages.length > 0 && (
        <Lightbox
          images={activeImages}
          index={openRoom.index}
          onClose={close}
          onPrev={prev}
          onNext={next}
          alt={stay.rooms.find((r) => r.key === openRoom.key)?.title ?? ""}
          closeLabel={dict.infoGallery.close}
          prevLabel={dict.infoGallery.prev}
          nextLabel={dict.infoGallery.next}
        />
      )}
    </>
  );
}

function RidesList({ dict }: { dict: Dictionary }) {
  const gallery = galleries.activityDetails.rides;
  const lightbox = useLightbox(gallery);

  return (
    <section>
      <div
        className="mb-6 p-4 md:p-5 flex items-start gap-3"
        style={{
          backgroundColor: "rgba(0,194,209,0.10)",
          border: "1px solid rgba(0,194,209,0.35)",
          borderRadius: "3px",
        }}
      >
        <span style={{ fontSize: "20px", flexShrink: 0 }} aria-hidden="true">
          🎉
        </span>
        <p
          className="text-black"
          style={{ fontSize: "14px", lineHeight: 1.6, fontWeight: 600 }}
        >
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
              className="flex flex-col bg-white overflow-hidden"
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

      {gallery.length > 0 && (
        <div className="mt-12">
          <h2
            className="text-black mb-4"
            style={{ fontSize: "20px", fontWeight: 800, letterSpacing: "-0.02em" }}
          >
            {dict.detailPages.galleryHeading}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 md:gap-3">
            {gallery.map((src, i) => (
              <button
                key={src}
                type="button"
                onClick={() => lightbox.setOpenIndex(i)}
                className="group relative block overflow-hidden bg-white cursor-pointer"
                style={{
                  aspectRatio: "1 / 1",
                  border: "1px solid rgba(0,0,0,0.08)",
                  borderRadius: "3px",
                }}
                aria-label={`${dict.detailPages.items.rides.title} ${i + 1}`}
              >
                <img
                  src={src}
                  alt={`${dict.detailPages.items.rides.title} ${i + 1}`}
                  loading="lazy"
                  decoding="async"
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </button>
            ))}
          </div>
          {lightbox.openIndex !== null && (
            <Lightbox
              images={gallery}
              index={lightbox.openIndex}
              onClose={lightbox.close}
              onPrev={lightbox.prev}
              onNext={lightbox.next}
              alt={dict.detailPages.items.rides.title}
              closeLabel={dict.infoGallery.close}
              prevLabel={dict.infoGallery.prev}
              nextLabel={dict.infoGallery.next}
            />
          )}
        </div>
      )}
    </section>
  );
}
