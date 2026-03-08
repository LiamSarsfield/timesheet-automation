"use client";

import { NAS_STATIONS } from "@/lib/stations";
import MondayPicker from "./monday-picker";

interface HeaderFieldsProps {
  name: string;
  personnelNumber: string;
  station: string;
  email: string;
  dateWeekStarting: string;
  onNameChange: (value: string) => void;
  onPersonnelNumberChange: (value: string) => void;
  onStationChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onDateWeekStartingChange: (value: string) => void;
}

export default function HeaderFields({
  name,
  personnelNumber,
  station,
  email,
  dateWeekStarting,
  onNameChange,
  onPersonnelNumberChange,
  onStationChange,
  onEmailChange,
  onDateWeekStartingChange,
}: HeaderFieldsProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6 space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">Employee Details</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Name
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900"
            placeholder="e.g. Jane Doe"
          />
        </div>
        <div>
          <label htmlFor="personnelNumber" className="block text-sm font-medium text-gray-700">
            Personnel Number
          </label>
          <input
            id="personnelNumber"
            type="text"
            value={personnelNumber}
            onChange={(e) => onPersonnelNumberChange(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900"
            placeholder="e.g. 63221553"
          />
        </div>
        <div>
          <label htmlFor="station" className="block text-sm font-medium text-gray-700">
            Station
          </label>
          <select
            id="station"
            value={station}
            onChange={(e) => onStationChange(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900"
          >
            <option value="">Select station</option>
            {NAS_STATIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900"
            placeholder="e.g. jane@example.com"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Week Starting (Monday)
          </label>
          <MondayPicker
            id="dateWeekStarting"
            value={dateWeekStarting}
            onChange={onDateWeekStartingChange}
          />
        </div>
      </div>
    </div>
  );
}
