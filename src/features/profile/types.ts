export type Profile = {
  id: string;
  email: string;
  nickname: string;
  created_at: string | null;
};

export type ProfileUpsertPayload = {
  id: string;
  email: string;
  nickname: string;
};

export type ProfileUpdatePayload = {
  nickname: string;
};
