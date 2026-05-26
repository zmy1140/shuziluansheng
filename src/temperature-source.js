const ABAQUS_TEMPERATURE_URL = "/simulation/temperature_field.json";
const DEMO_TEMPERATURE_URL = "/simulation/temperature_demo.json";

async function fetchJson(fetchImpl, url) {
  const response = await fetchImpl(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return response.json();
}

export async function loadTemperatureField({
  fetchImpl = fetch,
  applySimulationResult,
  statusText,
} = {}) {
  try {
    const result = await fetchJson(fetchImpl, ABAQUS_TEMPERATURE_URL);
    applySimulationResult(result);
    statusText.textContent =
      `已载入${result.source ?? "Abaqus简化热源温度场"}：${result.valueLabel ?? "温度"}，占位参数，仅用于前端颜色渲染链路验证。`;
    return result;
  } catch {
    const fallback = await fetchJson(fetchImpl, DEMO_TEMPERATURE_URL);
    applySimulationResult(fallback);
    statusText.textContent =
      `已载入演示温度场：${fallback.valueLabel ?? "温度"}，Abaqus 温度场不可用时作为回退数据。`;
    return fallback;
  }
}
