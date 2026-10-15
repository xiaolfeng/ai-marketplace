import { readdir } from "node:fs/promises";
import {
  DATA,
  digest,
  id,
  object,
  relativePath,
  requireValue,
  saveDefinition,
  text,
  version,
} from "./store.mjs";
import { registry, resolveModel } from "./models.mjs";

const TOOLS = {
  claude: {
    read: ["Read"],
    search: ["Grep", "Glob"],
    edit: ["Edit", "Write"],
    shell: ["Bash"],
  },
  pi: {
    read: ["read"],
    search: ["grep", "find"],
    edit: ["edit", "write"],
    shell: ["bash"],
  },
};

function stringList(value, label, nonempty = false) {
  requireValue(
    Array.isArray(value) && (!nonempty || value.length > 0),
    "SCHEMA",
    `${label} 必须是${nonempty ? "非空" : ""}数组`,
  );
  for (const item of value) text(item, label);
  requireValue(
    new Set(value).size === value.length,
    "SCHEMA",
    `${label} 不能重复`,
  );
}

export function validateAgent(value) {
  object(
    value,
    [
      "schemaVersion",
      "id",
      "description",
      "model",
      "access",
      "capabilities",
      "instructions",
    ],
    "agent",
  );
  version(value);
  id(value.id);
  id(value.model);
  text(value.description, "description");
  requireValue(
    value.description.length <= 1024,
    "SCHEMA",
    "description 最多 1024 字符",
  );
  text(value.instructions, "instructions");
  requireValue(
    ["read-only", "workspace-write"].includes(value.access),
    "SCHEMA",
    "access 必须是 read-only 或 workspace-write",
  );
  stringList(value.capabilities, "capabilities", true);
  for (const capability of value.capabilities) {
    requireValue(
      Object.hasOwn(TOOLS.pi, capability),
      "CAPABILITY",
      `未知工具能力 ${capability}`,
    );
    requireValue(
      value.access !== "read-only" || ["read", "search"].includes(capability),
      "CAPABILITY",
      "read-only 不能启用 edit 或 shell",
    );
  }
  return value;
}

export async function loadAgent(workspace, name) {
  const value = validateAgent(
    await workspace.json(`${DATA}/agents/${id(name)}.json`),
  );
  requireValue(value.id === name, "ID", "Agent 文件名与 id 不一致");
  return value;
}

export async function renderAgent(workspace, host, name, models = undefined) {
  const agent = await loadAgent(workspace, name);
  const model = resolveModel(
    models ?? (await registry(workspace)),
    host,
    agent.model,
  );
  const tools = agent.capabilities.flatMap(
    (capability) => TOOLS[host][capability],
  );
  const content = [
    "---",
    `name: ${JSON.stringify(agent.id)}`,
    `description: ${JSON.stringify(agent.description)}`,
    `tools: ${tools.join(", ")}`,
    `model: ${JSON.stringify(model.native)}`,
    "---",
    "",
    agent.instructions.trim(),
    "",
  ].join("\n");
  return {
    id: name,
    path: `.${host}/agents/${name}.md`,
    content,
    digest: digest(content),
    model,
  };
}

export async function applyAgent(workspace, host, name, replace) {
  const rendered = await renderAgent(workspace, host, name);
  const recordPath = `${DATA}/generated/${host}/${name}.json`;
  if (await workspace.exists(rendered.path)) {
    const current = digest(await workspace.bytes(rendered.path));
    if (current !== rendered.digest) {
      requireValue(
        await workspace.exists(recordPath),
        "UNMANAGED",
        "目标已有不同内容且不由本插件管理；不会覆盖",
      );
      const record = await workspace.json(recordPath);
      object(record, ["schemaVersion", "path", "digest"], "generated");
      version(record);
      requireValue(
        record.path === rendered.path && current === record.digest,
        "DRIFT",
        "生成文件已被手动修改；请先处理差异",
      );
      requireValue(replace, "EXISTS", "更新已生成的 Agent 需要 --replace");
    }
  }
  await workspace.write(rendered.path, rendered.content);
  await workspace.writeJSON(recordPath, {
    schemaVersion: 1,
    path: rendered.path,
    digest: rendered.digest,
  });
  return {
    path: rendered.path,
    digest: rendered.digest,
    model: rendered.model,
  };
}

export async function saveAgent(workspace, value, replace) {
  validateAgent(value);
  const models = await registry(workspace);
  requireValue(
    Object.hasOwn(models.profiles, value.model),
    "MODEL_UNKNOWN",
    "请先登记 Agent 使用的 model profile",
  );
  return saveDefinition(
    workspace,
    `${DATA}/agents/${value.id}.json`,
    value,
    replace,
  );
}

export function parseInput(input) {
  text(input, "input");
  const separator = input.indexOf(":");
  const kind = input.slice(0, separator);
  requireValue(
    ["project", "artifact"].includes(kind),
    "INPUT",
    "输入需以 project: 或 artifact: 开头",
  );
  const path = relativePath(input.slice(separator + 1));
  return { kind, path };
}

export function validateWorkflow(value) {
  object(value, ["schemaVersion", "id", "description", "steps"], "workflow");
  version(value);
  id(value.id);
  text(value.description, "description");
  requireValue(
    Array.isArray(value.steps) && value.steps.length > 0,
    "SCHEMA",
    "steps 必须是非空数组",
  );
  const steps = new Set();
  const produced = new Set();
  // Keep exact spellings for input references, but reject portable filesystem aliases.
  const outputKeys = new Set();
  for (const step of value.steps) {
    object(
      step,
      ["id", "agent", "task", "inputs", "outputs", "approval"],
      "step",
    );
    id(step.id);
    id(step.agent);
    requireValue(!steps.has(step.id), "STEP", "步骤 ID 不能重复");
    steps.add(step.id);
    text(step.task, "task");
    stringList(step.inputs, "inputs");
    stringList(step.outputs, "outputs", true);
    requireValue(
      typeof step.approval === "boolean",
      "SCHEMA",
      "approval 必须是布尔值",
    );
    for (const input of step.inputs) {
      const reference = parseInput(input);
      requireValue(
        reference.kind !== "artifact" || produced.has(reference.path),
        "INPUT",
        "工件输入必须由更早的步骤声明产出",
      );
    }
    for (const output of step.outputs) {
      relativePath(output);
      const key = output.normalize("NFD").toLowerCase();
      requireValue(
        ![...outputKeys].some(
          (path) =>
            path === key ||
            path.startsWith(`${key}/`) ||
            key.startsWith(`${path}/`),
        ),
        "OUTPUT",
        "输出文件不能重名（含大小写/Unicode 规范化别名），也不能互相占用父目录",
      );
      outputKeys.add(key);
      produced.add(output);
    }
  }
  return value;
}

export async function loadWorkflow(workspace, name) {
  const value = validateWorkflow(
    await workspace.json(`${DATA}/workflows/${id(name)}.json`),
  );
  requireValue(value.id === name, "ID", "Workflow 文件名与 id 不一致");
  return value;
}

export async function saveWorkflow(workspace, value, replace) {
  validateWorkflow(value);
  for (const step of value.steps) await loadAgent(workspace, step.agent);
  return saveDefinition(
    workspace,
    `${DATA}/workflows/${value.id}.json`,
    value,
    replace,
  );
}

export async function compiledWorkflow(workspace, host, workflow) {
  const models = await registry(workspace);
  const agents = {};
  for (const step of workflow.steps) {
    if (!Object.hasOwn(agents, step.agent)) {
      const rendered = await renderAgent(workspace, host, step.agent, models);
      requireValue(
        await workspace.exists(rendered.path),
        "AGENT_NOT_RENDERED",
        `请先 agent-render --id ${step.agent} --apply`,
      );
      requireValue(
        digest(await workspace.bytes(rendered.path)) === rendered.digest,
        "DRIFT",
        `原生 Agent 与当前定义不同：${step.agent}`,
      );
      agents[step.agent] = rendered;
    }
  }
  return agents;
}

async function definitionIds(workspace, topic) {
  const directory = `${DATA}/${topic}`;
  if (!(await workspace.exists(directory))) return [];
  const files = await readdir(await workspace.path(directory));
  return files
    .filter((file) => file.endsWith(".json"))
    .sort()
    .map((file) => id(file.slice(0, -5)));
}

export async function check(workspace, host) {
  const models = await registry(workspace);
  const agents = await definitionIds(workspace, "agents");
  const workflows = await definitionIds(workspace, "workflows");
  for (const agent of agents) {
    const rendered = await renderAgent(workspace, host, agent, models);
    requireValue(
      (await workspace.exists(rendered.path)) &&
        digest(await workspace.bytes(rendered.path)) === rendered.digest,
      "DRIFT",
      `Agent 未生成或已过期：${agent}`,
    );
  }
  for (const name of workflows)
    await compiledWorkflow(
      workspace,
      host,
      await loadWorkflow(workspace, name),
    );
  return {
    host,
    agents,
    workflows,
    modelProfiles: Object.keys(models.profiles),
    availability: "not-verified",
  };
}
