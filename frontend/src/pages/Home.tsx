/**
 * Landing page featuring bold neo-brutalist hero, primary CTAs, how-it-works overview, and privacy pledge.
 */
import React from "react";
import { Link } from "react-router-dom";
import { useI18n } from "../lib/i18n";

export const Home: React.FC = () => {
  const { t } = useI18n();

  return (
    <div className="space-y-10">
      {/* Hero Section */}
      <section className="border-3 border-ink bg-surface p-6 sm:p-8 shadow-brutal space-y-6">
        <div className="inline-block bg-accent border-2 border-ink px-3 py-1 font-mono font-bold text-xs uppercase tracking-wider shadow-brutal-sm">
          {t.home.badge}
        </div>

        <h1 className="font-heading font-black text-3xl sm:text-5xl leading-[1.1] tracking-tight text-ink">
          {t.home.heroTitle}
        </h1>

        <p className="font-body text-base sm:text-lg leading-relaxed text-ink/90 max-w-2xl">
          {t.home.heroSubtitle}
        </p>

        {/* Big CTAs */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Link
            to="/risk"
            className="min-h-[48px] inline-flex items-center justify-center px-6 py-3 border-3 border-ink bg-accent text-ink font-heading font-black text-base shadow-brutal transition-transform active:translate-x-0.5 active:translate-y-0.5 active:shadow-brutal-pressed text-center"
          >
            {t.home.checkRiskCta} →
          </Link>
          <Link
            to="/rights"
            className="min-h-[48px] inline-flex items-center justify-center px-6 py-3 border-3 border-ink bg-surface text-ink font-heading font-bold text-base shadow-brutal hover:bg-bg transition-transform active:translate-x-0.5 active:translate-y-0.5 active:shadow-brutal-pressed text-center"
          >
            {t.home.askRightsCta} →
          </Link>
          <Link
            to="/resources"
            className="min-h-[48px] inline-flex items-center justify-center px-6 py-3 border-3 border-ink bg-bg text-ink font-heading font-bold text-base shadow-brutal hover:bg-surface transition-transform active:translate-x-0.5 active:translate-y-0.5 active:shadow-brutal-pressed text-center"
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

      {/* How it Works Section */}
      <section className="space-y-4">
        <h2 className="font-heading font-black text-2xl sm:text-3xl text-ink">
          {t.home.howItWorksTitle}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border-3 border-ink bg-surface p-5 shadow-brutal space-y-2">
            <div className="font-mono font-black text-xl text-ink">
              01
            </div>
            <h3 className="font-heading font-bold text-lg text-ink">
              {t.home.step1Title}
            </h3>
            <p className="font-body text-sm text-ink/85 leading-relaxed">
              {t.home.step1Desc}
            </p>
          </div>

          <div className="border-3 border-ink bg-surface p-5 shadow-brutal space-y-2">
            <div className="font-mono font-black text-xl text-ink">
              02
            </div>
            <h3 className="font-heading font-bold text-lg text-ink">
              {t.home.step2Title}
            </h3>
            <p className="font-body text-sm text-ink/85 leading-relaxed">
              {t.home.step2Desc}
            </p>
          </div>

          <div className="border-3 border-ink bg-surface p-5 shadow-brutal space-y-2">
            <div className="font-mono font-black text-xl text-ink">
              03
            </div>
            <h3 className="font-heading font-bold text-lg text-ink">
              {t.home.step3Title}
            </h3>
            <p className="font-body text-sm text-ink/85 leading-relaxed">
              {t.home.step3Desc}
            </p>
          </div>
        </div>
      </section>

      {/* Data Reality Check & Transparency Card */}
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
    </div>
  );
};
