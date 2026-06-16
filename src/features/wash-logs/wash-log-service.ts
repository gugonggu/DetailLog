import type { WashLogFormValues } from "./schemas";
import { mapWashImageRowToWashImage } from "../wash-images/wash-image-service";
import type {
  WashLog,
  WashLogInsertPayload,
  WashLogRow,
  WashLogUpdatePayload,
  WashStepInsertPayload,
  WashStepRow,
} from "./types";

type WashLogInsertInput = {
  userId: string;
  values: WashLogFormValues;
};

type WashLogPayloadSet = {
  log: WashLogUpdatePayload;
  steps: Omit<WashStepInsertPayload, "wash_log_id">[];
};

type WashLogInsertPayloadSet = {
  log: WashLogInsertPayload;
  steps: Omit<WashStepInsertPayload, "wash_log_id">[];
};

type CarIdOption = {
  id: string;
};

type WashLogRpcInput = {
  userId: string;
  values: WashLogFormValues;
};

function nullableText(value: string) {
  const trimmed = value.trim();

  return trimmed ? trimmed : null;
}

function createStepPayloads(values: WashLogFormValues) {
  return values.steps.map((step, index) => ({
    step_type: step.stepType.trim(),
    product_name: nullableText(step.productName),
    memo: nullableText(step.memo),
    step_order: index + 1,
  }));
}

export function isOwnedCarId(carId: string, cars: CarIdOption[]) {
  return cars.some((car) => car.id === carId);
}

export function createWashLogInsertPayload({
  userId,
  values,
}: WashLogInsertInput): WashLogInsertPayloadSet {
  return {
    log: {
      user_id: userId,
      ...createWashLogUpdatePayload(values).log,
    },
    steps: createStepPayloads(values),
  };
}

export function createWashLogUpdatePayload(values: WashLogFormValues): WashLogPayloadSet {
  return {
    log: {
      car_id: values.carId,
      title: values.title.trim(),
      wash_date: values.washDate,
      location: nullableText(values.location),
      duration_minutes: values.durationMinutes,
      cost: values.cost,
      weather: nullableText(values.weather),
      dirt_level: values.dirtLevel,
      satisfaction: values.satisfaction,
      memo: nullableText(values.memo),
      visibility: values.visibility,
    },
    steps: createStepPayloads(values),
  };
}

export function createWashLogRpcPayload({ userId, values }: WashLogRpcInput) {
  const payload = createWashLogInsertPayload({ userId, values });

  return {
    p_user_id: userId,
    p_car_id: payload.log.car_id,
    p_title: payload.log.title,
    p_wash_date: payload.log.wash_date,
    p_location: payload.log.location,
    p_duration_minutes: payload.log.duration_minutes,
    p_cost: payload.log.cost,
    p_weather: payload.log.weather,
    p_dirt_level: payload.log.dirt_level,
    p_satisfaction: payload.log.satisfaction,
    p_memo: payload.log.memo,
    p_visibility: payload.log.visibility,
    p_steps: payload.steps,
  };
}

function mapWashStepRowToWashStep(row: WashStepRow) {
  return {
    id: row.id,
    washLogId: row.wash_log_id,
    stepType: row.step_type,
    productName: row.product_name,
    memo: row.memo,
    stepOrder: row.step_order,
    createdAt: row.created_at,
  };
}

export function mapWashLogRowToWashLog(row: WashLogRow): WashLog {
  const car = Array.isArray(row.cars) ? row.cars[0] ?? null : row.cars ?? null;

  return {
    id: row.id,
    userId: row.user_id,
    carId: row.car_id,
    title: row.title,
    washDate: row.wash_date,
    location: row.location,
    durationMinutes: row.duration_minutes,
    cost: row.cost,
    weather: row.weather,
    dirtLevel: row.dirt_level,
    satisfaction: row.satisfaction,
    memo: row.memo,
    visibility: row.visibility,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    car,
    steps: [...(row.wash_steps ?? [])]
      .sort((a, b) => a.step_order - b.step_order)
      .map(mapWashStepRowToWashStep),
    images: [...(row.wash_images ?? [])].map(mapWashImageRowToWashImage),
  };
}
