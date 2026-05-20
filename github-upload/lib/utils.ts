import type { WeekRange } from "@/lib/types";

const BUSINESS_TIME_ZONE = "America/Los_Angeles";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

const integerFormatter = new Intl.NumberFormat("en-US");

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: BUSINESS_TIME_ZONE,
});

const dateTimeFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZone: BUSINESS_TIME_ZONE,
});

function getDatePartsInBusinessZone(input: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: BUSINESS_TIME_ZONE,
  }).formatToParts(input);

  return {
    year: Number(parts.find((part) => part.type === "year")?.value),
    month: Number(parts.find((part) => part.type === "month")?.value),
    day: Number(parts.find((part) => part.type === "day")?.value),
  };
}

function utcDateFromString(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day, 12));
}

function toUtcMidnight(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export function toIsoDate(date: Date): string {
  return toUtcMidnight(date).toISOString().slice(0, 10);
}

export function startOfWeek(input: Date): Date {
  const date = toUtcMidnight(input);
  const dayIndex = (date.getUTCDay() + 6) % 7;
  date.setUTCDate(date.getUTCDate() - dayIndex);
  return date;
}

export function endOfWeek(input: Date): Date {
  const date = startOfWeek(input);
  date.setUTCDate(date.getUTCDate() + 6);
  return date;
}

export function getWeekRange(value?: string): WeekRange {
  const anchor = value ? utcDateFromString(value) : utcDateFromString(getBusinessDateString(new Date()));
  const start = startOfWeek(anchor);
  const end = endOfWeek(anchor);

  return {
    start: toIsoDate(start),
    end: toIsoDate(end),
    label: `${dateFormatter.format(start)} - ${dateFormatter.format(end)}`,
  };
}

export function enumerateWeekRanges(weeks: number, anchor = new Date()): WeekRange[] {
  const currentStart = startOfWeek(anchor);
  const ranges: WeekRange[] = [];

  for (let index = 0; index < weeks; index += 1) {
    const weekStart = new Date(currentStart);
    weekStart.setUTCDate(currentStart.getUTCDate() - index * 7);
    ranges.push(getWeekRange(toIsoDate(weekStart)));
  }

  return ranges;
}

export function formatCurrency(value: number | null | undefined): string {
  return currencyFormatter.format(Number(value ?? 0));
}

export function formatNumber(value: number | null | undefined): string {
  return integerFormatter.format(Number(value ?? 0));
}

export function formatDate(value: string | null | undefined): string {
  if (!value) {
    return "—";
  }

  return dateFormatter.format(parseDateValue(value));
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) {
    return "—";
  }

  return dateTimeFormatter.format(parseDateValue(value));
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}m ${remainder}s`;
}

export function buildYoutubeChannelUrl(channelId: string): string {
  return `https://www.youtube.com/channel/${channelId}`;
}

export function buildYoutubeVideoUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${videoId}`;
}

export function csvEscape(value: string | number | null | undefined): string {
  const normalized = `${value ?? ""}`.replaceAll('"', '""');
  return `"${normalized}"`;
}

export function toMoneyNumber(value: string): number {
  return Number(Number(value || "0").toFixed(2));
}

export function maskSecret(value: string | undefined): string {
  if (!value) {
    return "Missing";
  }

  if (value.length <= 8) {
    return "Present";
  }

  return `${value.slice(0, 4)}...${value.slice(-4)}`;
}

function parseDateValue(value: string): Date {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return utcDateFromString(value);
  }

  return new Date(value);
}

export function getBusinessDateString(input: Date | string): string {
  const date = typeof input === "string" ? new Date(input) : input;
  const { year, month, day } = getDatePartsInBusinessZone(date);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}
