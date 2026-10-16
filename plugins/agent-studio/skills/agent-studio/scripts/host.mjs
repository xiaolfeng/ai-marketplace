import { DATA, object, requireValue, version } from "./store.mjs";

const ADAPTERS = { claude: "claude-code", pi: "pi-subagent-v1" };

export async function detectHost(workspace, explicit, env = process.env) {
  const markedPi = env.AI_AGENT === "pi" || env.PI_CODING_AGENT === "true";
  const candidates = [];
  for (const host of Object.keys(ADAPTERS)) {
    if (await workspace.exists(`.${host}`)) candidates.push(host);
  }
  if (explicit !== undefined) {
    requireValue(
      Object.hasOwn(ADAPTERS, explicit),
      "HOST_UNSUPPORTED",
      "首版只支持 claude 与 pi",
    );
    requireValue(
      !(markedPi && explicit !== "pi"),
      "HOST_CONFLICT",
      "显式宿主与当前 Pi 运行标记冲突",
    );
    return { host: explicit, evidence: "explicit", candidates };
  }
  return {
    host: markedPi ? "pi" : null,
    evidence: markedPi ? "pi-process-marker" : "unknown",
    candidates,
  };
}

export function requireHost(detection) {
  requireValue(
    detection.host !== null,
    "HOST_REQUIRED",
    "无法确认当前宿主；目录只作提示，请根据实际工具传入 --host claude|pi",
  );
  return detection.host;
}

export async function config(workspace) {
  const value = await workspace.json(`${DATA}/config.json`);
  object(value, ["schemaVersion", "hosts"], "config");
  version(value);
  object(value.hosts, Object.keys(ADAPTERS), "hosts");
  for (const [host, setting] of Object.entries(value.hosts)) {
    object(setting, ["adapter"], host);
    requireValue(
      setting.adapter === ADAPTERS[host],
      "ADAPTER",
      "宿主适配器不匹配",
    );
  }
  return value;
}

export async function requireInitialized(workspace, host) {
  const value = await config(workspace);
  requireValue(
    Object.hasOwn(value.hosts, host),
    "INIT_REQUIRED",
    `请先初始化 ${host} 适配器`,
  );
  return value;
}

export async function initialize(workspace, host, adapter) {
  const chosen = adapter ?? (host === "claude" ? "claude-code" : undefined);
  requireValue(
    chosen === ADAPTERS[host],
    "ADAPTER_REQUIRED",
    "Pi 需确认支持用户级 Markdown 子代理后传入 --adapter pi-subagent-v1",
  );
  const file = `${DATA}/config.json`;
  const value = (await workspace.exists(file))
    ? await config(workspace)
    : { schemaVersion: 1, hosts: {} };
  value.hosts[host] = { adapter: chosen };
  await workspace.writeJSON(file, value);
  const registry = `${DATA}/models/registry.json`;
  if (!(await workspace.exists(registry)))
    await workspace.writeJSON(registry, { schemaVersion: 1, profiles: {} });
  return { host, adapter: chosen, root: workspace.root, models: registry };
}
