from __future__ import print_function

import csv
import json
import os

from odbAccess import openOdb


JOB_NAME = "minimal_cantilever"
ODB_PATH = JOB_NAME + ".odb"
JSON_PATH = JOB_NAME + "_summary.json"
CSV_PATH = JOB_NAME + "_loaded_face_displacement.csv"


def main():
    odb = openOdb(path=ODB_PATH, readOnly=True)
    try:
        step = odb.steps["STATIC_LOAD"]
        frame = step.frames[-1]
        loaded_face = odb.rootAssembly.nodeSets["LOADED_FACE"]

        displacement = frame.fieldOutputs["U"].getSubset(region=loaded_face)
        rows = []
        u2_values = []
        for value in displacement.values:
            u1, u2, u3 = value.data
            rows.append(
                {
                    "node_label": value.nodeLabel,
                    "u1": float(u1),
                    "u2": float(u2),
                    "u3": float(u3),
                }
            )
            u2_values.append(float(u2))

        stress = frame.fieldOutputs["S"]
        mises_values = [float(value.mises) for value in stress.values]

        summary = {
            "job": JOB_NAME,
            "odb": os.path.abspath(ODB_PATH),
            "step": "STATIC_LOAD",
            "loaded_face_node_count": len(rows),
            "average_u2": sum(u2_values) / len(u2_values),
            "minimum_u2": min(u2_values),
            "maximum_u2": max(u2_values),
            "maximum_mises": max(mises_values),
        }

        with open(JSON_PATH, "w") as json_file:
            json.dump(summary, json_file, indent=2, sort_keys=True)

        with open(CSV_PATH, "w") as csv_file:
            writer = csv.DictWriter(csv_file, fieldnames=["node_label", "u1", "u2", "u3"])
            writer.writeheader()
            writer.writerows(rows)

        print(json.dumps(summary, indent=2, sort_keys=True))
    finally:
        odb.close()


if __name__ == "__main__":
    main()
