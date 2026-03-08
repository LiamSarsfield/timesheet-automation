import { NAS_STATIONS } from "./stations";

export interface UrlParams {
  name: string;
  personnelNumber: string;
  station: string;
}

export function parseUrlParams(): UrlParams {
  if (typeof window === "undefined") {
    return { name: "", personnelNumber: "", station: "" };
  }

  const params = new URLSearchParams(window.location.search);
  const name = params.get("name") ?? "";
  const personnelNumber = params.get("personnelNumber") ?? "";
  const rawStation = params.get("station") ?? "";
  const station = (NAS_STATIONS as readonly string[]).includes(rawStation)
    ? rawStation
    : "";

  return { name, personnelNumber, station };
}

export function buildUrlSearch(params: UrlParams): string {
  const search = new URLSearchParams();
  if (params.name) search.set("name", params.name);
  if (params.personnelNumber) search.set("personnelNumber", params.personnelNumber);
  if (params.station) search.set("station", params.station);

  const str = search.toString();
  return str ? `?${str}` : "";
}
