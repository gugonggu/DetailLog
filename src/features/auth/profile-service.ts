type PendingProfileInput = {
  userId: string;
  email: string;
  nickname: string;
};

export type PendingProfile = {
  id: string;
  email: string;
  nickname: string;
};

export function prepareProfileCreation({
  userId,
  email,
  nickname,
}: PendingProfileInput): PendingProfile {
  return {
    id: userId,
    email,
    nickname: nickname.trim(),
  };
}
