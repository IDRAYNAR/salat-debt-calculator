import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useQadaStorage } from "./useLocalStorage";
import type { PersistedTracker } from "./useLocalStorage";

const STORAGE_KEY = "qada-tracker:v1";
const STORAGE_SHADOW_KEY = `${STORAGE_KEY}:shadow`;

describe("useQadaStorage", () => {
  const runAction = async (action: () => void) => {
    await act(async () => {
      action();
      await Promise.resolve();
    });
  };

  beforeEach(() => {
    window.localStorage.clear();
  });

  it("migrates legacy payload to persisted tracker v2", async () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        initialized: true,
        totalTarget: 12,
        completed: 4
      })
    );

    const { result } = renderHook(() => useQadaStorage());
    await waitFor(() => expect(result.current.mounted).toBe(true));

    expect(result.current.state.totalTarget).toBe(12);
    expect(result.current.state.prayersRemaining.fajr).toBe(8);
    expect(result.current.state.prayersRemaining.isha).toBe(8);
    expect(result.current.history.undoCount).toBe(0);
    expect(result.current.history.redoCount).toBe(0);

    const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "{}");
    expect(stored.version).toBe(2);
    expect(stored.history.past).toHaveLength(0);
    expect(stored.history.future).toHaveLength(0);
    expect(stored.current.totalTarget).toBe(12);
  });

  it("persists history and supports undo/redo after addDebt", async () => {
    const first = renderHook(() => useQadaStorage());
    await waitFor(() => expect(first.result.current.mounted).toBe(true));

    await runAction(() => first.result.current.actions.start(2));
    await runAction(() => first.result.current.actions.addDebt(3));

    await waitFor(() => expect(first.result.current.state.totalTarget).toBe(5));
    expect(first.result.current.history.canUndo).toBe(true);
    expect(first.result.current.history.undoCount).toBe(1);

    first.unmount();

    const second = renderHook(() => useQadaStorage());
    await waitFor(() => expect(second.result.current.mounted).toBe(true));
    expect(second.result.current.state.totalTarget).toBe(5);
    expect(second.result.current.history.undoCount).toBe(1);

    await runAction(() => second.result.current.actions.undo());
    await waitFor(() => expect(second.result.current.state.totalTarget).toBe(2));
    expect(second.result.current.history.redoCount).toBe(1);
    expect(second.result.current.history.lastEvent?.mode).toBe("undo");
    expect(second.result.current.history.lastEvent?.action.type).toBe("add_debt");

    await runAction(() => second.result.current.actions.redo());
    await waitFor(() => expect(second.result.current.state.totalTarget).toBe(5));
    expect(second.result.current.history.redoCount).toBe(0);
    await waitFor(() => expect(second.result.current.history.lastEvent?.mode).toBe("redo"));
  });

  it("does not add no-op actions to history", async () => {
    const { result } = renderHook(() => useQadaStorage());
    await waitFor(() => expect(result.current.mounted).toBe(true));

    await runAction(() => result.current.actions.start(1));
    expect(result.current.history.undoCount).toBe(0);

    await runAction(() => result.current.actions.undoPrayer("fajr"));
    expect(result.current.state.prayersRemaining.fajr).toBe(1);
    expect(result.current.history.undoCount).toBe(0);
  });

  it("reset clears current state and cannot be undone", async () => {
    const { result } = renderHook(() => useQadaStorage());
    await waitFor(() => expect(result.current.mounted).toBe(true));

    await runAction(() => {
      result.current.actions.start(3);
      result.current.actions.incrementDay();
    });
    await waitFor(() => expect(result.current.history.canUndo).toBe(true));

    await runAction(() => result.current.actions.reset());

    expect(result.current.state.initialized).toBe(false);
    expect(result.current.state.totalTarget).toBe(0);
    expect(result.current.history.canUndo).toBe(false);
    expect(result.current.history.canRedo).toBe(false);

    await runAction(() => result.current.actions.undo());

    expect(result.current.state.initialized).toBe(false);
    expect(result.current.state.totalTarget).toBe(0);
  });

  it("keeps stats coherent after sequence with undo/redo", async () => {
    const { result } = renderHook(() => useQadaStorage());
    await waitFor(() => expect(result.current.mounted).toBe(true));

    await runAction(() => result.current.actions.start(2));
    await runAction(() => {
      result.current.actions.incrementDay();
      result.current.actions.completePrayer("fajr");
    });

    expect(result.current.stats.daysRemaining).toBe(1);
    expect(result.current.stats.totalPrayersRemaining).toBe(4);

    await runAction(() => result.current.actions.undo());
    expect(result.current.stats.totalPrayersRemaining).toBe(5);

    await runAction(() => result.current.actions.redo());
    expect(result.current.stats.totalPrayersRemaining).toBe(4);
    expect(result.current.stats.daysRemaining).toBe(1);
  });

  it("tracks adjustPrayer in history with source metadata", async () => {
    const { result } = renderHook(() => useQadaStorage());
    await waitFor(() => expect(result.current.mounted).toBe(true));

    await runAction(() => result.current.actions.start(3));
    await runAction(() => result.current.actions.adjustPrayer("fajr", -2, "settings"));

    expect(result.current.state.prayersRemaining.fajr).toBe(1);
    expect(result.current.history.undoCount).toBe(1);
    expect(result.current.history.nextUndoAction?.type).toBe("adjust_prayer");
    expect(result.current.history.nextUndoAction?.source).toBe("settings");
    expect(result.current.history.nextUndoAction?.amount).toBe(-2);

    await runAction(() => result.current.actions.undo());
    expect(result.current.state.prayersRemaining.fajr).toBe(3);
    expect(result.current.history.redoCount).toBe(1);

    await runAction(() => result.current.actions.redo());
    expect(result.current.state.prayersRemaining.fajr).toBe(1);
  });

  it("allows increasing a prayer beyond totalTarget", async () => {
    const { result } = renderHook(() => useQadaStorage());
    await waitFor(() => expect(result.current.mounted).toBe(true));

    await runAction(() => result.current.actions.start(150));
    await runAction(() => result.current.actions.adjustPrayer("fajr", 1, "dashboard"));

    expect(result.current.state.prayersRemaining.fajr).toBe(151);
    expect(result.current.history.nextUndoAction?.type).toBe("adjust_prayer");
    expect(result.current.stats.daysRemaining).toBe(151);
    expect(result.current.stats.totalPrayersCompleted).toBe(0);
  });

  it("preserves extra per-prayer debt when adding days", async () => {
    const { result } = renderHook(() => useQadaStorage());
    await waitFor(() => expect(result.current.mounted).toBe(true));

    await runAction(() => result.current.actions.start(3));
    await runAction(() => result.current.actions.adjustPrayer("fajr", 2, "dashboard"));
    expect(result.current.state.prayersRemaining.fajr).toBe(5);

    await runAction(() => result.current.actions.addDebt(1));

    expect(result.current.state.totalTarget).toBe(4);
    expect(result.current.state.prayersRemaining.fajr).toBe(6);
    expect(result.current.state.prayersRemaining.isha).toBe(4);
  });

  it("rehydrates after adjustPrayer without resetting the tracker", async () => {
    const first = renderHook(() => useQadaStorage());
    await waitFor(() => expect(first.result.current.mounted).toBe(true));

    await runAction(() => first.result.current.actions.start(4));
    await runAction(() => first.result.current.actions.adjustPrayer("fajr", -1, "dashboard"));

    const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "{}");
    expect(stored.history?.past?.[0]?.action?.type).toBe("adjust_prayer");
    expect(stored.history?.past?.[0]?.action?.prayer).toBe("fajr");

    first.unmount();

    const second = renderHook(() => useQadaStorage());
    await waitFor(() => expect(second.result.current.mounted).toBe(true));

    expect(second.result.current.state.initialized).toBe(true);
    expect(second.result.current.state.totalTarget).toBe(4);
    expect(second.result.current.state.prayersRemaining.fajr).toBe(3);
    expect(second.result.current.history.undoCount).toBe(1);
    expect(second.result.current.history.nextUndoAction?.type).toBe("adjust_prayer");
    expect(second.result.current.history.nextUndoAction?.prayer).toBe("fajr");
  });

  it("rehydrates prayer values above totalTarget", async () => {
    const first = renderHook(() => useQadaStorage());
    await waitFor(() => expect(first.result.current.mounted).toBe(true));

    await runAction(() => first.result.current.actions.start(2));
    await runAction(() => first.result.current.actions.adjustPrayer("fajr", 2, "dashboard"));
    expect(first.result.current.state.prayersRemaining.fajr).toBe(4);

    first.unmount();

    const second = renderHook(() => useQadaStorage());
    await waitFor(() => expect(second.result.current.mounted).toBe(true));

    expect(second.result.current.state.totalTarget).toBe(2);
    expect(second.result.current.state.prayersRemaining.fajr).toBe(4);
  });

  it("recovers tracker from shadow storage when primary payload is corrupted", async () => {
    const first = renderHook(() => useQadaStorage());
    await waitFor(() => expect(first.result.current.mounted).toBe(true));

    await runAction(() => first.result.current.actions.start(5));
    await runAction(() => first.result.current.actions.adjustPrayer("isha", -2, "dashboard"));

    const shadowPayload = window.localStorage.getItem(STORAGE_SHADOW_KEY);
    expect(shadowPayload).toBeTruthy();

    first.unmount();

    window.localStorage.setItem(STORAGE_KEY, "{invalid-json");

    const second = renderHook(() => useQadaStorage());
    await waitFor(() => expect(second.result.current.mounted).toBe(true));

    expect(second.result.current.state.totalTarget).toBe(5);
    expect(second.result.current.state.prayersRemaining.isha).toBe(3);
    expect(second.result.current.history.undoCount).toBe(1);
    expect(second.result.current.history.nextUndoAction?.type).toBe("adjust_prayer");
  });

  it("maintains a mirrored shadow copy and clears it on reset", async () => {
    const { result } = renderHook(() => useQadaStorage());
    await waitFor(() => expect(result.current.mounted).toBe(true));

    await runAction(() => result.current.actions.start(3));
    await runAction(() => result.current.actions.incrementDay());

    expect(window.localStorage.getItem(STORAGE_KEY)).toBeTruthy();
    expect(window.localStorage.getItem(STORAGE_SHADOW_KEY)).toBeTruthy();

    await runAction(() => result.current.actions.reset());

    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(window.localStorage.getItem(STORAGE_SHADOW_KEY)).toBeNull();
  });

  it("clearRedo removes future stack without changing current state", async () => {
    const { result } = renderHook(() => useQadaStorage());
    await waitFor(() => expect(result.current.mounted).toBe(true));

    await runAction(() => result.current.actions.start(2));
    await runAction(() => result.current.actions.incrementDay());
    await runAction(() => result.current.actions.undo());

    const snapshotBefore = result.current.state.prayersRemaining.fajr;
    expect(result.current.history.redoCount).toBe(1);

    await runAction(() => result.current.actions.clearRedo());

    expect(result.current.history.redoCount).toBe(0);
    expect(result.current.history.undoCount).toBe(0);
    expect(result.current.state.prayersRemaining.fajr).toBe(snapshotBefore);
  });

  it("clearHistory removes past and future stacks", async () => {
    const { result } = renderHook(() => useQadaStorage());
    await waitFor(() => expect(result.current.mounted).toBe(true));

    await runAction(() => result.current.actions.start(2));
    await runAction(() => result.current.actions.incrementDay());
    await runAction(() => result.current.actions.incrementDay());
    expect(result.current.history.undoCount).toBe(2);

    await runAction(() => result.current.actions.undo());
    expect(result.current.history.redoCount).toBe(1);

    await runAction(() => result.current.actions.clearHistory());

    expect(result.current.history.undoCount).toBe(0);
    expect(result.current.history.redoCount).toBe(0);
  });

  it("rejects invalid replaceTracker payloads to protect persisted data", async () => {
    const { result } = renderHook(() => useQadaStorage());
    await waitFor(() => expect(result.current.mounted).toBe(true));
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await runAction(() => result.current.actions.start(3));
    const snapshotBefore = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "{}");

    const invalidTracker = {
      version: 2,
      current: {
        initialized: true,
        totalTarget: 8,
        prayersRemaining: {
          fajr: 4,
          dhuhr: 4,
          asr: 4,
          maghrib: 4,
          isha: 4
        }
      },
      history: {
        past: [
          {
            before: {
              initialized: true,
              totalTarget: 8,
              prayersRemaining: {
                fajr: 5,
                dhuhr: 5,
                asr: 5,
                maghrib: 5,
                isha: 5
              }
            },
            after: {
              initialized: true,
              totalTarget: 8,
              prayersRemaining: {
                fajr: 4,
                dhuhr: 4,
                asr: 4,
                maghrib: 4,
                isha: 4
              }
            },
            action: {
              type: "adjust_prayer",
              amount: -1,
              at: Date.now()
            }
          }
        ],
        future: []
      }
    } as unknown as PersistedTracker;

    await runAction(() => result.current.actions.replaceTracker(invalidTracker));

    expect(result.current.state.totalTarget).toBe(3);
    expect(result.current.history.undoCount).toBe(0);
    expect(JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "{}")).toEqual(snapshotBefore);
    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  it("replaceTracker swaps current state and history", async () => {
    const { result } = renderHook(() => useQadaStorage());
    await waitFor(() => expect(result.current.mounted).toBe(true));

    await runAction(() => result.current.actions.start(2));

    const imported: PersistedTracker = {
      version: 2,
      current: {
        initialized: true,
        totalTarget: 5,
        prayersRemaining: {
          fajr: 2,
          dhuhr: 1,
          asr: 0,
          maghrib: -1,
          isha: 3
        }
      },
      history: {
        past: [
          {
            before: {
              initialized: true,
              totalTarget: 5,
              prayersRemaining: {
                fajr: 3,
                dhuhr: 2,
                asr: 1,
                maghrib: 0,
                isha: 4
              }
            },
            after: {
              initialized: true,
              totalTarget: 5,
              prayersRemaining: {
                fajr: 2,
                dhuhr: 1,
                asr: 0,
                maghrib: -1,
                isha: 3
              }
            },
            action: {
              type: "adjust_prayer",
              prayer: "maghrib",
              amount: -1,
              source: "settings",
              at: Date.now()
            }
          }
        ],
        future: []
      }
    };

    await runAction(() => result.current.actions.replaceTracker(imported));

    expect(result.current.state.totalTarget).toBe(5);
    expect(result.current.state.prayersRemaining.maghrib).toBe(-1);
    expect(result.current.history.undoCount).toBe(1);
    expect(result.current.history.nextUndoAction?.type).toBe("adjust_prayer");
  });
});
