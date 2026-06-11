import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, extname, join } from "node:path";
import {
  createAccelerationReplayPayload,
  createAccelerationRun,
} from "../src/sensor-data.js";

const [, , inputPath] = process.argv;

if (!inputPath) {
  throw new Error("Usage: node scripts/convert-acceleration-file.js <txt-or-csv-path>");
}

const directory = dirname(inputPath);
const baseName = basename(inputPath, extname(inputPath));
const outputPath = join(directory, `${baseName}.json`);

if (existsSync(outputPath)) {
  console.log(`convert-acceleration-file.js: reuse ${outputPath}`);
  process.exit(0);
}

const run = createAccelerationRun(readFileSync(inputPath, "utf8"), {
  id: baseName,
  label: baseName,
  condition: "本地文件转换",
  file: basename(inputPath),
  sampleRateHz: 1600,
  windowSeconds: 1,
});

const payload = createAccelerationReplayPayload([run], {
  source: "本地转换三轴加速度数据",
  preferredRunId: run.id,
});

writeFileSync(outputPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
console.log(`convert-acceleration-file.js: wrote ${outputPath}`);
