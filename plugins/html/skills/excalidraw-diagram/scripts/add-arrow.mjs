#!/usr/bin/env node

/**
 * 在 Excalidraw 图表中添加连线与流转箭头
 *
 * 用法:
 *     node add-arrow.mjs <diagram_path> <from_x> <from_y> <to_x> <to_y> [选项]
 *
 * 选项:
 *     --style {solid|dashed|dotted}    线型（默认: solid）
 *     --color HEX                      连线颜色（默认: #1e1e1e）
 *     --label TEXT                     在线条旁添加说明标签
 *     --use-edit-suffix                通过 .excalidraw.edit 临时备份安全写入（默认启用）
 *     --no-use-edit-suffix             禁用安全写入
 *
 * 示例:
 *     node add-arrow.mjs diagram.excalidraw 300 200 500 300
 *     node add-arrow.mjs diagram.excalidraw 300 200 500 300 --label "HTTP"
 *     node add-arrow.mjs diagram.excalidraw 300 200 500 300 --style dashed --color "#7950f2"
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

function generateUniqueId() {
  return crypto.randomUUID().replace(/-/g, '').slice(0, 16);
}

function parseArgs(args) {
  const options = {
    diagramPath: null,
    fromX: null,
    fromY: null,
    toX: null,
    toY: null,
    style: 'solid',
    color: '#1e1e1e',
    label: null,
    useEditSuffix: true,
  };

  const positional = [];
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--style' && i + 1 < args.length) {
      options.style = args[++i];
    } else if (arg === '--color' && i + 1 < args.length) {
      options.color = args[++i];
    } else if (arg === '--label' && i + 1 < args.length) {
      options.label = args[++i];
    } else if (arg === '--use-edit-suffix') {
      options.useEditSuffix = true;
    } else if (arg === '--no-use-edit-suffix') {
      options.useEditSuffix = false;
    } else if (arg.startsWith('--')) {
      console.warn(`未知选项: ${arg}`);
    } else {
      positional.push(arg);
    }
  }

  if (positional.length < 5) {
    console.log('用法: node add-arrow.mjs <diagram_path> <from_x> <from_y> <to_x> <to_y> [选项]');
    console.log('\n选项:');
    console.log('  --style {solid|dashed|dotted}    线型 (默认: solid)');
    console.log('  --color HEX                      颜色 (默认: #1e1e1e)');
    console.log('  --label TEXT                     连线文字说明');
    console.log('  --no-use-edit-suffix             禁用 .edit 保护模式');
    console.log('\n示例:');
    console.log('  node add-arrow.mjs diagram.excalidraw 300 200 500 300');
    console.log('  node add-arrow.mjs diagram.excalidraw 300 200 500 300 --label "HTTP"');
    process.exit(1);
  }

  options.diagramPath = positional[0];
  options.fromX = parseFloat(positional[1]);
  options.fromY = parseFloat(positional[2]);
  options.toX = parseFloat(positional[3]);
  options.toY = parseFloat(positional[4]);

  return options;
}

function prepareEditPath(diagramPath, useEditSuffix) {
  if (!useEditSuffix || !diagramPath.endsWith('.excalidraw')) {
    return { workPath: diagramPath, finalPath: null };
  }

  const editPath = `${diagramPath}.edit`;
  if (fs.existsSync(diagramPath)) {
    if (fs.existsSync(editPath)) {
      throw new Error(`编辑暂存文件已存在: ${editPath}`);
    }
    fs.renameSync(diagramPath, editPath);
  }

  return { workPath: editPath, finalPath: diagramPath };
}

function finalizeEditPath(workPath, finalPath) {
  if (!finalPath) return;
  if (fs.existsSync(finalPath)) {
    fs.unlinkSync(finalPath);
  }
  fs.renameSync(workPath, finalPath);
}

function createArrowElements({ fromX, fromY, toX, toY, style, color, label }) {
  const elements = [];
  const deltaX = toX - fromX;
  const deltaY = toY - fromY;

  const arrow = {
    id: generateUniqueId(),
    type: 'arrow',
    x: fromX,
    y: fromY,
    width: deltaX,
    height: deltaY,
    angle: 0,
    strokeColor: color,
    backgroundColor: 'transparent',
    fillStyle: 'solid',
    strokeWidth: 2,
    strokeStyle: style,
    roughness: 1,
    opacity: 100,
    groupIds: [],
    frameId: null,
    index: 'a0',
    roundness: { type: 2 },
    seed: Math.floor(Math.random() * 1000000000) + 1000000000,
    version: 1,
    versionNonce: Math.floor(Math.random() * 1000000000) + 1000000000,
    isDeleted: false,
    boundElements: null,
    updated: Date.now(),
    link: null,
    locked: false,
    points: [
      [0, 0],
      [deltaX, deltaY],
    ],
    lastCommittedPoint: null,
    startBinding: null,
    endBinding: null,
    startArrowhead: null,
    endArrowhead: 'arrow',
  };
  elements.push(arrow);

  if (label) {
    const midX = fromX + deltaX / 2;
    const midY = fromY + deltaY / 2;
    const fontSize = 14;
    const approxWidth = label.length * fontSize * 0.65;
    const approxHeight = fontSize * 1.25;

    const labelElement = {
      id: generateUniqueId(),
      type: 'text',
      x: midX - approxWidth / 2,
      y: midY - approxHeight - 8,
      width: approxWidth,
      height: approxHeight,
      angle: 0,
      strokeColor: color,
      backgroundColor: 'transparent',
      fillStyle: 'solid',
      strokeWidth: 1,
      strokeStyle: 'solid',
      roughness: 1,
      opacity: 100,
      groupIds: [],
      frameId: null,
      index: 'a1',
      roundness: null,
      seed: Math.floor(Math.random() * 1000000000) + 1000000000,
      version: 1,
      versionNonce: Math.floor(Math.random() * 1000000000) + 1000000000,
      isDeleted: false,
      boundElements: null,
      updated: Date.now(),
      link: null,
      locked: false,
      text: label,
      fontSize,
      fontFamily: 5,
      textAlign: 'center',
      verticalAlign: 'middle',
      containerId: null,
      originalText: label,
      lineHeight: 1.25,
    };
    elements.push(labelElement);
  }

  return elements;
}

function addArrowToDiagram(options) {
  const resolvedPath = path.resolve(process.cwd(), options.diagramPath);
  const { workPath, finalPath } = prepareEditPath(resolvedPath, options.useEditSuffix);

  try {
    let diagramData;
    if (fs.existsSync(workPath)) {
      diagramData = JSON.parse(fs.readFileSync(workPath, 'utf-8'));
    } else {
      diagramData = {
        type: 'excalidraw',
        version: 2,
        source: 'https://excalidraw.com',
        elements: [],
        appState: { viewBackgroundColor: '#ffffff', gridSize: 20 },
        files: {},
      };
    }

    const newElements = createArrowElements(options);
    diagramData.elements = diagramData.elements || [];
    diagramData.elements.push(...newElements);

    fs.writeFileSync(workPath, JSON.stringify(diagramData, null, 2), 'utf-8');
    finalizeEditPath(workPath, finalPath);

    console.log(`✅ 成功添加箭头 (${options.fromX}, ${options.fromY}) → (${options.toX}, ${options.toY}) 到 ${options.diagramPath}`);
    if (options.label) {
      console.log(`   标签: "${options.label}"`);
    }
  } catch (err) {
    if (finalPath && fs.existsSync(workPath)) {
      fs.renameSync(workPath, finalPath);
    }
    console.error(`❌ 添加箭头失败: ${err.message}`);
    process.exit(1);
  }
}

const opts = parseArgs(process.argv.slice(2));
addArrowToDiagram(opts);
