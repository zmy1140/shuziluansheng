import "./style.css";
import { createAppShell } from "./app.js";
import { setupScene } from "./scene.js";

const app = document.querySelector("#app");
const shell = createAppShell();
app.replaceChildren(shell);

const sceneRoot = shell.querySelector("[data-scene-root]");
const uploadInput = shell.querySelector("[data-upload-input]");
const modelStatus = shell.querySelector("[data-model-status]");
const modelOverlay = shell.querySelector("[data-model-overlay]");
const fitViewButton = shell.querySelector("[data-fit-view-button]");
const processingSpeed = shell.querySelector("[data-processing-speed]");
const processingReset = shell.querySelector("[data-processing-reset]");
const simulationStatus = shell.querySelector("[data-simulation-status]");
const activeTitle = shell.querySelector("[data-active-title]");
const viewTargets = [...shell.querySelectorAll("[data-view-target]")];
const viewPanels = [...shell.querySelectorAll("[data-view-panel]")];

let modelStatusTimer;

function showModelStatus(message, { persist = false } = {}) {
  window.clearTimeout(modelStatusTimer);
  modelStatus.textContent = message;
  modelOverlay.classList.remove("is-hidden");

  if (!persist) {
    modelStatusTimer = window.setTimeout(() => {
      modelOverlay.classList.add("is-hidden");
    }, 3600);
  }
}

const {
  loadLocalModel,
  loadDefaultToolModel,
  applyToolPath,
  fitActiveObjectToView,
  setProcessingSpeed,
  resetProcessingDemo,
  applySimulationResult,
} = setupScene(
  sceneRoot,
  modelStatus,
  showModelStatus,
);

loadDefaultToolModel();

function setActiveView(view) {
  viewTargets.forEach((button) => {
    button.classList.toggle("active", button.dataset.viewTarget === view);
  });
  viewPanels.forEach((panel) => {
    panel.classList.toggle("active", panel.dataset.viewPanel === view);
  });

  const activeButton = viewTargets.find((button) => button.dataset.viewTarget === view);
  activeTitle.textContent = activeButton?.querySelector("strong")?.textContent ?? "工况总览";

  if (view === "overview") {
    requestAnimationFrame(() => fitActiveObjectToView(false));
  }
}

viewTargets.forEach((button) => {
  button.addEventListener("click", () => setActiveView(button.dataset.viewTarget));
});

window.setTimeout(() => {
  modelOverlay.classList.add("is-hidden");
}, 1000);

uploadInput.addEventListener("change", (event) => {
  const [file] = event.target.files ?? [];
  if (!file) {
    return;
  }

  setActiveView("overview");
  showModelStatus(`正在加载：${file.name}`, { persist: true });
  loadLocalModel(file);
});

fitViewButton.addEventListener("click", () => {
  fitActiveObjectToView();
});

processingSpeed.addEventListener("change", () => {
  setProcessingSpeed(Number(processingSpeed.value));
});

processingReset.addEventListener("click", () => {
  resetProcessingDemo();
});

fetch("/paths/line_grinding_path.json")
  .then((response) => {
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return response.json();
  })
  .then((pathPayload) => {
    applyToolPath(pathPayload);
  })
  .catch(() => {
    simulationStatus.querySelector("span").textContent =
      "未载入路径文件，当前使用内置直线打磨路径。";
  });

fetch("/simulation/temperature_demo.json")
  .then((response) => {
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return response.json();
  })
  .then((result) => {
    applySimulationResult(result);
    simulationStatus.querySelector("span").textContent =
      `已载入${result.source ?? "演示温度场"}：${result.valueLabel ?? "温度"}，仅用于前端颜色渲染链路验证。`;
  })
  .catch(() => {
    simulationStatus.querySelector("span").textContent =
      "未载入本地温度场样例，当前颜色先由路径经过位置的演示热量驱动。";
  });

const metricNodes = {
  force: shell.querySelector("[data-force-value]"),
  forceDetail: shell.querySelector("[data-force-detail]"),
  forceDetailValue: shell.querySelector("[data-force-detail-value]"),
  vibration: shell.querySelector("[data-vibration-value]"),
  vibrationDetail: shell.querySelector("[data-vibration-detail]"),
  vibrationDetailValue: shell.querySelector("[data-vibration-detail-value]"),
  ae: shell.querySelector("[data-ae-value]"),
  aeDetail: shell.querySelector("[data-ae-detail]"),
  aeDetailValue: shell.querySelector("[data-ae-detail-value]"),
  speedDetailValue: shell.querySelector("[data-speed-detail-value]"),
  roughness: shell.querySelector("[data-roughness-value]"),
  roughnessLarge: shell.querySelector("[data-roughness-large]"),
  roughnessDetailValue: shell.querySelector("[data-roughness-detail-value]"),
  runtime: shell.querySelector("[data-runtime]"),
  trends: [...shell.querySelectorAll("[data-trend-path]")],
};

let step = 0;
setInterval(() => {
  step += 1;

  const force = 124 + Math.sin(step * 0.45) * 10;
  const vibration = 0.36 + ((Math.sin(step * 0.38) + 1) * 0.1);
  const ae = 29 + ((Math.cos(step * 0.42) + 1) * 3.6);
  const speed = 3200 + Math.sin(step * 0.25) * 120;
  const roughness = 1.54 + Math.sin(step * 0.3) * 0.12;
  const runtimeSeconds = 91 + step * 2;

  metricNodes.force.textContent = force.toFixed(0);
  metricNodes.forceDetail.textContent = `Fx ${(force * 0.36).toFixed(0)} N / Fy ${(force * 0.24).toFixed(0)} N / Fz ${(force * 0.84).toFixed(0)} N`;
  metricNodes.forceDetailValue.textContent = force.toFixed(0);

  metricNodes.vibration.textContent = vibration.toFixed(2);
  metricNodes.vibrationDetail.textContent = `峰值 ${(vibration * 1.72).toFixed(2)} g / 主频 116 Hz`;
  metricNodes.vibrationDetailValue.textContent = vibration.toFixed(2);

  metricNodes.ae.textContent = ae.toFixed(0);
  metricNodes.aeDetail.textContent = `能量 ${(ae / 34).toFixed(2)} V²·s / 计数 ${Math.round(210 + ae * 1.2)}`;
  metricNodes.aeDetailValue.textContent = ae.toFixed(0);

  metricNodes.speedDetailValue.textContent = speed.toFixed(0);

  const roughnessText = `Ra ${roughness.toFixed(2)}`;
  metricNodes.roughness.textContent = roughnessText;
  if (metricNodes.roughnessLarge) {
    metricNodes.roughnessLarge.textContent = roughnessText;
  }
  metricNodes.roughnessDetailValue.textContent = roughnessText;

  const minutes = Math.floor(runtimeSeconds / 60);
  const seconds = runtimeSeconds % 60;
  metricNodes.runtime.textContent = `00:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  metricNodes.trends.forEach((path, index) => {
    const signalPreset = {
      force: { base: 92, amplitude: 28, phase: 0 },
      vibration: { base: 118, amplitude: 20, phase: 0.8 },
      acoustic: { base: 140, amplitude: 16, phase: 1.45 },
      roughness: { base: 64, amplitude: 10, phase: 2.1 },
    }[path.dataset.trendSignal] ?? { base: 108, amplitude: 30, phase: index * 0.4 };

    const phase = step * 0.15 + signalPreset.phase;
    const y1 = signalPreset.base - Math.sin(phase) * signalPreset.amplitude;
    const y2 = signalPreset.base - Math.cos(phase * 1.2) * signalPreset.amplitude * 0.85;
    const y3 = signalPreset.base - Math.sin(phase * 1.7) * signalPreset.amplitude * 0.95;
    path.setAttribute("d", `M0 ${y1.toFixed(0)} C90 76 140 ${y3.toFixed(0)} 220 ${y2.toFixed(0)} S360 72 440 ${y1.toFixed(0)} 540 ${y3.toFixed(0)} 600 ${y2.toFixed(0)}`);
  });
}, 1600);
