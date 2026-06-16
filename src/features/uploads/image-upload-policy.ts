export const ALLOWED_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const IMAGE_UPLOAD_ACCEPT = ALLOWED_IMAGE_MIME_TYPES.join(",");
export const AVATAR_IMAGE_MAX_SIZE_BYTES = 2 * 1024 * 1024;
export const WASH_IMAGE_MAX_SIZE_BYTES = 5 * 1024 * 1024;

type ImageUploadValidationResult =
  | {
      valid: true;
      error: "";
    }
  | {
      valid: false;
      error: string;
    };

export function validateImageUploadFile(
  file: Pick<File, "size" | "type">,
  maxSizeBytes = WASH_IMAGE_MAX_SIZE_BYTES,
): ImageUploadValidationResult {
  if (!ALLOWED_IMAGE_MIME_TYPES.some((type) => type === file.type)) {
    return {
      valid: false,
      error: "JPG, PNG, WEBP 이미지만 업로드할 수 있습니다.",
    };
  }

  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `이미지는 ${Math.floor(maxSizeBytes / 1024 / 1024)}MB 이하로 업로드해주세요.`,
    };
  }

  return { valid: true, error: "" };
}
