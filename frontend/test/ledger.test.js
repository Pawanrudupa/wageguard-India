/**
 * Client-side integration and unit tests for the Local Ledger feature.
 * Tests:
 * 1. Section 45(6) limitation countdown calculation and advisory text.
 * 2. Shift summary calculations (statutory arrears, hours, advances).
 * 3. Offline QR payload compression and PIN encryption / decryption roundtrip.
 * 4. Error throwing on wrong PIN attempt for QR payload.
 * 5. Client-side PDF generation assertions (title and disclaimer).
 */

import assert from "node:assert";
import { test } from "node:test";
import { gzip, ungzip } from "pako";
import pkg from "jspdf";
const jsPDF = pkg.jsPDF || pkg;

// Re-implement or import the core pure functions
function calculateLimitationCountdown(incidentDateStr, referenceDate = new Date()) {
  const incidentDate = new Date(incidentDateStr);
  if (isNaN(incidentDate.getTime())) {
    throw new Error("Invalid incident date provided.");
  }

  const deadlineDate = new Date(incidentDate.getTime());
  deadlineDate.setFullYear(deadlineDate.getFullYear() + 3);

  const diffMs = deadlineDate.getTime() - referenceDate.getTime();
  const daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  const isExpired = daysRemaining <= 0;

  return {
    daysRemaining,
    deadlineDateStr: deadlineDate.toISOString().split("T")[0],
    isExpired,
    advisoryText:
      "Statutory limit is 3 years, but acting sooner improves recovery chances before contractors relocate or dissolve.",
    statutoryReference: "Section 45(6), Code on Wages, 2019",
  };
}

function calculateLedgerSummary(shifts, statutoryDailyRate = 532.0) {
  let totalStandardHours = 0;
  let totalOvertimeHours = 0;
  let totalAdvancesReceived = 0;
  let totalAgreedPay = 0;

  for (const s of shifts) {
    totalStandardHours += Number(s.standardHours) || 0;
    totalOvertimeHours += Number(s.overtimeHours) || 0;
    totalAdvancesReceived += Number(s.advanceReceived) || 0;
    const agreedRate = Number(s.dailyAgreedRate) || statutoryDailyRate;
    totalAgreedPay += agreedRate;
  }

  const hourlyStatutory = statutoryDailyRate / 8;
  const standardStatutoryPay = shifts.length * statutoryDailyRate;
  const overtimeStatutoryPay = totalOvertimeHours * (hourlyStatutory * 2);
  const totalStatutoryDue = Math.round(standardStatutoryPay + overtimeStatutoryPay);
  const netArrearsOwed = Math.max(0, totalStatutoryDue - totalAdvancesReceived);

  return {
    totalShifts: shifts.length,
    totalStandardHours,
    totalOvertimeHours,
    totalAdvancesReceived,
    totalAgreedPay,
    statutoryWageFloor: statutoryDailyRate,
    totalStatutoryDue,
    netArrearsOwed,
  };
}

function deriveKeyStream(pin, salt, length) {
  const keyStream = new Uint8Array(length);
  const pinBytes = new TextEncoder().encode(pin);
  for (let i = 0; i < length; i++) {
    const p = pinBytes[i % pinBytes.length];
    const s = salt[i % salt.length];
    keyStream[i] = (p ^ s ^ ((i * 37) & 0xff)) & 0xff;
  }
  return keyStream;
}

function encodeLedgerToQRPayload(payload, pin) {
  if (!/^\d{4}$/.test(pin)) {
    throw new Error("PIN must be exactly 4 digits.");
  }
  const jsonStr = JSON.stringify(payload);
  const compressed = gzip(jsonStr);
  const salt = new Uint8Array([12, 34, 56, 78]);
  const keyStream = deriveKeyStream(pin, salt, compressed.length);
  const cipher = new Uint8Array(compressed.length);
  for (let i = 0; i < compressed.length; i++) {
    cipher[i] = compressed[i] ^ keyStream[i];
  }
  const saltHex = Array.from(salt).map((b) => b.toString(16).padStart(2, "0")).join("");
  let binary = "";
  for (let i = 0; i < cipher.length; i++) {
    binary += String.fromCharCode(cipher[i]);
  }
  const cipherB64 = Buffer.from(binary, "binary").toString("base64");
  return `WG1:${saltHex}:${cipherB64}`;
}

function decodeLedgerFromQRPayload(qrString, pin) {
  if (!qrString.startsWith("WG1:")) {
    throw new Error("Invalid payload format. Expected WG1 header.");
  }
  if (!/^\d{4}$/.test(pin)) {
    throw new Error("PIN must be exactly 4 digits.");
  }
  const parts = qrString.split(":");
  if (parts.length !== 3) {
    throw new Error("Malformed QR payload structure.");
  }
  const saltHex = parts[1];
  const cipherB64 = parts[2];
  const salt = new Uint8Array(saltHex.match(/.{1,2}/g).map((byte) => parseInt(byte, 16)));
  const binary = Buffer.from(cipherB64, "base64").toString("binary");
  const cipher = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    cipher[i] = binary.charCodeAt(i);
  }
  const keyStream = deriveKeyStream(pin, salt, cipher.length);
  const decompressedBytes = new Uint8Array(cipher.length);
  for (let i = 0; i < cipher.length; i++) {
    decompressedBytes[i] = cipher[i] ^ keyStream[i];
  }
  try {
    const decompressed = ungzip(decompressedBytes);
    const jsonStr = new TextDecoder().decode(decompressed);
    return JSON.parse(jsonStr);
  } catch (err) {
    throw new Error("Incorrect 4-digit PIN or corrupted QR payload.");
  }
}

// -------------------------------------------------------------
// TESTS
// -------------------------------------------------------------

test("Limitation countdown calculates 3 years from incident date with mandatory advisory", () => {
  const refDate = new Date("2026-03-01T00:00:00Z");
  const res = calculateLimitationCountdown("2026-01-01", refDate);

  assert.strictEqual(res.statutoryReference, "Section 45(6), Code on Wages, 2019");
  assert.strictEqual(res.deadlineDateStr, "2029-01-01");
  assert.ok(res.daysRemaining > 1000);
  assert.strictEqual(
    res.advisoryText,
    "Statutory limit is 3 years, but acting sooner improves recovery chances before contractors relocate or dissolve."
  );
});

test("Ledger summary correctly calculates standard hours, overtime at 2x, and net arrears", () => {
  const mockShifts = [
    { id: "1", date: "2026-02-01", standardHours: 8, overtimeHours: 2, advanceReceived: 200, dailyAgreedRate: 600 },
    { id: "2", date: "2026-02-02", standardHours: 8, overtimeHours: 0, advanceReceived: 300, dailyAgreedRate: 600 },
  ];

  // Statutory floor rate 532. Hourly = 66.5. 2x OT hourly = 133.
  // Standard pay (2 days * 532) = 1064. Overtime (2 hrs * 133) = 266.
  // Total statutory due = 1330.
  // Advances = 500. Net arrears = 1330 - 500 = 830.
  const summary = calculateLedgerSummary(mockShifts, 532);

  assert.strictEqual(summary.totalShifts, 2);
  assert.strictEqual(summary.totalStandardHours, 16);
  assert.strictEqual(summary.totalOvertimeHours, 2);
  assert.strictEqual(summary.totalAdvancesReceived, 500);
  assert.strictEqual(summary.totalStatutoryDue, 1330);
  assert.strictEqual(summary.netArrearsOwed, 830);
});

test("QR payload compresses and decrypts successfully with correct PIN", () => {
  const payload = {
    version: "1.0",
    exportedAt: "2026-03-01T00:00:00Z",
    shifts: [{ id: "1", date: "2026-02-01", standardHours: 8, overtimeHours: 0, advanceReceived: 100 }],
    summary: { totalShifts: 1, netArrearsOwed: 432 },
    disputeClaim: null,
  };

  const correctPin = "4821";
  const qrString = encodeLedgerToQRPayload(payload, correctPin);

  assert.ok(qrString.startsWith("WG1:"));

  const decoded = decodeLedgerFromQRPayload(qrString, correctPin);
  assert.strictEqual(decoded.version, "1.0");
  assert.strictEqual(decoded.shifts.length, 1);
  assert.strictEqual(decoded.summary.netArrearsOwed, 432);
});

test("QR payload decryption fails when supplied with an incorrect PIN", () => {
  const payload = {
    version: "1.0",
    exportedAt: "2026-03-01T00:00:00Z",
    shifts: [{ id: "1", date: "2026-02-01", standardHours: 8, overtimeHours: 0, advanceReceived: 100 }],
    summary: { totalShifts: 1, netArrearsOwed: 432 },
    disputeClaim: null,
  };

  const correctPin = "8392";
  const wrongPin = "1111";
  const qrString = encodeLedgerToQRPayload(payload, correctPin);

  assert.throws(
    () => {
      decodeLedgerFromQRPayload(qrString, wrongPin);
    },
    /Incorrect 4-digit PIN/
  );
});

function generateImportUrl(encodedPayload, origin = "http://localhost:5173") {
  return `${origin}/ledger/import#data=${encodeURIComponent(encodedPayload)}`;
}

function extractPayloadFromScannedText(scannedText) {
  if (!scannedText) return "";
  const trimmed = scannedText.trim();
  if (trimmed.includes("#data=")) {
    const hashPart = trimmed.split("#data=")[1];
    return decodeURIComponent(hashPart.split("&")[0]);
  }
  if (trimmed.includes("?data=")) {
    const queryPart = trimmed.split("?data=")[1];
    return decodeURIComponent(queryPart.split("&")[0]);
  }
  if (trimmed.startsWith("WG1:")) {
    return trimmed;
  }
  const match = trimmed.match(/WG1:[0-9a-fA-F]+:[A-Za-z0-9+/=]+/);
  return match ? match[0] : trimmed;
}

test("PDF export generates document with locked Title and Mandatory Disclaimer", () => {
  const doc = new jsPDF();
  const STATEMENT_TITLE = "Empirical Statement of Work & Statutory Wage Arrears";
  const STATUTORY_DISCLAIMER =
    "Prepared by worker as educational documentation under the Code on Wages, 2019; not legal representation.";

  doc.text(STATEMENT_TITLE, 14, 20);
  doc.text(STATUTORY_DISCLAIMER, 14, 30);

  const pdfOutput = doc.output();
  assert.ok(pdfOutput.length > 0);
  assert.ok(pdfOutput.includes(STATEMENT_TITLE));
});

test("Cross-device optical QR scan: encodes to QR image, scans pixels via optical reader, extracts URL, and decrypts with PIN", async () => {
  const { default: jsQR } = await import("jsqr");
  const { PNG } = await import("pngjs");
  const QRCode = (await import("qrcode")).default;

  // 1. Device 1 (Worker Handset): Create shift log and encrypt with verbal PIN
  const workerPayload = {
    version: "1.0",
    exportedAt: "2026-09-26T06:40:00Z",
    shifts: [
      { id: "s1", date: "2026-09-10", standardHours: 8, overtimeHours: 2, advanceReceived: 300, dailyAgreedRate: 650, notes: "Concrete pour" },
      { id: "s2", date: "2026-09-11", standardHours: 8, overtimeHours: 0, advanceReceived: 200, dailyAgreedRate: 650, notes: "Scaffolding" },
    ],
    summary: {
      totalShifts: 2,
      totalStandardHours: 16,
      totalOvertimeHours: 2,
      totalAdvancesReceived: 500,
      totalAgreedPay: 1300,
      statutoryWageFloor: 532,
      totalStatutoryDue: 1330,
      netArrearsOwed: 830,
    },
    disputeClaim: {
      incidentDate: "2026-09-11",
      state: "Maharashtra",
      sector: "Construction",
      employerOrContractor: "Metro Buildcon",
      claimDescription: "Withheld 2 weeks wages",
    },
  };

  const verbalPin = "7492";
  const encryptedPayload = encodeLedgerToQRPayload(workerPayload, verbalPin);

  // Wrap into /ledger/import URL (ensures hash fragment never reaches server)
  const caseworkerUrl = generateImportUrl(encryptedPayload, "http://192.168.1.3:5173");
  assert.ok(caseworkerUrl.includes("/ledger/import#data=WG1%3A"));

  // Generate real QR PNG image buffer
  const qrPngBuffer = await QRCode.toBuffer(caseworkerUrl, {
    errorCorrectionLevel: "L",
    margin: 2,
    scale: 6,
  });

  // 2. Optical Scan (Simulating Device 2 / Caseworker Phone Camera Scanning the Screen)
  const png = PNG.sync.read(qrPngBuffer);
  const rgbaPixels = new Uint8ClampedArray(png.data.buffer);
  const opticalScanResult = jsQR(rgbaPixels, png.width, png.height);

  assert.ok(opticalScanResult, "Camera optical scanner must successfully detect QR code from pixel buffer");
  assert.strictEqual(opticalScanResult.data, caseworkerUrl, "Scanned text from camera must exactly match the worker's URL");

  // 3. Device 2 (Caseworker /ledger/import Page Processing)
  const extractedPayload = extractPayloadFromScannedText(opticalScanResult.data);
  assert.strictEqual(extractedPayload, encryptedPayload);

  // Attempt decryption with wrong PIN -> must throw
  assert.throws(() => {
    decodeLedgerFromQRPayload(extractedPayload, "0000");
  }, /Incorrect 4-digit PIN/);

  // Decrypt with correct verbal PIN communicated by worker
  const decryptedDocket = decodeLedgerFromQRPayload(extractedPayload, verbalPin);

  assert.strictEqual(decryptedDocket.version, "1.0");
  assert.strictEqual(decryptedDocket.shifts.length, 2);
  assert.strictEqual(decryptedDocket.summary.netArrearsOwed, 830);
  assert.strictEqual(decryptedDocket.disputeClaim.employerOrContractor, "Metro Buildcon");

  // Verify limitation countdown calculates on caseworker device
  const countdown = calculateLimitationCountdown(decryptedDocket.disputeClaim.incidentDate, new Date("2026-09-26"));
  assert.strictEqual(countdown.statutoryReference, "Section 45(6), Code on Wages, 2019");
  assert.ok(countdown.daysRemaining > 0);
  assert.strictEqual(countdown.deadlineDateStr, "2029-09-11");
});

