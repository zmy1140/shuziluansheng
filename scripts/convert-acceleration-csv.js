import { readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  createAccelerationReplayPayload,
  createAccelerationRun,
} from "../src/sensor-data.js";

const outputPath = process.argv[2] ?? "public/simulation/acceleration_features.json";

const runInputs = [
  {
    id: "0608data01",
    label: "静止/空载",
    condition: "静止/空载",
    file: "data/sanzhoujiasudu_data/0608data01_xyz.csv",
  },
  {
    id: "0608dataqingqiao01",
    label: "轻敲传感器",
    condition: "轻敲传感器",
    file: "data/sanzhoujiasudu_data/0608dataqingqiao01_xyz.csv",
  },
  {
    id: "0608datahuangdong01",
    label: "手动晃动传感器",
    condition: "手动晃动传感器",
    file: "data/sanzhoujiasudu_data/0608datahuangdong01_xyz.csv",
  },
];

const runs = runInputs.map((input) =>
  createAccelerationRun(readFileSync(input.file, "utf8"), {
    ...input,
    sampleRateHz: 1600,
    windowSeconds: 1,
  }),
);

const payload = createAccelerationReplayPayload(runs, {
  preferredRunId: "0608datahuangdong01",
});

writeFileSync(outputPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");

const scriptName = fileURLToPath(import.meta.url).slice(dirname(fileURLToPath(import.meta.url)).length + 1);
console.log(`${scriptName}: wrote ${outputPath}`);
