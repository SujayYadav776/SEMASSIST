import { spawn } from "node:child_process";
import { createServer } from "node:net";
import assert from "node:assert/strict";
const probe = createServer();
await new Promise(resolve => probe.listen(0, "127.0.0.1", resolve));
const port = probe.address().port;
await new Promise(resolve => probe.close(resolve));
const server = spawn(process.execPath, ["dist/index.js"], { env: { ...process.env, NODE_ENV: "production", PORT: String(port) }, stdio: ["ignore", "pipe", "pipe"] });
let output = "";
try {
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Host did not start: ${output}`)), 15000);
    server.stdout.on("data", chunk => { output += chunk; if (output.includes("Server running")) { clearTimeout(timer); resolve(); } });
    server.stderr.on("data", chunk => { output += chunk; });
    server.once("error", error => { clearTimeout(timer); reject(error); });
    server.once("exit", code => { clearTimeout(timer); reject(new Error(`Host exited ${code}: ${output}`)); });
  });
  for (const path of ["/", "/study-dashboard.html", "/roadmaps.html", "/roadmaps"]) {
    const response = await fetch(`http://127.0.0.1:${port}${path}`);
    assert.equal(response.status, 200, path);
    assert.equal(response.headers.get("x-frame-options"), "SAMEORIGIN");
    assert.match(response.headers.get("content-security-policy"), /frame-ancestors 'self'/);
    assert.equal(response.headers.get("x-content-type-options"), "nosniff");
    assert.match(await response.text(), /<!doctype html/i);
  }
  assert.equal((await fetch(`http://127.0.0.1:${port}/missing-page`)).status, 404);
  console.log("Production routes, same-origin embedding, security headers, and real 404 verified.");
} finally { server.kill(); }
