# 设备资料索引

资料来源：`D:\Desktop\进气道项目\08传感器等采购`

本文档记录已从采购资料目录中筛选并复制到当前项目的技术资料。筛选原则是：优先保留传感器、采集卡、主轴控制器、通讯协议、采集软件使用手册和与后续仿真有关的材料参数；暂不纳入安装包、DLL、MSI、报价单、采购合同、软件 license 和体积较大但当前不直接服务传感器读数链路的产品目录。

## 六维力

目录：`docs/equipment_reference/force/`

| 文件 | 用途 |
| --- | --- |
| `M3553C_six_axis_force_sensor.pdf` | 六维力传感器 M3553C 资料，后续用于核对量程、坐标系、外形和标定信息。 |
| `M8229_acquisition_card_user_manual_v2.1_chn.pdf` | M8229 采集卡用户手册 V2.1，后续用于确认采样率、通道、通信方式和数据读取方式。 |
| `M8229f32_ethercat_esi.xml` | M8229f32 EtherCAT ESI/XML 描述文件，后续用于 PLC/EtherCAT 工程配置和变量映射核对。 |
| `six_axis_force_sensor_notes.docx` | 采购阶段整理的六维力传感器说明或备注。 |
| `six_axis_force_sensor_selection.xlsx` | 六维力传感器选型表，后续用于追溯选型依据。 |

下一步重点：

- 确认 M3553C 的标定矩阵、坐标系方向、量程和单位。
- 确认 M8229 实际接入方式是 EtherCAT 还是串口，以及真实采样率；如果走 EtherCAT，基于 `M8229f32_ethercat_esi.xml` 继续核对对象字典和过程数据映射。
- 确认软件导出的原始字段名和单位。

## 三轴振动

目录：`docs/equipment_reference/vibration/`

| 文件 | 用途 |
| --- | --- |
| `CA-YD-3EC3001_triaxial_piezo_accelerometer_spec.pdf` | 三向压电加速度传感器规格书，用于确认量程、灵敏度、频响和 IEPE 供电要求。 |
| `YE6275D_data_acquisition_user_manual.pdf` | YE6275D 数据采集器使用手册，后续用于配置通道、采样率和采集软件。 |
| `YE6275D_communication_protocol.pdf` | YE6275D 通讯协议，是后续直接读取或自动化采集的重要依据。 |
| `YE6231G_data_acquisition_user_manual.pdf` | YE6231G 数据采集器手册，仅作为旧版或历史对照资料保留，不作为当前实验采集链路。 |

下一步重点：

- 当前实验明确使用 YE6275D；YE6231G 仅保留为历史参考资料。
- 确认三轴加速度传感器接入通道、采样率和导出格式。
- 优先拿到空载、主轴空转和轻微接触三类原始数据样例。

## 主轴与浮动装置

目录：`docs/equipment_reference/spindle/`

| 文件 | 用途 |
| --- | --- |
| `RBZ-E30-B80_spindle_controller_manual.pdf` | 电主轴控制器说明书，后续用于确认 RS485/Modbus、转速、报警、负载或电流读取方式。 |
| `RBZ_spindle_and_floating_unit_docs_20260121.pdf` | 主轴及浮动相关资料，用于理解主轴、浮动磨头或辅助结构。 |

下一步重点：

- 确认主轴控制器是否能读实际转速、负载、电流和报警代码。
- 找到或确认 Modbus 寄存器地址。
- 如果暂时不能通讯读取，至少记录控制器显示值和人工设定值。

## 采集软件

目录：`docs/equipment_reference/software/`

| 文件 | 用途 |
| --- | --- |
| `iDAS_RD_user_manual_20260525.pdf` | iDAS R&D 使用手册 20260525，后续用于六维力采集软件操作、数据导出和标定相关流程。 |

下一步重点：

- 确认 iDAS 是否用于 M8229/M3553C 实际采集。
- 找到数据导出格式，保存一份空载和加载样例。

## PLC / 控制器

目录：`docs/equipment_reference/plc/`

| 文件 | 用途 |
| --- | --- |
| `AI810_AI820_AI830_digital_intelligent_controller_user_manual_cn_b00.pdf` | 汇川 AI810/AI820/AI830 数字智能控制器用户手册，用于确认控制器接口、EtherCAT、RS485、Modbus 和硬件能力。 |
| `InoProShop_software_manual.pdf` | InoProShop 软件手册，用于 PLC 工程创建、通信配置、变量配置和调试。 |
| `InoProShop_instruction_manual.pdf` | InoProShop 指令手册，用于查找通信、数据处理和控制逻辑相关指令。 |
| `InoProShop_motion_control_manual.pdf` | InoProShop 运动控制手册，用于后续电缸/运动控制，不是当前传感器读数第一优先。 |
| `Beckhoff_EtherCAT_intro.ppt` | EtherCAT 学习资料，用于理解 EtherCAT 主从站和对象字典等概念。 |

已初步检索：

- AI810/AI820/AI830 手册中可检索到 `Modbus`、`RS485`、`EtherCAT`、`AI820` 等关键字。
- InoProShop 软件/指令/运动控制手册中可检索到 `Modbus`、`RS485`、`EtherCAT` 等关键字。

当前判断：

- 这些资料足够支撑 PLC 侧学习、工程配置和通信配置入门。
- 仅靠这些 PLC 手册还不能直接完成所有传感器读取；还需要被读取设备的通信协议、寄存器表、EtherCAT ESI/XML、通道映射和标定换算关系。

下一步重点：

- 确认 AI820 实物型号、已接线端口和实际作为 EtherCAT 主站、Modbus 主站还是只做控制平台。
- 对 M8229、YE6275D、RBZ-E30-B80 分别确认 PLC 读取方式：EtherCAT、RS485/Modbus、以太网协议，还是只能通过配套上位机软件导出。
- 不建议 PLC 直接读取高频振动和声发射原始波形；PLC 更适合读取低频状态、设备状态、主轴状态和经采集器/上位机处理后的摘要特征。

## 运动控制参考

目录：`docs/equipment_reference/motion/`

| 文件 | 用途 |
| --- | --- |
| `SAC2-NP1_single_axis_driver_manual.pdf` | 单轴驱动器操作手册，当前不是传感器主线，但可能与后续进给或电缸运动状态有关。 |
| `SAC_1Axis_v1.0.0.0.xml` | 单轴驱动器配置或描述文件，作为通信/设备配置参考。 |

下一步重点：

- 仅在需要记录电缸位置、速度或运动状态时再深入使用。
- 当前传感器读数阶段不优先处理。

## 材料与仿真

目录：`docs/equipment_reference/materials/`

| 文件 | 用途 |
| --- | --- |
| `coating_properties.xlsx` | 涂层性质表，后续用于 Abaqus 材料参数、热参数或设计报告依据。 |

下一步重点：

- 核对表中是否包含热导率、密度、比热、弹性模量等仿真需要的参数。
- 如参数缺失，需要从实验、厂家资料或文献补充。

## 未复制的资料

以下内容暂未放入当前项目：

- 安装包、`.exe`、`.msi`、`.dll`、`.cab`、压缩包和软件运行目录。
- 报价单、采购合同和联系人表。
- 软件 license 文档。
- `2025 iGrinder Product catalog.pdf`：体积较大，当前不直接服务传感器读数链路；如后续需要研究浮动磨头/打磨工具，再单独纳入。
- `DH_MCEA选型手册-CN-电子板-2508.pdf`：体积较大，当前不直接服务传感器读数链路；如后续需要电缸选型或运动控制，再单独纳入。

## 后续整理建议

1. 先根据这些手册修订 `docs/实验数据字段表.md` 中的待确认项。
2. 每个设备至少导出一份空载和激励状态样例，记录到 `data/raw/` 或用户指定的数据目录。
3. 拿到真实导出文件后，再建立窗口级特征 CSV/JSON，不要直接把高频原始波形塞进前端大 JSON。
