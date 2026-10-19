import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createBackup,
  createInitialData,
  loadData,
  parseBackup,
  saveData,
  STORAGE_SCHEMA_VERSION,
} from "./storage";
import { seedQuestions } from "./catalog";

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
  it("starts new users on NeetCode 150", () => {
    expect(createInitialData(now).activePlanId).toBe("neetcode-150");
    expect(loadData(now).activePlanId).toBe("neetcode-150");
  });

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

  it("rejects unsafe links in imported questions", () => {
    const backup = JSON.parse(createBackup(createInitialData(now), now));
    backup.data.questions[0].url = "javascript:alert(1)";

    expect(() => parseBackup(JSON.stringify(backup), now)).toThrow(
      "incomplete or damaged",
    );
  });

  it("rejects unreasonably large backups before parsing", () => {
    expect(() => parseBackup(" ".repeat(5 * 1024 * 1024 + 1), now)).toThrow(
      "too large",
    );
  });

  it("loads the legacy v1 storage format", () => {
    const legacy = createInitialData(now);
    legacy.activePlanId = "blind-75";
    values.set("flashcode:data:v1", JSON.stringify(legacy));

    expect(loadData(now).activePlanId).toBe("blind-75");
  });

  it("refreshes built-in content by stable ID without losing progress", () => {
    const stored = structuredClone(createInitialData(now));
    const questionId = stored.questions[0].id;
    stored.questions[0].url = "https://leetcode.com/problems/contains-duplicate/";
    stored.questions[0].prompt = "Old provider-specific prompt";
    stored.reviews[questionId].repetitions = 4;
    values.set("flashcode:data:v1", JSON.stringify(stored));

    const loaded = loadData(now);

    expect(loaded.questions).toHaveLength(seedQuestions.length);
    expect(loaded.questions[0].url).toBe(seedQuestions[0].url);
    expect(loaded.questions[0].prompt).toBe(seedQuestions[0].prompt);
    expect(loaded.reviews[questionId].repetitions).toBe(4);
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
