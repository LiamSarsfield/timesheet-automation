import { DAY_NAMES, type DayName } from "./types";

export function isValidMonday(dateStr: string): boolean {
  const date = new Date(dateStr);
  return !isNaN(date.getTime()) && date.getUTCDay() === 1;
}

export function calculateWeekDates(
  mondayStr: string
): { dayName: DayName; date: string; displayDate: string }[] {
  const monday = new Date(mondayStr);
  if (isNaN(monday.getTime()) || monday.getUTCDay() !== 1) {
    throw new Error("Must provide a valid Monday date");
  }

  return DAY_NAMES.map((dayName, index) => {
    const d = new Date(monday);
    d.setUTCDate(monday.getUTCDate() + index);
    return {
      dayName,
      date: formatIsoDate(d),
      displayDate: formatDdMmYy(d),
    };
  });
}

export function getSundayFromMonday(mondayStr: string): string {
  const monday = new Date(mondayStr);
  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);
  return formatIsoDate(sunday);
}

export function formatDdMmYy(date: Date): string {
  const dd = String(date.getUTCDate()).padStart(2, "0");
  const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
  const yy = String(date.getUTCFullYear()).slice(-2);
  return `${dd}/${mm}/${yy}`;
}

export function formatIsoDate(date: Date): string {
  const yyyy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(date.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function parseDdMmYy(dateStr: string): Date | null {
  const parts = dateStr.split("/");
  if (parts.length !== 3) return null;
  const [dd, mm, yy] = parts;
  const year = parseInt(yy, 10) + 2000;
  const month = parseInt(mm, 10) - 1;
  const day = parseInt(dd, 10);
  const date = new Date(Date.UTC(year, month, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month ||
    date.getUTCDate() !== day
  ) {
    return null;
  }
  return date;
}

export function formatDateForFilename(dateStr: string): string {
  const date = new Date(dateStr);
  const dd = String(date.getUTCDate()).padStart(2, "0");
  const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
  const yyyy = date.getUTCFullYear();
  return `${yyyy}-${mm}-${dd}`;
}

export function formatWeekEndingDisplay(sundayStr: string): string {
  const date = new Date(sundayStr);
  return formatDdMmYy(date);
}

export function snapToMonday(dateStr: string): string | null {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return null;
  const day = date.getUTCDay(); // 0=Sun, 1=Mon, ...
  const diff = day === 0 ? -6 : 1 - day;
  date.setUTCDate(date.getUTCDate() + diff);
  return formatIsoDate(date);
}
