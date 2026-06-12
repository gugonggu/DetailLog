import type { SearchParams } from "../wash-logs/wash-log-filters";

export type CommunityFilters = {
  keyword: string;
  dirtLevel: number | null;
  satisfaction: number | null;
  order: "latest";
  hasActiveFilters: boolean;
};

function firstValue(value: SearchParams[string]) {
  return (Array.isArray(value) ? value[0] : value)?.trim() ?? "";
}

function parseRating(value: SearchParams[string]) {
  const rating = Number(firstValue(value));

  return Number.isInteger(rating) && rating >= 1 && rating <= 5 ? rating : null;
}

export function parseCommunityFilters(searchParams: SearchParams): CommunityFilters {
  const keyword = firstValue(searchParams.keyword);
  const dirtLevel = parseRating(searchParams.dirtLevel);
  const satisfaction = parseRating(searchParams.satisfaction);

  return {
    keyword,
    dirtLevel,
    satisfaction,
    order: "latest",
    hasActiveFilters: Boolean(keyword || dirtLevel || satisfaction),
  };
}
