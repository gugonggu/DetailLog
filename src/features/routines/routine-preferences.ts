import { z } from "zod";

export const ROUTINE_PREFERENCES_STORAGE_KEY = "detailog:routine:last-input";

export type RoutinePreferences = {
  ownedProducts: string[];
  cautions: string[];
};

export type RoutinePreferenceStorage = Pick<Storage, "getItem" | "setItem">;

const routinePreferencesSchema = z.object({
  ownedProducts: z.array(z.string()).default([]),
  cautions: z.array(z.string()).default([]),
});

const emptyPreferences: RoutinePreferences = {
  ownedProducts: [],
  cautions: [],
};

export function loadRoutinePreferences(storage: RoutinePreferenceStorage): RoutinePreferences {
  const rawValue = storage.getItem(ROUTINE_PREFERENCES_STORAGE_KEY);

  if (!rawValue) {
    return emptyPreferences;
  }

  try {
    return routinePreferencesSchema.parse(JSON.parse(rawValue));
  } catch {
    return emptyPreferences;
  }
}

export function saveRoutinePreferences(
  storage: RoutinePreferenceStorage,
  preferences: RoutinePreferences,
) {
  storage.setItem(ROUTINE_PREFERENCES_STORAGE_KEY, JSON.stringify(preferences));
}
