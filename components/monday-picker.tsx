"use client";

import { useState, useRef, useEffect } from "react";

interface MondayPickerProps {
  value: string;
  onChange: (isoDate: string) => void;
  id: string;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function formatDisplay(isoDate: string): string {
  if (!isoDate) return "";
  const d = new Date(isoDate + "T00:00:00Z");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const yyyy = d.getUTCFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function getCalendarDays(year: number, month: number): (number | null)[][] {
  const firstDay = new Date(Date.UTC(year, month, 1));
  // Monday=0 ... Sunday=6
  let startOffset = firstDay.getUTCDay() - 1;
  if (startOffset < 0) startOffset = 6;

  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const weeks: (number | null)[][] = [];
  let week: (number | null)[] = Array(startOffset).fill(null);

  for (let d = 1; d <= daysInMonth; d++) {
    week.push(d);
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
  }
  if (week.length > 0) {
    while (week.length < 7) week.push(null);
    weeks.push(week);
  }
  return weeks;
}

function isMonday(year: number, month: number, day: number): boolean {
  return new Date(Date.UTC(year, month, day)).getUTCDay() === 1;
}

function toIso(year: number, month: number, day: number): string {
  const mm = String(month + 1).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  return `${year}-${mm}-${dd}`;
}

export default function MondayPicker({ value, onChange, id }: MondayPickerProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Derive viewed month from current value or today
  const anchor = value ? new Date(value + "T00:00:00Z") : new Date();
  const [viewYear, setViewYear] = useState(anchor.getUTCFullYear());
  const [viewMonth, setViewMonth] = useState(anchor.getUTCMonth());

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function prevMonth() {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  }

  function nextMonth() {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  }

  function selectDay(day: number) {
    onChange(toIso(viewYear, viewMonth, day));
    setOpen(false);
  }

  const weeks = getCalendarDays(viewYear, viewMonth);
  const selectedIso = value;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        id={id}
        onClick={() => setOpen(!open)}
        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 bg-white text-left"
      >
        {value ? formatDisplay(value) : <span className="text-gray-500">Select a Monday</span>}
      </button>

      {open && (
        <div className="absolute z-50 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-3 w-72">
          <div className="flex items-center justify-between mb-2">
            <button type="button" onClick={prevMonth} className="p-1 hover:bg-gray-100 rounded text-gray-600">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <span className="text-sm font-medium text-gray-900">
              {MONTH_NAMES[viewMonth]} {viewYear}
            </span>
            <button type="button" onClick={nextMonth} className="p-1 hover:bg-gray-100 rounded text-gray-600">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>

          <div className="grid grid-cols-7 text-center text-xs font-medium text-gray-500 mb-1">
            <span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span><span>Su</span>
          </div>

          {weeks.map((week, wi) => (
            <div key={wi} className="grid grid-cols-7 text-center">
              {week.map((day, di) => {
                if (day === null) {
                  return <span key={di} />;
                }
                const mon = isMonday(viewYear, viewMonth, day);
                const iso = toIso(viewYear, viewMonth, day);
                const selected = iso === selectedIso;

                return (
                  <button
                    key={di}
                    type="button"
                    disabled={!mon}
                    onClick={() => selectDay(day)}
                    className={`py-1 text-sm rounded ${
                      selected
                        ? "bg-blue-600 text-white font-bold"
                        : mon
                          ? "text-gray-900 font-semibold hover:bg-blue-100 cursor-pointer"
                          : "text-gray-300 cursor-default"
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
