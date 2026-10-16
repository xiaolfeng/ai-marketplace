import { DATA, object, requireValue, text, version } from "./store.mjs";
import { validateTarget } from "./models.mjs";

const file = (host) => `${DATA}/models/catalog-${host}.json`;

function validateCatalog(value, host) {
  object(value, ["schemaVersion", "host", "source", "models"], "catalog");
  version(value);
  requireValue(
    value.host === host,
    "MODEL_HOST_MISSING",
    "模型目录不属于当前宿主",
  );
  text(value.source, "source");
  requireValue(Array.isArray(value.models), "SCHEMA", "models 必须是数组");
  const seen = new Set();
  for (const model of value.models) {
    object(model, ["provider", "model", "name"], "catalog model");
    validateTarget(host, {
      ...(model.provider === undefined ? {} : { provider: model.provider }),
      model: model.model,
    });
    text(model.name, "name");
    const key = JSON.stringify([model.provider, model.model]);
    requireValue(!seen.has(key), "MODEL", "模型目录存在重复项");
    seen.add(key);
  }
  return value;
}

export async function saveCatalog(workspace, host, value) {
  validateCatalog(value, host);
  await workspace.writeJSON(file(host), value);
  return { host, count: value.models.length, source: value.source };
}

export async function candidates(workspace, host, options) {
  if (!(await workspace.exists(file(host))))
    return { host, source: null, models: [], refreshRequired: true };
  const catalog = validateCatalog(await workspace.json(file(host)), host);
  const terms = (options.query ?? "")
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);
  const models = catalog.models
    .filter((model) => {
      const label =
        `${model.provider ?? ""} ${model.model} ${model.name}`.toLowerCase();
      return (
        (!options.provider || model.provider === options.provider) &&
        terms.every((term) => label.includes(term))
      );
    })
    .map((model) => ({
      ...model,
      native: host === "pi" ? `${model.provider}/${model.model}` : model.model,
    }));
  return {
    host,
    source: catalog.source,
    models,
    total: catalog.models.length,
    availability: "not-verified",
    refreshRequired: false,
  };
}
