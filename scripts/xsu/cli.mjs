import fs from "node:fs";
import path from "node:path";
import { compileFile, writeHtmlAtomic, COMPILER_VERSION } from "./compiler.mjs";
import { XsuError } from "./contracts.mjs";

const HELP = `XSU ${COMPILER_VERSION}\nUsage: node xsu.mjs <command> [source] [options]\n\nCommands: validate, render, components, migrate-replay\nOptions:\n  --out <file>                 Output path (render/migrate-replay)\n  --check                      Compare render output, do not write\n  --force                      Explicitly replace a non-owned output\n  --network offline|connected  Default offline; Pele requires connected\n  --nav <report-nav.json>      Compile an editorial collection snapshot\n  --preset <name>              Confirm this skill's preset\n  --warnings-as-errors         Reject quality warnings\n  --diagnostics-json <new-file> Write structured diagnostics; never overwrite\n`;

export function runCli(args, assets, adapter) {
  let diagnosticFile;
  const options = {};
  let entry;
  let command;
  try {
    if (!args.length || args.includes("--help") || args.includes("-h")) {
      console.log(HELP);
      return 0;
    }
    if (args.length === 1 && args[0] === "--version") {
      console.log(COMPILER_VERSION);
      return 0;
    }
    [command] = args;
    if (
      !["validate", "render", "components", "migrate-replay"].includes(command)
    )
      throw new XsuError("XSU_CLI", "Unknown command");
    const seen = new Set();
    for (let i = 1; i < args.length; i++) {
      const arg = args[i];
      if (arg.startsWith("--")) {
        if (seen.has(arg))
          throw new XsuError("XSU_CLI", `Repeated option: ${arg}`);
        seen.add(arg);
        if (["--check", "--force", "--warnings-as-errors"].includes(arg)) {
          options[
            arg === "--warnings-as-errors" ? "warningsAsErrors" : arg.slice(2)
          ] = true;
        } else if (
          [
            "--out",
            "--network",
            "--nav",
            "--preset",
            "--diagnostics-json",
          ].includes(arg)
        ) {
          const value = args[++i];
          if (!value || value.startsWith("--"))
            throw new XsuError("XSU_CLI", `Missing value for ${arg}`);
          if (arg === "--diagnostics-json")
            diagnosticFile = path.resolve(value);
          else options[arg.slice(2)] = value;
        } else throw new XsuError("XSU_CLI", `Unknown option: ${arg}`);
      } else if (entry)
        throw new XsuError("XSU_CLI", "Only one source file is accepted");
      else entry = arg;
    }
    if (options.preset && options.preset !== assets.preset)
      throw new XsuError(
        "XSU_CLI",
        `This skill supports ${assets.preset} only`,
      );
    if (
      diagnosticFile &&
      [entry, options.out, options.nav]
        .filter(Boolean)
        .some((value) => path.resolve(value) === diagnosticFile)
    )
      throw new XsuError(
        "XSU_OUTPUT",
        "Diagnostics cannot overwrite source, output or navigation",
      );
    if (diagnosticFile && fs.existsSync(diagnosticFile))
      throw new XsuError(
        "XSU_OUTPUT",
        "Diagnostics path already exists; choose a new file",
      );
    if (diagnosticFile && !["validate", "render"].includes(command))
      throw new XsuError(
        "XSU_CLI",
        "Diagnostics are supported only by validate and render",
      );
    if (command === "components") {
      if (entry || Object.keys(options).some((key) => key !== "preset"))
        throw new XsuError("XSU_CLI", "components accepts only --preset");
      console.log(
        JSON.stringify(
          { preset: assets.preset, components: adapter.components },
          null,
          2,
        ),
      );
      return 0;
    }
    if (!entry) throw new XsuError("XSU_CLI", "Source file is required");
    if (
      (options.check && command !== "render") ||
      (options.force && command === "validate") ||
      (options.check && options.force)
    )
      throw new XsuError("XSU_CLI", "Invalid check/force combination");
    if (["render", "migrate-replay"].includes(command) && !options.out)
      throw new XsuError("XSU_CLI", "--out is required");
    if (command === "migrate-replay") {
      if (
        !adapter.migrate ||
        options.nav ||
        options.network ||
        options.warningsAsErrors
      )
        throw new XsuError(
          "XSU_CLI",
          "Migration accepts only a Replay JSON source and --out/--force",
        );
      if (fs.statSync(entry).size > 2 * 1024 * 1024)
        throw new XsuError("XSU_LIMIT", "Legacy JSON exceeds 2 MiB");
      const source = adapter.migrate(
        JSON.parse(fs.readFileSync(entry, "utf8")),
        assets.preset,
      );
      writeHtmlAtomic(options.out, source, {
        inputs: [fs.realpathSync(entry)],
        force: options.force,
      });
      console.log(`Migrated: ${options.out}`);
      return 0;
    }
    const result = compileFile(entry, assets, adapter, options);
    if (
      diagnosticFile &&
      result.inputs.some((value) => path.resolve(value) === diagnosticFile)
    )
      throw new XsuError(
        "XSU_OUTPUT",
        "Diagnostics cannot overwrite an input resource",
      );
    if (command === "render") {
      if (options.check) {
        if (
          !fs.existsSync(options.out) ||
          fs.readFileSync(options.out, "utf8") !== result.html
        )
          throw new XsuError(
            "XSU_DRIFT",
            "Output is missing or differs; render it again",
          );
      } else
        writeHtmlAtomic(options.out, result.html, {
          ...options,
          inputs: result.inputs,
          marker: result.marker,
        });
    }
    if (diagnosticFile)
      fs.writeFileSync(
        diagnosticFile,
        JSON.stringify(result.warnings, null, 2),
        { flag: "wx" },
      );
    for (const warning of result.warnings)
      console.warn(`${warning.code || "XSU_WARNING"}: ${warning.message}`);
    console.log(
      `${command === "validate" ? "Valid" : options.check ? "Unchanged" : "Rendered"}: ${entry}`,
    );
    return 0;
  } catch (error) {
    const diagnostic =
      error instanceof XsuError
        ? error.diagnostic
        : {
            code:
              error instanceof SyntaxError
                ? "XSU_JSON"
                : error?.code &&
                    /^(?:ENOENT|EACCES|EEXIST|ENOTDIR|EISDIR)$/.test(error.code)
                  ? "XSU_IO"
                  : "XSU_INTERNAL",
            severity: "error",
            message: error.message,
          };
    console.error(
      `${diagnostic.file || entry || "xsu"}:${diagnostic.line || 1}:${diagnostic.column || 1} ${diagnostic.code}: ${diagnostic.message}`,
    );
    if (
      diagnosticFile &&
      !fs.existsSync(diagnosticFile) &&
      ![entry, options.out, options.nav]
        .filter(Boolean)
        .some((value) => path.resolve(value) === diagnosticFile)
    ) {
      try {
        fs.writeFileSync(
          diagnosticFile,
          JSON.stringify([diagnostic], null, 2),
          { flag: "wx" },
        );
      } catch (writeError) {
        console.error(`Diagnostics not written: ${writeError.message}`);
      }
    }
    if (diagnostic.code === "XSU_DRIFT") return 4;
    if (["XSU_CLI", "XSU_IO"].includes(diagnostic.code)) return 1;
    if (diagnostic.code === "XSU_INTERNAL") return 3;
    return 2;
  }
}
