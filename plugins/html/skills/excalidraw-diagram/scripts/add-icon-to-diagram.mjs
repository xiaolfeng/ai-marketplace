#!/usr/bin/env node

/**
 * 将 Excalidraw 图标库中的图标插入到图表中
 *
 * 读取指定图标库中的单个图标 JSON 文件，自动平移到目标坐标并生成唯一 ID，
 * 防止 ID 碰撞，并可选择在图标下方添加手写说明标签。
 *
 * 用法:
 *     node add-icon-to-diagram.mjs <diagram_path> <icon_name> <x> <y> [选项]
 *
 * 选项:
 *     --library-path PATH    图标库目录路径（默认: libraries/aws-architecture-icons）
 *     --label TEXT           在图标下方添加说明文本
 *     --use-edit-suffix      通过 .excalidraw.edit 临时文件安全写入（默认启用）
 *     --no-use-edit-suffix   禁用临时文件保护
 *
 * 示例:
 *     node add-icon-to-diagram.mjs diagram.excalidraw EC2 500 300
 *     node add-icon-to-diagram.mjs diagram.excalidraw EC2 500 300 --label "Web Server"
 *     node add-icon-to-diagram.mjs diagram.excalidraw VPC 200 150 --library-path libraries/gcp-icons
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

function generateUniqueId() {
  return crypto.randomUUID().replace(/-/g, '').slice(0, 16);
}

function calculateBoundingBox(elements) {
  if (!elements || elements.length === 0) return { minX: 0, minY: 0, maxX: 0, maxY: 0 };

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const el of elements) {
    if (el.x !== undefined && el.y !== undefined) {
      const w = el.width || 0;
      const h = el.height || 0;
      minX = Math.min(minX, el.x);
      minY = Math.min(minY, el.y);
      maxX = Math.max(maxX, el.x + w);
      maxY = Math.max(maxY, el.y + h);
    }
  }

  return { minX, minY, maxX, maxY };
}

function transformIconElements(elements, targetX, targetY) {
  if (!elements || elements.length === 0) return [];

  const { minX, minY } = calculateBoundingBox(elements);
  const offsetX = targetX - minX;
  const offsetY = targetY - minY;

  const idMap = new Map();
  for (const el of elements) {
    if (el.id) {
      idMap.set(el.id, generateUniqueId());
    }
  }

  const groupMap = new Map();
  for (const el of elements) {
    if (Array.isArray(el.groupIds)) {
      for (const gid of el.groupIds) {
        if (!groupMap.has(gid)) {
          groupMap.set(gid, generateUniqueId());
        }
      }
    }
  }

  return elements.map((el) => {
    const transformed = { ...el };
    if (transformed.x !== undefined) transformed.x += offsetX;
    if (transformed.y !== undefined) transformed.y += offsetY;
    if (transformed.id && idMap.has(transformed.id)) {
      transformed.id = idMap.get(transformed.id);
    }
    if (Array.isArray(transformed.groupIds)) {
      transformed.groupIds = transformed.groupIds.map((gid) => groupMap.get(gid) || gid);
    }
    transformed.seed = Math.floor(Math.random() * 1000000000) + 1000000000;
    transformed.versionNonce = Math.floor(Math.random() * 1000000000) + 1000000000;
    return transformed;
  });
}

function parseArgs(args) {
  const options = {
    diagramPath: null,
    iconName: null,
    x: null,
    y: null,
    libraryPath: 'libraries/aws-architecture-icons',
    label: null,
    useEditSuffix: true,
  };

  const positional = [];
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--library-path' && i + 1 < args.length) {
      options.libraryPath = args[++i];
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

  if (positional.length < 4) {
    console.log('用法: node add-icon-to-diagram.mjs <diagram_path> <icon_name> <x> <y> [选项]');
    console.log('\n选项:');
    console.log('  --library-path PATH    图标库目录路径 (默认: libraries/aws-architecture-icons)');
    console.log('  --label TEXT           在图标下方添加标签说明');
    console.log('  --no-use-edit-suffix   禁用 .edit 保护模式');
    console.log('\n示例:');
    console.log('  node add-icon-to-diagram.mjs diagram.excalidraw EC2 500 300');
    console.log('  node add-icon-to-diagram.mjs diagram.excalidraw EC2 500 300 --label "Web Server"');
    process.exit(1);
  }

  options.diagramPath = positional[0];
  options.iconName = positional[1];
  options.x = parseFloat(positional[2]);
  options.y = parseFloat(positional[3]);

  return options;
}

function findIconFile(libraryDir, iconName) {
  const iconsDir = path.resolve(libraryDir, 'icons');
  if (!fs.existsSync(iconsDir)) {
    throw new Error(`找不到图标目录: ${iconsDir}`);
  }

  const directPath = path.resolve(iconsDir, `${iconName}.json`);
  if (fs.existsSync(directPath)) {
    return directPath;
  }

  const files = fs.readdirSync(iconsDir);
  const targetLower = iconName.toLowerCase().replace(/[\s_]/g, '-');
  for (const file of files) {
    if (file.endsWith('.json')) {
      const base = path.basename(file, '.json').toLowerCase().replace(/[\s_]/g, '-');
      if (base === targetLower) {
        return path.resolve(iconsDir, file);
      }
    }
  }

  throw new Error(`在 ${iconsDir} 中未找到图标 "${iconName}"`);
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

function addIconToDiagram(options) {
  const resolvedDiagram = path.resolve(process.cwd(), options.diagramPath);
  const resolvedLib = path.resolve(process.cwd(), options.libraryPath);

  let iconPath;
  try {
    iconPath = findIconFile(resolvedLib, options.iconName);
  } catch (err) {
    console.error(`❌ 加载图标失败: ${err.message}`);
    process.exit(1);
  }

  const iconJson = JSON.parse(fs.readFileSync(iconPath, 'utf-8'));
  const rawElements = iconJson.elements || (Array.isArray(iconJson) ? iconJson : []);
  const transformedElements = transformIconElements(rawElements, options.x, options.y);

  if (options.label) {
    const { minX, maxX, maxY } = calculateBoundingBox(transformedElements);
    const midX = (minX + maxX) / 2;
    const fontSize = 14;
    const approxWidth = options.label.length * fontSize * 0.65;
    const approxHeight = fontSize * 1.25;

    const labelElement = {
      id: generateUniqueId(),
      type: 'text',
      x: midX - approxWidth / 2,
      y: maxY + 8,
      width: approxWidth,
      height: approxHeight,
      angle: 0,
      strokeColor: '#1e1e1e',
      backgroundColor: 'transparent',
      fillStyle: 'solid',
      strokeWidth: 1,
      strokeStyle: 'solid',
      roughness: 1,
      opacity: 100,
      groupIds: [],
      frameId: null,
      index: 'a2',
      roundness: null,
      seed: Math.floor(Math.random() * 1000000000) + 1000000000,
      version: 1,
      versionNonce: Math.floor(Math.random() * 1000000000) + 1000000000,
      isDeleted: false,
      boundElements: null,
      updated: Date.now(),
      link: null,
      locked: false,
      text: options.label,
      fontSize,
      fontFamily: 5,
      textAlign: 'center',
      verticalAlign: 'top',
      containerId: null,
      originalText: options.label,
      lineHeight: 1.25,
    };
    transformedElements.push(labelElement);
  }

  const { workPath, finalPath } = prepareEditPath(resolvedDiagram, options.useEditSuffix);
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

    diagramData.elements = diagramData.elements || [];
    diagramData.elements.push(...transformedElements);

    fs.writeFileSync(workPath, JSON.stringify(diagramData, null, 2), 'utf-8');
    finalizeEditPath(workPath, finalPath);

    console.log(`✅ 成功添加图标 "${options.iconName}" 到坐标 (${options.x}, ${options.y}) -> ${options.diagramPath}`);
    if (options.label) {
      console.log(`   标签: "${options.label}"`);
    }
  } catch (err) {
    if (finalPath && fs.existsSync(workPath)) {
      fs.renameSync(workPath, finalPath);
    }
    console.error(`❌ 添加图标失败: ${err.message}`);
    process.exit(1);
  }
}

const opts = parseArgs(process.argv.slice(2));
addIconToDiagram(opts);
