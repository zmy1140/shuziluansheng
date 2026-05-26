# 数字孪生磨抛监测前端

本项目是“曲形管道内壁涂层磨抛加工数字孪生前端”的本地原型。当前阶段目标是搭建一个可离线运行的网页端监测与 3D 工位展示框架，为后续接入力、振动、声发射、主轴状态等实验信号，以及粗糙度 Ra 预测结果展示做准备。

当前项目不是完整工业系统，也没有接入真实传感器、后端服务、数据库或真实粗糙度预测模型。页面中的数值为本地模拟数据，用于验证界面结构和后续数据接入口。

## 当前功能

- 本地工控监测风格界面。
- 左侧导航切换：工况总览、切削力、振动分析、声发射、主轴状态、粗糙度预测。
- 工况总览中显示 Three.js 3D 工位视窗。
- 支持导入 `.glb` / `.gltf` 模型。
- 支持 Draco 压缩模型解码，解码器位于 `public/draco/`。
- 导入模型后自动归一化，并提供“自动居中”按钮。
- 工况总览包含局部打磨温度场演示：固定工具模型沿一条直线路径运动，工件平板/展开面按演示温度场 JSON 着色。
- 支持将路径 CSV 转换为前端读取的路径 JSON，便于后续接同门路径规划结果。
- 支持将温度场 CSV 转换为前端读取的温度场 JSON，便于后续接 Abaqus 后处理或实验测温结果。
- 使用模拟数据刷新力、振动、声发射、主轴转速和粗糙度展示值。

## 运行环境

需要本机已安装 Node.js 和 npm。项目依赖已写入 `package.json`，首次运行或依赖缺失时执行：

```powershell
npm.cmd install
```

## 本地启动

在项目根目录执行：

```powershell
npm.cmd run dev -- --host 127.0.0.1
```

启动后通常访问：

```text
http://127.0.0.1:5173/
```

## 测试与构建

运行基础结构测试：

```powershell
npm.cmd test
```

运行生产构建：

```powershell
npm.cmd run build
```

构建时如果出现 Three.js chunk size 警告，当前阶段可以接受；只要命令退出成功，就表示构建通过。

转换演示路径 CSV：

```powershell
npm.cmd run convert:path
```

默认会读取 `data/demo/line_grinding_path.csv`，生成 `public/paths/line_grinding_path.json`。

转换温度场 CSV：

```powershell
npm.cmd run convert:temperature
```

默认会读取 `data/demo/temperature_field.csv`，生成 `public/simulation/temperature_field.json`。格式说明见 `docs/temperature-field-format.md`。

## 导入 3D 模型

1. 启动本地开发服务器。
2. 在页面右上角点击“导入GLB”。
3. 选择本地 `.glb` 或 `.gltf` 文件。
4. 模型载入后会自动居中；如果视角不合适，可点击“三维工位”区域中的“自动居中”按钮。

注意：如果模型使用 Draco 压缩，必须保留 `public/draco/` 下的解码器文件。

## 项目边界

- 当前没有后端 API。
- 当前没有数据库。
- 当前没有真实 UDP 采集。
- 当前没有真实粗糙度预测模型。
- 当前所有传感器数据和 Ra 值都是模拟数据。
- 项目应保持本地离线可运行，不应引入 CDN、在线字体、在线图标库或外部接口依赖。

## 主要目录

- `src/app.js`：页面结构、导航、监测模块和主要文案。
- `src/main.js`：启动逻辑、页面切换、模型状态提示和模拟数据刷新。
- `src/scene.js`：Three.js 场景、GLB/GLTF 导入、Draco 解码和自动居中。
- `src/path.js`：路径 CSV 解析为前端路径 JSON 的基础逻辑。
- `src/temperature.js`：温度场 CSV 解析为前端温度场 JSON 的基础逻辑。
- `src/simulation.js`：仿真/温度场样本映射到前端网格色块的基础逻辑。
- `src/style.css`：界面样式。
- `src/app.test.js`：Vitest + jsdom 基础结构测试。
- `public/draco/`：Draco 解码器文件。
- `public/models/`：固定演示模型资源，例如 `tool.glb`。
- `public/paths/`：前端读取的路径 JSON。
- `public/simulation/`：前端读取的仿真或演示场量 JSON。
- `data/demo/`：演示 CSV 数据源。
- `scripts/`：本地数据转换/生成脚本。
- `docs/temperature-field-format.md`：温度场 CSV/JSON 格式约定。
- `docs/context.md`：长期上下文交接文档。
- `docs/todo.md`：后续任务清单。
- `AGENTS.md`：Codex 项目规则和禁止事项。

## 后续方向

近期优先级是继续确认真实采集链路、真实仿真参数和粗糙度标签，并把当前演示路径/演示温度场 JSON 逐步替换为同门路径规划输出和 Abaqus 后处理结果。
