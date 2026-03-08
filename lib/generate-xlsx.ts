import fs from "fs";
import path from "path";
import ExcelJS from "exceljs";
import type { TimesheetData, TimesheetRow } from "./types";
import { STATUS_DISPLAY } from "./types";
import {
  calculateWeekDates,
  getSundayFromMonday,
  formatWeekEndingDisplay,
} from "./date-utils";
import {
  getDayRowIndex,
  NOTES,
  NAS_ADDRESS,
} from "./template-layout";

// --- Color constants matching the example XLSX ---
const GREEN = { argb: "FF339966" };
const RED = { argb: "FFFF0000" };
const LIGHT_GREEN = { argb: "FF7DB95F" };
const BLUE = { argb: "FF3399FF" };
const YELLOW = { argb: "FFFFFF99" };
const BLACK = { argb: "FF000000" };

// --- Font presets ---
const FONT_LABEL: Partial<ExcelJS.Font> = {
  name: "Arial",
  size: 12,
  bold: true,
  color: BLACK,
};
const FONT_VALUE: Partial<ExcelJS.Font> = {
  name: "Calibri",
  size: 12,
  color: BLACK,
};
const FONT_HEADER: Partial<ExcelJS.Font> = {
  name: "Calibri",
  size: 12,
  bold: true,
};
const FONT_DAY_NAME: Partial<ExcelJS.Font> = {
  name: "Calibri",
  size: 12,
  bold: true,
  italic: true,
};
const FONT_NOTES: Partial<ExcelJS.Font> = {
  name: "Arial",
  size: 12,
  bold: true,
  italic: true,
};
const FONT_ADDRESS: Partial<ExcelJS.Font> = {
  name: "Arial",
  size: 12,
  bold: true,
  underline: true,
};

// --- Border presets ---
const MEDIUM: Partial<ExcelJS.Border> = { style: "medium", color: BLACK };
const THIN: Partial<ExcelJS.Border> = { style: "thin", color: BLACK };

// --- Alignment presets ---
const CENTER_MIDDLE: Partial<ExcelJS.Alignment> = {
  horizontal: "center",
  vertical: "middle",
  wrapText: true,
};
const LEFT_MIDDLE: Partial<ExcelJS.Alignment> = {
  horizontal: "left",
  vertical: "middle",
  wrapText: true,
};

// --- Helpers ---
function cell(ws: ExcelJS.Worksheet, row: number, col: number): ExcelJS.Cell {
  return ws.getRow(row).getCell(col);
}

function setCell(
  ws: ExcelJS.Worksheet,
  row: number,
  col: number,
  value: string | number | Date,
  opts?: {
    font?: Partial<ExcelJS.Font>;
    fill?: Partial<ExcelJS.Fill>;
    alignment?: Partial<ExcelJS.Alignment>;
    border?: Partial<ExcelJS.Borders>;
  }
): void {
  const c = cell(ws, row, col);
  c.value = value;
  if (opts?.font) c.font = opts.font;
  if (opts?.fill) c.fill = opts.fill as ExcelJS.Fill;
  if (opts?.alignment) c.alignment = opts.alignment;
  if (opts?.border) c.border = opts.border;
}

function fillRange(
  ws: ExcelJS.Worksheet,
  r1: number,
  c1: number,
  r2: number,
  c2: number,
  fill: ExcelJS.Fill
): void {
  for (let r = r1; r <= r2; r++) {
    for (let c = c1; c <= c2; c++) {
      cell(ws, r, c).fill = fill;
    }
  }
}

function setBorderRange(
  ws: ExcelJS.Worksheet,
  r1: number,
  c1: number,
  r2: number,
  c2: number,
  border: Partial<ExcelJS.Borders>
): void {
  for (let r = r1; r <= r2; r++) {
    for (let c = c1; c <= c2; c++) {
      const existing = cell(ws, r, c).border || {};
      cell(ws, r, c).border = { ...existing, ...border };
    }
  }
}

function setAlignmentRange(
  ws: ExcelJS.Worksheet,
  r1: number,
  c1: number,
  r2: number,
  c2: number,
  alignment: Partial<ExcelJS.Alignment>
): void {
  for (let r = r1; r <= r2; r++) {
    for (let c = c1; c <= c2; c++) {
      cell(ws, r, c).alignment = alignment;
    }
  }
}

export async function generateXlsx(data: TimesheetData): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const ws = workbook.addWorksheet("Timesheet");

  const sundayStr = getSundayFromMonday(data.dateWeekStarting);
  const weekDates = calculateWeekDates(data.dateWeekStarting);

  // --- Column widths ---
  const colWidths = [13, 11.5, 8.57, 10, 10, 17, 8.57, 8.57, 8.43, 15.57, 8.57, 8.57, 15.71, 8.57, 8.57, 14.29];
  colWidths.forEach((w, i) => {
    ws.getColumn(i + 1).width = w;
  });

  // --- Row heights ---
  ws.getRow(1).height = 15.75;
  ws.getRow(2).height = 21;
  ws.getRow(3).height = 15.75;
  ws.getRow(4).height = 21;
  ws.getRow(5).height = 15.75;
  ws.getRow(6).height = 17.25;
  ws.getRow(7).height = 15.75;
  for (let r = 8; r <= 21; r++) ws.getRow(r).height = 26.25;
  ws.getRow(22).height = 15.75;
  ws.getRow(23).height = 21;
  ws.getRow(24).height = 15.75;
  ws.getRow(25).height = 15.75;
  ws.getRow(26).height = 14.25;
  for (let r = 27; r <= 33; r++) ws.getRow(r).height = 15.75;
  ws.getRow(34).height = 7.5;

  // --- Page setup ---
  ws.pageSetup = {
    paperSize: 9, // A4
    orientation: "landscape",
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 1,
    margins: {
      left: 0.236,
      right: 0.236,
      top: 0.748,
      bottom: 0.748,
      header: 0,
      footer: 0,
    },
  };

  // ============================================================
  // LOGOS (top row)
  // ============================================================

  const hsePath = path.join(process.cwd(), "public", "hse-logo.png");
  if (fs.existsSync(hsePath)) {
    const hseId = workbook.addImage({
      buffer: fs.readFileSync(hsePath),
      extension: "png",
    });
    ws.addImage(hseId, {
      tl: { col: 0.2, row: 0.5 },
      ext: { width: 100, height: 80 },
    });
  }


  // ============================================================
  // METADATA SECTION (rows 2, 4)
  // ============================================================

  // Name label + value
  ws.mergeCells("D2:E2");
  setCell(ws, 2, 4, "Name:", { font: FONT_LABEL, alignment: CENTER_MIDDLE });
  ws.mergeCells("F2:I2");
  setCell(ws, 2, 6, data.name, { font: FONT_VALUE, alignment: CENTER_MIDDLE });

  // Personnel Number label + value
  ws.mergeCells("K2:M2");
  setCell(ws, 2, 11, "Personnel Number:", { font: FONT_LABEL, alignment: CENTER_MIDDLE });
  ws.mergeCells("N2:P2");
  setCell(ws, 2, 14, data.personnelNumber, { font: FONT_VALUE, alignment: CENTER_MIDDLE });

  // Borders for metadata row 2
  const metaBoxBorder = { top: MEDIUM, bottom: MEDIUM, left: MEDIUM, right: MEDIUM };
  setBorderRange(ws, 2, 4, 2, 5, { top: MEDIUM, bottom: MEDIUM });
  cell(ws, 2, 4).border = { ...cell(ws, 2, 4).border, left: MEDIUM, top: MEDIUM, bottom: MEDIUM };
  cell(ws, 2, 5).border = { ...cell(ws, 2, 5).border, right: MEDIUM, top: MEDIUM, bottom: MEDIUM };
  setBorderRange(ws, 2, 6, 2, 9, { top: MEDIUM, bottom: MEDIUM });
  cell(ws, 2, 6).border = { ...cell(ws, 2, 6).border, left: MEDIUM };
  cell(ws, 2, 9).border = { ...cell(ws, 2, 9).border, right: MEDIUM };
  setBorderRange(ws, 2, 11, 2, 13, { top: MEDIUM, bottom: MEDIUM });
  cell(ws, 2, 11).border = { ...cell(ws, 2, 11).border, left: MEDIUM };
  cell(ws, 2, 13).border = { ...cell(ws, 2, 13).border, right: MEDIUM };
  setBorderRange(ws, 2, 14, 2, 16, { top: MEDIUM, bottom: MEDIUM });
  cell(ws, 2, 14).border = { ...cell(ws, 2, 14).border, left: MEDIUM };
  cell(ws, 2, 16).border = { ...cell(ws, 2, 16).border, right: MEDIUM };

  // Green fill for label cells
  const greenFill: ExcelJS.Fill = { type: "pattern", pattern: "solid", fgColor: GREEN };
  fillRange(ws, 2, 4, 2, 5, greenFill);
  fillRange(ws, 2, 11, 2, 13, greenFill);

  // Date Week Ending label + value
  ws.mergeCells("D4:F4");
  setCell(ws, 4, 4, "Date Week Ending:", { font: FONT_LABEL, alignment: CENTER_MIDDLE });
  ws.mergeCells("G4:I4");
  setCell(ws, 4, 7, formatWeekEndingDisplay(sundayStr), { font: FONT_VALUE, alignment: CENTER_MIDDLE });

  // Station label + value
  ws.mergeCells("K4:L4");
  setCell(ws, 4, 11, "Station:", { font: FONT_LABEL, alignment: CENTER_MIDDLE });
  ws.mergeCells("M4:P4");
  setCell(ws, 4, 13, data.station, { font: FONT_VALUE, alignment: CENTER_MIDDLE });

  // Borders for metadata row 4
  setBorderRange(ws, 4, 4, 4, 6, { top: MEDIUM, bottom: MEDIUM });
  cell(ws, 4, 4).border = { ...cell(ws, 4, 4).border, left: MEDIUM };
  cell(ws, 4, 6).border = { ...cell(ws, 4, 6).border, right: MEDIUM };
  setBorderRange(ws, 4, 7, 4, 9, { top: MEDIUM, bottom: MEDIUM });
  cell(ws, 4, 7).border = { ...cell(ws, 4, 7).border, left: MEDIUM };
  cell(ws, 4, 9).border = { ...cell(ws, 4, 9).border, right: MEDIUM };
  setBorderRange(ws, 4, 11, 4, 12, { top: MEDIUM, bottom: MEDIUM });
  cell(ws, 4, 11).border = { ...cell(ws, 4, 11).border, left: MEDIUM };
  cell(ws, 4, 12).border = { ...cell(ws, 4, 12).border, right: MEDIUM };
  setBorderRange(ws, 4, 13, 4, 16, { top: MEDIUM, bottom: MEDIUM });
  cell(ws, 4, 13).border = { ...cell(ws, 4, 13).border, left: MEDIUM };
  cell(ws, 4, 16).border = { ...cell(ws, 4, 16).border, right: MEDIUM };

  // Green fill for label cells row 4
  fillRange(ws, 4, 4, 4, 6, greenFill);
  fillRange(ws, 4, 11, 4, 12, greenFill);

  // ============================================================
  // TABLE HEADERS (rows 6-7)
  // ============================================================

  const redFill: ExcelJS.Fill = { type: "pattern", pattern: "solid", fgColor: RED };
  const lgFill: ExcelJS.Fill = { type: "pattern", pattern: "solid", fgColor: LIGHT_GREEN };
  const blueFill: ExcelJS.Fill = { type: "pattern", pattern: "solid", fgColor: BLUE };

  // Row 6 - group headers
  ws.mergeCells("A6:A7");
  setCell(ws, 6, 1, "Day", { font: FONT_HEADER, alignment: CENTER_MIDDLE });
  fillRange(ws, 6, 1, 7, 1, greenFill);

  ws.mergeCells("B6:B7");
  setCell(ws, 6, 2, "Date", { font: FONT_HEADER, alignment: CENTER_MIDDLE });
  fillRange(ws, 6, 2, 7, 2, greenFill);

  // Column C header is empty (it's for Roster/Actual)
  fillRange(ws, 6, 3, 7, 3, greenFill);

  ws.mergeCells("D6:E6");
  setCell(ws, 6, 4, "Time", { font: FONT_HEADER, alignment: CENTER_MIDDLE });
  fillRange(ws, 6, 4, 6, 5, greenFill);

  ws.mergeCells("F6:F7");
  setCell(ws, 6, 6, "Station Worked from", { font: FONT_HEADER, alignment: CENTER_MIDDLE });
  fillRange(ws, 6, 6, 7, 6, greenFill);

  ws.mergeCells("G6:J6");
  setCell(ws, 6, 7, "Subsistence", { font: FONT_HEADER, alignment: CENTER_MIDDLE });
  fillRange(ws, 6, 7, 6, 10, redFill);

  ws.mergeCells("K6:M6");
  setCell(ws, 6, 11, "Overtime Hours Worked", { font: FONT_HEADER, alignment: CENTER_MIDDLE });
  fillRange(ws, 6, 11, 6, 13, lgFill);

  ws.mergeCells("N6:P6");
  setCell(ws, 6, 14, "On-Call Hours Worked", { font: FONT_HEADER, alignment: CENTER_MIDDLE });
  fillRange(ws, 6, 14, 6, 16, blueFill);

  // Row 7 - sub-headers
  setCell(ws, 7, 4, "From", { font: FONT_HEADER, alignment: CENTER_MIDDLE });
  setCell(ws, 7, 5, "To", { font: FONT_HEADER, alignment: CENTER_MIDDLE });
  fillRange(ws, 7, 4, 7, 5, greenFill);

  // Subsistence sub-headers
  setCell(ws, 7, 7, "From", { font: FONT_HEADER, alignment: CENTER_MIDDLE });
  setCell(ws, 7, 8, "To", { font: FONT_HEADER, alignment: CENTER_MIDDLE });
  setCell(ws, 7, 9, "5/10 hr", { font: FONT_HEADER, alignment: CENTER_MIDDLE });
  setCell(ws, 7, 10, "Location & Incident No", { font: FONT_HEADER, alignment: CENTER_MIDDLE });
  fillRange(ws, 7, 7, 7, 10, redFill);

  // Overtime sub-headers
  setCell(ws, 7, 11, "From", { font: FONT_HEADER, alignment: CENTER_MIDDLE });
  setCell(ws, 7, 12, "To", { font: FONT_HEADER, alignment: CENTER_MIDDLE });
  setCell(ws, 7, 13, "Reason for O/T Incident No.", { font: FONT_HEADER, alignment: CENTER_MIDDLE });
  fillRange(ws, 7, 11, 7, 13, lgFill);

  // On-Call sub-headers
  setCell(ws, 7, 14, "From", { font: FONT_HEADER, alignment: CENTER_MIDDLE });
  setCell(ws, 7, 15, "To", { font: FONT_HEADER, alignment: CENTER_MIDDLE });
  setCell(ws, 7, 16, "Incident No.", { font: FONT_HEADER, alignment: CENTER_MIDDLE });
  fillRange(ws, 7, 14, 7, 16, blueFill);

  // Header borders - outer medium border
  for (let r = 6; r <= 7; r++) {
    cell(ws, r, 1).border = { ...cell(ws, r, 1).border, left: MEDIUM };
    cell(ws, r, 16).border = { ...cell(ws, r, 16).border, right: MEDIUM };
  }
  for (let c = 1; c <= 16; c++) {
    cell(ws, 6, c).border = { ...cell(ws, 6, c).border, top: MEDIUM };
    cell(ws, 7, c).border = { ...cell(ws, 7, c).border, bottom: MEDIUM };
  }
  // Bottom border on row 6 group headers (Time, Subsistence, Overtime, On-Call)
  // These are row-6-only merged cells that need a visible bottom border against row 7
  for (const col of [4, 5]) { // Time D6:E6
    cell(ws, 6, col).border = { ...cell(ws, 6, col).border, bottom: MEDIUM };
  }
  for (let c = 7; c <= 10; c++) { // Subsistence G6:J6
    cell(ws, 6, c).border = { ...cell(ws, 6, c).border, bottom: MEDIUM };
  }
  for (let c = 11; c <= 13; c++) { // Overtime K6:M6
    cell(ws, 6, c).border = { ...cell(ws, 6, c).border, bottom: MEDIUM };
  }
  for (let c = 14; c <= 16; c++) { // On-Call N6:P6
    cell(ws, 6, c).border = { ...cell(ws, 6, c).border, bottom: MEDIUM };
  }
  // Medium vertical borders between groups
  const groupBoundaries = [1, 2, 3, 5, 6, 10, 13, 16];
  for (let r = 6; r <= 7; r++) {
    for (const c of groupBoundaries) {
      cell(ws, r, c).border = { ...cell(ws, r, c).border, right: MEDIUM };
    }
  }
  // Thin borders within groups
  for (let r = 6; r <= 7; r++) {
    for (let c = 1; c <= 16; c++) {
      const existing = cell(ws, r, c).border || {};
      if (!existing.left) cell(ws, r, c).border = { ...existing, left: THIN };
      if (!existing.right) cell(ws, r, c).border = { ...existing, right: THIN };
    }
  }

  // ============================================================
  // DAY DATA (rows 8-21)
  // ============================================================

  data.days.forEach((day, index) => {
    // 0-indexed template row -> 1-indexed Excel row
    const rosterRowIdx = getDayRowIndex(index) + 1; // +1 for 1-indexed
    const actualRowIdx = rosterRowIdx + 1;
    const displayDate = weekDates[index].displayDate;

    // Vertically merged columns: A, B, F-P
    ws.mergeCells(rosterRowIdx, 1, actualRowIdx, 1); // Day name
    ws.mergeCells(rosterRowIdx, 2, actualRowIdx, 2); // Date
    ws.mergeCells(rosterRowIdx, 6, actualRowIdx, 6); // Station
    for (let c = 7; c <= 16; c++) {
      ws.mergeCells(rosterRowIdx, c, actualRowIdx, c);
    }

    // Day name (bold italic)
    setCell(ws, rosterRowIdx, 1, day.dayName, {
      font: FONT_DAY_NAME,
      alignment: CENTER_MIDDLE,
    });

    // Date
    setCell(ws, rosterRowIdx, 2, displayDate, {
      font: FONT_VALUE,
      alignment: CENTER_MIDDLE,
    });

    // Roster row
    setCell(ws, rosterRowIdx, 3, "Roster", {
      font: FONT_DAY_NAME,
      alignment: CENTER_MIDDLE,
    });

    // Actual row
    setCell(ws, actualRowIdx, 3, "Actual", {
      font: FONT_DAY_NAME,
      alignment: CENTER_MIDDLE,
    });

    // Time From/To for roster
    populateTimeRow(ws, rosterRowIdx, day.roster);
    // Time From/To for actual
    populateTimeRow(ws, actualRowIdx, day.actual);

    // Station (merged, use actual's station or roster's)
    const station = day.actual.stationWorkedFrom || day.roster.stationWorkedFrom;
    if (day.roster.status === "working" || day.actual.status === "working") {
      setCell(ws, rosterRowIdx, 6, station, {
        font: FONT_VALUE,
        alignment: CENTER_MIDDLE,
      });
    }

    // Overtime (per-day, in merged cells)
    if (day.hasOvertime) {
      setCell(ws, rosterRowIdx, 11, day.overtimeFrom, { font: FONT_VALUE, alignment: CENTER_MIDDLE });
      setCell(ws, rosterRowIdx, 12, day.overtimeTo, { font: FONT_VALUE, alignment: CENTER_MIDDLE });
      setCell(ws, rosterRowIdx, 13, day.overtimeReason, { font: FONT_VALUE, alignment: CENTER_MIDDLE });
    }

    // Borders for data rows
    applyDayBorders(ws, rosterRowIdx, actualRowIdx);

    // Green fill for Day/Date columns
    fillRange(ws, rosterRowIdx, 1, actualRowIdx, 1, greenFill);
    fillRange(ws, rosterRowIdx, 2, actualRowIdx, 2, greenFill);
  });

  // ============================================================
  // SIGNATURE (row 23)
  // ============================================================

  ws.mergeCells("A23:B23");
  setCell(ws, 23, 1, "Employee Signature:", { font: { ...FONT_HEADER, color: BLACK }, alignment: CENTER_MIDDLE });
  fillRange(ws, 23, 1, 23, 2, greenFill);

  ws.mergeCells("C23:F23");
  setCell(ws, 23, 3, data.name, { font: FONT_VALUE, alignment: CENTER_MIDDLE });

  ws.mergeCells("I23:K23");
  setCell(ws, 23, 9, "Line Manager Signature:", { font: { ...FONT_HEADER, color: BLACK }, alignment: CENTER_MIDDLE });
  fillRange(ws, 23, 9, 23, 11, greenFill);

  ws.mergeCells("L23:O23");

  // Signature borders
  setBorderRange(ws, 23, 1, 23, 2, { top: MEDIUM, bottom: MEDIUM });
  cell(ws, 23, 1).border = { ...cell(ws, 23, 1).border, left: MEDIUM };
  cell(ws, 23, 2).border = { ...cell(ws, 23, 2).border, right: MEDIUM };
  setBorderRange(ws, 23, 3, 23, 6, { top: MEDIUM, bottom: MEDIUM });
  cell(ws, 23, 3).border = { ...cell(ws, 23, 3).border, left: MEDIUM };
  cell(ws, 23, 6).border = { ...cell(ws, 23, 6).border, right: MEDIUM };
  setBorderRange(ws, 23, 9, 23, 11, { top: MEDIUM, bottom: MEDIUM });
  cell(ws, 23, 9).border = { ...cell(ws, 23, 9).border, left: MEDIUM };
  cell(ws, 23, 11).border = { ...cell(ws, 23, 11).border, right: MEDIUM };
  setBorderRange(ws, 23, 12, 23, 15, { top: MEDIUM, bottom: MEDIUM });
  cell(ws, 23, 12).border = { ...cell(ws, 23, 12).border, left: MEDIUM };
  cell(ws, 23, 15).border = { ...cell(ws, 23, 15).border, right: MEDIUM };

  // ============================================================
  // NOTES SECTION (rows 26-34) - yellow background
  // ============================================================

  const yellowFill: ExcelJS.Fill = { type: "pattern", pattern: "solid", fgColor: YELLOW };

  ws.mergeCells("A26:P26");
  setCell(ws, 26, 1, "Notes:", { font: FONT_NOTES, alignment: LEFT_MIDDLE });
  fillRange(ws, 26, 1, 26, 16, yellowFill);

  // Notes 1-5
  const noteRows = [27, 28, 29, 30, 31];
  NOTES.forEach((note, i) => {
    const row = noteRows[i];
    if (i === 2) {
      // Note 3: A29:I29 for text, J29:P29 for URL
      ws.mergeCells(`A${row}:I${row}`);
      setCell(ws, row, 1, note, { font: FONT_NOTES, alignment: LEFT_MIDDLE });
      ws.mergeCells(`J${row}:P${row}`);
      setCell(ws, row, 10, "http://www.hse.ie/eng/staff/Resources/HR_Forms/", {
        font: { name: "Arial", size: 12, underline: true, color: { argb: "FF0000FF" } },
        alignment: LEFT_MIDDLE,
      });
    } else if (i === 4) {
      // Note 5: A31:E31 for text, F31:L31 for email
      ws.mergeCells(`A${row}:E${row}`);
      setCell(ws, row, 1, note, { font: FONT_NOTES, alignment: LEFT_MIDDLE });
      ws.mergeCells(`F${row}:L${row}`);
      setCell(ws, row, 6, "ambulance.payroll@hse.ie", {
        font: { name: "Arial", size: 12, underline: true, color: { argb: "FF0000FF" } },
        alignment: LEFT_MIDDLE,
      });
      ws.mergeCells(`M${row}:P${row}`);
    } else {
      ws.mergeCells(`A${row}:P${row}`);
      setCell(ws, row, 1, note, { font: FONT_NOTES, alignment: LEFT_MIDDLE });
    }
    fillRange(ws, row, 1, row, 16, yellowFill);
  });

  // Empty yellow row 32
  ws.mergeCells("A32:P32");
  fillRange(ws, 32, 1, 32, 16, yellowFill);

  // Address row 33
  ws.mergeCells("A33:P33");
  setCell(ws, 33, 1, NAS_ADDRESS, { font: FONT_ADDRESS, alignment: LEFT_MIDDLE });
  fillRange(ws, 33, 1, 33, 16, yellowFill);

  // Bottom border row 34
  ws.mergeCells("M34:P34");
  fillRange(ws, 34, 1, 34, 16, yellowFill);

  // Notes outer borders
  for (let r = 26; r <= 34; r++) {
    cell(ws, r, 1).border = { ...cell(ws, r, 1).border, left: MEDIUM };
    cell(ws, r, 16).border = { ...cell(ws, r, 16).border, right: MEDIUM };
  }
  for (let c = 1; c <= 16; c++) {
    cell(ws, 26, c).border = { ...cell(ws, 26, c).border, top: MEDIUM };
    cell(ws, 34, c).border = { ...cell(ws, 34, c).border, bottom: MEDIUM };
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

function populateTimeRow(
  ws: ExcelJS.Worksheet,
  row: number,
  rowData: TimesheetRow
): void {
  if (rowData.status !== "working") {
    const statusText = STATUS_DISPLAY[rowData.status];
    setCell(ws, row, 4, statusText, { font: FONT_VALUE, alignment: CENTER_MIDDLE });
    setCell(ws, row, 5, statusText, { font: FONT_VALUE, alignment: CENTER_MIDDLE });
    return;
  }
  setCell(ws, row, 4, rowData.timeFrom, { font: FONT_VALUE, alignment: CENTER_MIDDLE });
  setCell(ws, row, 5, rowData.timeTo, { font: FONT_VALUE, alignment: CENTER_MIDDLE });
}

function applyDayBorders(
  ws: ExcelJS.Worksheet,
  rosterRow: number,
  actualRow: number
): void {
  // Outer medium borders for the day pair
  for (let c = 1; c <= 16; c++) {
    cell(ws, rosterRow, c).border = {
      ...cell(ws, rosterRow, c).border,
      top: MEDIUM,
    };
    cell(ws, actualRow, c).border = {
      ...cell(ws, actualRow, c).border,
      bottom: MEDIUM,
    };
  }
  for (let r = rosterRow; r <= actualRow; r++) {
    cell(ws, r, 1).border = { ...cell(ws, r, 1).border, left: MEDIUM };
    cell(ws, r, 16).border = { ...cell(ws, r, 16).border, right: MEDIUM };
  }

  // Medium vertical borders between column groups
  const groupRightBorders = [1, 2, 3, 5, 6, 10, 13, 16];
  for (let r = rosterRow; r <= actualRow; r++) {
    for (const c of groupRightBorders) {
      cell(ws, r, c).border = { ...cell(ws, r, c).border, right: MEDIUM };
    }
  }

  // Thin border between roster and actual rows (for cols C, D, E only since others are merged)
  for (let c = 3; c <= 5; c++) {
    cell(ws, rosterRow, c).border = {
      ...cell(ws, rosterRow, c).border,
      bottom: THIN,
    };
  }

  // Thin internal borders within groups
  for (let r = rosterRow; r <= actualRow; r++) {
    for (let c = 1; c <= 16; c++) {
      const existing = cell(ws, r, c).border || {};
      if (!existing.left) cell(ws, r, c).border = { ...existing, left: THIN };
      if (!existing.right) cell(ws, r, c).border = { ...existing, right: THIN };
    }
  }
}
