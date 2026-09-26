/**
 * Pure client-side IndexedDB persistence for work shifts and dispute claims.
 * ZERO NETWORK IMPORTS: All CRUD operations run strictly on the local device.
 */
import {
  CaseworkerCaseRecord,
  DisputeClaim,
  LedgerExportPayload,
  LedgerSummary,
  ShiftEntry,
} from "./types";

const DB_NAME = "wageguard_ledger_db";
const DB_VERSION = 2;
const STORE_SHIFTS = "shifts";
const STORE_META = "dispute_meta";
const STORE_CASES = "caseworker_cases";

/**
 * Initializes and upgrades the local IndexedDB schema.
 */
export function openLedgerDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      reject(new Error("IndexedDB is not supported in this runtime environment."));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_SHIFTS)) {
        const shiftStore = db.createObjectStore(STORE_SHIFTS, { keyPath: "id" });
        shiftStore.createIndex("date", "date", { unique: false });
        shiftStore.createIndex("createdAt", "createdAt", { unique: false });
      }
      if (!db.objectStoreNames.contains(STORE_META)) {
        db.createObjectStore(STORE_META, { keyPath: "key" });
      }
      if (!db.objectStoreNames.contains(STORE_CASES)) {
        const caseStore = db.createObjectStore(STORE_CASES, { keyPath: "caseId" });
        caseStore.createIndex("importedAt", "importedAt", { unique: false });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error || new Error("Failed to open local IndexedDB database."));
    };
  });
}

/**
 * Retrieves all recorded shift entries, sorted by date descending.
 */
export async function getAllShifts(): Promise<ShiftEntry[]> {
  const db = await openLedgerDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_SHIFTS, "readonly");
    const store = transaction.objectStore(STORE_SHIFTS);
    const request = store.getAll();

    request.onsuccess = () => {
      const records: ShiftEntry[] = request.result || [];
      // Sort descending by date
      records.sort((a, b) => b.date.localeCompare(a.date));
      resolve(records);
    };

    request.onerror = () => {
      reject(request.error || new Error("Failed to read shift entries."));
    };
  });
}

/**
 * Records a new daily shift into the local IndexedDB.
 */
export async function addShift(
  entry: Omit<ShiftEntry, "id" | "createdAt" | "updatedAt">
): Promise<ShiftEntry> {
  const db = await openLedgerDatabase();
  const id = `shift_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = Date.now();

  const newShift: ShiftEntry = {
    ...entry,
    id,
    createdAt: now,
    updatedAt: now,
  };

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_SHIFTS, "readwrite");
    const store = transaction.objectStore(STORE_SHIFTS);
    const request = store.add(newShift);

    request.onsuccess = () => {
      resolve(newShift);
    };

    request.onerror = () => {
      reject(request.error || new Error("Failed to add shift entry."));
    };
  });
}

/**
 * Updates an existing shift entry in local storage.
 */
export async function updateShift(
  id: string,
  updates: Partial<Omit<ShiftEntry, "id" | "createdAt">>
): Promise<ShiftEntry> {
  const db = await openLedgerDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_SHIFTS, "readwrite");
    const store = transaction.objectStore(STORE_SHIFTS);
    const getReq = store.get(id);

    getReq.onsuccess = () => {
      const existing: ShiftEntry | undefined = getReq.result;
      if (!existing) {
        reject(new Error(`Shift entry with id ${id} not found.`));
        return;
      }

      const updated: ShiftEntry = {
        ...existing,
        ...updates,
        updatedAt: Date.now(),
      };

      const putReq = store.put(updated);
      putReq.onsuccess = () => resolve(updated);
      putReq.onerror = () => reject(putReq.error || new Error("Failed to update shift."));
    };

    getReq.onerror = () => {
      reject(getReq.error || new Error("Failed to retrieve shift for update."));
    };
  });
}

/**
 * Deletes a shift entry by id.
 */
export async function deleteShift(id: string): Promise<void> {
  const db = await openLedgerDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_SHIFTS, "readwrite");
    const store = transaction.objectStore(STORE_SHIFTS);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error || new Error("Failed to delete shift."));
  });
}

/**
 * Clears all shift records from the device.
 */
export async function clearAllShifts(): Promise<void> {
  const db = await openLedgerDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_SHIFTS, "readwrite");
    const store = transaction.objectStore(STORE_SHIFTS);
    const request = store.clear();

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error || new Error("Failed to clear ledger."));
  });
}

/**
 * Retrieves the local dispute claim details if configured.
 */
export async function getDisputeClaim(): Promise<DisputeClaim | null> {
  const db = await openLedgerDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_META, "readonly");
    const store = transaction.objectStore(STORE_META);
    const request = store.get("dispute_claim");

    request.onsuccess = () => {
      resolve(request.result?.data || null);
    };

    request.onerror = () => {
      reject(request.error || new Error("Failed to read dispute claim details."));
    };
  });
}

/**
 * Saves or updates the local dispute claim details.
 */
export async function saveDisputeClaim(claim: DisputeClaim): Promise<void> {
  const db = await openLedgerDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_META, "readwrite");
    const store = transaction.objectStore(STORE_META);
    const request = store.put({ key: "dispute_claim", data: claim, updatedAt: Date.now() });

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error || new Error("Failed to save dispute claim."));
  });
}

/**
 * Computes aggregate shift totals and estimated statutory arrears.
 */
export function calculateLedgerSummary(
  shifts: ShiftEntry[],
  statutoryDailyRate: number = 532.0
): LedgerSummary {
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

  // Statutory rate calculation (8-hour standard + double rate overtime under Section 14)
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

/**
 * Saves an imported worker docket into a dedicated, isolated caseworker store.
 * NEVER writes to the personal shift log (STORE_SHIFTS).
 */
export async function saveCaseworkerCase(
  docket: LedgerExportPayload,
  notes?: string
): Promise<CaseworkerCaseRecord> {
  const db = await openLedgerDatabase();
  const caseId = `case_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const record: CaseworkerCaseRecord = {
    caseId,
    importedAt: Date.now(),
    workerDocket: docket,
    notes,
  };

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_CASES, "readwrite");
    const store = transaction.objectStore(STORE_CASES);
    const request = store.add(record);

    request.onsuccess = () => resolve(record);
    request.onerror = () => reject(request.error || new Error("Failed to save caseworker case."));
  });
}

/**
 * Retrieves all saved caseworker case records, newest first.
 */
export async function getAllCaseworkerCases(): Promise<CaseworkerCaseRecord[]> {
  const db = await openLedgerDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_CASES, "readonly");
    const store = transaction.objectStore(STORE_CASES);
    const request = store.getAll();

    request.onsuccess = () => {
      const records: CaseworkerCaseRecord[] = request.result || [];
      records.sort((a, b) => b.importedAt - a.importedAt);
      resolve(records);
    };

    request.onerror = () => reject(request.error || new Error("Failed to load caseworker cases."));
  });
}

/**
 * Deletes a saved case file by caseId.
 */
export async function deleteCaseworkerCase(caseId: string): Promise<void> {
  const db = await openLedgerDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_CASES, "readwrite");
    const store = transaction.objectStore(STORE_CASES);
    const request = store.delete(caseId);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error || new Error("Failed to delete case file."));
  });
}

