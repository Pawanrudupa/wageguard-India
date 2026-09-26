/**
 * Explicit one-tap consent modal and QR code presentation for offline caseworker handoff.
 * Explains what data is encoded and reveals the ephemeral 4-digit PIN for verbal transfer.
 */
import React, { useState } from "react";
import {
  generateEphemeralPin,
  generateQRCodeDataUrl,
  encodeLedgerToQRPayload,
  generateImportUrl,
} from "../lib/ledger/qr";
import { LedgerExportPayload } from "../lib/ledger/types";

interface ConsentModalProps {
  payload: LedgerExportPayload;
  onClose: () => void;
}

export const ConsentModal: React.FC<ConsentModalProps> = ({ payload, onClose }) => {
  const [consented, setConsented] = useState<boolean>(false);
  const [pin, setPin] = useState<string>("");
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [importUrlStr, setImportUrlStr] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const handleConsent = async () => {
    setLoading(true);
    try {
      const generatedPin = generateEphemeralPin();
      setPin(generatedPin);

      // Encode, PIN-encrypt, and wrap in client-side /ledger/import URL
      const encoded = encodeLedgerToQRPayload(payload, generatedPin);
      const importUrl = generateImportUrl(encoded);
      setImportUrlStr(importUrl);

      const url = await generateQRCodeDataUrl(importUrl);
      setQrDataUrl(url);
      setConsented(true);
    } catch (err) {
      console.error("Failed to generate QR code", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-ink/75 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-surface border-3 border-ink p-5 sm:p-6 shadow-brutal max-w-md w-full space-y-4 my-8">
        {!consented ? (
          <>
            {/* Step 1: Explicit Consent Prompt */}
            <div className="border-b-2 border-ink pb-2">
              <span className="bg-accent px-2 py-0.5 border border-ink font-mono text-[10px] font-bold uppercase">
                Offline P2P Handoff
              </span>
              <h2 className="font-heading font-black text-lg text-ink mt-1">
                Share Work Diary with Caseworker
              </h2>
            </div>

            <div className="text-xs font-body text-ink/85 space-y-2 leading-relaxed">
              <p>
                You are about to generate an offline QR code containing your{" "}
                <strong>{payload.shifts.length} shift entries</strong> and computed arrears
                of <strong>₹{payload.summary.netArrearsOwed.toLocaleString("en-IN")}</strong>.
              </p>
              <div className="border-2 border-ink bg-bg p-2.5 font-mono text-[11px] space-y-1">
                <div className="font-bold text-ink">🔒 Privacy & Protection:</div>
                <ul className="list-disc pl-4 space-y-0.5 text-ink/80">
                  <li>Zero data is uploaded to any server or cloud.</li>
                  <li>Payload is compressed and encrypted with a random 4-digit PIN.</li>
                  <li>Only a caseworker scanning the code AND entering your verbal PIN can read it.</li>
                </ul>
              </div>
              <p className="text-[11px] text-ink/70">
                Only show this screen to an authorized legal aid advocate or verified NGO caseworker.
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={handleConsent}
                disabled={loading}
                className="btn-press flex-1 py-2.5 border-3 border-ink bg-accent font-heading font-black text-sm text-ink disabled:opacity-50"
              >
                {loading ? "Encrypting..." : "I Consent • Show QR Code"}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="btn-press px-4 py-2.5 border-3 border-ink bg-surface font-heading font-bold text-sm text-ink"
              >
                Cancel
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Step 2: Encrypted QR Code & Ephemeral PIN */}
            <div className="border-b-2 border-ink pb-2 flex items-center justify-between">
              <div>
                <span className="bg-risk-low text-surface px-2 py-0.5 border border-ink font-mono text-[10px] font-bold uppercase">
                  Encrypted Offline QR
                </span>
                <h2 className="font-heading font-black text-base text-ink mt-0.5">
                  Scan to Transfer Work Docket
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="text-xs font-mono font-bold px-2 py-1 border border-ink hover:bg-bg"
              >
                Close ✕
              </button>
            </div>

            {/* Prominent PIN Display */}
            <div className="border-3 border-ink bg-accent p-3 text-center space-y-1 shadow-brutal-sm">
              <div className="font-mono text-xs font-bold uppercase text-ink/80">
                Verbal Caseworker PIN (बोलकर बताएं):
              </div>
              <div className="font-mono font-black text-3xl tracking-widest text-ink">
                {pin}
              </div>
              <div className="text-[11px] font-body text-ink/75">
                The caseworker must enter these 4 digits to decrypt your records.
              </div>
            </div>

            {/* QR Code Canvas */}
            {qrDataUrl && (
              <div className="flex flex-col items-center p-3 border-2 border-ink bg-surface shadow-brutal-sm space-y-2">
                <img
                  src={qrDataUrl}
                  alt="Encrypted Worker Ledger QR Code"
                  className="w-56 h-56 object-contain"
                />
                <div className="text-[11px] font-mono text-ink/75 text-center">
                  Scannable via smartphone camera or in-app scanner at <span className="font-bold">/ledger/import</span>
                </div>
              </div>
            )}

            {/* Cross-device / Browser-tab handoff helpers */}
            <div className="flex flex-col gap-2 pt-1">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (importUrlStr) {
                      navigator.clipboard.writeText(importUrlStr);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2500);
                    }
                  }}
                  className="min-h-[44px] px-2 py-2 border-2 border-ink bg-bg font-mono text-xs font-bold hover:bg-surface active:bg-accent"
                >
                  {copied ? "✓ Copied Link!" : "📋 Copy Caseworker Link"}
                </button>
                <a
                  href={importUrlStr}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-h-[44px] px-2 py-2 border-2 border-ink bg-surface font-mono text-xs font-bold text-center flex items-center justify-center hover:bg-bg active:bg-accent"
                >
                  ↗ Open in Caseworker Tab
                </a>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="btn-press w-full min-h-[44px] py-2.5 border-3 border-ink bg-accent font-heading font-black text-xs uppercase shadow-brutal-sm"
              >
                Done / Close Handoff
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
