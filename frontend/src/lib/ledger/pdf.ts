/**
 * Client-side PDF generator for the "Empirical Statement of Work & Statutory Wage Arrears".
 * Rendered 100% in-browser using jsPDF with ZERO server data persistence.
 */
import jsPDF from "jspdf";
import { DisputeClaim, LedgerProvisions, LedgerSummary, ShiftEntry } from "./types";

export const STATEMENT_TITLE = "Empirical Statement of Work & Statutory Wage Arrears";
export const STATUTORY_DISCLAIMER =
  "Prepared by worker as educational documentation under the Code on Wages, 2019; not legal representation.";

export interface PDFExportOptions {
  shifts: ShiftEntry[];
  summary: LedgerSummary;
  claim: DisputeClaim | null;
  provisions: LedgerProvisions | null;
}

/**
 * Builds the PDF document and triggers client-side download or returns doc instance.
 */
export function generateStatementPDF(options: PDFExportOptions): jsPDF {
  const { shifts, summary, claim, provisions } = options;
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 16;

  // Header Banner
  doc.setFillColor(34, 48, 74); // Deep Trust Indigo (#22304A)
  doc.rect(14, y, pageWidth - 28, 14, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("WAGEGUARD INDIA  •  EMPIRICAL EVIDENCE RECORD", 18, y + 9);

  y += 22;

  // Title (NOT a legal demand notice)
  doc.setTextColor(17, 17, 17);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text(STATEMENT_TITLE, 14, y);

  y += 7;

  // Subtitle & Export Date
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  const exportDate = new Date().toISOString().split("T")[0];
  doc.text(`Generated: ${exportDate}  |  Local-First Single-Device Record`, 14, y);

  y += 7;

  // Mandatory Non-Legal Representation Disclaimer Box
  doc.setFillColor(254, 243, 199); // Light amber
  doc.setDrawColor(217, 164, 4); // Turmeric border
  doc.setLineWidth(0.5);
  doc.rect(14, y, pageWidth - 28, 13, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(150, 80, 0);
  doc.text("STATUTORY NOTICE / शैक्षिक दस्तावेज़:", 17, y + 4.5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(30, 30, 30);
  doc.text(STATUTORY_DISCLAIMER, 17, y + 9);

  y += 18;

  // Claim Metadata & Summary Grid
  doc.setDrawColor(17, 17, 17);
  doc.setLineWidth(0.3);
  doc.setFillColor(245, 241, 232); // Brutalist background (#F5F1E8)
  doc.rect(14, y, pageWidth - 28, 22, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(17, 17, 17);
  doc.text("WORKER CONTEMPORANEOUS RECORD SUMMARY", 18, y + 5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(`State / Jurisdiction: ${claim?.state || provisions?.state || "Unspecified"}`, 18, y + 10);
  doc.text(`Sector: ${claim?.sector || "General"}`, 18, y + 14);
  doc.text(`Worksite / Employer Reference: ${claim?.employerOrContractor || "Informal / Contractor"}`, 18, y + 18);

  // Right-aligned column
  doc.text(`Total Shifts Recorded: ${summary.totalShifts}`, 115, y + 10);
  doc.text(`Total Standard Hours: ${summary.totalStandardHours} hrs  |  Overtime: ${summary.totalOvertimeHours} hrs`, 115, y + 14);
  doc.text(`Total Advances Received: Rs. ${summary.totalAdvancesReceived.toLocaleString("en-IN")}`, 115, y + 18);

  y += 26;

  // Statutory Arrears Calculation Box
  doc.setFillColor(235, 245, 235);
  doc.setDrawColor(46, 125, 50);
  doc.rect(14, y, pageWidth - 28, 16, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(46, 125, 50);
  doc.text(
    `STATUTORY ARREARS OWED:  Rs. ${summary.netArrearsOwed.toLocaleString("en-IN")}`,
    18,
    y + 6
  );

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(50, 50, 50);
  doc.text(
    `Computed against Notified Minimum Rate of Rs. ${summary.statutoryWageFloor}/day (Section 6 & 9, Code on Wages 2019)`,
    18,
    y + 11
  );

  y += 21;

  // Auto-Populated Legal Provisions (From RAG Corpus)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(17, 17, 17);
  doc.text("APPLICABLE STATUTORY CITATIONS (CODE ON WAGES, 2019)", 14, y);

  y += 5;

  const legalItems = [
    {
      label: "Section 59 (Burden of Proof):",
      text: "The legal burden of proof lies squarely on the employer to prove that remuneration and overtime have been paid in full and deductions were authorized under law.",
    },
    {
      label: "Section 17(2) (Final Settlement):",
      text: "Mandatory statutory settlement of earned wages within 2 working days of separation (applies equally to dismissal and voluntary resignation).",
    },
    {
      label: "Section 45(6) (Claims Authority & Limitation):",
      text: "Unified 3-year statutory limitation period to file claim applications before the designated Labour Authority for recovery of unpaid wages.",
    },
  ];

  doc.setFontSize(7.5);
  for (const item of legalItems) {
    doc.setFont("helvetica", "bold");
    doc.setTextColor(34, 48, 74);
    doc.text(item.label, 14, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(50, 50, 50);
    const splitDesc = doc.splitTextToSize(item.text, pageWidth - 32);
    doc.text(splitDesc, 14, y + 3.5);
    y += 8;
  }

  y += 3;

  // Shift Log Entries Table
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(17, 17, 17);
  doc.text(`CONTEMPORANEOUS SHIFT LOG (${shifts.length} Entries)`, 14, y);

  y += 4;

  // Table Header
  doc.setFillColor(17, 17, 17);
  doc.rect(14, y, pageWidth - 28, 6, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text("Date", 16, y + 4.2);
  doc.text("Std Hours", 42, y + 4.2);
  doc.text("Overtime", 68, y + 4.2);
  doc.text("Advance (Rs.)", 94, y + 4.2);
  doc.text("Agreed Rate", 124, y + 4.2);
  doc.text("Notes / Worksite", 154, y + 4.2);

  y += 6;

  // Table Rows (Print up to 25 shifts per page, or paginate)
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(30, 30, 30);

  const displayShifts = shifts.slice(0, 30);
  for (let i = 0; i < displayShifts.length; i++) {
    if (y > 275) {
      doc.addPage();
      y = 16;
    }

    const s = displayShifts[i];
    if (i % 2 === 1) {
      doc.setFillColor(245, 245, 245);
      doc.rect(14, y, pageWidth - 28, 5.5, "F");
    }

    doc.text(s.date, 16, y + 3.8);
    doc.text(`${s.standardHours}h`, 42, y + 3.8);
    doc.text(s.overtimeHours ? `${s.overtimeHours}h` : "-", 68, y + 3.8);
    doc.text(`Rs. ${s.advanceReceived}`, 94, y + 3.8);
    doc.text(s.dailyAgreedRate ? `Rs. ${s.dailyAgreedRate}` : "Statutory", 124, y + 3.8);

    const note = (s.notes || s.siteOrContractorName || "-").substring(0, 24);
    doc.text(note, 154, y + 3.8);

    y += 5.5;
  }

  // Footer / Next Steps
  if (y > 260) {
    doc.addPage();
    y = 20;
  }

  y += 6;
  doc.setDrawColor(200, 200, 200);
  doc.line(14, y, pageWidth - 14, y);
  y += 5;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(80, 80, 80);
  doc.text("WHERE TO SUBMIT THIS DOCUMENT FOR RECOVERY:", 14, y);
  doc.setFont("helvetica", "normal");
  doc.text(
    "1. NALSA 24x7 Free Legal Aid (Dial 15100)  |  2. Shram Suvidha Central Portal (shramsuvidha.gov.in)  |  3. District Labour Commissioner Office",
    14,
    y + 4
  );

  return doc;
}
