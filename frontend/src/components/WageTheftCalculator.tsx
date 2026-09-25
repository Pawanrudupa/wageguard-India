/**
 * Interactive Wage Theft & Underpayment Estimator component.
 * Allows workers to compare their daily wage against statutory notification rates
 * and calculate estimated monthly arrears owed under Indian labour law.
 */
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useI18n } from "../lib/i18n";

interface WageTheftCalculatorProps {
  state: string;
  sector: string;
  statutoryDailyRate: number | null | undefined;
}

export const WageTheftCalculator: React.FC<WageTheftCalculatorProps> = ({
  state,
  sector,
  statutoryDailyRate,
}) => {
  const { t } = useI18n();

  const defaultStatutory = statutoryDailyRate || 500;
  const [statutoryWage, setStatutoryWage] = useState<number>(defaultStatutory);
  const [actualWage, setActualWage] = useState<number>(
    Math.max(100, Math.round(defaultStatutory * 0.75))
  );
  const [daysWorked, setDaysWorked] = useState<number>(26);

  useEffect(() => {
    if (statutoryDailyRate && statutoryDailyRate > 0) {
      setStatutoryWage(statutoryDailyRate);
      setActualWage((prev) => (prev === 0 ? Math.round(statutoryDailyRate * 0.75) : prev));
    }
  }, [statutoryDailyRate]);

  const underpaidPerDay = Math.max(0, statutoryWage - actualWage);
  const totalMonthlyArrears = underpaidPerDay * daysWorked;
  const isUnderpaid = underpaidPerDay > 0;

  return (
    <div className="border-3 border-ink bg-surface p-5 sm:p-6 shadow-brutal space-y-5">
      <div className="border-b-2 border-ink/20 pb-3">
        <div className="inline-block bg-accent border-2 border-ink px-2.5 py-0.5 font-mono text-xs font-black uppercase shadow-brutal-sm mb-1.5">
          {t.risk.calculatorTitle}
        </div>
        <p className="font-body text-xs sm:text-sm text-ink/80 leading-relaxed">
          {t.risk.calculatorSubtitle}
        </p>
      </div>

      {/* Input controls */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Actual Daily Wage */}
        <div className="space-y-1.5">
          <label
            htmlFor="actual-wage-input"
            className="block font-heading font-bold text-xs sm:text-sm text-ink"
          >
            {t.risk.actualDailyWage}
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono font-bold text-ink/60">
              ₹
            </span>
            <input
              id="actual-wage-input"
              type="number"
              min={0}
              max={10000}
              step={10}
              value={actualWage}
              onChange={(e) => setActualWage(Math.max(0, Number(e.target.value) || 0))}
              className="w-full pl-8 pr-3 py-2 border-2 border-ink bg-bg font-mono font-bold text-base text-ink focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
        </div>

        {/* Days Worked Per Month */}
        <div className="space-y-1.5">
          <label
            htmlFor="days-worked-input"
            className="block font-heading font-bold text-xs sm:text-sm text-ink"
          >
            {t.risk.daysWorked}
          </label>
          <input
            id="days-worked-input"
            type="number"
            min={1}
            max={31}
            value={daysWorked}
            onChange={(e) =>
              setDaysWorked(Math.min(31, Math.max(1, Number(e.target.value) || 1)))
            }
            className="w-full px-3 py-2 border-2 border-ink bg-bg font-mono font-bold text-base text-ink focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>

        {/* Statutory Minimum Wage */}
        <div className="space-y-1.5">
          <label
            htmlFor="statutory-wage-input"
            className="block font-heading font-bold text-xs sm:text-sm text-ink"
          >
            {t.risk.statutoryMinWage}
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono font-bold text-ink/60">
              ₹
            </span>
            <input
              id="statutory-wage-input"
              type="number"
              min={0}
              max={10000}
              step={10}
              value={statutoryWage}
              onChange={(e) => setStatutoryWage(Math.max(0, Number(e.target.value) || 0))}
              className="w-full pl-8 pr-3 py-2 border-2 border-ink bg-bg font-mono font-bold text-base text-ink focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
        </div>
      </div>

      {/* Outcome Banner */}
      {isUnderpaid ? (
        <div className="border-3 border-risk-high bg-risk-high/10 p-4 sm:p-5 shadow-brutal space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="inline-block bg-risk-high text-surface px-2.5 py-0.5 font-mono text-xs font-black uppercase">
              ⚠️ {t.risk.underpaidTitle}
            </div>
            <div className="font-mono text-xs text-risk-high font-bold">
              ₹{underpaidPerDay.toLocaleString("en-IN")} / day under statutory floor
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-xs font-mono font-bold text-ink/80">
              {t.risk.underpaidPerMonth}
            </div>
            <div className="font-mono font-black text-3xl sm:text-4xl text-risk-high">
              ₹{totalMonthlyArrears.toLocaleString("en-IN")}
            </div>
          </div>

          <div className="pt-2 border-t border-risk-high/30">
            <Link
              to={`/rights?state=${encodeURIComponent(state)}&query=${encodeURIComponent(
                `My employer pays me ₹${actualWage}/day in ${state} for ${sector} work, but the notified rate is ₹${statutoryWage}/day. How can I claim my arrears of ₹${totalMonthlyArrears} per month?`
              )}`}
              className="btn-press-sm inline-block px-4 py-2 border-2 border-ink bg-accent text-ink font-heading font-black text-xs sm:text-sm shadow-brutal-sm"
            >
              {t.risk.claimArrearsCta}
            </Link>
          </div>
        </div>
      ) : (
        <div className="border-3 border-risk-low bg-risk-low/10 p-4 sm:p-5 shadow-brutal space-y-2">
          <div className="inline-block bg-risk-low text-surface px-2.5 py-0.5 font-mono text-xs font-black uppercase">
            ✓ {t.risk.compliantTitle}
          </div>
          <p className="font-body text-xs sm:text-sm text-ink/90 leading-relaxed">
            {t.risk.compliantDesc} (₹{actualWage}/day ≥ ₹{statutoryWage}/day)
          </p>
        </div>
      )}
    </div>
  );
};
