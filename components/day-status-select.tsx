"use client";

import { DAY_STATUSES, STATUS_DISPLAY, type DayStatus } from "@/lib/types";

interface DayStatusSelectProps {
  value: DayStatus;
  onChange: (value: DayStatus) => void;
  id: string;
}

export default function DayStatusSelect({
  value,
  onChange,
  id,
}: DayStatusSelectProps) {
  return (
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value as DayStatus)}
      className="border border-gray-300 rounded px-2 py-1 text-sm"
    >
      {DAY_STATUSES.map((status) => (
        <option key={status} value={status}>
          {STATUS_DISPLAY[status]}
        </option>
      ))}
    </select>
  );
}
