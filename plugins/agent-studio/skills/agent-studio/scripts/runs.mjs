import { randomUUID } from "node:crypto";
import {
  DATA,
  digest,
  id,
  object,
  relativePath,
  requireValue,
  text,
  version,
} from "./store.mjs";
import {
  compiledWorkflow,
  loadWorkflow,
  parseInput,
  validateWorkflow,
} from "./definitions.mjs";

function runRoot(run) {
  id(run);
  requireValue(/^run-[a-f0-9-]+$/.test(run), "RUN", "运行 ID 格式不正确");
  return `${DATA}/runs/${run}`;
}

export async function startRun(workspace, host, name) {
  const workflow = await loadWorkflow(workspace, name);
  const agents = await compiledWorkflow(workspace, host, workflow);
  const inputFiles = new Map();
  for (const step of workflow.steps) {
    for (const input of step.inputs) {
      const reference = parseInput(input);
      if (reference.kind === "project" && !inputFiles.has(input))
        inputFiles.set(input, await workspace.bytes(reference.path));
    }
  }
  const run = `run-${randomUUID()}`;
  const root = runRoot(run);
  const inputs = {};
  for (const [reference, content] of inputFiles) {
    const path = `inputs/${Object.keys(inputs).length}`;
    await workspace.write(`${root}/${path}`, content);
    inputs[reference] = { path, digest: digest(content) };
  }
  const state = {
    schemaVersion: 1,
    id: run,
    host,
    workflow,
    agents,
    inputs,
    index: 0,
    completed: [],
  };
  await workspace.writeJSON(`${root}/state.json`, state);
  return {
    run,
    host,
    workflow: workflow.id,
    steps: workflow.steps.length,
    status: "pending",
  };
}

async function loadState(workspace, host, run) {
  const root = runRoot(run);
  const state = await workspace.json(`${root}/state.json`);
  object(
    state,
    [
      "schemaVersion",
      "id",
      "host",
      "workflow",
      "agents",
      "inputs",
      "index",
      "completed",
    ],
    "run",
  );
  version(state);
  requireValue(
    state.id === run && state.host === host,
    "RUN_HOST",
    "运行 ID 或宿主与当前请求不符",
  );
  validateWorkflow(state.workflow);
  requireValue(
    Number.isInteger(state.index) &&
      state.index >= 0 &&
      state.index <= state.workflow.steps.length,
    "RUN_STATE",
    "非法步骤索引",
  );
  requireValue(
    Array.isArray(state.completed) && state.completed.length === state.index,
    "RUN_STATE",
    "完成记录与步骤索引不一致",
  );
  const names = [...new Set(state.workflow.steps.map((step) => step.agent))];
  object(state.agents, names, "agents snapshot");
  for (const name of names) {
    const agent = state.agents[name];
    object(
      agent,
      ["id", "path", "content", "digest", "model"],
      "agent snapshot",
    );
    requireValue(
      agent.id === name && agent.path === `.${host}/agents/${name}.md`,
      "RUN_STATE",
      "代理快照路径不匹配",
    );
    text(agent.content, "代理快照内容");
    requireValue(
      digest(agent.content) === agent.digest,
      "RUN_STATE",
      "代理快照摘要不匹配",
    );
  }
  const references = [
    ...new Set(
      state.workflow.steps
        .flatMap((step) => step.inputs)
        .filter((input) => parseInput(input).kind === "project"),
    ),
  ];
  object(state.inputs, references, "input snapshots");
  for (const [index, reference] of references.entries()) {
    const snapshot = state.inputs[reference];
    object(snapshot, ["path", "digest"], "input snapshot");
    requireValue(
      snapshot.path === `inputs/${index}`,
      "RUN_STATE",
      "输入快照路径不匹配",
    );
    requireValue(
      digest(await workspace.bytes(`${root}/${snapshot.path}`)) ===
        snapshot.digest,
      "DRIFT",
      "输入快照已被修改",
    );
  }
  for (let index = 0; index < state.completed.length; index += 1) {
    const record = state.completed[index];
    const step = state.workflow.steps[index];
    object(record, ["step", "outputs", "approval"], "completion");
    requireValue(record.step === step.id, "RUN_STATE", "完成记录顺序不匹配");
    if (step.approval) text(record.approval, "人工确认记录");
    object(record.outputs, step.outputs, "completed outputs");
    for (const output of step.outputs) {
      requireValue(
        Object.hasOwn(record.outputs, output) &&
          digest(await workspace.bytes(`${root}/artifacts/${output}`)) ===
            record.outputs[output],
        "DRIFT",
        "已完成的工件发生变化，不能继续当前运行",
      );
    }
  }
  const current = state.workflow.steps[state.index];
  if (current) {
    const agent = state.agents[current.agent];
    requireValue(
      digest(await workspace.bytes(agent.path)) === agent.digest,
      "DRIFT",
      "当前步骤的宿主 Agent 与运行快照不同",
    );
  }
  return { root, state, current };
}

export async function nextStep(workspace, host, run) {
  const { root, state, current } = await loadState(workspace, host, run);
  if (!current)
    return { run, status: "completed", completed: state.completed.length };
  const inputs = [];
  for (const input of current.inputs) {
    const reference = parseInput(input);
    const path =
      reference.kind === "project"
        ? state.inputs[input].path
        : `artifacts/${reference.path}`;
    inputs.push({
      reference: input,
      path: await workspace.path(`${root}/${path}`),
    });
  }
  const outputs = [];
  for (const output of current.outputs)
    outputs.push(await workspace.path(`${root}/artifacts/${output}`));
  const agent = state.agents[current.agent];
  return {
    run,
    status: "pending",
    step: current.id,
    agent: agent.id,
    agentPath: await workspace.path(agent.path),
    model: agent.model,
    task: current.task,
    inputs,
    outputs,
    approvalRequired: current.approval,
  };
}

export async function completeStep(workspace, host, run, stepId, approval) {
  const { root, state, current } = await loadState(workspace, host, run);
  requireValue(
    current !== undefined && current.id === stepId,
    "STEP_ORDER",
    "只能验收当前步骤，不能重复验收或跳步",
  );
  if (current.approval) text(approval, "实际用户确认说明（--approval）");
  else
    requireValue(
      approval === undefined,
      "APPROVAL",
      "当前步骤未声明人工确认，不接收 --approval",
    );
  const outputs = Object.create(null);
  for (const output of current.outputs) {
    relativePath(output);
    const content = await workspace.bytes(`${root}/artifacts/${output}`);
    requireValue(content.length > 0, "OUTPUT_EMPTY", "输出工件不能为空");
    outputs[output] = digest(content);
  }
  state.completed.push({
    step: current.id,
    outputs,
    ...(current.approval ? { approval } : {}),
  });
  state.index += 1;
  await workspace.writeJSON(`${root}/state.json`, state);
  return {
    run,
    completedStep: current.id,
    status:
      state.index === state.workflow.steps.length ? "completed" : "pending",
    completed: state.index,
  };
}
