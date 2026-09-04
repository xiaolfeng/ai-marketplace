#!/usr/bin/env node

/**
 * Excalidraw 到交互式 HTML 页面转换工具
 *
 * 将原生 .excalidraw JSON 图表文件转换为遵循 huashu-design 设计规范的独立单文件 HTML 网页。
 * 页面具备深浅双主题、视口平移缩放、SVG/PNG/PDF/Excalidraw 全格式导出与移动端响应式布局。
 *
 * 用法:
 *     node render-to-html.mjs <input.excalidraw> [output.html] [选项]
 *
 * 选项:
 *     --title TITLE       页面主标题（默认为输入文件名）
 *     --subtitle TEXT     页面副标题与业务流转说明
 *     --template PATH     指定自定义 template.html 路径（可选）
 *
 * 示例:
 *     node render-to-html.mjs diagram.excalidraw
 *     node render-to-html.mjs order-flow.excalidraw order-flow.html --title "订单结算业务流" --subtitle "核心交易履约链路"
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function parseArgs(args) {
  const result = {
    input: null,
    output: null,
    title: null,
    subtitle: null,
    template: null,
  };

  const positional = [];
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--title' && i + 1 < args.length) {
      result.title = args[++i];
    } else if (arg === '--subtitle' && i + 1 < args.length) {
      result.subtitle = args[++i];
    } else if (arg === '--template' && i + 1 < args.length) {
      result.template = args[++i];
    } else if (arg.startsWith('--')) {
      console.warn(`未知选项: ${arg}`);
    } else {
      positional.push(arg);
    }
  }

  if (positional.length > 0) result.input = positional[0];
  if (positional.length > 1) result.output = positional[1];

  return result;
}

function renderExcalidrawToHtml({ input, output, title, subtitle, template }) {
  if (!input) {
    console.error('错误: 请提供输入 .excalidraw 文件路径');
    console.log('用法: node render-to-html.mjs <input.excalidraw> [output.html] [--title TITLE] [--subtitle TEXT]');
    process.exit(1);
  }

  const inputPath = path.resolve(process.cwd(), input);
  if (!fs.existsSync(inputPath)) {
    console.error(`错误: 找不到输入文件 ${inputPath}`);
    process.exit(1);
  }

  let excalidrawJson;
  try {
    const rawContent = fs.readFileSync(inputPath, 'utf-8');
    excalidrawJson = JSON.parse(rawContent);
  } catch (err) {
    console.error(`错误: 解析 Excalidraw JSON 失败: ${err.message}`);
    process.exit(1);
  }

  const templatePath = template
    ? path.resolve(process.cwd(), template)
    : path.resolve(__dirname, '../references/template.html');

  if (!fs.existsSync(templatePath)) {
    console.error(`错误: 找不到 HTML 模板文件: ${templatePath}`);
    process.exit(1);
  }

  const htmlTemplate = fs.readFileSync(templatePath, 'utf-8');

  const baseName = path.basename(inputPath, path.extname(inputPath));
  const docTitle = title || baseName.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  const docSubtitle = subtitle || `基于 Excalidraw 原生数据构建的手绘白板拓扑与业务流图表（源文件: ${path.basename(inputPath)}）`;

  let renderedHtml = htmlTemplate.replaceAll('[PROJECT NAME]', docTitle);
  renderedHtml = renderedHtml.replace(
    '[Project Subtitle: 阐述端到端业务流转、模块协作关系与数据通道，手绘白板草图风格]',
    docSubtitle
  );

  const jsonStr = JSON.stringify(excalidrawJson, null, 2);
  const startTag = '<script type="application/json" id="excalidraw-data">';
  const endTag = '</script>';

  const startIdx = renderedHtml.indexOf(startTag);
  if (startIdx !== -1) {
    const endIdx = renderedHtml.indexOf(endTag, startIdx);
    if (endIdx !== -1) {
      renderedHtml =
        renderedHtml.slice(0, startIdx + startTag.length) +
        '\n  ' +
        jsonStr.replace(/\n/g, '\n  ') +
        '\n  ' +
        renderedHtml.slice(endIdx);
    }
  }

  const outputPath = output
    ? path.resolve(process.cwd(), output)
    : path.resolve(path.dirname(inputPath), `${baseName}.html`);

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, renderedHtml, 'utf-8');

  console.log(`✅ 成功生成单文件交互式 HTML 页面: ${outputPath}`);
  console.log(`   主标题: ${docTitle}`);
  console.log(`   图元数: ${excalidrawJson.elements?.length || 0}`);
}

const options = parseArgs(process.argv.slice(2));
renderExcalidrawToHtml(options);
