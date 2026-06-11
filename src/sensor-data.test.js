import { describe, expect, test } from "vitest";
import {
  createAccelerationReplayPayload,
  createAccelerationRun,
  createForceReplayPayload,
  createForceRun,
  parseAccelerationCsv,
  parseForceTxt,
} from "./sensor-data.js";

describe("sensor acceleration data processing", () => {
  test("parses YE6275D xyz acceleration CSV samples", () => {
    const samples = parseAccelerationCsv(
      [
        "sample_index,acc_x_m_s2,acc_y_m_s2,acc_z_m_s2",
        "1,1.000000,2.000000,3.000000",
        "2,-1.000000,-2.000000,-3.000000",
      ].join("\n"),
    );

    expect(samples).toEqual([
      { sampleIndex: 1, x: 1, y: 2, z: 3 },
      { sampleIndex: 2, x: -1, y: -2, z: -3 },
    ]);
  });

  test("parses YE6275D raw txt samples without a header", () => {
    const samples = parseAccelerationCsv(
      [
        "-2.094344E-1\t-2.393536E-1\t-2.393536E-1",
        "-2.393536E-1\t-2.692727E-1\t-2.692727E-1",
      ].join("\n"),
    );

    expect(samples).toEqual([
      { sampleIndex: 1, x: -0.2094344, y: -0.2393536, z: -0.2393536 },
      { sampleIndex: 2, x: -0.2393536, y: -0.2692727, z: -0.2692727 },
    ]);
  });

  test("converts acceleration samples into one-second window features", () => {
    const run = createAccelerationRun(
      [
        "sample_index,acc_x_m_s2,acc_y_m_s2,acc_z_m_s2",
        "1,1.000000,0.000000,0.000000",
        "2,-1.000000,0.000000,0.000000",
        "3,0.000000,2.000000,0.000000",
        "4,0.000000,-2.000000,0.000000",
      ].join("\n"),
      {
        id: "unit",
        label: "unit test",
        condition: "synthetic",
        file: "unit.csv",
        sampleRateHz: 2,
        windowSeconds: 1,
      },
    );

    expect(run.summary).toMatchObject({
      sampleCount: 4,
      windowCount: 2,
      durationSeconds: 2,
      sampleRateHz: 2,
      unit: "m/s^2",
    });
    expect(run.windows).toHaveLength(2);
    expect(run.windows[0]).toMatchObject({
      startTimeS: 0,
      endTimeS: 1,
      sampleCount: 2,
      rmsX: 1,
      rmsY: 0,
      rmsZ: 0,
      peakAbs: 1,
      peakToPeakMax: 2,
      dominantAxis: "X",
    });
    expect(run.windows[1]).toMatchObject({
      rmsX: 0,
      rmsY: 2,
      rmsZ: 0,
      peakAbs: 2,
      peakToPeakMax: 4,
      dominantAxis: "Y",
    });
  });

  test("builds a replay payload for frontend loading", () => {
    const run = createAccelerationRun(
      [
        "sample_index,acc_x_m_s2,acc_y_m_s2,acc_z_m_s2",
        "1,0.100000,0.200000,0.300000",
      ].join("\n"),
      {
        id: "still",
        label: "静止/空载",
        condition: "静止/空载",
        file: "still.csv",
        sampleRateHz: 1600,
        windowSeconds: 1,
      },
    );

    const payload = createAccelerationReplayPayload([run], {
      source: "YE6275D 三轴加速度真实导出样例",
      preferredRunId: "still",
    });

    expect(payload).toMatchObject({
      source: "YE6275D 三轴加速度真实导出样例",
      sampleRateHz: 1600,
      unit: "m/s^2",
      preferredRunId: "still",
      channelMap: {
        acc_x_m_s2: "CH1 / X轴",
        acc_y_m_s2: "CH2 / Y轴",
        acc_z_m_s2: "CH3 / Z轴",
      },
    });
    expect(payload.runs).toHaveLength(1);
    expect(payload.runs[0].windows).toHaveLength(1);
  });
});

describe("six-axis force data processing", () => {
  test("parses iDAS six-channel txt samples", () => {
    const samples = parseForceTxt(
      [
        "CH1;CH2;CH3;CH4;CH5;CH6",
        "0=15.357415,-0.246672,-3.089011,-0.037165,-0.014246,-0.162343",
        "1=15.257583,-0.031373,-3.076787,-0.038913,-0.011052,-0.162602",
      ].join("\n"),
    );

    expect(samples).toEqual([
      {
        sampleIndex: 0,
        fx: 15.357415,
        fy: -0.246672,
        fz: -3.089011,
        mx: -0.037165,
        my: -0.014246,
        mz: -0.162343,
      },
      {
        sampleIndex: 1,
        fx: 15.257583,
        fy: -0.031373,
        fz: -3.076787,
        mx: -0.038913,
        my: -0.011052,
        mz: -0.162602,
      },
    ]);
  });

  test("converts force samples into one-second window features", () => {
    const run = createForceRun(
      [
        "CH1;CH2;CH3;CH4;CH5;CH6",
        "0=3,0,4,0.1,0.2,0.3",
        "1=3,0,4,0.1,0.2,0.3",
        "2=0,5,0,0.2,0.1,0.3",
        "3=0,5,0,0.2,0.1,0.3",
      ].join("\n"),
      {
        id: "force-unit",
        label: "force unit",
        condition: "synthetic",
        file: "force.txt",
        sampleRateHz: 2,
        windowSeconds: 1,
      },
    );

    expect(run.summary).toMatchObject({
      sampleCount: 4,
      windowCount: 2,
      durationSeconds: 2,
      sampleRateHz: 2,
      forceUnit: "N",
      torqueUnit: "Nm",
    });
    expect(run.windows[0]).toMatchObject({
      startTimeS: 0,
      endTimeS: 1,
      meanFx: 3,
      meanFy: 0,
      meanFz: 4,
      meanForceN: 5,
      dominantForceAxis: "Fz",
    });
    expect(run.windows[1]).toMatchObject({
      meanFx: 0,
      meanFy: 5,
      meanFz: 0,
      meanForceN: 5,
      dominantForceAxis: "Fy",
    });
  });

  test("builds a force replay payload for M8229/iDAS imports", () => {
    const run = createForceRun(
      [
        "CH1;CH2;CH3;CH4;CH5;CH6",
        "0=1,2,3,0.1,0.2,0.3",
      ].join("\n"),
      {
        id: "qingya",
        label: "10sqingya",
        condition: "iDAS import",
        file: "10sqingya.txt",
        sampleRateHz: 188,
      },
    );

    const payload = createForceReplayPayload([run], {
      source: "local iDAS six-axis force import",
      preferredRunId: "qingya",
    });

    expect(payload).toMatchObject({
      source: "local iDAS six-axis force import",
      sensor: "M3553C",
      acquisitionDevice: "M8229",
      preferredRunId: "qingya",
      forceUnit: "N",
      torqueUnit: "Nm",
      channelMap: {
        CH1: "Fx",
        CH2: "Fy",
        CH3: "Fz",
        CH4: "Mx",
        CH5: "My",
        CH6: "Mz",
      },
    });
    expect(payload.runs[0].windows).toHaveLength(1);
  });
});
