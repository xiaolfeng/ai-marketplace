#!/usr/bin/env node
import { pathToFileURL } from "node:url";
import { realpathSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import { homedir } from "node:os";
import { join, resolve } from "node:path";
import { DATA, Workspace, fail, requireValue, serialize } from "./store.mjs";
import {
  detectHost,
  initialize,
  requireHost,
  requireInitialized,
} from "./host.mjs";
import { registry, resolveModel, setModel } from "./models.mjs";
import { candidates, saveCatalog } from "./catalog.mjs";
import {
  applyAgent,
  check,
  renderAgent,
  saveAgent,
  saveWorkflow,
} from "./definitions.mjs";
import { applyWorkflow, inventory, renderWorkflow } from "./exports.mjs";
import { completeStep, nextStep, startRun } from "./runs.mjs";

const COMMANDS = {
  host: [],
  init: ["adapter"],
  inventory: [],
  "model-list": [],
  "model-catalog-save": ["file"],
  "model-candidates": ["query", "provider"],
  "model-set": ["id", "provider", "model", "replace"],
  "model-resolve": ["id"],
  "agent-save": ["file", "replace"],
  "agent-render": ["id", "apply", "replace"],
  "workflow-save": ["file", "replace"],
  "workflow-render": ["id", "apply", "replace"],
  check: [],
  "run-start": ["workflow"],
  "run-next": ["run"],
  "run-complete": ["run", "step", "approval"],
};

function parse(args) {
  const [command, ...rest] = args;
  requireValue(
    Object.hasOwn(COMMANDS, command),
    "COMMAND",
    "未知命令；运行 help 查看命令列表",
  );
  const allowed = ["root", "host", "scope", ...COMMANDS[command]];
  const options = {};
  for (let index = 0; index < rest.length; index += 1) {
    const argument = rest[index];
    requireValue(
      argument.startsWith("--"),
      "ARGUMENT",
      "参数必须使用 --name value",
    );
    const name = argument.slice(2);
    requireValue(
      allowed.includes(name) && !Object.hasOwn(options, name),
      "ARGUMENT",
      `未知或重复参数 ${argument}`,
    );
    if (["apply", "replace"].includes(name)) options[name] = true;
    else {
      index += 1;
      requireValue(
        rest[index] !== undefined &&
          !rest[index].startsWith("--") &&
          rest[index].length > 0,
        "ARGUMENT",
        `${argument} 缺少值`,
      );
      options[name] = rest[index];
    }
  }
  return { command, options };
}

function needed(options, name) {
  requireValue(options[name] !== undefined, "ARGUMENT", `缺少 --${name}`);
  return options[name];
}

export async function execute(args, env = process.env) {
  if (
    args.length === 0 ||
    (args.length === 1 && ["help", "--help"].includes(args[0]))
  ) {
    return {
      commands: COMMANDS,
      common: [
        "--host claude|pi",
        "--scope user|project",
        "--root <directory>",
      ],
      defaultScope: "user",
      dataDirectory: DATA,
      note: "默认构建用户全局角色与独立工作流技能；显式 --root 且省略 scope 时兼容旧项目模式。--file 是配置根内相对路径。run-* 仅保留给旧项目运行。",
    };
  }
  const { command, options } = parse(args);
  const scope = options.scope ?? (options.root ? "project" : "user");
  requireValue(
    ["user", "project"].includes(scope),
    "ARGUMENT",
    "scope 必须是 user 或 project",
  );
  const context = await Workspace.open(
    scope === "project" ? (options.root ?? process.cwd()) : process.cwd(),
  );
  const detection = await detectHost(context, options.host, env);
  if (command === "host" && detection.host === null)
    return { ...detection, scope };
  const host = requireHost(detection);
  const userRoot =
    host === "pi"
      ? env.PI_CODING_AGENT_DIR || join(env.HOME || homedir(), ".pi", "agent")
      : env.CLAUDE_CONFIG_DIR || join(env.HOME || homedir(), ".claude");
  const root = resolve(
    options.root ?? (scope === "user" ? userRoot : process.cwd()),
  );
  if (command === "host") return { ...detection, scope, root };
  requireValue(
    scope === "project" || !command.startsWith("run-"),
    "SCOPE",
    "全局工作流请通过生成的技能独立调用；run-* 仅兼容旧项目运行",
  );
  if (command === "init") await mkdir(root, { recursive: true });
  const workspace = await Workspace.open(root);
  workspace.scope = scope;
  if (command === "inventory") return inventory(workspace, host);
  const action = async () => {
    if (command === "init") {
      if (await workspace.exists(`${DATA}/models/registry.json`))
        await registry(workspace);
      return { ...(await initialize(workspace, host, options.adapter)), scope };
    }
    await requireInitialized(workspace, host);
    switch (command) {
      case "model-list":
        return registry(workspace);
      case "model-catalog-save":
        return saveCatalog(
          workspace,
          host,
          await workspace.json(needed(options, "file")),
        );
      case "model-candidates":
        return candidates(workspace, host, options);
      case "model-set":
        needed(options, "id");
        needed(options, "model");
        return setModel(workspace, host, options);
      case "model-resolve":
        return resolveModel(
          await registry(workspace),
          host,
          needed(options, "id"),
        );
      case "agent-save":
        return saveAgent(
          workspace,
          await workspace.json(needed(options, "file")),
          options.replace,
        );
      case "workflow-save":
        return saveWorkflow(
          workspace,
          await workspace.json(needed(options, "file")),
          options.replace,
        );
      case "agent-render":
      case "workflow-render": {
        const name = needed(options, "id");
        requireValue(
          !options.replace || options.apply,
          "ARGUMENT",
          "--replace 仅可与 --apply 一起使用",
        );
        const render =
          command === "agent-render" ? renderAgent : renderWorkflow;
        const apply = command === "agent-render" ? applyAgent : applyWorkflow;
        return options.apply
          ? apply(workspace, host, name, options.replace)
          : render(workspace, host, name);
      }
      case "check": {
        const result = await check(workspace, host);
        if (scope === "user") {
          for (const name of result.workflows) {
            const rendered = await renderWorkflow(workspace, host, name);
            requireValue(
              (await workspace.exists(rendered.path)) &&
                (await workspace.bytes(rendered.path)).toString("utf8") ===
                  rendered.content,
              "DRIFT",
              `Workflow 技能未生成或已过期：${name}`,
            );
          }
        }
        return result;
      }
      case "run-start":
        return startRun(workspace, host, needed(options, "workflow"));
      case "run-next":
        return nextStep(workspace, host, needed(options, "run"));
      case "run-complete":
        return completeStep(
          workspace,
          host,
          needed(options, "run"),
          needed(options, "step"),
          options.approval,
        );
      default:
        fail("COMMAND", "未实现的命令");
    }
  };
  const mutates =
    [
      "init",
      "model-set",
      "model-catalog-save",
      "agent-save",
      "workflow-save",
      "run-start",
      "run-complete",
    ].includes(command) ||
    (["agent-render", "workflow-render"].includes(command) && options.apply);
  return mutates ? workspace.locked(action) : action();
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href
) {
  try {
    console.log(
      serialize({
        ok: true,
        ...(await execute(process.argv.slice(2))),
      }).trimEnd(),
    );
  } catch (error) {
    console.error(
      serialize({
        ok: false,
        error: { code: error.code ?? "INTERNAL", message: error.message },
      }).trimEnd(),
    );
    process.exitCode = 1;
  }
}
