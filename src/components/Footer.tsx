import { YoutubeIcon, PhoneIcon, MapPinIcon, InstagramIcon } from "lucide-react";
import type { Dictionary } from "@/i18n";
import { NaverReserveButton } from "./NaverReserveButton";

export function Footer({ dict }: { dict: Dictionary }) {
  const year = new Date().getFullYear();
  const f = dict.footer;

  return (
    <footer
      className="pt-16 pb-28 md:pb-16 px-5 md:px-8"
      style={{ backgroundColor: "#0a0a0a" }}
      role="contentinfo"
    >
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 pb-12 border-b border-white/10">
          {/* Brand */}
          <div className="col-span-1">
            <div className="mb-2">
              <span
                className="text-white"
                style={{ fontSize: "28px", fontWeight: 900, letterSpacing: "-0.04em" }}
              >
                {dict.brand.displayName}
              </span>
            </div>
            <p
              className="text-white/60 mb-5 tracking-[0.15em]"
              style={{ fontSize: "11px", fontWeight: 600 }}
            >
              {f.tag}
            </p>
            <p
              className="text-white/40 leading-relaxed mb-6 whitespace-pre-line"
              style={{ fontSize: "14px", lineHeight: 1.75 }}
            >
              {f.description}
            </p>

            <div className="flex flex-wrap gap-2">
              <a
                href="https://www.youtube.com/@JangchojiTV/videos"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3 py-2 border border-white/15 text-white/70 hover:border-white/40 hover:text-white transition-colors"
                style={{ borderRadius: "2px", fontSize: "12px", fontWeight: 600 }}
                aria-label={f.socialAria.youtube}
              >
                <YoutubeIcon size={16} style={{ color: "#FF0000" }} />
                {f.social.youtube}
              </a>
              <a
                href="https://m.blog.naver.com/yeji0109-?tab=1"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3 py-2 border border-white/15 text-white/70 hover:border-white/40 hover:text-white transition-colors"
                style={{ borderRadius: "2px", fontSize: "12px", fontWeight: 600 }}
                aria-label={f.socialAria.blog}
              >
                <span
                  className="inline-flex items-center justify-center"
                  style={{
                    width: "16px",
                    height: "16px",
                    backgroundColor: "#03C75A",
                    color: "#fff",
                    fontSize: "9px",
                    fontWeight: 900,
                    borderRadius: "2px",
                  }}
                >
                  B
                </span>
                {f.social.blog}
              </a>
              <a
                href="https://www.instagram.com/mad.water.ski/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3 py-2 border border-white/15 text-white/70 hover:border-white/40 hover:text-white transition-colors"
                style={{ borderRadius: "2px", fontSize: "12px", fontWeight: 600 }}
                aria-label={f.socialAria.instagram}
              >
                <InstagramIcon size={16} style={{ color: "#DD2A7B" }} />
                {f.social.instagram}
              </a>
              <a
                href="https://smartstore.naver.com/madski/products/11804623124"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3 py-2 border border-white/15 text-white/70 hover:border-white/40 hover:text-white transition-colors"
                style={{ borderRadius: "2px", fontSize: "12px", fontWeight: 600 }}
                aria-label={f.socialAria.store}
              >
                <span
                  className="inline-flex items-center justify-center"
                  style={{
                    width: "16px",
                    height: "16px",
                    backgroundColor: "#03C75A",
                    color: "#fff",
                    fontSize: "10px",
                    fontWeight: 900,
                    borderRadius: "2px",
                  }}
                >
                  N
                </span>
                {f.social.store}
              </a>
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h4
              className="text-white mb-5"
              style={{
                fontSize: "13px",
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}
            >
              {f.quickLinksTitle}
            </h4>
            <ul className="space-y-2.5">
              {f.quickLinks.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-white/45 hover:text-white transition-colors"
                    style={{ fontSize: "14px" }}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4
              className="text-white mb-5"
              style={{
                fontSize: "13px",
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}
            >
              {f.contactTitle}
            </h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <MapPinIcon
                  size={16}
                  style={{ color: "#00C2D1", flexShrink: 0, marginTop: "2px" }}
                />
                <span className="text-white/50" style={{ fontSize: "13px", lineHeight: 1.6 }}>
                  {dict.brand.address.road}
                  <br />
                  <span className="text-white/35">
                    ({f.postalPrefix} {dict.brand.address.postalCode})
                  </span>
                </span>
              </li>
              <li className="flex items-center gap-3">
                <PhoneIcon size={16} style={{ color: "#00C2D1", flexShrink: 0 }} />
                <a
                  href={`tel:${dict.brand.phone}`}
                  className="text-white/50 hover:text-white transition-colors"
                  style={{ fontSize: "14px" }}
                >
                  {dict.brand.phone}
                </a>
              </li>
            </ul>

            <div
              className="mt-6 p-4 border border-white/10"
              style={{ borderRadius: "2px" }}
            >
              <p
                className="text-white/70 mb-2"
                style={{
                  fontSize: "12px",
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                {f.hoursTitle}
              </p>
              <p className="text-white/50" style={{ fontSize: "13px", lineHeight: 1.7 }}>
                {f.hoursWeekday}
                <br />
                {f.hoursWeekend}
                <br />
                <span style={{ color: "#00C2D1" }}>{f.hoursPeak}</span>
              </p>
            </div>

            <NaverReserveButton
              label={f.reserve}
              size="md"
              fullWidth
              className="mt-5 hidden md:flex"
            />
          </div>
        </div>

        <div className="pt-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div
            className="text-white/25 flex flex-wrap gap-x-3 gap-y-1"
            style={{ fontSize: "12px", lineHeight: 1.7 }}
          >
            <span>
              {f.businessLabel} {dict.brand.displayName}
            </span>
            <span>
              {f.ownerLabel} {dict.brand.ownerName}
            </span>
            <span>{f.tag}</span>
          </div>
          <p
            className="text-white/20 flex-shrink-0"
            style={{ fontSize: "12px" }}
          >
            © {year} {dict.brand.displayName}. {f.rightsReserved}
          </p>
        </div>
      </div>
    </footer>
  );
}
