"use client";

import { useState } from "react";
import type { Dictionary } from "@/i18n";
import { CopyableAccount } from "./CopyableAccount";

type SeasonKey = "peak" | "off";
type GroupSizeKey = "4" | "3" | "2";

export function Pricing({ dict }: { dict: Dictionary }) {
  const [season, setSeason] = useState<SeasonKey>("peak");
  const [groupSize, setGroupSize] = useState<GroupSizeKey>("4");

  const packages = dict.pricing.packages;
  const currentRows = packages.rows[season][groupSize];
  const priceFormatter = new Intl.NumberFormat(dict.pricing.priceLocale);
  const won = (n: number) => `₩${priceFormatter.format(n)}`;

  return (
    <section
      id="pricing"
      className="py-14 md:py-24 px-5 md:px-8"
      style={{ backgroundColor: "#f7f7f7" }}
    >
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 md:mb-16">
          <h2
            className="text-black"
            style={{
              fontSize: "clamp(24px, 5.5vw, 56px)",
              fontWeight: 900,
              letterSpacing: "-0.03em",
              lineHeight: 1.05,
            }}
          >
            {dict.pricing.title}
          </h2>
          <div className="mt-4 w-12 h-0.5" style={{ backgroundColor: "#00C2D1" }} />
          <p
            className="text-black/60 mt-5"
            style={{ fontSize: "15px", maxWidth: "640px", lineHeight: 1.7 }}
          >
            {dict.pricing.intro}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-20">
          {dict.pricing.groups.map((group) => (
            <section
              key={group.id}
              className="p-6 md:p-8 bg-white"
              style={{
                border: "1px solid rgba(0,0,0,0.08)",
                borderRadius: "3px",
              }}
              aria-labelledby={`price-${group.id}-title`}
            >
              <div className="mb-5">
                <h3
                  id={`price-${group.id}-title`}
                  className="text-black"
                  style={{
                    fontSize: "20px",
                    fontWeight: 800,
                    letterSpacing: "-0.02em",
                  }}
                >
                  {group.title}
                </h3>
                {group.subtitle && (
                  <p
                    className="text-black/60 mt-1"
                    style={{ fontSize: "13px", fontWeight: 600 }}
                  >
                    {group.subtitle}
                  </p>
                )}
                {group.note && (
                  <p
                    className="text-black/55 mt-2"
                    style={{ fontSize: "13px", lineHeight: 1.6 }}
                  >
                    {group.note}
                  </p>
                )}
              </div>
              <ul>
                {group.items.map((item, i) => (
                  <li
                    key={i}
                    className="flex items-baseline justify-between gap-3 py-3"
                    style={{
                      borderTop:
                        i === 0 ? "1px solid rgba(0,0,0,0.08)" : "none",
                      borderBottom: "1px solid rgba(0,0,0,0.08)",
                    }}
                  >
                    <div className="min-w-0 flex-1">
                      <p
                        className="text-black"
                        style={{ fontSize: "14px", fontWeight: 500 }}
                      >
                        {item.label}
                      </p>
                      {item.note && (
                        <p
                          className="text-black/50 mt-0.5"
                          style={{ fontSize: "12px" }}
                        >
                          {item.note}
                        </p>
                      )}
                    </div>
                    <span
                      className="text-black flex-shrink-0"
                      style={{
                        fontSize: "15px",
                        fontWeight: 800,
                        letterSpacing: "-0.01em",
                      }}
                    >
                      {won(item.price)}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <div
          className="mb-24 p-5 md:p-6"
          style={{
            backgroundColor: "#fff",
            border: "1px solid rgba(0,0,0,0.08)",
            borderRadius: "3px",
          }}
        >
          <p
            className="text-black/50 mb-3 tracking-[0.15em] uppercase"
            style={{ fontSize: "10px", fontWeight: 700 }}
          >
            {dict.pricing.common.label}
          </p>
          <div className="flex flex-wrap gap-2 mb-4">
            {dict.pricing.common.badges.map((badge) => (
              <span
                key={badge}
                className="inline-flex items-center gap-1 px-3 py-1.5"
                style={{
                  backgroundColor: "rgba(0,194,209,0.12)",
                  color: "#009aa8",
                  fontSize: "12px",
                  fontWeight: 700,
                  borderRadius: "2px",
                }}
              >
                ✓ {badge}
              </span>
            ))}
          </div>
          <div className="flex items-center gap-2 flex-wrap" style={{ fontSize: "13px", lineHeight: 1.7 }}>
            <strong className="text-black">{dict.pricing.common.transferPrefix}</strong>
            <CopyableAccount
              bankLabel={dict.brand.bank.label}
              account={dict.brand.bank.account}
              holderPrefix={dict.pricing.common.holderPrefix}
              holder={dict.brand.bank.holder}
            />
          </div>
        </div>

        <div id="packages" className="scroll-mt-20">
          <div className="mb-8">
            <h3
              className="text-black"
              style={{
                fontSize: "clamp(20px, 4.2vw, 36px)",
                fontWeight: 900,
                letterSpacing: "-0.03em",
                lineHeight: 1.1,
              }}
            >
              {packages.title}
            </h3>
            <p className="text-black/60 mt-3" style={{ fontSize: "14px" }}>
              {packages.peakLabel} <strong>{packages.peakPeriod}</strong>
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div
              role="tablist"
              aria-label={packages.seasonAria}
              className="inline-flex p-1 self-start"
              style={{
                backgroundColor: "#fff",
                border: "1px solid rgba(0,0,0,0.1)",
                borderRadius: "3px",
              }}
            >
              {(Object.keys(packages.seasonLabels) as SeasonKey[]).map((key) => {
                const active = season === key;
                return (
                  <button
                    key={key}
                    role="tab"
                    aria-selected={active}
                    onClick={() => setSeason(key)}
                    className="px-4 py-2 transition-colors"
                    style={{
                      backgroundColor: active ? "#111" : "transparent",
                      color: active ? "#fff" : "#666",
                      fontSize: "13px",
                      fontWeight: 700,
                      borderRadius: "2px",
                      cursor: "pointer",
                    }}
                  >
                    {packages.seasonLabels[key]}
                  </button>
                );
              })}
            </div>
            <div
              role="tablist"
              aria-label={packages.groupSizeAria}
              className="inline-flex p-1 self-start"
              style={{
                backgroundColor: "#fff",
                border: "1px solid rgba(0,0,0,0.1)",
                borderRadius: "3px",
              }}
            >
              {(Object.keys(packages.groupSizeLabels) as GroupSizeKey[]).map((key) => {
                const active = groupSize === key;
                return (
                  <button
                    key={key}
                    role="tab"
                    aria-selected={active}
                    onClick={() => setGroupSize(key)}
                    className="px-4 py-2 transition-colors"
                    style={{
                      backgroundColor: active ? "#00C2D1" : "transparent",
                      color: active ? "#000" : "#666",
                      fontSize: "13px",
                      fontWeight: 700,
                      borderRadius: "2px",
                      cursor: "pointer",
                    }}
                  >
                    {packages.groupSizeLabels[key]}
                  </button>
                );
              })}
            </div>
          </div>

          <div
            className="overflow-x-auto bg-white"
            style={{
              border: "1px solid rgba(0,0,0,0.08)",
              borderRadius: "3px",
            }}
          >
            <table className="w-full border-collapse" style={{ fontSize: "14px" }}>
              <caption className="sr-only">
                {packages.seasonLabels[season]} · {packages.groupSizeLabels[groupSize]} {packages.packageSuffix}
              </caption>
              <thead>
                <tr style={{ borderBottom: "2px solid #111" }}>
                  <th
                    className="text-left py-3 px-4"
                    style={{ fontWeight: 700, color: "#111" }}
                    scope="col"
                  >
                    {packages.tableHead.config}
                  </th>
                  <th
                    className="text-right py-3 px-4 whitespace-nowrap"
                    style={{ fontWeight: 700, color: "#111" }}
                    scope="col"
                  >
                    {packages.tableHead.weekday}
                  </th>
                  <th
                    className="text-right py-3 px-4 whitespace-nowrap"
                    style={{ fontWeight: 700, color: "#111" }}
                    scope="col"
                  >
                    {packages.tableHead.saturday}
                  </th>
                </tr>
              </thead>
              <tbody>
                {currentRows.map((row, i) => (
                  <tr
                    key={row.config}
                    style={{
                      borderBottom: "1px solid rgba(0,0,0,0.06)",
                      backgroundColor: i % 2 === 0 ? "transparent" : "rgba(0,0,0,0.02)",
                    }}
                  >
                    <td className="py-3.5 px-4" style={{ color: "#111" }}>
                      {row.config}
                    </td>
                    <td
                      className="py-3.5 px-4 text-right whitespace-nowrap"
                      style={{ color: "#111", fontWeight: 700 }}
                    >
                      {won(row.weekday)}
                    </td>
                    <td
                      className="py-3.5 px-4 text-right whitespace-nowrap"
                      style={{ color: "#111", fontWeight: 700 }}
                    >
                      {won(row.saturday)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul
            className="mt-6 space-y-2 text-black/70"
            style={{ fontSize: "13px", lineHeight: 1.7 }}
          >
            <li className="flex items-start gap-2">
              <span style={{ color: "#00C2D1", flexShrink: 0 }}>•</span>
              {packages.notes.waterpark}
            </li>
            <li className="flex items-start gap-2">
              <span style={{ color: "#00C2D1", flexShrink: 0 }}>•</span>
              {packages.notes.bbqPrefix}: {packages.bbqComposition}
            </li>
            <li className="flex items-start gap-2">
              <span style={{ color: "#e11d48", flexShrink: 0 }}>•</span>
              {packages.notes.under4}
            </li>
          </ul>
        </div>

        <div
          className="mt-16 p-6 md:p-8"
          style={{
            backgroundColor: "#fff",
            border: "1px solid rgba(0,0,0,0.08)",
            borderRadius: "3px",
          }}
        >
          <p
            className="text-black mb-4"
            style={{ fontSize: "16px", fontWeight: 800, letterSpacing: "-0.02em" }}
          >
            {dict.pricing.hours.title}
          </p>
          <ul
            className="space-y-2 text-black/75"
            style={{ fontSize: "14px", lineHeight: 1.7 }}
          >
            {dict.pricing.hours.lines.map((line) => (
              <li key={line} className="flex items-start gap-2">
                <span style={{ color: "#00C2D1", flexShrink: 0 }}>•</span>
                {line}
              </li>
            ))}
          </ul>
          <p
            className="mt-3 text-black/60"
            style={{ fontSize: "13px", lineHeight: 1.7 }}
          >
            {dict.pricing.hours.note}
          </p>
        </div>
      </div>
    </section>
  );
}
