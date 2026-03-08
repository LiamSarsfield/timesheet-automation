"use client";

import { useEffect, useRef } from "react";
import { buildUrlSearch } from "@/lib/url-params";

export function useUrlSync(name: string, personnelNumber: string, station: string) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      const search = buildUrlSearch({ name, personnelNumber, station });
      const newUrl = window.location.pathname + search;
      window.history.replaceState(null, "", newUrl);
    }, 300);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [name, personnelNumber, station]);
}
