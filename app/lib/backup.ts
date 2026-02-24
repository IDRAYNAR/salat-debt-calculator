import { PRAYER_KEYS, type PrayerKey } from "./calculations";
import type { PersistedTracker } from "../components/useLocalStorage";

export type BackupLocale = "en" | "fr" | "ar";

export type BackupV1 = {
  version: 1;
  exportedAt: string;
  tracker: PersistedTracker;
  preferences: {
    locale: BackupLocale;
  };
};

export type BackupError =
  | "invalid_json"
  | "unsupported_version"
  | "invalid_tracker"
  | "invalid_locale"
  | "payload_too_large";

export type BackupParseResult =
  | { ok: true; data: BackupV1 }
  | { ok: false; error: BackupError };

const MAX_BACKUP_SIZE_BYTES = 1_500_000;

const ACTION_TYPE_SET = new Set<string>([
  "increment_day",
  "decrement_day",
  "complete_prayer",
  "undo_prayer",
  "add_debt",
  "adjust_prayer",
  "clear_history",
  "clear_redo",
  "import_backup"
]);

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isPrayerKey(value: unknown): value is PrayerKey {
  return typeof value === "string" && PRAYER_KEYS.some((key) => key === value);
}

function isLocale(value: unknown): value is BackupLocale {
  return value === "en" || value === "fr" || value === "ar";
}

function isValidPrayerCounts(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  const counts = value as Record<string, unknown>;
  return PRAYER_KEYS.every((key) => isFiniteNumber(counts[key]));
}

function isValidQadaState(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  const state = value as Record<string, unknown>;
  return (
    typeof state.initialized === "boolean" &&
    isFiniteNumber(state.totalTarget) &&
    isValidPrayerCounts(state.prayersRemaining)
  );
}

function isValidHistoryAction(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  const action = value as Record<string, unknown>;
  if (typeof action.type !== "string" || !ACTION_TYPE_SET.has(action.type)) return false;
  if (!isFiniteNumber(action.at)) return false;

  let requiredPayloadIsValid = true;
  if (action.type === "complete_prayer" || action.type === "undo_prayer") {
    requiredPayloadIsValid = isPrayerKey(action.prayer);
  }
  if (action.type === "adjust_prayer") {
    requiredPayloadIsValid = isPrayerKey(action.prayer) && isFiniteNumber(action.amount);
  }
  if (action.type === "add_debt") {
    requiredPayloadIsValid = isFiniteNumber(action.amount);
  }
  if (!requiredPayloadIsValid) return false;

  if (action.prayer !== undefined && !isPrayerKey(action.prayer)) return false;
  if (action.amount !== undefined && !isFiniteNumber(action.amount)) return false;
  if (action.source !== undefined && action.source !== "dashboard" && action.source !== "settings") {
    return false;
  }

  return true;
}

function isValidHistoryEntry(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  const entry = value as Record<string, unknown>;
  return (
    isValidQadaState(entry.before) &&
    isValidQadaState(entry.after) &&
    isValidHistoryAction(entry.action)
  );
}

function isValidHistoryStacks(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  const history = value as Record<string, unknown>;
  return (
    Array.isArray(history.past) &&
    history.past.every(isValidHistoryEntry) &&
    Array.isArray(history.future) &&
    history.future.every(isValidHistoryEntry)
  );
}

function isValidPersistedTracker(value: unknown): value is PersistedTracker {
  if (!value || typeof value !== "object") return false;
  const tracker = value as Record<string, unknown>;
  return (
    tracker.version === 2 &&
    isValidQadaState(tracker.current) &&
    isValidHistoryStacks(tracker.history)
  );
}

export function serializeBackup(tracker: PersistedTracker, locale: BackupLocale): string {
  const payload: BackupV1 = {
    version: 1,
    exportedAt: new Date().toISOString(),
    tracker,
    preferences: {
      locale
    }
  };

  return JSON.stringify(payload, null, 2);
}

export function parseBackup(raw: string): BackupParseResult {
  if (typeof raw !== "string" || raw.length === 0) {
    return { ok: false, error: "invalid_json" };
  }

  if (raw.length > MAX_BACKUP_SIZE_BYTES) {
    return { ok: false, error: "payload_too_large" };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, error: "invalid_json" };
  }

  if (!parsed || typeof parsed !== "object") {
    return { ok: false, error: "invalid_json" };
  }

  const payload = parsed as Record<string, unknown>;
  if (payload.version !== 1) {
    return { ok: false, error: "unsupported_version" };
  }

  if (typeof payload.exportedAt !== "string" || payload.exportedAt.trim().length === 0) {
    return { ok: false, error: "invalid_json" };
  }

  if (!isValidPersistedTracker(payload.tracker)) {
    return { ok: false, error: "invalid_tracker" };
  }

  if (!payload.preferences || typeof payload.preferences !== "object") {
    return { ok: false, error: "invalid_locale" };
  }

  const preferences = payload.preferences as Record<string, unknown>;
  if (!isLocale(preferences.locale)) {
    return { ok: false, error: "invalid_locale" };
  }

  return {
    ok: true,
    data: {
      version: 1,
      exportedAt: payload.exportedAt,
      tracker: payload.tracker,
      preferences: {
        locale: preferences.locale
      }
    }
  };
}
