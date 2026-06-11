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

const forceScopeChannels = [
  { id: "ch1", label: "CH1", color: "#ff2d2d", value: "14.992", peak: "1.356", offset: "0.000" },
  { id: "ch2", label: "CH2", color: "#16d92e", value: "-0.287", peak: "3.379", offset: "0.000" },
  { id: "ch3", label: "CH3", color: "#2749ff", value: "-3.076", peak: "1.003", offset: "0.000" },
  { id: "ch4", label: "CH4", color: "#a000a8", value: "-0.038", peak: "0.065", offset: "0.000" },
  { id: "ch5", label: "CH5", color: "#9a9300", value: "-0.011", peak: "0.052", offset: "0.000" },
  { id: "ch6", label: "CH6", color: "#0c1f99", value: "-0.163", peak: "0.008", offset: "0.000" },
];

function forceScopeValue(channelId, t) {
  const ripple = Math.sin(t * 620) * 0.18 + Math.sin(t * 1040) * 0.08;
  if (channelId === "ch1") {
    return 14.8 + Math.sin(t * 10.5) * 1.1 + Math.exp(-t * 12) * Math.sin(t * 58) * 0.55 + ripple;
  }
  if (channelId === "ch2") {
    const earlyDrop = 13.8 / (1 + Math.exp(-(t - 0.15) * 42));
    const valley = 13.5 * Math.exp(-(((t - 0.67) / 0.13) ** 2));
    return 13.2 - earlyDrop - valley + Math.sin(t * 32) * 0.45 + ripple * 1.1;
  }
  if (channelId === "ch3") {
    return -3.3 - Math.exp(-(((t - 0.45) / 0.2) ** 2)) * 1.55 + Math.sin(t * 28) * 0.28 + ripple * 0.55;
  }
  if (channelId === "ch4") {
    return -0.04 + Math.sin(t * 38) * 0.12 + ripple * 0.12;
  }
  if (channelId === "ch5") {
    return -0.12 + Math.cos(t * 34) * 0.1 + ripple * 0.1;
  }
  return -0.14 + Math.sin(t * 36 + 1.2) * 0.08 + ripple * 0.08;
}

function forceScopeY(value) {
  return Math.min(244, Math.max(34, 161 - value * 5.1));
}

function forceScopePath(channelId) {
  return Array.from({ length: 150 }, (_, index) => {
    const t = index / 149;
    const x = 70 + t * 560;
    const y = forceScopeY(forceScopeValue(channelId, t));
    return `${index === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join(" ");
}

function forceScopeChart(title, note) {
  const tooltipRows = forceScopeChannels
    .map(
      (channel, index) => `
        <g data-force-tooltip-channel="${channel.id}" transform="translate(0 ${24 + index * 24})">
          <rect class="scope-tooltip-swatch scope-tooltip-swatch--${channel.id}" x="0" y="-14" width="46" height="22" rx="2" />
          <text class="scope-tooltip-label" x="6" y="1">${channel.label}:</text>
          <text class="scope-tooltip-value" data-force-tooltip-value="${channel.id}" x="54" y="1">${forceScopeValue(channel.id, 0.63).toFixed(2)}</text>
        </g>
      `,
    )
    .join("");

  return `
    <section class="monitor-card diagnostic-chart force-scope-card">
      <div class="section-title">
        <h3>${title}</h3>
        <span>诊断图 · <b data-force-scope-window>10 s/div</b></span>
      </div>
      <div class="scope-layout">
        <div class="scope-plot-panel">
          <div class="scope-toolbar">
            <strong>显示曲线</strong>
            <div class="scope-tools" aria-label="曲线缩放操作">
              <button class="icon-button" type="button" title="放大时间轴" aria-label="放大时间轴" data-force-scope-zoom-in>+</button>
              <button class="icon-button" type="button" title="缩小时间轴" aria-label="缩小时间轴" data-force-scope-zoom-out>-</button>
              <button class="icon-button" type="button" title="复位视图" aria-label="复位视图" data-force-scope-reset>↺</button>
            </div>
          </div>
          <svg class="force-scope-svg" data-force-scope-chart viewBox="0 0 720 300" role="img" aria-label="${title}">
            <defs>
              <clipPath id="forceScopeClip">
                <rect x="70" y="26" width="560" height="226" />
              </clipPath>
            </defs>
            <rect class="scope-paper" x="0" y="0" width="720" height="300" rx="4" />
            <g class="scope-grid">
              <path d="M70 26H630M70 71H630M70 116H630M70 161H630M70 206H630M70 252H630" />
              <path d="M70 26V252M182 26V252M294 26V252M406 26V252M518 26V252M630 26V252" />
            </g>
            <g class="scope-axis">
              <path d="M70 252H638" />
              <path d="M70 252V20" />
              <text x="22" y="141" transform="rotate(-90 22 141)">ENG</text>
              <text x="42" y="48">20</text>
              <text x="42" y="93">10</text>
              <text x="48" y="165">0</text>
              <text x="36" y="210">-10</text>
              <text x="36" y="255">-20</text>
              <text x="72" y="284">00:00:06.325</text>
              <text x="294" y="284">00:00:06.825</text>
              <text x="515" y="284">00:00:07.325</text>
            </g>
            <g clip-path="url(#forceScopeClip)">
              <g data-force-scope-viewport>
                ${forceScopeChannels
                  .map(
                    (channel) =>
                      `<path class="scope-line scope-line--${channel.id}" data-force-scope-series="${channel.id}" d="${forceScopePath(channel.id)}" />`,
                  )
                  .join("")}
              </g>
            </g>
            <g class="scope-hover" data-force-scope-cursor opacity="0" transform="translate(423 0)">
              <path class="scope-hover-line" d="M0 26V252" />
              ${forceScopeChannels
                .map(
                  (channel) =>
                    `<circle class="scope-hover-dot scope-hover-dot--${channel.id}" data-force-tooltip-dot="${channel.id}" cx="0" cy="${forceScopeY(forceScopeValue(channel.id, 0.63)).toFixed(1)}" r="4" />`,
                )
                .join("")}
            </g>
            <g class="scope-hover-tooltip" data-force-scope-tooltip opacity="0" transform="translate(436 46)">
              <rect class="scope-tooltip-shadow" x="4" y="4" width="112" height="164" rx="3" />
              <rect class="scope-tooltip-panel" x="0" y="0" width="112" height="164" rx="3" />
              <text class="scope-tooltip-time" data-force-tooltip-time x="8" y="16">00:00:06.955</text>
              ${tooltipRows}
            </g>
            <rect class="scope-hit-area" data-force-scope-hit-area x="70" y="26" width="560" height="226" />
          </svg>
        </div>
        <aside class="scope-settings-panel">
          <h4>显示设置</h4>
          <table class="scope-settings-table">
            <thead>
              <tr><th></th><th>颜色</th><th>值</th><th>峰峰值</th><th>偏移</th></tr>
            </thead>
            <tbody>
              ${forceScopeChannels
                .map(
                  ({ label, color, value, peak, offset }) => `
                    <tr>
                      <td><label><input type="checkbox" checked disabled />${label}</label></td>
                      <td><span class="scope-swatch" style="background:${color}"></span></td>
                      <td data-force-scope-current="${label.toLowerCase()}">${value}</td>
                      <td data-force-scope-peak="${label.toLowerCase()}">${peak}</td>
                      <td>${offset}</td>
                    </tr>
                  `,
                )
                .join("")}
            </tbody>
          </table>
        </aside>
      </div>
      <p class="chart-note" data-force-scope-note>${note}</p>
    </section>
  `;
}

function timeDomainChart(title, note, signal = "diagnostic") {
  if (signal === "force") {
    return forceScopeChart(title, note);
  }

  const isVibrationChart = signal === "vibration";

  return `
    <section class="monitor-card diagnostic-chart">
      <div class="section-title">
        <h3>${title}</h3>
        <span>诊断图</span>
      </div>
      <svg class="trend-svg diagnostic-svg" ${isVibrationChart ? "data-vibration-wave-chart" : ""} viewBox="0 0 600 220" role="img" aria-label="${title}">
        <g class="grid-lines">
          <path d="M70 28H580M70 78H580M70 128H580M70 178H580" />
          <path d="M70 28V178M197 28V178M325 28V178M452 28V178M580 28V178" />
        </g>
        <g class="chart-axis">
          <path d="M70 178H586" />
          <path d="M70 178V22" />
          <text x="325" y="214">时间 / s</text>
          <text x="18" y="112" transform="rotate(-90 18 112)">归一化幅值</text>
          <text x="66" y="198">0</text>
          <text x="190" y="198">0.25</text>
          <text x="318" y="198">0.50</text>
          <text x="445" y="198">0.75</text>
          <text x="574" y="198">1</text>
          <text x="38" y="182">-1</text>
          <text x="44" y="132">0</text>
          <text x="42" y="82">0.5</text>
          <text x="44" y="32">1</text>
        </g>
        ${
          isVibrationChart
            ? `
              <g class="axis-wave-lines">
                <path class="axis-wave axis-wave--x" data-acc-wave-axis="x" d="M70 128 C145 105 197 102 270 126 S410 154 580 126" />
                <path class="axis-wave axis-wave--y" data-acc-wave-axis="y" d="M70 124 C145 96 197 102 270 128 S410 160 580 130" />
                <path class="axis-wave axis-wave--z" data-acc-wave-axis="z" d="M70 132 C145 112 197 106 270 124 S410 148 580 122" />
              </g>
              <g class="wave-marker" data-acc-wave-marker>
                <path d="M325 28V178" />
                <circle cx="325" cy="128" r="5" />
              </g>
              <g class="wave-legend">
                <text x="82" y="22">X轴</text>
                <text x="134" y="22">Y轴</text>
                <text x="186" y="22">Z轴</text>
              </g>
              <text class="wave-caption" data-acc-wave-caption x="382" y="22">窗口：待载入</text>
            `
            : `<path class="trend-line trend-line--${signal}" data-trend-path data-trend-signal="${signal}" d="M70 128 C145 104 195 144 260 114 S400 100 460 130 535 114 580 96" />`
        }
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

function accelerationReplayPanel() {
  return `
    <section class="monitor-card feature-panel acceleration-replay-panel">
      <div class="section-title">
        <h3>真实三轴数据回放</h3>
        <span>YE6275D</span>
      </div>
      <label class="replay-selector">
        <span>回放数据</span>
        <select data-acceleration-run-select aria-label="选择三轴加速度回放数据" disabled>
          <option value="">请先导入TXT/CSV</option>
        </select>
        <button class="tool-button" type="button" data-acceleration-import-button>导入TXT/CSV</button>
        <input data-acceleration-file-input type="file" accept=".txt,.csv,text/plain,text/csv" />
      </label>
      <p class="chart-note" data-acceleration-import-status>未导入三轴数据。请选择 YE6275D 三列 txt/csv。</p>
      <p class="chart-note" data-acceleration-source>未导入三轴加速度数据。</p>
      <div class="detail-table compact-table">
        ${detailRows([
          ["回放窗口", '<span data-acceleration-window>待载入</span>'],
          ["X轴 RMS", '<span data-acc-rms-x>--</span> m/s²'],
          ["Y轴 RMS", '<span data-acc-rms-y>--</span> m/s²'],
          ["Z轴 RMS", '<span data-acc-rms-z>--</span> m/s²'],
          ["合成 RMS", '<span data-acc-vector-rms>--</span> m/s²'],
          ["峰峰值", '<span data-acc-peak-to-peak>--</span> m/s²'],
        ])}
      </div>
    </section>
  `;
}

function forceReplayPanel() {
  return `
    <section class="monitor-card feature-panel force-replay-panel">
      <div class="section-title">
        <h3>iDAS 六维力数据回放</h3>
        <span>M8229 / 200 Hz</span>
      </div>
      <label class="replay-selector">
        <span>回放数据</span>
        <select data-force-run-select aria-label="选择六维力回放数据" disabled>
          <option value="">请先导入TXT</option>
        </select>
        <button class="tool-button" type="button" data-force-import-button>导入TXT</button>
        <input data-force-file-input type="file" accept=".txt,.csv,text/plain,text/csv" />
      </label>
      <p class="chart-note" data-force-import-status>未导入六维力数据。请选择 iDAS 导出的 CH1-CH6 txt。</p>
      <p class="chart-note" data-force-source>未导入六维力数据。</p>
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
  layoutClass = "",
  readoutClass = "",
}) {
  return `
    <div class="diagnostic-layout ${layoutClass}">
      <section class="monitor-card diagnostic-readout ${readoutClass}">
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
              ${metricCard("振动RMS", "data-vibration-value", "--", "m/s²", "等待导入", "data-vibration-detail", "未导入三轴加速度数据")}
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
              ["Fx", '<span data-force-fx>46</span> N'],
              ["Fy", '<span data-force-fy>31</span> N'],
              ["Fz", '<span data-force-fz>108</span> N'],
              ["Peak", '<span data-force-p2p>142</span> N'],
              ["RMS", '<span data-force-mean>96</span> N'],
              ["阈值", "300 N"],
            ],
            charts: [
              timeDomainChart("合力时域波形", "优先看波动、冲击尖峰和接触丢失；当前为模拟波形，不代表真实采样。", "force"),
              forceReplayPanel(),
            ],
            layoutClass: "force-layout",
            readoutClass: "compact-readout",
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
            unit: "m/s²",
            status: "状态判断：未导入三轴加速度数据；导入 YE6275D txt/csv 后开始回放窗口特征。",
            statusTag: "待导入",
            focus: ["三轴 RMS 和 Peak 是否接近阈值", "FFT频谱主频是否稳定", "峰值因子是否提示冲击"],
            rows: [
              ["Ax RMS", '<span data-acc-rms-x>--</span> m/s²'],
              ["Ay RMS", '<span data-acc-rms-y>--</span> m/s²'],
              ["Az RMS", '<span data-acc-rms-z>--</span> m/s²'],
              ["Peak", '<span data-acc-peak-abs>--</span> m/s²'],
              ["主导轴", '<span data-acc-dominant-axis>--</span>'],
              ["采样率", '<span data-acc-sample-rate>--</span> Hz'],
            ],
            charts: [
              timeDomainChart("三轴时域波形", "用于观察瞬态冲击和低频摆动；当前曲线为归一化显示，数值来自窗口特征。", "vibration"),
              accelerationReplayPanel(),
              spectrumChart("FFT频谱", "用于定位主频、倍频和异常频段；当前为示意频谱。"),
            ],
            summary: [
              ["数据来源", '<span data-acceleration-source>未导入三轴加速度数据</span>'],
              ["回放窗口", '<span data-acceleration-window>待载入</span>'],
              ["合成RMS", '<span data-acc-vector-rms>--</span> m/s²'],
              ["峰峰值", '<span data-acc-peak-to-peak>--</span> m/s²'],
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
