import { describe, expect, test } from "vitest";
import { LOCAL_GRINDING_SCENE_CONFIG } from "./scene.js";

describe("LOCAL_GRINDING_SCENE_CONFIG", () => {
  test("uses the requested 100 mm square workpiece and 24 mm tool reference", () => {
    expect(LOCAL_GRINDING_SCENE_CONFIG.workpiece.widthMm).toBe(100);
    expect(LOCAL_GRINDING_SCENE_CONFIG.workpiece.depthMm).toBe(100);
    expect(LOCAL_GRINDING_SCENE_CONFIG.tool.referenceDiameterMm).toBe(24);
  });

  test("uses a finer temperature grid and removes oversized auxiliary markers", () => {
    const { temperatureGrid, markers } = LOCAL_GRINDING_SCENE_CONFIG;

    expect(temperatureGrid.columns).toBeGreaterThanOrEqual(40);
    expect(temperatureGrid.rows).toBeGreaterThanOrEqual(40);
    expect(temperatureGrid.cellWidthMm).toBeLessThanOrEqual(2.5);
    expect(temperatureGrid.cellDepthMm).toBeLessThanOrEqual(2.5);
    expect(markers.showContactRing).toBe(false);
    expect(markers.directionArrowLengthMm).toBeLessThanOrEqual(6);
  });
});
