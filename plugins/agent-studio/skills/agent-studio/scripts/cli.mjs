#!/usr/bin/env node
import { pathToFileURL } from "node:url";
import { realpathSync } from "node:fs";
import { DATA, Workspace, fail, requireValue, serialize } from "./store.mjs";
import {
  detectHost,
  initialize,
  requireHost,
  requireInitialized,
} from "./host.mjs";
import { registry, resolveModel, setModel } from "./models.mjs";
import {
  applyAgent,
  check,
  renderAgent,
  saveAgent,
  saveWorkflow,
} from "./definitions.mjs";
import { completeStep, nextStep, startRun } from "./runs.mjs";

const COMMANDS = {
  host: [],
  init: ["adapter"],
  "model-list": [],
  "model-set": ["id", "provider", "model", "replace"],
  "model-resolve": ["id"],
  "agent-save": ["file", "replace"],
  "agent-render": ["id", "apply", "replace"],
  "workflow-save": ["file", "replace"],
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
  const allowed = ["root", "host", ...COMMANDS[command]];
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
      common: ["--root <project>", "--host claude|pi"],
      dataDirectory: DATA,
      note: "只管理配置与工件进度，不启动模型；--file 必须是项目内相对路径。",
    };
  }
  const { command, options } = parse(args);
  const workspace = await Workspace.open(options.root ?? process.cwd());
  const detection = await detectHost(workspace, options.host, env);
  if (command === "host") return detection;
  const host = requireHost(detection);
  const action = async () => {
    if (command === "init") {
      if (await workspace.exists(`${DATA}/models/registry.json`))
        await registry(workspace);
      return initialize(workspace, host, options.adapter);
    }
    await requireInitialized(workspace, host);
    switch (command) {
      case "model-list":
        return registry(workspace);
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
      case "agent-render": {
        const name = needed(options, "id");
        requireValue(
          !options.replace || options.apply,
          "ARGUMENT",
          "--replace 仅可与 --apply 一起使用",
        );
        return options.apply
          ? applyAgent(workspace, host, name, options.replace)
          : renderAgent(workspace, host, name);
      }
      case "workflow-save":
        return saveWorkflow(
          workspace,
          await workspace.json(needed(options, "file")),
          options.replace,
        );
      case "check":
        return check(workspace, host);
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
      "agent-save",
      "workflow-save",
      "run-start",
      "run-complete",
    ].includes(command) ||
    (command === "agent-render" && options.apply);
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
