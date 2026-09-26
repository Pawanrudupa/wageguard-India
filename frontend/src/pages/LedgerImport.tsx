/**
 * Caseworker QR Code Import page for P2P offline ledger transfer.
 * Allows caseworkers or legal aid advocates to scan a worker's encrypted QR code
 * using an in-app camera scanner or file upload, enter the 4-digit PIN, and view/export records.
 */
import React, { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Link, useLocation } from "react-router-dom";
import {
  decodeLedgerFromQRPayload,
  extractPayloadFromScannedText,
} from "../lib/ledger/qr";
import { LedgerExportPayload } from "../lib/ledger/types";
import { calculateLimitationCountdown } from "../lib/ledger/countdown";
import { generateStatementPDF } from "../lib/ledger/pdf";
import { addShift, saveDisputeClaim } from "../lib/ledger/db";

export const LedgerImport: React.FC = () => {
  const location = useLocation();

  // State
  const [rawPayload, setRawPayload] = useState<string>("");
  const [pin, setPin] = useState<string>("");
  const [decodedData, setDecodedData] = useState<LedgerExportPayload | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [decryptError, setDecryptError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  const [pdfGenerating, setPdfGenerating] = useState<boolean>(false);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Parse URL hash or query on mount
  useEffect(() => {
    const hash = window.location.hash;
    const search = window.location.search;
    const initialText = hash || search || "";
    if (initialText) {
      const extracted = extractPayloadFromScannedText(initialText);
      if (extracted.startsWith("WG1:")) {
        setRawPayload(extracted);
      }
    }
  }, [location]);

  // Clean up scanner on unmount
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current
          .stop()
          .then(() => scannerRef.current?.clear())
          .catch(() => {});
      }
    };
  }, []);

  const handleScannedPayload = (text: string) => {
    setScanError(null);
    const extracted = extractPayloadFromScannedText(text);
    if (!extracted || !extracted.startsWith("WG1:")) {
      setScanError("Scanned QR code does not contain a valid WageGuard ledger payload.");
      return;
    }
    setRawPayload(extracted);
    // If scanning was active, stop camera
    if (scannerRef.current && isScanning) {
      scannerRef.current
        .stop()
        .then(() => {
          setIsScanning(false);
          scannerRef.current?.clear();
        })
        .catch(() => setIsScanning(false));
    }
  };

  const startCameraScan = async () => {
    setScanError(null);
    try {
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode("qr-camera-reader");
      }
      setIsScanning(true);
      await scannerRef.current.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          handleScannedPayload(decodedText);
        },
        () => {
          // ignore stream frame scan misses
        }
      );
    } catch (err) {
      console.error("Camera access error:", err);
      setIsScanning(false);
      setScanError(
        "Camera access could not be started. You can also upload a QR photo or paste the code below."
      );
    }
  };

  const stopCameraScan = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (err) {
        console.error("Error stopping camera:", err);
      }
    }
    setIsScanning(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setScanError(null);
    try {
      const fileScanner = new Html5Qrcode("qr-file-reader");
      const result = await fileScanner.scanFile(file, true);
      handleScannedPayload(result);
      fileScanner.clear();
    } catch (err) {
      console.error("File scan error:", err);
      setScanError("Could not detect a valid QR code in this image. Please check lighting or crop.");
    }
  };

  const handleDecrypt = (e: React.FormEvent) => {
    e.preventDefault();
    setDecryptError(null);

    if (!rawPayload.startsWith("WG1:")) {
      setDecryptError("Invalid payload format. Expected WG1 header.");
      return;
    }
    if (!/^\d{4}$/.test(pin)) {
      setDecryptError("Please enter the exact 4-digit PIN provided by the worker.");
      return;
    }

    try {
      const result = decodeLedgerFromQRPayload(rawPayload, pin);
      setDecodedData(result);
    } catch (err) {
      console.error("Decryption failed:", err);
      setDecryptError("Incorrect 4-digit PIN or corrupted QR payload. Please verify with the worker.");
    }
  };

  const handleExportPDF = () => {
    if (!decodedData) return;
    setPdfGenerating(true);
    try {
      const doc = generateStatementPDF({
        shifts: decodedData.shifts,
        summary: decodedData.summary,
        claim: decodedData.disputeClaim,
        provisions: null,
      });
      const incidentDate = decodedData.disputeClaim?.incidentDate || "record";
      doc.save(`caseworker_evidence_statement_${incidentDate}.pdf`);
    } catch (err) {
      console.error("Failed to generate PDF:", err);
      alert("Failed to export PDF statement.");
    } finally {
      setPdfGenerating(false);
    }
  };

  const handleSaveToLocalLedger = async () => {
    if (!decodedData) return;
    try {
      for (const shift of decodedData.shifts) {
        await addShift({
          date: shift.date,
          standardHours: shift.standardHours,
          overtimeHours: shift.overtimeHours,
          advanceReceived: shift.advanceReceived,
          dailyAgreedRate: shift.dailyAgreedRate,
          siteOrContractorName: shift.siteOrContractorName,
          notes: shift.notes ? `[Imported] ${shift.notes}` : "[Imported via QR]",
        });
      }
      if (decodedData.disputeClaim) {
        await saveDisputeClaim(decodedData.disputeClaim);
      }
      setImportSuccess(
        `Successfully imported ${decodedData.shifts.length} shifts into this device's Work Diary.`
      );
    } catch (err) {
      console.error("Failed to save shifts locally:", err);
      alert("Failed to save shifts into local IndexedDB storage.");
    }
  };

  const handleReset = () => {
    setDecodedData(null);
    setRawPayload("");
    setPin("");
    setDecryptError(null);
    setScanError(null);
    setImportSuccess(null);
    window.location.hash = "";
  };

  const countdown = decodedData?.disputeClaim?.incidentDate
    ? calculateLimitationCountdown(decodedData.disputeClaim.incidentDate)
    : null;

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in max-w-3xl mx-auto">
      {/* Top Banner & Navigation */}
      <div className="flex items-center justify-between border-b-2 border-ink pb-3">
        <div>
          <span className="bg-accent px-2 py-0.5 border border-ink font-mono text-[10px] font-bold uppercase">
            Advocate / Caseworker Tool
          </span>
          <h1 className="text-2xl sm:text-3xl font-heading font-black text-ink mt-1">
            Import Worker Ledger Docket
          </h1>
        </div>
        <Link
          to="/ledger"
          className="min-h-[44px] px-3 py-1.5 border-2 border-ink bg-surface font-mono text-xs font-bold flex items-center hover:bg-bg shadow-brutal-sm"
        >
          ← Back to Diary
        </Link>
      </div>

      {/* Hidden container for file-based scanner */}
      <div id="qr-file-reader" className="hidden" />

      {/* If data is NOT yet decoded, show Scanner & PIN form */}
      {!decodedData ? (
        <div className="space-y-6">
          {/* Section 1: In-App QR Scanner */}
          <div className="border-3 border-ink bg-surface p-4 sm:p-5 shadow-brutal space-y-4">
            <div className="flex items-center justify-between border-b-2 border-ink pb-2">
              <h2 className="font-heading font-black text-lg text-ink">
                1. Scan Worker's QR Code
              </h2>
              <span className="font-mono text-xs text-ink/70">P2P In-App Scanner</span>
            </div>

            {scanError && (
              <div className="p-3 border-2 border-risk-high bg-risk-high/15 font-mono text-xs text-ink font-bold">
                ⚠️ {scanError}
              </div>
            )}

            {/* Camera Viewport */}
            <div className="flex flex-col items-center">
              <div
                id="qr-camera-reader"
                className={`w-full max-w-sm border-2 border-dashed border-ink bg-bg overflow-hidden ${
                  isScanning ? "block min-h-[260px]" : "hidden"
                }`}
              />

              {!isScanning ? (
                <div className="w-full flex flex-col sm:flex-row gap-3 pt-2">
                  <button
                    type="button"
                    onClick={startCameraScan}
                    className="btn-press flex-1 min-h-[48px] py-2.5 px-4 bg-accent text-ink font-heading font-black text-sm border-2 border-ink shadow-brutal-sm flex items-center justify-center gap-2"
                  >
                    📷 Start In-App Camera Scanner
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="btn-press flex-1 min-h-[48px] py-2.5 px-4 bg-surface text-ink font-heading font-bold text-sm border-2 border-ink shadow-brutal-sm flex items-center justify-center gap-2 hover:bg-bg"
                  >
                    🖼️ Upload QR Image / Screenshot
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>
              ) : (
                <button
                  type="button"
                  onClick={stopCameraScan}
                  className="btn-press w-full max-w-sm mt-3 min-h-[44px] py-2 px-4 bg-risk-high text-surface font-mono font-bold text-xs border-2 border-ink"
                >
                  ⏹ Stop Camera
                </button>
              )}
            </div>

            {/* Manual QR Payload / URL input fallback */}
            <div className="pt-2 border-t border-ink/20 space-y-1.5">
              <label className="block font-mono text-xs font-bold text-ink">
                Or Paste Encrypted Payload / Caseworker Link:
              </label>
              <input
                type="text"
                placeholder="WG1:... or http://localhost:5173/ledger/import#data=..."
                value={rawPayload}
                onChange={(e) => handleScannedPayload(e.target.value)}
                className="w-full min-h-[44px] px-3 py-2 border-2 border-ink bg-bg font-mono text-xs focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
          </div>

          {/* Section 2: Decrypt with Verbal 4-Digit PIN */}
          <div className="border-3 border-ink bg-surface p-4 sm:p-5 shadow-brutal space-y-4">
            <div className="border-b-2 border-ink pb-2">
              <h2 className="font-heading font-black text-lg text-ink">
                2. Enter Worker's 4-Digit PIN
              </h2>
              <p className="font-body text-xs text-ink/80">
                Ask the worker for the 4-digit verbal PIN displayed on their handset screen.
              </p>
            </div>

            {decryptError && (
              <div className="p-3 border-2 border-risk-high bg-risk-high/15 font-mono text-xs text-ink font-bold">
                ✕ {decryptError}
              </div>
            )}

            <form onSubmit={handleDecrypt} className="space-y-4">
              <div>
                <label className="block font-mono text-xs font-bold text-ink mb-1">
                  Worker Verbal PIN (4 Digits) *
                </label>
                <input
                  type="text"
                  maxLength={4}
                  pattern="\d{4}"
                  placeholder="e.g. 5482"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                  required
                  className="w-48 min-h-[48px] px-4 py-2 border-3 border-ink bg-bg font-mono font-black text-2xl tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>

              <button
                type="submit"
                disabled={!rawPayload || pin.length !== 4}
                className={`w-full min-h-[48px] py-3 px-4 font-heading font-black text-base border-3 border-ink shadow-brutal transition-transform ${
                  !rawPayload || pin.length !== 4
                    ? "bg-ink/10 text-ink/40 cursor-not-allowed border-ink/40 shadow-none"
                    : "bg-accent text-ink hover:translate-x-0.5 hover:translate-y-0.5 active:shadow-none"
                }`}
              >
                🔓 Decrypt & Verify Worker Docket
              </button>
            </form>
          </div>
        </div>
      ) : (
        /* Section 3: Decrypted Docket Display */
        <div className="space-y-6">
          <div className="p-3 border-2 border-risk-low bg-risk-low/20 font-mono text-xs text-ink font-bold flex items-center justify-between">
            <span>✓ Worker Docket Successfully Decrypted & Authenticated</span>
            <button
              type="button"
              onClick={handleReset}
              className="text-ink underline hover:text-ink/70"
            >
              Scan Another Docket 🔄
            </button>
          </div>

          {importSuccess && (
            <div className="p-3 border-2 border-ink bg-surface font-mono text-xs text-ink font-bold">
              ✓ {importSuccess}
            </div>
          )}

          {/* Aggregate KPI Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="border-3 border-ink bg-surface p-3 shadow-brutal-sm">
              <div className="font-mono text-[10px] text-ink/70 uppercase">Shifts Recorded</div>
              <div className="font-heading font-black text-2xl text-ink">
                {decodedData.summary.totalShifts}
              </div>
            </div>
            <div className="border-3 border-ink bg-surface p-3 shadow-brutal-sm">
              <div className="font-mono text-[10px] text-ink/70 uppercase">Total Work Hours</div>
              <div className="font-heading font-black text-2xl text-ink">
                {decodedData.summary.totalStandardHours + decodedData.summary.totalOvertimeHours}h
              </div>
            </div>
            <div className="border-3 border-ink bg-surface p-3 shadow-brutal-sm">
              <div className="font-mono text-[10px] text-ink/70 uppercase">Advances Logged</div>
              <div className="font-heading font-black text-2xl text-ink">
                ₹{decodedData.summary.totalAdvancesReceived.toLocaleString("en-IN")}
              </div>
            </div>
            <div className="border-3 border-ink bg-accent p-3 shadow-brutal-sm">
              <div className="font-mono text-[10px] text-ink uppercase">Computed Arrears</div>
              <div className="font-heading font-black text-2xl text-ink">
                ₹{decodedData.summary.netArrearsOwed.toLocaleString("en-IN")}
              </div>
            </div>
          </div>

          {/* Caseworker Action Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handleExportPDF}
              disabled={pdfGenerating}
              className="btn-press min-h-[48px] py-3 px-4 bg-surface text-ink font-heading font-black text-sm border-3 border-ink shadow-brutal hover:bg-accent flex items-center justify-center gap-2"
            >
              {pdfGenerating ? "Generating..." : "📄 Export Official Evidence PDF"}
            </button>
            <button
              type="button"
              onClick={handleSaveToLocalLedger}
              className="btn-press min-h-[48px] py-3 px-4 bg-accent text-ink font-heading font-black text-sm border-3 border-ink shadow-brutal flex items-center justify-center gap-2"
            >
              💾 Save Docket to My Work Diary
            </button>
          </div>

          {/* Claim Metadata & Section 45(6) Limitation View */}
          {decodedData.disputeClaim && (
            <div className="border-3 border-ink bg-surface p-4 sm:p-5 shadow-brutal space-y-3">
              <h3 className="font-heading font-black text-lg text-ink border-b-2 border-ink pb-1">
                Dispute Claim Details
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-mono">
                <div>
                  <span className="text-ink/60">State Jurisdiction:</span>
                  <div className="font-bold text-ink">{decodedData.disputeClaim.state || "-"}</div>
                </div>
                <div>
                  <span className="text-ink/60">Work Sector:</span>
                  <div className="font-bold text-ink">{decodedData.disputeClaim.sector || "-"}</div>
                </div>
                <div>
                  <span className="text-ink/60">Employer / Contractor:</span>
                  <div className="font-bold text-ink">
                    {decodedData.disputeClaim.employerOrContractor || "-"}
                  </div>
                </div>
              </div>

              {countdown && (
                <div className="p-3 border-2 border-ink bg-bg space-y-1.5 mt-2">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="font-bold uppercase">Section 45(6) Statutory Limitation</span>
                    <span className="bg-accent px-2 py-0.5 border border-ink font-bold">
                      {countdown.daysRemaining} days remaining
                    </span>
                  </div>
                  <div className="text-[11px] font-mono text-ink/75">
                    Incident Date: {decodedData.disputeClaim.incidentDate} | Deadline: {countdown.deadlineDateStr}
                  </div>
                  <div className="text-xs font-body font-bold text-risk-high">
                    ⚠️ {countdown.advisoryText}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Shift Entries Table */}
          <div className="border-3 border-ink bg-surface p-4 sm:p-5 shadow-brutal space-y-3">
            <h3 className="font-heading font-black text-lg text-ink border-b-2 border-ink pb-1">
              Contemporaneous Work Shift History ({decodedData.shifts.length} Entries)
            </h3>
            <div className="max-h-[360px] overflow-y-auto space-y-2 pr-1">
              {decodedData.shifts.map((s, idx) => (
                <div
                  key={s.id || idx}
                  className="border-2 border-ink bg-bg p-2.5 text-xs font-mono flex items-center justify-between"
                >
                  <div className="space-y-0.5">
                    <div className="font-bold text-ink text-sm">
                      {s.date}{" "}
                      <span className="text-xs font-normal text-ink/75">
                        ({s.standardHours}h std {s.overtimeHours ? `+ ${s.overtimeHours}h OT` : ""})
                      </span>
                    </div>
                    <div className="text-[11px] text-ink/70">
                      Advance: ₹{s.advanceReceived} | Rate: {s.dailyAgreedRate ? `₹${s.dailyAgreedRate}` : "Statutory"}
                    </div>
                    {(s.siteOrContractorName || s.notes) && (
                      <div className="text-[10px] text-ink/60 italic">
                        {s.siteOrContractorName && `[${s.siteOrContractorName}] `}
                        {s.notes}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
