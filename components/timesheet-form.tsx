"use client";

import { useEffect, useState } from "react";
import {
  DAY_NAMES,
  createEmptyDay,
  type TimesheetData,
} from "@/lib/types";
import { calculateWeekDates, formatIsoDate } from "@/lib/date-utils";
import { parseUrlParams } from "@/lib/url-params";
import { useUrlSync } from "@/hooks/use-url-sync";
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
  useUrlSync(data.name, data.personnelNumber, data.station);
  const [errors, setErrors] = useState<ValidationError[]>([]);

  // Seed form from URL params on mount (runs client-side only)
  useEffect(() => {
    const urlParams = parseUrlParams();
    if (urlParams.name || urlParams.personnelNumber || urlParams.station) {
      setData((prev) => ({
        ...prev,
        name: urlParams.name || prev.name,
        personnelNumber: urlParams.personnelNumber || prev.personnelNumber,
        station: urlParams.station || prev.station,
        days: urlParams.station
          ? prev.days.map((day) => ({
              ...day,
              roster: { ...day.roster, stationWorkedFrom: urlParams.station },
              actual: { ...day.actual, stationWorkedFrom: urlParams.station },
            }))
          : prev.days,
      }));
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
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
        <h2 className="text-lg font-semibold text-nas-green">Daily Entries</h2>
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
          className="px-6 py-2 bg-nas-green text-white rounded-lg font-medium hover:bg-nas-green-dark disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Generating..." : "Generate Timesheet"}
        </button>
        {generatedFiles && !showModal && (
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-nas-green-50 border border-nas-green rounded-lg text-nas-green font-medium hover:bg-nas-green-light"
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
