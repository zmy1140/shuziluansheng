from __future__ import print_function

import csv
import json
import os

from odbAccess import openOdb


JOB_NAME = "visible_smoke_test"
ODB_PATH = JOB_NAME + ".odb"
JSON_PATH = JOB_NAME + "_summary.json"
CSV_PATH = JOB_NAME + "_pulled_face_displacement.csv"


def main():
    odb = openOdb(path=ODB_PATH, readOnly=True)
    try:
        step = odb.steps["VISIBLE_STATIC_TENSION"]
        frame = step.frames[-1]
        pulled_face = odb.rootAssembly.nodeSets["PULLED_FACE"]

        displacement = frame.fieldOutputs["U"].getSubset(region=pulled_face)
        rows = []
        u1_values = []
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
            u1_values.append(float(u1))

        stress = frame.fieldOutputs["S"]
        mises_values = [float(value.mises) for value in stress.values]

        summary = {
            "job": JOB_NAME,
            "odb": os.path.abspath(ODB_PATH),
            "step": "VISIBLE_STATIC_TENSION",
            "frame_count": len(step.frames),
            "pulled_face_node_count": len(rows),
            "average_u1": sum(u1_values) / len(u1_values),
            "minimum_u1": min(u1_values),
            "maximum_u1": max(u1_values),
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
