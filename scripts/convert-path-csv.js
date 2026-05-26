import { readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { parsePathCsv } from "../src/path.js";

const [, , inputPath = "data/demo/line_grinding_path.csv", outputPath = "public/paths/line_grinding_path.json"] = process.argv;

const csvText = readFileSync(inputPath, "utf8");
const pathPayload = parsePathCsv(csvText, {
  id: "line_grinding_demo",
  unit: "mm",
  coordinate: "workpiece_local",
  toolRadiusMm: 4,
});

writeFileSync(
  outputPath,
  `${JSON.stringify(pathPayload, null, 2)}\n`,
  "utf8",
);

const scriptName = fileURLToPath(import.meta.url).slice(dirname(fileURLToPath(import.meta.url)).length + 1);
console.log(`${scriptName}: wrote ${outputPath}`);
