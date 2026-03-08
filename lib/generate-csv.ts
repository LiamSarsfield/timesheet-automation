import { stringify } from "csv-stringify/sync";
import type { TimesheetData, TimesheetRow } from "./types";
import { STATUS_DISPLAY } from "./types";
import { calculateWeekDates, getSundayFromMonday, formatWeekEndingDisplay } from "./date-utils";
import {
  TOTAL_ROWS,
  TOTAL_COLS,
  NAME_ROW,
  NAME_COL,
  PERSONNEL_NUMBER_ROW,
  PERSONNEL_NUMBER_LABEL_COL,
  PERSONNEL_NUMBER_COL,
  WEEK_ENDING_ROW,
  WEEK_ENDING_LABEL_COL,
  WEEK_ENDING_COL,
  STATION_ROW,
  STATION_LABEL_COL,
  STATION_COL,
  HEADER_ROW_1,
  HEADER_ROW_2,
  HEADER_1_TEXT,
  HEADER_2_TEXT,
  SIGNATURE_ROW,
  EMPLOYEE_SIGNATURE_LABEL_COL,
  EMPLOYEE_SIGNATURE_COL,
  MANAGER_SIGNATURE_LABEL_COL,
  NOTES_HEADER_ROW,
  NOTES_START_ROW,
  NOTES,
  NOTES_ROW_3_URL_COL,
  NOTES_ROW_3_URL,
  NOTES_ROW_5_EMAIL_COL,
  NOTES_ROW_5_EMAIL,
  ADDRESS_ROW,
  NAS_ADDRESS,
  getDayRowIndex,
  COL_DAY_NAME,
  COL_DATE,
  COL_ROW_TYPE,
  COL_TIME_FROM,
  COL_TIME_TO,
  COL_STATION_WORKED_FROM,
  COL_OVERTIME_FROM,
  COL_OVERTIME_TO,
  COL_OVERTIME_REASON,
} from "./template-layout";

function createEmptyGrid(): string[][] {
  return Array.from({ length: TOTAL_ROWS }, () =>
    Array.from({ length: TOTAL_COLS }, () => "")
  );
}

function populateRowData(
  grid: string[][],
  gridRow: number,
  row: TimesheetRow,
  rowType: string,
  dayName: string,
  dateStr: string,
  isFirstRow: boolean
): void {
  if (isFirstRow) {
    grid[gridRow][COL_DAY_NAME] = dayName;
    grid[gridRow][COL_DATE] = dateStr;
  }
  grid[gridRow][COL_ROW_TYPE] = rowType;

  if (row.status !== "working") {
    const statusText = STATUS_DISPLAY[row.status];
    grid[gridRow][COL_TIME_FROM] = statusText;
    grid[gridRow][COL_TIME_TO] = statusText;
    return;
  }

  grid[gridRow][COL_TIME_FROM] = row.timeFrom;
  grid[gridRow][COL_TIME_TO] = row.timeTo;
  grid[gridRow][COL_STATION_WORKED_FROM] = row.stationWorkedFrom;
}

export function generateCsv(data: TimesheetData): string {
  const grid = createEmptyGrid();
  const sundayStr = getSundayFromMonday(data.dateWeekStarting);

  // Metadata
  grid[NAME_ROW][3] = "Name:";
  grid[NAME_ROW][NAME_COL] = data.name;
  grid[PERSONNEL_NUMBER_ROW][PERSONNEL_NUMBER_LABEL_COL] = "Personnel Number:";
  grid[PERSONNEL_NUMBER_ROW][PERSONNEL_NUMBER_COL] = data.personnelNumber;

  grid[WEEK_ENDING_ROW][WEEK_ENDING_LABEL_COL] = "Date Week Ending:";
  grid[WEEK_ENDING_ROW][WEEK_ENDING_COL] = formatWeekEndingDisplay(sundayStr);
  grid[STATION_ROW][STATION_LABEL_COL] = "Station:";
  grid[STATION_ROW][STATION_COL] = data.station;

  // Header rows
  for (const [col, text] of Object.entries(HEADER_1_TEXT)) {
    grid[HEADER_ROW_1][parseInt(col)] = text;
  }
  for (const [col, text] of Object.entries(HEADER_2_TEXT)) {
    grid[HEADER_ROW_2][parseInt(col)] = text;
  }

  // Day data
  const weekDates = calculateWeekDates(data.dateWeekStarting);
  data.days.forEach((day, index) => {
    const rosterRow = getDayRowIndex(index);
    const actualRow = rosterRow + 1;
    const displayDate = weekDates[index].displayDate;

    populateRowData(grid, rosterRow, day.roster, "Roster", day.dayName, displayDate, true);
    populateRowData(grid, actualRow, day.actual, "Actual", "", "", false);

    // Overtime (per-day, placed on roster row for merged layout)
    if (day.hasOvertime) {
      grid[rosterRow][COL_OVERTIME_FROM] = day.overtimeFrom;
      grid[rosterRow][COL_OVERTIME_TO] = day.overtimeTo;
      grid[rosterRow][COL_OVERTIME_REASON] = day.overtimeReason;
    }
  });

  // Signature row
  grid[SIGNATURE_ROW][EMPLOYEE_SIGNATURE_LABEL_COL] = " Employee Signature:";
  grid[SIGNATURE_ROW][EMPLOYEE_SIGNATURE_COL] = data.name;
  grid[SIGNATURE_ROW][MANAGER_SIGNATURE_LABEL_COL] = "Line Manager Signature:";

  // Notes
  grid[NOTES_HEADER_ROW][0] = "Notes:";
  NOTES.forEach((note, index) => {
    grid[NOTES_START_ROW + index][0] = note;
  });
  grid[NOTES_START_ROW + 2][NOTES_ROW_3_URL_COL] = NOTES_ROW_3_URL;
  grid[NOTES_START_ROW + 4][NOTES_ROW_5_EMAIL_COL] = NOTES_ROW_5_EMAIL;

  // NAS address
  grid[ADDRESS_ROW][0] = NAS_ADDRESS;

  return stringify(grid, { record_delimiter: "\r\n" });
}
