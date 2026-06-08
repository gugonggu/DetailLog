import {
  routineInputSchema,
  routineResultSchema,
  type RoutineInputValues,
  type RoutineResult,
} from "./schemas";
import type { Routine, RoutineInsertPayload, RoutineRow } from "./types";

type RoutineInsertInput = {
  userId: string;
  input: RoutineInputValues;
  result: RoutineResult;
};

export function createRoutineInsertPayload({
  userId,
  input,
  result,
}: RoutineInsertInput): RoutineInsertPayload {
  return {
    user_id: userId,
    car_id: input.carId,
    input,
    result,
  };
}

export function mapRoutineRowToRoutine(row: RoutineRow): Routine {
  const car = Array.isArray(row.cars) ? row.cars[0] ?? null : row.cars ?? null;

  return {
    id: row.id,
    userId: row.user_id,
    carId: row.car_id,
    input: routineInputSchema.parse(row.input),
    result: routineResultSchema.parse(row.result),
    createdAt: row.created_at,
    car,
  };
}
