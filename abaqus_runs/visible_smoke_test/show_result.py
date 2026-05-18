from abaqus import session
from abaqusConstants import *
from visualization import *


ODB_PATH = "visible_smoke_test.odb"


def main():
    viewport = session.viewports[session.currentViewportName]
    viewport.makeCurrent()
    viewport.maximize()

    odb = session.openOdb(name=ODB_PATH)
    viewport.setValues(displayedObject=odb)
    viewport.odbDisplay.display.setValues(plotState=(CONTOURS_ON_DEF,))
    viewport.odbDisplay.setFrame(step=0, frame=-1)
    viewport.odbDisplay.commonOptions.setValues(visibleEdges=FEATURE)
    viewport.odbDisplay.contourOptions.setValues(numIntervals=12)
    viewport.view.fitView()
    print("Displayed ODB result: %s" % ODB_PATH)


main()
