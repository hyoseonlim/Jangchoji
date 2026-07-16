"use client";

import { useCallback, useEffect, useState } from "react";
import { galleries } from "../data/imageGalleries";
import type { Dictionary } from "@/i18n";

export function InfoGallery({ dict }: { dict: Dictionary }) {
  const images = galleries.info;
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const info = dict.infoGallery;

  const openAt = (i: number) => {
    setIndex(i);
    setOpen(true);
  };
  const close = useCallback(() => setOpen(false), []);
  const prev = useCallback(
    () => setIndex((i) => (i - 1 + images.length) % images.length),
    [images.length],
  );
  const next = useCallback(
    () => setIndex((i) => (i + 1) % images.length),
    [images.length],
  );

  useEffect(() => {
    if (!open) return;
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
  }, [open, close, prev, next]);

  return (
    <section
      id="info-gallery"
      className="py-14 md:py-24 px-5 md:px-8 scroll-mt-20"
      style={{ backgroundColor: "#f7f7f7" }}
    >
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 md:mb-12">
          <h2
            className="text-black"
            style={{
              fontSize: "clamp(22px, 5vw, 48px)",
              fontWeight: 900,
              letterSpacing: "-0.03em",
              lineHeight: 1.05,
            }}
          >
            {info.title}
          </h2>
          <div className="mt-4 w-12 h-0.5" style={{ backgroundColor: "#00C2D1" }} />
          <p
            className="text-black/60 mt-5"
            style={{ fontSize: "15px", maxWidth: "640px", lineHeight: 1.7 }}
          >
            {info.description}
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 md:gap-3">
          {images.map((src, i) => (
            <button
              key={src}
              type="button"
              onClick={() => openAt(i)}
              className="group relative block overflow-hidden bg-white cursor-pointer"
              style={{
                aspectRatio: "1 / 1",
                border: "1px solid rgba(0,0,0,0.08)",
                borderRadius: "3px",
              }}
              aria-label={info.imageAlt.replace("{n}", String(i + 1))}
            >
              <img
                src={src}
                alt={info.imageAlt.replace("{n}", String(i + 1))}
                loading="lazy"
                decoding="async"
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </button>
          ))}
        </div>
      </div>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={info.modalTitle}
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: "rgba(0,0,0,0.92)" }}
          onClick={close}
        >
          <div className="pointer-events-none flex items-center justify-center w-full h-full px-4 py-20 md:px-20">
            <img
              src={images[index]}
              alt={info.imageAlt.replace("{n}", String(index + 1))}
              onClick={(e) => e.stopPropagation()}
              className="pointer-events-auto max-w-full max-h-full object-contain"
              style={{ borderRadius: "3px" }}
            />
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              close();
            }}
            aria-label={info.close}
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
              prev();
            }}
            aria-label={info.prev}
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
              next();
            }}
            aria-label={info.next}
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

          <div
            className="absolute z-10 bottom-4 md:bottom-6 left-1/2 -translate-x-1/2 px-3 py-1.5 text-white pointer-events-none"
            style={{
              backgroundColor: "rgba(0,0,0,0.6)",
              borderRadius: "999px",
              fontSize: "13px",
              fontWeight: 600,
            }}
          >
            {info.counter
              .replace("{current}", String(index + 1))
              .replace("{total}", String(images.length))}
          </div>
        </div>
      )}
    </section>
  );
}
