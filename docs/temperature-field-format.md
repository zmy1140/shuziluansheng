# 温度场 CSV/JSON 格式约定

当前前端不直接读取 Abaqus ODB、CAE 文件或实验设备原始文件。Abaqus 后处理脚本或实验测温整理脚本应先导出标准 CSV，再由项目脚本转换为前端 JSON。

当前 `data/demo/temperature_field.csv` 已由第一版 Abaqus 简化移动热源算例导出，算例位置为 `abaqus_runs/moving_heat_source_plate/`。该结果使用占位热源和占位材料参数，只用于验证 “Abaqus -> CSV -> JSON -> 前端温度场渲染” 链路，不代表真实实验温度。

## CSV 表头

固定使用以下三列：

```csv
x_mm,z_mm,temperature_c
```

- `x_mm`：工件局部坐标系 X 坐标，单位 mm。
- `z_mm`：工件局部坐标系 Z 坐标，单位 mm。
- `temperature_c`：温度，单位摄氏度。

当前 3D 演示使用 `100 mm x 100 mm` 平板/展开面，坐标建议覆盖：

- `x_mm`: `-50` 到 `50`
- `z_mm`: `-50` 到 `50`

## 示例文件

- CSV 样例：[data/demo/temperature_field.csv](../data/demo/temperature_field.csv)
- 转换后 JSON：[public/simulation/temperature_field.json](../public/simulation/temperature_field.json)
- 当前页面演示 JSON：[public/simulation/temperature_demo.json](../public/simulation/temperature_demo.json)

## 转换命令

默认转换：

```powershell
npm.cmd run convert:temperature
```

指定输入和输出：

```powershell
node scripts\convert-temperature-csv.js data\demo\temperature_field.csv public\simulation\temperature_field.json
```

## 前端 JSON 结构

转换后的 JSON 主要字段如下：

```json
{
  "source": "Abaqus简化热源温度场",
  "valueKey": "temperature_c",
  "xKey": "x_mm",
  "zKey": "z_mm",
  "valueLabel": "温度",
  "unit": "degC",
  "coordinate": "workpiece_local",
  "grid": {
    "columns": 40,
    "rows": 40,
    "widthMm": 100,
    "depthMm": 100
  },
  "samples": []
}
```

说明：当前格式只是前端颜色映射接口约定。只有当 Abaqus 热分析或实验测温流程本身经过验证后，才能把该 JSON 解释为真实加工温度场。

## 当前 Abaqus 简化算例

当前第一版算例采用：

- 平板尺寸：`100 mm x 100 mm x 8 mm`。
- 网格：平面 `40 x 40`，厚度方向 `2` 层，热传导单元 `DC3D8`。
- 热源：直径 `24 mm` 等效圆形区域沿 `x=-40 mm` 到 `x=40 mm` 直线路径移动。
- 输出：取上表面节点在整个瞬态过程中的最大温度，并重采样为 `40 x 40` 前端网格。
- 边界：底面简化为 `26 degC` 恒温边界。

以上参数均为第一版链路验证占位参数，后续需要用真实材料热参数、热源功率、接触/摩擦热比例和散热边界替换。
