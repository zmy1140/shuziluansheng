import { describe, expect, test, vi } from "vitest";
import { loadTemperatureField } from "./temperature-source.js";

function response(payload, ok = true) {
  return {
    ok,
    status: ok ? 200 : 404,
    json: () => Promise.resolve(payload),
  };
}

describe("loadTemperatureField", () => {
  test("loads Abaqus temperature field before falling back to demo data", async () => {
    const abqPayload = {
      source: "Abaqus简化热源温度场",
      valueLabel: "温度",
      samples: [],
    };
    const fetchImpl = vi.fn((url) => {
      if (url === "/simulation/temperature_field.json") {
        return Promise.resolve(response(abqPayload));
      }
      return Promise.reject(new Error(`unexpected ${url}`));
    });
    const applySimulationResult = vi.fn();
    const statusText = { textContent: "" };

    await loadTemperatureField({ fetchImpl, applySimulationResult, statusText });

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(fetchImpl).toHaveBeenCalledWith("/simulation/temperature_field.json");
    expect(applySimulationResult).toHaveBeenCalledWith(abqPayload);
    expect(statusText.textContent).toContain("Abaqus简化热源温度场");
    expect(statusText.textContent).toContain("占位参数");
  });

  test("falls back to demo temperature field when Abaqus field is unavailable", async () => {
    const demoPayload = {
      source: "demo_temperature_field",
      valueLabel: "温度",
      samples: [],
    };
    const fetchImpl = vi.fn((url) => {
      if (url === "/simulation/temperature_field.json") {
        return Promise.resolve(response({}, false));
      }
      if (url === "/simulation/temperature_demo.json") {
        return Promise.resolve(response(demoPayload));
      }
      return Promise.reject(new Error(`unexpected ${url}`));
    });
    const applySimulationResult = vi.fn();
    const statusText = { textContent: "" };

    await loadTemperatureField({ fetchImpl, applySimulationResult, statusText });

    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(fetchImpl).toHaveBeenNthCalledWith(1, "/simulation/temperature_field.json");
    expect(fetchImpl).toHaveBeenNthCalledWith(2, "/simulation/temperature_demo.json");
    expect(applySimulationResult).toHaveBeenCalledWith(demoPayload);
    expect(statusText.textContent).toContain("演示温度场");
  });
});
