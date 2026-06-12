import { describe, expect, it } from "vitest";

import {
  createCarInsertPayload,
  createCarUpdatePayload,
  mapCarRowToCar,
} from "./car-service";
import {
  CAR_PAINT_PROTECTION_OPTIONS,
  carFormSchema,
  createCarFormSchema,
  getPaintProtectionOptions,
} from "./schemas";

describe("car schemas", () => {
  it("accepts a trimmed car form payload", () => {
    const result = carFormSchema.safeParse({
      name: "  Weekend sedan  ",
      brand: "  Hyundai  ",
      model: "  Sonata  ",
      year: "2024",
      color: "  White  ",
      coatingType: "  유리막·세라믹 코팅  ",
      memo: "  Garage kept  ",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({
        name: "Weekend sedan",
        brand: "Hyundai",
        model: "Sonata",
        year: 2024,
        color: "White",
        coatingType: "유리막·세라믹 코팅",
        memo: "Garage kept",
      });
    }
  });

  it("rejects an invalid production year", () => {
    const result = carFormSchema.safeParse({
      name: "Daily",
      brand: "Hyundai",
      model: "Sonata",
      year: "1885",
      color: "White",
      coatingType: "왁스",
      memo: "",
    });

    expect(result.success).toBe(false);
  });

  it("rejects a paint protection value outside the selection list", () => {
    const result = carFormSchema.safeParse({
      name: "Daily",
      brand: "Hyundai",
      model: "Sonata",
      year: "2024",
      color: "White",
      coatingType: "Unknown custom coating",
      memo: "",
    });

    expect(result.success).toBe(false);
  });

  it("keeps a legacy paint protection value available while editing", () => {
    expect(getPaintProtectionOptions("Legacy coating")).toEqual([
      ...CAR_PAINT_PROTECTION_OPTIONS,
      "Legacy coating",
    ]);
    expect(getPaintProtectionOptions("왁스")).toEqual(
      CAR_PAINT_PROTECTION_OPTIONS,
    );

    expect(
      createCarFormSchema("Legacy coating").safeParse({
        name: "Daily",
        brand: "Hyundai",
        model: "Sonata",
        year: "2024",
        color: "White",
        coatingType: "Legacy coating",
        memo: "",
      }).success,
    ).toBe(true);
  });

  it("prepares an insert payload with user ownership", () => {
    const payload = createCarInsertPayload({
      userId: "user-id",
      values: {
        name: "Daily",
        brand: "Hyundai",
        model: "Sonata",
        year: 2024,
        color: "White",
        coatingType: "Ceramic",
        memo: "",
      },
    });

    expect(payload).toEqual({
      user_id: "user-id",
      name: "Daily",
      brand: "Hyundai",
      model: "Sonata",
      year: 2024,
      color: "White",
      coating_type: "Ceramic",
      memo: null,
    });
  });

  it("prepares an update payload without changing ownership", () => {
    const payload = createCarUpdatePayload({
      name: "  Daily  ",
      brand: "  Hyundai  ",
      model: "  Sonata  ",
      year: 2024,
      color: "  White  ",
      coatingType: "  Ceramic  ",
      memo: "  Updated memo  ",
    });

    expect(payload).toEqual({
      name: "Daily",
      brand: "Hyundai",
      model: "Sonata",
      year: 2024,
      color: "White",
      coating_type: "Ceramic",
      memo: "Updated memo",
    });
  });

  it("maps a database row to the feature car type", () => {
    const car = mapCarRowToCar({
      id: "car-id",
      user_id: "user-id",
      name: "Daily",
      brand: "Hyundai",
      model: "Sonata",
      year: 2024,
      color: "White",
      coating_type: "Ceramic",
      memo: null,
      created_at: "2026-05-19T00:00:00.000Z",
      updated_at: "2026-05-19T00:00:00.000Z",
    });

    expect(car).toEqual({
      id: "car-id",
      userId: "user-id",
      name: "Daily",
      brand: "Hyundai",
      model: "Sonata",
      year: 2024,
      color: "White",
      coatingType: "Ceramic",
      memo: null,
      createdAt: "2026-05-19T00:00:00.000Z",
      updatedAt: "2026-05-19T00:00:00.000Z",
    });
  });
});
