function parseCsvRows(csvText) {
  const rows = String(csvText)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (rows.length < 2) {
    throw new Error("温度场 CSV 至少需要表头和一行数据。");
  }

  const headers = rows[0].split(",").map((header) => header.trim());
  return rows.slice(1).map((row) => {
    const values = row.split(",").map((value) => value.trim());
    return Object.fromEntries(headers.map((header, index) => [header, values[index]]));
  });
}

function requireColumns(rows, columns) {
  const firstRow = rows[0] ?? {};
  columns.forEach((column) => {
    if (!(column in firstRow)) {
      throw new Error(`温度场 CSV 缺少必要字段：${column}`);
    }
  });
}

function uniqueSortedNumbers(values) {
  return [...new Set(values)]
    .filter((value) => Number.isFinite(value))
    .sort((a, b) => a - b);
}

export function parseTemperatureCsv(csvText, options = {}) {
  const rows = parseCsvRows(csvText);
  requireColumns(rows, ["x_mm", "z_mm", "temperature_c"]);

  const samples = rows.map((row) => {
    const sample = {
      x_mm: Number(row.x_mm),
      z_mm: Number(row.z_mm),
      temperature_c: Number(row.temperature_c),
    };

    if (!Number.isFinite(sample.x_mm) || !Number.isFinite(sample.z_mm) || !Number.isFinite(sample.temperature_c)) {
      throw new Error("温度场 CSV 中 x_mm、z_mm、temperature_c 必须是数字。");
    }

    return sample;
  });

  const xValues = uniqueSortedNumbers(samples.map((sample) => sample.x_mm));
  const zValues = uniqueSortedNumbers(samples.map((sample) => sample.z_mm));

  return {
    source: options.source ?? "temperature_field_csv",
    valueKey: "temperature_c",
    xKey: "x_mm",
    zKey: "z_mm",
    valueLabel: "温度",
    unit: "degC",
    coordinate: options.coordinate ?? "workpiece_local",
    grid: {
      columns: xValues.length,
      rows: zValues.length,
      widthMm: Number((xValues.at(-1) - xValues[0]).toFixed(3)),
      depthMm: Number((zValues.at(-1) - zValues[0]).toFixed(3)),
    },
    note: options.note ?? "温度场 CSV 转换结果，可来自 Abaqus 后处理或实验测温；请勿在未验证前解释为真实打磨温度。",
    samples,
  };
}
