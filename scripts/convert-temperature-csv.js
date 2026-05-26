import { readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { parseTemperatureCsv } from "../src/temperature.js";

const [
  ,
  ,
  inputPath = "data/demo/temperature_field.csv",
  outputPath = "public/simulation/temperature_field.json",
] = process.argv;

const csvText = readFileSync(inputPath, "utf8");
const payload = parseTemperatureCsv(csvText, {
  source: "Abaqus简化热源温度场",
  note: "占位参数的移动热源瞬态热传导结果，不代表真实实验温度。可来自 Abaqus 后处理 CSV，并用于前端颜色映射链路验证。",
});

writeFileSync(outputPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");

const scriptName = fileURLToPath(import.meta.url).slice(dirname(fileURLToPath(import.meta.url)).length + 1);
console.log(`${scriptName}: wrote ${outputPath}`);
