import { timesheetDataSchema, DAY_NAMES, type TimesheetData } from "./types";

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  success: boolean;
  errors: ValidationError[];
  data?: TimesheetData;
}

function humanizePath(path: PropertyKey[]): string {
  if (path.length === 0) return "Form";

  const fieldLabels: Record<string, string> = {
    name: "Name",
    personnelNumber: "Personnel Number",
    dateWeekStarting: "Week Starting",
    station: "Station",
    email: "Email",
    timeFrom: "Start Time",
    timeTo: "End Time",
    stationWorkedFrom: "Station",
    overtimeFrom: "Overtime Start",
    overtimeTo: "Overtime End",
    overtimeReason: "Reason / Incident No.",
    hasOvertime: "Overtime",
  };

  const parts: string[] = [];

  for (let i = 0; i < path.length; i++) {
    const segment = path[i] as string | number;
    if (segment === "days" && typeof path[i + 1] === "number") {
      const dayIndex = path[i + 1] as number;
      const dayName = DAY_NAMES[dayIndex] || `Day ${dayIndex + 1}`;
      parts.push(dayName);
      i++; // skip the index

      // Check if next segment is roster/actual
      if (path[i + 1] === "roster" || path[i + 1] === "actual") {
        const rowType = path[i + 1] as string;
        parts.push(rowType.charAt(0).toUpperCase() + rowType.slice(1));
        i++;
      }
    } else if (typeof segment === "string") {
      parts.push(fieldLabels[segment] || segment);
    }
  }

  return parts.join(" - ");
}

export function validateTimesheetData(input: unknown): ValidationResult {
  const result = timesheetDataSchema.safeParse(input);

  if (result.success) {
    return { success: true, errors: [], data: result.data };
  }

  const errors: ValidationError[] = result.error.issues.map((issue) => ({
    field: humanizePath(issue.path),
    message: issue.message,
  }));

  return { success: false, errors };
}
