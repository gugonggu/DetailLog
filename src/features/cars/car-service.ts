import type {
  Car,
  CarInsertPayload,
  CarRow,
  CarUpdatePayload,
} from "./types";
import type { CarFormValues } from "./schemas";

type CarInsertInput = {
  userId: string;
  values: CarFormValues;
};

function nullableMemo(memo: string) {
  const trimmed = memo.trim();

  return trimmed ? trimmed : null;
}

export function createCarInsertPayload({
  userId,
  values,
}: CarInsertInput): CarInsertPayload {
  return {
    user_id: userId,
    ...createCarUpdatePayload(values),
  };
}

export function createCarUpdatePayload(values: CarFormValues): CarUpdatePayload {
  return {
    name: values.name.trim(),
    brand: values.brand.trim(),
    model: values.model.trim(),
    year: values.year,
    color: values.color.trim(),
    coating_type: values.coatingType.trim(),
    memo: nullableMemo(values.memo),
  };
}

export function mapCarRowToCar(row: CarRow): Car {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    brand: row.brand,
    model: row.model,
    year: row.year,
    color: row.color,
    coatingType: row.coating_type,
    memo: row.memo,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
