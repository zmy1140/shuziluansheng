import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";
import { mapSimulationSamplesToGrid } from "./simulation.js";

describe("mapSimulationSamplesToGrid", () => {
  test("maps plate simulation scalar samples into a normalized color grid", () => {
    const grid = mapSimulationSamplesToGrid(
      [
        { x: -2, z: -1, mises: 10 },
        { x: 0, z: 0, mises: 30 },
        { x: 2, z: 1, mises: 50 },
      ],
      { columns: 5, rows: 3, width: 4, depth: 2, valueKey: "mises" },
    );

    expect(grid).toHaveLength(15);
    expect(Math.max(...grid)).toBe(1);
    expect(grid[0]).toBeCloseTo(0);
    expect(grid[7]).toBeCloseTo(0.5);
    expect(grid[14]).toBeCloseTo(1);
  });

  test("returns an empty grid when simulation samples are unavailable", () => {
    const grid = mapSimulationSamplesToGrid([], {
      columns: 4,
      rows: 2,
      width: 4,
      depth: 2,
      valueKey: "mises",
    });

    expect(grid).toEqual(new Array(8).fill(0));
  });

  test("keeps the bundled Abaqus plate mapping sample usable by the frontend", () => {
    const result = JSON.parse(readFileSync("public/simulation/plate_color_mapping.json", "utf8"));
    const grid = mapSimulationSamplesToGrid(result.samples, {
      columns: 26,
      rows: 16,
      width: 4.4,
      depth: 2.8,
      valueKey: result.valueKey,
    });

    expect(result.note).toContain("不代表真实磨抛接触仿真或真实粗糙度预测");
    expect(result.samples.length).toBeGreaterThan(0);
    expect(Math.max(...grid)).toBe(1);
  });
});
