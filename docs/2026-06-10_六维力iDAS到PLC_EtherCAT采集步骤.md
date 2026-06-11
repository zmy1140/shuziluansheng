# 六维力 iDAS 到 PLC EtherCAT 采集步骤

本文记录当前 `M3553C + M8229 + iDAS R&D + AI820` 六维力接入的下一步操作。

## 当前状态

- 已能用 iDAS R&D 通过 USB Type-C 数据线直连 M8229 采集数据。
- 已导出样例文件：`D:\iDAS R&D\Data\10sqingya.txt`。
- 该文件格式为 `CH1;CH2;CH3;CH4;CH5;CH6`，每行形如 `采样序号=六个通道值`。
- 本轮按用户确认的采样频率 `200 Hz` 处理。
- 已新增项目命令：

```powershell
npm.cmd run convert:force:file -- "D:\iDAS R&D\Data\10sqingya.txt" --sample-rate 200
```

该命令会在原文件同目录生成同名 JSON，例如 `D:\iDAS R&D\Data\10sqingya.json`。

## iDAS 对照样例

去 PLC 前建议至少补齐四组 iDAS 对照文件：

| 文件名建议 | 动作 | 目的 |
| --- | --- | --- |
| `10s_kongzai.txt` | 空载调零后静止 10 s | 判断零点和漂移 |
| `10s_fx_qingya.txt` | 轻压 Fx 方向 | 确认 Fx 方向响应 |
| `10s_fy_qingya.txt` | 轻压 Fy 方向 | 确认 Fy 方向响应 |
| `10s_fz_qingya.txt` | 轻压 Fz 方向 | 确认 Fz 方向响应 |

每组记录采样率、是否调零、工程单位、测试动作、文件名和日期。

## PLC EtherCAT 读取步骤

1. 在 AI820 / InoProShop 工程中导入 M8229 的 EtherCAT ESI/XML 设备描述文件。
2. 用 AI820 的 EtherCAT 口连接 M8229 EtherCAT 网口。
3. 扫描 EtherCAT 从站，确认 M8229 在线并进入正常状态。
4. 映射 M8229 的工程量对象，优先读取：
   - `0x6030.01`：DataNo
   - `0x6030.02`：Fx，单位 N
   - `0x6030.03`：Fy，单位 N
   - `0x6030.04`：Fz，单位 N
   - `0x6030.05`：Mx，单位 Nm
   - `0x6030.06`：My，单位 Nm
   - `0x6030.07`：Mz，单位 Nm
5. 在变量表中建立 `force_fx_n`、`force_fy_n`、`force_fz_n`、`torque_mx_nm`、`torque_my_nm`、`torque_mz_nm`。
6. 在线监控变量，轻压传感器并与 iDAS 对照样例比较方向和量级。

## 验收标准

- iDAS 能稳定导出六通道 TXT。
- 项目脚本能把 TXT 转为 JSON。
- 网页“切削力”页能导入 iDAS TXT 并按 1 秒窗口回放 Fx/Fy/Fz、合力均值和峰峰值。
- PLC 端 EtherCAT 从站在线，DataNo 持续递增。
- PLC 读到的 Fx/Fy/Fz/Mx/My/Mz 与 iDAS 同动作样例方向一致，数值量级接近。

## 边界

- 当前只做读取和对照，不做力控闭环。
- 如果 PLC 读数与 iDAS 明显不一致，优先检查 ESI/XML、PDO 映射、工程量类型、字节顺序和 M8229 标定矩阵，不要先改前端。
