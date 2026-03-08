"use client";

import { useEffect, useRef } from "react";

interface DownloadModalProps {
  generatedFiles: {
    csv: { data: string; filename: string };
    xlsx: { data: string; filename: string };
  };
  onClose: () => void;
  onDownload: (base64: string, filename: string) => void;
}

export default function DownloadModal({
  generatedFiles,
  onClose,
  onDownload,
}: DownloadModalProps) {
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  function handleBackdropClick(e: React.MouseEvent) {
    if (e.target === backdropRef.current) onClose();
  }

  return (
    <div
      ref={backdropRef}
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 bg-black/50 flex items-end md:items-center md:justify-center animate-fade-in"
    >
      <div className="w-full rounded-t-2xl bg-white p-6 animate-slide-up md:animate-scale-in md:rounded-2xl md:max-w-md md:w-full">
        {/* Green checkmark */}
        <div className="flex justify-center mb-4">
          <svg
            className="h-16 w-16 text-nas-green"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>

        <h2 className="text-xl font-semibold text-gray-900 text-center mb-6">
          Timesheet generated successfully!
        </h2>

        <div className="space-y-3">
          <button
            type="button"
            onClick={() =>
              onDownload(generatedFiles.csv.data, generatedFiles.csv.filename)
            }
            className="w-full px-4 py-3 bg-nas-green text-white rounded-lg font-medium hover:bg-nas-green-dark transition-colors"
          >
            Download CSV
          </button>
          <button
            type="button"
            onClick={() =>
              onDownload(generatedFiles.xlsx.data, generatedFiles.xlsx.filename)
            }
            className="w-full px-4 py-3 bg-nas-green text-white rounded-lg font-medium hover:bg-nas-green-dark transition-colors"
          >
            Download Excel
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-full px-4 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
