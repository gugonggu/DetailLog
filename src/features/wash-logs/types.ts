import type { WashImage, WashImageRow } from "../wash-images/types";

export type WashLogVisibility = "private" | "public";

export type WashStep = {
  id: string;
  washLogId: string;
  stepType: string;
  productName: string | null;
  memo: string | null;
  stepOrder: number;
  createdAt: string | null;
};

export type WashLogCar = {
  id: string;
  name: string;
  brand: string;
  model: string;
};

export type WashLog = {
  id: string;
  userId: string;
  carId: string;
  title: string;
  washDate: string;
  location: string | null;
  durationMinutes: number;
  cost: number;
  weather: string | null;
  dirtLevel: number;
  satisfaction: number;
  memo: string | null;
  visibility: WashLogVisibility;
  createdAt: string | null;
  updatedAt: string | null;
  car: WashLogCar | null;
  steps: WashStep[];
  images: WashImage[];
};

export type WashStepRow = {
  id: string;
  wash_log_id: string;
  step_type: string;
  product_name: string | null;
  memo: string | null;
  step_order: number;
  created_at: string | null;
};

export type WashLogRow = {
  id: string;
  user_id: string;
  car_id: string;
  title: string;
  wash_date: string;
  location: string | null;
  duration_minutes: number;
  cost: number;
  weather: string | null;
  dirt_level: number;
  satisfaction: number;
  memo: string | null;
  visibility: WashLogVisibility;
  created_at: string | null;
  updated_at: string | null;
  cars?: WashLogCar | WashLogCar[] | null;
  wash_steps?: WashStepRow[] | null;
  wash_images?: WashImageRow[] | null;
};

export type WashLogInsertPayload = {
  user_id: string;
  car_id: string;
  title: string;
  wash_date: string;
  location: string | null;
  duration_minutes: number;
  cost: number;
  weather: string | null;
  dirt_level: number;
  satisfaction: number;
  memo: string | null;
  visibility: WashLogVisibility;
};

export type WashLogUpdatePayload = Omit<WashLogInsertPayload, "user_id">;

export type WashStepInsertPayload = {
  wash_log_id?: string;
  step_type: string;
  product_name: string | null;
  memo: string | null;
  step_order: number;
};
