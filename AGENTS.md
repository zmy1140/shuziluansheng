# Codex Project Instructions

## 新对话接手顺序

新的 Codex 对话接手本项目时，必须先按下面顺序建立上下文：

1. 阅读 `AGENTS.md`，明确项目边界、禁止事项和工作规则。
2. 阅读 `docs/context.md`，了解项目目标、已完成进度、当前技术路线和已知问题。
3. 阅读 `docs/todo.md`，按 P0/P1/P2 判断当前最应该做的任务。
4. 查看仓库结构和关键文件，但不要一上来重构业务代码。
5. 如果任务涉及代码修改，先运行或至少确认可运行命令；完成后运行 `npm.cmd test` 和 `npm.cmd run build`。
6. 任务结束时立即更新 `docs/context.md`；如果任务清单变化，同步更新 `docs/todo.md`。

如果 PowerShell 普通 `Get-Content` 显示中文乱码，优先用下面方式读取中文文档：

```powershell
[System.Text.Encoding]::UTF8.GetString([System.IO.File]::ReadAllBytes('docs\context.md'))
```

## 项目目标

本项目是“曲形管道内壁涂层磨抛加工数字孪生前端”的长期原型项目。当前阶段目标不是做完整工业系统，而是先搭建一个可在本地电脑离线运行的网页端监测与数字孪生展示框架，用于后续接入力、振动、声发射、主轴状态等信号，并最终服务于粗糙度 Ra 预测。

当前研究重点已从项目书中的大范围“加工状态预测与调控”收敛为：先完成粗糙度预测相关的数据展示、前端壳体、3D 工位可视化和后续模型接口预留。

## 项目结构

- `index.html`：Vite 入口 HTML。
- `src/app.js`：页面 DOM 结构和主要界面模块，包括左侧导航、各监测页面、右侧状态栏。
- `src/main.js`：前端启动逻辑、页面切换、模型状态提示、模拟数据刷新。
- `src/scene.js`：Three.js 场景、GLB/GLTF 导入、Draco 解码、模型归一化和自动居中视图。
- `src/style.css`：本地工控监测风格界面样式。
- `src/app.test.js`：Vitest + jsdom 基础结构测试。
- `public/draco/`：Draco 解码器文件，GLB 压缩模型加载依赖此目录。
- `public/models/`：固定演示模型资源，例如局部打磨工具 `tool.glb`。
- `public/paths/`：前端读取的路径 JSON，例如直线打磨路径。
- `public/simulation/`：前端读取的仿真或演示场量 JSON，例如温度场演示数据。
- `data/demo/`：演示用 CSV 数据源，例如同门路径规划可导出的路径 CSV 样例。
- `scripts/`：本地数据转换/生成脚本，例如路径 CSV 转 JSON。
- `docs/temperature-field-format.md`：温度场 CSV/JSON 格式约定，供 Abaqus 后处理或实验测温数据整理时参考。
- `dist/`：构建产物，不作为源码手动维护。
- `node_modules/`：依赖目录，不手动编辑。
- `docs/context.md`：长期上下文交接文档，新对话优先阅读。
- `docs/todo.md`：后续任务清单。
- `师兄任务纪要与第一阶段目标.txt`：早期录音整理和第一阶段目标记录。

## 常用命令

在项目根目录 `C:\Users\123\Documents\Codex\数字孪生前端` 执行：

```powershell
npm.cmd install
npm.cmd run dev -- --host 127.0.0.1
npm.cmd test
npm.cmd run build
npm.cmd run convert:path
npm.cmd run convert:temperature
npm.cmd run preview
```

说明：

- `npm.cmd install` 只在 `node_modules/` 缺失或依赖损坏时执行。
- 开发预览通常访问 `http://127.0.0.1:5173/`。
- `npm.cmd test` 用于运行基础前端结构测试。
- `npm.cmd run build` 用于确认生产构建是否通过。
- `npm.cmd run convert:path` 用于将 `data/demo/line_grinding_path.csv` 转换为 `public/paths/line_grinding_path.json`。
- `npm.cmd run convert:temperature` 用于将 `data/demo/temperature_field.csv` 转换为 `public/simulation/temperature_field.json`。
- Three.js 体积较大，构建时出现 chunk size 警告是当前可接受现象，不等于构建失败。

## 当前可运行状态

- 当前项目是纯前端本地演示项目。
- 当前没有后端服务、数据库服务、真实 UDP 采集服务或真实粗糙度预测模型。
- 运行开发预览后，应能看到本地工控监测风格界面。
- 左侧导航应能切换：工况总览、切削力、振动分析、声发射、主轴状态、粗糙度预测。
- 工况总览中应保留 3D 模型视窗、GLB 导入按钮和自动居中功能。
- 工况总览当前包含局部打磨温度场演示：固定工具模型、直线路径、平板/展开面温度网格；该温度场是演示数据，不代表真实 Abaqus 或实验结果。
- 页面中的数据当前是模拟值，不代表真实实验数据。

## 编码与修改规则

- 默认只做小范围、可验证的修改，避免一次性重构过多文件。
- 业务代码修改前先阅读 `docs/context.md` 和 `docs/todo.md`。
- 页面应保持本地离线可运行，不引入 CDN、在线字体、在线图标库或外部 API。
- 不新增后端、数据库、真实 UDP 采集、机器学习模型，除非用户明确要求。
- 保留并保护 Three.js 的 GLB 导入、Draco 支持和自动居中能力。
- 手动编辑文件时使用 `apply_patch`。
- 不手动编辑 `node_modules/`、`dist/` 中的构建产物。
- UI 行为变更后应同步更新或新增测试。
- 中文文案在 PowerShell 中可能显示为乱码，应优先用 VS Code、浏览器实际渲染或明确编码检查来判断，不要仅凭终端显示批量改中文。
- 如果发现文档或源码“看起来乱码”，先判断是终端输出编码问题还是文件内容实际损坏；不要未经确认批量替换中文。
- 不要把“数字孪生”理解为已经完成物理场仿真或闭环控制；当前只完成前端展示壳体和 3D 模型可视化基础。
- 不要把右侧 UDP、阈值、运行状态模块理解为已接入真实设备；它们当前是界面占位。

## 禁止事项

禁止批量删除文件或目录。不要使用：

- `del /s`
- `rd /s`
- `rmdir /s`
- `Remove-Item -Recurse`
- `rm -rf`

需要删除文件时，只能一次删除一个明确路径的文件，例如：

```powershell
Remove-Item "C:\path\to\file.txt"
```

如果需要批量删除文件，应停止操作并询问用户，让用户手动删除。

其他禁止事项：

- 不要使用 `git reset --hard`、`git checkout --` 等破坏性命令，除非用户明确要求。
- 不要在“只更新文档”的任务中修改业务代码。
- 不要把项目改成依赖联网才能运行。
- 不要为了展示效果虚构已经接入真实传感器或真实粗糙度模型。

## 每次任务结束必须更新

每次完成任务后，必须立即更新长期上下文，而不是等到下次对话：

- 更新 `docs/context.md`：记录本次完成内容、关键决策、踩坑、当前状态和下一步。
- 如果后续任务发生变化，更新 `docs/todo.md`。
- 如果项目规则、命令、结构发生变化，更新 `AGENTS.md`。

结束回复中要简要说明：改了哪些文件、验证了什么、还有什么风险或下一步。
如果任务涉及前端页面或演示效果，结束回复中必须提供本地预览地址：`http://127.0.0.1:5173/`。
