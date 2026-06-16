type MonthlyWashLogCost = {
  cost: number | null;
};

function getDatePart(parts: Intl.DateTimeFormatPart[], type: Intl.DateTimeFormatPartTypes) {
  return parts.find((part) => part.type === type)?.value ?? "";
}

export function getDashboardMonthRange(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "Asia/Seoul",
    year: "numeric",
  }).formatToParts(now);

  const year = Number(getDatePart(parts, "year"));
  const month = Number(getDatePart(parts, "month"));
  const start = `${year}-${String(month).padStart(2, "0")}-01`;
  const nextMonthDate = new Date(Date.UTC(year, month, 1));
  const end = `${nextMonthDate.getUTCFullYear()}-${String(
    nextMonthDate.getUTCMonth() + 1,
  ).padStart(2, "0")}-01`;

  return { start, end };
}

export function summarizeMonthlyWashLogs(washLogs: MonthlyWashLogCost[]) {
  const totalCost = washLogs.reduce((sum, washLog) => sum + (washLog.cost ?? 0), 0);
  const count = washLogs.length;

  return {
    count,
    totalCost,
    averageCost: count > 0 ? Math.round(totalCost / count) : 0,
  };
}
