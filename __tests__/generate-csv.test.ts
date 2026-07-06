import { describe, it, expect } from "vitest";
import { generateCsv } from "@/lib/generate-csv";
import { createEmptyDay, type TimesheetData } from "@/lib/types";
import { calculateWeekDates } from "@/lib/date-utils";

function makeTestData(): TimesheetData {
  const monday = "2026-02-23";
  const weekDates = calculateWeekDates(monday);

  const days = weekDates.map(({ dayName, date }) => createEmptyDay(dayName, date));

  // Make Monday a working day
  days[0].roster.status = "working";
  days[0].roster.timeFrom = "08:00";
  days[0].roster.timeTo = "16:00";
  days[0].roster.stationWorkedFrom = "Waterford";
  days[0].actual.status = "working";
  days[0].actual.timeFrom = "08:00";
  days[0].actual.timeTo = "17:00";
  days[0].actual.stationWorkedFrom = "Waterford";

  // Wednesday actual is annual leave
  days[2].actual.status = "annual-leave";

  // Thursday has overtime
  days[3].roster.status = "working";
  days[3].roster.timeFrom = "21:00";
  days[3].roster.timeTo = "07:00";
  days[3].roster.stationWorkedFrom = "Waterford";
  days[3].actual.status = "working";
  days[3].actual.timeFrom = "21:00";
  days[3].actual.timeTo = "08:00";
  days[3].actual.stationWorkedFrom = "Waterford";
  days[3].hasOvertime = true;
  days[3].overtimeFrom = "07:00";
  days[3].overtimeTo = "08:00";
  days[3].overtimeReason = "Overrun 5647764";

  // Friday is rest-day overtime (rostered off, called in)
  days[4].actual.status = "overtime";
  days[4].actual.timeFrom = "18:00";
  days[4].actual.timeTo = "23:00";
  days[4].actual.stationWorkedFrom = "Waterford";
  days[4].overtimeReason = "Called in 12345";

  // Saturday is annual leave with a rostered (overnight) shift
  days[5].roster.status = "working";
  days[5].roster.timeFrom = "20:00";
  days[5].roster.timeTo = "06:00";
  days[5].roster.stationWorkedFrom = "Waterford";
  days[5].actual.status = "annual-leave";

  // Sunday is sick leave with a rostered shift
  days[6].roster.status = "working";
  days[6].roster.timeFrom = "09:00";
  days[6].roster.timeTo = "21:00";
  days[6].roster.stationWorkedFrom = "Waterford";
  days[6].actual.status = "sick-leave";

  return {
    name: "Jane Doe",
    personnelNumber: "63221553",
    dateWeekStarting: monday,
    station: "Waterford",
    days,
  };
}

describe("generateCsv", () => {
  it("produces 33 rows", () => {
    const csv = generateCsv(makeTestData());
    const lines = csv.split("\r\n").filter((l) => l.length > 0);
    expect(lines).toHaveLength(33);
  });

  it("uses CRLF line endings", () => {
    const csv = generateCsv(makeTestData());
    expect(csv).toContain("\r\n");
    const withoutCrlf = csv.replace(/\r\n/g, "");
    expect(withoutCrlf).not.toContain("\n");
  });

  it("places name at correct position", () => {
    const csv = generateCsv(makeTestData());
    const lines = csv.split("\r\n");
    expect(lines[1]).toContain("Jane Doe");
    expect(lines[1]).toContain("Name:");
  });

  it("places personnel number at correct position", () => {
    const csv = generateCsv(makeTestData());
    const lines = csv.split("\r\n");
    expect(lines[1]).toContain("Personnel Number:");
    expect(lines[1]).toContain("63221553");
  });

  it("calculates and places week ending (Sunday) from week starting (Monday)", () => {
    const csv = generateCsv(makeTestData());
    const lines = csv.split("\r\n");
    expect(lines[3]).toContain("Date Week Ending:");
    // Monday 2026-02-23 → Sunday 2026-03-01 → "01/03/26"
    expect(lines[3]).toContain("01/03/26");
  });

  it("places status strings in both col 3 and col 4 for non-working days", () => {
    const csv = generateCsv(makeTestData());
    const lines = csv.split("\r\n");
    // Tuesday roster (row 9) should have Rest, Rest
    const tuesdayRosterCols = lines[9].split(",");
    expect(tuesdayRosterCols[3]).toBe("Rest");
    expect(tuesdayRosterCols[4]).toBe("Rest");
  });

  it("places Annual Leave status in actual row", () => {
    const csv = generateCsv(makeTestData());
    const lines = csv.split("\r\n");
    // Wednesday actual row = row 12
    const wedActualCols = lines[12].split(",");
    expect(wedActualCols[3]).toBe("Annual Leave");
    expect(wedActualCols[4]).toBe("Annual Leave");
  });

  it("places working day times correctly", () => {
    const csv = generateCsv(makeTestData());
    const lines = csv.split("\r\n");
    const monRosterCols = lines[7].split(",");
    expect(monRosterCols[3]).toBe("08:00");
    expect(monRosterCols[4]).toBe("16:00");
    expect(monRosterCols[5]).toBe("Waterford");
  });

  it("places overtime data correctly", () => {
    const csv = generateCsv(makeTestData());
    const lines = csv.split("\r\n");
    // Thursday roster row = row 13
    const thuRosterCols = lines[13].split(",");
    expect(thuRosterCols[10]).toBe("07:00");
    expect(thuRosterCols[11]).toBe("08:00");
    expect(thuRosterCols[12]).toBe("Overrun 5647764");
  });

  it("renders rest-day overtime hours in the actual row", () => {
    const csv = generateCsv(makeTestData());
    const lines = csv.split("\r\n");
    // Friday roster row = 15, actual row = 16
    const friRosterCols = lines[15].split(",");
    const friActualCols = lines[16].split(",");
    expect(friRosterCols[3]).toBe("Rest");
    expect(friRosterCols[4]).toBe("Rest");
    expect(friActualCols[3]).toBe("18:00");
    expect(friActualCols[4]).toBe("23:00");
    expect(friActualCols[5]).toBe("Waterford");
  });

  it("mirrors rest-day overtime hours into the overtime columns", () => {
    const csv = generateCsv(makeTestData());
    const lines = csv.split("\r\n");
    const friRosterCols = lines[15].split(",");
    expect(friRosterCols[10]).toBe("18:00");
    expect(friRosterCols[11]).toBe("23:00");
    expect(friRosterCols[12]).toBe("Called in 12345");
  });

  it("shows rostered hours on a leave day with the leave text in the actual row", () => {
    const csv = generateCsv(makeTestData());
    const lines = csv.split("\r\n");
    // Saturday roster row = 17, actual row = 18
    const satRosterCols = lines[17].split(",");
    const satActualCols = lines[18].split(",");
    expect(satRosterCols[3]).toBe("20:00");
    expect(satRosterCols[4]).toBe("06:00");
    expect(satActualCols[3]).toBe("Annual Leave");
    expect(satActualCols[4]).toBe("Annual Leave");
  });

  it("renders sick leave with rostered hours", () => {
    const csv = generateCsv(makeTestData());
    const lines = csv.split("\r\n");
    // Sunday roster row = 19, actual row = 20
    const sunRosterCols = lines[19].split(",");
    const sunActualCols = lines[20].split(",");
    expect(sunRosterCols[3]).toBe("09:00");
    expect(sunRosterCols[4]).toBe("21:00");
    expect(sunActualCols[3]).toBe("Sick Leave");
    expect(sunActualCols[4]).toBe("Sick Leave");
  });

  it("includes NAS address in final row", () => {
    const csv = generateCsv(makeTestData());
    const lines = csv.split("\r\n").filter((l) => l.length > 0);
    const lastLine = lines[lines.length - 1];
    expect(lastLine).toContain("National Ambulance Service");
  });
});
