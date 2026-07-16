"use client";

import { ArrowUpRightIcon, PlayIcon, InstagramIcon } from "lucide-react";
import { useState } from "react";
import { RotatingImage } from "./ui/RotatingImage";
import { galleries } from "../data/imageGalleries";
import type { Dictionary } from "@/i18n";

const YOUTUBE_URL = "https://www.youtube.com/@JangchojiTV/videos";
const FEATURED_VIDEO_ID = "ONfOWWyodJc";
const FEATURED_VIDEO_URL = "https://youtu.be/ONfOWWyodJc?si=eYheKLbRY1zZRBt8";
const BLOG_URL = "https://m.blog.naver.com/yeji0109-?tab=1";
const INSTAGRAM_URL = "https://www.instagram.com/mad.water.ski/";
const INSTAGRAM_GRADIENT =
  "linear-gradient(135deg, #F58529 0%, #DD2A7B 50%, #8134AF 100%)";

function YoutubeThumbnail({ videoId, alt }: { videoId: string; alt: string }) {
  const [srcIndex, setSrcIndex] = useState(0);
  const sources = [
    `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
    `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
    `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
  ];
  return (
    <img
      src={sources[srcIndex]}
      alt={alt}
      onError={() => {
        if (srcIndex < sources.length - 1) setSrcIndex((i) => i + 1);
      }}
      style={{
        display: "block",
        width: "100%",
        height: "100%",
        objectFit: "cover",
      }}
      loading="lazy"
    />
  );
}

export function Channels({ dict }: { dict: Dictionary }) {
  const c = dict.channels;
  const youtubeBrand = { color: "#FF0000", bg: "#FFF5F5" };
  const blogBrand = { color: "#03C75A", bg: "#F0FAF3" };

  return (
    <section
      id="channels"
      className="py-14 md:py-24 px-5 md:px-8"
      style={{ backgroundColor: "#ffffff" }}
    >
      <div className="max-w-5xl mx-auto">
        <div className="mb-6 md:mb-12">
          <h2
            className="text-black"
            style={{
              fontSize: "clamp(24px, 5.5vw, 56px)",
              fontWeight: 900,
              letterSpacing: "-0.03em",
              lineHeight: 1.05,
            }}
          >
            {c.title}
          </h2>
          <div className="mt-4 w-12 h-0.5" style={{ backgroundColor: "#00C2D1" }} />
          <p
            className="text-black/60 mt-6"
            style={{ fontSize: "15px", lineHeight: 1.7, maxWidth: "560px" }}
          >
            {c.intro}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* YouTube card */}
          <article
            className="group relative flex flex-col p-7 border transition-all hover:-translate-y-1"
            style={{
              borderColor: "rgba(0,0,0,0.08)",
              borderRadius: "4px",
              backgroundColor: "#ffffff",
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
            }}
          >
            <div
              className="absolute top-0 left-0 right-0"
              style={{
                height: "3px",
                backgroundColor: youtubeBrand.color,
                borderRadius: "4px 4px 0 0",
              }}
            />
            <p
              className="tracking-[0.2em] uppercase"
              style={{
                fontSize: "10px",
                fontWeight: 700,
                color: youtubeBrand.color,
                marginBottom: "20px",
              }}
            >
              {c.youtube.tag}
            </p>
            <a
              href={FEATURED_VIDEO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="relative block mb-6 overflow-hidden group/video"
              style={{
                aspectRatio: "16 / 9",
                borderRadius: "3px",
                backgroundColor: "#111",
              }}
              aria-label={c.youtube.videoAria}
            >
              <YoutubeThumbnail videoId={FEATURED_VIDEO_ID} alt={c.youtube.thumbnailAlt} />
              <div
                className="absolute inset-0 transition-colors group-hover/video:bg-black/25"
                aria-hidden="true"
              />
              <div
                className="absolute inset-0 flex items-center justify-center"
                aria-hidden="true"
              >
                <span
                  className="flex items-center justify-center transition-transform group-hover/video:scale-110"
                  style={{
                    width: "54px",
                    height: "54px",
                    backgroundColor: youtubeBrand.color,
                    color: "#fff",
                    borderRadius: "50%",
                    boxShadow: "0 4px 14px rgba(0,0,0,0.35)",
                  }}
                >
                  <PlayIcon
                    size={22}
                    strokeWidth={0}
                    fill="currentColor"
                    style={{ marginLeft: "3px" }}
                  />
                </span>
              </div>
            </a>
            <div className="flex items-center justify-between gap-3 mb-2">
              <h3
                className="text-black min-w-0 truncate"
                style={{ fontSize: "20px", fontWeight: 800, letterSpacing: "-0.02em" }}
              >
                {c.youtube.name}
              </h3>
              <a
                href={YOUTUBE_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={c.youtube.cta}
                className="flex items-center justify-center flex-shrink-0 transition-transform hover:-translate-y-0.5"
                style={{
                  width: "32px",
                  height: "32px",
                  backgroundColor: youtubeBrand.color,
                  color: "#ffffff",
                  borderRadius: "50%",
                }}
              >
                <ArrowUpRightIcon size={16} strokeWidth={2.4} />
              </a>
            </div>
            <p
              className="text-black/60"
              style={{ fontSize: "14px", lineHeight: 1.65 }}
            >
              {c.youtube.description}
            </p>
          </article>

          {/* Blog card */}
          <a
            href={BLOG_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative flex flex-col p-7 border transition-all hover:-translate-y-1"
            style={{
              borderColor: "rgba(0,0,0,0.08)",
              borderRadius: "4px",
              backgroundColor: "#ffffff",
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
            }}
          >
            <div
              className="absolute top-0 left-0 right-0"
              style={{
                height: "3px",
                backgroundColor: blogBrand.color,
                borderRadius: "4px 4px 0 0",
              }}
            />
            <p
              className="tracking-[0.2em] uppercase"
              style={{
                fontSize: "10px",
                fontWeight: 700,
                color: blogBrand.color,
                marginBottom: "20px",
              }}
            >
              {c.blog.tag}
            </p>
            <div
              className="relative block mb-6 overflow-hidden"
              style={{
                aspectRatio: "16 / 9",
                borderRadius: "3px",
                backgroundColor: "#111",
              }}
            >
              <RotatingImage
                images={[...galleries.main]}
                alt={c.blog.previewAlt}
                intervalMs={4200}
              />
              <div
                className="absolute bottom-3 left-3 flex items-center justify-center"
                style={{
                  padding: "6px 10px",
                  backgroundColor: blogBrand.color,
                  color: "#fff",
                  borderRadius: "2px",
                  fontSize: "12px",
                  fontWeight: 900,
                  letterSpacing: "-0.02em",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
                }}
                aria-hidden="true"
              >
                {c.blog.overlay}
              </div>
            </div>
            <div className="flex items-center justify-between gap-3 mb-2">
              <h3
                className="text-black min-w-0 truncate"
                style={{ fontSize: "20px", fontWeight: 800, letterSpacing: "-0.02em" }}
              >
                {c.blog.name}
              </h3>
              <span
                className="flex items-center justify-center flex-shrink-0 transition-transform group-hover:-translate-y-0.5"
                style={{
                  width: "32px",
                  height: "32px",
                  backgroundColor: blogBrand.color,
                  color: "#ffffff",
                  borderRadius: "50%",
                }}
                aria-hidden="true"
              >
                <ArrowUpRightIcon size={16} strokeWidth={2.4} />
              </span>
            </div>
            <p
              className="text-black/60"
              style={{ fontSize: "14px", lineHeight: 1.65 }}
            >
              {c.blog.description}
            </p>
          </a>

          {/* Instagram card */}
          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative flex flex-col p-7 border transition-all hover:-translate-y-1"
            style={{
              borderColor: "rgba(0,0,0,0.08)",
              borderRadius: "4px",
              backgroundColor: "#ffffff",
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
            }}
          >
            <div
              className="absolute top-0 left-0 right-0"
              style={{
                height: "3px",
                background: INSTAGRAM_GRADIENT,
                borderRadius: "4px 4px 0 0",
              }}
            />
            <p
              className="tracking-[0.2em] uppercase"
              style={{
                fontSize: "10px",
                fontWeight: 700,
                color: "#DD2A7B",
                marginBottom: "20px",
              }}
            >
              {c.instagram.tag}
            </p>
            <div
              className="relative block mb-6 overflow-hidden"
              style={{
                aspectRatio: "16 / 9",
                borderRadius: "3px",
                backgroundColor: "#111",
              }}
            >
              <RotatingImage
                images={[...galleries.main].reverse()}
                alt={c.instagram.previewAlt}
                intervalMs={4600}
              />
              <div
                className="absolute bottom-3 left-3 flex items-center justify-center"
                style={{
                  padding: "6px 8px",
                  background: INSTAGRAM_GRADIENT,
                  color: "#fff",
                  borderRadius: "2px",
                  fontSize: "12px",
                  fontWeight: 900,
                  letterSpacing: "-0.02em",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
                }}
                aria-hidden="true"
              >
                <InstagramIcon size={14} strokeWidth={2.4} />
              </div>
            </div>
            <div className="flex items-center justify-between gap-3 mb-2">
              <h3
                className="text-black min-w-0 truncate"
                style={{ fontSize: "20px", fontWeight: 800, letterSpacing: "-0.02em" }}
              >
                {c.instagram.name}
              </h3>
              <span
                className="flex items-center justify-center flex-shrink-0 transition-transform group-hover:-translate-y-0.5"
                style={{
                  width: "32px",
                  height: "32px",
                  background: INSTAGRAM_GRADIENT,
                  color: "#ffffff",
                  borderRadius: "50%",
                }}
                aria-hidden="true"
              >
                <ArrowUpRightIcon size={16} strokeWidth={2.4} />
              </span>
            </div>
            <p
              className="text-black/60"
              style={{ fontSize: "14px", lineHeight: 1.65 }}
            >
              {c.instagram.description}
            </p>
          </a>
        </div>
      </div>
    </section>
  );
}
