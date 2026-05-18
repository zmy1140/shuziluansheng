function clampIndex(value, maxIndex) {
  return Math.max(0, Math.min(maxIndex, value));
}

export function mapSimulationSamplesToGrid(samples, {
  columns,
  rows,
  width,
  depth,
  valueKey = "value",
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
    const x = Number(sample.x);
    const z = Number(sample.z);
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
