const DEFAULT_CHANNEL_MAP = {
  acc_x_m_s2: "CH1 / X轴",
  acc_y_m_s2: "CH2 / Y轴",
  acc_z_m_s2: "CH3 / Z轴",
};

function parseCsvRows(csvText) {
  const rows = String(csvText)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (rows.length < 2) {
    throw new Error("三轴加速度 CSV 至少需要表头和一行数据。");
  }

  const headers = splitDataLine(rows[0]);
  return rows.slice(1).map((row) => {
    const values = splitDataLine(row);
    return Object.fromEntries(headers.map((header, index) => [header, values[index]]));
  });
}

function splitDataLine(line) {
  return String(line)
    .trim()
    .split(/[,\t ]+/)
    .map((value) => value.trim())
    .filter(Boolean);
}

function isNumericRow(values) {
  return values.length >= 3 && values.every((value) => Number.isFinite(Number(value)));
}

function requireFiniteNumber(value, column) {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    throw new Error(`三轴加速度 CSV 列 ${column} 存在非数字值。`);
  }
  return number;
}

function round(value, digits = 6) {
  return Number(value.toFixed(digits));
}

function rms(values) {
  if (values.length === 0) {
    return 0;
  }
  return Math.sqrt(values.reduce((sum, value) => sum + value ** 2, 0) / values.length);
}

function peakToPeak(values) {
  if (values.length === 0) {
    return 0;
  }
  return Math.max(...values) - Math.min(...values);
}

function traceValues(values) {
  return values.map((value) => round(value));
}

function dominantAxisFromRms(rmsX, rmsY, rmsZ) {
  const axes = [
    ["X", rmsX],
    ["Y", rmsY],
    ["Z", rmsZ],
  ];
  return axes.sort((a, b) => b[1] - a[1])[0][0];
}

export function parseAccelerationCsv(csvText) {
  const rows = String(csvText)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (rows.length < 1) {
    throw new Error("三轴加速度数据为空。");
  }

  if (isNumericRow(splitDataLine(rows[0]))) {
    return rows.map((row, index) => {
      const values = splitDataLine(row);
      return {
        sampleIndex: index + 1,
        x: requireFiniteNumber(values[0], "acc_x_m_s2"),
        y: requireFiniteNumber(values[1], "acc_y_m_s2"),
        z: requireFiniteNumber(values[2], "acc_z_m_s2"),
      };
    });
  }

  return parseCsvRows(csvText).map((row, index) => ({
    sampleIndex: requireFiniteNumber(row.sample_index ?? index + 1, "sample_index"),
    x: requireFiniteNumber(row.acc_x_m_s2 ?? row.acc_ch1, "acc_x_m_s2"),
    y: requireFiniteNumber(row.acc_y_m_s2 ?? row.acc_ch2, "acc_y_m_s2"),
    z: requireFiniteNumber(row.acc_z_m_s2 ?? row.acc_ch3, "acc_z_m_s2"),
  }));
}

export function createAccelerationRun(csvText, {
  id,
  label,
  condition,
  file,
  sampleRateHz = 1600,
  windowSeconds = 1,
  unit = "m/s^2",
} = {}) {
  const samples = parseAccelerationCsv(csvText);
  const windowSize = Math.max(1, Math.round(sampleRateHz * windowSeconds));
  const windows = [];

  for (let offset = 0; offset < samples.length; offset += windowSize) {
    const chunk = samples.slice(offset, offset + windowSize);
    const xValues = chunk.map((sample) => sample.x);
    const yValues = chunk.map((sample) => sample.y);
    const zValues = chunk.map((sample) => sample.z);
    const allValues = [...xValues, ...yValues, ...zValues];

    const rmsX = rms(xValues);
    const rmsY = rms(yValues);
    const rmsZ = rms(zValues);
    const p2pX = peakToPeak(xValues);
    const p2pY = peakToPeak(yValues);
    const p2pZ = peakToPeak(zValues);

    windows.push({
      index: windows.length + 1,
      startSample: chunk[0].sampleIndex,
      endSample: chunk[chunk.length - 1].sampleIndex,
      startTimeS: round(offset / sampleRateHz, 3),
      endTimeS: round((offset + chunk.length) / sampleRateHz, 3),
      sampleCount: chunk.length,
      rmsX: round(rmsX),
      rmsY: round(rmsY),
      rmsZ: round(rmsZ),
      vectorRms: round(Math.sqrt(rmsX ** 2 + rmsY ** 2 + rmsZ ** 2)),
      peakAbs: round(Math.max(...allValues.map((value) => Math.abs(value)))),
      peakToPeakX: round(p2pX),
      peakToPeakY: round(p2pY),
      peakToPeakZ: round(p2pZ),
      peakToPeakMax: round(Math.max(p2pX, p2pY, p2pZ)),
      dominantAxis: dominantAxisFromRms(rmsX, rmsY, rmsZ),
    });
  }

  const vectorRmsValues = windows.map((window) => window.vectorRms);
  const peakToPeakValues = windows.map((window) => window.peakToPeakMax);

  return {
    id,
    label,
    condition,
    file,
    sampleRateHz,
    windowSeconds,
    unit,
    summary: {
      sampleCount: samples.length,
      windowCount: windows.length,
      durationSeconds: round(samples.length / sampleRateHz, 3),
      sampleRateHz,
      unit,
      maxVectorRms: round(Math.max(...vectorRmsValues)),
      maxPeakToPeak: round(Math.max(...peakToPeakValues)),
    },
    windows,
  };
}

export function createAccelerationReplayPayload(runs, {
  source = "YE6275D 三轴加速度真实导出样例",
  preferredRunId = runs[0]?.id,
  sampleRateHz = 1600,
  unit = "m/s^2",
  channelMap = DEFAULT_CHANNEL_MAP,
} = {}) {
  return {
    source,
    sensor: "CA-YD-3EC3001",
    acquisitionDevice: "YE6275D",
    sampleRateHz,
    unit,
    preferredRunId,
    channelMap,
    note: "由 YE7602 导出的三轴加速度 txt/CSV 转换而来，用于前端真实样例回放；当前不是正式打磨实验数据。",
    runs,
  };
}

const DEFAULT_FORCE_CHANNEL_MAP = {
  CH1: "Fx",
  CH2: "Fy",
  CH3: "Fz",
  CH4: "Mx",
  CH5: "My",
  CH6: "Mz",
};

function parseForceValues(values, sampleIndex) {
  if (values.length < 6) {
    throw new Error("iDAS 六维力数据每行至少需要 6 个通道。");
  }

  return {
    sampleIndex,
    fx: requireFiniteNumber(values[0], "Fx/CH1"),
    fy: requireFiniteNumber(values[1], "Fy/CH2"),
    fz: requireFiniteNumber(values[2], "Fz/CH3"),
    mx: requireFiniteNumber(values[3], "Mx/CH4"),
    my: requireFiniteNumber(values[4], "My/CH5"),
    mz: requireFiniteNumber(values[5], "Mz/CH6"),
  };
}

function dominantForceAxisFromMeans(meanFx, meanFy, meanFz) {
  const axes = [
    ["Fx", Math.abs(meanFx)],
    ["Fy", Math.abs(meanFy)],
    ["Fz", Math.abs(meanFz)],
  ];
  return axes.sort((a, b) => b[1] - a[1])[0][0];
}

function mean(values) {
  if (values.length === 0) {
    return 0;
  }
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function parseForceTxt(forceText) {
  const rows = String(forceText)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (rows.length < 1) {
    throw new Error("iDAS 六维力数据为空。");
  }

  const samples = [];
  rows.forEach((row, fallbackIndex) => {
    if (/^CH1[;,\t ]+CH2/i.test(row)) {
      return;
    }

    if (row.includes("=")) {
      const [indexText, valueText] = row.split("=", 2);
      const sampleIndex = requireFiniteNumber(indexText, "sample_index");
      samples.push(parseForceValues(splitDataLine(valueText), sampleIndex));
      return;
    }

    const values = splitDataLine(row);
    if (isNumericRow(values) && values.length >= 6) {
      samples.push(parseForceValues(values, fallbackIndex));
    }
  });

  if (samples.length === 0) {
    throw new Error("未识别到 iDAS 六维力采样行。");
  }

  return samples;
}

export function createForceRun(forceText, {
  id,
  label,
  condition,
  file,
  sampleRateHz = 200,
  windowSeconds = 1,
  forceUnit = "N",
  torqueUnit = "Nm",
} = {}) {
  const samples = parseForceTxt(forceText);
  const windowSize = Math.max(1, Math.round(sampleRateHz * windowSeconds));
  const windows = [];
  const trace = {
    ch1: traceValues(samples.map((sample) => sample.fx)),
    ch2: traceValues(samples.map((sample) => sample.fy)),
    ch3: traceValues(samples.map((sample) => sample.fz)),
    ch4: traceValues(samples.map((sample) => sample.mx)),
    ch5: traceValues(samples.map((sample) => sample.my)),
    ch6: traceValues(samples.map((sample) => sample.mz)),
  };

  for (let offset = 0; offset < samples.length; offset += windowSize) {
    const chunk = samples.slice(offset, offset + windowSize);
    const fxValues = chunk.map((sample) => sample.fx);
    const fyValues = chunk.map((sample) => sample.fy);
    const fzValues = chunk.map((sample) => sample.fz);
    const mxValues = chunk.map((sample) => sample.mx);
    const myValues = chunk.map((sample) => sample.my);
    const mzValues = chunk.map((sample) => sample.mz);
    const forceMagnitudes = chunk.map((sample) =>
      Math.sqrt(sample.fx ** 2 + sample.fy ** 2 + sample.fz ** 2),
    );
    const torqueMagnitudes = chunk.map((sample) =>
      Math.sqrt(sample.mx ** 2 + sample.my ** 2 + sample.mz ** 2),
    );

    const meanFx = mean(fxValues);
    const meanFy = mean(fyValues);
    const meanFz = mean(fzValues);
    const meanMx = mean(mxValues);
    const meanMy = mean(myValues);
    const meanMz = mean(mzValues);

    windows.push({
      index: windows.length + 1,
      startSample: chunk[0].sampleIndex,
      endSample: chunk[chunk.length - 1].sampleIndex,
      startTimeS: round(offset / sampleRateHz, 3),
      endTimeS: round((offset + chunk.length) / sampleRateHz, 3),
      sampleCount: chunk.length,
      meanFx: round(meanFx),
      meanFy: round(meanFy),
      meanFz: round(meanFz),
      meanMx: round(meanMx),
      meanMy: round(meanMy),
      meanMz: round(meanMz),
      meanForceN: round(mean(forceMagnitudes)),
      rmsForceN: round(rms(forceMagnitudes)),
      peakForceN: round(Math.max(...forceMagnitudes.map((value) => Math.abs(value)))),
      peakToPeakFx: round(peakToPeak(fxValues)),
      peakToPeakFy: round(peakToPeak(fyValues)),
      peakToPeakFz: round(peakToPeak(fzValues)),
      peakToPeakForceMax: round(Math.max(
        peakToPeak(fxValues),
        peakToPeak(fyValues),
        peakToPeak(fzValues),
      )),
      meanTorqueNm: round(mean(torqueMagnitudes)),
      dominantForceAxis: dominantForceAxisFromMeans(meanFx, meanFy, meanFz),
      trace: {
        ch1: traceValues(fxValues),
        ch2: traceValues(fyValues),
        ch3: traceValues(fzValues),
        ch4: traceValues(mxValues),
        ch5: traceValues(myValues),
        ch6: traceValues(mzValues),
      },
    });
  }

  const meanForceValues = windows.map((window) => window.meanForceN);
  const peakForceValues = windows.map((window) => window.peakForceN);
  const peakToPeakValues = windows.map((window) => window.peakToPeakForceMax);

  return {
    id,
    label,
    condition,
    file,
    sampleRateHz,
    windowSeconds,
    forceUnit,
    torqueUnit,
    summary: {
      sampleCount: samples.length,
      windowCount: windows.length,
      durationSeconds: round(samples.length / sampleRateHz, 3),
      sampleRateHz,
      forceUnit,
      torqueUnit,
      maxMeanForce: round(Math.max(...meanForceValues)),
      maxPeakForce: round(Math.max(...peakForceValues)),
      maxPeakToPeakForce: round(Math.max(...peakToPeakValues)),
    },
    trace,
    windows,
  };
}

export function createForceReplayPayload(runs, {
  source = "iDAS 六维力真实导出数据",
  preferredRunId = runs[0]?.id,
  sampleRateHz = 200,
  forceUnit = "N",
  torqueUnit = "Nm",
  channelMap = DEFAULT_FORCE_CHANNEL_MAP,
} = {}) {
  return {
    source,
    sensor: "M3553C",
    acquisitionDevice: "M8229",
    sampleRateHz,
    forceUnit,
    torqueUnit,
    preferredRunId,
    channelMap,
    note: "由 iDAS R&D 导出的 CH1-CH6 六维力 txt 转换而来，用于 iDAS 对照和 PLC EtherCAT 读数校验。",
    runs,
  };
}
