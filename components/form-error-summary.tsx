"use client";

import type { ValidationError } from "@/lib/validation";

interface FormErrorSummaryProps {
  errors: ValidationError[];
}

export default function FormErrorSummary({ errors }: FormErrorSummaryProps) {
  if (errors.length === 0) return null;

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
      <h3 className="text-sm font-semibold text-red-800 mb-2">
        Please fix the following errors:
      </h3>
      <ul className="list-disc pl-5 space-y-1">
        {errors.map((error, index) => (
          <li key={index} className="text-sm text-red-700">
            {error.field && error.field !== "Form" && error.field !== "_" ? (
              <>
                <span className="font-medium">{error.field}:</span>{" "}
              </>
            ) : null}
            {error.message}
          </li>
        ))}
      </ul>
    </div>
  );
}
