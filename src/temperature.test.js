import { describe, expect, test } from "vitest";
import { parseTemperatureCsv } from "./temperature.js";

describe("parseTemperatureCsv", () => {
  test("converts standard temperature CSV into frontend field payload", () => {
    const payload = parseTemperatureCsv(
      [
        "x_mm,z_mm,temperature_c",
        "-50,-50,26",
        "0,-50,30",
        "50,-50,26",
        "-50,0,42",
        "0,0,92",
        "50,0,42",
        "-50,50,26",
        "0,50,30",
        "50,50,26",
      ].join("\n"),
      { source: "unit_test_temperature" },
    );

    expect(payload).toMatchObject({
      source: "unit_test_temperature",
      valueKey: "temperature_c",
      xKey: "x_mm",
      zKey: "z_mm",
      valueLabel: "温度",
      unit: "degC",
      coordinate: "workpiece_local",
      grid: {
        columns: 3,
        rows: 3,
        widthMm: 100,
        depthMm: 100,
      },
    });
    expect(payload.samples).toHaveLength(9);
    expect(payload.samples[4]).toEqual({
      x_mm: 0,
      z_mm: 0,
      temperature_c: 92,
    });
    expect(payload.note).toContain("温度场 CSV 转换结果");
    expect(payload.note).toContain("真实打磨温度");
  });

  test("rejects CSV files without required temperature columns", () => {
    expect(() => parseTemperatureCsv("x_mm,z_mm,value\n0,0,1")).toThrow(
      "temperature_c",
    );
  });
});
