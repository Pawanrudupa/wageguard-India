/**
 * Live Risk Snapshot card that pre-fetches 5 real state/sector combinations
 * and cycles every 4 seconds with 200ms crossfade. Pauses on hover, tap, or focus.
 */

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { fetchRisk, RiskResponse } from "../lib/api";
import { useI18n } from "../lib/i18n";

interface TargetPair {
  state: string;
  sector: string;
  displaySector: string;
}

const SNAPSHOT_TARGETS: TargetPair[] = [
  {
    state: "Delhi",
    sector: "Construction",
    displaySector: "Construction",
  },
  {
    state: "Maharashtra",
    sector: "Manufacturing & Factories",
    displaySector: "Manufacturing & Factories (Garments / Textiles)",
  },
  {
    state: "Karnataka",
    sector: "Security & Facility",
    displaySector: "Security & Facility (Security Services)",
  },
  {
    state: "Tamil Nadu",
    sector: "Manufacturing & Factories",
    displaySector: "Manufacturing & Factories (Brick Kilns)",
  },
  {
    state: "Gujarat",
    sector: "Hospitality & Food Services",
    displaySector: "Hospitality & Food Services (Hotels & Dining)",
  },
];

// High-fidelity empirical fallback data directly matching state_sector_risk.csv
const FALLBACK_CACHE: RiskResponse[] = [
  {
    state: "Delhi",
    sector: "Construction",
    risk_label: "High",
    explanation: "Wage-law irregularities in the Construction sector in Delhi are elevated (High Risk) relative to other sectors and states, with approximately 1.99 violations detected per inspection in published government records.",
    data_confidence: "High",
    irregularity_rate: 1.9876,
    current_min_wage_rate: 695.0,
  },
  {
    state: "Maharashtra",
    sector: "Manufacturing & Factories",
    risk_label: "Low",
    explanation: "The Manufacturing & Factories sector in Maharashtra shows a relatively low rate of wage-law irregularities (Low Risk), averaging 0.75 violations per inspection.",
    data_confidence: "High",
    irregularity_rate: 0.7504,
    current_min_wage_rate: 522.0,
  },
  {
    state: "Karnataka",
    sector: "Security & Facility",
    risk_label: "High",
    explanation: "Wage-law irregularities in the Security & Facility sector in Karnataka are elevated (High Risk) relative to other sectors and states, with approximately 1.92 violations detected per inspection in published government records.",
    data_confidence: "High",
    irregularity_rate: 1.9197,
    current_min_wage_rate: 635.0,
  },
  {
    state: "Tamil Nadu",
    sector: "Manufacturing & Factories",
    risk_label: "Low",
    explanation: "The Manufacturing & Factories sector in Tamil Nadu shows a relatively low rate of wage-law irregularities (Low Risk), averaging 0.57 violations per inspection.",
    data_confidence: "High",
    irregularity_rate: 0.5708,
    current_min_wage_rate: 500.0,
  },
  {
    state: "Gujarat",
    sector: "Hospitality & Food Services",
    risk_label: "Medium",
    explanation: "Wage-law compliance in the Hospitality & Food Services sector in Gujarat shows moderate irregularity rates (Medium Risk), with approximately 1.02 violations detected per inspection.",
    data_confidence: "Medium",
    irregularity_rate: 1.0217,
    current_min_wage_rate: 430.0,
  },
];

export const LiveRiskCard: React.FC = () => {
  const { t } = useI18n();
  const [dataList, setDataList] = useState<RiskResponse[]>(FALLBACK_CACHE);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isCrossfading, setIsCrossfading] = useState(false);
  const fetchedRef = useRef(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Prefetch all 5 target combinations ONCE on page load
  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    Promise.all(
      SNAPSHOT_TARGETS.map((target) =>
        fetchRisk(target.state, target.sector).catch(() => null)
      )
    ).then((responses) => {
      const validResponses = responses.filter(
        (r): r is RiskResponse => r !== null && Boolean(r.state)
      );
      if (validResponses.length === SNAPSHOT_TARGETS.length) {
        setDataList(validResponses);
      }
    });
  }, []);

  const handleNext = useCallback(() => {
    setIsCrossfading(true);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % dataList.length);
      setIsCrossfading(false);
    }, 100);
  }, [dataList.length]);

  const handleSelect = (idx: number) => {
    if (idx === currentIndex) return;
    setIsCrossfading(true);
    setTimeout(() => {
      setCurrentIndex(idx);
      setIsCrossfading(false);
    }, 100);
  };

  // 4-second cycle timer (respects hover, tap, focus, and reduced motion)
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    if (isPaused) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      handleNext();
    }, 4000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused, handleNext]);

  const currentItem = dataList[currentIndex] || dataList[0];
  const activeTarget = SNAPSHOT_TARGETS[currentIndex] || SNAPSHOT_TARGETS[0];

  const getRiskBadgeColor = (risk: string) => {
    switch (risk.toLowerCase()) {
      case "high":
        return "bg-risk-high text-surface";
      case "medium":
        return "bg-risk-medium text-ink";
      case "low":
        return "bg-risk-low text-surface";
      default:
        return "bg-ink text-surface";
    }
  };

  return (
    <div
      className="border-3 border-ink bg-surface p-4 sm:p-5 shadow-brutal flex flex-col justify-between w-full max-w-md mx-auto relative transition-shadow hover:shadow-brutal-sm"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      tabIndex={0}
      role="region"
      aria-label="Live Sector Risk Snapshot"
    >
      {/* Top Header Row with Pulsing Dot + Live Data Badge & Pause Status */}
      <div className="flex items-center justify-between gap-2 border-b-2 border-ink/20 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-ink text-surface font-mono font-bold text-xs uppercase shadow-brutal-pressed">
            <span
              className="w-2 h-2 bg-risk-high rounded-full live-dot-pulse"
              aria-hidden="true"
            />
            <span>{t.home.liveDataBadge}</span>
          </div>
          <span className="font-mono text-xs font-bold text-ink/60 uppercase hidden xs:inline">
            {currentIndex + 1}/{dataList.length}
          </span>
        </div>

        {/* Accessibility & Pause Indicator */}
        {isPaused ? (
          <span className="font-mono text-[11px] font-bold px-1.5 py-0.5 bg-accent/30 border border-ink text-ink uppercase tracking-wide">
            {t.home.pausedBadge}
          </span>
        ) : (
          <span className="font-mono text-[11px] text-ink/50 uppercase tracking-wide">
            Auto-cycle 4s
          </span>
        )}
      </div>

      {/* Main Content Area with 200ms Crossfade Transition */}
      <div
        className={`py-4 space-y-3 transition-opacity duration-200 ease-out ${
          isCrossfading ? "opacity-0" : "opacity-100"
        }`}
      >
        {/* State & Sector Title + Risk Tier Stamp */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-heading font-black text-xl text-ink leading-tight">
              {currentItem.state}
            </h2>
            <div className="font-body font-bold text-sm text-ink/80 mt-0.5">
              {activeTarget.displaySector}
            </div>
          </div>
          <div
            className={`font-mono font-black text-xs uppercase px-2.5 py-1 border-2 border-ink shadow-brutal-sm whitespace-nowrap ${getRiskBadgeColor(
              currentItem.risk_label
            )}`}
          >
            {currentItem.risk_label} Risk
          </div>
        </div>

        {/* 2-Metric Grid: Daily Min Wage & Irregularity Rate */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <div className="border border-ink bg-bg p-2 shadow-brutal-pressed">
            <div className="font-mono text-[11px] font-semibold text-ink/70">
              {t.home.dailyMinWage}
            </div>
            <div className="font-mono font-black text-lg text-ink">
              ₹{currentItem.current_min_wage_rate || 500}
              <span className="text-xs font-normal text-ink/60">/day</span>
            </div>
          </div>

          <div className="border border-ink bg-bg p-2 shadow-brutal-pressed">
            <div className="font-mono text-[11px] font-semibold text-ink/70">
              {t.home.irregularityRate}
            </div>
            <div className="font-mono font-black text-lg text-ink">
              {currentItem.irregularity_rate !== undefined
                ? currentItem.irregularity_rate.toFixed(2)
                : "1.21"}
              <span className="text-[11px] font-mono font-normal text-ink/70 ml-1">
                {t.risk.irregularityRateUnit}
              </span>
            </div>
            <div className="text-[10px] font-mono text-ink/60 mt-0.5 leading-tight">
              {t.home.irregularitySubtitle}
            </div>
          </div>
        </div>

        {/* Context Explanation */}
        <p className="font-body text-xs text-ink/80 leading-relaxed border-l-2 border-accent pl-2 line-clamp-2">
          {currentItem.explanation}
        </p>
      </div>

      {/* Footer Navigation: Interactive 44px Tap Target Pills + Action CTA */}
      <div className="border-t-2 border-ink/20 pt-3 flex items-center justify-between gap-2">
        {/* 5 Indicator Navigation Pills with 44px minimum tap targets */}
        <div className="flex items-center gap-1" role="tablist" aria-label="Cycle Indicators">
          {dataList.map((target, idx) => (
            <button
              key={`${target.state}-${idx}`}
              type="button"
              onClick={() => handleSelect(idx)}
              aria-label={`Select ${target.state} ${target.sector}`}
              aria-selected={idx === currentIndex}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-ink"
            >
              <span
                className={`inline-block transition-all duration-150 border border-ink ${
                  idx === currentIndex
                    ? "w-5 h-2 bg-ink shadow-brutal-pressed"
                    : "w-2.5 h-2 bg-bg hover:bg-accent"
                }`}
              />
            </button>
          ))}
        </div>

        {/* Direct Link to Risk Calculator with pre-filtered context */}
        <Link
          to={`/risk?state=${encodeURIComponent(
            currentItem.state
          )}&sector=${encodeURIComponent(currentItem.sector)}`}
          className="btn-press min-h-[44px] inline-flex items-center justify-center px-3 py-1.5 border-2 border-ink bg-accent text-ink font-heading font-black text-xs uppercase shadow-brutal-sm"
        >
          {t.home.viewFullRiskAnalysis} →
        </Link>
      </div>
    </div>
  );
};
