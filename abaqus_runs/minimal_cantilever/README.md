# Minimal Abaqus Test Model

This folder contains a tiny Abaqus/Standard smoke test for the local SIMULIA installation.

Model:

- One C3D8R solid element cantilever block.
- The `x=0` face is fully fixed.
- A small vertical force is applied to the `x=1` face.

Run from this folder:

```powershell
& 'D:\SIMULIA\Commands\abaqus.bat' job=minimal_cantilever input=minimal_cantilever.inp interactive
```

Expected result:

- Abaqus exits with `COMPLETED`.
- `minimal_cantilever.odb` is created locally.
- Solver output files are ignored by Git; keep the `.inp` and this README as the reusable source files.
