/**
 * Landing page featuring bold neo-brutalist hero with live risk snapshot card,
 * dot-grid blueprint texture, statutory citation ticker, animated count-up stats,
 * and scroll-reveal overviews.
 */

import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useI18n } from "../lib/i18n";
import { fetchStats, StatsResponse } from "../lib/api";
import { ScrollReveal } from "../components/ScrollReveal";
import { OdometerCount } from "../components/OdometerCount";
import { TypewriterText } from "../components/TypewriterText";
import { LiveRiskCard } from "../components/LiveRiskCard";
import { CitationTicker } from "../components/CitationTicker";

export const Home: React.FC = () => {
  const { lang, t } = useI18n();
  const [stats, setStats] = useState<StatsResponse | null>(null);

  useEffect(() => {
    fetchStats()
      .then(setStats)
      .catch((err) => console.warn("Failed to load real stats, using cached fallbacks", err));
  }, []);

  return (
    <div className="space-y-8 sm:space-y-10">
      {/* Real Home Hero Section with Pure CSS Dot-Grid Texture */}
      <section className="border-3 border-ink hero-dot-pattern p-6 sm:p-10 shadow-brutal">
        <div className="lg:grid lg:grid-cols-12 lg:gap-8 items-center space-y-8 lg:space-y-0">
          {/* Left Column: Headlines, Trust Framing & Primary CTAs */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-block bg-accent border-2 border-ink px-3 py-1 font-mono font-bold text-xs uppercase tracking-wider shadow-brutal-sm min-h-[26px]">
              <TypewriterText
                text={t.home.badge}
                lang={lang}
                speedMs={20}
                delayMs={100}
              />
            </div>

            {/* Large bold headline using the tagline with continuous typewriter emergence */}
            <h1 className="font-heading font-black text-3xl sm:text-5xl lg:text-6xl leading-[1.08] tracking-tight text-ink min-h-[1.2em]">
              <TypewriterText
                text={t.home.heroHeadline}
                lang={lang}
                speedMs={32}
                delayMs={350}
              />
            </h1>

            {/* One-line trust statement */}
            <p className="font-body text-base sm:text-xl font-bold text-trust leading-snug border-l-4 border-trust pl-3 max-w-2xl">
              {t.home.heroTrustStatement}
            </p>

            {/* Supporting context */}
            <p className="font-body text-base sm:text-lg leading-relaxed text-ink/85 max-w-2xl">
              {t.home.heroSubtitle}
            </p>

            {/* Three Prominent CTA Buttons with Tactile Press Physicality */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Link
                to="/risk"
                className="btn-press min-h-[48px] inline-flex items-center justify-center px-6 py-3 border-3 border-ink bg-accent text-ink font-heading font-black text-base shadow-brutal text-center"
              >
                {t.home.checkRiskCta} →
              </Link>
              <Link
                to="/rights"
                className="btn-press min-h-[48px] inline-flex items-center justify-center px-6 py-3 border-3 border-ink bg-surface text-ink font-heading font-bold text-base shadow-brutal hover:bg-bg text-center"
              >
                {t.home.askRightsCta} →
              </Link>
              <Link
                to="/resources"
                className="btn-press min-h-[48px] inline-flex items-center justify-center px-6 py-3 border-3 border-ink bg-bg text-ink font-heading font-bold text-base shadow-brutal hover:bg-surface text-center"
              >
                {t.home.viewResourcesCta} →
              </Link>
            </div>

            {/* Privacy badge */}
            <div className="border-2 border-ink/40 bg-surface/90 p-3 text-xs font-mono text-ink/80 flex items-center gap-2 max-w-xl">
              <span className="font-bold text-ink">🔒</span>
              <span>{t.home.privacyNotice}</span>
            </div>
          </div>

          {/* Right Column: Live Risk Snapshot Card cycling 5 combinations */}
          <div className="lg:col-span-5 w-full flex justify-center lg:justify-end">
            <LiveRiskCard />
          </div>
        </div>
      </section>

      {/* Pure CSS Continuous Scrolling Citation Ticker */}
      <CitationTicker />

      {/* Animated Count-Up Stats Strip: Pulled dynamically from backend / data files */}
      <ScrollReveal>
        <section className="border-3 border-ink bg-surface p-5 sm:p-6 shadow-brutal">
          <div className="text-xs font-mono font-bold text-ink/70 uppercase mb-3 tracking-wider">
            Empirical Scope & Knowledge Coverage
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            <div className="border-2 border-ink bg-bg p-3.5 shadow-brutal-sm">
              <div className="font-mono font-black text-2xl sm:text-3xl text-ink">
                <OdometerCount target={stats ? stats.states_count : 18} durationMs={600} />
              </div>
              <div className="text-xs font-heading font-bold text-ink/80 mt-1">
                {t.home.statStates}
              </div>
            </div>

            <div className="border-2 border-ink bg-bg p-3.5 shadow-brutal-sm">
              <div className="font-mono font-black text-2xl sm:text-3xl text-ink">
                <OdometerCount target={stats?.statutes_count || 13} durationMs={600} />
              </div>
              <div className="text-xs font-heading font-bold text-ink/80 mt-1">
                {t.home.statStatutes}
              </div>
            </div>

            <div className="border-2 border-ink bg-bg p-3.5 shadow-brutal-sm">
              <div className="font-mono font-black text-2xl sm:text-3xl text-ink">
                <OdometerCount target={stats ? stats.citations_count : 61} durationMs={700} />
              </div>
              <div className="text-xs font-heading font-bold text-ink/80 mt-1">
                {t.home.statCitations}
              </div>
            </div>

            <div className="border-2 border-ink bg-bg p-3.5 shadow-brutal-sm">
              <div className="font-mono font-black text-2xl sm:text-3xl text-ink">
                <OdometerCount target={stats ? stats.inspections_analyzed : 105600} durationMs={900} formatIndian={true} />
              </div>
              <div className="text-xs font-heading font-bold text-ink/80 mt-1">
                {t.home.statInspections}
              </div>
            </div>
          </div>
        </section>
      </ScrollReveal>

      {/* How it Works Section with subtle scroll-reveal */}
      <ScrollReveal delayMs={50}>
        <section className="space-y-4">
          <h2 className="font-heading font-black text-2xl sm:text-3xl text-ink">
            {t.home.howItWorksTitle}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border-3 border-ink bg-surface p-5 shadow-brutal space-y-2">
              <div className="font-mono font-black text-xl text-ink">01</div>
              <h3 className="font-heading font-bold text-lg text-ink">
                {t.home.step1Title}
              </h3>
              <p className="font-body text-sm text-ink/85 leading-relaxed">
                {t.home.step1Desc}
              </p>
            </div>

            <div className="border-3 border-ink bg-surface p-5 shadow-brutal space-y-2">
              <div className="font-mono font-black text-xl text-ink">02</div>
              <h3 className="font-heading font-bold text-lg text-ink">
                {t.home.step2Title}
              </h3>
              <p className="font-body text-sm text-ink/85 leading-relaxed">
                {t.home.step2Desc}
              </p>
            </div>

            <div className="border-3 border-ink bg-surface p-5 shadow-brutal space-y-2">
              <div className="font-mono font-black text-xl text-ink">03</div>
              <h3 className="font-heading font-bold text-lg text-ink">
                {t.home.step3Title}
              </h3>
              <p className="font-body text-sm text-ink/85 leading-relaxed">
                {t.home.step3Desc}
              </p>
            </div>
          </div>
        </section>
      </ScrollReveal>

      {/* Data Reality Check & Transparency Card with subtle scroll-reveal */}
      <ScrollReveal delayMs={100}>
        <section className="border-3 border-ink bg-surface p-6 shadow-brutal space-y-3">
          <div className="inline-block bg-ink text-surface px-2 py-0.5 font-mono text-xs font-bold uppercase">
            {t.home.dataTransparencyBadge}
          </div>
          <h3 className="font-heading font-bold text-xl text-ink">
            {t.home.trustTitle}
          </h3>
          <p className="font-body text-sm text-ink/85 leading-relaxed">
            {t.home.trustDesc}
          </p>
        </section>
      </ScrollReveal>
    </div>
  );
};
