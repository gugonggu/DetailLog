import { describe, expect, it } from "vitest";

import {
  createWashImageObjectPath,
  getWashImageStoragePath,
  mapWashImageRowToWashImage,
  signWashImageRows,
  signWashImageUrl,
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

  it("extracts the storage object path from a Supabase signed image URL", () => {
    const path = getWashImageStoragePath(
      "https://example.supabase.co/storage/v1/object/sign/wash-images/user-id/wash-log-id/file.jpg?token=abc",
    );

    expect(path).toBe("user-id/wash-log-id/file.jpg");
  });

  it("signs stored wash image URLs with the wash image bucket", async () => {
    const supabase = {
      storage: {
        from(bucket: string) {
          return {
            createSignedUrl(path: string, expiresIn: number) {
              return Promise.resolve({
                data: {
                  signedUrl: `signed:${bucket}:${path}:${expiresIn}`,
                },
                error: null,
              });
            },
          };
        },
      },
    };

    await expect(
      signWashImageUrl(
        supabase,
        "https://example.supabase.co/storage/v1/object/public/wash-images/user-id/wash-log-id/file.jpg",
        60,
      ),
    ).resolves.toBe("signed:wash-images:user-id/wash-log-id/file.jpg:60");
  });

  it("signs wash image database rows without mutating the original rows", async () => {
    const row = {
      id: "image-id",
      wash_log_id: "wash-log-id",
      image_url:
        "https://example.supabase.co/storage/v1/object/public/wash-images/user-id/wash-log-id/file.jpg",
      image_type: "before" as const,
      is_representative: true,
      created_at: "2026-05-19T00:00:00.000Z",
    };
    const supabase = {
      storage: {
        from() {
          return {
            createSignedUrl() {
              return Promise.resolve({
                data: { signedUrl: "https://signed.example/file.jpg" },
                error: null,
              });
            },
          };
        },
      },
    };

    const [signedRow] = await signWashImageRows(supabase, [row]);

    expect(signedRow.image_url).toBe("https://signed.example/file.jpg");
    expect(row.image_url).toContain("/object/public/wash-images/");
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
