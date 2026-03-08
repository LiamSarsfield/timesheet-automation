import { describe, it, expect } from "vitest";
import {
  isValidMonday,
  calculateWeekDates,
  formatDdMmYy,
  parseDdMmYy,
  formatDateForFilename,
  getSundayFromMonday,
} from "@/lib/date-utils";

describe("isValidMonday", () => {
  it("returns true for a valid Monday", () => {
    // 2026-02-23 is a Monday
    expect(isValidMonday("2026-02-23")).toBe(true);
  });

  it("returns false for a non-Monday", () => {
    // 2026-02-24 is a Tuesday
    expect(isValidMonday("2026-02-24")).toBe(false);
  });

  it("returns false for a Sunday", () => {
    expect(isValidMonday("2026-03-01")).toBe(false);
  });

  it("returns false for an invalid date", () => {
    expect(isValidMonday("not-a-date")).toBe(false);
  });
});

describe("calculateWeekDates", () => {
  it("returns 7 dates Mon-Sun for a valid Monday", () => {
    const dates = calculateWeekDates("2026-02-23");
    expect(dates).toHaveLength(7);
    expect(dates[0].dayName).toBe("Monday");
    expect(dates[0].displayDate).toBe("23/02/26");
    expect(dates[6].dayName).toBe("Sunday");
    expect(dates[6].displayDate).toBe("01/03/26");
  });

  it("throws for a non-Monday", () => {
    expect(() => calculateWeekDates("2026-03-01")).toThrow(
      "Must provide a valid Monday date"
    );
  });

  it("throws for an invalid date", () => {
    expect(() => calculateWeekDates("invalid")).toThrow(
      "Must provide a valid Monday date"
    );
  });
});

describe("getSundayFromMonday", () => {
  it("returns the Sunday 6 days after Monday", () => {
    expect(getSundayFromMonday("2026-02-23")).toBe("2026-03-01");
  });

  it("handles month boundaries", () => {
    expect(getSundayFromMonday("2026-03-30")).toBe("2026-04-05");
  });
});

describe("formatDdMmYy", () => {
  it("formats a date correctly", () => {
    const date = new Date(Date.UTC(2026, 1, 23)); // Feb 23, 2026
    expect(formatDdMmYy(date)).toBe("23/02/26");
  });

  it("pads single digits", () => {
    const date = new Date(Date.UTC(2026, 0, 5)); // Jan 5, 2026
    expect(formatDdMmYy(date)).toBe("05/01/26");
  });
});

describe("parseDdMmYy", () => {
  it("parses a valid DD/MM/YY string", () => {
    const date = parseDdMmYy("23/02/26");
    expect(date).not.toBeNull();
    expect(date!.getUTCFullYear()).toBe(2026);
    expect(date!.getUTCMonth()).toBe(1);
    expect(date!.getUTCDate()).toBe(23);
  });

  it("returns null for invalid format", () => {
    expect(parseDdMmYy("2026-02-23")).toBeNull();
    expect(parseDdMmYy("")).toBeNull();
  });

  it("returns null for invalid date values", () => {
    expect(parseDdMmYy("32/13/26")).toBeNull();
  });
});

describe("formatDateForFilename", () => {
  it("formats date as YYYY-MM-DD", () => {
    expect(formatDateForFilename("2026-03-01")).toBe("2026-03-01");
  });
});
