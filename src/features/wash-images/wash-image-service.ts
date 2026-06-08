import type { WashImage, WashImageRow } from "./types";

export const WASH_IMAGE_BUCKET = "wash-images";

type WashImageObjectPathInput = {
  userId: string;
  washLogId: string;
  fileName: string;
  timestamp?: number;
  randomId?: string;
};

const publicObjectUrlSegment = `/storage/v1/object/public/${WASH_IMAGE_BUCKET}/`;

function getFileExtension(fileName: string) {
  const extension = fileName.split(".").pop()?.trim().toLowerCase();

  return extension && extension !== fileName.toLowerCase() ? extension : "jpg";
}

export function createWashImageObjectPath({
  userId,
  washLogId,
  fileName,
  timestamp = Date.now(),
  randomId = crypto.randomUUID(),
}: WashImageObjectPathInput) {
  const extension = getFileExtension(fileName);

  return `${userId}/${washLogId}/${timestamp}-${randomId}.${extension}`;
}

export function getWashImageStoragePath(imageUrl: string) {
  const [, path] = imageUrl.split(publicObjectUrlSegment);

  return path ? decodeURIComponent(path) : "";
}

export function mapWashImageRowToWashImage(row: WashImageRow): WashImage {
  return {
    id: row.id,
    washLogId: row.wash_log_id,
    imageUrl: row.image_url,
    imageType: row.image_type,
    isRepresentative: row.is_representative,
    createdAt: row.created_at,
  };
}
