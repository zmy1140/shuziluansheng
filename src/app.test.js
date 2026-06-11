/* @vitest-environment jsdom */

import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";
import { createAppShell } from "./app.js";

describe("createAppShell", () => {
  test("renders the local monitoring shell with navigation and offline panels", () => {
    const shell = createAppShell();

    expect(shell.querySelector("[data-scene-root]")).not.toBeNull();
    expect(shell.querySelector("[data-upload-input]")).not.toBeNull();
    expect(shell.querySelector("[data-fit-view-button]")).not.toBeNull();
    expect(shell.querySelectorAll("[data-view-target]")).toHaveLength(6);
    expect(shell.querySelector("[data-view-panel='overview']")).not.toBeNull();
    expect(shell.querySelector("[data-view-panel='force']")).not.toBeNull();
    expect(shell.textContent).toContain("数字孪生磨抛监测系统");
    expect(shell.textContent).toContain("工况总览");
    expect(shell.textContent).toContain("切削力");
    expect(shell.textContent).toContain("振动分析");
    expect(shell.textContent).toContain("声发射");
    expect(shell.textContent).toContain("主轴状态");
    expect(shell.textContent).toContain("粗糙度预测");
    expect(shell.textContent).toContain("UDP通信");
    expect(shell.textContent).toContain("本地离线");
  });

  test("renders overview real-time trend as four labeled signal series", () => {
    const shell = createAppShell();
    const overview = shell.querySelector("[data-view-panel='overview']");
    const trend = overview.querySelector("[data-trend-panel='multi-signal']");

    expect(trend).not.toBeNull();
    expect(trend.querySelectorAll("[data-trend-path]")).toHaveLength(4);
    expect(trend.textContent).toContain("力");
    expect(trend.textContent).toContain("振动");
    expect(trend.textContent).toContain("声发射");
    expect(trend.textContent).toContain("Ra预测");
  });

  test("keeps roughness access status in the metric card instead of a duplicate side panel", () => {
    const shell = createAppShell();
    const overview = shell.querySelector("[data-view-panel='overview']");
    const roughnessMetric = overview.querySelector("[data-roughness-value]").closest(".metric-card");

    expect(overview.querySelector(".prediction-panel")).toBeNull();
    expect(overview.textContent).not.toContain("预测状态");
    expect(roughnessMetric.textContent).toContain("本地模拟");
    expect(roughnessMetric.textContent).toContain("模型未接入");
  });

  test("renders processing demo controls and temperature field explanation", () => {
    const shell = createAppShell();
    const overview = shell.querySelector("[data-view-panel='overview']");

    expect(overview.querySelector("[data-processing-speed]")).not.toBeNull();
    expect(overview.querySelector("[data-processing-reset]")).not.toBeNull();
    expect(overview.textContent).toContain("局部打磨温度场演示");
    expect(overview.textContent).toContain("一条直线打磨路径");
    expect(overview.textContent).toContain("演示温度场");
    expect(overview.textContent).toContain("不代表真实打磨温度或真实Abaqus结果");
  });

  test("renders temperature color mapping prototype status as replaceable demo data", () => {
    const shell = createAppShell();
    const overview = shell.querySelector("[data-view-panel='overview']");

    expect(overview.querySelector("[data-simulation-status]")).not.toBeNull();
    expect(overview.textContent).toContain("温度场颜色映射原型");
    expect(overview.textContent).toContain("演示温度场 JSON");
    expect(overview.textContent).toContain("同格式温度 JSON 直接替换");
  });

  test("uses signal-specific legend color selectors", () => {
    const css = readFileSync("src/style.css", "utf8");

    expect(css).toContain(".trend-legend .series-key--force");
    expect(css).toContain(".trend-legend .series-key--vibration");
    expect(css).toContain(".trend-legend .series-key--acoustic");
    expect(css).toContain(".trend-legend .series-key--roughness");
  });

  test("marks UDP communication panel as a reserved interface placeholder", () => {
    const shell = createAppShell();

    expect(shell.textContent).toContain("UDP通信");
    expect(shell.textContent).toContain("接口预留");
    expect(shell.textContent).toContain("当前未接入真实设备");
  });

  test("keeps overview compact without reducing the 3D viewport height", () => {
    const shell = createAppShell();
    const overview = shell.querySelector("[data-view-panel='overview']");
    const sideStack = overview.querySelector(".overview-side-stack");
    const inspector = shell.querySelector(".inspector");
    const css = readFileSync("src/style.css", "utf8");

    expect(sideStack).not.toBeNull();
    expect(sideStack.querySelector("[data-trend-panel='multi-signal']")).not.toBeNull();
    expect(sideStack.textContent).not.toContain("报警与事件");
    expect(inspector.textContent).toContain("报警与事件");
    expect(css).toContain("height: 430px;");
    expect(css).not.toContain("height: 300px;");
  });

  test("renders right inspector panels as collapsed details", () => {
    const shell = createAppShell();
    const inspector = shell.querySelector(".inspector");
    const panels = inspector.querySelectorAll("details.inspector-panel");

    expect(panels).toHaveLength(4);
    expect([...panels].every((panel) => !panel.hasAttribute("open"))).toBe(true);
    expect(inspector.textContent).toContain("UDP通信");
    expect(inspector.textContent).toContain("报警阈值");
    expect(inspector.textContent).toContain("运行状态");
    expect(inspector.textContent).toContain("报警与事件");
  });

  test("renders sensor detail pages as technical diagnostic views", () => {
    const shell = createAppShell();
    const force = shell.querySelector("[data-view-panel='force']");
    const vibration = shell.querySelector("[data-view-panel='vibration']");
    const acoustic = shell.querySelector("[data-view-panel='acoustic']");
    const spindle = shell.querySelector("[data-view-panel='spindle']");
    const roughness = shell.querySelector("[data-view-panel='roughness']");

    expect(force.textContent).toContain("重点看");
    expect(force.textContent).toContain("接触稳定性");
    expect(force.textContent).toContain("FFT优先级");
    expect(force.textContent).toContain("诊断图");

    expect(vibration.textContent).toContain("FFT频谱");
    expect(vibration.textContent).toContain("主频");
    expect(vibration.textContent).toContain("峰值因子");

    expect(acoustic.textContent).toContain("高频能量");
    expect(acoustic.textContent).toContain("突发事件");

    expect(spindle.textContent).toContain("转速偏差");
    expect(spindle.textContent).toContain("电流负载");

    expect(roughness.textContent).toContain("输入窗口");
    expect(roughness.textContent).toContain("特征摘要");
    expect(roughness.textContent).toContain("模型未接入");
  });

  test("renders real acceleration replay placeholders for YE6275D data", () => {
    const shell = createAppShell();
    const vibration = shell.querySelector("[data-view-panel='vibration']");

    expect(shell.querySelector("[data-acceleration-source]")).not.toBeNull();
    expect(shell.querySelector("[data-acceleration-window]")).not.toBeNull();
    expect(vibration.querySelector("[data-acc-rms-x]")).not.toBeNull();
    expect(vibration.querySelector("[data-acc-rms-y]")).not.toBeNull();
    expect(vibration.querySelector("[data-acc-rms-z]")).not.toBeNull();
    expect(vibration.textContent).toContain("YE6275D");
    expect(vibration.textContent).toContain("真实三轴数据回放");
    expect(vibration.textContent).toContain("未导入三轴数据");
  });

  test("renders an acceleration replay run selector", () => {
    const shell = createAppShell();
    const vibration = shell.querySelector("[data-view-panel='vibration']");
    const selector = vibration.querySelector("[data-acceleration-run-select]");

    expect(selector).not.toBeNull();
    expect(selector.getAttribute("aria-label")).toBe("选择三轴加速度回放数据");
  });

  test("starts acceleration replay in an empty import state", () => {
    const shell = createAppShell();
    const vibration = shell.querySelector("[data-view-panel='vibration']");
    const selector = vibration.querySelector("[data-acceleration-run-select]");

    expect(selector.disabled).toBe(true);
    expect(selector.options).toHaveLength(1);
    expect(selector.options[0].textContent).toBe("请先导入TXT/CSV");
    expect(vibration.textContent).toContain("未导入三轴数据");
    expect(vibration.textContent).not.toContain("手动晃动传感器（15 s）");
  });

  test("renders local acceleration file import controls", () => {
    const shell = createAppShell();
    const vibration = shell.querySelector("[data-view-panel='vibration']");
    const selectorRow = vibration.querySelector(".replay-selector");

    expect(vibration.querySelector("[data-acceleration-import-button]")).not.toBeNull();
    expect(selectorRow.querySelector("[data-acceleration-import-button]")).not.toBeNull();
    expect(vibration.querySelector(".replay-actions")).toBeNull();
    expect(vibration.querySelector("[data-acceleration-demo-button]")).toBeNull();
    expect(vibration.querySelector("[data-acceleration-file-input]")).not.toBeNull();
    expect(vibration.querySelector("[data-acceleration-file-input]").getAttribute("accept")).toContain(".txt");
    expect(vibration.querySelector("[data-acceleration-json-download]")).toBeNull();
    expect(vibration.textContent).toContain("导入TXT/CSV");
    expect(vibration.textContent).not.toContain("加载内置样例");
    expect(vibration.textContent).not.toContain("下载JSON");
  });

  test("renders local six-axis force file import controls", () => {
    const shell = createAppShell();
    const force = shell.querySelector("[data-view-panel='force']");
    const forceReplay = force.querySelector(".force-replay-panel");
    const selector = force.querySelector("[data-force-run-select]");

    expect(selector).not.toBeNull();
    expect(selector.disabled).toBe(true);
    expect(force.querySelector("[data-force-import-button]")).not.toBeNull();
    expect(force.querySelector("[data-force-file-input]")).not.toBeNull();
    expect(force.querySelector("[data-force-file-input]").getAttribute("accept")).toContain(".txt");
    expect(force.querySelector("[data-force-source]")).not.toBeNull();
    expect(forceReplay.querySelector(".detail-table")).toBeNull();
    expect(forceReplay.querySelector("[data-force-window]")).toBeNull();
    expect(forceReplay.querySelector("[data-force-fx]")).toBeNull();
    expect(forceReplay.textContent).not.toContain("合力均值");
    expect(forceReplay.textContent).not.toContain("峰峰值");
    expect(force.textContent).toContain("M8229");
  });

  test("renders vibration time-domain chart with axes and replay annotations", () => {
    const shell = createAppShell();
    const vibration = shell.querySelector("[data-view-panel='vibration']");
    const chart = vibration.querySelector("[data-vibration-wave-chart]");

    expect(chart).not.toBeNull();
    expect(chart.textContent).toContain("时间 / s");
    expect(chart.textContent).toContain("归一化幅值");
    expect(chart.textContent).toContain("0");
    expect(chart.textContent).toContain("1");
    expect(chart.textContent).toContain("X轴");
    expect(chart.textContent).toContain("Y轴");
    expect(chart.textContent).toContain("Z轴");
    expect(vibration.querySelector("[data-acc-wave-axis='x']")).not.toBeNull();
    expect(vibration.querySelector("[data-acc-wave-axis='y']")).not.toBeNull();
    expect(vibration.querySelector("[data-acc-wave-axis='z']")).not.toBeNull();
    expect(vibration.querySelector("[data-acc-wave-marker]")).not.toBeNull();
    expect(vibration.querySelector("[data-acc-wave-caption]")).not.toBeNull();
  });

  test("renders force waveform as a multi-channel scope with zoom controls", () => {
    const shell = createAppShell();
    const force = shell.querySelector("[data-view-panel='force']");
    const scope = force.querySelector("[data-force-scope-chart]");

    expect(scope).not.toBeNull();
    expect(force.querySelector("[data-force-scope-zoom-in]")).not.toBeNull();
    expect(force.querySelector("[data-force-scope-zoom-out]")).not.toBeNull();
    expect(force.querySelector("[data-force-scope-reset]")).not.toBeNull();
    expect(force.textContent).toContain("显示曲线");
    expect(force.textContent).toContain("显示设置");
    expect(force.textContent).toContain("ENG");
    expect(force.textContent).toContain("00:00:06.325");
    expect(force.textContent).toContain("CH1");
    expect(force.textContent).toContain("CH6");
    expect(force.querySelectorAll("[data-force-scope-series]")).toHaveLength(6);
  });

  test("renders force waveform hover cursor and six-channel tooltip", () => {
    const shell = createAppShell();
    const force = shell.querySelector("[data-view-panel='force']");
    const scope = force.querySelector("[data-force-scope-chart]");
    const css = readFileSync("src/style.css", "utf8");

    expect(scope.querySelector("[data-force-scope-hit-area]")).not.toBeNull();
    expect(scope.querySelector("[data-force-scope-cursor]")).not.toBeNull();
    expect(scope.querySelector("[data-force-scope-tooltip]")).not.toBeNull();
    expect(scope.querySelectorAll("[data-force-tooltip-channel]")).toHaveLength(6);
    expect(scope.querySelector("[data-force-tooltip-time]")).not.toBeNull();
    expect(css).toContain("stroke-width: 1.05");
    expect(css).toContain(".scope-hover-tooltip");
  });

  test("marks force scope table cells as live values for imported data", () => {
    const shell = createAppShell();
    const force = shell.querySelector("[data-view-panel='force']");

    expect(force.querySelectorAll("[data-force-scope-current]")).toHaveLength(6);
    expect(force.querySelectorAll("[data-force-scope-peak]")).toHaveLength(6);
    expect(force.querySelector("[data-force-scope-current='ch1']")).not.toBeNull();
    expect(force.querySelector("[data-force-scope-peak='ch6']")).not.toBeNull();
    expect(force.querySelector("[data-force-scope-note]")).not.toBeNull();
  });

  test("places force readout as a horizontal summary above the waveform", () => {
    const shell = createAppShell();
    const force = shell.querySelector("[data-view-panel='force']");
    const layout = force.querySelector(".diagnostic-layout");
    const readout = force.querySelector(".diagnostic-readout");
    const css = readFileSync("src/style.css", "utf8");

    expect(layout.classList.contains("force-layout")).toBe(true);
    expect(readout.classList.contains("compact-readout")).toBe(true);
    expect([...layout.children][0]).toBe(readout);
    expect(css).toContain(".force-layout");
    expect(css).toContain("grid-template-columns: 1fr;");
    expect(css).toContain("grid-template-columns: 150px 130px minmax(0, 1fr);");
    expect(css).toContain("grid-template-columns: repeat(6, minmax(72px, 1fr));");
    expect(css).toContain("grid-template-columns: minmax(0, 1fr) 220px;");
  });
});
