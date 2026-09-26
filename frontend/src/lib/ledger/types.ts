/**
 * Data contracts and interfaces for the local-first work & wage ledger module.
 * Stored 100% client-side in browser IndexedDB with zero server persistence.
 */

export interface ShiftEntry {
  id: string;
  date: string; // YYYY-MM-DD
  standardHours: number; // e.g. 8
  overtimeHours: number; // e.g. 2
  advanceReceived: number; // in INR (₹)
  dailyAgreedRate?: number; // in INR (₹), optional
  siteOrContractorName?: string; // local-only note
  notes?: string;
  createdAt: number;
  updatedAt: number;
}

export interface DisputeClaim {
  incidentDate: string; // YYYY-MM-DD (e.g. date of wage default or last working day)
  state: string;
  sector: string;
  employerOrContractor: string;
  claimDescription?: string;
}

export interface LedgerSummary {
  totalShifts: number;
  totalStandardHours: number;
  totalOvertimeHours: number;
  totalAdvancesReceived: number;
  totalAgreedPay: number;
  statutoryWageFloor: number;
  totalStatutoryDue: number;
  netArrearsOwed: number;
}

export interface LimitationCountdownResult {
  daysRemaining: number;
  deadlineDateStr: string;
  isExpired: boolean;
  advisoryText: string;
  statutoryReference: string;
}

export interface StatutoryCitation {
  source_file: string;
  act_name: string;
  section_or_clause: string;
  section_title?: string | null;
  state?: string | null;
  valid_as_of_date?: string | null;
}

export interface LedgerProvisions {
  state: string;
  citations: StatutoryCitation[];
  daily_min_wage_rate: number | null;
  sections_summary: Record<string, string>;
  disclaimer: string;
}

export interface LedgerExportPayload {
  version: "1.0";
  exportedAt: string;
  shifts: ShiftEntry[];
  disputeClaim: DisputeClaim | null;
  summary: LedgerSummary;
}

export interface CaseworkerCaseRecord {
  caseId: string;
  importedAt: number;
  workerDocket: LedgerExportPayload;
  notes?: string;
}

