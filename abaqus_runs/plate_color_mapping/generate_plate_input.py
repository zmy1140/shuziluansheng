from pathlib import Path


NX = 5
NZ = 3
WIDTH = 4.0
DEPTH = 2.0
THICKNESS = 0.16


def node_id(ix, iz, layer):
    return layer * (NX + 1) * (NZ + 1) + iz * (NX + 1) + ix + 1


def main():
    lines = [
        "*Heading",
        "** Simplified plate for frontend color mapping prototype.",
        "** This is not a real grinding contact model.",
        "*Preprint, echo=NO, model=NO, history=NO, contact=NO",
        "*Node",
    ]

    for layer, thickness_z in enumerate([0.0, THICKNESS]):
        for iz in range(NZ + 1):
            plane_y = -DEPTH / 2 + DEPTH * iz / NZ
            for ix in range(NX + 1):
                x = -WIDTH / 2 + WIDTH * ix / NX
                lines.append(f"{node_id(ix, iz, layer)}, {x:.6f}, {plane_y:.6f}, {thickness_z:.6f}")

    lines.append("*Element, type=C3D8R")
    element_id = 1
    for iz in range(NZ):
        for ix in range(NX):
            n1 = node_id(ix, iz, 0)
            n2 = node_id(ix + 1, iz, 0)
            n3 = node_id(ix + 1, iz + 1, 0)
            n4 = node_id(ix, iz + 1, 0)
            n5 = node_id(ix, iz, 1)
            n6 = node_id(ix + 1, iz, 1)
            n7 = node_id(ix + 1, iz + 1, 1)
            n8 = node_id(ix, iz + 1, 1)
            lines.append(f"{element_id}, {n1}, {n2}, {n3}, {n4}, {n5}, {n6}, {n7}, {n8}")
            element_id += 1

    fixed_nodes = [node_id(0, iz, layer) for layer in range(2) for iz in range(NZ + 1)]
    pulled_nodes = [node_id(NX, iz, layer) for layer in range(2) for iz in range(NZ + 1)]

    lines.extend([
        "*Nset, nset=FIXED",
        ", ".join(str(node) for node in fixed_nodes),
        "*Nset, nset=PULLED",
        ", ".join(str(node) for node in pulled_nodes),
        "*Elset, elset=PLATE_ELEMENTS, generate",
        f"1, {NX * NZ}, 1",
        "*Solid Section, elset=PLATE_ELEMENTS, material=STEEL",
        "*Material, name=STEEL",
        "*Elastic",
        "210000., 0.30",
        "*Step, name=STATIC_PULL, nlgeom=NO",
        "*Static",
        "0.1, 1.0, 1e-05, 0.1",
        "*Boundary",
        "FIXED, 1, 3, 0.0",
        "PULLED, 1, 1, 0.02",
        "*Output, field",
        "*Element Output",
        "S",
        "*Node Output",
        "U",
        "*End Step",
    ])

    Path("plate_color_mapping.inp").write_text("\n".join(lines) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
