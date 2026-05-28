import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { describe, expect, test } from "vitest";
import {
  DEFAULT_TOOL_MODEL_URL,
  DEFAULT_WORKPIECE_MODEL_URL,
  LOCAL_GRINDING_SCENE_CONFIG,
} from "./scene.js";

describe("LOCAL_GRINDING_SCENE_CONFIG", () => {
  test("uses the requested 100 mm square workpiece and 24 mm tool reference", () => {
    expect(LOCAL_GRINDING_SCENE_CONFIG.workpiece.widthMm).toBe(100);
    expect(LOCAL_GRINDING_SCENE_CONFIG.workpiece.depthMm).toBe(100);
    expect(LOCAL_GRINDING_SCENE_CONFIG.tool.referenceDiameterMm).toBe(24);
  });

  test("keeps fixed SolidWorks GLB models on the same meter-to-scene scale", () => {
    expect(LOCAL_GRINDING_SCENE_CONFIG.modelUnits.solidWorksMetersToSceneUnits).toBeCloseTo(30);
    expect(LOCAL_GRINDING_SCENE_CONFIG.modelUnits.solidWorksMetersToSceneUnits)
      .toBeCloseTo(LOCAL_GRINDING_SCENE_CONFIG.sceneUnitsPerMm * 1000);
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

  test("uses separate fixed GLB assets for workpiece and tool", () => {
    expect(DEFAULT_WORKPIECE_MODEL_URL).toBe("/models/workpiece.glb");
    expect(DEFAULT_TOOL_MODEL_URL).toBe("/models/tool.glb");
    expect(DEFAULT_WORKPIECE_MODEL_URL).not.toBe(DEFAULT_TOOL_MODEL_URL);
    expect(existsSync("public/models/workpiece.glb")).toBe(true);
  });

  test("starts by loading the fixed workpiece before the fixed tool", async () => {
    const source = await readFile("src/main.js", "utf8");

    expect(source).toContain("loadDefaultWorkpieceModel()");
    expect(source.indexOf("loadDefaultWorkpieceModel()")).toBeLessThan(source.indexOf("loadDefaultToolModel()"));
  });
});
