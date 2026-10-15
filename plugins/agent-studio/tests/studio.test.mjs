import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  cp,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { execute } from "../skills/agent-studio/scripts/cli.mjs";
import { Workspace } from "../skills/agent-studio/scripts/store.mjs";

const plugin = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const code = (name) => (error) => error.code === name;

async function fixture(t, host = "pi") {
  const root = await mkdtemp(join(tmpdir(), "agent-studio-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const run = (command, ...args) =>
    execute([command, "--root", root, "--host", host, ...args], {});
  const json = async (name, value) =>
    writeFile(join(root, name), `${JSON.stringify(value, null, 2)}\n`);
  const read = async (name) =>
    JSON.parse(await readFile(join(root, name), "utf8"));
  await run("init", ...(host === "pi" ? ["--adapter", "pi-subagent-v1"] : []));
  return { root, run, json, read };
}

const agent = () => ({
  schemaVersion: 1,
  id: "researcher",
  description: "收集来源并返回对照结果",
  model: "research",
  access: "read-only",
  capabilities: ["read", "search"],
  instructions: "读取输入资料并返回结论，列出证据，不修改项目文件。",
});
const workflow = () => ({
  schemaVersion: 1,
  id: "compare",
  description: "使用者定义的资料对照流程",
  steps: [
    {
      id: "collect",
      agent: "researcher",
      task: "阅读需求并归纳证据",
      inputs: ["project:brief.txt"],
      outputs: ["notes.md"],
      approval: false,
    },
    {
      id: "compare",
      agent: "researcher",
      task: "对照证据提出候选项",
      inputs: ["artifact:notes.md"],
      outputs: ["result.md"],
      approval: true,
    },
  ],
});

async function ready(t, host = "pi") {
  const f = await fixture(t, host);
  await f.run(
    "model-set",
    "--id",
    "research",
    "--model",
    host === "pi" ? "vendor/model:revision" : "sonnet",
    ...(host === "pi" ? ["--provider", "example-router"] : []),
  );
  await f.json("agent.json", agent());
  await f.run("agent-save", "--file", "agent.json");
  await f.run("agent-render", "--id", "researcher", "--apply");
  await writeFile(join(f.root, "brief.txt"), "比较两份材料");
  await f.json("workflow.json", workflow());
  await f.run("workflow-save", "--file", "workflow.json");
  return f;
}

async function artifact(root, run, name, content = "有来源的结果") {
  const file = join(root, ".xlf-marketplace", "runs", run, "artifacts", name);
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, content);
}

test("宿主目录只是提示，明确标记与显式宿主冲突时拒绝", async (t) => {
  const f = await fixture(t);
  await mkdir(join(f.root, ".claude"));
  await mkdir(join(f.root, ".pi"));
  const detected = await execute(["host", "--root", f.root], {});
  assert.equal(detected.host, null);
  assert.deepEqual(detected.candidates, ["claude", "pi"]);
  await assert.rejects(
    execute(["init", "--root", f.root], {}),
    code("HOST_REQUIRED"),
  );
  assert.equal(
    (await execute(["host", "--root", f.root], { AI_AGENT: "pi" })).host,
    "pi",
  );
  await assert.rejects(
    execute(["host", "--root", f.root, "--host", "claude"], {
      PI_CODING_AGENT: "true",
    }),
    code("HOST_CONFLICT"),
  );
  await assert.rejects(
    execute(["host", "--root", f.root, "--host", "cursor"], {}),
    code("HOST_UNSUPPORTED"),
  );
});

test("Pi 要求确认适配器，重复初始化保留模型", async (t) => {
  const f = await fixture(t);
  await assert.rejects(f.run("init"), code("ADAPTER_REQUIRED"));
  await f.run(
    "model-set",
    "--id",
    "fast",
    "--provider",
    "example",
    "--model",
    "model",
  );
  await f.run("init", "--adapter", "pi-subagent-v1");
  assert.equal(
    (await f.run("model-resolve", "--id", "fast")).native,
    "example/model",
  );
  await execute(["init", "--root", f.root, "--host", "claude"], {});
  assert.deepEqual(
    Object.keys((await f.read(".xlf-marketplace/config.json")).hosts),
    ["pi", "claude"],
  );
});

test("Pi 模型必须登记 provider，允许 ID 自带多级路径和冒号", async (t) => {
  const f = await fixture(t);
  await assert.rejects(
    f.run("model-set", "--id", "fast", "--model", "model"),
    code("PROVIDER"),
  );
  await f.run(
    "model-set",
    "--id",
    "fast",
    "--provider",
    "router",
    "--model",
    "vendor/family/model:rev",
  );
  assert.equal(
    (await f.run("model-resolve", "--id", "fast")).native,
    "router/vendor/family/model:rev",
  );
  await assert.rejects(
    f.run("model-resolve", "--id", "missing"),
    code("MODEL_UNKNOWN"),
  );
  await assert.rejects(
    f.run(
      "model-set",
      "--id",
      "fast",
      "--provider",
      "router",
      "--model",
      "different",
    ),
    code("EXISTS"),
  );
  await f.run(
    "model-set",
    "--id",
    "fast",
    "--provider",
    "router",
    "--model",
    "different",
    "--replace",
  );
  assert.equal(
    (await f.run("model-resolve", "--id", "fast")).native,
    "router/different",
  );
});

test("Claude 模型原样保留，不剥离斜杠，映射不能跨宿主代用", async (t) => {
  const f = await fixture(t, "claude");
  await f.run("model-set", "--id", "fast", "--model", "custom/backend-model");
  assert.equal(
    (await f.run("model-resolve", "--id", "fast")).native,
    "custom/backend-model",
  );
  await assert.rejects(
    f.run(
      "model-set",
      "--id",
      "bad",
      "--provider",
      "anthropic",
      "--model",
      "sonnet",
    ),
    code("SCHEMA"),
  );
  await execute(
    ["init", "--root", f.root, "--host", "pi", "--adapter", "pi-subagent-v1"],
    {},
  );
  await assert.rejects(
    execute(
      ["model-resolve", "--root", f.root, "--host", "pi", "--id", "fast"],
      {},
    ),
    code("MODEL_HOST_MISSING"),
  );
});

test("拒绝密钥字段和未知 schema，不自动迁移", async (t) => {
  const f = await fixture(t);
  await f.json(".xlf-marketplace/models/registry.json", {
    schemaVersion: 1,
    profiles: {
      fast: {
        pi: { provider: "example", model: "test", apiKey: "not-a-real-key" },
      },
    },
  });
  await assert.rejects(f.run("model-list"), code("SCHEMA"));
  await f.json(".xlf-marketplace/models/registry.json", {
    schemaVersion: 99,
    profiles: {},
  });
  await assert.rejects(f.run("model-list"), code("SCHEMA_VERSION"));
});

for (const host of ["claude", "pi"]) {
  test(`${host} 生成原生路径、显式工具和正确模型，预览不写文件`, async (t) => {
    const f = await ready(t, host);
    const rendered = await f.run("agent-render", "--id", "researcher");
    assert.equal(rendered.path, `.${host}/agents/researcher.md`);
    assert.match(
      rendered.content,
      host === "pi"
        ? /model: "example-router\/vendor\/model:revision"/
        : /model: "sonnet"/,
    );
    assert.match(
      rendered.content,
      host === "pi" ? /tools: read, grep, find/ : /tools: Read, Grep, Glob/,
    );
    assert.doesNotMatch(rendered.content, /[Bb]ash/);
    await rm(join(f.root, rendered.path));
    await f.run("agent-render", "--id", "researcher");
    await assert.rejects(readFile(join(f.root, rendered.path)), code("ENOENT"));
    await f.run("agent-render", "--id", "researcher", "--apply");
    assert.equal((await f.run("check")).workflows[0], "compare");
  });
}

test("只读不包含 shell，空工具和未知能力拒绝", async (t) => {
  const f = await ready(t);
  for (const capabilities of [["read", "shell"], ["other"], []]) {
    await f.json("agent.json", { ...agent(), capabilities });
    await assert.rejects(
      f.run("agent-save", "--file", "agent.json", "--replace"),
    );
  }
  assert.deepEqual(
    (await f.read(".xlf-marketplace/agents/researcher.json")).capabilities,
    ["read", "search"],
  );
});

test("保护未托管文件与用户修改，生成更新需要显式 replace", async (t) => {
  const f = await ready(t);
  const target = join(f.root, ".pi/agents/researcher.md");
  await f.json("agent.json", { ...agent(), instructions: "新的职责范围" });
  await f.run("agent-save", "--file", "agent.json", "--replace");
  await assert.rejects(
    f.run("agent-render", "--id", "researcher", "--apply"),
    code("EXISTS"),
  );
  await f.run("agent-render", "--id", "researcher", "--apply", "--replace");
  await writeFile(target, "用户维护的内容");
  await assert.rejects(
    f.run("agent-render", "--id", "researcher", "--apply", "--replace"),
    code("DRIFT"),
  );
  await rm(join(f.root, ".xlf-marketplace/generated/pi/researcher.json"));
  await assert.rejects(
    f.run("agent-render", "--id", "researcher", "--apply", "--replace"),
    code("UNMANAGED"),
  );
  assert.equal(await readFile(target, "utf8"), "用户维护的内容");
});

test("相同生成内容可恢复缺失的管理记录", async (t) => {
  const f = await ready(t);
  await rm(join(f.root, ".xlf-marketplace/generated/pi/researcher.json"));
  await f.run("agent-render", "--id", "researcher", "--apply");
  assert.equal(
    (await f.read(".xlf-marketplace/generated/pi/researcher.json")).path,
    ".pi/agents/researcher.md",
  );
});

test("路径穿越、绝对输入、符号链接与锁冲突拒绝", async (t) => {
  const f = await ready(t);
  await assert.rejects(f.run("agent-render", "--id", "../escape"), code("ID"));
  await assert.rejects(
    f.run("agent-save", "--file", "../outside.json"),
    code("PATH"),
  );
  await assert.rejects(
    f.run("agent-save", "--file", join(f.root, "agent.json")),
    code("PATH"),
  );
  await symlink(join(f.root, "agent.json"), join(f.root, "linked.json"));
  await assert.rejects(
    f.run("agent-save", "--file", "linked.json"),
    code("SYMLINK"),
  );
  await writeFile(join(f.root, ".xlf-marketplace/.lock"), "123\n");
  await assert.rejects(
    f.run("model-set", "--id", "fast", "--provider", "test", "--model", "test"),
    code("LOCKED"),
  );
});

test("拒绝宿主目录的符号链接，避免写到别的工作区", async (t) => {
  const f = await ready(t);
  await rm(join(f.root, ".pi"), { recursive: true });
  await mkdir(join(f.root, "other"));
  await symlink(join(f.root, "other"), join(f.root, ".pi"));
  await assert.rejects(
    f.run("agent-render", "--id", "researcher", "--apply"),
    code("SYMLINK"),
  );
});

test("拒绝工件前向引用、重复步骤、目录文件冲突", async (t) => {
  const f = await ready(t);
  const bad = [];
  const forward = workflow();
  forward.steps[0].inputs = ["artifact:result.md"];
  bad.push(forward);
  const duplicate = workflow();
  duplicate.steps[1].id = "collect";
  bad.push(duplicate);
  const conflicting = workflow();
  conflicting.steps[1].outputs = ["notes.md/child"];
  bad.push(conflicting);
  const escape = workflow();
  escape.steps[0].outputs = ["../state.json"];
  bad.push(escape);
  for (const value of bad) {
    await f.json("workflow.json", value);
    await assert.rejects(
      f.run("workflow-save", "--file", "workflow.json", "--replace"),
    );
  }
});

test("缺少输入时不创建运行；未知模型或过期代理阻止启动", async (t) => {
  const f = await ready(t);
  await rm(join(f.root, "brief.txt"));
  await assert.rejects(
    f.run("run-start", "--workflow", "compare"),
    code("ENOENT"),
  );
  await assert.rejects(
    readFile(join(f.root, ".xlf-marketplace/runs")),
    code("ENOENT"),
  );
  await f.run(
    "model-set",
    "--id",
    "research",
    "--provider",
    "example",
    "--model",
    "new",
    "--replace",
  );
  await assert.rejects(
    f.run("run-start", "--workflow", "compare"),
    code("DRIFT"),
  );
});

for (const host of ["claude", "pi"]) {
  test(`${host} 两步流程可恢复，缺失输出/审批/重复完成不能推进`, async (t) => {
    const f = await ready(t, host);
    const { run } = await f.run("run-start", "--workflow", "compare");
    const current = await f.run("run-next", "--run", run);
    assert.equal(current.step, "collect");
    await writeFile(join(f.root, "brief.txt"), "原项目后来变更");
    assert.equal(
      await readFile(current.inputs[0].path, "utf8"),
      "比较两份材料",
    );
    await assert.rejects(
      f.run("run-complete", "--run", run, "--step", "compare"),
      code("STEP_ORDER"),
    );
    await assert.rejects(
      f.run("run-complete", "--run", run, "--step", "collect"),
      code("ENOENT"),
    );
    await artifact(f.root, run, "notes.md", "");
    await assert.rejects(
      f.run("run-complete", "--run", run, "--step", "collect"),
      code("OUTPUT_EMPTY"),
    );
    await artifact(f.root, run, "notes.md");
    await f.run("run-complete", "--run", run, "--step", "collect");
    await assert.rejects(
      f.run("run-complete", "--run", run, "--step", "collect"),
      code("STEP_ORDER"),
    );
    assert.equal((await f.run("run-next", "--run", run)).step, "compare");
    await artifact(f.root, run, "result.md");
    await assert.rejects(
      f.run("run-complete", "--run", run, "--step", "compare"),
      code("SCHEMA"),
    );
    await f.run(
      "run-complete",
      "--run",
      run,
      "--step",
      "compare",
      "--approval",
      "测试夹具：模拟用户已确认",
    );
    assert.equal((await f.run("run-next", "--run", run)).status, "completed");
    await assert.rejects(
      f.run("run-complete", "--run", run, "--step", "compare"),
      code("STEP_ORDER"),
    );
  });
}

test("登记变更不改旧运行模型，原生文件变更会阻断旧运行", async (t) => {
  const f = await ready(t);
  const { run } = await f.run("run-start", "--workflow", "compare");
  await f.run(
    "model-set",
    "--id",
    "research",
    "--provider",
    "example",
    "--model",
    "new",
    "--replace",
  );
  assert.equal(
    (await f.run("run-next", "--run", run)).model.native,
    "example-router/vendor/model:revision",
  );
  await f.run("agent-render", "--id", "researcher", "--apply", "--replace");
  await assert.rejects(f.run("run-next", "--run", run), code("DRIFT"));
});

test("已完成工件与输入快照修改后不能继续", async (t) => {
  const f = await ready(t);
  const { run } = await f.run("run-start", "--workflow", "compare");
  await artifact(f.root, run, "notes.md");
  await f.run("run-complete", "--run", run, "--step", "collect");
  await artifact(f.root, run, "notes.md", "被改过");
  await assert.rejects(f.run("run-next", "--run", run), code("DRIFT"));
  const second = await f.run("run-start", "--workflow", "compare");
  const next = await f.run("run-next", "--run", second.run);
  await writeFile(next.inputs[0].path, "被改过");
  await assert.rejects(f.run("run-next", "--run", second.run), code("DRIFT"));
});

test("锁阻止并发合作写者，失败后释放锁", async (t) => {
  const f = await fixture(t);
  const workspace = await Workspace.open(f.root);
  await workspace.locked(async () => {
    await assert.rejects(
      f.run(
        "model-set",
        "--id",
        "fast",
        "--provider",
        "example",
        "--model",
        "test",
      ),
      code("LOCKED"),
    );
  });
  await assert.rejects(
    workspace.locked(async () => {
      throw new Error("模拟中断");
    }),
    /模拟中断/,
  );
  await f.run(
    "model-set",
    "--id",
    "fast",
    "--provider",
    "example",
    "--model",
    "test",
  );
});

test("独立技能安装可运行 CLI，错误为 JSON 和非零退出码", async (t) => {
  const f = await fixture(t);
  const copied = join(f.root, "installed-skill");
  await cp(join(plugin, "skills/agent-studio"), copied, { recursive: true });
  const cli = join(copied, "scripts/cli.mjs");
  const result = spawnSync(process.execPath, [cli, "help"], {
    encoding: "utf8",
  });
  assert.equal(result.status, 0);
  assert.equal(JSON.parse(result.stdout).ok, true);
  const invalid = spawnSync(process.execPath, [cli, "init", "--bad"], {
    encoding: "utf8",
  });
  assert.equal(invalid.status, 1);
  assert.equal(JSON.parse(invalid.stderr).error.code, "ARGUMENT");
});

test("未知参数、重复参数与坏 JSON 提供明确错误", async (t) => {
  const f = await fixture(t);
  await assert.rejects(f.run("model-list", "--id", "unused"), code("ARGUMENT"));
  await assert.rejects(
    f.run("model-resolve", "--id", "fast", "--id", "slow"),
    code("ARGUMENT"),
  );
  await writeFile(join(f.root, "bad.json"), "{");
  await assert.rejects(f.run("agent-save", "--file", "bad.json"), code("JSON"));
});

test("模型 profile 可使用 constructor，不继承 Object 原型属性", async (t) => {
  const f = await fixture(t);
  await f.run(
    "model-set",
    "--id",
    "constructor",
    "--provider",
    "example",
    "--model",
    "example/native",
  );
  assert.equal(
    (await f.run("model-resolve", "--id", "constructor")).native,
    "example/example/native",
  );
  assert.equal(
    (await f.read(".xlf-marketplace/models/registry.json")).profiles.constructor
      .pi.model,
    "example/native",
  );
});

test("损坏的模型注册表会在初始化写配置前失败", async (t) => {
  const f = await fixture(t);
  const before = await readFile(
    join(f.root, ".xlf-marketplace/config.json"),
    "utf8",
  );
  await f.json(".xlf-marketplace/models/registry.json", {
    schemaVersion: 2,
    profiles: {},
  });
  await assert.rejects(
    execute(["init", "--root", f.root, "--host", "claude"], {}),
    code("SCHEMA_VERSION"),
  );
  assert.equal(
    await readFile(join(f.root, ".xlf-marketplace/config.json"), "utf8"),
    before,
  );
});

test("工作组成员使用独立模型与工具，按定义顺序交接工件", async (t) => {
  const f = await ready(t);
  await f.run(
    "model-set",
    "--id",
    "writer",
    "--provider",
    "another-provider",
    "--model",
    "writer-model",
  );
  await f.json("writer.json", {
    ...agent(),
    id: "writer",
    model: "writer",
    access: "workspace-write",
    capabilities: ["read", "edit"],
  });
  await f.run("agent-save", "--file", "writer.json");
  await f.run("agent-render", "--id", "writer", "--apply");
  const flow = workflow();
  flow.steps[1].agent = "writer";
  await f.json("workflow.json", flow);
  await f.run("workflow-save", "--file", "workflow.json", "--replace");
  const { run } = await f.run("run-start", "--workflow", "compare");
  assert.equal((await f.run("run-next", "--run", run)).agent, "researcher");
  await artifact(f.root, run, "notes.md");
  await f.run("run-complete", "--run", run, "--step", "collect");
  const next = await f.run("run-next", "--run", run);
  assert.equal(next.agent, "writer");
  assert.equal(next.model.native, "another-provider/writer-model");
  assert.match(
    await readFile(next.agentPath, "utf8"),
    /tools: read, edit, write/,
  );
  assert.equal(await readFile(next.inputs[0].path, "utf8"), "有来源的结果");
});

test("拒绝仅大小写或 Unicode 规范化不同的工件与父路径", async (t) => {
  const f = await ready(t);
  for (const [first, second] of [
    ["notes.md", "NOTES.md"],
    ["notes.md", "NOTES.MD/child"],
    ["café.md", "cafe\u0301.md"],
  ]) {
    const flow = workflow();
    flow.steps[0].outputs = [first];
    flow.steps[1].inputs = [`artifact:${first}`];
    flow.steps[1].outputs = [second];
    await f.json("workflow.json", flow);
    await assert.rejects(
      f.run("workflow-save", "--file", "workflow.json", "--replace"),
      code("OUTPUT"),
    );
  }
});

test("__proto__ 工件摘要可持久化，完成后能继续并查询结果", async (t) => {
  const f = await ready(t);
  const flow = workflow();
  flow.steps[0].outputs = ["__proto__"];
  flow.steps[1].inputs = ["artifact:__proto__"];
  await f.json("workflow.json", flow);
  await f.run("workflow-save", "--file", "workflow.json", "--replace");
  const { run } = await f.run("run-start", "--workflow", "compare");
  await artifact(f.root, run, "__proto__");
  await f.run("run-complete", "--run", run, "--step", "collect");
  const state = await f.read(`.xlf-marketplace/runs/${run}/state.json`);
  assert.equal(Object.hasOwn(state.completed[0].outputs, "__proto__"), true);
  assert.equal((await f.run("run-next", "--run", run)).step, "compare");
  await artifact(f.root, run, "result.md");
  await f.run(
    "run-complete",
    "--run",
    run,
    "--step",
    "compare",
    "--approval",
    "测试夹具：模拟确认",
  );
  assert.equal((await f.run("run-next", "--run", run)).status, "completed");
});
