function clampIndex(value, maxIndex) {
  return Math.max(0, Math.min(maxIndex, value));
}

export function getSimulationGridBounds(result, fallback) {
  const usesMillimeterCoordinates = result?.xKey?.endsWith("_mm") || result?.zKey?.endsWith("_mm");
  if (usesMillimeterCoordinates) {
    return {
      width: Number(result?.grid?.widthMm) || fallback.width,
      depth: Number(result?.grid?.depthMm) || fallback.depth,
    };
  }

  return fallback;
}

export function mapSimulationSamplesToGrid(samples, {
  columns,
  rows,
  width,
  depth,
  valueKey = "value",
  xKey = "x",
  zKey = "z",
}) {
  const grid = new Array(columns * rows).fill(0);
  if (!Array.isArray(samples) || samples.length === 0) {
    return grid;
  }

  const values = samples
    .map((sample) => Number(sample[valueKey]))
    .filter((value) => Number.isFinite(value));
  if (values.length === 0) {
    return grid;
  }

  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const range = maxValue - minValue || 1;

  samples.forEach((sample) => {
    const x = Number(sample[xKey]);
    const z = Number(sample[zKey]);
    const rawValue = Number(sample[valueKey]);
    if (!Number.isFinite(x) || !Number.isFinite(z) || !Number.isFinite(rawValue)) {
      return;
    }

    const column = clampIndex(
      Math.round(((x + width / 2) / width) * (columns - 1)),
      columns - 1,
    );
    const row = clampIndex(
      Math.round(((z + depth / 2) / depth) * (rows - 1)),
      rows - 1,
    );
    const index = row * columns + column;
    const normalized = (rawValue - minValue) / range;
    grid[index] = Math.max(grid[index], normalized);
  });

  return grid;
}

export function mergeVisibleTemperatureValues(pathHeatValues, revealedTemperatureValues) {
  const length = Math.max(pathHeatValues?.length ?? 0, revealedTemperatureValues?.length ?? 0);
  return Array.from({ length }, (_value, index) => Math.max(
    Number(pathHeatValues?.[index]) || 0,
    Number(revealedTemperatureValues?.[index]) || 0,
  ));
}

export function revealTemperatureValuesNearPoint({
  targetTemperatureValues,
  revealedTemperatureValues,
  cellCenters,
  point,
  radius,
}) {
  if (!Array.isArray(targetTemperatureValues) || !Array.isArray(revealedTemperatureValues)) {
    return;
  }
  if (!Array.isArray(cellCenters) || !point || !Number.isFinite(radius) || radius <= 0) {
    return;
  }

  cellCenters.forEach((cell, index) => {
    const distance = Math.hypot(Number(cell.x) - Number(point.x), Number(cell.z) - Number(point.z));
    if (Number.isFinite(distance) && distance <= radius) {
      revealedTemperatureValues[index] = Math.max(
        Number(revealedTemperatureValues[index]) || 0,
        Number(targetTemperatureValues[index]) || 0,
      );
    }
  });
}

export function clearTemperatureValues(values) {
  if (Array.isArray(values)) {
    values.fill(0);
  }
}
