const REQUIRED_COLUMNS = ["t_s", "x_mm", "y_mm", "z_mm", "nx", "ny", "nz", "feed_mm_s"];

function parseCsvLine(line) {
  return line.split(",").map((value) => value.trim());
}

function readFiniteNumber(row, columnName) {
  const value = Number(row[columnName]);
  if (!Number.isFinite(value)) {
    throw new Error(`Invalid numeric value for ${columnName}: ${row[columnName]}`);
  }
  return value;
}

export function parsePathCsv(csvText, {
  id = "line_grinding_demo",
  unit = "mm",
  coordinate = "workpiece_local",
  toolRadiusMm = 4,
} = {}) {
  const lines = csvText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"));

  if (lines.length < 2) {
    throw new Error("Path CSV must include a header and at least one point.");
  }

  const headers = parseCsvLine(lines[0]);
  const missingColumns = REQUIRED_COLUMNS.filter((column) => !headers.includes(column));
  if (missingColumns.length > 0) {
    throw new Error(`Path CSV missing required columns: ${missingColumns.join(", ")}`);
  }

  const points = lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    const row = Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));

    return {
      t: readFiniteNumber(row, "t_s"),
      x: readFiniteNumber(row, "x_mm"),
      y: readFiniteNumber(row, "y_mm"),
      z: readFiniteNumber(row, "z_mm"),
      nx: readFiniteNumber(row, "nx"),
      ny: readFiniteNumber(row, "ny"),
      nz: readFiniteNumber(row, "nz"),
      feedMmS: readFiniteNumber(row, "feed_mm_s"),
    };
  });

  return {
    id,
    unit,
    timeUnit: "s",
    coordinate,
    toolRadiusMm,
    sourceFormat: "csv",
    points,
  };
}
