from abaqus import mdb
from abaqusConstants import *
import mesh


MODEL_NAME = "VisibleSmokeTest"
CAE_PATH = "visible_smoke_test.cae"


def main():
    if MODEL_NAME in mdb.models:
        del mdb.models[MODEL_NAME]

    model = mdb.Model(name=MODEL_NAME)

    sketch = model.ConstrainedSketch(name="block_profile", sheetSize=2.0)
    sketch.rectangle(point1=(0.0, 0.0), point2=(1.0, 0.2))
    part = model.Part(name="TENSION_BLOCK", dimensionality=THREE_D, type=DEFORMABLE_BODY)
    part.BaseSolidExtrude(sketch=sketch, depth=0.2)

    material = model.Material(name="STEEL")
    material.Elastic(table=((210000.0, 0.3),))
    section = model.HomogeneousSolidSection(name="STEEL_SECTION", material="STEEL")
    cells = part.cells[:]
    part.Set(cells=cells, name="BLOCK")
    part.SectionAssignment(region=part.sets["BLOCK"], sectionName=section.name)

    part.seedPart(size=1.0, deviationFactor=0.1, minSizeFactor=0.1)
    part.setElementType(
        regions=(cells,),
        elemTypes=(mesh.ElemType(elemCode=C3D8R, elemLibrary=STANDARD),),
    )
    part.generateMesh()

    assembly = model.rootAssembly
    assembly.DatumCsysByDefault(CARTESIAN)
    instance = assembly.Instance(name="TENSION_BLOCK-1", part=part, dependent=ON)

    fixed_nodes = instance.nodes.getByBoundingBox(
        xMin=-1e-6, xMax=1e-6, yMin=-1e-6, yMax=0.200001, zMin=-1e-6, zMax=0.200001
    )
    pulled_nodes = instance.nodes.getByBoundingBox(
        xMin=0.999999, xMax=1.000001, yMin=-1e-6, yMax=0.200001, zMin=-1e-6, zMax=0.200001
    )
    assembly.Set(nodes=fixed_nodes, name="FIXED_FACE")
    assembly.Set(nodes=pulled_nodes, name="PULLED_FACE")

    model.StaticStep(name="VISIBLE_STATIC_TENSION", previous="Initial", maxNumInc=80)
    model.DisplacementBC(
        name="FIXED_FACE_FIXED",
        createStepName="Initial",
        region=assembly.sets["FIXED_FACE"],
        u1=0.0,
        u2=0.0,
        u3=0.0,
        ur1=0.0,
        ur2=0.0,
        ur3=0.0,
    )
    model.DisplacementBC(
        name="PULLED_FACE_X",
        createStepName="VISIBLE_STATIC_TENSION",
        region=assembly.sets["PULLED_FACE"],
        u1=0.02,
        u2=0.0,
        u3=0.0,
    )

    mdb.saveAs(pathName=CAE_PATH)
    print("Saved CAE model: %s" % CAE_PATH)


if __name__ == "__main__":
    main()
