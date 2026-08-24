#!/usr/bin/env node
/**
 * 初始化工程文档目录结构（幂等）。
 *
 * 在 docs/engineering/ 下创建 draft/research/rfc/design/adr 五段子目录，
 * 已存在的目录与文件一律跳过，绝不覆盖。
 *
 * 用法：
 *   node init_docs.mjs [项目根目录]
 *
 * 不传参数时默认当前目录。退出码：0 成功，1 参数无效。
 */
import { mkdir, stat, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { exit } from "node:process";

const SUBDIRS = ["draft", "research", "rfc", "design", "adr"];

/** 确保目录树就位，返回新建清单（已存在的目录整体跳过，不补 .gitkeep）。 */
async function ensureDocsTree(root) {
  const created = [];
  for (const name of SUBDIRS) {
    const target = join(root, "docs", "engineering", name);
    const info = await stat(target).catch(() => null);
    if (info?.isDirectory()) continue;
    await mkdir(target, { recursive: true });
    await writeFile(join(target, ".gitkeep"), "", "utf8");
    created.push(target);
  }
  return created;
}

const args = process.argv.slice(2);
if (args.length > 1) {
  console.error("错误：最多接受一个参数（项目根目录）");
  exit(1);
}

const root = args[0] ?? ".";
const rootInfo = await stat(root).catch(() => null);
if (!rootInfo?.isDirectory()) {
  console.error(`错误：${root} 不是有效目录`);
  exit(1);
}

const created = await ensureDocsTree(root);

if (created.length > 0) {
  console.log("已创建：");
  for (const item of created) console.log(`  + ${item}`);
} else {
  console.log("目录结构已就绪，无需创建");
}
