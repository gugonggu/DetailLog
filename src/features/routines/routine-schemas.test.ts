import { describe, expect, it } from "vitest";

import {
  createRoutineInsertPayload,
  mapRoutineRowToRoutine,
} from "./routine-service";
import { routineInputSchema, routineResultSchema } from "./schemas";

describe("routine schemas", () => {
  it("accepts trimmed routine input with list fields", () => {
    const result = routineInputSchema.safeParse({
      carId: "car-id",
      carColor: "  White  ",
      coatingType: "  Ceramic  ",
      dirtLevel: "4",
      environment: "self_wash_bay",
      experienceLevel: "beginner",
      targetTime: "60",
      goals: ["  safe wash  ", ""],
      ownedProducts: ["  shampoo  ", "microfiber towel"],
      cautions: ["  avoid strong alkaline cleaner  "],
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({
        carId: "car-id",
        carColor: "White",
        coatingType: "Ceramic",
        dirtLevel: 4,
        environment: "self_wash_bay",
        experienceLevel: "beginner",
        targetTime: 60,
        goals: ["safe wash"],
        ownedProducts: ["shampoo", "microfiber towel"],
        cautions: ["avoid strong alkaline cleaner"],
      });
    }
  });

  it("rejects a routine result without cautions", () => {
    const result = routineResultSchema.safeParse({
      title: "Safe ceramic maintenance wash",
      summary: "A gentle routine for a lightly coated car.",
      estimatedTime: 60,
      difficulty: "easy",
      steps: [
        {
          order: 1,
          title: "Pre rinse",
          description: "Rinse from top to bottom.",
          products: ["Pressure washer"],
          estimatedMinutes: 10,
          cautions: ["Keep distance from trim."],
        },
      ],
      missingProducts: [],
    });

    expect(result.success).toBe(false);
  });

  it("prepares a Supabase insert payload with input and result JSON", () => {
    const payload = createRoutineInsertPayload({
      userId: "user-id",
      input: {
        carId: "car-id",
        carColor: "White",
        coatingType: "Ceramic",
        dirtLevel: 4,
        environment: "self_wash_bay",
        experienceLevel: "beginner",
        targetTime: 60,
        goals: ["safe wash"],
        ownedProducts: ["shampoo"],
        cautions: ["weak clear coat"],
      },
      result: {
        title: "Safe maintenance wash",
        summary: "A clear, careful routine.",
        estimatedTime: 60,
        difficulty: "easy",
        steps: [
          {
            order: 1,
            title: "Pre rinse",
            description: "Rinse loose dirt before contact.",
            products: ["Water"],
            estimatedMinutes: 10,
            cautions: ["Do not wipe dry dirt."],
          },
        ],
        missingProducts: ["Drying towel"],
        generalCautions: ["Test unfamiliar products on a small area first."],
      },
    });

    expect(payload).toEqual({
      user_id: "user-id",
      car_id: "car-id",
      input: {
        carId: "car-id",
        carColor: "White",
        coatingType: "Ceramic",
        dirtLevel: 4,
        environment: "self_wash_bay",
        experienceLevel: "beginner",
        targetTime: 60,
        goals: ["safe wash"],
        ownedProducts: ["shampoo"],
        cautions: ["weak clear coat"],
      },
      result: {
        title: "Safe maintenance wash",
        summary: "A clear, careful routine.",
        estimatedTime: 60,
        difficulty: "easy",
        steps: [
          {
            order: 1,
            title: "Pre rinse",
            description: "Rinse loose dirt before contact.",
            products: ["Water"],
            estimatedMinutes: 10,
            cautions: ["Do not wipe dry dirt."],
          },
        ],
        missingProducts: ["Drying towel"],
        generalCautions: ["Test unfamiliar products on a small area first."],
      },
    });
  });

  it("maps a database row to the feature routine type", () => {
    const routine = mapRoutineRowToRoutine({
      id: "routine-id",
      user_id: "user-id",
      car_id: "car-id",
      input: {
        carId: "car-id",
        carColor: "White",
        coatingType: "Ceramic",
        dirtLevel: 3,
        environment: "home",
        experienceLevel: "intermediate",
        targetTime: 45,
        goals: ["gloss"],
        ownedProducts: [],
        cautions: [],
      },
      result: {
        title: "Gloss wash",
        summary: "A compact gloss-focused wash.",
        estimatedTime: 45,
        difficulty: "normal",
        steps: [
          {
            order: 1,
            title: "Rinse",
            description: "Rinse panels thoroughly.",
            products: [],
            estimatedMinutes: 8,
            cautions: ["Avoid hot panels."],
          },
        ],
        missingProducts: [],
        generalCautions: ["Stop if a product causes staining."],
      },
      created_at: "2026-05-19T00:00:00.000Z",
      cars: {
        id: "car-id",
        name: "Daily",
        brand: "Hyundai",
        model: "Sonata",
      },
    });

    expect(routine).toEqual({
      id: "routine-id",
      userId: "user-id",
      carId: "car-id",
      input: {
        carId: "car-id",
        carColor: "White",
        coatingType: "Ceramic",
        dirtLevel: 3,
        environment: "home",
        experienceLevel: "intermediate",
        targetTime: 45,
        goals: ["gloss"],
        ownedProducts: [],
        cautions: [],
      },
      result: {
        title: "Gloss wash",
        summary: "A compact gloss-focused wash.",
        estimatedTime: 45,
        difficulty: "normal",
        steps: [
          {
            order: 1,
            title: "Rinse",
            description: "Rinse panels thoroughly.",
            products: [],
            estimatedMinutes: 8,
            cautions: ["Avoid hot panels."],
          },
        ],
        missingProducts: [],
        generalCautions: ["Stop if a product causes staining."],
      },
      createdAt: "2026-05-19T00:00:00.000Z",
      car: {
        id: "car-id",
        name: "Daily",
        brand: "Hyundai",
        model: "Sonata",
      },
    });
  });
});
