/**
 * Landing page featuring bold neo-brutalist hero, real dataset stat strip, and how-it-works overview.
 */

import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useI18n } from "../lib/i18n";
import { fetchStats, StatsResponse } from "../lib/api";
import { ScrollReveal } from "../components/ScrollReveal";

export const Home: React.FC = () => {
  const { t } = useI18n();
  const [stats, setStats] = useState<StatsResponse | null>(null);

  useEffect(() => {
    fetchStats()
      .then(setStats)
      .catch((err) => console.warn("Failed to load real stats, using cached fallbacks", err));
  }, []);

  return (
    <div className="space-y-10">
      {/* Real Home Hero Section */}
      <section className="border-3 border-ink bg-surface p-6 sm:p-10 shadow-brutal space-y-6">
        <div className="inline-block bg-accent border-2 border-ink px-3 py-1 font-mono font-bold text-xs uppercase tracking-wider shadow-brutal-sm">
          {t.home.badge}
        </div>

        {/* Large bold headline using the tagline */}
        <h1 className="font-heading font-black text-3xl sm:text-5xl lg:text-6xl leading-[1.08] tracking-tight text-ink">
          {t.home.heroHeadline}
        </h1>

        {/* One-line trust statement */}
        <p className="font-body text-base sm:text-xl font-bold text-trust leading-snug border-l-4 border-trust pl-3 max-w-3xl">
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
        <div className="border-2 border-ink/40 bg-bg p-3 text-xs font-mono text-ink/80 flex items-center gap-2">
          <span className="font-bold text-ink">🔒</span>
          <span>{t.home.privacyNotice}</span>
        </div>
      </section>

      {/* Stat Strip Near Hero: Pulled from actual data */}
      <ScrollReveal>
        <section className="border-3 border-ink bg-surface p-5 sm:p-6 shadow-brutal">
          <div className="text-xs font-mono font-bold text-ink/70 uppercase mb-3 tracking-wider">
            Empirical Scope & Knowledge Coverage
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            <div className="border-2 border-ink bg-bg p-3.5 shadow-brutal-sm">
              <div className="font-mono font-black text-2xl sm:text-3xl text-ink">
                {stats ? stats.states_count : "18"}
              </div>
              <div className="text-xs font-heading font-bold text-ink/80 mt-1">
                {t.home.statStates}
              </div>
            </div>

            <div className="border-2 border-ink bg-bg p-3.5 shadow-brutal-sm">
              <div className="font-mono font-black text-2xl sm:text-3xl text-ink">
                {stats ? stats.sectors_count : "8"}
              </div>
              <div className="text-xs font-heading font-bold text-ink/80 mt-1">
                {t.home.statSectors}
              </div>
            </div>

            <div className="border-2 border-ink bg-bg p-3.5 shadow-brutal-sm">
              <div className="font-mono font-black text-2xl sm:text-3xl text-ink">
                {stats ? stats.citations_count : "61"}
              </div>
              <div className="text-xs font-heading font-bold text-ink/80 mt-1">
                {t.home.statCitations}
              </div>
            </div>

            <div className="border-2 border-ink bg-bg p-3.5 shadow-brutal-sm">
              <div className="font-mono font-black text-2xl sm:text-3xl text-ink">
                {stats ? stats.inspections_analyzed.toLocaleString("en-IN") : "105,600"}
              </div>
              <div className="text-xs font-heading font-bold text-ink/80 mt-1">
                {t.home.statInspections}
              </div>
            </div>
          </div>
        </section>
      </ScrollReveal>

      {/* How it Works Section */}
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

      {/* Data Reality Check & Transparency Card */}
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
