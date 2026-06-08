export type Car = {
  id: string;
  userId: string;
  name: string;
  brand: string;
  model: string;
  year: number;
  color: string;
  coatingType: string;
  memo: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type CarRow = {
  id: string;
  user_id: string;
  name: string;
  brand: string;
  model: string;
  year: number;
  color: string;
  coating_type: string;
  memo: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type CarInsertPayload = {
  user_id: string;
  name: string;
  brand: string;
  model: string;
  year: number;
  color: string;
  coating_type: string;
  memo: string | null;
};

export type CarUpdatePayload = Omit<CarInsertPayload, "user_id">;
