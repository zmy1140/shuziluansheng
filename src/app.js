const navItems = [
  ["overview", "01", "工况总览"],
  ["force", "02", "切削力"],
  ["vibration", "03", "振动分析"],
  ["acoustic", "04", "声发射"],
  ["spindle", "05", "主轴状态"],
  ["roughness", "06", "粗糙度预测"],
];

function navButton([view, index, label], active = false) {
  return `
    <button class="nav-item ${active ? "active" : ""}" type="button" data-view-target="${view}">
      <span>${index}</span>
      <strong>${label}</strong>
    </button>
  `;
}

function metricCard(title, valueAttr, initial, unit, status, detailAttr, detail) {
  return `
    <article class="metric-card">
      <div class="metric-card-head">
        <span>${title}</span>
        <b>NORMAL</b>
      </div>
      <div class="metric-main"><strong ${valueAttr}>${initial}</strong><em>${unit}</em></div>
      <p>${status}</p>
      <small ${detailAttr}>${detail}</small>
    </article>
  `;
}

function detailPanel(view, title, subtitle, content) {
  return `
    <section class="work-view ${view === "overview" ? "active" : ""}" data-view-panel="${view}">
      <div class="view-title">
        <div>
          <h2>${title}</h2>
          <p>${subtitle}</p>
        </div>
        <span class="mode-pill">本地离线</span>
      </div>
      ${content}
    </section>
  `;
}

function trendPanel(title, legend = "实时趋势") {
  return `
    <section class="monitor-card trend-card">
      <div class="section-title">
        <h3>${title}</h3>
        <span>${legend}</span>
      </div>
      <svg class="trend-svg" viewBox="0 0 600 180" role="img" aria-label="${title}">
        <defs>
          <linearGradient id="trendGradient" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stop-color="#19d3ff" />
            <stop offset="100%" stop-color="#69f0c7" />
          </linearGradient>
        </defs>
        <g class="grid-lines">
          <path d="M0 30H600M0 75H600M0 120H600M0 165H600" />
          <path d="M80 0V180M200 0V180M320 0V180M440 0V180M560 0V180" />
        </g>
        <path class="trend-line" data-trend-path d="M0 120 C90 76 140 132 220 92 S360 72 440 110 540 95 600 66" />
      </svg>
    </section>
  `;
}

function multiSignalTrendPanel() {
  const series = [
    ["force", "力"],
    ["vibration", "振动"],
    ["acoustic", "声发射"],
    ["roughness", "Ra预测"],
  ];
  const legendHtml = series
    .map(([key, label]) => `<span class="series-key series-key--${key}">${label}</span>`)
    .join("");

  return `
    <section class="monitor-card trend-card" data-trend-panel="multi-signal">
      <div class="section-title trend-title">
        <h3>实时趋势</h3>
        <div class="trend-legend" aria-label="趋势图例">${legendHtml}</div>
      </div>
      <svg class="trend-svg" viewBox="0 0 600 180" role="img" aria-label="力、振动、声发射和Ra预测归一化实时趋势">
        <g class="grid-lines">
          <path d="M0 30H600M0 75H600M0 120H600M0 165H600" />
          <path d="M80 0V180M200 0V180M320 0V180M440 0V180M560 0V180" />
        </g>
        <path class="trend-line trend-line--force" data-trend-path data-trend-signal="force" d="M0 92 C90 72 140 104 220 82 S360 72 440 92 540 86 600 70" />
        <path class="trend-line trend-line--vibration" data-trend-path data-trend-signal="vibration" d="M0 120 C90 104 140 128 220 112 S360 100 440 118 540 110 600 96" />
        <path class="trend-line trend-line--acoustic" data-trend-path data-trend-signal="acoustic" d="M0 142 C90 132 140 148 220 136 S360 128 440 144 540 130 600 124" />
        <path class="trend-line trend-line--roughness" data-trend-path data-trend-signal="roughness" d="M0 60 C90 66 140 58 220 64 S360 70 440 62 540 68 600 74" />
      </svg>
      <p class="trend-note">当前为归一化模拟趋势，用于区分多源信号展示位，暂不代表真实采样数据。</p>
    </section>
  `;
}

function parameterDetail(title, valueAttr, initial, unit, rows, trendTitle) {
  const rowHtml = rows
    .map(([label, value]) => `<div><span>${label}</span><strong>${value}</strong></div>`)
    .join("");

  return `
    <div class="detail-grid">
      <section class="monitor-card detail-readout">
        <div class="section-title">
          <h3>${title}</h3>
          <span>NORMAL</span>
        </div>
        <div class="big-number"><strong ${valueAttr}>${initial}</strong><em>${unit}</em></div>
        <div class="detail-table">${rowHtml}</div>
      </section>
      ${trendPanel(trendTitle)}
    </div>
  `;
}

function detailRows(rows) {
  return rows
    .map(([label, value]) => `<div><span>${label}</span><strong>${value}</strong></div>`)
    .join("");
}

function focusList(items) {
  return `
    <ul class="focus-list">
      ${items.map((item) => `<li>${item}</li>`).join("")}
    </ul>
  `;
}

function timeDomainChart(title, note, signal = "diagnostic") {
  return `
    <section class="monitor-card diagnostic-chart">
      <div class="section-title">
        <h3>${title}</h3>
        <span>诊断图</span>
      </div>
      <svg class="trend-svg diagnostic-svg" viewBox="0 0 600 180" role="img" aria-label="${title}">
        <g class="grid-lines">
          <path d="M0 30H600M0 75H600M0 120H600M0 165H600" />
          <path d="M80 0V180M200 0V180M320 0V180M440 0V180M560 0V180" />
        </g>
        <path class="trend-line trend-line--${signal}" data-trend-path data-trend-signal="${signal}" d="M0 110 C90 86 140 126 220 96 S360 82 440 112 540 96 600 78" />
      </svg>
      <p class="chart-note">${note}</p>
    </section>
  `;
}

function spectrumChart(title, note) {
  return `
    <section class="monitor-card diagnostic-chart">
      <div class="section-title">
        <h3>${title}</h3>
        <span>FFT频谱</span>
      </div>
      <svg class="spectrum-svg" viewBox="0 0 600 180" role="img" aria-label="${title}">
        <g class="grid-lines">
          <path d="M0 35H600M0 75H600M0 115H600M0 155H600" />
          <path d="M100 0V180M220 0V180M340 0V180M460 0V180M580 0V180" />
        </g>
        <g class="spectrum-bars">
          <rect x="44" y="116" width="18" height="42" />
          <rect x="82" y="92" width="18" height="66" />
          <rect x="120" y="72" width="18" height="86" />
          <rect x="158" y="108" width="18" height="50" />
          <rect x="196" y="46" width="18" height="112" />
          <rect x="234" y="94" width="18" height="64" />
          <rect x="272" y="120" width="18" height="38" />
          <rect x="310" y="102" width="18" height="56" />
          <rect x="348" y="130" width="18" height="28" />
          <rect x="386" y="118" width="18" height="40" />
          <rect x="424" y="138" width="18" height="20" />
          <rect x="462" y="146" width="18" height="12" />
        </g>
      </svg>
      <p class="chart-note">${note}</p>
    </section>
  `;
}

function bandEnergyPanel(rows) {
  return `
    <section class="monitor-card feature-panel">
      <div class="section-title">
        <h3>特征摘要</h3>
        <span>窗口 5 s</span>
      </div>
      <div class="band-grid">${detailRows(rows)}</div>
    </section>
  `;
}

function diagnosticDetail({
  title,
  valueAttr,
  initial,
  unit,
  status,
  statusTag = "稳定",
  focus,
  rows,
  charts,
  summary,
}) {
  return `
    <div class="diagnostic-layout">
      <section class="monitor-card diagnostic-readout">
        <div class="section-title">
          <h3>${title}</h3>
          <span>${statusTag}</span>
        </div>
        <div class="big-number"><strong ${valueAttr}>${initial}</strong><em>${unit}</em></div>
        <p class="diagnostic-status">${status}</p>
        <h4>重点看</h4>
        ${focusList(focus)}
        <div class="detail-table compact-table">${detailRows(rows)}</div>
      </section>
      <div class="diagnostic-main">
        ${charts.join("")}
        ${bandEnergyPanel(summary)}
      </div>
    </div>
  `;
}

export function createAppShell() {
  const root = document.createElement("div");
  root.className = "app-shell";

  root.innerHTML = `
    <aside class="sidebar">
      <div class="brand-block">
        <button class="back-button" type="button" aria-label="返回">&lt;</button>
        <div>
          <h1>SmartTwin</h1>
          <p>数字孪生磨抛监测系统</p>
        </div>
      </div>

      <nav class="nav-list" aria-label="监测页面">
        ${navItems.map((item, index) => navButton(item, index === 0)).join("")}
      </nav>

      <div class="device-card">
        <div><span>设备</span><strong>DT-GRIND-01</strong></div>
        <div><span>模型</span><strong>GLB / Draco</strong></div>
        <div><span>协议</span><strong>Local / UDP</strong></div>
        <div><span>版本</span><strong>v0.2.0</strong></div>
      </div>
    </aside>

    <main class="workspace">
      <header class="workspace-topbar">
        <div>
          <p>OP-01  曲形管道内壁磨抛试验</p>
          <h2 data-active-title>工况总览</h2>
        </div>
        <div class="top-status">
          <span class="run-pill"><i></i>监测中</span>
          <span>刷新 10 Hz</span>
          <span>本地离线</span>
          <label class="upload-button">
            <input data-upload-input type="file" accept=".glb,.gltf" />
            导入GLB
          </label>
        </div>
      </header>

      <div class="views">
        ${detailPanel(
          "overview",
          "工况总览",
          "3D模型、关键指标、趋势与事件集中展示。",
          `
            <section class="metric-grid">
              ${metricCard("切削力", "data-force-value", "128", "N", "法向接触稳定", "data-force-detail", "Fx 46 N / Fy 31 N / Fz 108 N")}
              ${metricCard("振动RMS", "data-vibration-value", "0.42", "g", "低频响应可控", "data-vibration-detail", "峰值 0.71 g / 主频 116 Hz")}
              ${metricCard("声发射", "data-ae-value", "31", "dB", "高频特征占位", "data-ae-detail", "能量 0.86 V²·s / 计数 248")}
              ${metricCard("粗糙度预测", "data-roughness-value", "Ra 1.62", "μm", "本地模拟，模型未接入", "data-roughness-detail", "输入占位：力 / 振动 / 声发射 / 主轴")}
            </section>

            <section class="overview-main">
              <div class="monitor-card scene-card">
                <div class="section-title">
                  <h3>三维工位</h3>
                  <button class="tool-button" type="button" data-fit-view-button>自动居中</button>
                </div>
                <div class="scene-stage" data-scene-root>
                  <div class="scene-overlay is-hidden" data-model-overlay>
                    <div class="overlay-card">
                      <span>模型状态</span>
                      <strong data-model-status>当前显示：厚板螺旋磨抛演示</strong>
                    </div>
                  </div>
                </div>
                <div class="processing-demo-panel">
                  <div>
                    <strong>局部打磨温度场演示</strong>
                    <p>固定工具模型沿平板/展开面执行一条直线打磨路径，网格颜色表示演示温度场，不代表真实打磨温度或真实Abaqus结果。</p>
                  </div>
                  <label>
                    速度
                    <select data-processing-speed aria-label="加工演示速度">
                      <option value="0.5">0.5x</option>
                      <option value="1" selected>1x</option>
                      <option value="1.5">1.5x</option>
                      <option value="2">2x</option>
                    </select>
                  </label>
                  <button class="tool-button" type="button" data-processing-reset>重置</button>
                </div>
                <div class="simulation-status" data-simulation-status>
                  <strong>温度场颜色映射原型</strong>
                  <span>当前载入演示温度场 JSON。后期 Abaqus 热仿真完成后，可导出同格式温度 JSON 直接替换。</span>
                </div>
              </div>
              <div class="monitor-card status-summary">
                <div class="overview-side-stack">
                  ${multiSignalTrendPanel()}
                </div>
              </div>
            </section>
          `,
        )}

        ${detailPanel(
          "force",
          "切削力",
          "重点判断接触稳定性、峰峰值、冲击和接触丢失。",
          diagnosticDetail({
            title: "合力",
            valueAttr: "data-force-detail-value",
            initial: "128",
            unit: "N",
            status: "状态判断：法向接触稳定，当前未见明显冲击；FFT优先级较低，后续用于周期冲击或颤振排查。",
            statusTag: "接触稳定",
            focus: ["合力均值和法向力是否稳定", "Peak / 峰峰值是否突然升高", "Fx/Fy/Fz方向变化是否对应工具姿态"],
            rows: [
              ["Fx", "46 N"],
              ["Fy", "31 N"],
              ["Fz", "108 N"],
              ["Peak", "142 N"],
              ["RMS", "96 N"],
              ["阈值", "300 N"],
            ],
            charts: [
              timeDomainChart("合力时域波形", "优先看波动、冲击尖峰和接触丢失；当前为模拟波形，不代表真实采样。", "force"),
            ],
            summary: [
              ["采样窗口", "最近 5 s"],
              ["峰峰值", "36 N"],
              ["波动系数", "7.5%"],
              ["FFT优先级", "低"],
            ],
          }),
        )}

        ${detailPanel(
          "vibration",
          "振动分析",
          "重点判断振动能量、主频、频带能量和冲击特征。",
          diagnosticDetail({
            title: "振动RMS",
            valueAttr: "data-vibration-detail-value",
            initial: "0.42",
            unit: "g",
            status: "状态判断：低频响应可控；振动页应重点看 FFT频谱、主频和峰值因子。",
            statusTag: "低频可控",
            focus: ["三轴 RMS 和 Peak 是否接近阈值", "FFT频谱主频是否稳定", "峰值因子是否提示冲击"],
            rows: [
              ["Ax", "0.18 g"],
              ["Ay", "0.21 g"],
              ["Az", "0.31 g"],
              ["Peak", "0.71 g"],
              ["主频", "116 Hz"],
              ["峰值因子", "1.69"],
            ],
            charts: [
              timeDomainChart("三轴时域波形", "用于观察瞬态冲击和低频摆动；当前为归一化模拟曲线。", "vibration"),
              spectrumChart("FFT频谱", "用于定位主频、倍频和异常频段；当前为示意频谱。"),
            ],
            summary: [
              ["低频能量", "42%"],
              ["中频能量", "36%"],
              ["高频能量", "22%"],
              ["阈值", "1.20 g"],
            ],
          }),
        )}

        ${detailPanel(
          "acoustic",
          "声发射",
          "重点判断高频能量、突发事件和异常摩擦信号。",
          diagnosticDetail({
            title: "声发射",
            valueAttr: "data-ae-detail-value",
            initial: "31",
            unit: "dB",
            status: "状态判断：高频能量处于占位范围；重点关注突发事件、Hits 和能量跃迁。",
            statusTag: "事件平稳",
            focus: ["高频能量是否突然升高", "Hits / Counts 是否密集出现", "突发事件是否与力和振动同步"],
            rows: [
              ["能量", "0.86 V²·s"],
              ["计数", "248"],
              ["频带", "100-400 kHz"],
              ["Peak", "36 dB"],
              ["突发事件", "0"],
              ["阈值", "55 dB"],
            ],
            charts: [
              timeDomainChart("AE能量趋势", "用于观察磨抛接触、异常摩擦或局部剥落导致的能量突增。", "acoustic"),
              spectrumChart("高频频带分布", "声发射更关注高频能量和事件计数；当前为示意频谱。"),
            ],
            summary: [
              ["Hits", "18"],
              ["Counts", "248"],
              ["高频能量", "31%"],
              ["突发事件", "无"],
            ],
          }),
        )}

        ${detailPanel(
          "spindle",
          "主轴状态",
          "重点判断转速偏差、电流负载和过载趋势。",
          diagnosticDetail({
            title: "主轴转速",
            valueAttr: "data-speed-detail-value",
            initial: "3200",
            unit: "rpm",
            status: "状态判断：转速偏差小，电流负载平稳；主轴页优先看负载和偏差，不优先看 FFT。",
            statusTag: "负载正常",
            focus: ["设定转速与实际转速偏差", "电流负载是否持续升高", "异常负载是否与力/振动同步"],
            rows: [
              ["设定值", "3200 rpm"],
              ["转速偏差", "0.8%"],
              ["电流", "2.4 A"],
              ["峰值电流", "2.8 A"],
              ["电流负载", "42%"],
              ["状态", "正常"],
            ],
            charts: [
              timeDomainChart("转速 / 电流趋势", "用于观察空载、过载、堵转或接触变化引起的负载波动。", "diagnostic"),
            ],
            summary: [
              ["负载均值", "42%"],
              ["负载峰值", "48%"],
              ["偏差范围", "±0.8%"],
              ["过载风险", "低"],
            ],
          }),
        )}

        ${detailPanel(
          "roughness",
          "粗糙度预测",
          "显示Ra预测结果、输入窗口、特征摘要和模型接入状态。",
          `
            <div class="diagnostic-layout">
              <section class="monitor-card diagnostic-readout">
                <div class="section-title">
                  <h3>预测结果</h3>
                  <span>DEMO</span>
                </div>
                <div class="big-number"><strong data-roughness-detail-value>Ra 1.62</strong><em>μm</em></div>
                <p class="diagnostic-status">当前为演示输出；模型未接入，不能作为真实粗糙度结论。</p>
                <h4>重点看</h4>
                ${focusList(["Ra 是否接近工艺阈值", "输入窗口内信号是否稳定", "模型状态和数据来源是否可信"])}
                <div class="detail-table compact-table">
                  ${detailRows([
                    ["输入窗口", "最近 5 s"],
                    ["力信号", "已占位"],
                    ["振动信号", "已占位"],
                    ["声发射", "已占位"],
                    ["主轴信息", "已占位"],
                    ["模型未接入", "DEMO"],
                  ])}
                </div>
              </section>
              <div class="diagnostic-main">
                ${timeDomainChart("Ra预测趋势", "用于观察预测值是否持续上升或接近阈值；当前为模拟趋势。", "roughness")}
                ${bandEnergyPanel([
                  ["力波动", "7.5%"],
                  ["振动主频", "116 Hz"],
                  ["AE能量", "0.86 V²·s"],
                  ["主轴负载", "42%"],
                ])}
              </div>
            </div>
          `,
        )}
      </div>
    </main>

    <aside class="inspector">
      <details class="monitor-card inspector-panel">
        <summary class="section-title">
          <h3>UDP通信</h3>
          <span>接口预留</span>
        </summary>
        <div class="inspector-panel-body">
          <p class="panel-note">当前未接入真实设备，端口和远端地址仅用于后续采集接口设计。</p>
          <label>本地监听端口<input value="1001" readonly /></label>
          <label>远端地址<input value="192.168.4.1:1001" readonly /></label>
          <label>数据模式<input value="特征值 10Hz" readonly /></label>
          <button class="primary-button" type="button" disabled>监听占位</button>
        </div>
      </details>

      <details class="monitor-card inspector-panel">
        <summary class="section-title">
          <h3>报警阈值</h3>
          <span>已启用</span>
        </summary>
        <div class="inspector-panel-body">
          <div class="threshold-grid">
            <label>力 N<input value="300" readonly /></label>
            <label>振动 g<input value="1.20" readonly /></label>
            <label>声发射 dB<input value="55" readonly /></label>
            <label>Ra μm<input value="2.0" readonly /></label>
          </div>
        </div>
      </details>

      <details class="monitor-card inspector-panel run-card">
        <summary class="section-title">
          <h3>运行状态</h3>
          <span>RUN</span>
        </summary>
        <div class="inspector-panel-body">
          <div class="run-list">
            <div><span>采集时长</span><strong data-runtime>00:01:31</strong></div>
            <div><span>记录文件</span><strong>session_001.bin</strong></div>
            <div><span>最近数据包</span><strong>SYSTEM OK</strong></div>
            <div><span>网络状态</span><strong>本地离线</strong></div>
          </div>
        </div>
      </details>

      <details class="monitor-card inspector-panel event-card">
        <summary class="section-title">
          <h3>报警与事件</h3>
          <span>1 event</span>
        </summary>
        <div class="inspector-panel-body">
          <table>
            <thead><tr><th>时间</th><th>等级</th><th>来源</th><th>描述</th></tr></thead>
            <tbody>
              <tr><td>11:12:10</td><td>OK</td><td>SYSTEM</td><td>等待本地数据接入</td></tr>
            </tbody>
          </table>
        </div>
      </details>
    </aside>
  `;

  return root;
}
