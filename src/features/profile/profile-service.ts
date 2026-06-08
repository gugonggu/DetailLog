import type { ProfileUpdatePayload, ProfileUpsertPayload } from "./types";

type ProfileUpsertInput = {
  userId: string;
  email: string;
  nickname: string;
};

type ProfileUpdateInput = {
  nickname: string;
};

export function createProfileUpsertPayload({
  userId,
  email,
  nickname,
}: ProfileUpsertInput): ProfileUpsertPayload {
  return {
    id: userId,
    email,
    nickname: nickname.trim(),
  };
}

export function prepareProfileUpdate({
  nickname,
}: ProfileUpdateInput): ProfileUpdatePayload {
  return {
    nickname: nickname.trim(),
  };
}
