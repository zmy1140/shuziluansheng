# 温度场 CSV/JSON 格式约定

当前前端不直接读取 Abaqus ODB、CAE 文件或实验设备原始文件。Abaqus 后处理脚本或实验测温整理脚本应先导出标准 CSV，再由项目脚本转换为前端 JSON。

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
  "source": "temperature_field_csv",
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
