// Hardcoded template layout constants for the 33-row × 16-column NAS timesheet.
// Row and column indices are 0-based.

export const TOTAL_ROWS = 33;
export const TOTAL_COLS = 16;

// Metadata positions
export const NAME_ROW = 1;
export const NAME_COL = 5; // "Name:" label at col 4, value at col 5

export const PERSONNEL_NUMBER_ROW = 1;
export const PERSONNEL_NUMBER_LABEL_COL = 10; // "Personnel Number:" label
export const PERSONNEL_NUMBER_COL = 13; // value

export const WEEK_ENDING_ROW = 3;
export const WEEK_ENDING_LABEL_COL = 3; // "Date Week Ending:" label
export const WEEK_ENDING_COL = 6; // value

export const STATION_ROW = 3;
export const STATION_LABEL_COL = 10; // "Station:" label
export const STATION_COL = 12; // value

// Header rows
export const HEADER_ROW_1 = 5;
export const HEADER_ROW_2 = 6;

// Day data starts at row 7, 2 rows per day (roster + actual)
export const FIRST_DAY_ROW = 7;
export const ROWS_PER_DAY = 2;

// Column indices for day data
export const COL_DAY_NAME = 0;
export const COL_DATE = 1;
export const COL_ROW_TYPE = 2; // "Roster" or "Actual"
export const COL_TIME_FROM = 3;
export const COL_TIME_TO = 4;
export const COL_STATION_WORKED_FROM = 5;
export const COL_SUBSISTENCE_FROM = 6;
export const COL_SUBSISTENCE_TO = 7;
export const COL_SUBSISTENCE_5_10_HR = 8;
export const COL_SUBSISTENCE_LOCATION = 9;
export const COL_OVERTIME_FROM = 10;
export const COL_OVERTIME_TO = 11;
export const COL_OVERTIME_REASON = 12;
export const COL_ON_CALL_FROM = 13;
export const COL_ON_CALL_TO = 14;
export const COL_ON_CALL_INCIDENT_NO = 15;

// Signature row
export const SIGNATURE_ROW = 22;
export const EMPLOYEE_SIGNATURE_LABEL_COL = 0; // " Employee Signature:"
export const EMPLOYEE_SIGNATURE_COL = 2;
export const MANAGER_SIGNATURE_LABEL_COL = 9; // "Line Manager Signature:"

// Notes section
export const NOTES_HEADER_ROW = 25;
export const NOTES_START_ROW = 26;
export const NOTES_END_ROW = 30;

// Footer / NAS address
export const ADDRESS_ROW = 32;

// Header row 1 text
export const HEADER_1_TEXT: Record<number, string> = {
  [COL_DAY_NAME]: "Day",
  [COL_DATE]: "Date",
  [COL_TIME_FROM]: "Time",
  [COL_STATION_WORKED_FROM]: "Station Worked from",
  [COL_SUBSISTENCE_FROM]: "Subsistence",
  [COL_OVERTIME_FROM]: "Overtime Hours Worked",
  [COL_ON_CALL_FROM]: "On-Call Hours Worked",
};

// Header row 2 text
export const HEADER_2_TEXT: Record<number, string> = {
  [COL_TIME_FROM]: "From",
  [COL_TIME_TO]: "To",
  [COL_SUBSISTENCE_FROM]: "From",
  [COL_SUBSISTENCE_TO]: "To",
  [COL_SUBSISTENCE_5_10_HR]: "5/10 hr",
  [COL_SUBSISTENCE_LOCATION]: "Location & Incident No",
  [COL_OVERTIME_FROM]: "From",
  [COL_OVERTIME_TO]: "To",
  [COL_OVERTIME_REASON]: "Reason for O/T Incident No.",
  [COL_ON_CALL_FROM]: "From",
  [COL_ON_CALL_TO]: "To",
  [COL_ON_CALL_INCIDENT_NO]: "Incident No.",
};

// Notes text
export const NOTES = [
  "1. Sick Leave must be clearly stated on paysheet & GP Cert must be forwarded to Ambulance HQ immediately to ensure correct payment",
  "2. Annual leave must be clearly stated on sheet and approved in advance",
  "3. All other leave must be applied for on appropriate HR form and included with paysheet     ",
  "4. Paysheet must be received no later than 12 noon each Monday",
  "5. Paysheet can be sent by e-mail to: ",
];

export const NOTES_ROW_3_URL_COL = 10;
export const NOTES_ROW_3_URL = "http://www.hse.ie/eng/staff/Resources/HR_Forms/";

export const NOTES_ROW_5_EMAIL_COL = 5;
export const NOTES_ROW_5_EMAIL = "ambulance.payroll@hse.ie";

export const NAS_ADDRESS =
  "National Ambulance Service, HR & Payroll Unit, Unit 5, The Second Floor, Clonminch Hi Technology Park, Tullamore, Co. Offaly";

export function getDayRowIndex(dayIndex: number): number {
  return FIRST_DAY_ROW + dayIndex * ROWS_PER_DAY;
}
