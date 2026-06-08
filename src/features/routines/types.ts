import type { RoutineInputValues, RoutineResult } from "./schemas";

export type RoutineCar = {
  id: string;
  name: string;
  brand: string;
  model: string;
};

export type Routine = {
  id: string;
  userId: string;
  carId: string;
  input: RoutineInputValues;
  result: RoutineResult;
  createdAt: string | null;
  car: RoutineCar | null;
};

export type RoutineRow = {
  id: string;
  user_id: string;
  car_id: string;
  input: unknown;
  result: unknown;
  created_at: string | null;
  cars?: RoutineCar | RoutineCar[] | null;
};

export type RoutineInsertPayload = {
  user_id: string;
  car_id: string;
  input: RoutineInputValues;
  result: RoutineResult;
};
