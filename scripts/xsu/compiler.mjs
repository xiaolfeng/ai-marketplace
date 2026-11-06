import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { resolveDocument } from "./resolver.mjs";
import {
  esc,
  fail,
  isNode,
  props,
  scriptJson,
  stableJson,
  XsuError,
} from "./contracts.mjs";

export const COMPILER_VERSION = "1.0.0";

function validateIds(root) {
  const seen = new Map();
  const visit = (value) => {
    if (Array.isArray(value)) {
      value.forEach(visit);
      return;
    }
    if (!value || typeof value !== "object") return;
    if (isNode(value)) {
      const id = value.args[0]?.id;
      if (id !== undefined) {
        if (typeof id !== "string" || !/^[A-Za-z][A-Za-z0-9_-]{0,63}$/.test(id))
          fail(
            value,
            "XSU_ID",
            "IDs must start with a letter and contain at most 64 letters, digits, _ or -",
          );
        if (seen.has(id))
          throw new XsuError("XSU_ID", `Duplicate ID: ${id}`, value, [
            seen.get(id),
          ]);
        seen.set(id, value.loc);
      }
      value.args.forEach(visit);
    } else Object.values(value).forEach(visit);
  };
  visit(root);
}

function navigation(navFile, output) {
  const file = fs.realpathSync(navFile);
  const dir = path.dirname(file);
  const outputDir = fs.realpathSync(path.dirname(path.resolve(output)));
  const canonicalOutput = path.join(outputDir, path.basename(output));
  if (fs.statSync(file).size > 2 * 1024 * 1024)
    throw new XsuError("XSU_LIMIT", "Navigation exceeds 2 MiB");
  const data = JSON.parse(fs.readFileSync(file, "utf8"));
  if (!data || typeof data !== "object" || Array.isArray(data))
    throw new XsuError("XSU_NAV", "Navigation requires an object");
  if (data.groups !== undefined && !Array.isArray(data.groups))
    throw new XsuError("XSU_NAV", "Navigation groups must be an array");
  const seen = new Set();
  const items = data.groups
    ? data.groups.flatMap((group) => {
        if (
          !group ||
          !Array.isArray(group.items) ||
          (group.label !== undefined && typeof group.label !== "string")
        )
          throw new XsuError("XSU_NAV", "Invalid navigation group");
        return group.items;
      })
    : data.items;
  if (!Array.isArray(items) || !items.length)
    throw new XsuError("XSU_NAV", "Navigation requires items or groups");
  let current = false;
  for (const item of items) {
    if (
      !item ||
      typeof item.file !== "string" ||
      typeof item.title !== "string" ||
      !item.title.trim() ||
      item.items ||
      /[\\?#%\u0000-\u001f]|^[a-z][a-z0-9+.-]*:/i.test(item.file) ||
      path.isAbsolute(item.file) ||
      !/\.html?$/.test(item.file)
    )
      throw new XsuError(
        "XSU_NAV",
        "Navigation entries require a relative HTML file and title",
      );
    for (const key of ["desc", "tag"])
      if (item[key] !== undefined && typeof item[key] !== "string")
        throw new XsuError("XSU_NAV", `Navigation ${key} must be text`);
    const target = path.resolve(dir, item.file);
    const relative = path.relative(dir, target);
    if (
      relative.startsWith(`..${path.sep}`) ||
      relative === ".." ||
      seen.has(target)
    )
      throw new XsuError(
        "XSU_NAV",
        "Navigation escapes its root or repeats a member",
      );
    seen.add(target);
    if (fs.existsSync(target)) {
      const actual = fs.realpathSync(target);
      const rel = path.relative(dir, actual);
      if (rel === ".." || rel.startsWith(`..${path.sep}`))
        throw new XsuError("XSU_NAV", "Navigation symlink escapes its root");
    }
    if (target === canonicalOutput) current = true;
    else if (!fs.existsSync(target))
      throw new XsuError(
        "XSU_NAV",
        `Navigation member does not exist: ${item.file}`,
      );
  }
  if (!current)
    throw new XsuError(
      "XSU_NAV",
      "Output must be a member of the specified navigation",
    );
  return {
    data,
    file,
    src: path.relative(outputDir, file).split(path.sep).join("/"),
  };
}

export function compileFile(entry, assets, adapter, options = {}) {
  const network = options.network || "offline";
  if (!["offline", "connected"].includes(network))
    throw new XsuError("XSU_CLI", "Network mode must be offline or connected");
  const resolved = resolveDocument(entry);
  const root = resolved.root;
  const meta = props(root);
  if (meta.xsuVersion !== 1)
    fail(root, "XSU_VERSION", "Only xsuVersion: 1 is supported");
  if (meta.preset !== assets.preset)
    fail(root, "XSU_PRESET", `This skill only supports ${assets.preset}`);
  for (const key of ["id", "title", "date"])
    if (typeof meta[key] !== "string" || !meta[key].trim())
      fail(root, "XSU_REQUIRED", `${key} is required`);
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(meta.date) ||
    Number.isNaN(Date.parse(meta.date)) ||
    new Date(meta.date).toISOString().slice(0, 10) !== meta.date
  )
    fail(root, "XSU_DATE", "Date must be a valid YYYY-MM-DD calendar date");
  if (meta.theme && !["system", "light", "dark"].includes(meta.theme))
    fail(root, "XSU_PROP", "Theme must be system, light or dark");
  validateIds(root);
  const warnings = [];
  const context = { network, warnings, readImage: resolved.readImage };
  adapter.validate(root, context);
  const rendered = adapter.render(root, context);
  if (options.warningsAsErrors && warnings.length)
    throw new XsuError(
      "XSU_WARNINGS",
      "Warnings treated as errors",
      root,
      warnings,
    );
  let html = assets.template;
  let nav;
  if (assets.preset === "editorial") {
    html = html.replace(
      /<title>[\s\S]*?<\/title>/,
      () => `<title>${esc(rendered.title)}</title>`,
    );
    if (typeof rendered.cover === "string")
      html = html.replace(
        /<header class="hero">[\s\S]*?<\/header>/,
        () => rendered.cover,
      );
    html = html.replace(
      /<!--\s*SLOT:([a-z-]+)[\s\S]*?-->/g,
      (_, slot) => rendered.slots[slot] || "",
    );
    if (options.nav) {
      if (!options.out) throw new XsuError("XSU_NAV", "--nav requires --out");
      nav = navigation(options.nav, options.out);
      resolved.files.set(nav.file, fs.readFileSync(nav.file));
      html = html.replace(
        /<script\b[^>]*\bid="report-nav-data"[^>]*>[\s\S]*?<\/script>/,
        () =>
          `<script type="application/json" id="report-nav-data" data-src="${esc(nav.src)}">${scriptJson(nav.data)}</script>`,
      );
    }
  } else {
    if (options.nav)
      throw new XsuError("XSU_NAV", "--nav is only supported by editorial");
    html = html.replace(
      /<title>[\s\S]*?<\/title>/,
      () => `<title>${esc(meta.title)}</title>`,
    );
    html = html.replace(
      /<script\b[^>]*\bid="replay-data"[^>]*>[\s\S]*?<\/script>/,
      () =>
        `<script type="application/json" id="replay-data">${scriptJson(rendered)}</script>`,
    );
  }
  const config = {
    network,
    theme: meta.theme || "system",
    documentId: meta.id,
  };
  html = html.replace(
    /<head>/i,
    () =>
      `<head>\n<script>window.__XSU_CONFIG__=${scriptJson(config)};${meta.theme && meta.theme !== "system" ? `document.documentElement.setAttribute("data-theme",${scriptJson(meta.theme)});` : ""}</script>`,
  );
  if (network === "offline") {
    // A compiled offline page must not retain a remotely loadable script URL.
    html = html.replaceAll(
      "https://cdn.jsdelivr.net/npm/pele@1.6.0/dist/pele.global.js",
      "",
    );
  }
  const hash = crypto.createHash("sha256");
  for (const [file, bytes] of [...resolved.files].sort(([a], [b]) =>
    a.localeCompare(b, "en"),
  ))
    hash
      .update(path.relative(resolved.rootDir, file).split(path.sep).join("/"))
      .update("\0")
      .update(bytes);
  hash.update(
    stableJson({
      network,
      version: COMPILER_VERSION,
      preset: assets.preset,
      template: assets.template,
      outNav: nav?.src || "",
    }),
  );
  const marker = {
    renderer: COMPILER_VERSION,
    preset: assets.preset,
    documentId: meta.id,
    inputHash: hash.digest("hex"),
  };
  html = html.replace(
    /<!doctype html>/i,
    () => `<!doctype html>\n<!-- XSU_GENERATED ${stableJson(marker)} -->`,
  );
  if (Buffer.byteLength(html) > 25 * 1024 * 1024)
    throw new XsuError("XSU_LIMIT", "Generated HTML exceeds 25 MiB");
  return { html, warnings, root, inputs: [...resolved.files.keys()], marker };
}

export function writeHtmlAtomic(output, html, options = {}) {
  const target = path.resolve(output);
  const parent = fs.realpathSync(path.dirname(target));
  const canonical = path.join(parent, path.basename(target));
  if ((options.inputs || []).some((file) => path.resolve(file) === canonical))
    throw new XsuError("XSU_OUTPUT", "Output cannot overwrite an input");
  const existing = fs.lstatSync(target, { throwIfNoEntry: false });
  if (existing?.isSymbolicLink())
    throw new XsuError("XSU_OUTPUT", "Output cannot be a symbolic link");
  if (existing) {
    if (
      (options.inputs || []).some(
        (file) =>
          fs.statSync(file).ino === fs.statSync(target).ino &&
          fs.statSync(file).dev === fs.statSync(target).dev,
      )
    )
      throw new XsuError("XSU_OUTPUT", "Output is a hard link to an input");
    const old = fs.readFileSync(target, "utf8");
    const marker = /<!-- XSU_GENERATED (\{[^\n]*\}) -->/.exec(old);
    let owned = false;
    try {
      const prior = JSON.parse(marker?.[1] || "null");
      owned =
        !!prior &&
        !!options.marker &&
        prior.preset === options.marker.preset &&
        prior?.documentId === options.marker?.documentId;
    } catch {
      /* not an owned output */
    }
    if (!options.force && !owned)
      throw new XsuError(
        "XSU_OUTPUT",
        "Refusing to overwrite a non-owned output; use --force explicitly",
      );
  }
  const lock = `${canonical}.xsu-lock`;
  let lockHandle;
  let temp;
  try {
    lockHandle = fs.openSync(lock, "wx");
    temp = fs.mkdtempSync(path.join(parent, ".xsu-"));
    const staged = path.join(temp, "output");
    fs.writeFileSync(staged, html, { flag: "wx", mode: 0o600 });
    fs.renameSync(staged, canonical);
  } finally {
    if (temp) fs.rmSync(temp, { recursive: true, force: true });
    if (lockHandle !== undefined) {
      fs.closeSync(lockHandle);
      fs.unlinkSync(lock);
    }
  }
}
