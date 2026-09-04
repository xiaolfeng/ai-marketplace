#!/usr/bin/env node

/**
 * Excalidraw 图标库切分工具 (Excalidraw Library Splitter)
 *
 * 将 Excalidraw 图标库文件 (*.excalidrawlib) 拆分为独立的单图标 JSON 文件，
 * 并生成 reference.md 索引表，供 AI Assistant 和开发者高效定位图元。
 *
 * 推荐目录结构:
 *   libraries/{icon-set-name}/
 *     {icon-set-name}.excalidrawlib  (先放置此原始库文件)
 *
 * 用法:
 *     node split-excalidraw-library.mjs <path-to-library-directory>
 *
 * 示例:
 *     node split-excalidraw-library.mjs libraries/aws-architecture-icons/
 */

import fs from 'node:fs';
import path from 'node:path';

function sanitizeFilename(name) {
  let filename = name.replace(/\s+/g, '-');
  filename = filename.replace(/[^\w\-.]/g, '');
  filename = filename.replace(/-+/g, '-');
  filename = filename.replace(/^-+|-+$/g, '');
  return filename || 'icon';
}

function findLibraryFile(directory) {
  const files = fs.readdirSync(directory);
  const libFiles = files.filter((f) => f.endsWith('.excalidrawlib'));

  if (libFiles.length === 0) {
    console.error(`错误: 在目录 ${directory} 中未找到 *.excalidrawlib 文件`);
    console.error(`请先将 .excalidrawlib 库文件放入该目录下。`);
    process.exit(1);
  }

  if (libFiles.length > 1) {
    console.error(`错误: 在目录 ${directory} 中存在多个 *.excalidrawlib 文件`);
    console.error(`请确保该目录下仅保留一个库文件。`);
    process.exit(1);
  }

  return path.resolve(directory, libFiles[0]);
}

function splitLibrary(libraryDir) {
  const dirPath = path.resolve(process.cwd(), libraryDir);

  if (!fs.existsSync(dirPath)) {
    console.error(`错误: 找不到目录 ${dirPath}`);
    process.exit(1);
  }

  const stat = fs.statSync(dirPath);
  if (!stat.isDirectory()) {
    console.error(`错误: 目标路径不是目录: ${dirPath}`);
    process.exit(1);
  }

  const libFilePath = findLibraryFile(dirPath);
  console.log(`发现图标库文件: ${path.basename(libFilePath)}`);

  console.log('正在解析图标库数据...');
  let libraryData;
  try {
    const rawContent = fs.readFileSync(libFilePath, 'utf-8');
    libraryData = JSON.parse(rawContent);
  } catch (err) {
    console.error(`错误: 解析图标库 JSON 失败: ${err.message}`);
    process.exit(1);
  }

  const libraryItems = libraryData.libraryItems || libraryData.library || [];
  if (!Array.isArray(libraryItems) || libraryItems.length === 0) {
    console.error("错误: 库文件格式不合法（未找到包含有效图元的 'libraryItems' 数组）");
    process.exit(1);
  }

  const iconsDir = path.resolve(dirPath, 'icons');
  fs.mkdirSync(iconsDir, { recursive: true });

  const iconList = [];
  console.log(`正在切分 ${libraryItems.length} 个图标...`);

  for (let i = 0; i < libraryItems.length; i++) {
    const item = libraryItems[i];
    let iconElements = [];
    let iconName = null;

    if (Array.isArray(item)) {
      iconElements = item;
    } else if (item && typeof item === 'object') {
      iconElements = item.elements || [item];
      iconName = item.name || item.id || null;
    }

    if (!iconName) {
      const textEl = iconElements.find((el) => el && el.text);
      if (textEl && textEl.text) {
        iconName = textEl.text.trim();
      } else {
        iconName = `Icon-${i + 1}`;
      }
    }

    let filename = sanitizeFilename(iconName);
    let targetPath = path.resolve(iconsDir, `${filename}.json`);
    let counter = 1;
    while (fs.existsSync(targetPath)) {
      filename = `${sanitizeFilename(iconName)}-${counter++}`;
      targetPath = path.resolve(iconsDir, `${filename}.json`);
    }

    const iconData = {
      name: iconName,
      elements: iconElements,
    };

    fs.writeFileSync(targetPath, JSON.stringify(iconData, null, 2), 'utf-8');
    iconList.push({
      name: iconName,
      filename: `${filename}.json`,
      elementCount: iconElements.length,
    });
  }

  // 生成 reference.md 索引表
  const referencePath = path.resolve(dirPath, 'reference.md');
  const dirName = path.basename(dirPath);

  let mdContent = `# ${dirName} 图标索引参考表\n\n`;
  mdContent += `包含来自 \`${path.basename(libFilePath)}\` 的 ${iconList.length} 个切分图标。\n\n`;
  mdContent += `| 图标名称 | 文件名 | 图元数量 |\n`;
  mdContent += `| --- | --- | --- |\n`;

  iconList.sort((a, b) => a.name.localeCompare(b.name));
  for (const item of iconList) {
    mdContent += `| ${item.name} | \`${item.filename}\` | ${item.elementCount} |\n`;
  }

  fs.writeFileSync(referencePath, mdContent, 'utf-8');

  console.log(`\n✅ 成功切分 ${iconList.length} 个图标`);
  console.log(`📄 已生成索引表: ${referencePath}`);
  console.log(`📁 图标存储目录: ${iconsDir}`);
}

const args = process.argv.slice(2);
if (args.length !== 1) {
  console.log('用法: node split-excalidraw-library.mjs <path-to-library-directory>');
  console.log('\n示例:');
  console.log('  node split-excalidraw-library.mjs libraries/aws-architecture-icons/');
  console.log('\n说明: 目标目录下必须包含一个 *.excalidrawlib 文件。');
  process.exit(1);
}

splitLibrary(args[0]);
