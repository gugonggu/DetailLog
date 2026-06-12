import { Filter, Search } from "lucide-react";
import Link from "next/link";

import type { CommunityFilters } from "./community-filters";

type CommunityFilterFormProps = {
  filters: CommunityFilters;
};

const fieldClassName =
  "field-control";

export function CommunityFilterForm({ filters }: CommunityFilterFormProps) {
  return (
    <form
      action="/community"
      className="surface-card mt-8 p-4 sm:p-6"
      method="get"
    >
      <div className="flex items-center gap-2 text-sm font-semibold">
        <Filter className="h-4 w-4 text-primary" aria-hidden="true" />
        커뮤니티 필터
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
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
          정렬
          <select className={fieldClassName} defaultValue={filters.order} name="order">
            <option value="latest">최신순</option>
          </select>
        </label>
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">
        <Link
          className="secondary-action"
          href="/community"
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
