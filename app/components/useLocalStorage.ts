"use client";

import { useCallback, useEffect, useMemo, useRef, useState, startTransition } from "react";
import {
  PRAYER_KEYS,
  buildPrayerCounts,
  derivePrayerStats,
  type PrayerCounts,
  type PrayerKey
} from "../lib/calculations";
import {
  clampHistory,
  commitMutation,
  redoMutation,
  undoMutation,
  type HistoryEntry as GenericHistoryEntry,
  type HistoryStacks as GenericHistoryStacks
} from "../lib/history";

export type QadaState = {
  initialized: boolean;
  totalTarget: number;
  prayersRemaining: PrayerCounts;
};

export type HistoryActionType =
  | "increment_day"
  | "decrement_day"
  | "complete_prayer"
  | "undo_prayer"
  | "add_debt"
  | "adjust_prayer"
  | "clear_history"
  | "clear_redo"
  | "import_backup";

export type ActionSource = "dashboard" | "settings";

export type HistoryAction = {
  type: HistoryActionType;
  at: number;
  prayer?: PrayerKey;
  amount?: number;
  source?: ActionSource;
};

export type HistoryEntry = GenericHistoryEntry<QadaState, HistoryAction>;
export type HistoryStacks = GenericHistoryStacks<QadaState, HistoryAction>;

export type PersistedTracker = {
  version: 2;
  current: QadaState;
  history: HistoryStacks;
};

export type HistoryLastEvent = {
  mode: "undo" | "redo";
  action: HistoryAction;
  nonce: number;
};

type LegacyQadaState = {
  initialized: boolean;
  totalTarget: number;
  completed: number;
};

const STORAGE_KEY = "qada-tracker:v1";
const STORAGE_VERSION = 2;
const HISTORY_LIMIT = 50;

const HISTORY_ACTION_TYPES: readonly HistoryActionType[] = [
  "increment_day",
  "decrement_day",
  "complete_prayer",
  "undo_prayer",
  "add_debt",
  "adjust_prayer",
  "clear_history",
  "clear_redo",
  "import_backup"
];
const HISTORY_ACTION_SET = new Set<HistoryActionType>(HISTORY_ACTION_TYPES);

const DEFAULT_STATE: QadaState = {
  initialized: false,
  totalTarget: 0,
  prayersRemaining: buildPrayerCounts(0)
};

function createEmptyHistory(): HistoryStacks {
  return { past: [], future: [] };
}

function createDefaultTracker(): PersistedTracker {
  return {
    version: STORAGE_VERSION,
    current: DEFAULT_STATE,
    history: createEmptyHistory()
  };
}

function safeParse(json: string): unknown {
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isPrayerKey(value: unknown): value is PrayerKey {
  return typeof value === "string" && PRAYER_KEYS.some((key) => key === value);
}

function isHistoryActionType(value: unknown): value is HistoryActionType {
  return typeof value === "string" && HISTORY_ACTION_SET.has(value as HistoryActionType);
}

function isActionSource(value: unknown): value is ActionSource {
  return value === "dashboard" || value === "settings";
}

function isValidPrayerCounts(value: unknown): value is PrayerCounts {
  if (!value || typeof value !== "object") return false;
  const counts = value as Record<string, unknown>;
  return PRAYER_KEYS.every((key) => isFiniteNumber(counts[key]));
}

function isValidState(value: unknown): value is QadaState {
  if (!value || typeof value !== "object") return false;
  const s = value as Record<string, unknown>;
  return (
    typeof s.initialized === "boolean" &&
    isFiniteNumber(s.totalTarget) &&
    isValidPrayerCounts(s.prayersRemaining)
  );
}

function isValidLegacyState(value: unknown): value is LegacyQadaState {
  if (!value || typeof value !== "object") return false;
  const s = value as Record<string, unknown>;
  return (
    typeof s.initialized === "boolean" &&
    isFiniteNumber(s.totalTarget) &&
    isFiniteNumber(s.completed)
  );
}

function isValidHistoryAction(value: unknown): value is HistoryAction {
  if (!value || typeof value !== "object") return false;
  const action = value as Record<string, unknown>;

  if (!isHistoryActionType(action.type)) return false;
  if (!isFiniteNumber(action.at)) return false;

  if (action.type === "complete_prayer" || action.type === "undo_prayer") {
    return isPrayerKey(action.prayer);
  }

  if (action.type === "adjust_prayer") {
    return isPrayerKey(action.prayer) && isFiniteNumber(action.amount);
  }

  if (action.type === "add_debt") {
    return isFiniteNumber(action.amount);
  }

  if (action.prayer !== undefined && !isPrayerKey(action.prayer)) return false;
  if (action.amount !== undefined && !isFiniteNumber(action.amount)) return false;
  if (action.source !== undefined && !isActionSource(action.source)) return false;

  return true;
}

function isValidHistoryEntry(value: unknown): value is HistoryEntry {
  if (!value || typeof value !== "object") return false;
  const entry = value as Record<string, unknown>;
  return isValidState(entry.before) && isValidState(entry.after) && isValidHistoryAction(entry.action);
}

function isValidHistoryStacks(value: unknown): value is HistoryStacks {
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
    tracker.version === STORAGE_VERSION &&
    isValidState(tracker.current) &&
    isValidHistoryStacks(tracker.history)
  );
}

function areStatesEqual(left: QadaState, right: QadaState): boolean {
  if (left.initialized !== right.initialized) return false;
  if (left.totalTarget !== right.totalTarget) return false;
  return PRAYER_KEYS.every((key) => left.prayersRemaining[key] === right.prayersRemaining[key]);
}

function sanitizeState(state: QadaState): QadaState {
  const totalTarget = Math.max(0, Math.floor(state.totalTarget));
  const prayersRemaining = PRAYER_KEYS.reduce((next, key) => {
    const value = state.prayersRemaining[key];
    const normalized = isFiniteNumber(value) ? Math.floor(value) : 0;
    next[key] = Math.min(totalTarget, normalized);
    return next;
  }, {} as PrayerCounts);

  return {
    initialized: Boolean(state.initialized) && totalTarget > 0,
    totalTarget,
    prayersRemaining
  };
}

function sanitizeHistoryAction(action: HistoryAction): HistoryAction {
  const sanitized: HistoryAction = {
    type: action.type,
    at: isFiniteNumber(action.at) ? Math.floor(action.at) : Date.now()
  };

  if ((action.type === "complete_prayer" || action.type === "undo_prayer") && isPrayerKey(action.prayer)) {
    sanitized.prayer = action.prayer;
  }

  if (action.type === "add_debt" && isFiniteNumber(action.amount)) {
    sanitized.amount = Math.floor(action.amount);
  }

  if (action.type === "adjust_prayer" && isFiniteNumber(action.amount)) {
    sanitized.amount = Math.floor(action.amount);
  }

  if (isActionSource(action.source)) {
    sanitized.source = action.source;
  }

  return sanitized;
}

function sanitizeHistoryEntry(entry: HistoryEntry): HistoryEntry {
  return {
    before: sanitizeState(entry.before),
    after: sanitizeState(entry.after),
    action: sanitizeHistoryAction(entry.action)
  };
}

function sanitizeHistory(history: HistoryStacks): HistoryStacks {
  const sanitizedPast = history.past.map(sanitizeHistoryEntry);
  const sanitizedFuture = history.future.map(sanitizeHistoryEntry);
  return {
    past: clampHistory(sanitizedPast, HISTORY_LIMIT),
    future: clampHistory(sanitizedFuture, HISTORY_LIMIT)
  };
}

function sanitizePersistedTracker(tracker: PersistedTracker): PersistedTracker {
  return {
    version: STORAGE_VERSION,
    current: sanitizeState(tracker.current),
    history: sanitizeHistory(tracker.history)
  };
}

function migrateLegacyState(state: LegacyQadaState): PersistedTracker {
  const totalTarget = Math.max(0, Math.floor(state.totalTarget));
  const completed = Math.max(0, Math.min(totalTarget, Math.floor(state.completed)));
  const remainingPerPrayer = totalTarget - completed;

  return {
    version: STORAGE_VERSION,
    current: {
      initialized: Boolean(state.initialized) && totalTarget > 0,
      totalTarget,
      prayersRemaining: buildPrayerCounts(remainingPerPrayer)
    },
    history: createEmptyHistory()
  };
}

function mapPrayerCounts(
  source: PrayerCounts,
  mapper: (value: number, key: PrayerKey) => number
): PrayerCounts {
  return PRAYER_KEYS.reduce((next, key) => {
    next[key] = mapper(source[key], key);
    return next;
  }, {} as PrayerCounts);
}

function adjustPrayerValue(state: QadaState, prayer: PrayerKey, delta: number): QadaState {
  const normalizedDelta = Number.isFinite(delta) ? Math.trunc(delta) : 0;
  if (normalizedDelta === 0) return state;

  const currentValue = state.prayersRemaining[prayer];
  const nextValue = Math.min(state.totalTarget, currentValue + normalizedDelta);
  if (nextValue === currentValue) return state;

  return {
    ...state,
    prayersRemaining: {
      ...state.prayersRemaining,
      [prayer]: nextValue
    }
  };
}

export function useQadaStorage() {
  const [mounted, setMounted] = useState(false);
  const [tracker, setTracker] = useState<PersistedTracker>(createDefaultTracker);
  const [lastHistoryEvent, setLastHistoryEvent] = useState<HistoryLastEvent | null>(null);
  const trackerRef = useRef(tracker);
  const historyNonceRef = useRef(0);
  const pendingHistoryEventRef = useRef<HistoryLastEvent | null | undefined>(undefined);
  const skipNextCustomLoadRef = useRef(false);

  useEffect(() => {
    trackerRef.current = tracker;
  }, [tracker]);

  const createHistoryEvent = useCallback(
    (mode: "undo" | "redo", action: HistoryAction): HistoryLastEvent => {
      historyNonceRef.current += 1;
      return {
        mode,
        action,
        nonce: historyNonceRef.current
      };
    },
    []
  );

  const loadTracker = useCallback(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      setTracker(createDefaultTracker());
      setLastHistoryEvent(null);
      return;
    }

    const parsed = safeParse(raw);
    if (isValidPersistedTracker(parsed)) {
      setTracker(sanitizePersistedTracker(parsed));
      setLastHistoryEvent(null);
      return;
    }

    if (isValidState(parsed)) {
      const migrated: PersistedTracker = {
        version: STORAGE_VERSION,
        current: sanitizeState(parsed),
        history: createEmptyHistory()
      };
      const sanitized = sanitizePersistedTracker(migrated);
      setTracker(sanitized);
      setLastHistoryEvent(null);
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
      return;
    }

    if (isValidLegacyState(parsed)) {
      const migrated = sanitizePersistedTracker(migrateLegacyState(parsed));
      setTracker(migrated);
      setLastHistoryEvent(null);
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
      return;
    }

    setTracker(createDefaultTracker());
    setLastHistoryEvent(null);
  }, []);

  useEffect(() => {
    setMounted(true);
    loadTracker();
  }, [loadTracker]);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        startTransition(() => {
          loadTracker();
        });
      }
    };

    const handleCustomStorageChange = () => {
      if (skipNextCustomLoadRef.current) {
        skipNextCustomLoadRef.current = false;
        return;
      }

      queueMicrotask(() => {
        startTransition(loadTracker);
      });
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("qada-storage-change", handleCustomStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("qada-storage-change", handleCustomStorageChange);
    };
  }, [loadTracker]);

  useEffect(() => {
    const pending = pendingHistoryEventRef.current;
    if (pending === undefined) return;
    setLastHistoryEvent(pending);
    pendingHistoryEventRef.current = undefined;
  }, [tracker]);

  const persistTracker = useCallback((next: PersistedTracker) => {
    const sanitized = sanitizePersistedTracker(next);
    setTracker(sanitized);
    skipNextCustomLoadRef.current = true;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
    window.dispatchEvent(new Event("qada-storage-change"));
  }, []);

  const applyTrackerUpdate = useCallback(
    (
      updater: (previous: PersistedTracker) => {
        next: PersistedTracker;
        changed: boolean;
        event?: HistoryLastEvent | null;
      }
    ) => {
      setTracker((previous) => {
        const result = updater(previous);
        if (!result.changed) return previous;

        const sanitized = sanitizePersistedTracker(result.next);
        skipNextCustomLoadRef.current = true;
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
        window.dispatchEvent(new Event("qada-storage-change"));
        pendingHistoryEventRef.current = result.event;
        return sanitized;
      });
    },
    []
  );

  const commitTrackerAction = useCallback(
    (action: HistoryAction, applier: (state: QadaState) => QadaState) => {
      applyTrackerUpdate((previous) => {
        const result = commitMutation<QadaState, HistoryAction>({
          current: previous.current,
          history: previous.history,
          action,
          apply: applier,
          maxHistory: HISTORY_LIMIT,
          isEqual: areStatesEqual
        });

        return {
          next: {
            ...previous,
            current: result.current,
            history: result.history
          },
          changed: result.committed
        };
      });
    },
    [applyTrackerUpdate]
  );

  const actions = useMemo(() => {
    return {
      start(totalTarget: number) {
        const cleanTarget = Math.max(0, Math.floor(totalTarget));
        persistTracker({
          version: STORAGE_VERSION,
          current: {
            initialized: cleanTarget > 0,
            totalTarget: cleanTarget,
            prayersRemaining: buildPrayerCounts(cleanTarget)
          },
          history: createEmptyHistory()
        });
        setLastHistoryEvent(null);
      },
      incrementDay() {
        commitTrackerAction(
          { type: "increment_day", at: Date.now() },
          (previous) => ({
            ...previous,
            prayersRemaining: mapPrayerCounts(previous.prayersRemaining, (value) => value - 1)
          })
        );
      },
      decrementDay() {
        commitTrackerAction(
          { type: "decrement_day", at: Date.now() },
          (previous) => ({
            ...previous,
            prayersRemaining: mapPrayerCounts(
              previous.prayersRemaining,
              (value) => Math.min(previous.totalTarget, value + 1)
            )
          })
        );
      },
      adjustPrayer(prayer: PrayerKey, delta: number, source: ActionSource = "dashboard") {
        const normalizedDelta = Number.isFinite(delta) ? Math.trunc(delta) : 0;
        if (normalizedDelta === 0) return;

        commitTrackerAction(
          {
            type: "adjust_prayer",
            prayer,
            amount: normalizedDelta,
            source,
            at: Date.now()
          },
          (previous) => adjustPrayerValue(previous, prayer, normalizedDelta)
        );
      },
      completePrayer(prayer: PrayerKey) {
        commitTrackerAction(
          { type: "complete_prayer", prayer, at: Date.now() },
          (previous) => adjustPrayerValue(previous, prayer, -1)
        );
      },
      undoPrayer(prayer: PrayerKey) {
        commitTrackerAction(
          { type: "undo_prayer", prayer, at: Date.now() },
          (previous) => adjustPrayerValue(previous, prayer, 1)
        );
      },
      addDebt(daysToAdd: number) {
        const add = Math.max(0, Math.floor(daysToAdd));
        if (add === 0) return;

        commitTrackerAction(
          { type: "add_debt", amount: add, at: Date.now() },
          (previous) => {
            const nextTarget = previous.totalTarget + add;
            return {
              ...previous,
              initialized: nextTarget > 0,
              totalTarget: nextTarget,
              prayersRemaining: mapPrayerCounts(
                previous.prayersRemaining,
                (value) => Math.min(nextTarget, value + add)
              )
            };
          }
        );
      },
      clearRedo() {
        applyTrackerUpdate((previous) => {
          if (previous.history.future.length === 0) {
            return { next: previous, changed: false };
          }

          return {
            next: {
              ...previous,
              history: {
                ...previous.history,
                future: []
              }
            },
            changed: true,
            event: null
          };
        });
      },
      clearHistory() {
        applyTrackerUpdate((previous) => {
          const hasHistory = previous.history.past.length > 0 || previous.history.future.length > 0;
          if (!hasHistory) {
            return { next: previous, changed: false };
          }

          return {
            next: {
              ...previous,
              history: createEmptyHistory()
            },
            changed: true,
            event: null
          };
        });
      },
      replaceTracker(payload: PersistedTracker) {
        persistTracker(payload);
        setLastHistoryEvent(null);
      },
      getPersistedTracker() {
        return sanitizePersistedTracker(trackerRef.current);
      },
      undo() {
        applyTrackerUpdate((previous) => {
          const result = undoMutation(previous.current, previous.history);
          if (!result.changed || !result.action) {
            return { next: previous, changed: false };
          }

          return {
            next: {
              ...previous,
              current: result.current,
              history: result.history
            },
            changed: true,
            event: createHistoryEvent("undo", result.action)
          };
        });
      },
      redo() {
        applyTrackerUpdate((previous) => {
          const result = redoMutation(previous.current, previous.history);
          if (!result.changed || !result.action) {
            return { next: previous, changed: false };
          }

          return {
            next: {
              ...previous,
              current: result.current,
              history: result.history
            },
            changed: true,
            event: createHistoryEvent("redo", result.action)
          };
        });
      },
      reset() {
        window.localStorage.removeItem(STORAGE_KEY);
        setTracker(createDefaultTracker());
        setLastHistoryEvent(null);
        skipNextCustomLoadRef.current = true;
        window.dispatchEvent(new Event("qada-storage-change"));
      }
    };
  }, [applyTrackerUpdate, commitTrackerAction, createHistoryEvent, persistTracker]);

  const state = tracker.current;

  const stats = useMemo(
    () => derivePrayerStats(tracker.current.totalTarget, tracker.current.prayersRemaining),
    [tracker.current.totalTarget, tracker.current.prayersRemaining]
  );

  const history = useMemo(() => {
    const past = tracker.history.past;
    const future = tracker.history.future;
    return {
      canUndo: past.length > 0,
      canRedo: future.length > 0,
      undoCount: past.length,
      redoCount: future.length,
      nextUndoAction: past.length > 0 ? past[past.length - 1].action : null,
      nextRedoAction: future.length > 0 ? future[future.length - 1].action : null,
      lastEvent: lastHistoryEvent
    };
  }, [lastHistoryEvent, tracker.history.future, tracker.history.past]);

  return { mounted, state, actions, stats, history, storageKey: STORAGE_KEY };
}

