import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";
import { parsePathCsv } from "./path.js";

describe("parsePathCsv", () => {
  test("converts a line grinding CSV into frontend path JSON", () => {
    const csv = [
      "t_s,x_mm,y_mm,z_mm,nx,ny,nz,feed_mm_s",
      "0,-40,5,0,0,-1,0,5",
      "8,40,5,0,0,-1,0,5",
    ].join("\n");

    const path = parsePathCsv(csv, {
      id: "line_grinding_demo",
      unit: "mm",
      coordinate: "workpiece_local",
      toolRadiusMm: 4,
    });

    expect(path).toMatchObject({
      id: "line_grinding_demo",
      unit: "mm",
      timeUnit: "s",
      coordinate: "workpiece_local",
      toolRadiusMm: 4,
    });
    expect(path.points).toEqual([
      { t: 0, x: -40, y: 5, z: 0, nx: 0, ny: -1, nz: 0, feedMmS: 5 },
      { t: 8, x: 40, y: 5, z: 0, nx: 0, ny: -1, nz: 0, feedMmS: 5 },
    ]);
  });

  test("keeps the bundled line path CSV valid", () => {
    const csv = readFileSync("data/demo/line_grinding_path.csv", "utf8");
    const path = parsePathCsv(csv);

    expect(path.points).toHaveLength(2);
    expect(path.points[0].x).toBeLessThan(path.points[1].x);
    expect(path.points.every((point) => point.ny === -1)).toBe(true);
  });
});
