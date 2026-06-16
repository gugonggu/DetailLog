import { describe, expect, it } from "vitest";

import {
  loadRoutinePreferences,
  ROUTINE_PREFERENCES_STORAGE_KEY,
  saveRoutinePreferences,
  type RoutinePreferenceStorage,
} from "./routine-preferences";

function createStorage(initialValue?: string): RoutinePreferenceStorage & { savedValue?: string } {
  const storage: RoutinePreferenceStorage & { savedValue?: string } = {
    savedValue: undefined,
    getItem: () => initialValue ?? null,
    setItem: (_key: string, value: string) => {
      storage.savedValue = value;
    },
  };

  return storage;
}

describe("routine preferences", () => {
  it("loads saved owned products and cautions", () => {
    const storage = createStorage(
      JSON.stringify({
        ownedProducts: ["car shampoo", "drying towel"],
        cautions: ["avoid hot panels"],
      }),
    );

    expect(loadRoutinePreferences(storage)).toEqual({
      ownedProducts: ["car shampoo", "drying towel"],
      cautions: ["avoid hot panels"],
    });
  });

  it("ignores malformed saved preferences", () => {
    expect(loadRoutinePreferences(createStorage("not json"))).toEqual({
      ownedProducts: [],
      cautions: [],
    });
  });

  it("saves only owned products and cautions", () => {
    const storage = createStorage();

    saveRoutinePreferences(storage, {
      ownedProducts: ["pre wash"],
      cautions: ["weak clear coat"],
    });

    expect(storage.savedValue).toBe(
      JSON.stringify({
        ownedProducts: ["pre wash"],
        cautions: ["weak clear coat"],
      }),
    );
  });

  it("uses the expected storage key", () => {
    expect(ROUTINE_PREFERENCES_STORAGE_KEY).toBe("detailog:routine:last-input");
  });
});
