import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";
import {
  clearTemperatureValues,
  getSimulationGridBounds,
  mapSimulationSamplesToGrid,
  mergeVisibleTemperatureValues,
  revealTemperatureValuesNearPoint,
} from "./simulation.js";

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

  test("maps temperature samples with millimeter coordinate fields", () => {
    const grid = mapSimulationSamplesToGrid(
      [
        { x_mm: -2, z_mm: -1, temperature_c: 28 },
        { x_mm: 0, z_mm: 0, temperature_c: 68 },
        { x_mm: 2, z_mm: 1, temperature_c: 88 },
      ],
      {
        columns: 5,
        rows: 3,
        width: 4,
        depth: 2,
        valueKey: "temperature_c",
        xKey: "x_mm",
        zKey: "z_mm",
      },
    );

    expect(grid).toHaveLength(15);
    expect(grid[0]).toBeCloseTo(0);
    expect(grid[7]).toBeCloseTo(2 / 3);
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

  test("keeps the bundled temperature demo sample usable by the frontend", () => {
    const result = JSON.parse(readFileSync("public/simulation/temperature_demo.json", "utf8"));
    const grid = mapSimulationSamplesToGrid(result.samples, {
      columns: result.grid.columns,
      rows: result.grid.rows,
      width: result.grid.widthMm,
      depth: result.grid.depthMm,
      valueKey: result.valueKey,
      xKey: result.xKey,
      zKey: result.zKey,
    });

    expect(result.valueKey).toBe("temperature_c");
    expect(result.note).toContain("演示温度场");
    expect(result.grid).toMatchObject({
      columns: 40,
      rows: 40,
      widthMm: 100,
      depthMm: 100,
    });
    expect(result.samples.length).toBeGreaterThan(0);
    expect(Math.max(...grid)).toBe(1);
    expect(grid[0]).toBeLessThan(0.08);
    expect(grid[result.grid.columns - 1]).toBeLessThan(0.08);
    expect(grid[(result.grid.rows - 1) * result.grid.columns]).toBeLessThan(0.08);
    expect(grid[result.grid.rows * result.grid.columns - 1]).toBeLessThan(0.08);
  });

  test("keeps the Abaqus moving heat source temperature field usable by the frontend", () => {
    const result = JSON.parse(readFileSync("public/simulation/temperature_field.json", "utf8"));
    const grid = mapSimulationSamplesToGrid(result.samples, {
      columns: result.grid.columns,
      rows: result.grid.rows,
      width: result.grid.widthMm,
      depth: result.grid.depthMm,
      valueKey: result.valueKey,
      xKey: result.xKey,
      zKey: result.zKey,
    });

    const centerIndex = Math.floor(result.grid.rows / 2) * result.grid.columns + Math.floor(result.grid.columns / 2);

    expect(result.source).toBe("Abaqus简化热源温度场");
    expect(result.valueKey).toBe("temperature_c");
    expect(result.valueLabel).toBe("温度");
    expect(result.unit).toBe("degC");
    expect(result.note).toContain("占位参数");
    expect(result.note).toContain("不代表真实实验温度");
    expect(result.grid).toMatchObject({
      columns: 40,
      rows: 40,
      widthMm: 100,
      depthMm: 100,
    });
    expect(result.samples).toHaveLength(1600);
    expect(Math.max(...grid)).toBe(1);
    expect(grid[centerIndex]).toBeGreaterThan(grid[0]);
    expect(grid[centerIndex]).toBeGreaterThan(grid[result.grid.columns - 1]);
    expect(grid[centerIndex]).toBeGreaterThan(grid[(result.grid.rows - 1) * result.grid.columns]);
    expect(grid[centerIndex]).toBeGreaterThan(grid[result.grid.rows * result.grid.columns - 1]);
  });

  test("uses millimeter grid bounds for millimeter simulation coordinates", () => {
    const bounds = getSimulationGridBounds({
      xKey: "x_mm",
      zKey: "z_mm",
      grid: {
        widthMm: 100,
        depthMm: 100,
      },
    }, {
      width: 3,
      depth: 3,
    });

    expect(bounds).toEqual({
      width: 100,
      depth: 100,
    });
  });
});

describe("progressive temperature reveal", () => {
  test("keeps loaded target temperatures hidden until cells are revealed", () => {
    const pathHeatValues = [0, 0.25, 0];
    const revealedTemperatureValues = [0, 0, 0];

    expect(mergeVisibleTemperatureValues(pathHeatValues, revealedTemperatureValues)).toEqual([0, 0.25, 0]);
  });

  test("reveals only cells inside the current tool contact radius", () => {
    const targetTemperatureValues = [0.2, 0.7, 1];
    const revealedTemperatureValues = [0, 0, 0];
    const cellCenters = [
      { x: 0, z: 0 },
      { x: 1.5, z: 0 },
      { x: 4, z: 0 },
    ];

    revealTemperatureValuesNearPoint({
      targetTemperatureValues,
      revealedTemperatureValues,
      cellCenters,
      point: { x: 0, z: 0 },
      radius: 2,
    });

    expect(revealedTemperatureValues).toEqual([0.2, 0.7, 0]);
  });

  test("clears revealed values before replaying the next processing loop", () => {
    const values = [0.2, 0.7, 1];

    clearTemperatureValues(values);

    expect(values).toEqual([0, 0, 0]);
  });
});
