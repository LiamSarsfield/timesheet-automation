"use client";

import { HOURS } from "@/lib/types";

interface TimeRangeInputProps {
  label: string;
  fromValue: string;
  toValue: string;
  onFromChange: (value: string) => void;
  onToChange: (value: string) => void;
  fromId: string;
  toId: string;
  isAutoFilled?: { from: boolean; to: boolean };
  isOvernight?: boolean;
  isFromDisabled?: (hour: string) => boolean;
  isToDisabled?: (hour: string) => boolean;
}

export default function TimeRangeInput({
  label,
  fromValue,
  toValue,
  onFromChange,
  onToChange,
  fromId,
  toId,
  isAutoFilled,
  isOvernight,
  isFromDisabled,
  isToDisabled,
}: TimeRangeInputProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium text-gray-700 w-28">{label}</span>
      <select
        id={fromId}
        value={fromValue}
        onChange={(e) => onFromChange(e.target.value)}
        className={`border border-gray-300 rounded px-2 py-1 text-sm ${
          isAutoFilled?.from ? "bg-blue-50 text-blue-700" : "text-gray-900"
        }`}
      >
        <option value="">--</option>
        {HOURS.map((h) => (
          <option key={h} value={h} disabled={isFromDisabled?.(h)}>
            {h}
          </option>
        ))}
      </select>
      <span className="text-gray-500">to</span>
      <select
        id={toId}
        value={toValue}
        onChange={(e) => onToChange(e.target.value)}
        className={`border border-gray-300 rounded px-2 py-1 text-sm ${
          isAutoFilled?.to ? "bg-blue-50 text-blue-700" : "text-gray-900"
        }`}
      >
        <option value="">--</option>
        {HOURS.map((h) => (
          <option key={h} value={h} disabled={isToDisabled?.(h)}>
            {h}
          </option>
        ))}
      </select>
      {isOvernight && (
        <span className="text-xs px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 font-medium">
          next day
        </span>
      )}
    </div>
  );
}
