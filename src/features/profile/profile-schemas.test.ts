import { describe, expect, it } from "vitest";

import {
  createProfileUpsertPayload,
  prepareProfileUpdate,
} from "./profile-service";
import { profileFormSchema } from "./schemas";

describe("profile schemas", () => {
  it("accepts a trimmed nickname for profile editing", () => {
    const result = profileFormSchema.safeParse({
      nickname: "  Detailer  ",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.nickname).toBe("Detailer");
    }
  });

  it("rejects a nickname shorter than 2 characters", () => {
    const result = profileFormSchema.safeParse({
      nickname: "D",
    });

    expect(result.success).toBe(false);
  });

  it("rejects a nickname longer than 30 characters", () => {
    const result = profileFormSchema.safeParse({
      nickname: "D".repeat(31),
    });

    expect(result.success).toBe(false);
  });

  it("prepares a trimmed profile update payload", () => {
    const payload = prepareProfileUpdate({
      nickname: "  Detailer  ",
    });

    expect(payload).toEqual({
      nickname: "Detailer",
    });
  });

  it("prepares a profile upsert payload for signup or empty states", () => {
    const payload = createProfileUpsertPayload({
      userId: "user-id",
      email: "user@example.com",
      nickname: "  Detailer  ",
    });

    expect(payload).toEqual({
      id: "user-id",
      email: "user@example.com",
      nickname: "Detailer",
    });
  });
});
