/**
 * usePendingSubscription
 *
 * Reads localStorage for a pending subscription entry that was stored after a
 * successful ICP transfer but before backend activation (which may crash with
 * `get_blocks`). Returns a synthetic "pending" state so the UI can inform the
 * user that their payment was received and is awaiting manual admin activation.
 */

export interface PendingSubscription {
  planId: string;
  blockIndex: string;
  paidAt: number;
  priceIcp: string;
  type: "purchase" | "extend";
}

const STORAGE_KEY = "pendingSubscription";
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export function getPendingSubscription(): PendingSubscription | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: PendingSubscription = JSON.parse(raw);
    // Auto-expire after 7 days
    if (Date.now() - parsed.paidAt > MAX_AGE_MS) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function setPendingSubscription(pending: PendingSubscription): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pending));
  } catch {
    // Ignore storage errors
  }
}

export function clearPendingSubscription(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore storage errors
  }
}

export function usePendingSubscription() {
  return getPendingSubscription();
}
