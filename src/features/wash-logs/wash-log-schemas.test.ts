import { describe, expect, it } from "vitest";

import {
  createWashLogInsertPayload,
  createWashLogUpdatePayload,
  mapWashLogRowToWashLog,
} from "./wash-log-service";
import { washLogFormSchema } from "./schemas";

describe("wash log schemas", () => {
  it("accepts a trimmed wash log form payload with ordered steps", () => {
    const result = washLogFormSchema.safeParse({
      carId: "car-id",
      title: "  Weekend wash  ",
      washDate: "2026-05-19",
      location: "  Home garage  ",
      durationMinutes: "90",
      cost: "25000",
      weather: "  Sunny  ",
      dirtLevel: "4",
      satisfaction: "5",
      memo: "  Careful rinse  ",
      visibility: "private",
      steps: [
        {
          stepType: "  Pre wash  ",
          productName: "  Citrus cleaner  ",
          memo: "  Lower panels  ",
          stepOrder: 1,
        },
      ],
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({
        carId: "car-id",
        title: "Weekend wash",
        washDate: "2026-05-19",
        location: "Home garage",
        durationMinutes: 90,
        cost: 25000,
        weather: "Sunny",
        dirtLevel: 4,
        satisfaction: 5,
        memo: "Careful rinse",
        visibility: "private",
        steps: [
          {
            stepType: "Pre wash",
            productName: "Citrus cleaner",
            memo: "Lower panels",
            stepOrder: 1,
          },
        ],
      });
    }
  });

  it("rejects a wash log without steps", () => {
    const result = washLogFormSchema.safeParse({
      carId: "car-id",
      title: "Weekend wash",
      washDate: "2026-05-19",
      location: "",
      durationMinutes: "60",
      cost: "0",
      weather: "",
      dirtLevel: "3",
      satisfaction: "4",
      memo: "",
      visibility: "public",
      steps: [],
    });

    expect(result.success).toBe(false);
  });

  it("prepares insert payloads with user ownership and nullable optional fields", () => {
    const payload = createWashLogInsertPayload({
      userId: "user-id",
      values: {
        carId: "car-id",
        title: "Weekend wash",
        washDate: "2026-05-19",
        location: "",
        durationMinutes: 90,
        cost: 0,
        weather: "",
        dirtLevel: 4,
        satisfaction: 5,
        memo: "",
        visibility: "private",
        steps: [
          {
            stepType: "Pre wash",
            productName: "",
            memo: "",
            stepOrder: 1,
          },
        ],
      },
    });

    expect(payload).toEqual({
      log: {
        user_id: "user-id",
        car_id: "car-id",
        title: "Weekend wash",
        wash_date: "2026-05-19",
        location: null,
        duration_minutes: 90,
        cost: 0,
        weather: null,
        dirt_level: 4,
        satisfaction: 5,
        memo: null,
        visibility: "private",
      },
      steps: [
        {
          step_type: "Pre wash",
          product_name: null,
          memo: null,
          step_order: 1,
        },
      ],
    });
  });

  it("prepares update payloads without changing ownership", () => {
    const payload = createWashLogUpdatePayload({
      carId: "car-id",
      title: "  Updated wash  ",
      washDate: "2026-05-20",
      location: "  Wash bay  ",
      durationMinutes: 75,
      cost: 15000,
      weather: "  Cloudy  ",
      dirtLevel: 2,
      satisfaction: 4,
      memo: "  Updated memo  ",
      visibility: "public",
      steps: [
        {
          stepType: "Contact wash",
          productName: "Shampoo",
          memo: "Two bucket",
          stepOrder: 1,
        },
      ],
    });

    expect(payload.log).toEqual({
      car_id: "car-id",
      title: "Updated wash",
      wash_date: "2026-05-20",
      location: "Wash bay",
      duration_minutes: 75,
      cost: 15000,
      weather: "Cloudy",
      dirt_level: 2,
      satisfaction: 4,
      memo: "Updated memo",
      visibility: "public",
    });
    expect(payload.steps).toEqual([
      {
        step_type: "Contact wash",
        product_name: "Shampoo",
        memo: "Two bucket",
        step_order: 1,
      },
    ]);
  });

  it("maps a joined database row to the feature wash log type", () => {
    const washLog = mapWashLogRowToWashLog({
      id: "wash-log-id",
      user_id: "user-id",
      car_id: "car-id",
      title: "Weekend wash",
      wash_date: "2026-05-19",
      location: null,
      duration_minutes: 90,
      cost: 0,
      weather: null,
      dirt_level: 4,
      satisfaction: 5,
      memo: null,
      visibility: "private",
      created_at: "2026-05-19T00:00:00.000Z",
      updated_at: "2026-05-19T00:00:00.000Z",
      cars: {
        id: "car-id",
        name: "Daily",
        brand: "Hyundai",
        model: "Sonata",
      },
      wash_steps: [
        {
          id: "step-id",
          wash_log_id: "wash-log-id",
          step_type: "Pre wash",
          product_name: null,
          memo: null,
          step_order: 1,
          created_at: "2026-05-19T00:00:00.000Z",
        },
      ],
      wash_images: [
        {
          id: "image-id",
          wash_log_id: "wash-log-id",
          image_url:
            "https://example.supabase.co/storage/v1/object/public/wash-images/user-id/wash-log-id/file.jpg",
          image_type: "before",
          is_representative: true,
          created_at: "2026-05-19T00:00:00.000Z",
        },
      ],
    });

    expect(washLog).toEqual({
      id: "wash-log-id",
      userId: "user-id",
      carId: "car-id",
      title: "Weekend wash",
      washDate: "2026-05-19",
      location: null,
      durationMinutes: 90,
      cost: 0,
      weather: null,
      dirtLevel: 4,
      satisfaction: 5,
      memo: null,
      visibility: "private",
      createdAt: "2026-05-19T00:00:00.000Z",
      updatedAt: "2026-05-19T00:00:00.000Z",
      car: {
        id: "car-id",
        name: "Daily",
        brand: "Hyundai",
        model: "Sonata",
      },
      steps: [
        {
          id: "step-id",
          washLogId: "wash-log-id",
          stepType: "Pre wash",
          productName: null,
          memo: null,
          stepOrder: 1,
          createdAt: "2026-05-19T00:00:00.000Z",
        },
      ],
      images: [
        {
          id: "image-id",
          washLogId: "wash-log-id",
          imageUrl:
            "https://example.supabase.co/storage/v1/object/public/wash-images/user-id/wash-log-id/file.jpg",
          imageType: "before",
          isRepresentative: true,
          createdAt: "2026-05-19T00:00:00.000Z",
        },
      ],
    });
  });
});
