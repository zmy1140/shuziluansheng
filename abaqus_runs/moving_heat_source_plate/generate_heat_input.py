from pathlib import Path


JOB_NAME = "moving_heat_source_plate"

WIDTH_MM = 100.0
DEPTH_MM = 100.0
THICKNESS_MM = 8.0

NX = 40
NY = 40
NZ = 2

AMBIENT_TEMPERATURE_C = 26.0
HOT_TEMPERATURE_C = 92.0
TOOL_DIAMETER_MM = 24.0
TOOL_RADIUS_MM = TOOL_DIAMETER_MM / 2.0

PATH_START_X_MM = -40.0
PATH_END_X_MM = 40.0
PATH_Y_MM = 0.0
PATH_STEPS = 17
STEP_TIME_S = 0.25


def node_id(ix, iy, iz):
    return iz * (NX + 1) * (NY + 1) + iy * (NX + 1) + ix + 1


def element_id(ix, iy, iz):
    return iz * NX * NY + iy * NX + ix + 1


def node_coordinates(ix, iy, iz):
    x = -WIDTH_MM / 2.0 + WIDTH_MM * ix / NX
    y = -DEPTH_MM / 2.0 + DEPTH_MM * iy / NY
    z = THICKNESS_MM * iz / NZ
    return x, y, z


def format_id_lines(ids, per_line=16):
    lines = []
    for start in range(0, len(ids), per_line):
        lines.append(", ".join(str(value) for value in ids[start:start + per_line]))
    return lines


def top_nodes_near(center_x, center_y):
    nodes = []
    for iy in range(NY + 1):
        for ix in range(NX + 1):
            x, y, _z = node_coordinates(ix, iy, NZ)
            distance = ((x - center_x) ** 2 + (y - center_y) ** 2) ** 0.5
            if distance <= TOOL_RADIUS_MM:
                nodes.append(node_id(ix, iy, NZ))
    return nodes


def path_centers():
    if PATH_STEPS <= 1:
        return [(PATH_START_X_MM, PATH_Y_MM)]
    return [
        (
            PATH_START_X_MM + (PATH_END_X_MM - PATH_START_X_MM) * index / (PATH_STEPS - 1),
            PATH_Y_MM,
        )
        for index in range(PATH_STEPS)
    ]


def main():
    lines = [
        "*Heading",
        "** Simplified moving heat source plate model for frontend temperature-field linkage.",
        "** This uses placeholder thermal parameters and is not a validated grinding temperature model.",
        "*Preprint, echo=NO, model=NO, history=NO, contact=NO",
        "*Node",
    ]

    for iz in range(NZ + 1):
        for iy in range(NY + 1):
            for ix in range(NX + 1):
                x, y, z = node_coordinates(ix, iy, iz)
                lines.append(f"{node_id(ix, iy, iz)}, {x:.6f}, {y:.6f}, {z:.6f}")

    lines.append("*Element, type=DC3D8")
    for iz in range(NZ):
        for iy in range(NY):
            for ix in range(NX):
                n1 = node_id(ix, iy, iz)
                n2 = node_id(ix + 1, iy, iz)
                n3 = node_id(ix + 1, iy + 1, iz)
                n4 = node_id(ix, iy + 1, iz)
                n5 = node_id(ix, iy, iz + 1)
                n6 = node_id(ix + 1, iy, iz + 1)
                n7 = node_id(ix + 1, iy + 1, iz + 1)
                n8 = node_id(ix, iy + 1, iz + 1)
                lines.append(f"{element_id(ix, iy, iz)}, {n1}, {n2}, {n3}, {n4}, {n5}, {n6}, {n7}, {n8}")

    all_nodes = [node_id(ix, iy, iz) for iz in range(NZ + 1) for iy in range(NY + 1) for ix in range(NX + 1)]
    bottom_nodes = [node_id(ix, iy, 0) for iy in range(NY + 1) for ix in range(NX + 1)]

    lines.append("*Nset, nset=ALL_NODES")
    lines.extend(format_id_lines(all_nodes))
    lines.append("*Nset, nset=BOTTOM_NODES")
    lines.extend(format_id_lines(bottom_nodes))
    lines.append("*Elset, elset=PLATE_ELEMENTS, generate")
    lines.append(f"1, {NX * NY * NZ}, 1")

    for index, (center_x, center_y) in enumerate(path_centers(), start=1):
        lines.append(f"*Nset, nset=HOT_{index:02d}")
        lines.extend(format_id_lines(top_nodes_near(center_x, center_y)))

    lines.extend([
        "*Solid Section, elset=PLATE_ELEMENTS, material=PLACEHOLDER_STEEL",
        "*Material, name=PLACEHOLDER_STEEL",
        "** Placeholder values in mm-s-degC style units.",
        "*Conductivity",
        "0.045",
        "*Density",
        "7.85e-06",
        "*Specific Heat",
        "460.",
        "*Initial Conditions, type=TEMPERATURE",
        f"ALL_NODES, {AMBIENT_TEMPERATURE_C:.6f}",
    ])

    for index, (_center_x, _center_y) in enumerate(path_centers(), start=1):
        lines.extend([
            f"*Step, name=HEAT_{index:02d}, nlgeom=NO",
            "*Heat Transfer",
            f"{STEP_TIME_S:.6f}, {STEP_TIME_S:.6f}, 1e-05, {STEP_TIME_S:.6f}",
            "*Boundary, OP=NEW",
            f"BOTTOM_NODES, 11, 11, {AMBIENT_TEMPERATURE_C:.6f}",
            f"HOT_{index:02d}, 11, 11, {HOT_TEMPERATURE_C:.6f}",
            "*Output, field, frequency=1",
            "*Node Output",
            "NT",
            "*End Step",
        ])

    Path(f"{JOB_NAME}.inp").write_text("\n".join(lines) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
