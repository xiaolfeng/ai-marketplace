import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { execute } from "../skills/agent-studio/scripts/cli.mjs";

const code = (name) => (error) => error.code === name;

async function homeFixture(t, host = "pi", overrides = {}) {
  const home = await mkdtemp(join(tmpdir(), "personal-system-home-"));
  t.after(() => rm(home, { recursive: true, force: true }));
  const env = { HOME: home, ...overrides };
  const run = (command, ...args) =>
    execute([command, "--host", host, ...args], env);
  const detected = await run("host");
  const root = detected.root;
  const json = async (name, value) => {
    await mkdir(join(root, ".xlf-marketplace/drafts"), { recursive: true });
    const file = `.xlf-marketplace/drafts/${name}.json`;
    await writeFile(join(root, file), JSON.stringify(value));
    return file;
  };
  await run("init", ...(host === "pi" ? ["--adapter", "pi-subagent-v1"] : []));
  return { home, env, root, run, json };
}

async function saveAgent(f, host, model = null) {
  const file = await f.json("reader", {
    schemaVersion: 1,
    id: "reader",
    model,
    description: "用户需要阅读笔记、整理学习资料时使用，返回要点与来源。",
    access: "read-only",
    capabilities: ["read", "search"],
    instructions: "阅读本次输入材料，按主题返回要点与出处，缺少材料时说明。",
  });
  await f.run("agent-save", "--file", file);
  return f.run("agent-render", "--id", "reader", "--apply");
}

async function saveFlow(f) {
  const file = await f.json("study", {
    schemaVersion: 1,
    id: "study",
    description: "用户要从学习笔记提炼要点并检查证据时使用。",
    steps: [
      {
        id: "extract",
        agent: "reader",
        task: "提取笔记中的关键事实",
        inputs: ["project:notes.md"],
        outputs: ["facts.md"],
        approval: false,
      },
      {
        id: "verify",
        agent: "reader",
        task: "核对事实，返回可追溯的总结",
        inputs: ["artifact:facts.md"],
        outputs: ["summary.md"],
        approval: true,
      },
    ],
  });
  await f.run("workflow-save", "--file", file);
}

for (const host of ["pi", "claude"]) {
  test(`${host} 默认写入用户全局，默认模型不固定为创建时模型`, async (t) => {
    const f = await homeFixture(t, host);
    const expected = join(f.home, host === "pi" ? ".pi/agent" : ".claude");
    assert.equal((await f.run("host")).scope, "user");
    assert.equal(f.root, expected);
    const rendered = await saveAgent(f, host);
    assert.equal(rendered.path, "agents/reader.md");
    assert.equal(rendered.model.mode, "inherit");
    const content = await readFile(join(f.root, rendered.path), "utf8");
    assert.doesNotMatch(content, /^model:/m);
    assert.match(content, /学习资料/);
    assert.deepEqual((await f.run("model-list")).profiles, {});
    const listed = await f.run("inventory");
    assert.equal(listed.agents[0].path, join(listed.root, "agents/reader.md"));
    await assert.rejects(
      f.run("run-start", "--workflow", "study"),
      code("SCOPE"),
    );
  });

  test(`${host} 工作流包含触发、模型与交接，删除构建记录后原生文件仍完整`, async (t) => {
    const f = await homeFixture(t, host);
    await f.run(
      "model-set",
      "--id",
      "study",
      "--model",
      "vendor/model:rev",
      ...(host === "pi" ? ["--provider", "router"] : []),
    );
    await saveAgent(f, host, "study");
    await saveFlow(f);
    await assert.rejects(f.run("check"), code("DRIFT"));
    const preview = await f.run("workflow-render", "--id", "study");
    assert.equal(preview.path, "skills/study/SKILL.md");
    await assert.rejects(readFile(join(f.root, preview.path)), code("ENOENT"));
    const result = await f.run("workflow-render", "--id", "study", "--apply");
    assert.equal(result.invocation, host === "pi" ? "/skill:study" : "/study");
    assert.equal((await f.run("check")).workflows[0], "study");
    await rm(join(f.root, ".xlf-marketplace"), { recursive: true });
    const skill = await readFile(join(f.root, preview.path), "utf8");
    const native = await readFile(join(f.root, "agents/reader.md"), "utf8");
    assert.equal(skill, preview.content);
    assert.match(skill, /description: .*学习笔记/);
    assert.match(skill, /vendor\/model:rev/);
    assert.match(skill, /artifact:facts.md/);
    assert.match(skill, /完成后需要用户确认：是/);
    assert.match(skill, /失败或取消/);
    assert.match(skill, /原生角色丢失/);
    assert.match(native, /^model:/m);
    assert.doesNotMatch(
      skill + native,
      /agent-studio|\.xlf-marketplace|cli\.mjs|run-start|run-next/,
    );
  });
}

test("模型候选按名称/provider 匹配，同名跨 provider 不混淆且不自动登记", async (t) => {
  const f = await homeFixture(t);
  assert.equal((await f.run("model-candidates")).refreshRequired, true);
  const file = await f.json("catalog", {
    schemaVersion: 1,
    host: "pi",
    source: "pi-runtime",
    models: [
      { provider: "a", model: "vendor/model:rev", name: "快速整理" },
      { provider: "b", model: "vendor/model:rev", name: "快速整理" },
      { provider: "b", model: "writer", name: "写作" },
    ],
  });
  await f.run("model-catalog-save", "--file", file);
  const matched = await f.run("model-candidates", "--query", "快速");
  assert.equal(matched.models.length, 2);
  assert.notEqual(matched.models[0].native, matched.models[1].native);
  const selected = await f.run(
    "model-candidates",
    "--query",
    "model:rev",
    "--provider",
    "b",
  );
  assert.equal(selected.models[0].native, "b/vendor/model:rev");
  assert.equal(
    (await f.run("model-candidates", "--query", "missing")).models.length,
    0,
  );
  assert.deepEqual((await f.run("model-list")).profiles, {});
});

test("模型目录拒绝凭据、重复模型和跨宿主污染，失败不覆盖旧目录", async (t) => {
  const f = await homeFixture(t);
  const catalog = {
    schemaVersion: 1,
    host: "pi",
    source: "pi-runtime",
    models: [{ provider: "a", model: "m", name: "M" }],
  };
  const file = await f.json("catalog", catalog);
  await f.run("model-catalog-save", "--file", file);
  for (const value of [
    { ...catalog, apiKey: "not-real" },
    { ...catalog, models: [{ ...catalog.models[0], headers: {} }] },
    { ...catalog, models: [catalog.models[0], catalog.models[0]] },
    { ...catalog, host: "claude" },
  ]) {
    await f.json("catalog", value);
    await assert.rejects(f.run("model-catalog-save", "--file", file));
  }
  assert.equal((await f.run("model-candidates")).models.length, 1);
});

test("工作流保护手改和未托管文件", async (t) => {
  const f = await homeFixture(t);
  await saveAgent(f, "pi");
  await saveFlow(f);
  const output = await f.run("workflow-render", "--id", "study", "--apply");
  const path = join(f.root, output.path);
  await writeFile(path, "用户自己的流程");
  await assert.rejects(
    f.run("workflow-render", "--id", "study", "--apply", "--replace"),
    code("DRIFT"),
  );
  await rm(join(f.root, ".xlf-marketplace/generated/pi/workflows/study.json"));
  await assert.rejects(
    f.run("workflow-render", "--id", "study", "--apply", "--replace"),
    code("UNMANAGED"),
  );
  assert.equal(await readFile(path, "utf8"), "用户自己的流程");
});

test("用户配置目录覆盖与显式自定义 user root 不产生重复宿主层级", async (t) => {
  for (const host of ["pi", "claude"]) {
    const outer = await mkdtemp(join(tmpdir(), "agent-studio-override-"));
    t.after(() => rm(outer, { recursive: true, force: true }));
    const custom = join(outer, "custom");
    const key = host === "pi" ? "PI_CODING_AGENT_DIR" : "CLAUDE_CONFIG_DIR";
    const f = await homeFixture(t, host, { [key]: custom });
    assert.equal(f.root, custom);
    await saveAgent(f, host);
    const explicit = await execute(
      ["host", "--host", host, "--scope", "user", "--root", custom],
      f.env,
    );
    assert.equal(explicit.root, custom);
    assert.equal(explicit.scope, "user");
    await assert.rejects(
      readFile(join(custom, `.${host}/agents/reader.md`)),
      code("ENOENT"),
    );
  }
});

test("默认流程跟随会话，固定模型变更后需重新生成角色和流程", async (t) => {
  const f = await homeFixture(t);
  await saveAgent(f, "pi");
  await saveFlow(f);
  const initial = await f.run("workflow-render", "--id", "study", "--apply");
  const before = await readFile(join(f.root, initial.path), "utf8");
  assert.match(before, /继承当前会话默认模型（派发时省略模型覆盖）/);
  await f.run(
    "model-set",
    "--id",
    "study",
    "--provider",
    "router",
    "--model",
    "old-model",
  );
  const value = JSON.parse(
    await readFile(join(f.root, ".xlf-marketplace/agents/reader.json"), "utf8"),
  );
  value.model = "study";
  const file = await f.json("reader", value);
  await f.run("agent-save", "--file", file, "--replace");
  await f.run("agent-render", "--id", "reader", "--apply", "--replace");
  await assert.rejects(f.run("check"), code("DRIFT"));
  await f.run("workflow-render", "--id", "study", "--apply", "--replace");
  await f.run(
    "model-set",
    "--id",
    "study",
    "--provider",
    "router",
    "--model",
    "new-model",
    "--replace",
  );
  assert.match(
    await readFile(join(f.root, initial.path), "utf8"),
    /router\/old-model/,
  );
  await assert.rejects(f.run("check"), code("DRIFT"));
  await f.run("agent-render", "--id", "reader", "--apply", "--replace");
  await assert.rejects(f.run("check"), code("DRIFT"));
  await f.run("workflow-render", "--id", "study", "--apply", "--replace");
  assert.match(
    await readFile(join(f.root, initial.path), "utf8"),
    /router\/new-model/,
  );
  assert.equal((await f.run("check")).workflows[0], "study");
});
