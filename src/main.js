import "./style.css";
import { createAppShell } from "./app.js";
import { setupScene } from "./scene.js";
import {
  createAccelerationReplayPayload,
  createAccelerationRun,
  createForceReplayPayload,
  createForceRun,
} from "./sensor-data.js";
import { loadTemperatureField } from "./temperature-source.js";

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
  loadDefaultWorkpieceModel,
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

loadDefaultWorkpieceModel();
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

loadTemperatureField({
  applySimulationResult,
  statusText: simulationStatus.querySelector("span"),
})
  .catch(() => {
    simulationStatus.querySelector("span").textContent =
      "未载入本地温度场样例，当前颜色先由路径经过位置的演示热量驱动。";
  });

let accelerationReplay;
const accelerationRunSelect = shell.querySelector("[data-acceleration-run-select]");
const accelerationImportButton = shell.querySelector("[data-acceleration-import-button]");
const accelerationFileInput = shell.querySelector("[data-acceleration-file-input]");
const accelerationImportStatus = shell.querySelector("[data-acceleration-import-status]");

let forceReplay;
const forceRunSelect = shell.querySelector("[data-force-run-select]");
const forceImportButton = shell.querySelector("[data-force-import-button]");
const forceFileInput = shell.querySelector("[data-force-file-input]");
const forceImportStatus = shell.querySelector("[data-force-import-status]");

function setAccelerationRun(runId) {
  if (!accelerationReplay?.payload?.runs?.length) {
    return;
  }

  const selectedRun =
    accelerationReplay.payload.runs.find((run) => run.id === runId) ??
    accelerationReplay.payload.runs[0];

  accelerationReplay.run = selectedRun;
  if (accelerationRunSelect) {
    accelerationRunSelect.value = selectedRun.id;
  }
  step = 0;
}

function setAccelerationPayload(payload, preferredRunId = payload.preferredRunId) {
  const preferredRun =
    payload.runs?.find((run) => run.id === preferredRunId) ??
    payload.runs?.[0];

  if (!preferredRun?.windows?.length) {
    throw new Error("empty acceleration replay payload");
  }

  accelerationReplay = {
    payload: {
      ...payload,
      preferredRunId: preferredRun.id,
    },
    run: preferredRun,
  };

  if (accelerationRunSelect) {
    accelerationRunSelect.replaceChildren(
      ...payload.runs.map((run) => {
        const option = document.createElement("option");
        option.value = run.id;
        option.textContent = `${run.label}（${run.summary.durationSeconds.toFixed(0)} s）`;
        option.selected = run.id === preferredRun.id;
        return option;
      }),
    );
    accelerationRunSelect.disabled = false;
  }

  step = 0;
}

function cacheKeyForAccelerationFile(file) {
  return `acceleration-features:${file.name}:${file.size}:${file.lastModified}`;
}

function cacheImportedPayload(file, payload) {
  try {
    localStorage.setItem(cacheKeyForAccelerationFile(file), JSON.stringify(payload));
  } catch {
    // Local storage is optional; imported data can still be replayed this session.
  }
}

function readCachedImportedPayload(file) {
  try {
    const cached = localStorage.getItem(cacheKeyForAccelerationFile(file));
    return cached ? JSON.parse(cached) : null;
  } catch {
    return null;
  }
}

function setForceRun(runId) {
  if (!forceReplay?.payload?.runs?.length) {
    return;
  }

  const selectedRun =
    forceReplay.payload.runs.find((run) => run.id === runId) ??
    forceReplay.payload.runs[0];

  forceReplay.run = selectedRun;
  if (forceRunSelect) {
    forceRunSelect.value = selectedRun.id;
  }
  step = 0;
  startForceScopePlayback(selectedRun);
}

function setForcePayload(payload, preferredRunId = payload.preferredRunId) {
  const preferredRun =
    payload.runs?.find((run) => run.id === preferredRunId) ??
    payload.runs?.[0];

  if (!preferredRun?.windows?.length) {
    throw new Error("empty force replay payload");
  }

  forceReplay = {
    payload: {
      ...payload,
      preferredRunId: preferredRun.id,
    },
    run: preferredRun,
  };

  if (forceRunSelect) {
    forceRunSelect.replaceChildren(
      ...payload.runs.map((run) => {
        const option = document.createElement("option");
        option.value = run.id;
        option.textContent = `${run.label}（${run.summary.durationSeconds.toFixed(1)} s）`;
        option.selected = run.id === preferredRun.id;
        return option;
      }),
    );
    forceRunSelect.disabled = false;
  }

  step = 0;
  startForceScopePlayback(preferredRun);
}

function cacheKeyForForceFile(file) {
  return `force-features:${file.name}:${file.size}:${file.lastModified}:200hz:smooth-trace-v3`;
}

function cacheImportedForcePayload(file, payload) {
  try {
    localStorage.setItem(cacheKeyForForceFile(file), JSON.stringify(payload));
  } catch {
    // Local storage is optional; imported data can still be replayed this session.
  }
}

function readCachedImportedForcePayload(file) {
  try {
    const cached = localStorage.getItem(cacheKeyForForceFile(file));
    return cached ? JSON.parse(cached) : null;
  } catch {
    return null;
  }
}

accelerationRunSelect?.addEventListener("change", () => {
  setAccelerationRun(accelerationRunSelect.value);
});

accelerationImportButton?.addEventListener("click", () => {
  accelerationFileInput?.click();
});

accelerationFileInput?.addEventListener("change", async (event) => {
  const [file] = event.target.files ?? [];
  if (!file) {
    return;
  }

  try {
    if (accelerationImportStatus) {
      accelerationImportStatus.textContent = `正在读取 ${file.name}...`;
    }
    let payload = readCachedImportedPayload(file);

    if (!payload) {
      const run = createAccelerationRun(await file.text(), {
        id: `imported:${file.name}`,
        label: file.name,
        condition: "本地导入",
        file: file.name,
        sampleRateHz: 1600,
        windowSeconds: 1,
      });
      payload = createAccelerationReplayPayload([run], {
        source: "本地导入三轴加速度数据",
        preferredRunId: run.id,
      });
      cacheImportedPayload(file, payload);
      if (accelerationImportStatus) {
        accelerationImportStatus.textContent =
          `已导入 ${file.name}，浏览器已缓存该文件特征。`;
      }
    } else {
      if (accelerationImportStatus) {
        accelerationImportStatus.textContent =
          `已从浏览器缓存载入 ${file.name}。`;
      }
    }

    setAccelerationPayload(payload);
  } catch (error) {
    if (accelerationImportStatus) {
      accelerationImportStatus.textContent =
        `导入失败：${error instanceof Error ? error.message : "文件格式无法识别"}`;
    }
  } finally {
    event.target.value = "";
  }
});

forceRunSelect?.addEventListener("change", () => {
  setForceRun(forceRunSelect.value);
});

forceImportButton?.addEventListener("click", () => {
  forceFileInput?.click();
});

forceFileInput?.addEventListener("change", async (event) => {
  const [file] = event.target.files ?? [];
  if (!file) {
    return;
  }

  try {
    if (forceImportStatus) {
      forceImportStatus.textContent = `正在读取 ${file.name}...`;
    }
    let payload = readCachedImportedForcePayload(file);

    if (!payload) {
      const run = createForceRun(await file.text(), {
        id: `imported:${file.name}`,
        label: file.name,
        condition: "本地 iDAS 导入",
        file: file.name,
        sampleRateHz: 200,
        windowSeconds: 1,
      });
      payload = createForceReplayPayload([run], {
        source: "本地导入 iDAS 六维力数据",
        preferredRunId: run.id,
        sampleRateHz: 200,
      });
      cacheImportedForcePayload(file, payload);
      if (forceImportStatus) {
        forceImportStatus.textContent =
          `已导入 ${file.name}，按 200 Hz 生成窗口特征并缓存。`;
      }
    } else if (forceImportStatus) {
      forceImportStatus.textContent =
        `已从浏览器缓存载入 ${file.name}。`;
    }

    setForcePayload(payload);
  } catch (error) {
    if (forceImportStatus) {
      forceImportStatus.textContent =
        `导入失败：${error instanceof Error ? error.message : "文件格式无法识别"}`;
    }
  } finally {
    event.target.value = "";
  }
});

const forceScopeViewport = shell.querySelector("[data-force-scope-viewport]");
const forceScopeWindow = shell.querySelector("[data-force-scope-window]");
const forceScopeTimeLabels = new Map(
  [...shell.querySelectorAll("[data-force-scope-time-label]")].map((node) => [
    node.dataset.forceScopeTimeLabel,
    node,
  ]),
);
const forceScopeZoomIn = shell.querySelector("[data-force-scope-zoom-in]");
const forceScopeZoomOut = shell.querySelector("[data-force-scope-zoom-out]");
const forceScopeReset = shell.querySelector("[data-force-scope-reset]");
const forceScopeChart = shell.querySelector("[data-force-scope-chart]");
const forceScopeHitArea = shell.querySelector("[data-force-scope-hit-area]");
const forceScopeCursor = shell.querySelector("[data-force-scope-cursor]");
const forceScopeTooltip = shell.querySelector("[data-force-scope-tooltip]");
const forceTooltipTime = shell.querySelector("[data-force-tooltip-time]");
const forceScopeNote = shell.querySelector("[data-force-scope-note]");
const forceTooltipValues = new Map(
  [...shell.querySelectorAll("[data-force-tooltip-value]")].map((node) => [
    node.dataset.forceTooltipValue,
    node,
  ]),
);
const forceTooltipDots = new Map(
  [...shell.querySelectorAll("[data-force-tooltip-dot]")].map((node) => [
    node.dataset.forceTooltipDot,
    node,
  ]),
);
const forceScopeSeries = new Map(
  [...shell.querySelectorAll("[data-force-scope-series]")].map((node) => [
    node.dataset.forceScopeSeries,
    node,
  ]),
);
const forceScopeCurrentValues = new Map(
  [...shell.querySelectorAll("[data-force-scope-current]")].map((node) => [
    node.dataset.forceScopeCurrent,
    node,
  ]),
);
const forceScopePeakValues = new Map(
  [...shell.querySelectorAll("[data-force-scope-peak]")].map((node) => [
    node.dataset.forceScopePeak,
    node,
  ]),
);
let forceScopeZoom = 1;
let activeForceScopeWindow;
let activeForceScopeRun;
let forceScopeAnimationId;
let forceScopePlaybackStartedAt;

const forceScopeLanes = {
  ch1: 72,
  ch2: 104,
  ch3: 136,
  ch4: 168,
  ch5: 200,
  ch6: 232,
};

const defaultForceScopeNote = forceScopeNote?.textContent ?? "";
const forceScopeBaseWindowSeconds = 1;
const forceScopeSampleCount = 220;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function forceScopeValue(channelId, t) {
  const traceValue = traceValueAt(activeForceScopeWindow?.[channelId], t);
  if (traceValue !== undefined) {
    return traceValue;
  }

  const ripple = Math.sin(t * 620) * 0.18 + Math.sin(t * 1040) * 0.08;
  if (channelId === "ch1") {
    return 14.8 + Math.sin(t * 10.5) * 1.1 + Math.exp(-t * 12) * Math.sin(t * 58) * 0.55 + ripple;
  }
  if (channelId === "ch2") {
    const earlyDrop = 13.8 / (1 + Math.exp(-(t - 0.15) * 42));
    const valley = 13.5 * Math.exp(-(((t - 0.67) / 0.13) ** 2));
    return 13.2 - earlyDrop - valley + Math.sin(t * 32) * 0.45 + ripple * 1.1;
  }
  if (channelId === "ch3") {
    return -3.3 - Math.exp(-(((t - 0.45) / 0.2) ** 2)) * 1.55 + Math.sin(t * 28) * 0.28 + ripple * 0.55;
  }
  if (channelId === "ch4") {
    return -0.04 + Math.sin(t * 38) * 0.12 + ripple * 0.12;
  }
  if (channelId === "ch5") {
    return -0.12 + Math.cos(t * 34) * 0.1 + ripple * 0.1;
  }
  return -0.14 + Math.sin(t * 36 + 1.2) * 0.08 + ripple * 0.08;
}

function forceScopeY(value) {
  return clamp(161 - value * 5.1, 34, 244);
}

function mean(values) {
  if (!values.length) {
    return 0;
  }
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function peakToPeak(values) {
  if (!values.length) {
    return 0;
  }
  return Math.max(...values) - Math.min(...values);
}

function traceValueAt(values, t) {
  if (!values?.length) {
    return undefined;
  }

  if (values.length === 1) {
    return values[0];
  }

  const exactIndex = clamp(t, 0, 1) * (values.length - 1);
  const lowIndex = Math.floor(exactIndex);
  const highIndex = Math.min(values.length - 1, lowIndex + 1);
  const ratio = exactIndex - lowIndex;
  return values[lowIndex] + (values[highIndex] - values[lowIndex]) * ratio;
}

function formatScopeTime(t) {
  const seconds = Math.max(0, t);
  return `00:00:${seconds.toFixed(3).padStart(6, "0")}`;
}

function forceScopeDisplayY(channelId, value) {
  const trace = activeForceScopeWindow?.[channelId];
  if (!trace?.length) {
    return forceScopeY(value);
  }

  const center = mean(trace);
  const maxDeviation = Math.max(
    ...trace.map((sample) => Math.abs(sample - center)),
    Math.abs(value - center),
    1e-6,
  );
  return clamp(forceScopeLanes[channelId] - ((value - center) / maxDeviation) * 20, 34, 244);
}

function forceScopePath(channelId) {
  return Array.from({ length: 150 }, (_, index) => {
    const t = index / 149;
    const x = 70 + t * 560;
    const value = forceScopeValue(channelId, t);
    const y = forceScopeDisplayY(channelId, value);
    return `${index === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join(" ");
}

function forceTraceValueAt(run, channelId, timeSeconds) {
  const values = run?.trace?.[channelId];
  if (!values?.length) {
    return undefined;
  }

  if (values.length === 1) {
    return values[0];
  }

  const duration = run.summary.durationSeconds || values.length / run.sampleRateHz;
  const wrappedTime = ((timeSeconds % duration) + duration) % duration;
  const exactIndex = wrappedTime * run.sampleRateHz;
  const lowIndex = Math.floor(exactIndex) % values.length;
  const highIndex = (lowIndex + 1) % values.length;
  const ratio = exactIndex - Math.floor(exactIndex);
  return values[lowIndex] + (values[highIndex] - values[lowIndex]) * ratio;
}

function buildForceVisibleTrace(run, channelId, startSeconds, visibleSeconds) {
  return Array.from({ length: forceScopeSampleCount }, (_, index) => {
    const ratio = index / (forceScopeSampleCount - 1);
    return forceTraceValueAt(run, channelId, startSeconds + ratio * visibleSeconds);
  }).filter((value) => value !== undefined);
}

function setForceScopeTimeLabels(startSeconds, visibleSeconds) {
  forceScopeTimeLabels.get("start")?.replaceChildren(formatScopeTime(startSeconds));
  forceScopeTimeLabels.get("middle")?.replaceChildren(formatScopeTime(startSeconds + visibleSeconds / 2));
  forceScopeTimeLabels.get("end")?.replaceChildren(formatScopeTime(startSeconds + visibleSeconds));
}

function updateForceScopeFromRun(run, playbackSeconds) {
  if (!run?.trace) {
    return;
  }

  const duration = run.summary.durationSeconds || run.trace.ch1.length / run.sampleRateHz;
  const visibleSeconds = forceScopeBaseWindowSeconds / forceScopeZoom;
  const startSeconds = playbackSeconds % duration;
  activeForceScopeWindow = Object.fromEntries(
    Object.keys(run.trace).map((channelId) => [
      channelId,
      buildForceVisibleTrace(run, channelId, startSeconds, visibleSeconds),
    ]),
  );

  forceScopeSeries.forEach((node, channelId) => {
    node.setAttribute("d", forceScopePath(channelId));
  });

  Object.entries(activeForceScopeWindow).forEach(([channelId, values]) => {
    const latestValue = values[values.length - 1];
    forceScopeCurrentValues.get(channelId)?.replaceChildren(latestValue.toFixed(3));
    forceScopePeakValues.get(channelId)?.replaceChildren(peakToPeak(values).toFixed(3));
  });

  setForceScopeTimeLabels(startSeconds, visibleSeconds);
  if (forceScopeWindow) {
    forceScopeWindow.textContent =
      `${(visibleSeconds / 5).toFixed(2)} s/div`;
  }
  if (forceScopeNote) {
    forceScopeNote.textContent =
      "已按整段 iDAS 数据连续滚动显示 CH1-CH6 曲线；时间轴和曲线随播放时间平滑向左推进。";
  }
}

function runForceScopeAnimation(timestamp) {
  if (!activeForceScopeRun) {
    forceScopeAnimationId = undefined;
    return;
  }

  if (forceScopePlaybackStartedAt === undefined) {
    forceScopePlaybackStartedAt = timestamp;
  }

  updateForceScopeFromRun(activeForceScopeRun, (timestamp - forceScopePlaybackStartedAt) / 1000);
  forceScopeAnimationId = requestAnimationFrame(runForceScopeAnimation);
}

function startForceScopePlayback(run) {
  activeForceScopeRun = run?.trace ? run : undefined;
  forceScopePlaybackStartedAt = undefined;
  if (activeForceScopeRun && forceScopeAnimationId === undefined) {
    forceScopeAnimationId = requestAnimationFrame(runForceScopeAnimation);
  }
}

function resetForceScopeNote() {
  if (!activeForceScopeWindow && forceScopeNote) {
    forceScopeNote.textContent = defaultForceScopeNote;
  }
}

function updateForceScopeHover(clientX) {
  if (!forceScopeChart || !forceScopeCursor || !forceScopeTooltip) {
    return;
  }

  const bounds = forceScopeChart.getBoundingClientRect();
  const svgX = ((clientX - bounds.left) / bounds.width) * 720;
  const x = clamp(svgX, 70, 630);
  const t = (x - 70) / 560;
  const tooltipX = x > 500 ? x - 132 : x + 12;

  forceScopeCursor.setAttribute("opacity", "1");
  forceScopeCursor.setAttribute("transform", `translate(${x.toFixed(1)} 0)`);
  forceScopeTooltip.setAttribute("opacity", "1");
  forceScopeTooltip.setAttribute("transform", `translate(${tooltipX.toFixed(1)} 46)`);
  if (forceTooltipTime) {
    forceTooltipTime.textContent = formatScopeTime(t);
  }

  forceTooltipValues.forEach((node, channelId) => {
    const value = forceScopeValue(channelId, t);
    node.textContent = value.toFixed(2);
    forceTooltipDots.get(channelId)?.setAttribute("cy", forceScopeDisplayY(channelId, value).toFixed(1));
  });
}

function hideForceScopeHover() {
  forceScopeCursor?.setAttribute("opacity", "0");
  forceScopeTooltip?.setAttribute("opacity", "0");
}

function setForceScopeZoom(nextZoom) {
  forceScopeZoom = Math.min(4, Math.max(0.5, nextZoom));
  forceScopeViewport?.setAttribute(
    "transform",
    `translate(70 0) scale(${forceScopeZoom.toFixed(2)} 1) translate(-70 0)`,
  );
  if (forceScopeWindow) {
    forceScopeWindow.textContent = `${(10 / forceScopeZoom).toFixed(forceScopeZoom === 1 ? 0 : 1)} s/div`;
  }
}

forceScopeZoomIn?.addEventListener("click", () => {
  setForceScopeZoom(forceScopeZoom * 1.25);
});

forceScopeZoomOut?.addEventListener("click", () => {
  setForceScopeZoom(forceScopeZoom / 1.25);
});

forceScopeReset?.addEventListener("click", () => {
  setForceScopeZoom(1);
});

forceScopeHitArea?.addEventListener("pointermove", (event) => {
  updateForceScopeHover(event.clientX);
});

forceScopeHitArea?.addEventListener("pointerleave", hideForceScopeHover);

const metricNodes = {
  force: shell.querySelector("[data-force-value]"),
  forceDetail: shell.querySelector("[data-force-detail]"),
  forceDetailValue: shell.querySelector("[data-force-detail-value]"),
  forceSource: [...shell.querySelectorAll("[data-force-source]")],
  forceWindow: [...shell.querySelectorAll("[data-force-window]")],
  forceFx: [...shell.querySelectorAll("[data-force-fx]")],
  forceFy: [...shell.querySelectorAll("[data-force-fy]")],
  forceFz: [...shell.querySelectorAll("[data-force-fz]")],
  forceMean: [...shell.querySelectorAll("[data-force-mean]")],
  forceP2p: [...shell.querySelectorAll("[data-force-p2p]")],
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
  accelerationSource: [...shell.querySelectorAll("[data-acceleration-source]")],
  accelerationWindow: [...shell.querySelectorAll("[data-acceleration-window]")],
  accRmsX: [...shell.querySelectorAll("[data-acc-rms-x]")],
  accRmsY: [...shell.querySelectorAll("[data-acc-rms-y]")],
  accRmsZ: [...shell.querySelectorAll("[data-acc-rms-z]")],
  accVectorRms: [...shell.querySelectorAll("[data-acc-vector-rms]")],
  accPeakAbs: [...shell.querySelectorAll("[data-acc-peak-abs]")],
  accPeakToPeak: [...shell.querySelectorAll("[data-acc-peak-to-peak]")],
  accDominantAxis: [...shell.querySelectorAll("[data-acc-dominant-axis]")],
  accSampleRate: [...shell.querySelectorAll("[data-acc-sample-rate]")],
  accWaveX: shell.querySelector("[data-acc-wave-axis='x']"),
  accWaveY: shell.querySelector("[data-acc-wave-axis='y']"),
  accWaveZ: shell.querySelector("[data-acc-wave-axis='z']"),
  accWaveMarker: shell.querySelector("[data-acc-wave-marker]"),
  accWaveCaption: shell.querySelector("[data-acc-wave-caption]"),
};

function setAll(nodes, text) {
  nodes.forEach((node) => {
    node.textContent = text;
  });
}

function vibrationWavePath(axisRms, phase, bias = 0) {
  const amplitude = Math.min(44, 16 + axisRms * 68);
  const center = 108 + bias;
  const y1 = center - Math.sin(phase) * amplitude * 0.48;
  const y2 = center - Math.cos(phase * 1.25) * amplitude * 0.82;
  const y3 = center + Math.sin(phase * 1.65) * amplitude * 0.62;
  const y4 = center - Math.cos(phase * 0.85) * amplitude * 0.52;

  return `M70 ${y1.toFixed(1)} C145 ${y2.toFixed(1)} 197 ${y3.toFixed(1)} 270 ${y4.toFixed(1)} S410 ${y2.toFixed(1)} 580 ${y3.toFixed(1)}`;
}

let step = 0;
setInterval(() => {
  step += 1;

  const simulatedForce = 124 + Math.sin(step * 0.45) * 10;
  const forceWindow =
    forceReplay?.run.windows[step % forceReplay.run.windows.length];
  const force = forceWindow?.meanForceN ?? simulatedForce;
  const ae = 29 + ((Math.cos(step * 0.42) + 1) * 3.6);
  const speed = 3200 + Math.sin(step * 0.25) * 120;
  const roughness = 1.54 + Math.sin(step * 0.3) * 0.12;
  const runtimeSeconds = 91 + step * 2;
  const accelerationWindow =
    accelerationReplay?.run.windows[step % accelerationReplay.run.windows.length];
  const vibration = accelerationWindow?.vectorRms;

  metricNodes.force.textContent = force.toFixed(0);
  const fallbackFx = force * 0.36;
  const fallbackFy = force * 0.24;
  const fallbackFz = force * 0.84;
  const fallbackMean = force * 0.75;
  const fallbackPeak = force * 1.1;
  metricNodes.forceDetail.textContent = forceWindow
    ? `iDAS ${forceReplay.run.label} / Fx ${forceWindow.meanFx.toFixed(1)} N / Fy ${forceWindow.meanFy.toFixed(1)} N / Fz ${forceWindow.meanFz.toFixed(1)} N`
    : `Fx ${fallbackFx.toFixed(0)} N / Fy ${fallbackFy.toFixed(0)} N / Fz ${fallbackFz.toFixed(0)} N`;
  metricNodes.forceDetailValue.textContent = force.toFixed(0);

  if (forceWindow) {
    setAll(metricNodes.forceSource, `${forceReplay.payload.source}：${forceReplay.run.label}`);
    setAll(
      metricNodes.forceWindow,
      `${forceWindow.startTimeS.toFixed(1)}-${forceWindow.endTimeS.toFixed(1)} s / ${forceWindow.sampleCount} 点`,
    );
    setAll(metricNodes.forceFx, forceWindow.meanFx.toFixed(3));
    setAll(metricNodes.forceFy, forceWindow.meanFy.toFixed(3));
    setAll(metricNodes.forceFz, forceWindow.meanFz.toFixed(3));
    setAll(metricNodes.forceMean, forceWindow.meanForceN.toFixed(3));
    setAll(metricNodes.forceP2p, forceWindow.peakToPeakForceMax.toFixed(3));
  } else {
    setAll(metricNodes.forceSource, "未导入六维力数据");
    setAll(metricNodes.forceWindow, "待导入");
    setAll(metricNodes.forceFx, fallbackFx.toFixed(0));
    setAll(metricNodes.forceFy, fallbackFy.toFixed(0));
    setAll(metricNodes.forceFz, fallbackFz.toFixed(0));
    setAll(metricNodes.forceMean, fallbackMean.toFixed(0));
    setAll(metricNodes.forceP2p, fallbackPeak.toFixed(0));
    resetForceScopeNote();
  }

  metricNodes.vibration.textContent = vibration === undefined ? "--" : vibration.toFixed(2);
  metricNodes.vibrationDetail.textContent = accelerationWindow
    ? `YE6275D ${accelerationReplay.run.label} / 峰值 ${accelerationWindow.peakAbs.toFixed(3)} m/s²`
    : "未导入三轴加速度数据";
  metricNodes.vibrationDetailValue.textContent =
    vibration === undefined ? "--" : vibration.toFixed(2);

  if (accelerationWindow) {
    setAll(metricNodes.accelerationSource, `${accelerationReplay.payload.source}：${accelerationReplay.run.label}`);
    setAll(
      metricNodes.accelerationWindow,
      `${accelerationWindow.startTimeS.toFixed(1)}-${accelerationWindow.endTimeS.toFixed(1)} s / ${accelerationWindow.sampleCount} 点`,
    );
    setAll(metricNodes.accRmsX, accelerationWindow.rmsX.toFixed(3));
    setAll(metricNodes.accRmsY, accelerationWindow.rmsY.toFixed(3));
    setAll(metricNodes.accRmsZ, accelerationWindow.rmsZ.toFixed(3));
    setAll(metricNodes.accVectorRms, accelerationWindow.vectorRms.toFixed(3));
    setAll(metricNodes.accPeakAbs, accelerationWindow.peakAbs.toFixed(3));
    setAll(metricNodes.accPeakToPeak, accelerationWindow.peakToPeakMax.toFixed(3));
    setAll(metricNodes.accDominantAxis, accelerationWindow.dominantAxis);
    setAll(metricNodes.accSampleRate, String(accelerationReplay.run.sampleRateHz));

    const phase = step * 0.42;
    metricNodes.accWaveX?.setAttribute("d", vibrationWavePath(accelerationWindow.rmsX, phase, -14));
    metricNodes.accWaveY?.setAttribute("d", vibrationWavePath(accelerationWindow.rmsY, phase + 0.9, 0));
    metricNodes.accWaveZ?.setAttribute("d", vibrationWavePath(accelerationWindow.rmsZ, phase + 1.8, 14));
    metricNodes.accWaveMarker?.setAttribute(
      "transform",
      `translate(${((step % accelerationReplay.run.windows.length) / Math.max(1, accelerationReplay.run.windows.length - 1) * 510 - 255).toFixed(1)} 0)`,
    );
    if (metricNodes.accWaveCaption) {
      metricNodes.accWaveCaption.textContent =
        `窗口 ${accelerationWindow.startTimeS.toFixed(1)}-${accelerationWindow.endTimeS.toFixed(1)} s`;
    }
  } else {
    setAll(metricNodes.accelerationSource, "未导入三轴加速度数据");
    setAll(metricNodes.accelerationWindow, "待导入");
    setAll(metricNodes.accRmsX, "--");
    setAll(metricNodes.accRmsY, "--");
    setAll(metricNodes.accRmsZ, "--");
    setAll(metricNodes.accVectorRms, "--");
    setAll(metricNodes.accPeakAbs, "--");
    setAll(metricNodes.accPeakToPeak, "--");
    setAll(metricNodes.accDominantAxis, "--");
    setAll(metricNodes.accSampleRate, "--");
    if (metricNodes.accWaveCaption) {
      metricNodes.accWaveCaption.textContent = "窗口：待导入";
    }
  }

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
