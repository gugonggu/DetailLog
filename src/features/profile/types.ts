export type Profile = {
  id: string;
  email: string;
  nickname: string;
  avatar_url: string | null;
  created_at: string | null;
};

export type ProfileUpsertPayload = {
  id: string;
  email: string;
  nickname: string;
  avatar_url?: string | null;
};

export type ProfileUpdatePayload = {
  nickname: string;
  avatar_url?: string | null;
};
