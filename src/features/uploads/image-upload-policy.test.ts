import { describe, expect, it } from "vitest";

import {
  AVATAR_IMAGE_MAX_SIZE_BYTES,
  IMAGE_UPLOAD_ACCEPT,
  WASH_IMAGE_MAX_SIZE_BYTES,
  validateImageUploadFile,
} from "./image-upload-policy";

function createFile({
  name = "image.jpg",
  size = 1024,
  type = "image/jpeg",
}: {
  name?: string;
  size?: number;
  type?: string;
}) {
  return { name, size, type } as File;
}

describe("image upload policy", () => {
  it("accepts jpeg, png, and webp images", () => {
    expect(validateImageUploadFile(createFile({ type: "image/jpeg" }))).toEqual({
      valid: true,
      error: "",
    });
    expect(validateImageUploadFile(createFile({ type: "image/png" }))).toEqual({
      valid: true,
      error: "",
    });
    expect(validateImageUploadFile(createFile({ type: "image/webp" }))).toEqual({
      valid: true,
      error: "",
    });
    expect(IMAGE_UPLOAD_ACCEPT).toBe("image/jpeg,image/png,image/webp");
  });

  it("rejects svg and other unsupported image types", () => {
    expect(validateImageUploadFile(createFile({ name: "vector.svg", type: "image/svg+xml" }))).toEqual({
      valid: false,
      error: "JPG, PNG, WEBP 이미지만 업로드할 수 있습니다.",
    });
  });

  it("rejects files larger than the configured limit", () => {
    expect(
      validateImageUploadFile(
        createFile({
          size: AVATAR_IMAGE_MAX_SIZE_BYTES + 1,
          type: "image/jpeg",
        }),
        AVATAR_IMAGE_MAX_SIZE_BYTES,
      ),
    ).toEqual({
      valid: false,
      error: "이미지는 2MB 이하로 업로드해주세요.",
    });

    expect(WASH_IMAGE_MAX_SIZE_BYTES).toBe(5 * 1024 * 1024);
  });
});
