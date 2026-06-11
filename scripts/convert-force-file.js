import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, extname, join } from "node:path";
import {
  createForceReplayPayload,
  createForceRun,
} from "../src/sensor-data.js";

const [, , inputPath, ...args] = process.argv;

if (!inputPath) {
  throw new Error("Usage: node scripts/convert-force-file.js <idas-txt-path> [--sample-rate 200]");
}

function optionValue(name, fallback) {
  const index = args.indexOf(name);
  if (index === -1) {
    return fallback;
  }
  return args[index + 1] ?? fallback;
}

const sampleRateHz = Number(optionValue("--sample-rate", "200"));

if (!Number.isFinite(sampleRateHz) || sampleRateHz <= 0) {
  throw new Error("--sample-rate must be a positive number.");
}

const directory = dirname(inputPath);
const baseName = basename(inputPath, extname(inputPath));
const outputPath = join(directory, `${baseName}.json`);

if (existsSync(outputPath)) {
  console.log(`convert-force-file.js: reuse ${outputPath}`);
  process.exit(0);
}

const run = createForceRun(readFileSync(inputPath, "utf8"), {
  id: baseName,
  label: baseName,
  condition: "iDAS local import",
  file: basename(inputPath),
  sampleRateHz,
  windowSeconds: 1,
});

const payload = createForceReplayPayload([run], {
  source: "local iDAS six-axis force data",
  preferredRunId: run.id,
  sampleRateHz,
});

writeFileSync(outputPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
console.log(`convert-force-file.js: wrote ${outputPath}`);
