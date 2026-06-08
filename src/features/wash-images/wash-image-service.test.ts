import { describe, expect, it } from "vitest";

import {
  createWashImageObjectPath,
  getWashImageStoragePath,
  mapWashImageRowToWashImage,
} from "./wash-image-service";

describe("wash image service", () => {
  it("creates a user and wash log scoped storage object path", () => {
    const path = createWashImageObjectPath({
      userId: "user-id",
      washLogId: "wash-log-id",
      fileName: "Before Wash.JPG",
      timestamp: 1779145200000,
      randomId: "abc123",
    });

    expect(path).toBe("user-id/wash-log-id/1779145200000-abc123.jpg");
  });

  it("falls back to jpg when the selected file has no extension", () => {
    const path = createWashImageObjectPath({
      userId: "user-id",
      washLogId: "wash-log-id",
      fileName: "image",
      timestamp: 1779145200000,
      randomId: "abc123",
    });

    expect(path).toBe("user-id/wash-log-id/1779145200000-abc123.jpg");
  });

  it("extracts the storage object path from a Supabase public image URL", () => {
    const path = getWashImageStoragePath(
      "https://example.supabase.co/storage/v1/object/public/wash-images/user-id/wash-log-id/file.jpg",
    );

    expect(path).toBe("user-id/wash-log-id/file.jpg");
  });

  it("maps a database row to the feature wash image type", () => {
    const image = mapWashImageRowToWashImage({
      id: "image-id",
      wash_log_id: "wash-log-id",
      image_url: "https://example.supabase.co/storage/v1/object/public/wash-images/user-id/wash-log-id/file.jpg",
      image_type: "before",
      is_representative: true,
      created_at: "2026-05-19T00:00:00.000Z",
    });

    expect(image).toEqual({
      id: "image-id",
      washLogId: "wash-log-id",
      imageUrl:
        "https://example.supabase.co/storage/v1/object/public/wash-images/user-id/wash-log-id/file.jpg",
      imageType: "before",
      isRepresentative: true,
      createdAt: "2026-05-19T00:00:00.000Z",
    });
  });
});
