import { DATA, id, object, requireValue, text, version } from "./store.mjs";

const FILE = `${DATA}/models/registry.json`;

export function validateTarget(host, value) {
  object(value, host === "pi" ? ["provider", "model"] : ["model"], "模型映射");
  text(value.model, "model");
  requireValue(
    !/[\s\x00-\x1f\x7f]/.test(value.model),
    "MODEL",
    "模型标识不能含空白或控制字符",
  );
  requireValue(
    value.model !== "inherit",
    "MODEL",
    "请登记显式模型，不使用 inherit 隐式继承",
  );
  if (host === "pi") {
    requireValue(
      typeof value.provider === "string" &&
        /^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(value.provider),
      "PROVIDER",
      "Pi 必须登记准确的 provider，不能推测或省略",
    );
  }
}

export async function registry(workspace) {
  const value = await workspace.json(FILE);
  object(value, ["schemaVersion", "profiles"], "models");
  version(value);
  object(value.profiles, Object.keys(value.profiles ?? {}), "profiles");
  for (const [profile, targets] of Object.entries(value.profiles)) {
    id(profile);
    object(targets, ["claude", "pi"], "profile");
    for (const [host, target] of Object.entries(targets))
      validateTarget(host, target);
  }
  return value;
}

export function resolveModel(value, host, profile) {
  if (profile === null)
    return {
      profile: null,
      host,
      mode: "inherit",
      native: null,
      availability: "not-verified",
    };
  id(profile);
  requireValue(
    Object.hasOwn(value.profiles, profile),
    "MODEL_UNKNOWN",
    `模型 profile 未登记：${profile}`,
  );
  const target = value.profiles[profile][host];
  requireValue(
    target !== undefined,
    "MODEL_HOST_MISSING",
    `${profile} 未登记 ${host} 映射`,
  );
  validateTarget(host, target);
  return {
    profile,
    host,
    mode: "fixed",
    ...target,
    native: host === "pi" ? `${target.provider}/${target.model}` : target.model,
    availability: "not-verified",
  };
}

export async function setModel(workspace, host, options) {
  id(options.id);
  const target = {
    ...(options.provider !== undefined ? { provider: options.provider } : {}),
    model: options.model,
  };
  validateTarget(host, target);
  const value = await registry(workspace);
  const targets = Object.hasOwn(value.profiles, options.id)
    ? value.profiles[options.id]
    : {};
  if (
    targets[host] !== undefined &&
    JSON.stringify(targets[host]) !== JSON.stringify(target)
  ) {
    requireValue(
      options.replace,
      "EXISTS",
      "模型映射已存在；确认更新后使用 --replace",
    );
  }
  targets[host] = target;
  value.profiles[options.id] = targets;
  await workspace.writeJSON(FILE, value);
  return resolveModel(value, host, options.id);
}
