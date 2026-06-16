export const ROUTINE_DAILY_LIMIT = 10;

export function getRoutineDailyRange(now = new Date()) {
  const start = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);

  return {
    start: start.toISOString(),
    end: end.toISOString(),
  };
}

export function hasReachedRoutineDailyLimit(count: number) {
  return count >= ROUTINE_DAILY_LIMIT;
}
