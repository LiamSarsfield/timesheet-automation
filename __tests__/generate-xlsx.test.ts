import { describe, it, expect } from "vitest";
import { generateXlsx } from "@/lib/generate-xlsx";
import { createEmptyDay, type TimesheetData } from "@/lib/types";
import { calculateWeekDates } from "@/lib/date-utils";
import ExcelJS from "exceljs";

function makeTestData(): TimesheetData {
  const monday = "2026-02-23";
  const weekDates = calculateWeekDates(monday);

  const days = weekDates.map(({ dayName, date }) => createEmptyDay(dayName, date));

  days[0].roster.status = "working";
  days[0].roster.timeFrom = "08:00";
  days[0].roster.timeTo = "16:00";
  days[0].roster.stationWorkedFrom = "Waterford";
  days[0].actual.status = "working";
  days[0].actual.timeFrom = "08:00";
  days[0].actual.timeTo = "17:00";
  days[0].actual.stationWorkedFrom = "Waterford";

  // Thursday with overtime
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

describe("generateXlsx", () => {
  it("produces a valid XLSX buffer", async () => {
    const buffer = await generateXlsx(makeTestData());
    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(0);
  });

  it("has exactly 1 worksheet named Timesheet", async () => {
    const buffer = await generateXlsx(makeTestData());
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);
    expect(workbook.worksheets).toHaveLength(1);
    expect(workbook.worksheets[0].name).toBe("Timesheet");
  });

  it("places name and personnel number correctly", async () => {
    const buffer = await generateXlsx(makeTestData());
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);
    const ws = workbook.worksheets[0];

    expect(ws.getRow(2).getCell(6).value).toBe("Jane Doe");
    expect(ws.getRow(2).getCell(14).value).toBe("63221553");
  });

  it("computes week ending from week starting", async () => {
    const buffer = await generateXlsx(makeTestData());
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);
    const ws = workbook.worksheets[0];

    // Week ending should be Sunday 01/03/26
    expect(ws.getRow(4).getCell(7).value).toBe("01/03/26");
  });

  it("places working day times in separate roster/actual rows", async () => {
    const buffer = await generateXlsx(makeTestData());
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);
    const ws = workbook.worksheets[0];

    // Monday roster row 8, actual row 9
    expect(ws.getRow(8).getCell(4).value).toBe("08:00");
    expect(ws.getRow(8).getCell(5).value).toBe("16:00");
    expect(ws.getRow(9).getCell(4).value).toBe("08:00");
    expect(ws.getRow(9).getCell(5).value).toBe("17:00");
  });

  it("places Rest status for non-working days", async () => {
    const buffer = await generateXlsx(makeTestData());
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);
    const ws = workbook.worksheets[0];

    // Tuesday roster row 10
    expect(ws.getRow(10).getCell(4).value).toBe("Rest");
    expect(ws.getRow(10).getCell(5).value).toBe("Rest");
  });

  it("places overtime data in merged cells", async () => {
    const buffer = await generateXlsx(makeTestData());
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);
    const ws = workbook.worksheets[0];

    // Thursday roster row = 14
    expect(ws.getRow(14).getCell(11).value).toBe("07:00");
    expect(ws.getRow(14).getCell(12).value).toBe("08:00");
    expect(ws.getRow(14).getCell(13).value).toBe("Overrun 5647764");
  });

  it("renders rest-day overtime hours in the actual row and overtime columns", async () => {
    const buffer = await generateXlsx(makeTestData());
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);
    const ws = workbook.worksheets[0];

    // Friday roster row 16, actual row 17
    expect(ws.getRow(16).getCell(4).value).toBe("Rest");
    expect(ws.getRow(17).getCell(4).value).toBe("18:00");
    expect(ws.getRow(17).getCell(5).value).toBe("23:00");
    // OT columns mirror the worked hours (top/master row of the merged pair)
    expect(ws.getRow(16).getCell(11).value).toBe("18:00");
    expect(ws.getRow(16).getCell(12).value).toBe("23:00");
    expect(ws.getRow(16).getCell(13).value).toBe("Called in 12345");
    // Station renders for the overtime day
    expect(ws.getRow(16).getCell(6).value).toBe("Waterford");
  });

  it("shows rostered hours on a leave day with leave text in the actual row", async () => {
    const buffer = await generateXlsx(makeTestData());
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);
    const ws = workbook.worksheets[0];

    // Saturday roster row 18, actual row 19
    expect(ws.getRow(18).getCell(4).value).toBe("20:00");
    expect(ws.getRow(18).getCell(5).value).toBe("06:00");
    expect(ws.getRow(19).getCell(4).value).toBe("Annual Leave");
    expect(ws.getRow(19).getCell(5).value).toBe("Annual Leave");
  });

  it("renders sick leave with rostered hours", async () => {
    const buffer = await generateXlsx(makeTestData());
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);
    const ws = workbook.worksheets[0];

    // Sunday roster row 20, actual row 21
    expect(ws.getRow(20).getCell(4).value).toBe("09:00");
    expect(ws.getRow(21).getCell(4).value).toBe("Sick Leave");
    expect(ws.getRow(21).getCell(5).value).toBe("Sick Leave");
  });

  it("has green fill on header label cells", async () => {
    const buffer = await generateXlsx(makeTestData());
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);
    const ws = workbook.worksheets[0];

    // Name label at D2 should have green fill
    const nameLabel = ws.getRow(2).getCell(4);
    const fill = nameLabel.fill as ExcelJS.FillPattern;
    expect(fill.fgColor?.argb).toBe("FF339966");
  });

  it("has yellow fill on notes section", async () => {
    const buffer = await generateXlsx(makeTestData());
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);
    const ws = workbook.worksheets[0];

    const notesCell = ws.getRow(26).getCell(1);
    const fill = notesCell.fill as ExcelJS.FillPattern;
    expect(fill.fgColor?.argb).toBe("FFFFFF99");
  });

  it("has landscape page setup", async () => {
    const buffer = await generateXlsx(makeTestData());
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);
    const ws = workbook.worksheets[0];

    expect(ws.pageSetup.orientation).toBe("landscape");
    expect(ws.pageSetup.paperSize).toBe(9);
  });
});
