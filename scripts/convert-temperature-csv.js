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
  source: "temperature_field_csv",
});

writeFileSync(outputPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");

const scriptName = fileURLToPath(import.meta.url).slice(dirname(fileURLToPath(import.meta.url)).length + 1);
console.log(`${scriptName}: wrote ${outputPath}`);
