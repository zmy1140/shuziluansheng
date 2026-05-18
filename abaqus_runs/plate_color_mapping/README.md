# Plate Color Mapping Abaqus Prototype

This folder contains a simplified Abaqus/Standard plate model used only to prove the data path:

```text
Abaqus ODB -> Python post-processing -> JSON/CSV -> frontend color mapping
```

The model is not a real grinding or polishing contact simulation. It is a small elastic plate with one fixed end and a prescribed displacement at the opposite end, so the frontend has a reproducible scalar field for color rendering.

Run:

```powershell
python generate_plate_input.py
& 'D:\SIMULIA\Commands\abaqus.bat' job=plate_color_mapping input=plate_color_mapping.inp interactive
& 'D:\SIMULIA\Commands\abaqus.bat' python extract_plate_results.py
```

Outputs:

- `plate_color_mapping_result.json`
- `plate_color_mapping_result.csv`
- `public/simulation/plate_color_mapping.json`

