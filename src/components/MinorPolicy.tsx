"use client";

import { useState } from "react";
import type { Dictionary } from "@/i18n";

const consentFormUrl = "/images/미성년자 숙박 동의서 양식.jpg";
const consentExampleUrl = "/images/미성년자 숙박 동의서 작성예시.jpg";

export function MinorPolicy({ dict }: { dict: Dictionary }) {
  const [showExample, setShowExample] = useState(false);
  const p = dict.minorPolicy;

  return (
    <section
      id="minor-policy"
      className="py-20 px-5 md:px-8"
      style={{ backgroundColor: "#f7f7f7" }}
    >
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h2
            className="text-black"
            style={{
              fontSize: "clamp(28px, 5vw, 44px)",
              fontWeight: 900,
              letterSpacing: "-0.03em",
              lineHeight: 1.1,
            }}
          >
            {p.title}
          </h2>
          <div className="mt-4 w-12 h-0.5" style={{ backgroundColor: "#00C2D1" }} />
          <p
            className="text-black/60 mt-5"
            style={{ fontSize: "15px", lineHeight: 1.7, maxWidth: "640px" }}
          >
            <strong className="text-black">{p.introStrong1}</strong>
            {p.introMid}
            <strong className="text-black">{p.introStrong2}</strong>
            {p.introEnd}
          </p>
        </div>

        <div
          className="p-6 md:p-8 mb-4"
          style={{
            backgroundColor: "#fff",
            borderRadius: "3px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
          }}
        >
          <p
            className="text-black/50 mb-3 tracking-[0.15em] uppercase"
            style={{ fontSize: "10px", fontWeight: 700 }}
          >
            {p.docsLabel}
          </p>
          <ol
            className="mb-6 space-y-2 text-black/80"
            style={{ fontSize: "14px", lineHeight: 1.7 }}
          >
            {p.docs.map((doc, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span
                  className="flex-shrink-0 inline-flex items-center justify-center"
                  style={{
                    width: "20px",
                    height: "20px",
                    backgroundColor: "#00C2D1",
                    color: "#000",
                    fontSize: "11px",
                    fontWeight: 800,
                    borderRadius: "50%",
                    marginTop: "1px",
                  }}
                >
                  {idx + 1}
                </span>
                <span>
                  <strong className="text-black">{doc.strong}</strong>
                  {doc.rest}
                </span>
              </li>
            ))}
          </ol>

          <div
            className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
            style={{ backgroundColor: "#f5f5f5", borderRadius: "3px" }}
          >
            <div>
              <p className="text-black font-bold" style={{ fontSize: "14px" }}>
                {p.formTitle}
              </p>
              <p className="text-black/55 mt-0.5" style={{ fontSize: "12px" }}>
                {p.formSubtitle}
              </p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <a
                href={consentFormUrl}
                download={p.formDownloadFilename}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 text-black font-bold transition-transform hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  backgroundColor: "#00C2D1",
                  fontSize: "13px",
                  borderRadius: "2px",
                }}
              >
                <span aria-hidden="true">⬇</span> {p.formDownload}
              </a>
              <button
                type="button"
                onClick={() => setShowExample((v) => !v)}
                aria-expanded={showExample}
                aria-controls="consent-example"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 text-black font-bold border transition-colors"
                style={{
                  borderColor: "rgba(0,0,0,0.2)",
                  backgroundColor: showExample ? "rgba(0,0,0,0.05)" : "#fff",
                  fontSize: "13px",
                  borderRadius: "2px",
                  cursor: "pointer",
                }}
              >
                {showExample ? p.formHideExample : p.formShowExample}
              </button>
            </div>
          </div>

          {showExample && (
            <div
              id="consent-example"
              className="mt-4 overflow-hidden border"
              style={{
                borderColor: "rgba(0,0,0,0.08)",
                borderRadius: "3px",
              }}
            >
              <img
                src={consentExampleUrl}
                alt={p.formExampleAlt}
                style={{ display: "block", width: "100%", height: "auto" }}
                loading="lazy"
              />
            </div>
          )}
        </div>

        <div
          className="p-5 border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
          style={{ borderColor: "rgba(0,0,0,0.08)", borderRadius: "3px" }}
        >
          <p className="text-black/70" style={{ fontSize: "13px", lineHeight: 1.6 }}>
            {p.contactPromptPre}
            <strong className="text-black">{p.contactPromptStrong}</strong>
            {p.contactPromptPost}
          </p>
          <a
            href={`tel:${dict.brand.phone}`}
            className="flex-shrink-0 inline-flex items-center px-4 py-2 border-2 border-black text-black font-bold hover:bg-black hover:text-white transition-colors"
            style={{ fontSize: "13px", borderRadius: "2px" }}
          >
            📞 {dict.brand.phone}
          </a>
        </div>
      </div>
    </section>
  );
}
