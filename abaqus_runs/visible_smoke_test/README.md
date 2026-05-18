# Visible Abaqus Smoke Test

This is a tiny Abaqus/Standard tension-block model intended to be run from a visible command window.

Run:

```powershell
& 'D:\SIMULIA\Commands\abaqus.bat' job=visible_smoke_test input=visible_smoke_test.inp interactive
```

Open the resulting ODB:

```powershell
& 'D:\SIMULIA\Commands\abaqus.bat' cae database=visible_smoke_test.odb
```

Extract summary data:

```powershell
& 'D:\SIMULIA\Commands\abaqus.bat' python extract_results.py
```
