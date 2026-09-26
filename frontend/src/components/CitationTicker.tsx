/**
 * Pure CSS continuous marquee ticker displaying verified statutory provisions.
 * Pauses on hover/focus and respects prefers-reduced-motion.
 */

import React from "react";

interface CitationItem {
  act: string;
  section: string;
  summary: string;
}

const STATUTORY_PROVISIONS: CitationItem[] = [
  {
    act: "Code on Wages 2019",
    section: "§ 17(2)",
    summary: "2-day settlement on resignation or termination",
  },
  {
    act: "Code on Wages 2019",
    section: "§ 14",
    summary: "Overtime rate: minimum 2x normal wages",
  },
  {
    act: "Code on Wages 2019",
    section: "§ 45(6)",
    summary: "Unified 3-year limitation period for claims",
  },
  {
    act: "Code on Wages 2019",
    section: "§ 59",
    summary: "Burden of proof on employer for wage payments",
  },
  {
    act: "Payment of Gratuity Act",
    section: "§ 4",
    summary: "Gratuity payable after 5 years continuous service",
  },
  {
    act: "NALSA Helpline",
    section: "15100",
    summary: "24x7 toll-free free legal aid appointment",
  },
  {
    act: "Code on Wages 2019",
    section: "§ 3",
    summary: "Prohibition of gender discrimination in wage rates",
  },
  {
    act: "Code on Wages 2019",
    section: "§ 18",
    summary: "Permissible deductions strictly capped by statute",
  },
];

export const CitationTicker: React.FC = () => {
  // Render array twice to create a seamless infinite loop at -50% translateX
  const tickerItems = [...STATUTORY_PROVISIONS, ...STATUTORY_PROVISIONS];

  return (
    <div
      className="citation-marquee-container relative border-3 border-ink bg-surface shadow-brutal overflow-hidden select-none"
      role="region"
      aria-label="Statutory Provisions Marquee"
    >
      <div className="flex items-stretch">
        {/* Fixed Label on Left */}
        <div className="hidden sm:flex items-center px-4 py-2.5 bg-accent border-r-3 border-ink font-mono font-bold text-xs uppercase text-ink whitespace-nowrap z-10 shadow-brutal-sm">
          <span className="inline-block w-2 h-2 bg-ink rounded-none mr-2"></span>
          Statutory Precedents
        </div>

        {/* Marquee Track */}
        <div className="overflow-hidden py-2 sm:py-2.5 w-full flex items-center">
          <div className="citation-marquee-track items-center gap-6 sm:gap-8 px-4">
            {tickerItems.map((item, idx) => (
              <div
                key={`${item.section}-${idx}`}
                className="inline-flex items-center gap-2 whitespace-nowrap text-xs font-mono"
              >
                <span className="font-heading font-black px-1.5 py-0.5 border border-ink bg-bg text-ink shadow-brutal-pressed">
                  {item.act} {item.section}
                </span>
                <span className="font-body font-semibold text-ink/85">
                  {item.summary}
                </span>
                <span className="text-ink/40 font-bold ml-4 sm:ml-6" aria-hidden="true">
                  ■
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
