from abaqus import mdb, session


CAE_PATH = "visible_smoke_test.cae"
MODEL_NAME = "VisibleSmokeTest"


openMdb(pathName=CAE_PATH)
viewport = session.viewports[session.currentViewportName]
viewport.makeCurrent()
viewport.maximize()
assembly = mdb.models[MODEL_NAME].rootAssembly
viewport.setValues(displayedObject=assembly)
viewport.view.fitView()
print("Displayed CAE assembly from: %s" % CAE_PATH)
