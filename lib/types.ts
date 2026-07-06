import { z } from "zod";

export const DAY_NAMES = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

export type DayName = (typeof DAY_NAMES)[number];

export const DAY_STATUSES = [
  "working",
  "rest",
  "annual-leave",
  "sick-leave",
  "overtime",
] as const;

export type DayStatus = (typeof DAY_STATUSES)[number];

export const STATUS_DISPLAY: Record<DayStatus, string> = {
  working: "Working",
  rest: "Rest",
  "annual-leave": "Annual Leave",
  "sick-leave": "Sick Leave",
  // Label only — an "overtime" row renders its worked hours, never this text.
  overtime: "Overtime",
};

export const HOURS = Array.from({ length: 24 }, (_, i) =>
  String(i).padStart(2, "0") + ":00"
);

const HOUR_REGEX = /^([01]\d|2[0-3]):00$/;

const timesheetRowSchema = z
  .object({
    status: z.enum(DAY_STATUSES),
    timeFrom: z.string(),
    timeTo: z.string(),
    stationWorkedFrom: z.string(),
  })
  .superRefine((row, ctx) => {
    if (row.status === "working" || row.status === "overtime") {
      if (!HOUR_REGEX.test(row.timeFrom)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Start time is required",
          path: ["timeFrom"],
        });
      }
      if (!HOUR_REGEX.test(row.timeTo)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "End time is required",
          path: ["timeTo"],
        });
      }
    }
  });

export type TimesheetRow = z.infer<typeof timesheetRowSchema>;

export const timesheetDaySchema = z
  .object({
    dayName: z.enum(DAY_NAMES),
    date: z.string(),
    roster: timesheetRowSchema,
    actual: timesheetRowSchema,
    hasOvertime: z.boolean(),
    overtimeFrom: z.string().default(""),
    overtimeTo: z.string().default(""),
    overtimeReason: z.string().default(""),
  })
  .superRefine((day, ctx) => {
    if (day.hasOvertime) {
      if (!HOUR_REGEX.test(day.overtimeFrom)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Overtime start time is required",
          path: ["overtimeFrom"],
        });
      }
      if (!HOUR_REGEX.test(day.overtimeTo)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Overtime end time is required",
          path: ["overtimeTo"],
        });
      }
      if (!day.overtimeReason.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Reason / Incident No. is required",
          path: ["overtimeReason"],
        });
      }
    }

    // Rest-day overtime (actual status "overtime") stores its hours in the actual
    // row rather than setting hasOvertime, so enforce the reason separately.
    if (day.actual.status === "overtime" && !day.overtimeReason.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Reason / Incident No. is required",
        path: ["overtimeReason"],
      });
    }

    // A rest-day overtime is, by definition, overtime on a day you were rostered
    // OFF. A working roster with an "overtime" actual double-counts the hours (a
    // full rostered shift AND the Overtime columns), so reject it outright.
    if (day.actual.status === "overtime" && day.roster.status === "working") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          'Roster must be "Rest" for a rest-day overtime — change the roster to Rest, or change the actual status away from Overtime.',
        path: ["roster", "status"],
      });
    }

    // Overtime has a single source of truth. Auto-detected shift-extension
    // overtime (hasOvertime) and the rest-day "overtime" status both write the
    // same three Overtime columns; allowing both lets one silently win.
    if (day.hasOvertime && day.actual.status === "overtime") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "A day cannot have both auto-detected overtime and a rest-day overtime status.",
        path: ["actual", "status"],
      });
    }

    // Worked hours on a rostered day off ARE overtime and must be recorded as
    // such so they reach the Overtime columns. A plain "working" actual on a
    // Rest roster would land the hours on the actual row with blank OT columns.
    if (day.roster.status === "rest" && day.actual.status === "working") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Worked hours on a rest day must be recorded as Overtime so they appear in the Overtime columns — change the actual status to Overtime, or set the roster to Working.",
        path: ["actual", "status"],
      });
    }
  });

export type TimesheetDay = z.infer<typeof timesheetDaySchema>;

export const timesheetDataSchema = z
  .object({
    name: z.string().min(1, "Name is required"),
    personnelNumber: z.string().min(1, "Personnel number is required"),
    dateWeekStarting: z.string().min(1, "Week starting date is required"),
    station: z.string().min(1, "Station is required"),
    days: z.array(timesheetDaySchema).length(7),
  })
  .superRefine((data, ctx) => {
    const date = new Date(data.dateWeekStarting);
    if (isNaN(date.getTime())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Week starting date must be a valid date",
        path: ["dateWeekStarting"],
      });
    } else if (date.getUTCDay() !== 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Week starting date must be a Monday",
        path: ["dateWeekStarting"],
      });
    }
  });

export type TimesheetData = z.infer<typeof timesheetDataSchema>;

export function createEmptyRow(): TimesheetRow {
  return {
    status: "rest",
    timeFrom: "",
    timeTo: "",
    stationWorkedFrom: "",
  };
}

export function createEmptyDay(dayName: DayName, date: string): TimesheetDay {
  return {
    dayName,
    date,
    roster: createEmptyRow(),
    actual: createEmptyRow(),
    hasOvertime: false,
    overtimeFrom: "",
    overtimeTo: "",
    overtimeReason: "",
  };
}
