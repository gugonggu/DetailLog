import { Filter, Search } from "lucide-react";
import Link from "next/link";

import type { WashLogCar } from "./types";
import type { WashLogFilters } from "./wash-log-filters";

type WashLogFilterFormProps = {
  cars: WashLogCar[];
  filters: WashLogFilters;
};

const fieldClassName =
  "field-control";

export function WashLogFilterForm({ cars, filters }: WashLogFilterFormProps) {
  return (
    <form
      action="/wash"
      className="surface-card mt-8 p-4 sm:p-6"
      method="get"
    >
      <div className="flex items-center gap-2 text-sm font-semibold">
        <Filter className="h-4 w-4 text-primary" aria-hidden="true" />
        기록 검색 및 필터
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <label className="text-sm font-medium sm:col-span-2">
          키워드
          <input
            className={fieldClassName}
            defaultValue={filters.keyword}
            name="keyword"
            placeholder="제목, 장소, 메모 검색"
            type="search"
          />
        </label>

        <label className="text-sm font-medium">
          차량
          <select className={fieldClassName} defaultValue={filters.car} name="car">
            <option value="">전체 차량</option>
            {cars.map((car) => (
              <option key={car.id} value={car.id}>
                {car.name} · {car.brand} {car.model}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm font-medium">
          공개 범위
          <select
            className={fieldClassName}
            defaultValue={filters.visibility}
            name="visibility"
          >
            <option value="">전체</option>
            <option value="private">비공개</option>
            <option value="public">공개</option>
          </select>
        </label>

        <label className="text-sm font-medium">
          오염도
          <select
            className={fieldClassName}
            defaultValue={filters.dirtLevel ?? ""}
            name="dirtLevel"
          >
            <option value="">전체</option>
            {[1, 2, 3, 4, 5].map((rating) => (
              <option key={rating} value={rating}>
                {rating}/5
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm font-medium">
          만족도
          <select
            className={fieldClassName}
            defaultValue={filters.satisfaction ?? ""}
            name="satisfaction"
          >
            <option value="">전체</option>
            {[1, 2, 3, 4, 5].map((rating) => (
              <option key={rating} value={rating}>
                {rating}/5
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm font-medium">
          시작일
          <input
            className={fieldClassName}
            defaultValue={filters.from}
            name="from"
            type="date"
          />
        </label>

        <label className="text-sm font-medium">
          종료일
          <input
            className={fieldClassName}
            defaultValue={filters.to}
            name="to"
            type="date"
          />
        </label>
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">
        <Link
          className="secondary-action"
          href="/wash"
        >
          초기화
        </Link>
        <button
          className="primary-action"
          type="submit"
        >
          <Search className="h-4 w-4" aria-hidden="true" />
          검색
        </button>
      </div>
    </form>
  );
}
