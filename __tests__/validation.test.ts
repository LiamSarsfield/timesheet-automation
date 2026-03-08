import { describe, it, expect } from "vitest";
import { validateTimesheetData } from "@/lib/validation";
import { createEmptyDay, type TimesheetData } from "@/lib/types";
import { DAY_NAMES } from "@/lib/types";
import { calculateWeekDates } from "@/lib/date-utils";

function makeValidData(): TimesheetData {
  const monday = "2026-02-23";
  const weekDates = calculateWeekDates(monday);

  return {
    name: "Jane Doe",
    personnelNumber: "63221553",
    dateWeekStarting: monday,
    station: "Waterford",
    email: "jane@example.com",
    days: weekDates.map(({ dayName, date }) => createEmptyDay(dayName, date)),
  };
}

describe("validateTimesheetData", () => {
  it("passes for valid data", () => {
    const result = validateTimesheetData(makeValidData());
    expect(result.success).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("fails when name is missing", () => {
    const data = makeValidData();
    data.name = "";
    const result = validateTimesheetData(data);
    expect(result.success).toBe(false);
    expect(result.errors.some((e) => e.field === "Name")).toBe(true);
  });

  it("fails when email is invalid", () => {
    const data = makeValidData();
    data.email = "not-an-email";
    const result = validateTimesheetData(data);
    expect(result.success).toBe(false);
    expect(result.errors.some((e) => e.field === "Email")).toBe(true);
  });

  it("fails when week starting is not a Monday", () => {
    const data = makeValidData();
    data.dateWeekStarting = "2026-03-01"; // Sunday
    const result = validateTimesheetData(data);
    expect(result.success).toBe(false);
    expect(result.errors.some((e) => e.field === "Week Starting")).toBe(true);
  });

  it("fails when working day has no time", () => {
    const data = makeValidData();
    data.days[0].roster.status = "working";
    data.days[0].roster.timeFrom = "";
    data.days[0].roster.timeTo = "";
    const result = validateTimesheetData(data);
    expect(result.success).toBe(false);
    expect(
      result.errors.some((e) => e.message.includes("Start time is required"))
    ).toBe(true);
  });

  it("fails when overtime is enabled but fields are empty", () => {
    const data = makeValidData();
    data.days[0].roster.status = "working";
    data.days[0].roster.timeFrom = "08:00";
    data.days[0].roster.timeTo = "16:00";
    data.days[0].actual.status = "working";
    data.days[0].actual.timeFrom = "08:00";
    data.days[0].actual.timeTo = "16:00";
    data.days[0].hasOvertime = true;
    data.days[0].overtimeFrom = "";
    data.days[0].overtimeTo = "";
    data.days[0].overtimeReason = "";
    const result = validateTimesheetData(data);
    expect(result.success).toBe(false);
    expect(
      result.errors.some((e) => e.message.includes("Overtime start time"))
    ).toBe(true);
    expect(
      result.errors.some((e) => e.message.includes("Reason / Incident No."))
    ).toBe(true);
  });

  it("collects multiple errors", () => {
    const data = makeValidData();
    data.name = "";
    data.email = "bad";
    data.personnelNumber = "";
    const result = validateTimesheetData(data);
    expect(result.success).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(3);
  });

  it("produces human-readable field names", () => {
    const data = makeValidData();
    data.days[0].hasOvertime = true;
    data.days[0].overtimeReason = "";
    const result = validateTimesheetData(data);
    expect(result.success).toBe(false);
    // Should say "Monday" not "days.0"
    const reasonError = result.errors.find((e) =>
      e.message.includes("Reason / Incident No.")
    );
    expect(reasonError?.field).toContain("Monday");
  });
});
