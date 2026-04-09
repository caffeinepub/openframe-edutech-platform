/**
 * backendService.ts
 *
 * Thin service layer that wraps canister calls for cross-device registration sync.
 * The app uses localStorage as a local cache and the Motoko canister as the global source
 * of truth so that FE registrations are visible to the admin on ANY device.
 *
 * All functions are fire-and-forget safe: they never throw. Failures fall back gracefully
 * to the local localStorage data that is already saved before any canister call is made.
 */

import { HttpAgent } from "@icp-sdk/core/agent";
import { createActor } from "../backend";
import type { Registration } from "../types/models";

// ---------------------------------------------------------------------------
// Actor creation — one shared instance per page load
// ---------------------------------------------------------------------------

let _actorInstance: ReturnType<typeof createActor> | null = null;

function getActor() {
  if (_actorInstance) return _actorInstance;

  const canisterId = (window as unknown as { __CANISTER_ID_BACKEND__?: string })
    .__CANISTER_ID_BACKEND__;

  if (!canisterId) {
    // Try the environment variable path injected by Vite
    const envId =
      (
        import.meta as unknown as {
          env?: { VITE_CANISTER_ID_BACKEND?: string };
        }
      ).env?.VITE_CANISTER_ID_BACKEND ?? "";
    if (!envId) return null;
  }

  const finalId =
    canisterId ??
    (
      import.meta as unknown as {
        env?: { VITE_CANISTER_ID_BACKEND?: string };
      }
    ).env?.VITE_CANISTER_ID_BACKEND ??
    "";

  if (!finalId) return null;

  try {
    const host =
      process.env.NODE_ENV === "development"
        ? "http://localhost:4943"
        : "https://ic0.app";

    const agent = HttpAgent.createSync({ host });

    if (process.env.NODE_ENV === "development") {
      agent.fetchRootKey().catch(() => {
        // ignore — local replica only
      });
    }

    const noopUpload = async (
      _file: unknown,
    ): Promise<Uint8Array<ArrayBuffer>> =>
      new Uint8Array() as Uint8Array<ArrayBuffer>;
    const noopDownload = async (_file: Uint8Array<ArrayBufferLike>) => {
      const { ExternalBlob } = await import("../backend");
      return ExternalBlob.fromBytes(_file as Uint8Array<ArrayBuffer>);
    };

    _actorInstance = createActor(finalId, noopUpload, noopDownload, { agent });
    return _actorInstance;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Conversion helpers
// ---------------------------------------------------------------------------

/**
 * Convert a local Registration to the RegistrationRecord shape the canister expects.
 * BigInt is required by the Candid interface.
 */
function toCanisterRecord(reg: Registration) {
  return {
    id: BigInt(reg.id),
    studentName: reg.studentName,
    studentPhone: reg.studentPhone,
    feId: BigInt(reg.feId),
    feName: reg.feName,
    feCode: reg.feCode,
    courseId: BigInt(reg.courseId),
    courseName: reg.courseName,
    courseType: reg.courseType,
    medium: reg.medium,
    feePlan: reg.feePlan,
    price: BigInt(reg.price),
    status: reg.status,
    paymentStatus: reg.paymentStatus,
    classLink: reg.classLink ?? "",
    schedule: reg.schedule ?? "",
    createdAt: reg.createdAt,
    updatedAt: reg.updatedAt,
    latitude: reg.latitude ?? undefined,
    longitude: reg.longitude ?? undefined,
    locationAddress: reg.locationAddress ?? undefined,
    incentiveCalculated: reg.incentiveCalculated,
  };
}

/**
 * Convert a canister RegistrationRecord back to the local Registration shape.
 */
export function fromCanisterRecord(r: {
  id: bigint;
  studentName: string;
  studentPhone: string;
  feId: bigint;
  feName: string;
  feCode: string;
  courseId: bigint;
  courseName: string;
  courseType: string;
  medium: string;
  feePlan: string;
  price: bigint;
  status: string;
  paymentStatus: string;
  classLink: string;
  schedule: string;
  createdAt: string;
  updatedAt: string;
  latitude?: number;
  longitude?: number;
  locationAddress?: string;
  incentiveCalculated: boolean;
}): Registration {
  return {
    id: Number(r.id),
    studentName: r.studentName,
    studentPhone: r.studentPhone,
    feId: Number(r.feId),
    feName: r.feName,
    feCode: r.feCode,
    courseId: Number(r.courseId),
    courseName: r.courseName,
    courseType: r.courseType,
    medium: r.medium,
    feePlan: r.feePlan as Registration["feePlan"],
    price: Number(r.price),
    status: r.status as Registration["status"],
    paymentStatus: r.paymentStatus as Registration["paymentStatus"],
    classLink: r.classLink,
    schedule: r.schedule,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    latitude: r.latitude ?? null,
    longitude: r.longitude ?? null,
    locationAddress: r.locationAddress ?? null,
    incentiveCalculated: r.incentiveCalculated,
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Save a registration to the canister. Returns true on success, false on failure.
 * This is non-blocking — call it after localStorage save without awaiting in UI.
 */
export async function syncRegistrationToBackend(
  reg: Registration,
): Promise<boolean> {
  try {
    const actor = getActor();
    if (!actor) return false;
    await actor.addRegistrationRecord(toCanisterRecord(reg));
    return true;
  } catch {
    return false;
  }
}

/**
 * Fetch all registrations from the canister (admin view).
 * Returns empty array on failure — caller falls back to localStorage.
 */
export async function fetchAllRegistrationsFromBackend(): Promise<
  Registration[]
> {
  try {
    const actor = getActor();
    if (!actor) return [];
    const records = await actor.getAllRegistrationRecords();
    return records.map(fromCanisterRecord);
  } catch {
    return [];
  }
}

/**
 * Fetch registrations for a specific FE from the canister.
 * Returns empty array on failure — caller falls back to localStorage.
 */
export async function fetchFERegistrationsFromBackend(
  feId: number,
): Promise<Registration[]> {
  try {
    const actor = getActor();
    if (!actor) return [];
    const records = await actor.getRegistrationRecordsByFE(BigInt(feId));
    return records.map(fromCanisterRecord);
  } catch {
    return [];
  }
}

/**
 * Update a registration's status/payment on the canister (admin action).
 * Returns true on success.
 */
export async function updateRegistrationOnBackend(
  id: number,
  status: string,
  paymentStatus: string,
  classLink: string,
  schedule: string,
): Promise<boolean> {
  try {
    const actor = getActor();
    if (!actor) return false;
    await actor.updateRegistrationRecord(
      BigInt(id),
      status,
      paymentStatus,
      classLink,
      schedule,
      new Date().toISOString(),
    );
    return true;
  } catch {
    return false;
  }
}

/**
 * Merge backend records with localStorage records.
 * Backend records are authoritative for shared state (payment status, approval).
 * Local-only records (not yet synced) are included with their local state.
 */
export function mergeRegistrations(
  backendRegs: Registration[],
  localRegs: Registration[],
): Registration[] {
  const merged = new Map<number, Registration>();

  // Start with local records
  for (const reg of localRegs) {
    merged.set(reg.id, reg);
  }

  // Backend records override local ones (admin changes take priority)
  for (const reg of backendRegs) {
    merged.set(reg.id, reg);
  }

  return Array.from(merged.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

// ---------------------------------------------------------------------------
// Unsynced registration queue
// ---------------------------------------------------------------------------

const SYNC_QUEUE_KEY = "openframe_sync_queue";

/** Mark a registration ID as pending sync */
export function markForSync(id: number): void {
  try {
    const raw = localStorage.getItem(SYNC_QUEUE_KEY);
    const queue: number[] = raw ? JSON.parse(raw) : [];
    if (!queue.includes(id)) {
      queue.push(id);
      localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
    }
  } catch {
    // ignore storage errors
  }
}

/** Remove a registration ID from the sync queue after successful upload */
function clearFromSyncQueue(id: number): void {
  try {
    const raw = localStorage.getItem(SYNC_QUEUE_KEY);
    if (!raw) return;
    const queue: number[] = JSON.parse(raw);
    const updated = queue.filter((i) => i !== id);
    localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(updated));
  } catch {
    // ignore
  }
}

/**
 * Upload any locally-saved registrations that haven't been synced to the canister yet.
 * Safe to call on any page load — no-op if queue is empty or backend unavailable.
 */
export async function drainSyncQueue(
  getAllLocalRegs: () => Registration[],
): Promise<void> {
  try {
    const raw = localStorage.getItem(SYNC_QUEUE_KEY);
    if (!raw) return;
    const queue: number[] = JSON.parse(raw);
    if (queue.length === 0) return;

    const actor = getActor();
    if (!actor) return;

    const allRegs = getAllLocalRegs();
    for (const id of queue) {
      const reg = allRegs.find((r) => r.id === id);
      if (!reg) {
        clearFromSyncQueue(id);
        continue;
      }
      const ok = await syncRegistrationToBackend(reg);
      if (ok) clearFromSyncQueue(id);
    }
  } catch {
    // ignore — will retry next load
  }
}
