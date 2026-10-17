import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createBackup,
  createInitialData,
  loadData,
  parseBackup,
  saveData,
  STORAGE_SCHEMA_VERSION,
} from "./storage";

const now = new Date("2026-10-17T12:00:00.000Z");
let values: Map<string, string>;

beforeEach(() => {
  values = new Map();
  vi.stubGlobal("window", {
    localStorage: {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
      removeItem: (key: string) => values.delete(key),
    },
  });
});

afterEach(() => vi.unstubAllGlobals());

describe("Flashcode backups", () => {
  it("round-trips current application data", () => {
    const original = createInitialData(now);
    const restored = parseBackup(createBackup(original, now), now);

    expect(restored.activePlanId).toBe(original.activePlanId);
    expect(restored.questions).toHaveLength(original.questions.length);
    expect(restored.reviews).toEqual(original.reviews);
  });

  it("includes an explicit storage schema version", () => {
    const backup = JSON.parse(createBackup(createInitialData(now), now));

    expect(backup.product).toBe("flashcode");
    expect(backup.schemaVersion).toBe(STORAGE_SCHEMA_VERSION);
    expect(backup.exportedAt).toBe(now.toISOString());
  });

  it("rejects backups from unsupported schema versions", () => {
    const backup = JSON.parse(createBackup(createInitialData(now), now));
    backup.schemaVersion += 1;

    expect(() => parseBackup(JSON.stringify(backup), now)).toThrow(
      "unsupported Flashcode version",
    );
  });

  it("rejects unrelated JSON files", () => {
    expect(() => parseBackup('{"hello":"world"}', now)).toThrow(
      "not a Flashcode backup",
    );
  });

  it("loads the legacy v1 storage format", () => {
    const legacy = createInitialData(now);
    legacy.activePlanId = "blind-75";
    values.set("flashcode:data:v1", JSON.stringify(legacy));

    expect(loadData(now).activePlanId).toBe("blind-75");
  });

  it("saves application data inside the versioned storage envelope", () => {
    values.set("flashcode:data:v1", JSON.stringify(createInitialData(now)));
    saveData(createInitialData(now), now);
    const stored = JSON.parse(values.get("flashcode:data")!);

    expect(stored.product).toBe("flashcode");
    expect(stored.schemaVersion).toBe(STORAGE_SCHEMA_VERSION);
    expect(stored.savedAt).toBe(now.toISOString());
    expect(values.has("flashcode:data:v1")).toBe(false);
  });
});
