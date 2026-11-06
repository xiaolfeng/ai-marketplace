import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";
import { spawn, execFileSync } from "node:child_process";
import { createServer } from "node:http";
import assert from "node:assert/strict";
import { PRESETS } from "./build.mjs";
import { compileFile } from "./compiler.mjs";
import {
  validateEditorial,
  renderEditorial,
  EDITORIAL_COMPONENTS,
} from "./editorial.mjs";
import { validateReplay, lowerReplay, REPLAY_COMPONENTS } from "./replay.mjs";

// Development-only real-browser checks. The distributed renderer still supports Node 18.
if (typeof WebSocket !== "function")
  throw new Error("Browser smoke requires Node 22+ with WebSocket");
const ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const destination = path.resolve(
  process.argv[2] || process.env.BB_THREAD_STORAGE || os.tmpdir(),
  "xsu-browser",
);
fs.mkdirSync(destination, { recursive: true });
const profile = fs.mkdtempSync(path.join(os.tmpdir(), "xsu-chrome-"));
const chrome =
  process.env.CHROME_PATH ||
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const log = fs.openSync(path.join(destination, "chrome.log"), "w");
const processChrome = spawn(
  chrome,
  [
    "--headless=new",
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-background-networking",
    "--disable-gpu",
    "--disable-lcd-text",
    "--font-render-hinting=none",
    "--force-color-profile=srgb",
    "--disable-component-update",
    "--disable-sync",
    "--remote-debugging-port=0",
    `--user-data-dir=${profile}`,
    "about:blank",
  ],
  { stdio: ["ignore", log, log] },
);
let chromeError;
processChrome.on("error", (error) => {
  chromeError = error;
});
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const results = [];
let server;
let cdp;
class Connection {
  constructor(socket) {
    this.socket = socket;
    this.next = 0;
    this.pending = new Map();
    this.events = [];
    socket.addEventListener("message", (event) => {
      const message = JSON.parse(event.data);
      if (message.id) {
        const entry = this.pending.get(message.id);
        if (!entry) return;
        clearTimeout(entry.timer);
        this.pending.delete(message.id);
        message.error
          ? entry.reject(new Error(JSON.stringify(message.error)))
          : entry.resolve(message.result);
      } else this.events.push(message);
    });
  }
  call(method, params = {}) {
    const id = ++this.next;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`CDP timeout: ${method}`));
      }, 15000);
      this.pending.set(id, { resolve, reject, timer });
      this.socket.send(JSON.stringify({ id, method, params }));
    });
  }
  async evaluate(expression) {
    const result = await this.call("Runtime.evaluate", {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    if (result.exceptionDetails)
      throw new Error(JSON.stringify(result.exceptionDetails));
    return result.result.value;
  }
}
const check = async (name, fn) => {
  try {
    await fn();
    results.push({ name, status: "passed" });
  } catch (error) {
    results.push({
      name,
      status: "failed",
      message: error.stack || String(error),
    });
  } finally {
    if (cdp) await cdp.call("Emulation.setEmulatedMedia", { media: "" });
  }
};
try {
  let port;
  for (let retry = 0; retry < 100; retry++) {
    const active = path.join(profile, "DevToolsActivePort");
    if (fs.existsSync(active)) {
      port = Number(fs.readFileSync(active, "utf8").split("\n")[0]);
      break;
    }
    if (chromeError) throw chromeError;
    if (processChrome.exitCode !== null)
      throw new Error(
        `Chrome exited ${processChrome.exitCode}; see chrome.log`,
      );
    await wait(100);
  }
  assert.ok(port, "Chrome DevTools did not start");
  const tabs = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  const socket = new WebSocket(
    tabs.find((tab) => tab.type === "page").webSocketDebuggerUrl,
  );
  await new Promise((resolve, reject) => {
    socket.addEventListener("open", resolve, { once: true });
    socket.addEventListener("error", reject, { once: true });
  });
  cdp = new Connection(socket);
  await cdp.call("Page.enable");
  await cdp.call("Runtime.enable");
  await cdp.call("Network.enable");
  await cdp.call("Page.addScriptToEvaluateOnNewDocument", {source: '(() => { const theme = new URL(location.href).searchParams.get("xsu-smoke-theme"); if (!["light", "dark"].includes(theme)) return; for (const key of ["html-report-theme", "replay-self:theme", "replay-post:theme"]) localStorage.setItem(key, theme); })();'});
  await cdp.call("Page.setDownloadBehavior", {
    behavior: "allow",
    downloadPath: destination,
  });
  const adapters = {
    editorial: {
      validate: validateEditorial,
      render: renderEditorial,
      components: EDITORIAL_COMPONENTS,
    },
    replay: {
      validate: validateReplay,
      render: lowerReplay,
      components: REPLAY_COMPONENTS,
    },
  };
  for (const [preset, skill] of Object.entries(PRESETS)) {
    const template = fs.readFileSync(
      path.join(ROOT, skill, "references/template.html"),
      "utf8",
    );
    const input = path.join(ROOT, "scripts/xsu/fixtures", `${preset}.xsu`);
    const html = compileFile(
      input,
      { preset, template },
      preset === "editorial" ? adapters.editorial : adapters.replay,
    ).html;
    fs.writeFileSync(path.join(destination, `${preset}.html`), html);
  }
  server = createServer((req, res) => {
    const name = path.basename(new URL(req.url, "http://localhost").pathname);
    const file = path.join(destination, name);
    if (!fs.existsSync(file)) {
      res.writeHead(404);
      res.end();
      return;
    }
    res.setHeader(
      "Content-Type",
      name.endsWith(".html")
        ? "text/html; charset=utf-8"
        : "application/octet-stream",
    );
    fs.createReadStream(file).pipe(res);
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const httpRoot = `http://127.0.0.1:${server.address().port}`;
  const navigate = async (url) => {
    cdp.events = [];
    await cdp.call("Page.navigate", { url });
    for (let retry = 0; retry < 100; retry++) {
      if (await cdp.evaluate('document.readyState === "complete"')) break;
      await wait(30);
    }
    await wait(120);
  };
  for (const preset of Object.keys(PRESETS)) {
    for (const protocol of ["file", "http"]) {
      await check(
        `${preset}: ${protocol} loads with no runtime exceptions or external requests`,
        async () => {
          const url =
            protocol === "file"
              ? pathToFileURL(path.join(destination, `${preset}.html`)).href
              : `${httpRoot}/${preset}.html`;
          await navigate(url);
          assert.ok(
            await cdp.evaluate(
              preset === "editorial"
                ? "document.querySelector('main').innerText.length > 30"
                : "document.querySelector('#stage').innerText.length > 30",
            ),
          );
          assert.deepEqual(
            cdp.events
              .filter((e) => e.method === "Runtime.exceptionThrown")
              .map((e) => e.params.exceptionDetails),
            [],
          );
          const external = cdp.events.filter(
            (e) =>
              e.method === "Network.requestWillBeSent" &&
              /^https?:/.test(e.params.request.url) &&
              !e.params.request.url.startsWith(httpRoot),
          );
          assert.deepEqual(
            external.map((e) => e.params.request.url),
            [],
          );
        },
      );
    }
    for (const [label, width, height, theme] of [
      ["desktop-light", 1280, 900, "light"],
      ["desktop-dark", 1280, 900, "dark"],
      ["mobile", 390, 844, "light"],
    ]) {
      await check(
        `${preset}: ${label} renders without viewport overflow`,
        async () => {
          await cdp.call("Emulation.setDeviceMetricsOverride", {
            width,
            height,
            deviceScaleFactor: 1,
            mobile: width < 500,
          });
          await cdp.evaluate(
            `document.documentElement.setAttribute("data-theme",${JSON.stringify(theme)})`,
          );
          const dimensions = await cdp.evaluate(
            "({viewport:innerWidth,width:document.documentElement.scrollWidth})",
          );
          assert.ok(
            dimensions.width <= dimensions.viewport + 1,
            JSON.stringify(dimensions),
          );
          const shot = await cdp.call("Page.captureScreenshot", {
            format: "png",
            captureBeyondViewport: false,
          });
          fs.writeFileSync(
            path.join(destination, `${preset}-${label}.png`),
            Buffer.from(shot.data, "base64"),
          );
        },
      );
    }
    await cdp.call("Emulation.setDeviceMetricsOverride", {
      width: 1280,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await check(`${preset}: theme control toggles`, async () => {
      const value = await cdp.evaluate(
        preset === "editorial"
          ? '(()=>{document.querySelector("[data-theme-set=dark]").click();return document.documentElement.dataset.theme})()'
          : '(()=>{const before=document.documentElement.dataset.theme;document.querySelector("#btn-theme").click();return before!==document.documentElement.dataset.theme})()',
      );
      assert.equal(value, preset === "editorial" ? "dark" : true);
    });
    if (preset !== "editorial") {
      await check(
        `${preset}: next/previous, keyboard, drawer, stable/legacy hash and print`,
        async () => {
          const stableAnchor = await cdp.evaluate(
            'JSON.parse(document.querySelector("#replay-data").textContent).steps[0].anchor',
          );
          await cdp.evaluate(
            `location.hash=${JSON.stringify("#step-")}+${JSON.stringify(stableAnchor)}`,
          );
          await wait(30);
          await cdp.evaluate(
            'document.querySelector("#btn-prev").click();document.querySelector("#btn-next").click()',
          );
          assert.equal(
            await cdp.evaluate("location.hash"),
            "#step-" + stableAnchor,
          );
          await cdp.call("Input.dispatchKeyEvent", {
            type: "keyDown",
            key: "ArrowLeft",
            code: "ArrowLeft",
            windowsVirtualKeyCode: 37,
          });
          await cdp.evaluate('document.querySelector("#btn-toc").click()');
          assert.ok(
            await cdp.evaluate(
              'document.querySelector("#toc").children.length>0',
            ),
          );
          await cdp.evaluate(
            'document.querySelector("#scrim").click();location.hash="#step-1"',
          );
          await wait(30);
          assert.ok(
            await cdp.evaluate(
              'document.querySelector("#stage").innerText.length>30',
            ),
          );
          const anchor = await cdp.evaluate(
            'JSON.parse(document.querySelector("#replay-data").textContent).steps[0].anchor',
          );
          await cdp.evaluate(
            `location.hash=${JSON.stringify("#step-")}+${JSON.stringify(anchor)}`,
          );
          await wait(30);
          assert.ok(
            await cdp.evaluate(
              'document.querySelector("#stage").innerText.length>30',
            ),
          );
          await cdp.evaluate(
            'window.print=()=>{window.__printCalled=true};document.querySelector("[data-act=print], [data-action=print]").click()',
          );
          assert.equal(await cdp.evaluate("window.__printCalled"), true);
          await cdp.call("Emulation.setEmulatedMedia", { media: "print" });
          assert.ok(
            await cdp.evaluate(
              'document.querySelector("#print-all").innerText.length>200',
            ),
          );
          const pdf = await cdp.call("Page.printToPDF", {
            printBackground: true,
          });
          fs.writeFileSync(
            path.join(destination, `${preset}.pdf`),
            Buffer.from(pdf.data, "base64"),
          );
          await cdp.call("Emulation.setEmulatedMedia", { media: "" });
        },
      );
      await check(
        `${preset}: Markdown export downloads a real file`,
        async () => {
          await cdp.evaluate(
            'document.querySelector("#btn-menu").click();document.querySelector("[data-act=md], [data-action=md]")?.click()',
          );
          for (
            let n = 0;
            n < 50 &&
            !fs.readdirSync(destination).some((name) => name.endsWith(".md"));
            n++
          )
            await wait(50);
          assert.ok(
            fs.readdirSync(destination).some((name) => name.endsWith(".md")),
          );
          for (const name of fs
            .readdirSync(destination)
            .filter((name) => name.endsWith(".md")))
            fs.renameSync(
              path.join(destination, name),
              path.join(destination, `${preset}-export.txt`),
            );
        },
      );
    }
  }
  // Immutable pre-upgrade template revision: never refresh this on a failed comparison.
  const baselineRevision = "2335a4f7bdee70834cb876770d7f8e7a6a85a313";
  for (const [preset, skill] of Object.entries(PRESETS)) {
    const template = execFileSync(
      "git",
      ["show", `${baselineRevision}:${skill}/references/template.html`],
      { cwd: ROOT, encoding: "utf8", maxBuffer: 4 * 1024 * 1024 },
    );
    const baseline = compileFile(
      path.join(ROOT, "scripts/xsu/fixtures", `${preset}.xsu`),
      { preset, template },
      preset === "editorial" ? adapters.editorial : adapters.replay,
    ).html;
    fs.writeFileSync(
      path.join(destination, `${preset}-baseline.html`),
      baseline,
    );
    for (const [viewport, width, height] of [
      ["desktop", 1280, 900],
      ["mobile", 390, 844],
    ])
      for (const theme of ["light", "dark"]) {
        await check(
          `${preset}: immutable old shell vs XSU ${viewport}/${theme} pixel comparison`,
          async () => {
            await cdp.call("Emulation.setDeviceMetricsOverride", {
              width,
              height,
              deviceScaleFactor: 1,
              mobile: width < 500,
            });
            const shots = [];
            for (const variant of ["baseline", "current"]) {
              const name =
                variant === "baseline"
                  ? `${preset}-baseline.html`
                  : `${preset}.html`;
              const anchor =
                preset === "editorial"
                  ? ""
                  : preset === "replay-self"
                    ? "#start"
                    : "#cover";
              await navigate(
                pathToFileURL(path.join(destination, name)).href + `?xsu-smoke-theme=${theme}` + anchor,
              );
              await cdp.evaluate(
                `document.documentElement.setAttribute("data-theme",${JSON.stringify(theme)});document.querySelectorAll("[data-theme-set]").forEach(button=>button.setAttribute("aria-pressed",String(button.dataset.themeSet===${JSON.stringify(theme)})));const style=document.createElement("style");style.textContent="*,*::before,*::after{animation:none!important;transition:none!important}";document.head.appendChild(style);window.scrollTo(0,0);document.fonts.ready`,
              );
              await cdp.evaluate("new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))");
              const shot = await cdp.call("Page.captureScreenshot", {
                format: "png",
                captureBeyondViewport: false,
              });
              const bytes = Buffer.from(shot.data, "base64");
              fs.writeFileSync(
                path.join(
                  destination,
                  `${preset}-${viewport}-${theme}-${variant}.png`,
                ),
                bytes,
              );
              shots.push(bytes);
            }
            assert.ok(
              shots[0].equals(shots[1]),
              "PNG bytes differ: inspect saved before/after; do not reset baseline automatically",
            );
          },
        );
      }
  }
  await cdp.call("Emulation.setDeviceMetricsOverride", {
    width: 1280,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  });
  const peleFile =
    process.env.XSU_PELE_PATH ||
    path.join(path.dirname(destination), "pele-1.6.0.js");
  if (fs.existsSync(peleFile)) {
    let failLibrary = false;
    const library = fs.readFileSync(peleFile).toString("base64");
    cdp.socket.addEventListener("message", (event) => {
      const message = JSON.parse(event.data);
      if (message.method !== "Fetch.requestPaused") return;
      const requestId = message.params.requestId;
      const response = failLibrary
        ? cdp.call("Fetch.failRequest", { requestId, errorReason: "Failed" })
        : cdp.call("Fetch.fulfillRequest", {
            requestId,
            responseCode: 200,
            responseHeaders: [
              { name: "Content-Type", value: "application/javascript" },
            ],
            body: library,
          });
      response.catch((error) =>
        results.push({
          name: "Pele response interception",
          status: "failed",
          message: error.message,
        }),
      );
    });
    await cdp.call("Fetch.enable", {
      patterns: [
        {
          urlPattern: "*cdn.jsdelivr.net/npm/pele@1.6.0/*",
          requestStage: "Request",
        },
      ],
    });
    for (const [preset, skill] of Object.entries(PRESETS)) {
      const template = fs.readFileSync(
        path.join(ROOT, skill, "references/template.html"),
        "utf8",
      );
      let source = fs.readFileSync(
        path.join(ROOT, "scripts/xsu/fixtures", `${preset}.xsu`),
        "utf8",
      );
      const diagram = "flowchart LR\n A[事实] --> B[核对]";
      source =
        preset === "editorial"
          ? source.replace(
              /\]\)\s*$/,
              `, Diagram({title:"Connected smoke",source:${JSON.stringify(diagram)}})])`,
            )
          : source.replace(
              "    Why(",
              `    Evidence({kind:"diagram",title:"Connected smoke",content:${JSON.stringify(diagram)}}),\n    Why(`,
            );
      const entry = path.join(destination, `${preset}-connected.xsu`);
      fs.writeFileSync(entry, source);
      const compiled = compileFile(
        entry,
        { preset, template },
        preset === "editorial" ? adapters.editorial : adapters.replay,
        { network: "connected" },
      );
      const page = path.join(destination, `${preset}-connected.html`);
      fs.writeFileSync(page, compiled.html);
      for (const mode of ["success", "failed-load"]) {
        failLibrary = mode !== "success";
        await cdp.call("Network.clearBrowserCache");
        await check(
          `${preset}: connected Pele ${mode} is visible`,
          async () => {
            await navigate(
              pathToFileURL(page).href +
                `?smoke=${mode}` +
                (preset === "editorial" ? "" : "#step-1"),
            );
            for (let attempt = 0; attempt < 100; attempt++) {
              if (
                await cdp.evaluate(
                  mode === "success"
                    ? 'Boolean(document.querySelector("pre.pele svg"))'
                    : 'Boolean(document.querySelector(".xsu-diagram-error, [data-pele-state=error]"))',
                )
              )
                break;
              await wait(50);
            }
            assert.ok(
              await cdp.evaluate(
                mode === "success"
                  ? 'Boolean(document.querySelector("pre.pele svg"))'
                  : 'Boolean(document.querySelector(".xsu-diagram-error, [data-pele-state=error]"))',
              ),
            );
            assert.deepEqual(
              cdp.events.filter(
                (event) => event.method === "Runtime.exceptionThrown",
              ),
              [],
            );
          },
        );
      }
    }
    const coverage = JSON.parse(
      fs.readFileSync(
        path.join(ROOT, "scripts/xsu/component-coverage.json"),
        "utf8",
      ),
    );
    const encode = (value) =>
      value &&
      typeof value === "object" &&
      typeof value.type === "string" &&
      Array.isArray(value.args)
        ? `${value.type}(${value.args.map(encode).join(",")})`
        : Array.isArray(value)
          ? `[${value.map(encode).join(",")}]`
          : value && typeof value === "object"
            ? `{${Object.entries(value)
                .map(([key, item]) => `${JSON.stringify(key)}:${encode(item)}`)
                .join(",")}}`
            : JSON.stringify(value);
    const oldTemplate = execFileSync(
      "git",
      [
        "show",
        `${baselineRevision}:${PRESETS.editorial}/references/template.html`,
      ],
      { cwd: ROOT, encoding: "utf8", maxBuffer: 4 * 1024 * 1024 },
    );
    const newTemplate = fs.readFileSync(
      path.join(ROOT, PRESETS.editorial, "references/template.html"),
      "utf8",
    );
    const casesDir = path.join(destination, "component-cases");
    fs.mkdirSync(casesDir, { recursive: true });
    fs.writeFileSync(
      path.join(casesDir, "fixture.png"),
      Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jZAAAAABJRU5ErkJggg==",
        "base64",
      ),
    );
    failLibrary = false;
    let caseIndex = 0;
    for (const entry of coverage.entries)
      for (const variant of entry.variants) {
        const id = `case-${++caseIndex}`;
        const sourceFile = path.join(casesDir, `${id}.xsu`);
        fs.writeFileSync(
          sourceFile,
          `Report({xsuVersion:1,id:"${id}",preset:"editorial",title:${JSON.stringify(entry.snippet + " / " + variant.name)},date:"2026-11-06"},[${encode(variant.node)}])`,
        );
        for (const [name, template] of [
          ["baseline", oldTemplate],
          ["current", newTemplate],
        ])
          fs.writeFileSync(
            path.join(casesDir, `${id}-${name}.html`),
            compileFile(
              sourceFile,
              { preset: "editorial", template },
              adapters.editorial,
              { network: "connected" },
            ).html,
          );
        for (const [viewport, width, height] of [
          ["desktop", 1280, 900],
          ["mobile", 390, 844],
        ])
          for (const theme of ["light", "dark"]) {
            await check(
              `fragment ${entry.snippet}/${variant.name}: ${viewport}/${theme} old-shell comparison`,
              async () => {
                await cdp.call("Emulation.setDeviceMetricsOverride", {
                  width,
                  height,
                  deviceScaleFactor: 1,
                  mobile: width < 500,
                });
                const shots = [];
                for (const name of ["baseline", "current"]) {
                  await navigate(
                    pathToFileURL(path.join(casesDir, `${id}-${name}.html`))
                      .href + `?xsu-smoke-theme=${theme}`,
                  );
                  await cdp.evaluate(
                    `document.documentElement.dataset.theme=${JSON.stringify(theme)};document.querySelectorAll("[data-theme-set]").forEach(button=>button.setAttribute("aria-pressed",String(button.dataset.themeSet===${JSON.stringify(theme)})));const style=document.createElement("style");style.textContent="*,*::before,*::after{animation:none!important;transition:none!important}";document.head.appendChild(style);document.fonts.ready`,
                  );
                  for (let retry = 0; retry < 80; retry++) {
                    if (
                      await cdp.evaluate(
                        '!document.querySelector("pre.pele") || Boolean(document.querySelector("pre.pele svg"))',
                      )
                    )
                      break;
                    await wait(50);
                  }
                  assert.ok(
                    await cdp.evaluate(
                      '!document.querySelector("pre.pele") || Boolean(document.querySelector("pre.pele svg"))',
                    ),
                    "Expected a real SVG for connected diagram",
                  );
                  assert.ok(
                    await cdp.evaluate(
                      "Array.from(document.images).every(image=>image.complete && image.naturalWidth>0)",
                    ),
                    "Image fixture must decode",
                  );
                  assert.deepEqual(
                    cdp.events.filter(
                      (event) => event.method === "Runtime.exceptionThrown",
                    ),
                    [],
                  );
                  await cdp.evaluate("new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))");
                  const bounds = await cdp.call("Page.getLayoutMetrics");
                  assert.ok(
                    bounds.cssContentSize.width <= width + 1,
                    "Fragment must not overflow viewport",
                  );
                  const shot = await cdp.call("Page.captureScreenshot", {
                    format: "png",
                    captureBeyondViewport: true,
                    clip: {
                      x: 0,
                      y: 0,
                      width: Math.ceil(bounds.cssContentSize.width),
                      height: Math.ceil(bounds.cssContentSize.height),
                      scale: 1,
                    },
                  });
                  const bytes = Buffer.from(shot.data, "base64");
                  fs.writeFileSync(
                    path.join(
                      casesDir,
                      `${id}-${viewport}-${theme}-${name}.png`,
                    ),
                    bytes,
                  );
                  shots.push(bytes);
                }
                assert.ok(
                  shots[0].equals(shots[1]),
                  "Inspect saved component screenshots; never reset baseline automatically",
                );
              },
            );
          }
      }
    fs.writeFileSync(
      path.join(destination, "component-cases.json"),
      JSON.stringify(
        coverage.entries.flatMap((entry) =>
          entry.variants.map((variant) => ({
            snippet: entry.snippet,
            variant: variant.name,
          })),
        ),
        null,
        2,
      ),
    );
    await cdp.call("Fetch.disable");
  } else
    results.push({
      name: "Connected Pele success and failure",
      status: "skipped",
      message: "Set XSU_PELE_PATH to a downloaded trusted Pele 1.6.0 bundle",
    });
  // A storage-denied file:// origin must retain navigation and theme controls.
  await cdp.call("Page.addScriptToEvaluateOnNewDocument", {
    source:
      'Object.defineProperty(window,"localStorage",{get(){throw new Error("storage denied by smoke test")}});',
  });
  await check(
    "Replay file mode remains usable when localStorage is denied",
    async () => {
      await navigate(
        pathToFileURL(path.join(destination, "replay-self.html")).href,
      );
      assert.deepEqual(
        cdp.events.filter((e) => e.method === "Runtime.exceptionThrown"),
        [],
      );
      await cdp.evaluate(
        'document.querySelector("#btn-next").click();document.querySelector("#btn-theme").click()',
      );
      assert.match(await cdp.evaluate("location.hash"), /#step-/);
    },
  );
} catch (error) {
  results.push({
    name: "Browser setup or runner",
    status: "failed",
    message: error.stack || String(error),
  });
} finally {
  cdp?.socket.close();
  if (server) await new Promise((resolve) => server.close(resolve));
  processChrome.kill("SIGTERM");
  await new Promise((resolve) => {
    if (
      chromeError ||
      processChrome.exitCode !== null ||
      processChrome.signalCode
    )
      resolve();
    else processChrome.once("exit", resolve);
  });
  fs.closeSync(log);
  fs.rmSync(profile, { recursive: true, force: true });
  fs.writeFileSync(
    path.join(destination, "tests.json"),
    JSON.stringify(results, null, 2),
  );
}
console.log(
  `Browser smoke: ${results.filter((r) => r.status === "passed").length}/${results.length} passed; ${destination}`,
);
process.exitCode = results.some((r) => r.status === "failed") ? 1 : 0;
