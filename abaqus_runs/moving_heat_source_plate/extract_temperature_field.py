from __future__ import print_function

import codecs
import csv
import json
import math
import os

from odbAccess import openOdb


JOB_NAME = "moving_heat_source_plate"
ODB_PATH = os.path.abspath(JOB_NAME + ".odb")
LOCAL_CSV_PATH = os.path.abspath(JOB_NAME + "_temperature_field.csv")
LOCAL_JSON_PATH = os.path.abspath(JOB_NAME + "_temperature_field_summary.json")
FRONTEND_CSV_PATH = os.path.abspath(os.path.join("..", "..", "data", "demo", "temperature_field.csv"))

WIDTH_MM = 100.0
DEPTH_MM = 100.0
GRID_COLUMNS = 40
GRID_ROWS = 40
TOP_Z_MM = 8.0
AMBIENT_TEMPERATURE_C = 26.0


def scalar_temperature(value):
    data = getattr(value, "data", None)
    if isinstance(data, (list, tuple)):
        return float(data[0])
    if data is not None:
        return float(data)
    if hasattr(value, "magnitude"):
        return float(value.magnitude)
    raise ValueError("Unsupported temperature field value")


def top_surface_nodes(instance):
    nodes = []
    for node in instance.nodes:
        x, y, z = node.coordinates
        if abs(float(z) - TOP_Z_MM) < 1e-6:
            nodes.append((node.label, float(x), float(y)))
    return nodes


def read_max_temperatures(odb):
    max_by_node = {}
    for step in odb.steps.values():
        for frame in step.frames:
            if "NT11" in frame.fieldOutputs:
                field = frame.fieldOutputs["NT11"]
            elif "NT" in frame.fieldOutputs:
                field = frame.fieldOutputs["NT"]
            else:
                continue
            for value in field.values:
                node_label = getattr(value, "nodeLabel", None)
                if node_label is None:
                    continue
                temperature = scalar_temperature(value)
                max_by_node[node_label] = max(temperature, max_by_node.get(node_label, AMBIENT_TEMPERATURE_C))
    return max_by_node


def sample_coordinates():
    x_values = [
        -WIDTH_MM / 2.0 + WIDTH_MM * column / (GRID_COLUMNS - 1)
        for column in range(GRID_COLUMNS)
    ]
    y_values = [
        -DEPTH_MM / 2.0 + DEPTH_MM * row / (GRID_ROWS - 1)
        for row in range(GRID_ROWS)
    ]
    return x_values, y_values


def nearest_temperature(x, y, top_nodes, max_by_node):
    nearest_label = None
    nearest_distance = None
    for label, node_x, node_y in top_nodes:
        distance = (node_x - x) ** 2 + (node_y - y) ** 2
        if nearest_distance is None or distance < nearest_distance:
            nearest_distance = distance
            nearest_label = label
    return float(max_by_node.get(nearest_label, AMBIENT_TEMPERATURE_C))


def write_csv(path, samples):
    directory = os.path.dirname(path)
    if directory and not os.path.exists(directory):
        os.makedirs(directory)
    with open(path, "w", newline="") as file:
        writer = csv.DictWriter(file, fieldnames=["x_mm", "z_mm", "temperature_c"])
        writer.writeheader()
        for sample in samples:
            writer.writerow(sample)


def write_summary(samples):
    temperatures = [sample["temperature_c"] for sample in samples]
    result = {
        "source": "Abaqus简化热源温度场",
        "model": JOB_NAME,
        "note": "占位参数的移动热源瞬态热传导结果，不代表真实实验温度。",
        "grid": {
            "columns": GRID_COLUMNS,
            "rows": GRID_ROWS,
            "widthMm": WIDTH_MM,
            "depthMm": DEPTH_MM,
        },
        "temperatureRangeC": {
            "min": min(temperatures),
            "max": max(temperatures),
        },
    }
    with codecs.open(LOCAL_JSON_PATH, "w", encoding="utf-8") as file:
        json.dump(result, file, ensure_ascii=False, indent=2)


def main():
    odb = openOdb(ODB_PATH)
    try:
        instance = list(odb.rootAssembly.instances.values())[0]
        top_nodes = top_surface_nodes(instance)
        max_by_node = read_max_temperatures(odb)
        x_values, y_values = sample_coordinates()

        samples = []
        for y in y_values:
            for x in x_values:
                temperature = nearest_temperature(x, y, top_nodes, max_by_node)
                samples.append({
                    "x_mm": round(x, 3),
                    "z_mm": round(y, 3),
                    "temperature_c": round(temperature, 3),
                })

        write_csv(LOCAL_CSV_PATH, samples)
        write_csv(FRONTEND_CSV_PATH, samples)
        write_summary(samples)

        print("Exported {0} temperature samples".format(len(samples)))
        print(LOCAL_CSV_PATH)
        print(FRONTEND_CSV_PATH)
        print(LOCAL_JSON_PATH)
    finally:
        odb.close()


if __name__ == "__main__":
    main()
