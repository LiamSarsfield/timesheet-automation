// @vitest-environment jsdom
import { describe, it, expect, afterEach } from "vitest";
import { parseUrlParams, buildUrlSearch } from "@/lib/url-params";

describe("buildUrlSearch", () => {
  it("builds query string with all params", () => {
    const result = buildUrlSearch({
      name: "John Smith",
      personnelNumber: "12345",
      station: "Cork",
    });
    expect(result).toBe("?name=John+Smith&personnelNumber=12345&station=Cork");
  });

  it("returns empty string when all params are empty", () => {
    const result = buildUrlSearch({
      name: "",
      personnelNumber: "",
      station: "",
    });
    expect(result).toBe("");
  });

  it("omits empty params", () => {
    const result = buildUrlSearch({
      name: "Jane",
      personnelNumber: "",
      station: "Galway",
    });
    expect(result).toBe("?name=Jane&station=Galway");
  });

  it("encodes special characters", () => {
    const result = buildUrlSearch({
      name: "O'Brien & Co",
      personnelNumber: "123",
      station: "Dublin - Swords",
    });
    const params = new URLSearchParams(result);
    expect(params.get("name")).toBe("O'Brien & Co");
    expect(params.get("station")).toBe("Dublin - Swords");
  });
});

describe("parseUrlParams", () => {
  const originalLocation = window.location;

  function setSearch(search: string) {
    Object.defineProperty(window, "location", {
      value: { ...originalLocation, search },
      writable: true,
      configurable: true,
    });
  }

  afterEach(() => {
    Object.defineProperty(window, "location", {
      value: originalLocation,
      writable: true,
      configurable: true,
    });
  });

  it("parses valid params", () => {
    setSearch("?name=John+Smith&personnelNumber=12345&station=Cork");
    const result = parseUrlParams();
    expect(result).toEqual({
      name: "John Smith",
      personnelNumber: "12345",
      station: "Cork",
    });
  });

  it("returns empty strings for missing params", () => {
    setSearch("");
    const result = parseUrlParams();
    expect(result).toEqual({
      name: "",
      personnelNumber: "",
      station: "",
    });
  });

  it("returns empty string for invalid station", () => {
    setSearch("?station=FakeStation");
    const result = parseUrlParams();
    expect(result.station).toBe("");
  });

  it("accepts valid stations with special characters", () => {
    setSearch("?station=Dublin+-+Swords");
    const result = parseUrlParams();
    expect(result.station).toBe("Dublin - Swords");
  });

  it("handles URL encoding round-trip", () => {
    const original = { name: "O'Brien & Co", personnelNumber: "99", station: "New Ross" };
    const search = buildUrlSearch(original);
    setSearch(search);
    const parsed = parseUrlParams();
    expect(parsed).toEqual(original);
  });
});
