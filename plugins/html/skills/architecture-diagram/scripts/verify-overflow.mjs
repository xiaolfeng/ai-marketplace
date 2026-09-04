#!/usr/bin/env node
/**
 * verify-overflow.mjs · 架构图文字越界量化计算器
 *
 * 验证 HTML / SVG 架构图内部文字是否超出外部框选容器（节点卡片、徽章底框、网络边界等）。
 *
 * 原理：
 * 1. 优先调用系统无头浏览器（Chrome/Chromium），等待 WebFont 排印就绪后通过 SVG getBBox() / getCTM() 物理测量；
 * 2. 无浏览器时自动降级至内置的高精度几何排印模拟计算器（纯数学与字符度量模型）；
 * 3. 量化计算每一个文字相对于其外部框选容器的四向物理溢出量（ΔLeft, ΔRight, ΔTop, ΔBottom）与安全内边距（Padding）。
 *
 * 用法：
 *   node plugins/html/skills/architecture-diagram/scripts/verify-overflow.mjs [html文件]
 *   node plugins/html/skills/architecture-diagram/scripts/verify-overflow.mjs --min-padding=6
 *   node plugins/html/skills/architecture-diagram/scripts/verify-overflow.mjs --engine=math
 *
 * 退出码：0 = 全部合规无越界；1 = 检测到文字越界（Overflow）
 */

import { readFileSync, writeFileSync, unlinkSync, existsSync } from "node:fs";
import { resolve, dirname, basename } from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DEFAULT_TARGET = resolve(__dirname, "../references/template.html");

const args = process.argv.slice(2);
let targetPath = DEFAULT_TARGET;
let minPadding = 4;
let forcedEngine = "auto";
let jsonOutput = false;

for (const arg of args) {
  if (arg.startsWith("--min-padding=")) {
    minPadding = parseFloat(arg.split("=")[1]) || 0;
  } else if (arg.startsWith("--engine=")) {
    forcedEngine = arg.split("=")[1];
  } else if (arg === "--json") {
    jsonOutput = true;
  } else if (!arg.startsWith("--")) {
    targetPath = resolve(process.cwd(), arg);
  }
}

if (!existsSync(targetPath)) {
  console.error(`✗ 错误：未找到目标文件 ${targetPath}`);
  process.exit(2);
}

function findBrowser() {
  if (forcedEngine === "math") return null;
  const candidates = [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium-browser",
    "/usr/bin/chromium"
  ];
  for (const c of candidates) {
    if (existsSync(c)) return c;
  }
  return null;
}

// ============================================================================
// 引擎 A: 无头浏览器真实 SVG getBBox() / getCTM() 物理度量
// ============================================================================
async function runChromeEngine(browserPath, filePath) {
  const rawHtml = readFileSync(filePath, "utf8");

  const measurementScript = `
<script>
window.__DO_MEASURE__ = async function() {
  try {
    if (document.fonts && document.fonts.ready) {
      await document.fonts.ready;
    }
    await new Promise(r => setTimeout(r, 200));

    const svg = document.querySelector("svg.diagram-canvas") || document.querySelector("svg");
    if (!svg) {
      console.log("===CALC_OUTPUT_START===" + JSON.stringify({ error: "No SVG found" }) + "===CALC_OUTPUT_END===");
      return;
    }

    const svgCTMInv = svg.getScreenCTM() ? svg.getScreenCTM().inverse() : null;

    function getSvgBBox(el) {
      const bbox = el.getBBox();
      const ctm = el.getCTM();
      if (!ctm || !svgCTMInv) {
        return { x: bbox.x, y: bbox.y, width: bbox.width, height: bbox.height };
      }
      const m = svgCTMInv.multiply(ctm);
      const p1 = svg.createSVGPoint(); p1.x = bbox.x; p1.y = bbox.y;
      const p2 = svg.createSVGPoint(); p2.x = bbox.x + bbox.width; p2.y = bbox.y + bbox.height;
      const pt1 = p1.matrixTransform(m);
      const pt2 = p2.matrixTransform(m);
      return {
        x: Math.min(pt1.x, pt2.x),
        y: Math.min(pt1.y, pt2.y),
        width: Math.abs(pt2.x - pt1.x),
        height: Math.abs(pt2.y - pt1.y)
      };
    }

    // 收集所有作为候选容器的 rect
    const candidateRects = Array.from(svg.querySelectorAll("rect")).map(rect => {
      const fill = rect.getAttribute("fill") || "";
      const isGrid = fill.includes("grid") || rect.getAttribute("width") === "100%";
      if (isGrid) return null;
      const box = getSvgBBox(rect);
      if (box.width < 15 || box.height < 8) return null;
      return {
        element: rect,
        id: rect.id || rect.getAttribute("class") || "",
        box
      };
    }).filter(Boolean);

    // 收集节点分组
    const nodeGroups = Array.from(svg.querySelectorAll("g[id^='node-']"));

    const results = [];
    const textEls = Array.from(svg.querySelectorAll("text"));

    textEls.forEach(textEl => {
      const text = textEl.textContent.trim();
      if (!text) return;

      const tBox = getSvgBBox(textEl);
      let targetContainer = null;
      let containerType = "none";
      let containerDesc = "";

      // 1. 检查是否在 node 分组内部
      const parentNode = textEl.closest("g[id^='node-']");
      if (parentNode) {
        const nodeId = parentNode.getAttribute("id");
        // 查找组内的 rects
        const inGroupRects = candidateRects.filter(cr => parentNode.contains(cr.element));
        
        // 检查是否有小徽章 rect 直接包裹这个 text
        const badgeRect = inGroupRects.find(r => {
          return r.box.height <= 26 &&
                 r.box.x <= tBox.x + 4 &&
                 (r.box.x + r.box.width) >= (tBox.x + tBox.width - 4) &&
                 Math.abs(r.box.y - tBox.y) < 20;
        });

        if (badgeRect && (textEl.classList.contains("node-tag") || tBox.height < 12)) {
          targetContainer = badgeRect.box;
          containerType = "badge";
          containerDesc = nodeId + " (tag-badge)";
        } else {
          // 取本节点主底板 rect（面积最大者）
          inGroupRects.sort((a, b) => (b.box.width * b.box.height) - (a.box.width * a.box.height));
          if (inGroupRects.length > 0) {
            targetContainer = inGroupRects[0].box;
            containerType = "node-card";
            containerDesc = nodeId;
          }
        }
      }

      // 2. 若带有 class="line-label" 或处于 connections 组中，属于浮动连线标注
      if (textEl.classList.contains("line-label") || textEl.closest("g#connections")) {
        results.push({
          text,
          hasContainer: false,
          containerType: "floating-label",
          containerDesc: "连线流转标注",
          textBBox: tBox
        });
        return;
      }

      // 3. 若不在节点组内，判断是否属于区域边界标题 (VPC, Subnet 等)
      if (!targetContainer) {
        // 查找在水平与垂直方向上真正能够包含该文字的大区域 rect
        const containing = candidateRects.filter(r => {
          return r.box.width >= 120 && r.box.height >= 100 &&
                 tBox.x >= r.box.x - 5 &&
                 (tBox.x + tBox.width) <= (r.box.x + r.box.width + 5) &&
                 tBox.y >= r.box.y - 5 &&
                 tBox.y <= (r.box.y + r.box.height + 5);
        });
        if (containing.length > 0) {
          // 取面积最小的那个（即最贴近的层级，如 Subnet 优于 VPC）
          containing.sort((a, b) => (a.box.width * a.box.height) - (b.box.width * b.box.height));
          targetContainer = containing[0].box;
          containerType = "boundary";
          containerDesc = "Boundary Region";
        }
      }

      // 若未匹配到容器（如连线文字标签），作为非容器文字记录
      if (!targetContainer) {
        results.push({
          text,
          hasContainer: false,
          containerType: "floating-label",
          containerDesc: "连线/浮动文字",
          textBBox: tBox
        });
        return;
      }

      const cBox = targetContainer;

      const overflowLeft = Math.max(0, cBox.x - tBox.x);
      const overflowRight = Math.max(0, (tBox.x + tBox.width) - (cBox.x + cBox.width));
      const overflowTop = Math.max(0, cBox.y - tBox.y);
      const overflowBottom = Math.max(0, (tBox.y + tBox.height) - (cBox.y + cBox.height));
      const maxOverflow = Math.max(overflowLeft, overflowRight, overflowTop, overflowBottom);

      const paddingLeft = tBox.x - cBox.x;
      const paddingRight = (cBox.x + cBox.width) - (tBox.x + tBox.width);
      const paddingTop = tBox.y - cBox.y;
      const paddingBottom = (cBox.y + cBox.height) - (tBox.y + tBox.height);
      const minPad = Math.min(paddingLeft, paddingRight, paddingTop, paddingBottom);

      results.push({
        text,
        hasContainer: true,
        containerType,
        containerDesc,
        containerBBox: {
          x: Number(cBox.x.toFixed(1)),
          y: Number(cBox.y.toFixed(1)),
          width: Number(cBox.width.toFixed(1)),
          height: Number(cBox.height.toFixed(1))
        },
        textBBox: {
          x: Number(tBox.x.toFixed(1)),
          y: Number(tBox.y.toFixed(1)),
          width: Number(tBox.width.toFixed(1)),
          height: Number(tBox.height.toFixed(1))
        },
        overflow: {
          left: Number(overflowLeft.toFixed(1)),
          right: Number(overflowRight.toFixed(1)),
          top: Number(overflowTop.toFixed(1)),
          bottom: Number(overflowBottom.toFixed(1)),
          max: Number(maxOverflow.toFixed(1))
        },
        padding: {
          left: Number(paddingLeft.toFixed(1)),
          right: Number(paddingRight.toFixed(1)),
          top: Number(paddingTop.toFixed(1)),
          bottom: Number(paddingBottom.toFixed(1)),
          min: Number(minPad.toFixed(1))
        },
        isOverflow: maxOverflow > 0.05
      });
    });

    console.log("===CALC_OUTPUT_START===" + JSON.stringify({ results }) + "===CALC_OUTPUT_END===");
  } catch(e) {
    console.log("===CALC_OUTPUT_START===" + JSON.stringify({ error: e.message }) + "===CALC_OUTPUT_END===");
  }
};

window.addEventListener("DOMContentLoaded", window.__DO_MEASURE__);
</script>
`;

  const tmpPath = resolve(dirname(filePath), `_tmp_calc_${Date.now()}.html`);
  const injected = rawHtml.replace("</body>", `${measurementScript}</body>`);
  writeFileSync(tmpPath, injected, "utf8");

  return new Promise((resolveRes, reject) => {
    const proc = spawn(browserPath, [
      "--headless",
      "--disable-gpu",
      "--no-sandbox",
      "--enable-logging=stderr",
      "--v=1",
      tmpPath
    ]);

    let output = "";
    let isHandled = false;

    const cleanup = () => {
      if (!isHandled) {
        isHandled = true;
        proc.kill();
        try { unlinkSync(tmpPath); } catch(e){}
      }
    };

    const handleData = (d) => {
      output += d.toString();
      if (output.includes("===CALC_OUTPUT_END===")) {
        cleanup();
        const m = output.match(/===CALC_OUTPUT_START===(.*?)===CALC_OUTPUT_END===/);
        if (m) {
          try {
            resolveRes(JSON.parse(m[1]));
          } catch(err) {
            reject(err);
          }
        } else {
          reject(new Error("解析测量数据失败"));
        }
      }
    };

    proc.stdout.on("data", handleData);
    proc.stderr.on("data", handleData);

    setTimeout(() => {
      cleanup();
      reject(new Error("无头浏览器响应超时"));
    }, 8000);
  });
}

// ============================================================================
// 引擎 B: 纯数学与几何排印字符计算模型 (纯零依赖算法)
// ============================================================================
function runMathEngine(filePath) {
  const content = readFileSync(filePath, "utf8");
  const results = [];

  // 1. 解析所有 <g id="node-xxx" transform="translate(x, y)"> ... </g>
  // 使用开闭标签深度解析，避免内部嵌套 <g> 截断
  const nodeStartRegex = /<g\s+[^>]*id="(node-[^"]+)"[^>]*transform="translate\(\s*(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)\s*\)"[^>]*>/g;
  let match;

  while ((match = nodeStartRegex.exec(content)) !== null) {
    const nodeId = match[1];
    const gx = parseFloat(match[2]);
    const gy = parseFloat(match[3]);
    const startIndex = match.index + match[0].length;

    // 寻找该节点的闭合 </g>，维护深度
    let depth = 1;
    let curr = startIndex;
    while (depth > 0 && curr < content.length) {
      const nextOpen = content.indexOf("<g", curr);
      const nextClose = content.indexOf("</g>", curr);

      if (nextClose === -1) break;

      if (nextOpen !== -1 && nextOpen < nextClose) {
        depth++;
        curr = nextOpen + 2;
      } else {
        depth--;
        curr = nextClose + 4;
      }
    }

    const nodeBody = content.slice(startIndex, curr - 4);

    // 解析主 rect
    const rects = [...nodeBody.matchAll(/<rect\s+([^>]*width="(\d+\.?\d*)"[^>]*height="(\d+\.?\d*)"[^>]*)>/g)];
    if (rects.length === 0) continue;

    const mainRect = rects.reduce((prev, curr) => {
      const pw = parseFloat(prev[2]), ph = parseFloat(prev[3]);
      const cw = parseFloat(curr[2]), ch = parseFloat(curr[3]);
      return (cw * ch > pw * ph) ? curr : prev;
    });

    const rWidth = parseFloat(mainRect[2]);
    const rHeight = parseFloat(mainRect[3]);
    let rx = gx, ry = gy;
    const rxMatch = mainRect[1].match(/x="(-?\d+\.?\d*)"/);
    const ryMatch = mainRect[1].match(/y="(-?\d+\.?\d*)"/);
    if (rxMatch) rx += parseFloat(rxMatch[1]);
    if (ryMatch) ry += parseFloat(ryMatch[1]);

    const cBox = { x: rx, y: ry, width: rWidth, height: rHeight };

    // 提取文字
    const textMatches = [...nodeBody.matchAll(/<text\s+([^>]*)>([^<]+)<\/text>/g)];
    for (const tm of textMatches) {
      const tAttrs = tm[1];
      const text = tm[2].trim();

      let tx = gx;
      let ty = gy;
      const txM = tAttrs.match(/x="(-?\d+\.?\d*)"/);
      const tyM = tAttrs.match(/y="(-?\d+\.?\d*)"/);
      if (txM) tx += parseFloat(txM[1]);
      if (tyM) ty += parseFloat(tyM[1]);

      let fontSize = 11;
      const fsM = tAttrs.match(/font-size="(\d+\.?\d*)"/);
      if (fsM) fontSize = parseFloat(fsM[1]);
      else if (tAttrs.includes("node-subtitle")) fontSize = 9;
      else if (tAttrs.includes("node-tag")) fontSize = 8;

      let estWidth = 0;
      const isMono = tAttrs.includes("node-subtitle") || tAttrs.includes("node-tag") || tAttrs.includes("svg-mono");
      for (const ch of text) {
        if (/[\u4e00-\u9fa5]/.test(ch)) estWidth += fontSize * 1.05;
        else if (isMono) estWidth += fontSize * 0.60;
        else {
          if (/[A-Z]/.test(ch)) estWidth += fontSize * 0.68;
          else if (/[ijl1.,:;]/.test(ch)) estWidth += fontSize * 0.28;
          else if (/[wmWM]/.test(ch)) estWidth += fontSize * 0.82;
          else estWidth += fontSize * 0.54;
        }
      }

      if (tAttrs.includes("font-weight=\"600\"") || tAttrs.includes("node-title")) {
        estWidth *= 1.06;
      }

      const tHeight = fontSize * 1.15;
      const textLeft = tx;
      const textRight = tx + estWidth;
      const textTop = ty - fontSize * 0.85;
      const textBottom = textTop + tHeight;

      const overflowLeft = Math.max(0, cBox.x - textLeft);
      const overflowRight = Math.max(0, textRight - (cBox.x + cBox.width));
      const overflowTop = Math.max(0, cBox.y - textTop);
      const overflowBottom = Math.max(0, textBottom - (cBox.y + cBox.height));
      const maxOverflow = Math.max(overflowLeft, overflowRight, overflowTop, overflowBottom);

      const paddingLeft = textLeft - cBox.x;
      const paddingRight = (cBox.x + cBox.width) - textRight;
      const paddingTop = textTop - cBox.y;
      const paddingBottom = (cBox.y + cBox.height) - textBottom;

      results.push({
        text,
        hasContainer: true,
        containerType: "node-card",
        containerDesc: nodeId,
        containerBBox: {
          x: Number(cBox.x.toFixed(1)),
          y: Number(cBox.y.toFixed(1)),
          width: Number(cBox.width.toFixed(1)),
          height: Number(cBox.height.toFixed(1))
        },
        textBBox: {
          x: Number(textLeft.toFixed(1)),
          y: Number(textTop.toFixed(1)),
          width: Number(estWidth.toFixed(1)),
          height: Number(tHeight.toFixed(1))
        },
        overflow: {
          left: Number(overflowLeft.toFixed(1)),
          right: Number(overflowRight.toFixed(1)),
          top: Number(overflowTop.toFixed(1)),
          bottom: Number(overflowBottom.toFixed(1)),
          max: Number(maxOverflow.toFixed(1))
        },
        padding: {
          left: Number(paddingLeft.toFixed(1)),
          right: Number(paddingRight.toFixed(1)),
          top: Number(paddingTop.toFixed(1)),
          bottom: Number(paddingBottom.toFixed(1)),
          min: Number(Math.min(paddingLeft, paddingRight, paddingTop, paddingBottom).toFixed(1))
        },
        isOverflow: maxOverflow > 0.1
      });
    }
  }

  return { results };
}

// ============================================================================
// 主报告生成与 CLI 格式化
// ============================================================================
async function main() {
  const browser = findBrowser();
  let data;
  let usedEngine = "";

  if (browser && forcedEngine !== "math") {
    try {
      usedEngine = `Chrome Headless [${basename(browser)}]`;
      data = await runChromeEngine(browser, targetPath);
    } catch(err) {
      usedEngine = "Pure Math Simulation (降级回退)";
      data = runMathEngine(targetPath);
    }
  } else {
    usedEngine = "Pure Math Simulation";
    data = runMathEngine(targetPath);
  }

  const items = data.results || [];
  const containerItems = items.filter(i => i.hasContainer);
  const overflows = containerItems.filter(i => i.isOverflow);
  const warnings = containerItems.filter(i => !i.isOverflow && i.padding.min < minPadding);

  if (jsonOutput) {
    console.log(JSON.stringify({
      target: targetPath,
      engine: usedEngine,
      totalTexts: items.length,
      inspectedNodes: containerItems.length,
      overflowCount: overflows.length,
      warningCount: warnings.length,
      details: items
    }, null, 2));
    process.exit(overflows.length > 0 ? 1 : 0);
  }

  console.log("\n" + "=".repeat(92));
  console.log(`📐 架构图文字越界量化计算器 (Text Overflow Verifier)`);
  console.log(`🎯 目标文件: ${targetPath}`);
  console.log(`⚙️  计算引擎: ${usedEngine}`);
  console.log(`📏 建议最小内边距: ${minPadding} px`);
  console.log("=".repeat(92));

  console.log(
    "\n" +
    "状态".padEnd(10) +
    "文本内容".padEnd(26) +
    "归属框选容器".padEnd(20) +
    "容器盒 (W×H)".padEnd(14) +
    "文字盒 (W×H)".padEnd(14) +
    "计算结果"
  );
  console.log("-".repeat(92));

  for (const item of containerItems) {
    let status = "✅ PASS";
    let statusText = `+${item.padding.min}px 边距`;
    if (item.isOverflow) {
      status = "❌ OVERFLOW";
      statusText = `超右: +${item.overflow.right}px` + (item.overflow.bottom > 0 ? `, 超下: +${item.overflow.bottom}px` : "");
    } else if (item.padding.min < minPadding) {
      status = "⚠️ TIGHT";
      statusText = `仅剩 ${item.padding.min}px (偏紧)`;
    }

    const cBoxStr = `${item.containerBBox.width}×${item.containerBBox.height}`;
    const tBoxStr = `${item.textBBox.width}×${item.textBBox.height}`;
    const textTrunc = item.text.length > 20 ? (item.text.slice(0, 18) + "..") : item.text;
    const descTrunc = item.containerDesc.length > 18 ? (item.containerDesc.slice(0, 16) + "..") : item.containerDesc;

    console.log(
      status.padEnd(12) +
      textTrunc.padEnd(26) +
      descTrunc.padEnd(20) +
      cBoxStr.padEnd(14) +
      tBoxStr.padEnd(14) +
      statusText
    );
  }

  console.log("-".repeat(92));
  console.log(`📊 统计摘要: 共计算 ${containerItems.length} 项文字容器，❌ 越界: ${overflows.length} 项，⚠️ 偏紧: ${warnings.length} 项，✅ 安全: ${containerItems.length - overflows.length - warnings.length} 项`);

  if (overflows.length > 0) {
    console.error(`\n❌ 检验失败：检测到 ${overflows.length} 处文字越界！请调宽外部容器或调整文字长度。\n`);
    process.exit(1);
  } else if (warnings.length > 0) {
    console.log(`\n⚠️  注意：无文字越界，但有 ${warnings.length} 处排版偏紧（内边距 < ${minPadding}px），建议优化呼吸感。\n`);
    process.exit(0);
  } else {
    console.log(`\n✅ 校验通过：所有文字均在其外部框选容器内部，呼吸感良好，符合规范！\n`);
    process.exit(0);
  }
}

main().catch(err => {
  console.error("计算器运行异常:", err);
  process.exit(2);
});
