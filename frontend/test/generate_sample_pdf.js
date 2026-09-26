import fs from "node:fs";
import path from "node:path";
import pkg from "jspdf";
const jsPDF = pkg.jsPDF || pkg;

function toAscii(text) {
  if (!text) return "";
  return text
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/\u2022/g, "-")
    .replace(/\u20B9/g, "Rs. ")
    .replace(/[^\x20-\x7E\n]/g, "")
    .trim();
}

const STATEMENT_TITLE = "Empirical Statement of Work & Statutory Wage Arrears";
const STATUTORY_DISCLAIMER =
  "Prepared by worker as educational documentation under the Code on Wages, 2019; not legal representation.";

function generateTestPDF() {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 16;

  // Header Banner
  doc.setFillColor(34, 48, 74);
  doc.rect(14, y, pageWidth - 28, 14, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("WAGEGUARD INDIA - EMPIRICAL EVIDENCE RECORD", 18, y + 9);

  y += 22;

  // Title
  doc.setTextColor(17, 17, 17);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text(toAscii(STATEMENT_TITLE), 14, y);

  y += 7;

  // Subtitle
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.text("Generated: 2026-09-26  |  Local-First Single-Device Record", 14, y);

  y += 7;

  // Mandatory Non-Legal Representation Disclaimer Box
  doc.setFillColor(254, 243, 199);
  doc.setDrawColor(217, 164, 4);
  doc.setLineWidth(0.5);
  doc.rect(14, y, pageWidth - 28, 13, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(150, 80, 0);
  doc.text("STATUTORY NOTICE / EDUCATIONAL DOCUMENTATION:", 17, y + 4.5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(30, 30, 30);
  doc.text(toAscii(STATUTORY_DISCLAIMER), 17, y + 9);

  y += 18;

  // Claim Metadata & Summary Grid
  doc.setDrawColor(17, 17, 17);
  doc.setLineWidth(0.3);
  doc.setFillColor(245, 241, 232);
  doc.rect(14, y, pageWidth - 28, 22, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(17, 17, 17);
  doc.text("WORKER CONTEMPORANEOUS RECORD SUMMARY", 18, y + 5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("State / Jurisdiction: Maharashtra", 18, y + 10);
  doc.text("Sector: Construction", 18, y + 14);
  doc.text("Worksite / Employer Reference: Apex Infra Site 4", 18, y + 18);

  doc.text("Total Shifts Recorded: 14", 115, y + 10);
  doc.text("Total Standard Hours: 112 hrs  |  Overtime: 18 hrs", 115, y + 14);
  doc.text("Total Advances Received: Rs. 4,500", 115, y + 18);

  y += 26;

  // Statutory Arrears Box
  doc.setFillColor(235, 245, 235);
  doc.setDrawColor(46, 125, 50);
  doc.rect(14, y, pageWidth - 28, 16, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(46, 125, 50);
  doc.text("STATUTORY ARREARS OWED:  Rs. 5,342", 18, y + 6);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(50, 50, 50);
  doc.text(
    "Computed against Notified Minimum Rate of Rs. 532/day (Section 6 & 9, Code on Wages 2019)",
    18,
    y + 11
  );

  return doc;
}

const doc = generateTestPDF();
const outputPath = path.resolve("./test/sample_statement.pdf");
fs.writeFileSync(outputPath, Buffer.from(doc.output("arraybuffer")));
console.log("Saved test PDF to:", outputPath);
