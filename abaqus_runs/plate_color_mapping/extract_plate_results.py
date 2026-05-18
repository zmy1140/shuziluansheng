from __future__ import print_function

import csv
import codecs
import json
import os

from odbAccess import openOdb


JOB = "plate_color_mapping"
ODB_PATH = os.path.abspath(JOB + ".odb")
JSON_PATH = os.path.abspath(JOB + "_result.json")
CSV_PATH = os.path.abspath(JOB + "_result.csv")
PUBLIC_JSON_PATH = os.path.abspath(os.path.join("..", "..", "public", "simulation", "plate_color_mapping.json"))


def element_centroids(instance):
    centroids = {}
    node_lookup = {node.label: node.coordinates for node in instance.nodes}
    for element in instance.elements:
        coords = [node_lookup[label] for label in element.connectivity]
        count = float(len(coords))
        centroids[element.label] = (
            sum(coord[0] for coord in coords) / count,
            sum(coord[1] for coord in coords) / count,
            sum(coord[2] for coord in coords) / count,
        )
    return centroids


def main():
    odb = openOdb(ODB_PATH)
    try:
        step = odb.steps["STATIC_PULL"]
        frame = step.frames[-1]
        instance = list(odb.rootAssembly.instances.values())[0]
        centroids = element_centroids(instance)

        stress_values = frame.fieldOutputs["S"].values
        element_mises = {}
        element_counts = {}
        for value in stress_values:
            element_mises[value.elementLabel] = element_mises.get(value.elementLabel, 0.0) + float(value.mises)
            element_counts[value.elementLabel] = element_counts.get(value.elementLabel, 0) + 1

        samples = []
        for element_label in sorted(element_mises):
            x, z, _thickness = centroids[element_label]
            mises = element_mises[element_label] / float(element_counts[element_label])
            samples.append({
                "element": element_label,
                "x": x,
                "z": z,
                "mises": mises,
            })

        result = {
            "source": "Abaqus简化厚板算例",
            "valueKey": "mises",
            "valueLabel": "Mises应力",
            "unit": "MPa",
            "note": "该结果仅用于前端颜色映射原型，不代表真实磨抛接触仿真或真实粗糙度预测。",
            "samples": samples,
        }

        for path in [JSON_PATH, PUBLIC_JSON_PATH]:
            directory = os.path.dirname(path)
            if directory and not os.path.exists(directory):
                os.makedirs(directory)
            with codecs.open(path, "w", encoding="utf-8") as file:
                json.dump(result, file, ensure_ascii=False, indent=2)

        with open(CSV_PATH, "w", newline="") as file:
            writer = csv.DictWriter(file, fieldnames=["element", "x", "z", "mises"])
            writer.writeheader()
            for sample in samples:
                writer.writerow(sample)

        print("Exported {0} element samples".format(len(samples)))
        print(JSON_PATH)
        print(CSV_PATH)
        print(PUBLIC_JSON_PATH)
    finally:
        odb.close()


if __name__ == "__main__":
    main()
