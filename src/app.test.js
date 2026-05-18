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

  test("renders processing demo controls and roughness risk explanation", () => {
    const shell = createAppShell();
    const overview = shell.querySelector("[data-view-panel='overview']");

    expect(overview.querySelector("[data-processing-speed]")).not.toBeNull();
    expect(overview.querySelector("[data-processing-reset]")).not.toBeNull();
    expect(overview.textContent).toContain("3D加工过程演示");
    expect(overview.textContent).toContain("螺旋向内收缩轨迹");
    expect(overview.textContent).toContain("模拟粗糙度风险");
    expect(overview.textContent).toContain("不代表真实Ra预测或真实仿真结果");
  });

  test("renders Abaqus color mapping prototype status as non-real-process evidence", () => {
    const shell = createAppShell();
    const overview = shell.querySelector("[data-view-panel='overview']");

    expect(overview.querySelector("[data-simulation-status]")).not.toBeNull();
    expect(overview.textContent).toContain("仿真结果颜色映射原型");
    expect(overview.textContent).toContain("Mises应力/位移幅值");
    expect(overview.textContent).toContain("简化厚板算例");
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
