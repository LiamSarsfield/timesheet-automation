"use client";

import { useState } from "react";
import type { TimesheetDay, TimesheetRow, DayStatus } from "@/lib/types";
import { NAS_STATIONS } from "@/lib/stations";
import DayStatusSelect from "./day-status-select";
import TimeRangeInput from "./time-range-input";

interface DayEntryProps {
  day: TimesheetDay;
  onChange: (day: TimesheetDay) => void;
}

// Roster = what you were scheduled for (a shift or off). Actual = what happened.
const ROSTER_STATUS_OPTIONS: DayStatus[] = ["working", "rest"];
const ACTUAL_STATUS_OPTIONS: DayStatus[] = [
  "working",
  "rest",
  "overtime",
  "annual-leave",
  "sick-leave",
];

const CLEARED_TIMES = { timeFrom: "", timeTo: "", stationWorkedFrom: "" };
const CLEARED_OT = {
  hasOvertime: false,
  overtimeFrom: "",
  overtimeTo: "",
  overtimeReason: "",
};

function isOvernight(from: string, to: string): boolean {
  if (!from || !to) return false;
  const fromHour = parseInt(from.split(":")[0], 10);
  const toHour = parseInt(to.split(":")[0], 10);
  return toHour <= fromHour;
}

function effectiveEndHour(shiftFrom: string, timeTo: string): number {
  const fromHour = parseInt(shiftFrom.split(":")[0], 10);
  const toHour = parseInt(timeTo.split(":")[0], 10);
  return toHour <= fromHour ? toHour + 24 : toHour;
}

// Default a shift/OT window to 12 hours when the start is chosen.
function autoEndFrom(start: string): string {
  const fromHour = parseInt(start.split(":")[0], 10);
  const toHour = (fromHour + 12) % 24;
  return `${String(toHour).padStart(2, "0")}:00`;
}

export default function DayEntry({ day, onChange }: DayEntryProps) {
  const [isOpen, setIsOpen] = useState(false);

  function updateRoster(updates: Partial<TimesheetRow>) {
    const newRoster = { ...day.roster, ...updates };
    const newActual = { ...day.actual };
    // Keep the actual's status tracking the roster while it hasn't diverged...
    if (day.actual.status === day.roster.status) {
      newActual.status = newRoster.status;
    }
    // ...and only copy times into an actual that is (now) a working shift still
    // mirroring the roster — never leak into a rest/leave/overtime actual.
    if (newActual.status === "working") {
      if (day.actual.timeFrom === day.roster.timeFrom) {
        newActual.timeFrom = newRoster.timeFrom;
      }
      if (day.actual.timeTo === day.roster.timeTo) {
        newActual.timeTo = newRoster.timeTo;
      }
    }
    onChange({ ...day, roster: newRoster, actual: newActual });
  }

  function updateActual(updates: Partial<TimesheetRow>) {
    const newActual = { ...day.actual, ...updates };
    let overtimeUpdates: Partial<TimesheetDay> = {};

    // Auto-detect shift-extension overtime: ONLY for a working actual against a
    // working roster. Overtime-status days manage their own hours and never enter
    // this path.
    if (
      "timeTo" in updates &&
      newActual.status === "working" &&
      day.roster.status === "working" &&
      day.roster.timeFrom &&
      day.roster.timeTo
    ) {
      if (newActual.timeTo) {
        const rosterEnd = effectiveEndHour(day.roster.timeFrom, day.roster.timeTo);
        const actualEnd = effectiveEndHour(day.roster.timeFrom, newActual.timeTo);
        overtimeUpdates =
          actualEnd > rosterEnd
            ? {
                hasOvertime: true,
                overtimeFrom: day.roster.timeTo,
                overtimeTo: newActual.timeTo,
              }
            : { ...CLEARED_OT };
      } else {
        // Clearing the actual end time also clears any auto-detected overtime.
        overtimeUpdates = { ...CLEARED_OT };
      }
    }

    onChange({ ...day, actual: newActual, ...overtimeUpdates });
  }

  // Roster status can only be Working or Rest.
  function handleRosterStatusChange(status: DayStatus) {
    if (status === "rest") {
      // Leave the actual row + rest-day OT intact; only clear the roster. But an
      // auto-detected working-day OT loses its baseline, so clear it.
      const otPatch = day.actual.status === "working" ? CLEARED_OT : {};
      onChange({
        ...day,
        roster: { ...day.roster, status: "rest", ...CLEARED_TIMES },
        ...otPatch,
      });
    } else {
      updateRoster({ status: "working" });
    }
  }

  function handleActualStatusChange(status: DayStatus) {
    if (status === "working") {
      // Scrub any prior overtime-status residue; auto-OT recomputes on next edit.
      onChange({ ...day, actual: { ...day.actual, status: "working" }, ...CLEARED_OT });
    } else if (status === "overtime") {
      // Rest-day overtime: roster is Rest, the worked hours live on the actual row,
      // the reason in overtimeReason. Never set hasOvertime. Keep any cascaded
      // station as an optional default; start the window empty.
      onChange({
        ...day,
        roster: { ...day.roster, status: "rest", timeFrom: "", timeTo: "" },
        actual: { ...day.actual, status: "overtime", timeFrom: "", timeTo: "" },
        ...CLEARED_OT,
      });
    } else {
      // rest / annual-leave / sick-leave: clear actual times + station AND all OT.
      onChange({
        ...day,
        actual: { ...day.actual, status, ...CLEARED_TIMES },
        ...CLEARED_OT,
      });
    }
  }

  const isActualTimeSynced = {
    from: day.actual.timeFrom === day.roster.timeFrom && day.actual.timeFrom !== "",
    to: day.actual.timeTo === day.roster.timeTo && day.actual.timeTo !== "",
  };

  const dayId = day.dayName.toLowerCase();
  const hasOvertimeIndicator = day.hasOvertime || day.actual.status === "overtime";

  const statusSummary = (() => {
    switch (day.actual.status) {
      case "overtime":
        return `OT ${day.actual.timeFrom || "?"} - ${day.actual.timeTo || "?"}`;
      case "annual-leave":
        return "Annual Leave";
      case "sick-leave":
        return "Sick Leave";
      case "working":
        return `${day.actual.timeFrom || "?"} - ${day.actual.timeTo || "?"}`;
      default:
        // Actual is Rest: surface the rostered shift if there was one.
        return day.roster.status === "working"
          ? `${day.roster.timeFrom || "?"} - ${day.roster.timeTo || "?"}`
          : "Rest";
    }
  })();

  return (
    <div className="bg-white rounded-lg shadow">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-3">
          <span className="font-medium text-gray-900">{day.dayName}</span>
          {day.date && <span className="text-sm text-gray-500">{day.date}</span>}
          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
            {statusSummary}
          </span>
          {hasOvertimeIndicator && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">
              OT
            </span>
          )}
        </div>
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="px-6 pb-6 space-y-6 border-t border-gray-100">
          {/* Roster Section */}
          <div className="pt-4 space-y-3">
            <h4 className="text-sm font-semibold text-blue-700 uppercase tracking-wide">Roster</h4>
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-gray-700">Status</label>
              <DayStatusSelect
                id={`${dayId}-roster-status`}
                value={day.roster.status}
                onChange={handleRosterStatusChange}
                options={ROSTER_STATUS_OPTIONS}
              />
            </div>
            {day.roster.status === "working" && (
              <div className="space-y-3 pl-4 border-l-2 border-blue-200">
                <TimeRangeInput
                  label="Shift"
                  fromValue={day.roster.timeFrom}
                  toValue={day.roster.timeTo}
                  onFromChange={(v) => updateRoster({ timeFrom: v, timeTo: autoEndFrom(v) })}
                  onToChange={(v) => updateRoster({ timeTo: v })}
                  fromId={`${dayId}-roster-from`}
                  toId={`${dayId}-roster-to`}
                  isOvernight={isOvernight(day.roster.timeFrom, day.roster.timeTo)}
                />
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700 w-28">Station</label>
                  <select
                    id={`${dayId}-station`}
                    value={day.roster.stationWorkedFrom}
                    onChange={(e) => {
                      const station = e.target.value;
                      onChange({
                        ...day,
                        roster: { ...day.roster, stationWorkedFrom: station },
                        actual: { ...day.actual, stationWorkedFrom: station },
                      });
                    }}
                    className="border border-gray-300 rounded px-2 py-1 text-sm flex-1 text-gray-900"
                  >
                    <option value="">Select station</option>
                    {NAS_STATIONS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Actual Section — always shown so a Rest/leave roster can still have an actual */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-green-700 uppercase tracking-wide">
              Actual{" "}
              <span className="text-xs font-normal text-gray-500">(what actually happened)</span>
            </h4>
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-gray-700">Status</label>
              <DayStatusSelect
                id={`${dayId}-actual-status`}
                value={day.actual.status}
                onChange={handleActualStatusChange}
                options={ACTUAL_STATUS_OPTIONS}
              />
            </div>

            {day.actual.status === "working" && (
              <div className="space-y-3 pl-4 border-l-2 border-green-200">
                <TimeRangeInput
                  label="Shift"
                  fromValue={day.actual.timeFrom}
                  toValue={day.actual.timeTo}
                  onFromChange={(v) => updateActual({ timeFrom: v })}
                  onToChange={(v) => updateActual({ timeTo: v })}
                  fromId={`${dayId}-actual-from`}
                  toId={`${dayId}-actual-to`}
                  isAutoFilled={isActualTimeSynced}
                  isOvernight={isOvernight(day.actual.timeFrom, day.actual.timeTo)}
                  isFromDisabled={day.roster.timeFrom ? (h) => {
                    const rosterFrom = parseInt(day.roster.timeFrom.split(":")[0], 10);
                    const hour = parseInt(h.split(":")[0], 10);
                    return hour > rosterFrom;
                  } : undefined}
                  isToDisabled={day.roster.timeFrom && day.roster.timeTo ? (h) => {
                    const rosterEffEnd = effectiveEndHour(day.roster.timeFrom, day.roster.timeTo);
                    const hourEffEnd = effectiveEndHour(day.roster.timeFrom, h);
                    return hourEffEnd < rosterEffEnd;
                  } : undefined}
                />

                {day.hasOvertime && (() => {
                  const otFrom = effectiveEndHour(day.roster.timeFrom, day.overtimeFrom);
                  const otTo = effectiveEndHour(day.roster.timeFrom, day.overtimeTo);
                  const otHours = otTo - otFrom;
                  return (
                  <div className="p-3 bg-orange-50 rounded space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-orange-800">Overtime (auto-detected)</span>
                      <span className="text-xs px-1.5 py-0.5 rounded bg-orange-200 text-orange-800 font-medium">
                        {otHours} {otHours === 1 ? "hour" : "hours"}
                      </span>
                    </div>
                    <TimeRangeInput
                      label="Hours"
                      fromValue={day.overtimeFrom}
                      toValue={day.overtimeTo}
                      onFromChange={(v) => onChange({ ...day, overtimeFrom: v })}
                      onToChange={(v) => onChange({ ...day, overtimeTo: v })}
                      fromId={`${dayId}-ot-from`}
                      toId={`${dayId}-ot-to`}
                    />
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium text-gray-700 w-28">
                        Reason / Inc No.
                      </label>
                      <input
                        type="text"
                        value={day.overtimeReason}
                        onChange={(e) => onChange({ ...day, overtimeReason: e.target.value })}
                        className="border border-gray-300 rounded px-2 py-1 text-sm flex-1 text-gray-900"
                        placeholder="e.g. Overrun 5647764"
                      />
                    </div>
                  </div>
                  );
                })()}
              </div>
            )}

            {day.actual.status === "overtime" && (() => {
              const otHours =
                day.actual.timeFrom && day.actual.timeTo
                  ? effectiveEndHour(day.actual.timeFrom, day.actual.timeTo) -
                    parseInt(day.actual.timeFrom.split(":")[0], 10)
                  : null;
              return (
              <div className="pl-4 border-l-2 border-orange-200">
                <div className="p-3 bg-orange-50 rounded space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-orange-800">
                      Overtime on rostered day off
                    </span>
                    {otHours !== null && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-orange-200 text-orange-800 font-medium">
                        {otHours} {otHours === 1 ? "hour" : "hours"}
                      </span>
                    )}
                  </div>
                  <TimeRangeInput
                    label="Hours worked"
                    fromValue={day.actual.timeFrom}
                    toValue={day.actual.timeTo}
                    onFromChange={(v) => updateActual({ timeFrom: v, timeTo: autoEndFrom(v) })}
                    onToChange={(v) => updateActual({ timeTo: v })}
                    fromId={`${dayId}-otstatus-from`}
                    toId={`${dayId}-otstatus-to`}
                    isOvernight={isOvernight(day.actual.timeFrom, day.actual.timeTo)}
                  />
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-gray-700 w-28">Station</label>
                    <select
                      id={`${dayId}-ot-station`}
                      value={day.actual.stationWorkedFrom}
                      onChange={(e) => updateActual({ stationWorkedFrom: e.target.value })}
                      className="border border-gray-300 rounded px-2 py-1 text-sm flex-1 text-gray-900"
                    >
                      <option value="">Select station</option>
                      {NAS_STATIONS.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-gray-700 w-28">
                      Reason / Inc No.
                    </label>
                    <input
                      type="text"
                      value={day.overtimeReason}
                      onChange={(e) => onChange({ ...day, overtimeReason: e.target.value })}
                      className="border border-gray-300 rounded px-2 py-1 text-sm flex-1 text-gray-900"
                      placeholder="e.g. Called in 5647764"
                    />
                  </div>
                </div>
              </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
