import { describe, expect, it } from "vitest";
import { parseBackup, serializeBackup, type BackupV1 } from "./backup";
import type { PersistedTracker } from "../components/useLocalStorage";

function createTracker(): PersistedTracker {
  return {
    version: 2,
    current: {
      initialized: true,
      totalTarget: 7,
      prayersRemaining: {
        fajr: 4,
        dhuhr: 3,
        asr: 5,
        maghrib: 2,
        isha: 6
      }
    },
    history: {
      past: [],
      future: []
    }
  };
}

describe("backup serialization and parsing", () => {
  it("serializes with expected schema", () => {
    const tracker = createTracker();
    const raw = serializeBackup(tracker, "fr");
    const parsed = JSON.parse(raw) as BackupV1;

    expect(parsed.version).toBe(1);
    expect(typeof parsed.exportedAt).toBe("string");
    expect(parsed.preferences.locale).toBe("fr");
    expect(parsed.tracker).toEqual(tracker);
  });

  it("parses a valid backup payload", () => {
    const tracker = createTracker();
    const raw = serializeBackup(tracker, "ar");
    const result = parseBackup(raw);

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.data.version).toBe(1);
    expect(result.data.preferences.locale).toBe("ar");
    expect(result.data.tracker).toEqual(tracker);
  });

  it("rejects invalid json", () => {
    const result = parseBackup("{invalid");
    expect(result).toEqual({ ok: false, error: "invalid_json" });
  });

  it("rejects unsupported version", () => {
    const payload = JSON.stringify({
      version: 5,
      exportedAt: new Date().toISOString(),
      tracker: createTracker(),
      preferences: { locale: "en" }
    });

    const result = parseBackup(payload);
    expect(result).toEqual({ ok: false, error: "unsupported_version" });
  });

  it("rejects invalid tracker payload", () => {
    const payload = JSON.stringify({
      version: 1,
      exportedAt: new Date().toISOString(),
      tracker: {
        version: 2,
        current: {
          initialized: true,
          totalTarget: 1,
          prayersRemaining: {
            fajr: 1
          }
        },
        history: {
          past: [],
          future: []
        }
      },
      preferences: { locale: "en" }
    });

    const result = parseBackup(payload);
    expect(result).toEqual({ ok: false, error: "invalid_tracker" });
  });

  it("rejects invalid locale", () => {
    const payload = JSON.stringify({
      version: 1,
      exportedAt: new Date().toISOString(),
      tracker: createTracker(),
      preferences: { locale: "de" }
    });

    const result = parseBackup(payload);
    expect(result).toEqual({ ok: false, error: "invalid_locale" });
  });

  it("rejects too-large payload", () => {
    const oversized = "x".repeat(1_500_001);
    const result = parseBackup(oversized);
    expect(result).toEqual({ ok: false, error: "payload_too_large" });
  });
});
