import "./load-env";
import { randomBytes } from "node:crypto";
import { spawn, spawnSync } from "node:child_process";

// Temporary credentials are confined to this loopback-only test process.
if (!process.env.ADMIN_USERNAME) process.env.ADMIN_USERNAME = "integration-admin";
if (!process.env.ADMIN_PASSWORD) process.env.ADMIN_PASSWORD = randomBytes(32).toString("hex");
if (!process.env.ADMIN_SESSION_SECRET) process.env.ADMIN_SESSION_SECRET = randomBytes(48).toString("hex");
process.env.WORKFLOW_APP_URL = "http://127.0.0.1:3031";
const server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "dev", "--hostname", "127.0.0.1", "--port", "3031"], { env: process.env, stdio: "ignore", windowsHide: true });

async function main() {
  let ready = false;
  for (let attempt = 0; attempt < 60; attempt++) {
    if (server.exitCode !== null) throw new Error("El servidor temporal no pudo iniciar.");
    try { const response = await fetch(`${process.env.WORKFLOW_APP_URL}/admin/login`, { signal: AbortSignal.timeout(1000) }); ready = response.ok; } catch {}
    if (ready) break;
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  if (!ready) throw new Error("El servidor temporal no respondió.");
  console.log("Admin: prueba con credenciales en memoria; ningún cambio en .env.");
  const test = spawn(process.execPath, ["--conditions=react-server", "--import", "tsx", "scripts/check-admin-gallery.ts"], { env: process.env, stdio: "inherit", windowsHide: true });
  process.exitCode = await new Promise<number>((resolve) => { test.on("error", () => resolve(1)); test.on("exit", (code) => resolve(code ?? 1)); });
}
main().catch(() => { console.error("No se pudo ejecutar la prueba admin local."); process.exitCode = 1; }).finally(() => {
  if (server.pid && server.exitCode === null) {
    if (process.platform === "win32") spawnSync("taskkill", ["/PID", String(server.pid), "/T", "/F"], { stdio: "ignore", windowsHide: true });
    else server.kill("SIGTERM");
  }
});
