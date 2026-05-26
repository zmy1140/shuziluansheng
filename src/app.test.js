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
});
