import { describe, expect, it } from "vitest";

import {
  createAvatarObjectPath,
  createProfileUpsertPayload,
  getAvatarStoragePath,
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
      avatarUrl: "https://example.supabase.co/storage/v1/object/public/avatars/user-id/avatar.jpg",
    });

    expect(payload).toEqual({
      nickname: "Detailer",
      avatar_url:
        "https://example.supabase.co/storage/v1/object/public/avatars/user-id/avatar.jpg",
    });
  });

  it("prepares a profile upsert payload for signup or empty states", () => {
    const payload = createProfileUpsertPayload({
      userId: "user-id",
      email: "user@example.com",
      nickname: "  Detailer  ",
      avatarUrl: "https://example.supabase.co/storage/v1/object/public/avatars/user-id/avatar.jpg",
    });

    expect(payload).toEqual({
      id: "user-id",
      email: "user@example.com",
      nickname: "Detailer",
      avatar_url:
        "https://example.supabase.co/storage/v1/object/public/avatars/user-id/avatar.jpg",
    });
  });

  it("creates a user-scoped avatar storage object path", () => {
    const path = createAvatarObjectPath({
      userId: "user-id",
      fileName: "Profile.PNG",
      timestamp: 1779145200000,
      randomId: "abc123",
    });

    expect(path).toBe("user-id/avatar-1779145200000-abc123.png");
  });

  it("falls back to jpg when the avatar file has no extension", () => {
    const path = createAvatarObjectPath({
      userId: "user-id",
      fileName: "avatar",
      timestamp: 1779145200000,
      randomId: "abc123",
    });

    expect(path).toBe("user-id/avatar-1779145200000-abc123.jpg");
  });

  it("extracts the avatar storage object path from a public URL", () => {
    const path = getAvatarStoragePath(
      "https://example.supabase.co/storage/v1/object/public/avatars/user-id/avatar.jpg",
    );

    expect(path).toBe("user-id/avatar.jpg");
  });
});
