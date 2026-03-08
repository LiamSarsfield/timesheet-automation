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
] as const;

export type DayStatus = (typeof DAY_STATUSES)[number];

export const STATUS_DISPLAY: Record<DayStatus, string> = {
  working: "Working",
  rest: "Rest",
  "annual-leave": "Annual Leave",
  "sick-leave": "Sick Leave",
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
    if (row.status === "working") {
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
