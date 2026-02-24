import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Settings } from "./Settings";
import { LanguageProvider } from "../i18n/LanguageProvider";
import type { PersistedTracker, QadaState } from "./useLocalStorage";
import type { PrayerStats } from "../lib/calculations";

function createActions() {
  const tracker: PersistedTracker = {
    version: 2,
    current: {
      initialized: true,
      totalTarget: 10,
      prayersRemaining: {
        fajr: 6,
        dhuhr: 6,
        asr: 6,
        maghrib: 6,
        isha: 6
      }
    },
    history: {
      past: [],
      future: []
    }
  };

  return {
    start: vi.fn(),
    incrementDay: vi.fn(),
    decrementDay: vi.fn(),
    completePrayer: vi.fn(),
    undoPrayer: vi.fn(),
    adjustPrayer: vi.fn(),
    addDebt: vi.fn(),
    clearRedo: vi.fn(),
    clearHistory: vi.fn(),
    replaceTracker: vi.fn(() => true),
    getPersistedTracker: vi.fn(() => tracker),
    undo: vi.fn(),
    redo: vi.fn(),
    reset: vi.fn()
  };
}

function createState(): QadaState {
  return {
    initialized: true,
    totalTarget: 10,
    prayersRemaining: {
      fajr: 6,
      dhuhr: 6,
      asr: 6,
      maghrib: 6,
      isha: 6
    }
  };
}

function createStats(): PrayerStats {
  return {
    totalPrayersTarget: 50,
    totalPrayersRemaining: 30,
    totalPrayersCompleted: 20,
    daysRemaining: 6,
    daysCompleted: 4,
    surplusDays: 0,
    surplusPrayersRemainder: 0,
    progress: 40
  };
}

function renderSettings(overrides?: {
  history?: { canUndo: boolean; canRedo: boolean; undoCount: number; redoCount: number };
}) {
  const actions = createActions();
  const history = {
    canUndo: false,
    canRedo: false,
    undoCount: 0,
    redoCount: 0,
    nextUndoAction: null,
    nextRedoAction: null,
    lastEvent: null,
    ...(overrides?.history ?? {})
  };

  const utils = render(
    <LanguageProvider>
      <Settings
        onBack={vi.fn()}
        state={createState()}
        actions={actions}
        history={history}
        stats={createStats()}
      />
    </LanguageProvider>
  );

  return { actions, ...utils };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("Settings", () => {
  it("does not render per-prayer editing controls", () => {
    renderSettings();
    expect(screen.queryByText("Prayer details")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Mark one prayer done for Fajr")).not.toBeInTheDocument();
  });

  it("requires confirmation before clearing redo", () => {
    const { actions } = renderSettings({
      history: { canUndo: false, canRedo: true, undoCount: 0, redoCount: 2 }
    });
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);

    fireEvent.click(screen.getByText("Clear redo stack"));

    expect(confirmSpy).toHaveBeenCalled();
    expect(actions.clearRedo).toHaveBeenCalledTimes(1);
  });

  it("shows localized error on invalid import file", async () => {
    const { actions, container } = renderSettings();
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);
    const input = container.querySelector('input[type="file"]') as HTMLInputElement | null;
    expect(input).not.toBeNull();
    if (!input) return;

    const file = new File(["not-a-json"], "broken.json", { type: "application/json" });
    Object.defineProperty(file, "text", {
      value: () => Promise.resolve("{not-valid-json"),
      configurable: true
    });
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText("Invalid JSON file.")).toBeInTheDocument();
    });

    expect(confirmSpy).not.toHaveBeenCalled();
    expect(actions.replaceTracker).not.toHaveBeenCalled();
  });

  it("shows invalid-tracker error when replaceTracker rejects imported data", async () => {
    const { actions, container } = renderSettings();
    actions.replaceTracker.mockReturnValue(false);

    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);
    const input = container.querySelector('input[type="file"]') as HTMLInputElement | null;
    expect(input).not.toBeNull();
    if (!input) return;

    const validBackupPayload = JSON.stringify({
      version: 1,
      exportedAt: new Date().toISOString(),
      tracker: actions.getPersistedTracker(),
      preferences: { locale: "en" }
    });

    const file = new File([validBackupPayload], "valid.json", { type: "application/json" });
    Object.defineProperty(file, "text", {
      value: () => Promise.resolve(validBackupPayload),
      configurable: true
    });
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText("Backup data is invalid.")).toBeInTheDocument();
    });

    expect(confirmSpy).toHaveBeenCalled();
    expect(actions.replaceTracker).toHaveBeenCalledTimes(1);
  });
});
