"use client";

import { useState } from "react";
import {
  DAY_NAMES,
  createEmptyDay,
  type TimesheetData,
} from "@/lib/types";
import { calculateWeekDates, formatIsoDate } from "@/lib/date-utils";
import type { ValidationError } from "@/lib/validation";
import HeaderFields from "./header-fields";
import DayEntry from "./day-entry";
import FormErrorSummary from "./form-error-summary";
import DownloadModal from "./download-modal";

interface GeneratedFiles {
  csv: { data: string; filename: string };
  xlsx: { data: string; filename: string };
}

function getCurrentMonday(): string {
  const today = new Date();
  const day = today.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  today.setUTCDate(today.getUTCDate() + diff);
  return formatIsoDate(today);
}

function buildInitialData(monday: string): TimesheetData {
  const weekDates = calculateWeekDates(monday);
  return {
    name: "",
    personnelNumber: "",
    dateWeekStarting: monday,
    station: "",
    days: weekDates.map(({ dayName, date }) => createEmptyDay(dayName, date)),
  };
}

export default function TimesheetForm() {
  const [data, setData] = useState<TimesheetData>(() => buildInitialData(getCurrentMonday()));
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [generatedFiles, setGeneratedFiles] = useState<GeneratedFiles | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleDateWeekStartingChange(monday: string) {
    try {
      const weekDates = calculateWeekDates(monday);
      setData((prev) => ({
        ...prev,
        dateWeekStarting: monday,
        days: weekDates.map(({ dayName, date: isoDate }) => {
          const existingDay = prev.days.find((d) => d.dayName === dayName);
          if (existingDay) {
            return { ...existingDay, date: isoDate };
          }
          return createEmptyDay(dayName, isoDate);
        }),
      }));
    } catch {
      // Invalid date
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors([]);
    setGeneratedFiles(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        setErrors(result.errors || [{ field: "_", message: "Generation failed" }]);
        return;
      }

      setGeneratedFiles(result);
      setShowModal(true);
    } catch {
      setErrors([{ field: "_", message: "Network error. Please try again." }]);
    } finally {
      setIsSubmitting(false);
    }
  }

  function downloadFile(base64: string, filename: string) {
    const bytes = atob(base64);
    const arr = new Uint8Array(bytes.length);
    for (let i = 0; i < bytes.length; i++) {
      arr[i] = bytes.charCodeAt(i);
    }
    const blob = new Blob([arr]);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <HeaderFields
        name={data.name}
        personnelNumber={data.personnelNumber}
        station={data.station}
        dateWeekStarting={data.dateWeekStarting}
        onNameChange={(name) => setData((prev) => ({ ...prev, name }))}
        onPersonnelNumberChange={(personnelNumber) =>
          setData((prev) => ({ ...prev, personnelNumber }))
        }
        onStationChange={(station) =>
          setData((prev) => ({
            ...prev,
            station,
            days: prev.days.map((day) => ({
              ...day,
              roster: { ...day.roster, stationWorkedFrom: station },
              actual: { ...day.actual, stationWorkedFrom: station },
            })),
          }))
        }
        onDateWeekStartingChange={handleDateWeekStartingChange}
      />

      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-900">Daily Entries</h2>
        {data.days.map((day, index) => (
          <DayEntry
            key={day.dayName}
            day={day}
            onChange={(updatedDay) => {
              setData((prev) => {
                const newDays = [...prev.days];
                newDays[index] = updatedDay;
                return { ...prev, days: newDays };
              });
            }}
          />
        ))}
      </div>

      <FormErrorSummary errors={errors} />

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Generating..." : "Generate Timesheet"}
        </button>
        {generatedFiles && !showModal && (
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-green-50 border border-green-300 rounded-lg text-green-700 font-medium hover:bg-green-100"
          >
            Re-download files
          </button>
        )}
      </div>

      {showModal && generatedFiles && (
        <DownloadModal
          generatedFiles={generatedFiles}
          onClose={() => setShowModal(false)}
          onDownload={downloadFile}
        />
      )}
    </form>
  );
}
