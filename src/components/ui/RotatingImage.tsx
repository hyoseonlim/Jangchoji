"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  images: string[];
  alt: string;
  intervalMs?: number;
  className?: string;
  imgClassName?: string;
};

/**
 * Cross-fades through a list of images at a set interval.
 * Respects prefers-reduced-motion (shows only the first image).
 */
export function RotatingImage({
  images,
  alt,
  intervalMs = 3800,
  className,
  imgClassName,
}: Props) {
  const [index, setIndex] = useState(0);
  const reducedRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined" || images.length <= 1) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    reducedRef.current = mq.matches;
    if (mq.matches) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % images.length);
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [images, intervalMs]);

  if (images.length === 0) return null;

  return (
    <div
      className={className}
      style={{ position: "relative", width: "100%", height: "100%" }}
    >
      {images.map((src, i) => (
        <img
          key={src}
          src={src}
          alt={i === 0 ? alt : ""}
          aria-hidden={i === 0 ? undefined : true}
          className={imgClassName}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            opacity: i === index ? 1 : 0,
            transition: "opacity 900ms ease-in-out",
          }}
          loading={i === 0 ? "eager" : "lazy"}
          decoding="async"
        />
      ))}
    </div>
  );
}
