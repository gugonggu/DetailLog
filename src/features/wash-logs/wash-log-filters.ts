import type { WashLogVisibility } from "./types";

export type SearchParamValue = string | string[] | undefined;
export type SearchParams = Record<string, SearchParamValue>;

export type WashLogFilters = {
  keyword: string;
  car: string;
  visibility: WashLogVisibility | "";
  dirtLevel: number | null;
  satisfaction: number | null;
  from: string;
  to: string;
  hasActiveFilters: boolean;
};

function firstValue(value: SearchParamValue) {
  return (Array.isArray(value) ? value[0] : value)?.trim() ?? "";
}

function parseRating(value: SearchParamValue) {
  const rating = Number(firstValue(value));

  return Number.isInteger(rating) && rating >= 1 && rating <= 5 ? rating : null;
}

function parseDate(value: SearchParamValue) {
  const date = firstValue(value);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return "";
  }

  const [year, month, day] = date.split("-").map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));

  return parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day
    ? date
    : "";
}

export function createWashLogKeywordFilter(keyword: string) {
  const safeKeyword = keyword
    .replace(/[%_(),]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!safeKeyword) {
    return "";
  }

  return [
    `title.ilike.%${safeKeyword}%`,
    `location.ilike.%${safeKeyword}%`,
    `memo.ilike.%${safeKeyword}%`,
  ].join(",");
}

export function parseWashLogFilters(searchParams: SearchParams): WashLogFilters {
  const keyword = firstValue(searchParams.keyword);
  const car = firstValue(searchParams.car);
  const visibilityValue = firstValue(searchParams.visibility);
  const visibility =
    visibilityValue === "private" || visibilityValue === "public"
      ? visibilityValue
      : "";
  const dirtLevel = parseRating(searchParams.dirtLevel);
  const satisfaction = parseRating(searchParams.satisfaction);
  const from = parseDate(searchParams.from);
  const to = parseDate(searchParams.to);

  return {
    keyword,
    car,
    visibility,
    dirtLevel,
    satisfaction,
    from,
    to,
    hasActiveFilters: Boolean(
      keyword || car || visibility || dirtLevel || satisfaction || from || to,
    ),
  };
}
