/**
 * Section 45(6) Code on Wages 2019 limitation countdown calculator.
 * Pure offline calculation with zero network dependencies.
 */
import { LimitationCountdownResult } from "./types";

export const LIMITATION_YEARS = 3;
export const MANDATORY_ADVISORY =
  "Statutory limit is 3 years, but acting sooner improves recovery chances before contractors relocate or dissolve.";
export const STATUTORY_REFERENCE = "Section 45(6), Code on Wages, 2019";

/**
 * Calculates days remaining to file a claim under the unified 3-year limitation period.
 *
 * @param incidentDateStr - Date string (YYYY-MM-DD) of wage default or last working day
 * @param nowMs - Optional current timestamp in ms (for deterministic testing)
 */
export function calculateLimitationCountdown(
  incidentDateStr: string,
  nowMs: number = Date.now()
): LimitationCountdownResult {
  if (!incidentDateStr || !incidentDateStr.trim()) {
    return {
      daysRemaining: 0,
      deadlineDateStr: "",
      isExpired: false,
      advisoryText: MANDATORY_ADVISORY,
      statutoryReference: STATUTORY_REFERENCE,
    };
  }

  const incidentDate = new Date(incidentDateStr);
  if (isNaN(incidentDate.getTime())) {
    return {
      daysRemaining: 0,
      deadlineDateStr: "",
      isExpired: false,
      advisoryText: MANDATORY_ADVISORY,
      statutoryReference: STATUTORY_REFERENCE,
    };
  }

  // Section 45(6): 3 years from the date on which the claim arose
  const deadline = new Date(incidentDate);
  deadline.setFullYear(deadline.getFullYear() + LIMITATION_YEARS);

  const diffMs = deadline.getTime() - nowMs;
  const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  const isExpired = daysRemaining < 0;

  const yyyy = deadline.getFullYear();
  const mm = String(deadline.getMonth() + 1).padStart(2, "0");
  const dd = String(deadline.getDate()).padStart(2, "0");
  const deadlineDateStr = `${yyyy}-${mm}-${dd}`;

  return {
    daysRemaining: Math.max(0, daysRemaining),
    deadlineDateStr,
    isExpired,
    advisoryText: MANDATORY_ADVISORY,
    statutoryReference: STATUTORY_REFERENCE,
  };
}
