/**
 * Sticky neo-brutalist header with bilingual language toggle and mobile-ready navigation.
 */
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useI18n } from "../lib/i18n";

export const Header: React.FC = () => {
  const { lang, setLang, t } = useI18n();
  const location = useLocation();

  const navLinks = [
    { path: "/", label: t.nav.home },
    { path: "/risk", label: t.nav.risk },
    { path: "/rights", label: t.nav.rights },
    { path: "/resources", label: t.nav.resources },
    { path: "/ledger", label: t.nav.ledger },
  ];

  return (
    <header className="border-b-3 border-ink bg-surface sticky top-0 z-30">
      <div className="max-w-4xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        {/* Brand */}
        <Link
          to="/"
          className="flex items-center gap-2 group focus:outline-none focus:ring-2 focus:ring-accent"
        >
          <div className="bg-accent border-2 border-ink px-2 py-0.5 font-heading font-black text-lg text-ink shadow-brutal-sm">
            WG
          </div>
          <div>
            <div className="font-heading font-bold text-lg leading-tight tracking-tight text-ink">
              {t.appName}
            </div>
            <div className="text-[11px] text-ink/80 font-mono tracking-tight -mt-0.5">
              {lang === "hi" ? "WageGuard India" : "वेतन रक्षक"}
            </div>
          </div>
        </Link>

        {/* Right side controls: Lang Toggle */}
        <div className="flex items-center gap-2">
          {/* Language Toggle: minimum 44px tap target */}
          <div className="inline-flex border-2 border-ink bg-bg p-0.5 shadow-brutal-sm">
            <button
              type="button"
              onClick={() => setLang("en")}
              className={`min-h-[44px] min-w-[44px] px-2.5 py-1 text-xs font-mono font-black transition-all cursor-pointer ${
                lang === "en"
                  ? "bg-accent text-ink border-2 border-ink shadow-brutal-sm -translate-x-0.5 -translate-y-0.5"
                  : "text-ink/80 hover:text-ink hover:bg-surface/60"
              } active:translate-x-0 active:translate-y-0 active:shadow-none`}
              aria-label="Switch to English"
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => setLang("hi")}
              className={`min-h-[44px] min-w-[44px] px-2.5 py-1 text-xs font-mono font-black transition-all cursor-pointer ${
                lang === "hi"
                  ? "bg-accent text-ink border-2 border-ink shadow-brutal-sm -translate-x-0.5 -translate-y-0.5"
                  : "text-ink/80 hover:text-ink hover:bg-surface/60"
              } active:translate-x-0 active:translate-y-0 active:shadow-none`}
              aria-label="हिंदी में बदलें"
            >
              हिन्दी
            </button>
          </div>
        </div>

        {/* Navigation Bar: Full width horizontal scroll or wrap on mobile */}
        <nav className="w-full flex items-center gap-2 pt-1 border-t-2 border-ink/15 overflow-x-auto pb-1">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`min-h-[44px] inline-flex items-center px-3 py-2 text-sm font-heading font-bold border-2 border-ink whitespace-nowrap transition-transform active:translate-x-0.5 active:translate-y-0.5 ${
                  isActive
                    ? "bg-accent text-ink shadow-brutal-sm"
                    : "bg-surface text-ink hover:bg-bg"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
