/**
 * Offline QR-code generation and decoding with pako gzip compression and 4-digit PIN encryption.
 * ZERO network imports: Operates completely offline on the client device.
 */
import { gzip, ungzip } from "pako";
import QRCode from "qrcode";
import { LedgerExportPayload } from "./types";

/**
 * Generates a random 4-digit PIN for ephemeral verbal handoff to a caseworker.
 */
export function generateEphemeralPin(): string {
  const num = Math.floor(1000 + Math.random() * 9000);
  return String(num);
}

/**
 * Derives a pseudo-random keystream from a 4-digit PIN and a salt.
 */
function deriveKeyStream(pin: string, salt: Uint8Array, length: number): Uint8Array {
  const keyStream = new Uint8Array(length);
  const pinBytes = new TextEncoder().encode(pin);

  for (let i = 0; i < length; i++) {
    const p = pinBytes[i % pinBytes.length];
    const s = salt[i % salt.length];
    // Mix pin, salt, and index
    keyStream[i] = (p ^ s ^ ((i * 37) & 0xff)) & 0xff;
  }
  return keyStream;
}

/**
 * Compresses and PIN-encrypts a ledger export payload for offline QR presentation.
 */
export function encodeLedgerToQRPayload(
  payload: LedgerExportPayload,
  pin: string
): string {
  if (!/^\d{4}$/.test(pin)) {
    throw new Error("PIN must be exactly 4 digits.");
  }

  const jsonStr = JSON.stringify(payload);
  const compressed = gzip(jsonStr);

  // Generate 4-byte random salt
  const salt = new Uint8Array(4);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(salt);
  } else {
    for (let i = 0; i < 4; i++) {
      salt[i] = Math.floor(Math.random() * 256);
    }
  }

  // XOR keystream encryption
  const keyStream = deriveKeyStream(pin, salt, compressed.length);
  const cipher = new Uint8Array(compressed.length);
  for (let i = 0; i < compressed.length; i++) {
    cipher[i] = compressed[i] ^ keyStream[i];
  }

  // Encode salt and cipher in base64
  const saltHex = Array.from(salt)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  let binary = "";
  for (let i = 0; i < cipher.length; i++) {
    binary += String.fromCharCode(cipher[i]);
  }
  const cipherB64 = btoa(binary);

  return `WG1:${saltHex}:${cipherB64}`;
}

/**
 * Decodes and decrypts an encoded ledger QR payload using the worker's 4-digit PIN.
 */
export function decodeLedgerFromQRPayload(
  qrString: string,
  pin: string
): LedgerExportPayload {
  if (!qrString || typeof qrString !== "string") {
    throw new Error("Invalid payload: empty or non-string input.");
  }
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

  if (!saltHex || saltHex.length < 8) {
    throw new Error("Corrupted QR payload: invalid salt parameter.");
  }

  if (!cipherB64 || !/^[A-Za-z0-9+/=]+$/.test(cipherB64)) {
    throw new Error("Corrupted QR payload: base64 decoding failed.");
  }

  let binary: string;
  try {
    binary = atob(cipherB64);
  } catch {
    throw new Error("Corrupted QR payload: base64 decoding failed.");
  }

  const salt = new Uint8Array(
    (saltHex.match(/.{1,2}/g) || []).map((byte) => parseInt(byte, 16))
  );

  const cipher = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    cipher[i] = binary.charCodeAt(i);
  }

  // Reverse XOR with derived keystream
  const keyStream = deriveKeyStream(pin, salt, cipher.length);
  const decompressedBytes = new Uint8Array(cipher.length);
  for (let i = 0; i < cipher.length; i++) {
    decompressedBytes[i] = cipher[i] ^ keyStream[i];
  }

  // Attempt decompression
  try {
    const decompressed = ungzip(decompressedBytes);
    const jsonStr = new TextDecoder().decode(decompressed);
    const payload = JSON.parse(jsonStr) as LedgerExportPayload;
    if (!payload.shifts || !Array.isArray(payload.shifts)) {
      throw new Error("Decoded payload missing valid shifts array.");
    }
    return payload;
  } catch {
    throw new Error("Incorrect 4-digit PIN or corrupted QR payload.");
  }
}

/**
 * Wraps the encoded QR payload in a full URL pointing to /ledger/import#data=<encoded>.
 * The URL hash fragment ensures zero network transmission during browser navigation.
 */
export function generateImportUrl(encodedPayload: string, origin?: string): string {
  const baseOrigin =
    origin ||
    (typeof window !== "undefined" && window.location && window.location.origin
      ? window.location.origin
      : "http://localhost:5173");
  return `${baseOrigin}/ledger/import#data=${encodeURIComponent(encodedPayload)}`;
}

/**
 * Extracts raw WG1 payload from either a full URL (hash or query) or direct text.
 * Returns clean WG1 payload string, or empty string if malformed.
 */
export function extractPayloadFromScannedText(scannedText: string): string {
  if (!scannedText) return "";
  const trimmed = scannedText.trim();

  try {
    // If payload is embedded in a URL hash (#data=...)
    if (trimmed.includes("#data=")) {
      const hashPart = trimmed.split("#data=")[1];
      const extracted = decodeURIComponent(hashPart.split("&")[0]);
      if (extracted.startsWith("WG1:")) {
        return extracted;
      }
    }

    // If payload is embedded in a query parameter (?data=...)
    if (trimmed.includes("?data=")) {
      const queryPart = trimmed.split("?data=")[1];
      const extracted = decodeURIComponent(queryPart.split("&")[0]);
      if (extracted.startsWith("WG1:")) {
        return extracted;
      }
    }
  } catch {
    return "";
  }

  // If directly starts with WG1:
  if (trimmed.startsWith("WG1:")) {
    return trimmed;
  }

  // Regex fallback to find WG1 payload inside text
  const match = trimmed.match(/WG1:[0-9a-fA-F]+:[A-Za-z0-9+/=]+/);
  if (match) {
    return match[0];
  }

  return "";
}

/**
 * Generates an offline Data URL image from the encoded QR payload or URL.
 */
export async function generateQRCodeDataUrl(content: string): Promise<string> {
  return QRCode.toDataURL(content, {
    errorCorrectionLevel: "L", // Level L provides higher data density & easier camera scanning
    margin: 2,
    scale: 6,
    color: {
      dark: "#111111",
      light: "#FFFFFF",
    },
  });
}

