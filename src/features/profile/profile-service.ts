import type { ProfileUpdatePayload, ProfileUpsertPayload } from "./types";

type ProfileUpsertInput = {
  userId: string;
  email: string;
  nickname: string;
  avatarUrl?: string | null;
};

type ProfileUpdateInput = {
  nickname: string;
  avatarUrl?: string | null;
};

type AvatarObjectPathInput = {
  userId: string;
  fileName: string;
  timestamp?: number;
  randomId?: string;
};

export const AVATAR_BUCKET = "avatars";

const publicAvatarUrlSegment = `/storage/v1/object/public/${AVATAR_BUCKET}/`;

function getFileExtension(fileName: string) {
  const extension = fileName.split(".").pop()?.trim().toLowerCase();

  return extension && extension !== fileName.toLowerCase() ? extension : "jpg";
}

export function createAvatarObjectPath({
  userId,
  fileName,
  timestamp = Date.now(),
  randomId = crypto.randomUUID(),
}: AvatarObjectPathInput) {
  const extension = getFileExtension(fileName);

  return `${userId}/avatar-${timestamp}-${randomId}.${extension}`;
}

export function getAvatarStoragePath(avatarUrl: string | null | undefined) {
  if (!avatarUrl) {
    return "";
  }

  const [, path] = avatarUrl.split(publicAvatarUrlSegment);

  return path ? decodeURIComponent(path) : "";
}

export function createProfileUpsertPayload({
  userId,
  email,
  nickname,
  avatarUrl,
}: ProfileUpsertInput): ProfileUpsertPayload {
  return {
    id: userId,
    email,
    nickname: nickname.trim(),
    ...(avatarUrl !== undefined ? { avatar_url: avatarUrl } : {}),
  };
}

export function prepareProfileUpdate({
  nickname,
  avatarUrl,
}: ProfileUpdateInput): ProfileUpdatePayload {
  return {
    nickname: nickname.trim(),
    ...(avatarUrl !== undefined ? { avatar_url: avatarUrl } : {}),
  };
}
