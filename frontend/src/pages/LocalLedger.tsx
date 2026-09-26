/**
 * Local-first work & wage ledger page.
 * Stored 100% in browser IndexedDB with zero server persistence.
 * Includes discreet mode, evidence PDF export, Section 45(6) limitation advisory,
 * and P2P offline QR caseworker handoff.
 */
import React, { useEffect, useState } from "react";
import { useI18n } from "../lib/i18n";
import {
  ShiftEntry,
  DisputeClaim,
  LedgerSummary,
  LedgerProvisions,
  LedgerExportPayload,
} from "../lib/ledger/types";
import {
  getAllShifts,
  addShift,
  deleteShift,
  clearAllShifts,
  getDisputeClaim,
  saveDisputeClaim,
  calculateLedgerSummary,
} from "../lib/ledger/db";
import { calculateLimitationCountdown } from "../lib/ledger/countdown";
import { generateStatementPDF } from "../lib/ledger/pdf";
import { DiscreetView } from "../components/DiscreetView";
import { ConsentModal } from "../components/ConsentModal";
import { fetchLedgerProvisions } from "../lib/api";

const INDIAN_STATES = [
  "Maharashtra",
  "Delhi",
  "Karnataka",
  "Tamil Nadu",
  "Kerala",
  "Telangana",
  "Gujarat",
  "Rajasthan",
  "Uttar Pradesh",
  "West Bengal",
  "Haryana",
  "Punjab",
  "Bihar",
  "Madhya Pradesh",
  "Central Sphere",
];

export const LocalLedger: React.FC = () => {
  const { t, lang } = useI18n();

  // State
  const [shifts, setShifts] = useState<ShiftEntry[]>([]);
  const [summary, setSummary] = useState<LedgerSummary>({
    totalShifts: 0,
    totalStandardHours: 0,
    totalOvertimeHours: 0,
    totalAdvancesReceived: 0,
    totalAgreedPay: 0,
    statutoryWageFloor: 532,
    totalStatutoryDue: 0,
    netArrearsOwed: 0,
  });
  const [disputeClaim, setDisputeClaim] = useState<DisputeClaim>({
    incidentDate: "",
    state: "Maharashtra",
    sector: "Construction",
    employerOrContractor: "",
    claimDescription: "",
  });

  const [discreetActive, setDiscreetActive] = useState<boolean>(false);
  const [showConsentModal, setShowConsentModal] = useState<boolean>(false);
  const [pdfGenerating, setPdfGenerating] = useState<boolean>(false);
  const [pdfSuccess, setPdfSuccess] = useState<string | null>(null);

  // Shift form fields
  const todayStr = new Date().toISOString().split("T")[0];
  const [date, setDate] = useState<string>(todayStr);
  const [standardHours, setStandardHours] = useState<number>(8);
  const [overtimeHours, setOvertimeHours] = useState<number>(0);
  const [advanceReceived, setAdvanceReceived] = useState<number>(0);
  const [dailyAgreedRate, setDailyAgreedRate] = useState<number | undefined>(undefined);
  const [siteOrContractorName, setSiteOrContractorName] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [formError, setFormError] = useState<string | null>(null);

  // Load initial data from IndexedDB
  const refreshData = async () => {
    try {
      const records = await getAllShifts();
      setShifts(records);
      const summ = calculateLedgerSummary(records, 532);
      setSummary(summ);

      const claim = await getDisputeClaim();
      if (claim) {
        setDisputeClaim(claim);
      }
    } catch (err) {
      console.error("Failed to load ledger records from IndexedDB:", err);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  // Form submission
  const handleAddShift = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!date) {
      setFormError("Shift date is required.");
      return;
    }
    if (standardHours < 0 || overtimeHours < 0 || advanceReceived < 0) {
      setFormError("Hours and advances must be non-negative.");
      return;
    }

    try {
      await addShift({
        date,
        standardHours: Number(standardHours),
        overtimeHours: Number(overtimeHours),
        advanceReceived: Number(advanceReceived),
        dailyAgreedRate: dailyAgreedRate ? Number(dailyAgreedRate) : undefined,
        siteOrContractorName: siteOrContractorName.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      // Reset form
      setOvertimeHours(0);
      setAdvanceReceived(0);
      setNotes("");
      await refreshData();
    } catch (err) {
      console.error("Failed to record shift:", err);
      setFormError("Failed to save entry to device storage.");
    }
  };

  // Delete shift
  const handleDeleteShift = async (id: string) => {
    try {
      await deleteShift(id);
      await refreshData();
    } catch (err) {
      console.error("Failed to delete shift:", err);
    }
  };

  // Clear all shifts
  const handleClearAll = async () => {
    const confirmMsg =
      lang === "hi"
        ? "क्या आप निश्चित रूप से डायरी से सारा डेटा मिटाना चाहते हैं? यह क्रिया वापस नहीं ली जा सकती।"
        : "Are you sure you want to erase all shift records from this device? This action cannot be undone.";

    if (window.confirm(confirmMsg)) {
      await clearAllShifts();
      await refreshData();
    }
  };

  // Update claim details
  const handleSaveClaim = async () => {
    try {
      await saveDisputeClaim(disputeClaim);
      alert(lang === "hi" ? "विवाद विवरण सहेजा गया।" : "Dispute claim details saved locally.");
    } catch (err) {
      console.error("Failed to save dispute details:", err);
    }
  };

  // Generate and download client-side evidence PDF
  const handleExportPDF = async () => {
    if (!shifts || shifts.length === 0) {
      alert(
        lang === "hi"
          ? "PDF निर्यात करने के लिए कम से कम एक कार्य प्रविष्टि (shift) जोड़ें।"
          : "Cannot export PDF: No shifts logged. Please log at least one shift entry."
      );
      return;
    }
    setPdfGenerating(true);
    setPdfSuccess(null);
    try {
      let provisions: LedgerProvisions | null = null;
      try {
        provisions = await fetchLedgerProvisions(disputeClaim.state || "Maharashtra");
      } catch (err) {
        console.warn("Could not retrieve RAG provisions; proceeding with central statute defaults:", err);
      }

      const doc = generateStatementPDF({
        shifts,
        summary,
        claim: disputeClaim.incidentDate ? disputeClaim : null,
        provisions,
      });

      const fileName = `wageguard_evidence_${disputeClaim.incidentDate || todayStr}.pdf`;
      doc.save(fileName);
      setPdfSuccess(lang === "hi" ? `PDF डाउनलोड हो गया: ${fileName}` : `PDF saved: ${fileName}`);
    } catch (err) {
      console.error("PDF generation failed:", err);
      const msg = err instanceof Error ? err.message : "Failed to create PDF. Please try again.";
      alert(msg);
    } finally {
      setPdfGenerating(false);
    }
  };

  // Prepare payload for QR handoff
  const qrExportPayload: LedgerExportPayload = {
    version: "1.0",
    exportedAt: new Date().toISOString(),
    shifts,
    summary,
    disputeClaim: disputeClaim.incidentDate ? disputeClaim : null,
  };

  // Limitation countdown calculation if incident date is present
  const countdown = disputeClaim.incidentDate
    ? calculateLimitationCountdown(disputeClaim.incidentDate)
    : null;

  // Render Discreet View if active
  if (discreetActive) {
    return <DiscreetView onExit={() => setDiscreetActive(false)} />;
  }

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in">
      {/* Privacy & Discreet Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-2 border-ink bg-surface p-3 shadow-brutal-sm">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2.5 h-2.5 bg-risk-low border border-ink"></span>
          <span className="font-mono text-xs font-bold text-ink">
            🔒 100% Client-Side • Stored in IndexedDB • Zero Network Sync
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setDiscreetActive(true)}
            className="min-h-[44px] px-3 py-1.5 bg-accent text-ink font-mono font-bold text-xs border-2 border-ink shadow-brutal-sm hover:translate-x-0.5 hover:translate-y-0.5 active:shadow-none transition-transform"
            title="Hide work diary as a calculator or neutral notes app"
          >
            {t.ledger.discreetModeBtn}
          </button>
        </div>
      </div>

      {/* Page Title & Subtitle */}
      <div className="space-y-2">
        <h1 className="text-3xl sm:text-4xl font-heading font-black tracking-tight text-ink">
          {t.ledger.title}
        </h1>
        <p className="text-sm sm:text-base font-body text-ink/80 max-w-2xl">
          {t.ledger.subtitle}
        </p>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="border-3 border-ink bg-surface p-3.5 shadow-brutal-sm space-y-1">
          <div className="font-mono text-[11px] font-bold text-ink/70 uppercase">
            {t.ledger.totalShifts}
          </div>
          <div className="font-heading font-black text-2xl sm:text-3xl text-ink">
            {summary.totalShifts}
          </div>
        </div>

        <div className="border-3 border-ink bg-surface p-3.5 shadow-brutal-sm space-y-1">
          <div className="font-mono text-[11px] font-bold text-ink/70 uppercase">
            {t.ledger.totalHours}
          </div>
          <div className="font-heading font-black text-2xl sm:text-3xl text-ink">
            {summary.totalStandardHours + summary.totalOvertimeHours}
            <span className="text-xs font-mono font-normal ml-1">h</span>
          </div>
          {summary.totalOvertimeHours > 0 && (
            <div className="text-[10px] font-mono text-ink/60">
              ({summary.totalOvertimeHours}h overtime)
            </div>
          )}
        </div>

        <div className="border-3 border-ink bg-surface p-3.5 shadow-brutal-sm space-y-1">
          <div className="font-mono text-[11px] font-bold text-ink/70 uppercase">
            {t.ledger.totalAdvances}
          </div>
          <div className="font-heading font-black text-2xl sm:text-3xl text-ink">
            ₹{summary.totalAdvancesReceived.toLocaleString("en-IN")}
          </div>
        </div>

        <div className="border-3 border-ink bg-accent p-3.5 shadow-brutal-sm space-y-1">
          <div className="font-mono text-[11px] font-bold text-ink uppercase">
            {t.ledger.totalArrears}
          </div>
          <div className="font-heading font-black text-2xl sm:text-3xl text-ink">
            ₹{summary.netArrearsOwed.toLocaleString("en-IN")}
          </div>
          <div className="text-[10px] font-mono text-ink/80">
            @ ₹{summary.statutoryWageFloor}/day floor
          </div>
        </div>
      </div>

      {/* Main Content: Split into Log Shift Form and History */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form: Log Shift (5 cols) */}
        <div className="lg:col-span-5 border-3 border-ink bg-surface p-4 sm:p-5 shadow-brutal space-y-4">
          <h2 className="font-heading font-black text-xl text-ink border-b-2 border-ink pb-2">
            {t.ledger.logShiftTitle}
          </h2>

          {formError && (
            <div className="p-2 border-2 border-risk-high bg-risk-high/15 font-mono text-xs text-ink font-bold">
              {formError}
            </div>
          )}

          <form onSubmit={handleAddShift} className="space-y-3.5">
            <div>
              <label className="block font-mono text-xs font-bold text-ink mb-1">
                {t.ledger.dateLabel} *
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full min-h-[44px] px-3 py-2 border-2 border-ink bg-bg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-mono text-xs font-bold text-ink mb-1">
                  {t.ledger.stdHoursLabel}
                </label>
                <input
                  type="number"
                  min="0"
                  max="24"
                  step="0.5"
                  value={standardHours}
                  onChange={(e) => setStandardHours(parseFloat(e.target.value) || 0)}
                  className="w-full min-h-[44px] px-3 py-2 border-2 border-ink bg-bg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
              <div>
                <label className="block font-mono text-xs font-bold text-ink mb-1">
                  {t.ledger.otHoursLabel}
                </label>
                <input
                  type="number"
                  min="0"
                  max="24"
                  step="0.5"
                  value={overtimeHours}
                  onChange={(e) => setOvertimeHours(parseFloat(e.target.value) || 0)}
                  className="w-full min-h-[44px] px-3 py-2 border-2 border-ink bg-bg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-mono text-xs font-bold text-ink mb-1">
                  {t.ledger.advanceLabel}
                </label>
                <input
                  type="number"
                  min="0"
                  step="10"
                  value={advanceReceived}
                  onChange={(e) => setAdvanceReceived(parseFloat(e.target.value) || 0)}
                  className="w-full min-h-[44px] px-3 py-2 border-2 border-ink bg-bg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
              <div>
                <label className="block font-mono text-xs font-bold text-ink mb-1">
                  {t.ledger.rateLabel}
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="e.g. 600"
                  value={dailyAgreedRate ?? ""}
                  onChange={(e) =>
                    setDailyAgreedRate(e.target.value ? parseFloat(e.target.value) : undefined)
                  }
                  className="w-full min-h-[44px] px-3 py-2 border-2 border-ink bg-bg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
            </div>

            <div>
              <label className="block font-mono text-xs font-bold text-ink mb-1">
                {t.ledger.contractorLabel}
              </label>
              <input
                type="text"
                maxLength={60}
                placeholder="e.g. Metro Line 3 / Contractor Ramesh"
                value={siteOrContractorName}
                onChange={(e) => setSiteOrContractorName(e.target.value)}
                className="w-full min-h-[44px] px-3 py-2 border-2 border-ink bg-bg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            <div>
              <label className="block font-mono text-xs font-bold text-ink mb-1">
                {t.ledger.notesLabel}
              </label>
              <input
                type="text"
                maxLength={100}
                placeholder="e.g. Shuttering work, night shift"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full min-h-[44px] px-3 py-2 border-2 border-ink bg-bg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            <button
              type="submit"
              className="w-full min-h-[44px] py-2.5 px-4 bg-accent text-ink font-heading font-black text-sm border-2 border-ink shadow-brutal-sm hover:translate-x-0.5 hover:translate-y-0.5 active:shadow-none transition-transform"
            >
              + {t.ledger.submitShift}
            </button>
          </form>
        </div>

        {/* Right Log List (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="border-3 border-ink bg-surface p-4 sm:p-5 shadow-brutal space-y-3">
            <div className="flex items-center justify-between border-b-2 border-ink pb-2">
              <h2 className="font-heading font-black text-xl text-ink">
                Logged Shifts ({shifts.length})
              </h2>
              {shifts.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="font-mono text-xs font-bold text-risk-high hover:underline"
                >
                  {t.ledger.clearLedgerBtn}
                </button>
              )}
            </div>

            {shifts.length === 0 ? (
              <div className="p-6 text-center text-ink/70 font-mono text-xs border-2 border-dashed border-ink/40">
                {t.ledger.noShifts}
              </div>
            ) : (
              <div className="max-h-[380px] overflow-y-auto space-y-2 pr-1">
                {shifts.map((s) => (
                  <div
                    key={s.id}
                    className="border-2 border-ink bg-bg p-2.5 flex items-start justify-between gap-3 text-xs font-mono"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-ink text-sm">{s.date}</span>
                        <span className="bg-surface px-1.5 py-0.5 border border-ink text-[11px]">
                          {s.standardHours}h std
                          {s.overtimeHours ? ` + ${s.overtimeHours}h OT` : ""}
                        </span>
                      </div>
                      <div className="text-ink/80 text-[11px]">
                        Advance: ₹{s.advanceReceived} | Rate: {s.dailyAgreedRate ? `₹${s.dailyAgreedRate}` : "Statutory"}
                      </div>
                      {(s.siteOrContractorName || s.notes) && (
                        <div className="text-ink/70 text-[10px] italic">
                          {s.siteOrContractorName && `[${s.siteOrContractorName}] `}
                          {s.notes}
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteShift(s.id)}
                      className="min-h-[44px] min-w-[44px] flex items-center justify-center text-risk-high font-bold hover:bg-risk-high/10 text-base"
                      title="Delete shift entry"
                      aria-label="Delete shift entry"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action Row: Export PDF and Caseworker QR */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handleExportPDF}
              disabled={pdfGenerating || shifts.length === 0}
              className={`min-h-[44px] px-4 py-2.5 font-heading font-black text-sm border-2 border-ink shadow-brutal-sm transition-transform flex items-center justify-center gap-2 ${
                shifts.length === 0
                  ? "bg-ink/10 text-ink/40 cursor-not-allowed border-ink/40 shadow-none"
                  : "bg-surface hover:bg-accent text-ink hover:translate-x-0.5 hover:translate-y-0.5 active:shadow-none"
              }`}
            >
              {pdfGenerating ? "Generating PDF..." : t.ledger.exportPdfBtn}
            </button>

            <button
              type="button"
              onClick={() => setShowConsentModal(true)}
              disabled={shifts.length === 0}
              className={`min-h-[44px] px-4 py-2.5 font-heading font-black text-sm border-2 border-ink shadow-brutal-sm transition-transform flex items-center justify-center gap-2 ${
                shifts.length === 0
                  ? "bg-ink/10 text-ink/40 cursor-not-allowed border-ink/40 shadow-none"
                  : "bg-accent text-ink hover:translate-x-0.5 hover:translate-y-0.5 active:shadow-none"
              }`}
            >
              {t.ledger.qrShareBtn}
            </button>
          </div>

          {pdfSuccess && (
            <div className="p-2 border-2 border-risk-low bg-risk-low/20 font-mono text-xs text-ink font-bold">
              ✓ {pdfSuccess}
            </div>
          )}
        </div>
      </div>

      {/* Dispute Claim & Section 45(6) Limitation View */}
      {/* Kept inside the ledger detail / dispute section, NOT on the home-screen widget */}
      <div className="border-3 border-ink bg-surface p-4 sm:p-6 shadow-brutal space-y-4">
        <div className="border-b-2 border-ink pb-2">
          <span className="bg-ink text-surface px-2 py-0.5 font-mono text-[10px] font-bold uppercase">
            Statutory Legal Claim
          </span>
          <h2 className="font-heading font-black text-xl text-ink mt-1">
            {t.ledger.disputeTitle}
          </h2>
          <p className="font-mono text-xs text-ink/75">
            {t.ledger.statutoryNoticeDesc}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block font-mono text-xs font-bold text-ink mb-1">
              {t.ledger.disputeDateLabel}
            </label>
            <input
              type="date"
              value={disputeClaim.incidentDate}
              onChange={(e) =>
                setDisputeClaim({ ...disputeClaim, incidentDate: e.target.value })
              }
              className="w-full min-h-[44px] px-3 py-2 border-2 border-ink bg-bg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          <div>
            <label className="block font-mono text-xs font-bold text-ink mb-1">
              State Jurisdiction
            </label>
            <select
              value={disputeClaim.state}
              onChange={(e) =>
                setDisputeClaim({ ...disputeClaim, state: e.target.value })
              }
              className="w-full min-h-[44px] px-3 py-2 border-2 border-ink bg-bg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            >
              {INDIAN_STATES.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-mono text-xs font-bold text-ink mb-1">
              Employer / Contractor
            </label>
            <input
              type="text"
              placeholder="e.g. Apex Builders Pvt Ltd"
              value={disputeClaim.employerOrContractor}
              onChange={(e) =>
                setDisputeClaim({ ...disputeClaim, employerOrContractor: e.target.value })
              }
              className="w-full min-h-[44px] px-3 py-2 border-2 border-ink bg-bg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleSaveClaim}
            className="min-h-[44px] px-4 py-2 border-2 border-ink bg-bg font-mono text-xs font-bold hover:bg-surface shadow-brutal-sm"
          >
            Save Claim Meta (Local Device Only)
          </button>
        </div>

        {/* Limitation Countdown & Advisory Banner */}
        {countdown && (
          <div className="border-2 border-ink bg-bg p-4 space-y-2 mt-2">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ink/20 pb-2">
              <span className="font-heading font-black text-sm text-ink uppercase">
                {t.ledger.statutoryNoticeTitle}
              </span>
              <span className="font-mono text-xs font-bold bg-accent border border-ink px-2 py-0.5">
                {countdown.statutoryReference}
              </span>
            </div>

            <div className="flex items-baseline gap-3">
              <span className="font-heading font-black text-3xl text-ink">
                {countdown.daysRemaining}
              </span>
              <span className="font-mono text-sm font-bold text-ink/80">
                {t.ledger.limitationDaysRemaining} (Deadline: {countdown.deadlineDateStr})
              </span>
            </div>

            {/* Mandatory Advisory Notice */}
            <div className="p-3 border-l-4 border-risk-high bg-surface text-xs font-body text-ink space-y-1">
              <div className="font-bold text-risk-high flex items-center gap-1.5">
                <span>⚠️ Important Strategic Advisory:</span>
              </div>
              <p className="font-bold leading-relaxed">{countdown.advisoryText}</p>
              <p className="text-[11px] text-ink/75 font-mono">
                Under Section 59 of the Code on Wages 2019, the legal burden of proof lies on the employer to prove payment. However, acting swiftly ensures evidence preservation and contractor accountability.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Consent Modal for QR Handoff */}
      {showConsentModal && (
        <ConsentModal
          payload={qrExportPayload}
          onClose={() => setShowConsentModal(false)}
        />
      )}
    </div>
  );
};
