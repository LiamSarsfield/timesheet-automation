"use client";

import { DAY_STATUSES, STATUS_DISPLAY, type DayStatus } from "@/lib/types";

interface DayStatusSelectProps {
  value: DayStatus;
  onChange: (value: DayStatus) => void;
  id: string;
  options?: readonly DayStatus[];
  disabled?: boolean;
}

export default function DayStatusSelect({
  value,
  onChange,
  id,
  options = DAY_STATUSES,
  disabled = false,
}: DayStatusSelectProps) {
  return (
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value as DayStatus)}
      disabled={disabled}
      className="border border-gray-300 rounded px-2 py-1 text-sm disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
    >
      {options.map((status) => (
        <option key={status} value={status}>
          {STATUS_DISPLAY[status]}
        </option>
      ))}
    </select>
  );
}
