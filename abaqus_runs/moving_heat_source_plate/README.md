# Moving Heat Source Plate Abaqus Demo

这个目录用于第一版“真实 Abaqus 求解链路”验证：

```text
100 x 100 x 8 mm 平板
-> 24 mm 等效磨头圆形热源沿直线路径移动
-> Abaqus/Standard 瞬态热传导求解
-> ODB 后处理导出 x_mm,z_mm,temperature_c
-> 前端 JSON 温度场渲染
```

## 重要边界

- 这是简化瞬态热传导模型，不是真实磨抛接触模型。
- 热源温度、材料导热参数和底面恒温边界都是占位参数。
- 输出温度场只能用于验证“仿真结果进入前端”的链路，不能解释为真实实验温度。

## 文件说明

- `generate_heat_input.py`：生成 Abaqus 输入文件 `moving_heat_source_plate.inp`。
- `extract_temperature_field.py`：读取 ODB，导出温度场 CSV 到本目录和 `data/demo/temperature_field.csv`。
- `moving_heat_source_plate.inp`：由脚本生成的 Abaqus 输入文件。
- `moving_heat_source_plate_temperature_field.csv`：本目录下的后处理 CSV 备份。
- `moving_heat_source_plate_temperature_field_summary.json`：本目录下的轻量结果摘要。

`.odb/.dat/.msg/.sta` 等重型求解产物由 `.gitignore` 忽略，不提交。

## 一步一步运行

在项目根目录打开 PowerShell：

```powershell
cd C:\Users\123\Documents\Codex\shuziluansheng
cd abaqus_runs\moving_heat_source_plate
python generate_heat_input.py
& "D:\SIMULIA\Commands\abaqus.bat" job=moving_heat_source_plate input=moving_heat_source_plate.inp interactive
& "D:\SIMULIA\Commands\abaqus.bat" python extract_temperature_field.py
cd ..\..
npm.cmd run convert:temperature
```

运行结束后，前端读取的文件是：

```text
public/simulation/temperature_field.json
```

## 在 Abaqus/Viewer 里看云图

求解完成后可以打开 ODB：

```powershell
& "D:\SIMULIA\Commands\abaqus.bat" viewer database=abaqus_runs\moving_heat_source_plate\moving_heat_source_plate.odb
```

在 Viewer 中选择温度变量 `NT11` 或 `NT`，切换不同 step/frame，可以看到热源沿直线路径移动后留下的温度分布。

## 后续可升级方向

- 用真实材料热参数替换当前占位参数。
- 用真实热源功率、接触面积、进给速度和散热边界替换当前目标温度边界。
- 在有压力、摩擦系数、接触热导等参数后，再升级为热-力接触模型。
