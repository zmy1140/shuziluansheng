import { writeFileSync } from "node:fs";
import { parseTemperatureCsv } from "../src/temperature.js";

const columns = 40;
const rows = 40;
const widthMm = 100;
const depthMm = 100;
const ambientTemperatureC = 26;
const peakTemperatureC = 92;
const csvRows = ["x_mm,z_mm,temperature_c"];

for (let row = 0; row < rows; row += 1) {
  for (let column = 0; column < columns; column += 1) {
    const xMm = -widthMm / 2 + (widthMm * column) / (columns - 1);
    const zMm = -depthMm / 2 + (depthMm * row) / (rows - 1);
    const lineDistance = Math.abs(zMm);
    const pathHalfLengthMm = 40;
    const alongPathDistance = Math.max(0, Math.abs(xMm) - pathHalfLengthMm);
    const heatBand = Math.exp(-((lineDistance / 9) ** 2 + (alongPathDistance / 8) ** 2) / 2);
    const pathCenterBoost = 0.72 + 0.28 * Math.max(0, 1 - Math.abs(xMm) / pathHalfLengthMm);
    const temperatureC = ambientTemperatureC + (peakTemperatureC - ambientTemperatureC) * heatBand * pathCenterBoost;

    csvRows.push([
      Number(xMm.toFixed(3)),
      Number(zMm.toFixed(3)),
      Number(temperatureC.toFixed(2)),
    ].join(","));
  }
}

const csvText = `${csvRows.join("\n")}\n`;
const payload = {
  ...parseTemperatureCsv(csvText, {
    source: "demo_temperature_field",
    note: "演示温度场，仅用于前端颜色渲染链路验证，不代表真实打磨温度或真实Abaqus结果。",
  }),
  grid: {
    columns,
    rows,
    widthMm,
    depthMm,
  },
};

writeFileSync("data/demo/temperature_field.csv", csvText, "utf8");
writeFileSync("public/simulation/temperature_demo.json", `${JSON.stringify(payload, null, 2)}\n`, "utf8");
console.log("generate-temperature-demo: wrote data/demo/temperature_field.csv");
console.log("generate-temperature-demo: wrote public/simulation/temperature_demo.json");
