"use client";

import { useState } from "react";
import {
  BusIcon,
  MapPinIcon,
  PhoneIcon,
  TruckIcon,
  CopyIcon,
  CheckIcon,
} from "lucide-react";
import type { Dictionary } from "@/i18n";

function CopyButton({
  text,
  ariaLabel,
  doneLabel,
  copyLabel,
}: {
  text: string;
  ariaLabel: string;
  doneLabel: string;
  copyLabel: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard unavailable — no-op */
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={ariaLabel}
      className="inline-flex items-center gap-1 px-2 py-1 transition-colors"
      style={{
        border: "1px solid rgba(0,0,0,0.15)",
        backgroundColor: copied ? "rgba(0,194,209,0.15)" : "#fff",
        color: copied ? "#009aa8" : "#111",
        fontSize: "11px",
        fontWeight: 700,
        borderRadius: "2px",
        cursor: "pointer",
      }}
    >
      {copied ? (
        <>
          <CheckIcon size={12} /> {doneLabel}
        </>
      ) : (
        <>
          <CopyIcon size={12} /> {copyLabel}
        </>
      )}
    </button>
  );
}

export function Directions({ dict }: { dict: Dictionary }) {
  const d = dict.directions;
  const mapQueryEncoded = encodeURIComponent(dict.brand.address.query);
  const googleMapEmbed = `https://www.google.com/maps?q=${mapQueryEncoded}&hl=${dict.locale}&z=17&output=embed`;
  const naverMapLink =
    "https://map.naver.com/p/entry/place/38018802?c=15.00,0,0,0,dh&placePath=%2Fhome%3Ffrom%3Dmap%26fromPanelNum%3D1%26additionalHeight%3D76%26timestamp%3D202607041620%26locale%3Dko%26svcName%3Dmap_pcv5";
  const kakaoMapLink = "https://place.map.kakao.com/2004152512";

  return (
    <section
      id="directions"
      className="py-14 md:py-24 px-5 md:px-8"
      style={{ backgroundColor: "#f7f7f7" }}
    >
      <div className="max-w-7xl mx-auto">
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
            {d.title}
          </h2>
          <div className="mt-4 w-12 h-0.5" style={{ backgroundColor: "#00C2D1" }} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-10">
          {/* Address card */}
          <div
            className="p-6 md:p-8 bg-white flex flex-col"
            style={{
              border: "1px solid rgba(0,0,0,0.08)",
              borderRadius: "3px",
            }}
          >
            <div className="flex items-start gap-4 mb-5">
              <div
                className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full"
                style={{ backgroundColor: "rgba(0,194,209,0.12)" }}
              >
                <MapPinIcon size={18} style={{ color: "#00C2D1" }} />
              </div>
              <div>
                <h3
                  className="text-black"
                  style={{
                    fontSize: "18px",
                    fontWeight: 800,
                    letterSpacing: "-0.02em",
                  }}
                >
                  {d.address.title}
                </h3>
                <p className="text-black/60 mt-0.5" style={{ fontSize: "13px" }}>
                  {d.address.postalCodeLabel} {dict.brand.address.postalCode}
                </p>
              </div>
            </div>

            <div className="space-y-4 mb-5">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span
                    className="inline-block px-1.5 py-0.5"
                    style={{
                      backgroundColor: "#111",
                      color: "#fff",
                      fontSize: "10px",
                      fontWeight: 700,
                      borderRadius: "2px",
                    }}
                  >
                    {d.address.roadTag}
                  </span>
                  <CopyButton
                    text={dict.brand.address.road}
                    ariaLabel={`${d.address.roadAria} ${d.address.copyAriaSuffix}`}
                    doneLabel={d.address.copyDone}
                    copyLabel={d.address.copyLabel}
                  />
                </div>
                <p
                  className="text-black"
                  style={{ fontSize: "15px", fontWeight: 500, lineHeight: 1.5 }}
                >
                  {dict.brand.address.road}
                </p>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span
                    className="inline-block px-1.5 py-0.5"
                    style={{
                      backgroundColor: "rgba(0,0,0,0.08)",
                      color: "#111",
                      fontSize: "10px",
                      fontWeight: 700,
                      borderRadius: "2px",
                    }}
                  >
                    {d.address.parcelTag}
                  </span>
                  <CopyButton
                    text={dict.brand.address.parcel}
                    ariaLabel={`${d.address.parcelAria} ${d.address.copyAriaSuffix}`}
                    doneLabel={d.address.copyDone}
                    copyLabel={d.address.copyLabel}
                  />
                </div>
                <p
                  className="text-black/80"
                  style={{ fontSize: "14px", lineHeight: 1.5 }}
                >
                  {dict.brand.address.parcel}
                </p>
              </div>
            </div>

            <div className="mt-auto flex flex-wrap gap-2">
              <a
                href={naverMapLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-2 text-white font-bold transition-opacity hover:opacity-90"
                style={{
                  backgroundColor: "#03C75A",
                  fontSize: "13px",
                  borderRadius: "2px",
                }}
              >
                <span
                  className="inline-flex items-center justify-center"
                  style={{
                    width: "16px",
                    height: "16px",
                    backgroundColor: "#fff",
                    color: "#03C75A",
                    fontSize: "10px",
                    fontWeight: 900,
                    borderRadius: "2px",
                  }}
                >
                  N
                </span>
                {d.address.naver}
              </a>
              <a
                href={kakaoMapLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-2 font-bold transition-opacity hover:opacity-90"
                style={{
                  backgroundColor: "#FEE500",
                  color: "#3C1E1E",
                  fontSize: "13px",
                  borderRadius: "2px",
                }}
              >
                💬 {d.address.kakao}
              </a>
            </div>
          </div>

          {/* Map iframe */}
          <div
            className="overflow-hidden bg-white"
            style={{
              border: "1px solid rgba(0,0,0,0.08)",
              borderRadius: "3px",
              minHeight: "320px",
            }}
          >
            <iframe
              title={`${dict.brand.displayName} ${d.address.mapTitleSuffix}`}
              src={googleMapEmbed}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              style={{
                border: 0,
                width: "100%",
                height: "100%",
                minHeight: "320px",
                display: "block",
              }}
            />
          </div>
        </div>

        {/* Bus section */}
        <section
          className="mb-6 p-6 md:p-8 bg-white"
          style={{
            border: "1px solid rgba(0,0,0,0.08)",
            borderRadius: "3px",
          }}
          aria-labelledby="bus-title"
        >
          <div className="flex items-start gap-4 mb-6">
            <div
              className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full"
              style={{ backgroundColor: "rgba(0,194,209,0.12)" }}
            >
              <BusIcon size={18} style={{ color: "#00C2D1" }} />
            </div>
            <div>
              <h3
                id="bus-title"
                className="text-black"
                style={{ fontSize: "20px", fontWeight: 800, letterSpacing: "-0.02em" }}
              >
                {d.bus.title}
              </h3>
              <p className="text-black/60 mt-1" style={{ fontSize: "14px" }}>
                {d.bus.subtitlePre}
                <strong className="text-black">{d.bus.subtitleStation}</strong>
                {d.bus.subtitlePost}
              </p>
            </div>
          </div>

          <div
            className="mb-6 p-4 flex items-start gap-3"
            style={{
              backgroundColor: "#fef9c3",
              border: "1px solid #fde68a",
              borderRadius: "3px",
            }}
          >
            <span style={{ fontSize: "18px", flexShrink: 0 }} aria-hidden="true">
              💡
            </span>
            <p className="text-black" style={{ fontSize: "13px", lineHeight: 1.6 }}>
              {d.bus.warning.pre}
              <strong>{d.bus.warning.strong1}</strong>
              {d.bus.warning.mid}
              <strong>{d.bus.warning.strong2}</strong>
              {d.bus.warning.post}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {d.bus.routes.map((route) => (
              <div
                key={route.no}
                className="p-5"
                style={{
                  border: "1px solid rgba(0,0,0,0.08)",
                  borderRadius: "3px",
                  backgroundColor: "#fafafa",
                }}
              >
                <div className="flex items-baseline justify-between gap-3 mb-3">
                  <span
                    className="text-black"
                    style={{
                      fontSize: "20px",
                      fontWeight: 900,
                      letterSpacing: "-0.02em",
                    }}
                  >
                    {route.no}
                    {d.bus.routeNoSuffix}
                  </span>
                  <span
                    className="text-black/60"
                    style={{ fontSize: "12px", fontWeight: 600 }}
                  >
                    {route.stops} · {route.duration}
                  </span>
                </div>

                <p
                  className="text-black/50 mb-1 tracking-[0.15em] uppercase"
                  style={{ fontSize: "10px", fontWeight: 700 }}
                >
                  {d.bus.timesLabel}
                </p>
                <ul className="flex flex-wrap gap-1.5 mb-4">
                  {route.times.map((t) => (
                    <li
                      key={t}
                      className="inline-block px-2 py-1"
                      style={{
                        backgroundColor: "#fff",
                        border: "1px solid rgba(0,0,0,0.08)",
                        borderRadius: "2px",
                        fontSize: "12px",
                        color: "#111",
                        fontWeight: 600,
                      }}
                    >
                      {t}
                    </li>
                  ))}
                </ul>

                <p
                  className="text-black/50 mb-2 tracking-[0.15em] uppercase"
                  style={{ fontSize: "10px", fontWeight: 700 }}
                >
                  {d.bus.walkLabel}
                </p>
                <ol
                  className="space-y-1.5 text-black/70"
                  style={{ fontSize: "13px", lineHeight: 1.6 }}
                >
                  {route.walkingGuide.map((step, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span
                        className="flex-shrink-0 inline-flex items-center justify-center"
                        style={{
                          width: "18px",
                          height: "18px",
                          backgroundColor: "#00C2D1",
                          color: "#000",
                          fontSize: "10px",
                          fontWeight: 800,
                          borderRadius: "50%",
                          marginTop: "1px",
                        }}
                      >
                        {idx + 1}
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>

          <div
            className="mt-5 p-4 flex flex-wrap items-center gap-3"
            style={{
              backgroundColor: "#fafafa",
              border: "1px solid rgba(0,0,0,0.08)",
              borderRadius: "3px",
            }}
          >
            <PhoneIcon size={16} style={{ color: "#00C2D1", flexShrink: 0 }} />
            <p className="text-black/70" style={{ fontSize: "13px" }}>
              {d.bus.contactPre}
              <strong className="text-black">{d.bus.contactName}</strong>{" "}
              <a
                href={`tel:${d.bus.contactPhone}`}
                className="text-black font-bold hover:underline"
              >
                {d.bus.contactPhone}
              </a>
              <span className="text-black/50 ml-2">{d.bus.contactNote}</span>
            </p>
          </div>
        </section>

        {/* Pickup service */}
        <section
          id="pickup"
          className="mb-6 p-6 md:p-8 bg-white scroll-mt-20"
          style={{
            border: "1px solid rgba(0,0,0,0.08)",
            borderRadius: "3px",
          }}
          aria-labelledby="pickup-title"
        >
          <div className="flex items-start gap-4 mb-6">
            <div
              className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full"
              style={{ backgroundColor: "rgba(0,194,209,0.12)" }}
            >
              <TruckIcon size={18} style={{ color: "#00C2D1" }} />
            </div>
            <div>
              <h3
                id="pickup-title"
                className="text-black"
                style={{ fontSize: "20px", fontWeight: 800, letterSpacing: "-0.02em" }}
              >
                {d.pickup.title}
              </h3>
              <p className="text-black/60 mt-1" style={{ fontSize: "14px" }}>
                {d.pickup.subtitle}
              </p>
            </div>
          </div>

          <ol className="mb-5 space-y-2.5">
            {d.pickup.steps.map((step, idx) => (
              <li
                key={idx}
                className="flex items-start gap-3 text-black/75"
                style={{ fontSize: "14px", lineHeight: 1.6 }}
              >
                <span
                  className="flex-shrink-0 inline-flex items-center justify-center"
                  style={{
                    width: "22px",
                    height: "22px",
                    backgroundColor: "#111",
                    color: "#fff",
                    fontSize: "11px",
                    fontWeight: 800,
                    borderRadius: "50%",
                    marginTop: "1px",
                  }}
                >
                  {idx + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>

          <div
            className="p-4"
            style={{ backgroundColor: "#f5f5f5", borderRadius: "3px" }}
          >
            <p className="text-black font-bold mb-1.5" style={{ fontSize: "13px" }}>
              {d.pickup.conditionTitle}
            </p>
            <p className="text-black/70" style={{ fontSize: "13px", lineHeight: 1.7 }}>
              {d.pickup.conditionPre}
              <strong className="text-black">{d.pickup.conditionStrong1}</strong>
              {d.pickup.conditionMid}
              <strong className="text-black">{d.pickup.conditionStrong2}</strong>
              {d.pickup.conditionPost}
              <br />
              {d.pickup.conditionExtra}
            </p>
          </div>
        </section>

        {/* Phone card */}
        <div
          className="p-6 border-2"
          style={{ borderColor: "#00C2D1", borderRadius: "3px" }}
        >
          <div className="flex items-center gap-4 flex-wrap">
            <PhoneIcon size={22} style={{ color: "#00C2D1" }} />
            <div>
              <p className="text-black/50" style={{ fontSize: "12px" }}>
                {d.phoneLabel}
              </p>
              <a
                href={`tel:${dict.brand.phone}`}
                className="text-black hover:underline"
                style={{ fontSize: "22px", fontWeight: 900, letterSpacing: "-0.02em" }}
              >
                {dict.brand.phone}
              </a>
              <p className="text-black/50 mt-0.5" style={{ fontSize: "12px" }}>
                {d.phoneOwnerLine}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
