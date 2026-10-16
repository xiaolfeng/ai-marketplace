import { readdir } from "node:fs/promises";
import {
  applyGenerated,
  compiledWorkflow,
  loadWorkflow,
  nativePath,
} from "./definitions.mjs";
import { digest } from "./store.mjs";

export async function inventory(workspace, host) {
  const directory = nativePath(workspace, host, "agents");
  const agents = (await workspace.exists(directory))
    ? (await readdir(await workspace.path(directory)))
        .filter((name) => name.endsWith(".md"))
        .sort()
    : [];
  return {
    host,
    scope: workspace.scope ?? "project",
    root: workspace.root,
    agents: await Promise.all(
      agents.map(async (name) => ({
        id: name.slice(0, -3),
        path: await workspace.path(`${directory}/${name}`),
      })),
    ),
  };
}

export async function renderWorkflow(workspace, host, name) {
  const workflow = await loadWorkflow(workspace, name);
  const agents = await compiledWorkflow(workspace, host, workflow);
  const content = [
    "---",
    `name: ${JSON.stringify(workflow.id)}`,
    `description: ${JSON.stringify(workflow.description)}`,
    "---",
    "",
    `# ${workflow.id}`,
    "",
    workflow.description,
    "",
    `运行宿主：${host}。使用宿主当前提供的子代理工具派发下列角色。`,
    "开始时确认本次材料所在目录与输出目录，不把技能安装目录当成任务目录。",
    "为本次调用创建独立的输出子目录，避免覆盖历史产物。",
    "project: 输入相对于本次材料目录；artifact: 输入来自本次调用的前序输出。",
    "按顺序执行，向子代理提供完整任务和输入；只读角色的返回结果由主代理保存。",
    "等待真实完成事件，检查输出与任务一致后再继续。失败或取消时停留在当前步骤。",
    "需要确认的步骤完成后等待用户实际确认，收到确认后再继续或交付最终结果。",
    "恢复时读取本次输出与已有完成证据，不能凭文件存在或占位内容跳过步骤。",
    "",
    "## 角色与模型",
    "",
    "派发前读取对应原生角色文件，核对加载的角色与下列绝对路径一致，避免项目同名角色覆盖。",
    "默认模型由派发时的会话继承；固定模型使用下面完整标识，不做静默替换。",
    "原生角色丢失、模型不匹配或宿主工具不支持相应路由时说明阻塞。",
    "",
  ];
  for (const agent of Object.values(agents)) {
    content.push(
      `- ${agent.id}：${JSON.stringify(await workspace.path(agent.path))}；模型：${agent.model.mode === "inherit" ? "继承当前会话默认模型（派发时省略模型覆盖）" : JSON.stringify(agent.model.native)}。`,
    );
  }
  for (const [index, step] of workflow.steps.entries()) {
    content.push(
      "",
      `## ${index + 1}. ${step.id}`,
      "",
      `角色：${step.agent}`,
      "",
      step.task,
      "",
      `输入：${JSON.stringify(step.inputs)}`,
      `输出：${JSON.stringify(step.outputs)}`,
      `完成后需要用户确认：${step.approval ? "是" : "否"}`,
      "",
    );
  }
  const rendered = content.join("\n");
  return {
    id: name,
    path: nativePath(workspace, host, `skills/${name}/SKILL.md`),
    content: rendered,
    digest: digest(rendered),
    invocation: host === "pi" ? `/skill:${name}` : `/${name}`,
    dependencies: Object.values(agents).map((agent) => agent.path),
  };
}

export async function applyWorkflow(workspace, host, name, replace) {
  const rendered = await renderWorkflow(workspace, host, name);
  await applyGenerated(workspace, host, "workflows", name, rendered, replace);
  return { ...rendered, content: undefined };
}
