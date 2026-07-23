"use client";

import { useState, useEffect } from "react";
import { MenuIcon, XIcon, PalmtreeIcon } from "lucide-react";
import type { Dictionary, Locale } from "@/i18n";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { ReserveButton } from "./ReserveButton";

export function Navigation({
  dict,
  locale,
}: {
  dict: Dictionary;
  locale: Locale;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleNavClick = () => setMenuOpen(false);

  return (
    <>
      <header
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={{
          backgroundColor: scrolled ? "rgba(0,0,0,0.96)" : "rgba(0,0,0,0.75)",
          backdropFilter: "blur(12px)",
          borderBottom: scrolled ? "1px solid rgba(255,255,255,0.08)" : "none",
        }}
      >
        <nav
          className="max-w-7xl mx-auto px-5 md:px-8 flex items-center justify-between"
          style={{ height: "64px" }}
          aria-label={dict.nav.ariaLabel}
        >
          {/* Logo */}
          <a
            href="#home"
            className="flex items-center gap-2 group"
            aria-label={dict.nav.logoAria}
          >
            <PalmtreeIcon
              size={20}
              strokeWidth={2}
              className="text-white"
              aria-hidden="true"
            />
            <span
              className="text-white tracking-tight"
              style={{ fontSize: "20px", fontWeight: 900, letterSpacing: "-0.02em" }}
            >
              {dict.brand.displayName}
            </span>
          </a>

          {/* Desktop Nav Links */}
          <ul className="hidden md:flex items-center gap-5 lg:gap-8" role="list">
            {dict.nav.links.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="text-white/70 hover:text-white transition-colors duration-200 whitespace-nowrap"
                  style={{ fontSize: "14px", fontWeight: 500 }}
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>

          {/* CTA + Language + Mobile Menu */}
          <div className="flex items-center gap-3">
            <LanguageSwitcher dict={dict} locale={locale} variant="dark" />
            <ReserveButton
              label={dict.nav.reserve}
              size="sm"
              locale={locale}
              className="hidden md:inline-flex"
            />
            <button
              className="md:hidden text-white p-2 rounded"
              onClick={() => setMenuOpen((o) => !o)}
              aria-label={menuOpen ? dict.nav.menuClose : dict.nav.menuOpen}
              aria-expanded={menuOpen}
            >
              {menuOpen ? <XIcon size={22} /> : <MenuIcon size={22} />}
            </button>
          </div>
        </nav>

        {/* Mobile Dropdown */}
        {menuOpen && (
          <div
            className="md:hidden bg-black border-t border-white/10 overflow-y-auto"
            style={{ maxHeight: "calc(100svh - 64px)" }}
          >
            <ul className="px-5 py-4 space-y-1" role="list">
              {dict.nav.links.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    onClick={handleNavClick}
                    className="block py-3 text-white/80 hover:text-white border-b border-white/5"
                    style={{ fontSize: "16px", fontWeight: 500 }}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </header>

      {/* Mobile sticky bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden px-4 pb-4 pt-2 pointer-events-none">
        <ReserveButton
          label={dict.nav.reserveMobile}
          size="lg"
          fullWidth
          locale={locale}
          className="pointer-events-auto shadow-2xl py-2.5"
        />
      </div>
    </>
  );
}
