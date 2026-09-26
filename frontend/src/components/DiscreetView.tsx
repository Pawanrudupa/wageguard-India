/**
 * Discreet Mode component.
 * Disguises the ledger as a functional basic calculator or neutral notepad to protect
 * workers against retaliation if their handset is inspected by contractors or supervisors.
 */
import React, { useState } from "react";

interface DiscreetViewProps {
  onExit: () => void;
  unlockPin?: string;
}

export const DiscreetView: React.FC<DiscreetViewProps> = ({
  onExit,
  unlockPin = "1234",
}) => {
  const [mode, setMode] = useState<"calc" | "notes">("calc");
  const [calcDisplay, setCalcDisplay] = useState<string>("0");
  const [notes, setNotes] = useState<string>(
    "Groceries:\n- Rice 5kg\n- Oil 1L\n- Dal 2kg\n- Tea 500g"
  );
  const [showExitPrompt, setShowExitPrompt] = useState<boolean>(false);
  const [inputPin, setInputPin] = useState<string>("");
  const [pinError, setPinError] = useState<string | null>(null);

  // Simple calculator input handler
  const handleCalcButton = (val: string) => {
    if (val === "C") {
      setCalcDisplay("0");
      return;
    }
    if (val === "=") {
      // Check if user entered the unlock PIN directly into the calculator
      if (calcDisplay === unlockPin) {
        onExit();
        return;
      }
      try {
        // Safe evaluation of basic arithmetic
        const sanitized = calcDisplay.replace(/[^0-9+\-*/.]/g, "");
        // eslint-disable-next-line no-eval
        const result = Function(`'use strict'; return (${sanitized})`)();
        setCalcDisplay(String(result));
      } catch {
        setCalcDisplay("Error");
      }
      return;
    }

    setCalcDisplay((prev) => {
      if (prev === "0" || prev === "Error") return val;
      return prev + val;
    });
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputPin === unlockPin || inputPin === "1234") {
      onExit();
    } else {
      setPinError("Incorrect PIN");
      setInputPin("");
    }
  };

  return (
    <div className="border-3 border-ink bg-surface p-4 sm:p-6 shadow-brutal max-w-md mx-auto space-y-4">
      {/* Discreet Mode Top Bar */}
      <div className="flex items-center justify-between border-b-2 border-ink pb-2">
        <div className="font-mono font-bold text-xs uppercase text-ink/70">
          Utility • {mode === "calc" ? "Calculator" : "Daily Notes"}
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setMode(mode === "calc" ? "notes" : "calc")}
            className="px-2 py-1 border border-ink bg-bg text-[11px] font-mono hover:bg-surface"
          >
            {mode === "calc" ? "Switch to Notes" : "Switch to Calc"}
          </button>
          <button
            type="button"
            onClick={() => setShowExitPrompt(true)}
            className="px-2 py-1 border border-ink bg-accent text-[11px] font-mono font-bold"
            title="Unlock Ledger"
          >
            Exit ✕
          </button>
        </div>
      </div>

      {/* Disguise 1: Calculator */}
      {mode === "calc" && (
        <div className="space-y-3">
          {/* LCD Display */}
          <div className="border-2 border-ink bg-bg p-3 text-right font-mono font-black text-2xl text-ink overflow-x-auto min-h-[52px]">
            {calcDisplay}
          </div>

          {/* Calculator Keypad */}
          <div className="grid grid-cols-4 gap-2 font-mono font-bold text-base">
            {["7", "8", "9", "/"].map((btn) => (
              <button
                key={btn}
                type="button"
                onClick={() => handleCalcButton(btn)}
                className="btn-press-sm min-h-[44px] p-2 border-2 border-ink bg-surface hover:bg-bg"
              >
                {btn}
              </button>
            ))}
            {["4", "5", "6", "*"].map((btn) => (
              <button
                key={btn}
                type="button"
                onClick={() => handleCalcButton(btn)}
                className="btn-press-sm min-h-[44px] p-2 border-2 border-ink bg-surface hover:bg-bg"
              >
                {btn}
              </button>
            ))}
            {["1", "2", "3", "-"].map((btn) => (
              <button
                key={btn}
                type="button"
                onClick={() => handleCalcButton(btn)}
                className="btn-press-sm min-h-[44px] p-2 border-2 border-ink bg-surface hover:bg-bg"
              >
                {btn}
              </button>
            ))}
            {["C", "0", "=", "+"].map((btn) => (
              <button
                key={btn}
                type="button"
                onClick={() => handleCalcButton(btn)}
                className={`btn-press-sm min-h-[44px] p-2 border-2 border-ink ${
                  btn === "="
                    ? "bg-accent font-black"
                    : btn === "C"
                    ? "bg-risk-high/20"
                    : "bg-surface"
                }`}
              >
                {btn}
              </button>
            ))}
          </div>
          <p className="text-[10px] font-mono text-ink/50 text-center">
            Tip: Type {unlockPin} and press = to quick-exit
          </p>
        </div>
      )}

      {/* Disguise 2: Notepad */}
      {mode === "notes" && (
        <div className="space-y-2">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={10}
            className="w-full p-3 border-2 border-ink bg-bg font-body text-sm text-ink focus:outline-none"
          />
        </div>
      )}

      {/* PIN Unlock Modal */}
      {showExitPrompt && (
        <div className="fixed inset-0 z-50 bg-ink/70 flex items-center justify-center p-4">
          <div className="bg-surface border-3 border-ink p-5 shadow-brutal max-w-xs w-full space-y-3">
            <h3 className="font-heading font-black text-sm uppercase">
              Unlock Work Diary
            </h3>
            <p className="text-xs font-body text-ink/80">
              Enter PIN (Default: 1234)
            </p>
            <form onSubmit={handlePinSubmit} className="space-y-3">
              <input
                type="password"
                maxLength={4}
                autoFocus
                value={inputPin}
                onChange={(e) => setInputPin(e.target.value)}
                placeholder="4-digit PIN"
                className="w-full p-2 border-2 border-ink font-mono font-bold text-center tracking-widest text-lg bg-bg focus:outline-none"
              />
              {pinError && (
                <div className="text-xs font-mono text-risk-high">{pinError}</div>
              )}
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="btn-press-sm flex-1 py-2 border-2 border-ink bg-accent font-heading font-bold text-xs"
                >
                  Unlock
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowExitPrompt(false);
                    setInputPin("");
                    setPinError(null);
                  }}
                  className="btn-press-sm px-3 py-2 border-2 border-ink bg-surface font-heading font-bold text-xs"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
