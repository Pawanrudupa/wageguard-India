/**
 * State and sector wage-irregularity risk lookup page wired to GET /api/risk.
 */
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useI18n } from "../lib/i18n";
import { fetchRisk, RiskResponse } from "../lib/api";
import { Combobox } from "../components/Combobox";
import { ScrollReveal } from "../components/ScrollReveal";

const STATES = [
  "Delhi",
  "Maharashtra",
  "Karnataka",
  "Tamil Nadu",
  "Kerala",
  "Telangana",
  "West Bengal",
  "Central Sphere",
  "Gujarat",
  "Rajasthan",
  "Uttar Pradesh",
  "Haryana",
  "Punjab",
  "Bihar",
  "Assam",
  "Odisha",
  "Madhya Pradesh",
  "Andhra Pradesh",
];

const SECTORS = [
  "Construction",
  "Manufacturing & Factories",
  "Retail & Commercial",
  "Security & Facility",
  "Domestic Work",
  "Transport & Logistics",
  "Agriculture & Allied",
  "Hotel & Restaurants",
];

export const RiskLookup: React.FC = () => {
  const { t } = useI18n();

  const [state, setState] = useState<string>("Maharashtra");
  const [sector, setSector] = useState<string>("Construction");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RiskResponse | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!state || !sector) return;

    setLoading(true);
    setError(null);
    try {
      const data = await fetchRisk(state, sector);
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load risk prediction");
    } finally {
      setLoading(false);
    }
  };

  const getRiskBadgeStyles = (label: string) => {
    switch (label) {
      case "High":
        return "bg-risk-high text-surface border-ink";
      case "Medium":
        return "bg-risk-medium text-ink border-ink";
      case "Low":
        return "bg-risk-low text-surface border-ink";
      default:
        return "bg-bg text-ink border-ink";
    }
  };

  const getConfidenceBadgeStyles = (conf: string) => {
    switch (conf) {
      case "High":
        return "bg-surface text-ink border-ink";
      case "Medium":
        return "bg-bg text-ink border-ink";
      case "Low":
        return "bg-accent text-ink border-ink font-bold";
      default:
        return "bg-bg text-ink border-ink";
    }
  };

  return (
    <div className="space-y-8">
      {/* Title Header */}
      <section className="border-3 border-ink bg-surface p-6 shadow-brutal space-y-2">
        <h1 className="font-heading font-black text-2xl sm:text-4xl text-ink">
          {t.risk.title}
        </h1>
        <p className="font-body text-base text-ink/85 leading-relaxed">
          {t.risk.subtitle}
        </p>
      </section>

      {/* Lookup Form with Custom-Styled Comboboxes */}
      <form
        onSubmit={handleSubmit}
        className="border-3 border-ink bg-surface p-6 shadow-brutal space-y-5"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Custom Accessible State Combobox */}
          <Combobox
            id="state-combobox"
            label={t.risk.stateLabel}
            value={state}
            onChange={setState}
            options={STATES}
            placeholder={t.risk.selectStatePrompt}
          />

          {/* Custom Accessible Sector Combobox */}
          <Combobox
            id="sector-combobox"
            label={t.risk.sectorLabel}
            value={sector}
            onChange={setSector}
            options={SECTORS}
            placeholder={t.risk.selectSectorPrompt}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-press w-full sm:w-auto min-h-[48px] px-6 py-3 border-3 border-ink bg-accent text-ink font-heading font-black text-base shadow-brutal disabled:opacity-50 cursor-pointer"
        >
          {loading ? t.risk.checking : t.risk.checkButton}
        </button>
      </form>

      {/* Error state */}
      {error && (
        <div className="border-3 border-risk-high bg-surface p-4 shadow-brutal text-risk-high font-mono text-sm">
          ⚠️ {error}
        </div>
      )}

      {/* Result Card */}
      {result && (
        <ScrollReveal>
          <section className="border-3 border-ink bg-surface p-6 shadow-brutal space-y-6">
            <div className="border-b-2 border-ink/20 pb-3 flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-xs font-mono text-ink/70 uppercase">
                  {t.risk.resultTitle}
                </div>
                <h2 className="font-heading font-black text-xl sm:text-2xl text-ink">
                  {result.state} • {result.sector}
                </h2>
              </div>

              {/* Badges container */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Risk Badge */}
                <div
                  className={`border-3 px-3 py-1 font-heading font-black text-sm uppercase shadow-brutal-sm ${getRiskBadgeStyles(
                    result.risk_label
                  )}`}
                >
                  {result.risk_label === "High"
                    ? t.risk.highRisk
                    : result.risk_label === "Medium"
                    ? t.risk.mediumRisk
                    : t.risk.lowRisk}
                </div>

                {/* Data Confidence Badge */}
                <div
                  className={`border-2 px-2.5 py-1 font-mono text-xs font-bold uppercase shadow-brutal-sm ${getConfidenceBadgeStyles(
                    result.data_confidence
                  )}`}
                >
                  {t.risk.confidenceLevel}:{" "}
                  {result.data_confidence === "High"
                    ? t.risk.highConfidence
                    : result.data_confidence === "Medium"
                    ? t.risk.mediumConfidence
                    : t.risk.lowConfidence}
                </div>
              </div>
            </div>

            {/* Low Confidence Warning per Model Card */}
            {result.data_confidence === "Low" && (
              <div className="border-2 border-ink bg-accent/40 p-3 text-xs font-mono text-ink space-y-1">
                <div className="font-bold">⚠️ {t.risk.lowConfidence}</div>
                <div>{t.risk.lowConfidenceWarning}</div>
              </div>
            )}

            {/* Key Empirical Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="border-2 border-ink bg-bg p-3 shadow-brutal-sm">
                <div className="text-xs font-mono text-ink/70">
                  {t.risk.irregularityRate}
                </div>
                <div className="font-mono font-black text-2xl text-ink">
                  {result.irregularity_rate !== undefined
                    ? `${result.irregularity_rate.toFixed(2)}`
                    : "N/A"}
                </div>
                <div className="text-[11px] font-mono text-ink/70">
                  {t.risk.irregularityRateUnit}
                </div>
              </div>

              <div className="border-2 border-ink bg-bg p-3 shadow-brutal-sm">
                <div className="text-xs font-mono text-ink/70">
                  {t.risk.minWageRate}
                </div>
                <div className="font-mono font-black text-2xl text-ink">
                  {result.current_min_wage_rate
                    ? `₹${result.current_min_wage_rate.toLocaleString("en-IN")}`
                    : "N/A"}
                </div>
                <div className="text-[11px] font-mono text-ink/70">
                  {t.risk.dayUnit}
                </div>
              </div>
            </div>

            {/* Explanation */}
            <div className="space-y-1 border-l-3 border-ink pl-3">
              <div className="text-xs font-mono font-bold text-ink/80 uppercase">
                {t.risk.explanationLabel}
              </div>
              <p className="font-body text-base text-ink leading-relaxed">
                {result.explanation}
              </p>
            </div>

            {/* Contextual Action Links */}
            <div className="pt-2 border-t-2 border-ink/20 flex flex-col sm:flex-row gap-3">
              <Link
                to={`/rights?state=${encodeURIComponent(result.state)}`}
                className="btn-press-sm min-h-[44px] inline-flex items-center justify-center px-4 py-2 border-2 border-ink bg-accent text-ink font-heading font-bold text-sm shadow-brutal-sm"
              >
                {t.risk.askRightsAboutState} →
              </Link>
              <Link
                to={`/resources?state=${encodeURIComponent(result.state)}`}
                className="btn-press-sm min-h-[44px] inline-flex items-center justify-center px-4 py-2 border-2 border-ink bg-surface text-ink font-heading font-bold text-sm shadow-brutal-sm hover:bg-bg"
              >
                {t.risk.viewStateResources} →
              </Link>
            </div>
          </section>
        </ScrollReveal>
      )}
    </div>
  );
};
